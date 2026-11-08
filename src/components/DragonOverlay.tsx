import React from 'react';
import { DragonProblem, Monster, Dial } from '../types';
import { ArrowLeft, X } from 'lucide-react';

interface DragonOverlayProps {
  dragon: DragonProblem;
  monster?: Monster | null;
  onClose: () => void;
}

export const DragonOverlay: React.FC<DragonOverlayProps> = ({
  dragon,
  monster,
  onClose,
}) => {
  // Extract dial values from monster prop or attached dials
  const rawDials = (dragon as any).dials;
  const size: Dial = monster?.size ?? rawDials?.size ?? Math.min(10, Math.max(1, Math.round((dragon.scale - 1.2) / 0.4)));
  const distance: Dial = monster?.distance ?? rawDials?.distance ?? Math.min(10, Math.max(1, Math.round((Math.sqrt(dragon.position[0] ** 2 + dragon.position[2] ** 2) - 9) / 4.5 + 1)));
  const ferocity: Dial = monster?.ferocity ?? rawDials?.ferocity ?? 5;

  const hasManifestation = Boolean(dragon.manifestation && dragon.manifestation.trim() !== '');
  const hasVoice = Boolean(dragon.voice && dragon.voice.trim() !== '');
  const hasRoots = Boolean(dragon.roots && dragon.roots.trim() !== '');
  const hasInquiry = Boolean(dragon.inquiry && dragon.inquiry.trim() !== '');

  return (
    <div className="fixed bottom-6 right-6 md:right-8 w-full max-w-md pointer-events-auto z-30 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-[#0b0d14]/92 border border-white/10 rounded-xl p-6 shadow-2xl text-slate-200 backdrop-blur-md">
        {/* Header with Title and Close button */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            {(dragon.category || dragon.temperament) && (
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono tracking-wider uppercase mb-1">
                {dragon.category && <span>{dragon.category}</span>}
                {dragon.category && dragon.temperament && <span aria-hidden="true">·</span>}
                {dragon.temperament && <span>{dragon.temperament}</span>}
              </div>
            )}
            <h2 className="text-xl font-bold font-['Cinzel'] tracking-wide text-white">
              {dragon.name}
            </h2>
            {dragon.subtitle && dragon.subtitle.trim() !== '' && (
              <p className="text-xs text-slate-400 italic mt-0.5">
                {dragon.subtitle}
              </p>
            )}
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
          {/* Dials Block */}
          <div className="p-3 bg-white/[0.03] border border-white/5 rounded-lg space-y-2.5">
            <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase block">
              Dials
            </span>
            <div className="space-y-2 font-mono">
              {/* Size */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Size</span>
                  <span className="text-amber-200 font-semibold">{size}/10</span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full"
                    style={{ width: `${(size / 10) * 100}%` }}
                  />
                </div>
              </div>

              {/* Distance */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Distance (1 = near, 10 = far)</span>
                  <span className="text-amber-200 font-semibold">{distance}/10</span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full"
                    style={{ width: `${(distance / 10) * 100}%` }}
                  />
                </div>
              </div>

              {/* Ferocity */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Ferocity</span>
                  <span className="text-amber-200 font-semibold">{ferocity}/10</span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                    style={{ width: `${(ferocity / 10) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Manifestation description */}
          {hasManifestation && (
            <div>
              <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase block mb-1">
                Anatomy of the Threat
              </span>
              <p className="text-slate-300 text-xs leading-relaxed">
                {dragon.manifestation}
              </p>
            </div>
          )}

          {/* The Whisper / Voice */}
          {hasVoice && (
            <div className="p-3 bg-white/[0.03] border border-white/5 rounded-lg">
              <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase block mb-1">
                The Deceptive Whisper
              </span>
              <p className="text-xs italic text-slate-200">
                {dragon.voice}
              </p>
            </div>
          )}

          {/* Root & Inquiry */}
          {(hasRoots || hasInquiry) && (
            <div className="space-y-2">
              {hasRoots && (
                <div>
                  <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase block">
                    Origin & Root
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {dragon.roots}
                  </p>
                </div>
              )}

              {hasInquiry && (
                <div>
                  <span className="text-[10px] font-mono tracking-wider text-amber-300/80 uppercase block">
                    Reflective Inquiry
                  </span>
                  <p className="text-xs text-slate-200 mt-0.5 font-medium leading-relaxed">
                    {dragon.inquiry}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-end">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to World</span>
          </button>
        </div>
      </div>
    </div>
  );
};
