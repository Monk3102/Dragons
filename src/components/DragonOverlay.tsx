import React from 'react';
import { DragonProblem } from '../types';
import { ArrowLeft, MessageSquare, X } from 'lucide-react';

interface DragonOverlayProps {
  dragon: DragonProblem;
  onClose: () => void;
  onConfrontWithGemini?: () => void;
}

export const DragonOverlay: React.FC<DragonOverlayProps> = ({
  dragon,
  onClose,
  onConfrontWithGemini,
}) => {
  return (
    <div className="fixed bottom-6 right-6 md:right-8 w-full max-w-md pointer-events-auto z-30 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-[#0b0d14]/92 border border-white/10 rounded-xl p-6 shadow-2xl text-slate-200 backdrop-blur-md">
        {/* Header with Title and Close button */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono tracking-wider uppercase mb-1">
              <span>{dragon.category}</span>
              <span aria-hidden="true">·</span>
              <span>{dragon.temperament}</span>
            </div>
            <h2 className="text-xl font-bold font-['Cinzel'] tracking-wide text-white">
              {dragon.name}
            </h2>
            <p className="text-xs text-slate-400 italic mt-0.5">
              {dragon.subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Return to World View (Esc)"
            aria-label="Close inspection view"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Core Content */}
        <div className="py-4 space-y-4 text-sm">
          {/* Manifestation description */}
          <div>
            <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase block mb-1">
              Anatomy of the Threat
            </span>
            <p className="text-slate-300 text-xs leading-relaxed">
              {dragon.manifestation}
            </p>
          </div>

          {/* The Whisper / Voice */}
          <div className="p-3 bg-white/[0.03] border border-white/5 rounded-lg">
            <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase block mb-1">
              The Deceptive Whisper
            </span>
            <p className="text-xs italic text-slate-200">
              {dragon.voice}
            </p>
          </div>

          {/* Root & Inquiry */}
          <div className="space-y-2">
            <div>
              <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase block">
                Origin & Root
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                {dragon.roots}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-mono tracking-wider text-amber-300/80 uppercase block">
                Reflective Inquiry
              </span>
              <p className="text-xs text-slate-200 mt-0.5 font-medium leading-relaxed">
                {dragon.inquiry}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
          {onConfrontWithGemini && (
            <button
              onClick={onConfrontWithGemini}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Confront with Gemini</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer ml-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to World</span>
          </button>
        </div>
      </div>
    </div>
  );
};
