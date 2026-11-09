import React, { useState, useEffect, useRef, useId } from 'react';
import { Monster } from '../types';
import { useMonsters } from '../store/monsterStore';
import { ageInDays } from '../utils/journeyFormat';
import { ConfirmDialog } from './ConfirmDialog';
import { X, Sword, AlertCircle, Clock } from 'lucide-react';

export interface SlayDialogProps {
  isOpen: boolean;
  monster: Monster;
  onClose: () => void;
  onSlaySuccess: (slainMonster: Monster) => void;
}

export const SlayDialog: React.FC<SlayDialogProps> = ({
  isOpen,
  monster,
  onClose,
  onSlaySuccess,
}) => {
  const { slay } = useMonsters();
  const [note, setNote] = useState('');
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const titleId = useId();
  const descId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const age = ageInDays(monster.createdAt);
  const isValidNote = note.trim().length >= 1 && note.length <= 500;

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setNote('');
      setErrorMessage(null);
      setIsDiscardConfirmOpen(false);
      setIsSubmitting(false);
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle request to close dialog (either via Cancel button, backdrop click, or Esc key)
  const handleRequestClose = () => {
    if (note.trim().length > 0) {
      setIsDiscardConfirmOpen(true);
    } else {
      onClose();
    }
  };

  // Esc key and focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDiscardConfirmOpen) return; // let ConfirmDialog handle Esc if open

      if (e.key === 'Escape') {
        e.stopPropagation();
        handleRequestClose();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, isDiscardConfirmOpen, note]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidNote || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = slay(monster.id, note.trim());
    if (result.ok && result.monster) {
      onSlaySuccess(result.monster);
      onClose();
    } else {
      setIsSubmitting(false);
      setErrorMessage(result.error || 'Failed to slay monster. Please try again.');
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleRequestClose();
          }
        }}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
          className="relative w-full max-w-lg bg-[#0b0d14] border border-[#c5a059]/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#07090e]">
            <div className="flex items-center gap-2.5">
              <Sword className="w-4 h-4 text-[#c5a059]" />
              <h3 id={titleId} className="font-['Cinzel'] text-sm font-semibold tracking-wide text-white">
                SLAY MONSTER: {monster.name.toUpperCase()}
              </h3>
            </div>
            <button
              type="button"
              onClick={handleRequestClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close slay dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Monster Summary Badge */}
            <div
              id={descId}
              className="p-3.5 bg-white/[0.03] border border-white/10 rounded-xl space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-['Cinzel'] font-bold text-amber-200 text-sm">
                  {monster.name}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Age: {age} days</span>
                </span>
              </div>

              {/* Dials Summary */}
              <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-xs">
                <div className="p-2 bg-black/40 border border-white/5 rounded-lg text-center">
                  <div className="text-[10px] text-slate-400 uppercase">Size</div>
                  <div className="font-bold text-amber-300 mt-0.5">{monster.size}/10</div>
                </div>
                <div className="p-2 bg-black/40 border border-white/5 rounded-lg text-center">
                  <div className="text-[10px] text-slate-400 uppercase">Distance</div>
                  <div className="font-bold text-cyan-300 mt-0.5">{monster.distance}/10</div>
                </div>
                <div className="p-2 bg-black/40 border border-white/5 rounded-lg text-center">
                  <div className="text-[10px] text-slate-400 uppercase">Ferocity</div>
                  <div className="font-bold text-rose-300 mt-0.5">{monster.ferocity}/10</div>
                </div>
              </div>
            </div>

            {/* Reflection Note Textarea */}
            <div className="space-y-1.5">
              <label
                htmlFor="slay-reflection-note"
                className="block text-xs font-mono font-medium text-amber-200 tracking-wide"
              >
                How did you defeat it? What did you learn? <span className="text-rose-400">*</span>
              </label>
              <textarea
                ref={textareaRef}
                id="slay-reflection-note"
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                required
                placeholder="How did you defeat it? What did you learn?"
                className="w-full px-3.5 py-2.5 bg-black/50 border border-white/15 focus:border-[#c5a059] rounded-xl text-xs text-slate-100 placeholder:text-slate-500 outline-none transition-colors resize-none leading-relaxed font-sans"
              />
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Required (1 to 500 characters)</span>
                <span className={note.length > 500 ? 'text-rose-400 font-bold' : ''}>
                  {note.length}/500
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={handleRequestClose}
                disabled={isSubmitting}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValidNote || isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#c5a059] hover:bg-[#d6b16a] text-black shadow-[0_0_16px_rgba(197,160,89,0.35)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sword className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Recording Slay...' : 'Slay Monster'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation when attempting to discard a typed note */}
      <ConfirmDialog
        isOpen={isDiscardConfirmOpen}
        onClose={() => setIsDiscardConfirmOpen(false)}
        onConfirm={() => {
          setIsDiscardConfirmOpen(false);
          onClose();
        }}
        title="Discard Slay Note?"
        message="You have entered a reflection note. Discarding will close this window and the monster will remain alive."
        confirmText="Discard and Close"
        cancelText="Continue Writing"
        isDanger={true}
      />
    </>
  );
};
