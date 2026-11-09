import React, { useState, useEffect, useCallback } from 'react';
import { CounselChat } from './counsel/CounselChat';
import { SpawnPanel } from './counsel/SpawnPanel';
import { Proposal } from '../../server/counsel';
import { Compass, ShieldAlert, ArrowLeft } from 'lucide-react';

interface CounselViewProps {
  isOpen: boolean;
  onClose: () => void;
  onMonsterSpawned: (monsterId: string) => void;
}

export const CounselView: React.FC<CounselViewProps> = ({
  isOpen,
  onClose,
  onMonsterSpawned,
}) => {
  const [activeProposal, setActiveProposal] = useState<Proposal | null>(null);
  const [hasUnsentChatText, setHasUnsentChatText] = useState(false);
  const [hasDirtySpawnForm, setHasDirtySpawnForm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const hasUnsavedContent = hasUnsentChatText || hasDirtySpawnForm;

  const handleRequestClose = useCallback(() => {
    if (hasUnsavedContent) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  }, [hasUnsavedContent, onClose]);

  // Keyboard shortcut listener for Esc
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showExitConfirm) {
          setShowExitConfirm(false);
        } else {
          handleRequestClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showExitConfirm, handleRequestClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#07090e] text-slate-100 select-none animate-in fade-in duration-200">
      {/* Top Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#07090e]/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-['Cinzel'] text-lg font-bold tracking-wider text-white">
              THE SENTRY'S COUNSEL
            </h1>
            <p className="text-[11px] font-mono text-slate-400">
              Discern, articulate, and manifest your internal challenges into the void.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRequestClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 transition-colors cursor-pointer"
            aria-label="Return to World"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to World (Esc)</span>
          </button>
        </div>
      </header>

      {/* Fixed Privacy Notice */}
      <div className="px-6 py-2 bg-black/40 border-b border-white/5 text-[11px] font-mono text-slate-400 text-center">
        Messages are sent to Google's Gemini service. Don't write anything you want to keep private.
      </div>

      {/* Main Two-Pane Split Layout */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 md:p-6 overflow-hidden min-h-0">
        {/* Left Pane: Conversation with Sentry */}
        <section className="lg:col-span-7 h-full min-h-0 flex flex-col">
          <CounselChat
            onProposalReceived={(p) => setActiveProposal(p)}
            onHasUnsentTextChange={(hasText) => setHasUnsentChatText(hasText)}
          />
        </section>

        {/* Right Pane: Manifestation / Spawn Panel */}
        <section className="lg:col-span-5 h-full min-h-0 flex flex-col">
          <SpawnPanel
            proposal={activeProposal}
            onSpawnSuccess={(id) => {
              onClose();
              onMonsterSpawned(id);
            }}
            onHasDirtyFormChange={(isDirty) => setHasDirtySpawnForm(isDirty)}
          />
        </section>
      </main>

      {/* Unsaved Changes Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#0f131c] border border-amber-500/40 rounded-2xl p-5 shadow-2xl text-slate-200 font-mono text-xs space-y-4">
            <div className="flex items-center gap-2.5 text-amber-300">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span className="font-semibold text-sm">Discard Unspawned Content?</span>
            </div>
            <p className="text-slate-400 leading-relaxed font-sans text-xs">
              You have unspawned monster notes or draft messages. Leaving now will discard your current draft.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  onClose();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-200 transition-colors cursor-pointer"
              >
                Discard & Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
