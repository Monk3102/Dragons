import { Express, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { ARCHETYPE_CATALOGUE } from '../src/data/archetypesCatalogue';
import { Dial } from '../src/types';

export interface CounselMessageInput {
  role: 'user' | 'model';
  content: string;
}

export interface DialReasons {
  size: string;
  distance: string;
  ferocity: string;
}

export interface Proposal {
  creatureTypeId: string;
  name: string;
  problem: string;
  size: Dial;
  distance: Dial;
  ferocity: Dial;
  reasoning: string;
  dialReasons: DialReasons;
}

export interface CounselResponseParsed {
  reply: string;
  crisis: boolean;
  proposal: Proposal | null;
}

export type ValidateCounselResult =
  | { ok: true; messages: CounselMessageInput[] }
  | { ok: false; error: string };

const ARCHETYPE_SET = new Set(ARCHETYPE_CATALOGUE.map((a) => a.id));

// In-memory rate limiter: max 20 requests per minute per IP
const ipRateLimitMap = new Map<string, number[]>();

export function checkCounselRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60000;
  const maxReqs = 20;

  const timestamps = ipRateLimitMap.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < windowMs);

  if (recent.length >= maxReqs) {
    return false;
  }

  recent.push(now);
  ipRateLimitMap.set(ip, recent);
  return true;
}

/**
 * Validates counsel chat request body:
 * - messages: 1 to 30 items
 * - role: 'user' | 'model'
 * - content: non-empty trimmed string, cut to 4000 chars
 * - total content length <= 40000 chars
 * - last message must be from 'user'
 */
export function validateCounselRequest(body: unknown): ValidateCounselResult {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }

  const rawMessages = (body as Record<string, unknown>).messages;
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return { ok: false, error: 'Messages must be a non-empty array.' };
  }

  if (rawMessages.length > 30) {
    return { ok: false, error: 'Maximum 30 messages allowed in conversation history.' };
  }

  const validated: CounselMessageInput[] = [];
  let totalLength = 0;

  for (let i = 0; i < rawMessages.length; i++) {
    const m = rawMessages[i];
    if (!m || typeof m !== 'object') {
      return { ok: false, error: `Message at index ${i} is not a valid object.` };
    }

    const { role, content } = m as Record<string, unknown>;
    if (role !== 'user' && role !== 'model') {
      return { ok: false, error: `Invalid role "${String(role)}" at index ${i}. Must be 'user' or 'model'.` };
    }

    if (typeof content !== 'string') {
      return { ok: false, error: `Message content at index ${i} must be a string.` };
    }

    const trimmed = content.trim();
    if (trimmed.length === 0) {
      return { ok: false, error: `Message content at index ${i} cannot be empty.` };
    }

    const clipped = trimmed.slice(0, 4000);
    totalLength += clipped.length;
    validated.push({ role, content: clipped });
  }

  if (totalLength > 40000) {
    return { ok: false, error: 'Total message content exceeds maximum payload threshold of 40,000 characters.' };
  }

  if (validated[validated.length - 1].role !== 'user') {
    return { ok: false, error: 'The last message in the conversation must have role "user".' };
  }

  return { ok: true, messages: validated };
}

/**
 * Builds the fixed system prompt for Counsel on the server.
 * Includes the full catalogue of 42 mythological archetypes.
 */
