import { Proposal } from '../../server/counsel';

export interface CounselMessageItem {
  role: 'user' | 'model';
  content: string;
}

export type CounselApiResult =
  | { ok: true; reply: string; crisis: boolean; proposal: Proposal | null }
  | { ok: false; error: string };

/**
 * Sends conversation messages to the Counsel AI endpoint with a 30-second timeout.
 * Never throws; always returns a typed result object.
 */
export async function sendCounselMessage(
  messages: CounselMessageItem[]
): Promise<CounselApiResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch('/api/counsel/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorMsg = `Server error (${res.status})`;
      try {
        const errJson = await res.json();
        if (errJson && typeof errJson.error === 'string') {
          errorMsg = errJson.error;
        }
      } catch {
        if (res.status === 429) {
          errorMsg = 'Too many requests. Please wait a minute before sending another message.';
        } else if (res.status === 503) {
          errorMsg = 'Counsel service is currently unavailable. Please verify API key configuration.';
        }
      }
      return { ok: false, error: errorMsg };
    }

    const data = await res.json();
    return {
      ok: true,
      reply: typeof data.reply === 'string' ? data.reply : 'I am listening.',
      crisis: Boolean(data.crisis),
      proposal: data.proposal || null,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if (err instanceof DOMException && err.name === 'AbortError') {
      return {
        ok: false,
        error: 'Counsel response timed out after 30 seconds. Please try again.',
      };
    }

    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      return {
        ok: false,
        error: 'Network connection issue. Please check your internet connection.',
      };
    }

    return {
      ok: false,
      error: 'Unable to communicate with the Sentry at this time. Please try again.',
    };
  }
}
