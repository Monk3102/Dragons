import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Enforce request body size limit to prevent Denial-of-Service
app.use(express.json({ limit: '256kb' }));

// Allowed and verified Gemini API model aliases
const ALLOWED_MODELS = new Set(['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-4-argon']);

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

    const { messages, systemInstruction, model = 'gemini-3.8-flash' } = req.body;

    // 1. Validate messages array structure & bounds
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Invalid payload: messages must be a non-empty array.' });
    }

    if (messages.length > 40) {
      return res.status(400).json({ error: 'Conversation history exceeds maximum limit of 40 messages.' });
    }

    // 2. Validate selected model
    const selectedModel = ALLOWED_MODELS.has(model) ? model : 'gemini-3.8-flash';

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

    // 5. Query Gemini API
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: sanitizedContents,
      config: {
        systemInstruction: cleanSystemInstruction,
        temperature: 0.7,
      },
    });

    const replyText = response.text || '...';
    res.json({ reply: replyText, modelUsed: selectedModel });
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
    }

    res.status(500).json({ error: clientMessage });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