export function buildCounselSystemPrompt(): string {
  const catalogueList = ARCHETYPE_CATALOGUE.map(
    (c) => `- id: "${c.id}" | Name: "${c.name}" | Meaning: "${c.workingMeaning}"`
  ).join('\n');

  return `You are The Sentry in Draco Animi, a calm, warm listener and namer of internal struggles.
You help the user understand a personal problem by asking one gentle question at a time. Keep your replies under 90 words.

CRITICAL BOUNDARIES & INSTRUCTIONS:
1. Do NOT give advice, solutions, action plans or exercises.
2. Do NOT diagnose, and make NO medical or psychological claims. You only listen, reflect, and name the creature.
3. Keep replies under 90 words.
4. When the user has described their problem enough, propose one creature archetype from the catalogue list below. Propose ONLY creature ids from this list. If nothing fits well, choose the closest one and explain your reasoning.
5. Suggest starting dial values (integers 1 to 10):
   - size: how much impact the problem has on the user's life (1 = tiny, 10 = huge)
   - distance: how near the problem feels (1 = very near, 10 = very far, based on gut feeling)
   - ferocity: how bad the consequences become if ignored (1 = mild, 10 = severe)
   These are starting suggestions. The user decides. Provide a brief 1-line reason for each dial.
6. CRISIS PROTOCOL: If the user describes wanting to harm themselves or end their life, or any immediate danger:
   - set "crisis" to true
   - reply with brief warm care
   - encourage them to reach someone they trust or contact a local emergency or crisis service right now
   - set "proposal" to null (propose NO monster)

RESPONSE FORMAT:
You MUST respond with valid JSON matching this structure:
{
  "reply": "Your gentle reflection and single question (under 90 words)",
  "crisis": false,
  "proposal": null OR {
    "creatureTypeId": "archetype-...",
    "name": "Evocative Name (e.g. The Avoidance Wyrm)",
    "problem": "Clear summary of the problem this represents",
    "size": 7,
    "distance": 3,
    "ferocity": 6,
    "reasoning": "Why this archetype mirrors the user's situation",
    "dialReasons": {
      "size": "Reason for size score",
      "distance": "Reason for distance score",
      "ferocity": "Reason for ferocity score"
    }
  }
}

CANONICAL ARCHETYPE CATALOGUE (42 CREATURES):
${catalogueList}`;
}

/**
 * Safely parses and validates the Gemini counsel model output.
 */
export function parseCounselResponse(
  rawText: string,
  userMessageCount: number
): CounselResponseParsed {
  const fallbackReply = 'I lost the thread for a moment. Could you say that again?';

  let parsed: any;
  try {
    // Strip markdown code fences if model wrapped response in ```json ... ```
    let cleanJson = rawText.trim();
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }
    parsed = JSON.parse(cleanJson);
  } catch {
    return {
      reply: fallbackReply,
      crisis: false,
      proposal: null,
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      reply: fallbackReply,
      crisis: false,
      proposal: null,
    };
  }

  const reply =
    typeof parsed.reply === 'string' && parsed.reply.trim() !== ''
      ? parsed.reply.trim()
      : fallbackReply;

  const crisis = Boolean(parsed.crisis);

  // Proposal must be dropped if:
  // - crisis is true
  // - userMessageCount < 2
  // - proposal is not an object
  if (crisis || userMessageCount < 2 || !parsed.proposal || typeof parsed.proposal !== 'object') {
    return {
      reply,
      crisis,
      proposal: null,
    };
  }

  const p = parsed.proposal;
  const creatureTypeId = typeof p.creatureTypeId === 'string' ? p.creatureTypeId.trim() : '';

  // Drop proposal if creatureTypeId is not in canonical catalogue
  if (!ARCHETYPE_SET.has(creatureTypeId)) {
    return {
      reply,
      crisis,
      proposal: null,
    };
  }

  const rawName = typeof p.name === 'string' ? p.name.trim() : '';
  const rawProblem = typeof p.problem === 'string' ? p.problem.trim() : '';

  // Drop if name or problem is empty
  if (rawName.length === 0 || rawProblem.length === 0) {
    return {
      reply,
      crisis,
      proposal: null,
    };
  }

  // Sanitize dial values: round to integer and clamp to 1..10
  const clampDial = (val: unknown): Dial => {
    const num = Number(val);
    if (isNaN(num)) return 5;
    return Math.min(10, Math.max(1, Math.round(num))) as Dial;
  };

  const size = clampDial(p.size);
  const distance = clampDial(p.distance);
  const ferocity = clampDial(p.ferocity);

  const name = rawName.slice(0, 80);
  const problem = rawProblem.slice(0, 300);
  const reasoning = typeof p.reasoning === 'string' ? p.reasoning.trim().slice(0, 200) : '';

  const rawDialReasons = p.dialReasons && typeof p.dialReasons === 'object' ? p.dialReasons : {};
  const dialReasons: DialReasons = {
    size: typeof rawDialReasons.size === 'string' ? rawDialReasons.size.trim().slice(0, 200) : '',
    distance: typeof rawDialReasons.distance === 'string' ? rawDialReasons.distance.trim().slice(0, 200) : '',
    ferocity: typeof rawDialReasons.ferocity === 'string' ? rawDialReasons.ferocity.trim().slice(0, 200) : '',
  };

  return {
    reply,
    crisis,
    proposal: {
      creatureTypeId,
      name,
      problem,
      size,
      distance,
      ferocity,
      reasoning,
      dialReasons,
    },
  };
}

