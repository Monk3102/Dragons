import React, { useMemo, useState } from 'react';
import { DragonProblem, Monster, Dial } from '../types';
import { ArrowLeft, X, Clock, Sword, Trash2 } from 'lucide-react';
import { ageInDays, trendSinceSpawn } from '../utils/journeyFormat';
import { JourneyTimeline } from './JourneyTimeline';
import { UpdateMonsterForm } from './UpdateMonsterForm';
import { SlayDialog } from './SlayDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { useMonsters } from '../store/monsterStore';

interface DragonOverlayProps {
  dragon: DragonProblem;
  monster?: Monster | null;
  onClose: () => void;
  onSlaySuccess?: (slainMonster: Monster) => void;
}

export const DragonOverlay: React.FC<DragonOverlayProps> = ({
  dragon,
  monster,
  onClose,
  onSlaySuccess,
}) => {
  const { deleteMonster } = useMonsters();
  const [isSlayDialogOpen, setIsSlayDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Extract dial values from monster record or attached dials
  const rawDials = (dragon as { dials?: { size?: Dial; distance?: Dial; ferocity?: Dial } }).dials;
  const size: Dial = monster?.size ?? rawDials?.size ?? Math.min(10, Math.max(1, Math.round((dragon.scale - 1.2) / 0.4))) as Dial;
  const distance: Dial = monster?.distance ?? rawDials?.distance ?? Math.min(10, Math.max(1, Math.round((Math.sqrt(dragon.position[0] ** 2 + dragon.position[2] ** 2) - 9) / 4.5 + 1))) as Dial;
  const ferocity: Dial = monster?.ferocity ?? rawDials?.ferocity ?? 5;

  const createdAtIso = monster?.createdAt || dragon.createdAt;
  const age = useMemo(() => {
    return createdAtIso ? ageInDays(createdAtIso) : 0;
  }, [createdAtIso]);

  const trends = useMemo(() => {
    if (!monster?.journey || monster.journey.length === 0) return null;
    return trendSinceSpawn(monster.journey);
  }, [monster?.journey]);

  const hasManifestation = Boolean(dragon.manifestation && dragon.manifestation.trim() !== '');
  const hasVoice = Boolean(dragon.voice && dragon.voice.trim() !== '');
  const hasRoots = Boolean(dragon.roots && dragon.roots.trim() !== '');
  const hasInquiry = Boolean(dragon.inquiry && dragon.inquiry.trim() !== '');

  const isAlive = monster ? monster.status === 'alive' : true;

  return (
    <div className="fixed bottom-6 right-6 md:right-8 w-full max-w-md pointer-events-auto z-30 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-[#0b0d14]/95 border border-white/10 rounded-xl shadow-2xl text-slate-200 backdrop-blur-md max-h-[80vh] flex flex-col overflow-hidden">
        {/* Sticky Header with Title and Close button so it never scrolls away */}
        <div className="p-5 pb-4 border-b border-white/10 bg-[#0b0d14]/95 sticky top-0 z-10 shrink-0">
          <div className="flex items-start justify-between gap-4">
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
              {/* Age indicator */}
              <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 mt-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Age: {age} days</span>
                {monster?.status === 'slain' && (
                  <span className="ml-2 px-1.5 py-0.2 bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 rounded text-[10px] uppercase">
                    Slain
                  </span>
                )}
              </div>
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
        </div>

        {/* Scrollable Core Content */}
        <div className="p-5 pt-3 overflow-y-auto flex-1 space-y-4 text-sm">
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

            {/* Trend since spawn line for the three dials */}
            {trends && (
              <div className="pt-2 border-t border-white/5 text-[11px] font-mono space-y-1">
                <span className="text-slate-400 text-[10px] uppercase tracking-wider block">
                  Trend since spawn
                </span>
                <div className="flex items-center gap-3 flex-wrap">
                  {trends.map((t) => {
                    const isEasing = t.direction === 'easing';
                    const isWorsening = t.direction === 'worsening';
                    const sign = t.net > 0 ? `+${t.net}` : `${t.net}`;
                    return (
                      <div
                        key={t.dial}
                        className="flex items-center gap-1"
                      >
                        <span className="text-slate-300 capitalize">{t.dial}:</span>
                        <span>{sign}</span>
                        {isEasing && (
                          <span className="text-teal-300 flex items-center font-semibold">
                            <span>easing</span>
                            <span aria-hidden="true" className="ml-0.5">▼</span>
                          </span>
                        )}
                        {isWorsening && (
                          <span className="text-rose-300 flex items-center font-semibold">
                            <span>worsening</span>
                            <span aria-hidden="true" className="ml-0.5">▲</span>
                          </span>
                        )}
                        {!isEasing && !isWorsening && (
                          <span className="text-slate-400">steady</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Update Monster Form (Only if status is alive) */}
          {monster && isAlive && (
            <UpdateMonsterForm monster={monster} />
          )}

          {/* Journey Timeline */}
          {monster?.journey && monster.journey.length > 0 && (
            <div className="pt-1">
              <JourneyTimeline journey={monster.journey} />
            </div>
          )}

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
        <div className="p-3 border-t border-white/10 bg-[#0b0d14]/95 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {isAlive && monster && (
              <>
                <button
                  type="button"
                  onClick={() => setIsSlayDialogOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-100 bg-[#c5a059]/20 hover:bg-[#c5a059]/30 border border-[#c5a059]/50 rounded-lg transition-colors cursor-pointer shadow-sm"
                  title="Confront and slay this monster to record your triumph"
                >
                  <Sword className="w-3.5 h-3.5 text-[#c5a059]" />
                  <span>Slay this monster</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                  title="Delete this monster"
                  aria-label={`Delete monster: ${dragon.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to World</span>
          </button>
        </div>
      </div>

      {/* Slay Monster Dialog */}
      {monster && (
        <SlayDialog
          isOpen={isSlayDialogOpen}
          monster={monster}
          onClose={() => setIsSlayDialogOpen(false)}
          onSlaySuccess={(slain) => {
            setIsSlayDialogOpen(false);
            onSlaySuccess?.(slain);
          }}
        />
      )}

      {/* Delete Alive Monster Confirmation Dialog */}
      {monster && (
        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={() => {
            deleteMonster(monster.id);
            setIsDeleteDialogOpen(false);
            onClose();
          }}
          title={`Delete "${dragon.name}"?`}
          message={
            <div className="space-y-1.5">
              <p>
                Are you sure you want to delete <strong className="text-white font-['Cinzel']">{dragon.name}</strong> from your bestiary?
              </p>
              <p className="text-rose-300 text-xs">
                This action cannot be undone. We recommend exporting a backup first.
              </p>
            </div>
          }
          confirmText="Delete Monster"
          cancelText="Cancel"
          requireTypedConfirmation="DELETE"
          isDanger={true}
        />
      )}
    </div>
  );
};
