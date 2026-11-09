import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, AlertCircle, HeartHandshake } from 'lucide-react';
import { CounselMessageItem, sendCounselMessage } from '../../utils/counselApi';
import { Proposal } from '../../../server/counsel';
import { SUPPORT_NOTE } from '../../config/support';

interface CounselChatProps {
  onProposalReceived: (proposal: Proposal) => void;
  onHasUnsentTextChange: (hasText: boolean) => void;
}

export const CounselChat: React.FC<CounselChatProps> = ({
  onProposalReceived,
  onHasUnsentTextChange,
}) => {
  const [messages, setMessages] = useState<Array<CounselMessageItem & { id: string; isCrisis?: boolean }>>([
    {
      id: 'sentry-intro',
      role: 'model',
      content:
        'Welcome, traveler. I sit by the void to listen. What is weighing heavily upon you today? Tell me what you are experiencing, and we will find its true shape.',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputValue(text);
    onHasUnsentTextChange(text.trim().length > 0);
  };

  const handleSendMessage = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    const userMessage: CounselMessageItem & { id: string } = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: 'user',
      content: trimmed,
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputValue('');
    onHasUnsentTextChange(false);
    setErrorMessage(null);
    setIsLoading(true);

    // Send at most the last 30 messages
    const payloadMessages: CounselMessageItem[] = newHistory
      .slice(-30)
      .map(({ role, content }) => ({ role, content }));

    const result = await sendCounselMessage(payloadMessages);

    setIsLoading(false);

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    const aiMessage: CounselMessageItem & { id: string; isCrisis?: boolean } = {
      id: `ai-${Date.now()}`,
      role: 'model',
      content: result.reply,
      isCrisis: result.crisis,
    };

    setMessages((prev) => [...prev, aiMessage]);

    // Only update spawn panel if crisis is false and a valid proposal was provided
    if (!result.crisis && result.proposal) {
      onProposalReceived(result.proposal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#07090e]/80 border border-white/10 rounded-2xl overflow-hidden">
      {/* Chat Messages Log */}
      <div
        className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 scrollbar-thin"
        aria-live="polite"
        role="log"
        aria-label="Counsel conversation log"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[88%] md:max-w-[80%] rounded-2xl px-4 py-3 text-xs md:text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-amber-500/20 text-amber-100 border border-amber-500/30 font-sans'
                  : 'bg-white/[0.04] text-slate-200 border border-white/10 font-sans'
              }`}
            >
              {msg.role === 'model' && (
                <div className="text-[10px] font-mono tracking-wider text-amber-300 uppercase mb-1">
                  The Sentry
                </div>
              )}
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>

            {/* Crisis Alert Banner underneath AI message */}
            {msg.isCrisis && (
              <div className="mt-3 max-w-[88%] md:max-w-[80%] p-4 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-100 text-xs flex items-start gap-3 shadow-lg animate-in fade-in">
                <HeartHandshake className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold block text-amber-200">
                    A Gentle Reminder
                  </span>
                  <p className="leading-relaxed text-amber-100/90">{SUPPORT_NOTE}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 p-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
            <span>The Sentry is reflecting...</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/30 text-red-200 text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 md:p-4 border-t border-white/10 bg-black/40">
        <div className="flex items-end gap-2 bg-white/[0.03] border border-white/10 rounded-xl p-2 focus-within:border-amber-500/40 transition-colors">
          <label htmlFor="counsel-chat-input" className="sr-only">
            Describe what you are facing to the Sentry
          </label>
          <textarea
            ref={textareaRef}
            id="counsel-chat-input"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you are facing (Enter to send, Shift+Enter for newline)..."
            rows={2}
            className="flex-1 bg-transparent border-none text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none scrollbar-none font-sans"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            aria-label="Send message to Sentry"
            className="p-2 rounded-lg bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
