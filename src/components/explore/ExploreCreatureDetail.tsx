import React from 'react';
import { Edit3, Sparkles, Save, Trash2 } from 'lucide-react';
import { ExploreCreatureItem } from './types';
import { CreaturePreviewCanvas } from '../CreaturePreviewCanvas';
import { ExploreCreatureEditForm } from './ExploreCreatureEditForm';
import { MonsterRecord } from '../../types';

interface ExploreCreatureDetailProps {
  creature: ExploreCreatureItem | null;
  isEditing: boolean;
  editForm: Partial<MonsterRecord>;
  onFormChange: (form: Partial<MonsterRecord>) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onSwitchToDiscover: () => void;
  confirmDeleteId: string | null;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  onRequestDelete: (id: string) => void;
}

export const ExploreCreatureDetail: React.FC<ExploreCreatureDetailProps> = ({
  creature,
  isEditing,
  editForm,
  onFormChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onSwitchToDiscover,
  confirmDeleteId,
  onConfirmDelete,
  onCancelDelete,
  onRequestDelete,
}) => {
  if (!creature) return null;

  return (
    <section className="hidden md:flex flex-1 flex-col overflow-y-auto bg-[#0a0b0e] p-6">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {/* Dossier Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#c5a059]/20 text-amber-200 border border-[#c5a059]/40">
                {creature.index
                  ? `ARCHETYPE #${creature.index}`
                  : 'FOUNDATIONAL LEVIATHAN'}
              </span>
              {creature.isCustom && (
                <span className="font-mono text-[10px] text-amber-400 border border-amber-400/30 px-1.5 py-0.5 rounded">
                  Saved in Bestiary
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold font-['Cinzel'] tracking-wide text-slate-100">
              {creature.name}
            </h2>
            <p className="text-sm text-amber-200/90 font-serif italic mt-1">
              {creature.workingMeaning || creature.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={onStartEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded-lg text-xs font-mono transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                  <span>Customize</span>
                </button>
                <button
                  onClick={onSwitchToDiscover}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c5a059]/20 hover:bg-[#c5a059]/30 text-amber-100 border border-[#c5a059]/40 rounded-lg text-xs font-mono transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Inquire</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onSaveEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Record</span>
                </button>
                <button
                  onClick={onCancelEdit}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg text-xs font-mono transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3D Preview Canvas: Isolated Placeholder */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>ARCHETYPAL GEOMETRY (PREVIEW PLACEHOLDER)</span>
            <span className="text-[10px] text-amber-400/60">
              Isolated from World Space
            </span>
          </div>
          <CreaturePreviewCanvas
            creatureName={creature.name}
            color="#1c202a"
            accentColor="#c5a059"
          />
        </div>

        {/* Characteristics or Edit Form */}
        {!isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-1.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                Canonical Working Meaning
              </span>
              <p className="text-xs text-slate-200 font-sans leading-relaxed">
                {creature.workingMeaning || 'Unspecified baseline.'}
              </p>
            </div>

            <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-1.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                Temperament & State
              </span>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-200 font-sans">
                  {creature.temperament || 'Dormant'}
                </p>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-amber-300 border border-white/10">
                  {creature.status || 'Formidable'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-1.5 md:col-span-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                Manifestation Pattern
              </span>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                {creature.manifestation}
              </p>
            </div>

            <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-1.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                Deceptive Whisper / Voice
              </span>
              <p className="text-xs text-amber-200/80 font-serif italic">
                {creature.voice}
              </p>
            </div>

            <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-1.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                Somatic Felt Sensation
              </span>
              <p className="text-xs text-slate-300 font-sans">
                {creature.somaticFeeling}
              </p>
            </div>

            <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-1.5 md:col-span-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                Core Psychological Roots
              </span>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                {creature.roots}
              </p>
            </div>

            <div className="p-4 bg-amber-950/20 border border-amber-500/20 rounded-xl space-y-1.5 md:col-span-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-300/80">
                Reflective Inquiry Question
              </span>
              <p className="text-xs text-amber-100/90 font-serif leading-relaxed">
                {creature.inquiry}
              </p>
            </div>

            {creature.isCustom && (
              <div className="md:col-span-2 pt-2 flex items-center justify-end">
                {confirmDeleteId === creature.id ? (
                  <div className="flex items-center gap-2 bg-red-950/50 p-2 rounded-lg border border-red-500/30">
                    <span className="text-xs text-red-200">
                      Revert this record to baseline?
                    </span>
                    <button
                      onClick={() => onConfirmDelete(creature.id)}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-mono cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={onCancelDelete}
                      className="px-2 py-1 text-slate-400 text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onRequestDelete(creature.id)}
                    className="flex items-center gap-1.5 text-xs text-red-400/80 hover:text-red-300 font-mono transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Revert to Canonical Baseline</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <ExploreCreatureEditForm
            editForm={editForm}
            onFormChange={onFormChange}
          />
        )}
      </div>
    </section>
  );
};
