import React, { useState, useRef, useEffect } from 'react';
import { DragonProblem } from '../types';
import { ChatMessageItem } from '../firebase/useFirebaseData';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

interface GeminiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDragon: DragonProblem | null;
  dragons: DragonProblem[];
  chatMessages: ChatMessageItem[];
  onSendMessage: (msg: { role: 'user' | 'model'; content: string; dragonId?: string; modelUsed?: string }) => Promise<void>;
  onClearChat: () => Promise<void>;
  userEmail?: string | null;
}

type ModelType = 'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-4-argon';
type ChatRole = 'counsel' | 'confront_dragon';

export const GeminiChatDrawer: React.FC<GeminiChatDrawerProps> = ({
  isOpen,
  onClose,
  selectedDragon,
  dragons,
  chatMessages,
  onSendMessage,
  onClearChat,
  userEmail,
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>('gemini-3.8-flash');
  const [chatRole, setChatRole] = useState<ChatRole>('counsel');
  const [activeDragonId, setActiveDragonId] = useState<string>(selectedDragon?.id || dragons[0]?.id || '');
  const [apiError, setApiError] = useState<string | null>(null);
  const [clearError, setClearError] = useState<string | null>(null);
  const [lastSentText, setLastSentText] = useState<string>('');

  const isSendingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeDragon = dragons.find((d) => d.id === activeDragonId) || dragons[0];

  // Isolate conversation messages strictly to the currently active dragon
  const dragonChatMessages = chatMessages.filter(
    (m) => !m.dragonId || m.dragonId === activeDragon.id
  );

  useEffect(() => {
    if (selectedDragon) {
      setActiveDragonId(selectedDragon.id);
    }
  }, [selectedDragon]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [dragonChatMessages, isOpen, isLoading, apiError]);

  if (!isOpen) return null;

  // Build the system instruction according to the role and selected dragon
  const getSystemInstruction = () => {
    if (chatRole === 'confront_dragon') {
      return `You are '${activeDragon.name}' (${activeDragon.subtitle}), a psychological dragon representing: ${activeDragon.category}.
Your temperament is ${activeDragon.temperament}.
Your deceptive whisper: "${activeDragon.voice}"
Your root cause: ${activeDragon.roots}
Somatic feeling: ${activeDragon.somaticFeeling}

In this multi-turn dialogue, the user (the lone sentry holding the sword) is standing before you in the void to directly dialogue with and confront you.
Respond in character as this monumental dragon: articulate, haunting, revealing the subtle logic of how this fear or resistance works.
However, you are NOT invincible—if the user reasons clearly, questions your premises, or proposes small honest actions, you must acknowledge their clarity and let your terrifying hold recede. Keep responses focused, literary, and under 150 words.`;
    } else {
      return `You are The Sentry's Counsel in the surreal void of Draco Animi. You are a serious, compassionate, stoic psychological guide.
The user is facing internal dragons that represent their personal problems:
- The Inertia Leviathan (Procrastination & Avoidance)
- The Cacophony (Chronic Overthinking & Anxiety)
- The Tyrant of Perfection (Unforgiving Standards & Fear of Exposure)

The user is currently considering: '${activeDragon.name}'.
Your goal is to help them dismantle this dragon through:
1. Clarifying what real fear or fatigue lies behind the dragon's presence.
2. Formulating tiny, non-threatening micro-actions that break paralysis.
3. Cultivating quiet courage rather than violent self-hatred.
Do not use fantasy RPG clichés (no hit points, no mana). Speak with existential depth, gentle rigor, and clarity. Keep answers under 150 words.`;
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSendingRef.current || isLoading || !input.trim()) return;

    const userText = input.trim();
    isSendingRef.current = true;
    setIsLoading(true);
    setApiError(null);
    setLastSentText(userText);
    setInput('');

    // Save user message to persistent storage
    await onSendMessage({
      role: 'user',
      content: userText,
      dragonId: activeDragon.id,
      modelUsed: selectedModel,
    });

    try {
      // Build conversation history strictly for this dragon
      const history = dragonChatMessages
        .filter(
          (m) =>
            (m.role === 'user' || m.role === 'model') &&
            typeof m.content === 'string' &&
            m.content.trim() !== '' &&
            !m.content.startsWith('[The transmission was interrupted:')
        )
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));
      history.push({ role: 'user', content: userText });

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          systemInstruction: getSystemInstruction(),
          model: selectedModel,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with HTTP ${res.status}`);
      }

      const data = await res.json();
      // On success, save model reply
      await onSendMessage({
        role: 'model',
        content: data.reply || 'The void remains still.',
        dragonId: activeDragon.id,
        modelUsed: data.modelUsed || selectedModel,
      });
    } catch (err: unknown) {
      console.error('Chat error:', err);
      const errMsg = err instanceof Error ? err.message : 'Error reaching Gemini service';
      // Set ephemeral error banner rather than polluting database with fake model messages
      setApiError(errMsg);
    } finally {
      isSendingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    setClearError(null);
    try {
      await onClearChat();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cloud deletion failed';
      setClearError(`Could not clear history from cloud: ${msg}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-auto animate-in fade-in duration-200">
      {/* Dark backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-xl h-full bg-[#0a0c12] border-l border-white/10 text-slate-200 shadow-2xl flex flex-col z-50 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-[#07090e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-amber-200">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-mono tracking-wider uppercase text-slate-400">
                <span>Gemini Multi-Turn Oracle</span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-200/90">{selectedModel}</span>
              </div>
              <h2 className="text-sm font-bold font-['Cinzel'] tracking-wider text-white">
                THE SENTRY'S COUNSEL
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {dragonChatMessages.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors cursor-pointer"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Clear error alert */}
        {clearError && (
          <div className="px-6 py-2 bg-red-950/60 border-b border-red-500/20 text-xs text-red-300 flex items-center justify-between">
            <span>{clearError}</span>
            <button onClick={() => setClearError(null)} className="text-red-400 hover:text-red-200">
              Dismiss
            </button>
          </div>
        )}

        {/* Mode & Model Configuration Bar */}
        <div className="px-6 py-2.5 bg-[#090b10] border-b border-white/5 space-y-2 text-xs">
          {/* Role selector */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
              Role:
            </span>
            <div className="flex items-center gap-1 bg-white/[0.03] p-0.5 rounded-lg border border-white/5">
              <button
                onClick={() => setChatRole('counsel')}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                  chatRole === 'counsel'
                    ? 'bg-white/15 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sentry's Counsel
              </button>
              <button
                onClick={() => setChatRole('confront_dragon')}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                  chatRole === 'confront_dragon'
                    ? 'bg-white/15 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Dialogue With Dragon
              </button>
            </div>
          </div>

          {/* Model selection & target dragon */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="font-mono uppercase text-[10px]">Subject:</span>
              <select
                value={activeDragonId}
                onChange={(e) => setActiveDragonId(e.target.value)}
                className="bg-black/40 border border-white/10 rounded px-2 py-0.5 text-slate-200 text-xs focus:outline-none cursor-pointer"
              >
                {dragons.map((d) => (
                  <option key={d.id} value={d.id} className="bg-[#0b0d14] text-slate-200">
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-mono uppercase text-[10px] text-slate-400">Model:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as ModelType)}
                className="bg-black/40 border border-white/10 rounded px-2 py-0.5 text-slate-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="gemini-3.8-flash" className="bg-[#0b0d14]">
                  gemini-3.8-flash (General)
                </option>
                <option value="gemini-3.1-flash-lite" className="bg-[#0b0d14]">
                  gemini-3.1-flash-lite (Fast)
                </option>
                <option value="gemini-4-argon" className="bg-[#0b0d14]">
                  gemini-4-argon (Deep Reasoning)
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable Message Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {dragonChatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-400">
              <div className="p-3 rounded-full bg-white/[0.03] border border-white/5">
                <Bot className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-sm font-['Cinzel'] tracking-wider text-slate-200">
                {chatRole === 'counsel' ? "The Sentry's Silent Vigil" : `Before ${activeDragon.name}`}
              </h3>
              <p className="text-xs max-w-sm leading-relaxed text-slate-400">
                {chatRole === 'counsel'
                  ? `Ask for guidance on dealing with ${activeDragon.name}. What small act feels impossible today?`
                  : `Address ${activeDragon.name} directly. Ask why it hovers over you and what it demands.`}
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => {
                    setInput(
                      chatRole === 'counsel'
                        ? `How do I take the first step when ${activeDragon.name} makes me feel paralyzed?`
                        : `Why are you hovering so close to me today? What are you afraid I will do?`
                    );
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  "How do I take the first step?"
                </button>
              </div>
            </div>
          ) : (
            dragonChatMessages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-amber-200/90 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-tr-sm'
                        : 'bg-white/[0.03] text-slate-200 border border-white/10 rounded-tl-sm'
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center gap-2 mb-1.5 text-[10px] font-mono text-slate-400 border-b border-white/5 pb-1">
                        <span>{chatRole === 'confront_dragon' ? activeDragon.name : "Sentry's Counsel"}</span>
                        <span>·</span>
                        <span>{msg.modelUsed || selectedModel}</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex gap-3 items-center text-slate-400 text-xs">
              <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-amber-200/80">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <span className="italic text-slate-400">
                Listening to the void ({selectedModel})...
              </span>
            </div>
          )}

          {apiError && (
            <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-xs text-red-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{apiError}</span>
              </div>
              {lastSentText && (
                <button
                  onClick={() => {
                    setInput(lastSentText);
                    setApiError(null);
                  }}
                  className="flex items-center gap-1 text-amber-200 hover:text-amber-100 font-medium underline shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 bg-[#07090e] border-t border-white/10">
          <div className="relative flex items-center">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                chatRole === 'counsel'
                  ? 'Ask the Sentry for counsel...'
                  : `Speak to ${activeDragon.name}...`
              }
              rows={2}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-3 pr-12 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white/30 transition-colors resize-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 text-white transition-colors cursor-pointer"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-2 px-1">
            <span>Press Enter to send, Shift+Enter for new line</span>
            {userEmail ? (
              <span className="text-slate-400">Synced to Firestore: {userEmail}</span>
            ) : (
              <span>Guest mode · Sign in to persist</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
