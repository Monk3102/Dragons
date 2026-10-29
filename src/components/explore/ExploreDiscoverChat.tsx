import React, { useRef, useEffect } from 'react';
import { Info, User as UserIcon, Bot, Sparkles, AlertTriangle, Send } from 'lucide-react';
import { DiscoverChatMessage, ExploreCreatureItem } from './types';

interface ExploreDiscoverChatProps {
  currentCreature: ExploreCreatureItem | null;
  discoverMessages: DiscoverChatMessage[];
  chatInput: string;
  isChatLoading: boolean;
  chatError: string | null;
  onInputChange: (val: string) => void;
  onSendMessage: (e?: React.FormEvent) => void;
}

export const ExploreDiscoverChat: React.FC<ExploreDiscoverChatProps> = ({
  currentCreature,
  discoverMessages,
  chatInput,
  isChatLoading,
  chatError,
  onInputChange,
  onSendMessage,
}) => {
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [discoverMessages, isChatLoading]);

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#0a0b0e]">
      {/* Left Reference Bar: Active Creature Focus */}
      <div className="w-full md:w-80 border-r border-white/10 p-5 bg-[#08090d] space-y-4 shrink-0 overflow-y-auto">
        <div className="flex items-center gap-2 text-xs font-mono text-amber-300">
          <Info className="w-4 h-4" />
          <span>CURRENT ARCHETYPE FOCUS</span>
        </div>

        {currentCreature && (
          <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-2">
            <div className="font-mono text-[10px] text-amber-200/70">
              {currentCreature.index ? `ARCHETYPE #${currentCreature.index}` : '3D LEVIATHAN'}
            </div>
            <h3 className="font-['Cinzel'] text-sm font-semibold text-slate-100">
              {currentCreature.name}
            </h3>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              {currentCreature.workingMeaning || currentCreature.subtitle}
            </p>
          </div>
        )}

        {currentCreature?.inquiry && (
          <div className="p-4 bg-amber-950/20 border border-amber-500/20 rounded-xl space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-amber-300/80">
              Guiding Inscription
            </span>
            <p className="text-xs text-amber-100/90 font-serif italic">
              {currentCreature.inquiry}
            </p>
          </div>
        )}

        <div className="p-3 bg-black/40 border border-white/5 rounded-lg space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">
            Interaction Boundary
          </span>
          <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
            The Discover oracle does not dispense advice, action plans, or quick fixes.
            Its sole purpose is to listen and help identify the shape and origin of the monster.
          </p>
        </div>
      </div>

      {/* Right: Exploratory Chat Stream */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#07090c]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {discoverMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-2xl ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-300 border border-white/10'
                }`}
              >
                {msg.role === 'user' ? (
                  <UserIcon className="w-3.5 h-3.5" />
                ) : (
                  <Bot className="w-3.5 h-3.5" />
                )}
              </div>

              <div
                className={`p-4 rounded-xl text-xs leading-relaxed space-y-1 ${
                  msg.role === 'user'
                    ? 'bg-amber-950/30 border border-amber-500/30 text-amber-100 rounded-tr-none'
                    : 'bg-white/[0.04] border border-white/10 text-slate-200 rounded-tl-none font-serif text-[13px]'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <div className="text-[9px] font-mono text-slate-500 text-right pt-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))}

          {isChatLoading && (
            <div className="flex gap-3 max-w-xl mr-auto animate-pulse">
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </div>
              <div className="p-3 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-slate-400 font-mono">
                Reflecting on the nature of the beast...
              </div>
            </div>
          )}

          {chatError && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{chatError}</span>
            </div>
          )}

          <div ref={chatScrollRef} />
        </div>

        {/* Chat Input Box */}
        <form
          onSubmit={onSendMessage}
          className="p-4 border-t border-white/10 bg-[#0a0b10] flex items-center gap-3 shrink-0"
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={`Describe what you are wrestling with (exploring ${currentCreature?.name || 'internal monster'})...`}
            disabled={isChatLoading}
            className="flex-1 px-4 py-2.5 bg-black/50 border border-white/15 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#c5a059]/60 font-sans"
          />
          <button
            type="submit"
            disabled={isChatLoading || !chatInput.trim()}
            className="px-4 py-2.5 bg-[#c5a059] hover:bg-[#d6b168] disabled:opacity-40 text-black font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Inquire</span>
          </button>
        </form>
      </div>
    </div>
  );
};