/**
 * Registers POST /api/counsel/chat onto the Express app.
 */
export function registerCounselRoutes(app: Express, ai: GoogleGenAI) {
  app.post('/api/counsel/chat', async (req: Request, res: Response) => {
    try {
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
      if (!checkCounselRateLimit(clientIp)) {
        return res.status(429).json({ error: 'Rate limit exceeded: maximum 20 requests per minute.' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
        return res.status(503).json({
          error: 'GEMINI_API_KEY is not configured on the server. Please configure your key in Settings > Secrets.',
        });
      }

      const validation = validateCounselRequest(req.body);
      if (!validation.ok) {
        return res.status(400).json({ error: validation.error });
      }

      const messages = validation.messages;
      const userMessageCount = messages.filter((m) => m.role === 'user').length;

      // Transform messages for Gemini contents format
      const contents = messages.map((m) => ({
        role: m.role === 'user' ? ('user' as const) : ('model' as const),
        parts: [{ text: m.content }],
      }));

      const modelName = process.env.GEMINI_MODEL || 'gemini-flash-latest';
      const systemInstruction = buildCounselSystemPrompt();

      // Schema for structured JSON generation
      const responseSchema = {
        type: 'object',
        properties: {
          reply: { type: 'string' },
          crisis: { type: 'boolean' },
          proposal: {
            type: 'object',
            nullable: true,
            properties: {
              creatureTypeId: { type: 'string' },
              name: { type: 'string' },
              problem: { type: 'string' },
              size: { type: 'integer' },
              distance: { type: 'integer' },
              ferocity: { type: 'integer' },
              reasoning: { type: 'string' },
              dialReasons: {
                type: 'object',
                properties: {
                  size: { type: 'string' },
                  distance: { type: 'string' },
                  ferocity: { type: 'string' },
                },
              },
            },
          },
        },
        required: ['reply', 'crisis'],
      };

      // Query Gemini with 1 retry on 429 or 503
      let rawResponseText = '';
      let lastErr: unknown = null;

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          let response;
          try {
            response = await ai.models.generateContent({
              model: modelName,
              contents,
              config: {
                systemInstruction,
                temperature: 0.7,
                responseMimeType: 'application/json',
                responseSchema,
              },
            });
          } catch (schemaErr: any) {
            // If the SDK or model rejects responseSchema, fall back to responseMimeType only
            response = await ai.models.generateContent({
              model: modelName,
              contents,
              config: {
                systemInstruction,
                temperature: 0.7,
                responseMimeType: 'application/json',
              },
            });
          }

          rawResponseText = response.text || '';
          lastErr = null;
          break;
        } catch (err: unknown) {
          lastErr = err;
          const msg = err instanceof Error ? err.message : String(err);
          const isTransient =
            msg.includes('503') || msg.includes('429') || msg.includes('UNAVAILABLE') || msg.includes('high demand');
          if (!isTransient || attempt === 1) {
            break;
          }
          // Brief pause before retry
          await new Promise((r) => setTimeout(r, 800));
        }
      }

      if (lastErr && !rawResponseText) {
        throw lastErr;
      }

      const parsedResult = parseCounselResponse(rawResponseText, userMessageCount);
      return res.json(parsedResult);
    } catch (error: unknown) {
      console.error('[Counsel Route] Error:', error);
      const rawMsg = error instanceof Error ? error.message : '';
      let clientMsg = 'Unable to receive counsel at this moment. Please try again.';

      if (rawMsg.includes('API key not valid') || rawMsg.includes('API_KEY_INVALID')) {
        clientMsg = 'The configured GEMINI_API_KEY was rejected by Google AI services.';
      } else if (rawMsg.includes('Quota exceeded') || rawMsg.includes('RESOURCE_EXHAUSTED')) {
        clientMsg = 'Gemini API quota exceeded for the current period. Please wait a moment.';
      } else if (rawMsg.includes('high demand') || rawMsg.includes('UNAVAILABLE') || rawMsg.includes('503')) {
        clientMsg = 'The AI service is experiencing high global traffic. Please retry in a few moments.';
      }

      return res.status(500).json({ error: clientMsg });
    }
  });
}
