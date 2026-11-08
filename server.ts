import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// AI Studio requirement: Dev server must run on port 3000 on 0.0.0.0.
// In Cloud Run containers, process.env.PORT is 8080 (already bound by supervisor),
// so defaulting or pinning to 3000 prevents EADDRINUSE errors.
function resolvePort(): number {
  const portArgIdx = process.argv.indexOf('--port');
  if (portArgIdx !== -1 && process.argv[portArgIdx + 1]) {
    const parsed = parseInt(process.argv[portArgIdx + 1], 10);
    if (!isNaN(parsed)) return parsed;
  }
  return 3000;
}

const PORT = resolvePort();

// Enforce request body size limit to prevent Denial-of-Service
app.use(express.json({ limit: '256kb' }));

// Allowed and verified Gemini API model aliases
const ALLOWED_MODELS = new Set([
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.8-flash',
  'gemini-4-argon',
]);

// Initialize Google Gen AI client with required User-Agent
const apiKey = process.env.GEMINI_API_KEY;
const isApiKeyConfigured = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim() !== '');

const ai = new GoogleGenAI({
  apiKey: isApiKeyConfigured ? apiKey : 'unconfigured_placeholder',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Multi-turn Gemini Chat Endpoint
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const currentApiKey = process.env.GEMINI_API_KEY;
    if (!currentApiKey || currentApiKey === 'MY_GEMINI_API_KEY' || currentApiKey.trim() === '') {
      return res.status(503).json({
        error:
          'GEMINI_API_KEY is not configured on the server. Please configure your key in Settings > Secrets.',
      });
    }

    const { messages, systemInstruction, model = 'gemini-3.1-flash-lite' } = req.body;

    // 1. Validate messages array structure & bounds
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Invalid payload: messages must be a non-empty array.' });
    }

    if (messages.length > 40) {
      return res.status(400).json({ error: 'Conversation history exceeds maximum limit of 40 messages.' });
    }

    // 2. Validate selected model
    const requestedModel = ALLOWED_MODELS.has(model) ? model : 'gemini-3.1-flash-lite';

    // 3. Validate and sanitize individual messages
    let totalLength = 0;
    const sanitizedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    for (const msg of messages) {
      if (!msg || typeof msg !== 'object') continue;
      const role = msg.role === 'user' ? 'user' : msg.role === 'model' ? 'model' : null;
      if (!role) continue; // Skip invalid roles (e.g. 'system' inside contents)

      if (typeof msg.content !== 'string' || msg.content.trim() === '') continue;

      // Limit per-message length
      const cleanContent = msg.content.trim().slice(0, 10000);
      totalLength += cleanContent.length;

      sanitizedContents.push({
        role,
        parts: [{ text: cleanContent }],
      });
    }

    if (sanitizedContents.length === 0) {
      return res.status(400).json({ error: 'No valid message content provided.' });
    }

    if (totalLength > 60000) {
      return res.status(400).json({ error: 'Total message content exceeds maximum payload threshold.' });
    }

    // 4. Validate system instruction (must be string <= 4000 chars)
    let cleanSystemInstruction =
      'You are The Sentry in Draco Animi, a thoughtful, serious, and compassionate philosophical counselor who helps the user face their internal dragons (paralyzing problems like procrastination, anxiety, and unrelenting perfectionism). You ask piercing, gentle questions to dissolve illusions and invite real, small actions.';

    if (typeof systemInstruction === 'string' && systemInstruction.trim() !== '') {
      cleanSystemInstruction = systemInstruction.trim().slice(0, 4000);
    }

    // 5. Query Gemini API with automated fallback on high demand spikes (503 / 429)
    const fallbackChain = [requestedModel];
    if (!fallbackChain.includes('gemini-3.1-flash-lite')) fallbackChain.push('gemini-3.1-flash-lite');
    if (!fallbackChain.includes('gemini-flash-latest')) fallbackChain.push('gemini-flash-latest');
    if (!fallbackChain.includes('gemini-3.8-flash')) fallbackChain.push('gemini-3.8-flash');

    let replyText = '';
    let usedModel = requestedModel;
    let lastError: unknown = null;

    for (const tryModel of fallbackChain) {
      try {
        const response = await ai.models.generateContent({
          model: tryModel,
          contents: sanitizedContents,
          config: {
            systemInstruction: cleanSystemInstruction,
            temperature: 0.7,
          },
        });

        replyText = response.text || '...';
        usedModel = tryModel;
        lastError = null;
        break;
      } catch (err: unknown) {
        lastError = err;
        console.warn(`[Gemini API] Model ${tryModel} failed, trying fallback:`, err instanceof Error ? err.message : err);
        const errMsg = err instanceof Error ? err.message : '';
        const isTransient = errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('429') || errMsg.includes('UNAVAILABLE');
        if (!isTransient) {
          break;
        }
      }
    }

    if (lastError && !replyText) {
      throw lastError;
    }

    res.json({ reply: replyText, modelUsed: usedModel });
  } catch (error: unknown) {
    // Log complete error internally on the server (without leaking to client)
    console.error('Gemini Internal Error:', error);

    // Return sanitized message without exposing filesystem paths, headers, or keys
    const rawMsg = error instanceof Error ? error.message : '';
    let clientMessage = 'Unable to generate counsel from the model at this time. Please try again.';

    if (rawMsg.includes('API key not valid') || rawMsg.includes('API_KEY_INVALID')) {
      clientMessage = 'The configured GEMINI_API_KEY was rejected by Google AI services.';
    } else if (rawMsg.includes('Quota exceeded') || rawMsg.includes('RESOURCE_EXHAUSTED')) {
      clientMessage = 'Gemini API quota exceeded for the current period. Please wait a moment.';
    } else if (rawMsg.includes('high demand') || rawMsg.includes('UNAVAILABLE')) {
      clientMessage = 'The AI service is experiencing high global traffic. Please retry in a few moments.';
    }

    res.status(500).json({ error: clientMessage });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const httpServer = http.createServer(app);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });

  httpServer.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Server] Port ${PORT} already in use.`);
    } else {
      console.error('[Server] Listener error:', err);
    }
  });
}

startServer();
