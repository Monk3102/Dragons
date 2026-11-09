import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Monster, Dial } from '../types';
import { useMonsters } from '../store/monsterStore';
import { getDialDirection, DialName } from '../utils/journeyFormat';
import { Sliders, Check, AlertCircle, X } from 'lucide-react';

interface UpdateMonsterFormProps {
  monster: Monster;
  onUpdated?: () => void;
}

export const UpdateMonsterForm: React.FC<UpdateMonsterFormProps> = ({
  monster,
  onUpdated,
}) => {
  const { updateDials } = useMonsters();
  const [isOpen, setIsOpen] = useState(false);

  // Sliders state (1 to 10)
  const [size, setSize] = useState<Dial>(monster.size);
  const [distance, setDistance] = useState<Dial>(monster.distance);
  const [ferocity, setFerocity] = useState<Dial>(monster.ferocity);
  const [note, setNote] = useState<string>('');

  // Tracking interaction and submission feedback
  const [isTouched, setIsTouched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Re-sync sliders if monster values change while untouched
  useEffect(() => {
    if (!isTouched) {
      setSize(monster.size);
      setDistance(monster.distance);
      setFerocity(monster.ferocity);
    }
  }, [monster.size, monster.distance, monster.ferocity, isTouched]);

  const hasDialChanged =
    size !== monster.size ||
    distance !== monster.distance ||
    ferocity !== monster.ferocity;

  const isNoteNonEmpty = note.trim().length > 0;
  const isNoteValid = isNoteNonEmpty && note.trim().length <= 500;
  const isDirty = hasDialChanged || isNoteNonEmpty;
  const canSave = hasDialChanged && isNoteValid;

  // Inline missing requirements message
  const missingRequirement = useMemo(() => {
    if (!hasDialChanged) {
      return 'Change at least one dial.';
    }
    if (!isNoteNonEmpty) {
      return 'Enter a note describing what changed (1–500 chars).';
    }
    if (note.trim().length > 500) {
      return 'Note exceeds 500 characters.';
    }
    return null;
  }, [hasDialChanged, isNoteNonEmpty, note]);

  // Live preview of changes
  const livePreviews = useMemo(() => {
    const changes: Array<{
      dial: DialName;
      label: string;
      from: number;
      to: number;
      direction: 'easing' | 'worsening';
    }> = [];

    if (size !== monster.size) {
      changes.push({
        dial: 'size',
        label: 'Size',
        from: monster.size,
        to: size,
        direction: getDialDirection('size', monster.size, size) as 'easing' | 'worsening',
      });
    }

    if (distance !== monster.distance) {
      changes.push({
        dial: 'distance',
        label: 'Distance',
        from: monster.distance,
        to: distance,
        direction: getDialDirection('distance', monster.distance, distance) as 'easing' | 'worsening',
      });
    }

    if (ferocity !== monster.ferocity) {
      changes.push({
        dial: 'ferocity',
        label: 'Ferocity',
        from: monster.ferocity,
        to: ferocity,
        direction: getDialDirection('ferocity', monster.ferocity, ferocity) as 'easing' | 'worsening',
      });
    }

    return changes;
  }, [size, distance, ferocity, monster.size, monster.distance, monster.ferocity]);

  const resetForm = useCallback(() => {
    setSize(monster.size);
    setDistance(monster.distance);
    setFerocity(monster.ferocity);
    setNote('');
    setIsTouched(false);
    setErrorMessage(null);
    setShowDiscardConfirm(false);
  }, [monster.size, monster.distance, monster.ferocity]);

  const handleClose = useCallback(() => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      resetForm();
      setIsOpen(false);
    }
  }, [isDirty, resetForm]);

  const confirmDiscard = useCallback(() => {
    resetForm();
    setIsOpen(false);
  }, [resetForm]);

  // Intercept Escape key when form is open to prevent silent discarding of typed text
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleClose();
      }
    };

    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true });
  }, [isOpen, handleClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    setErrorMessage(null);
    const result = updateDials(
      monster.id,
      {
        size,
        distance,
        ferocity,
      },
      note
    );

    if (!result.ok) {
      setErrorMessage(result.error || 'Failed to update monster dials.');
      return;
    }

    // Success: collapse and clear the form (3D monster animates automatically)
    resetForm();
    setIsOpen(false);
    onUpdated?.();
  };

  if (!isOpen) {
    return (
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-mono font-medium rounded-lg bg-cyan-950/40 text-cyan-300 border border-cyan-800/50 hover:bg-cyan-900/40 hover:border-cyan-700/60 transition-colors cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Update this monster</span>
        </button>
      </div>
    );
  }

  return (
    <div className="pt-2">
      <div className="p-4 bg-white/[0.04] border border-cyan-500/30 rounded-xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 uppercase tracking-wider">
            <Sliders className="w-3.5 h-3.5" />
            <span>Update Dials</span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Cancel update"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Unsaved changes confirmation dialog banner */}
        {showDiscardConfirm && (
          <div className="p-3 bg-amber-950/60 border border-amber-600/50 rounded-lg text-xs space-y-2">
            <p className="text-amber-200 font-medium">
              You have unsaved changes. Discard changes?
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={confirmDiscard}
                className="px-2.5 py-1 text-xs font-mono bg-red-900/60 hover:bg-red-800/70 text-red-200 border border-red-700/50 rounded cursor-pointer"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="px-2.5 py-1 text-xs font-mono bg-white/10 hover:bg-white/20 text-slate-200 rounded cursor-pointer"
              >
                Keep Editing
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          {/* Sliders */}
          <div className="space-y-3">
            {/* Size Slider */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Size</span>
                <span className="text-cyan-300 font-semibold">{size}/10</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={size}
                onChange={(e) => {
                  setIsTouched(true);
                  setSize(Number(e.target.value) as Dial);
                }}
                className="w-full accent-cyan-400 cursor-pointer"
                aria-label="Size dial slider"
              />
              <span className="text-[10px] text-slate-400">1 tiny, 10 huge</span>
            </div>

            {/* Distance Slider */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Distance</span>
                <span className="text-cyan-300 font-semibold">{distance}/10</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={distance}
                onChange={(e) => {
                  setIsTouched(true);
                  setDistance(Number(e.target.value) as Dial);
                }}
                className="w-full accent-cyan-400 cursor-pointer"
                aria-label="Distance dial slider"
              />
              <span className="text-[10px] text-slate-400">1 very near, 10 very far</span>
            </div>

            {/* Ferocity Slider */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Ferocity</span>
                <span className="text-cyan-300 font-semibold">{ferocity}/10</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={ferocity}
                onChange={(e) => {
                  setIsTouched(true);
                  setFerocity(Number(e.target.value) as Dial);
                }}
                className="w-full accent-cyan-400 cursor-pointer"
                aria-label="Ferocity dial slider"
              />
              <span className="text-[10px] text-slate-400">1 mild, 10 severe</span>
            </div>
          </div>

          {/* Live Preview of Changes */}
          {livePreviews.length > 0 && (
            <div className="p-2.5 bg-black/30 border border-white/5 rounded-lg space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                Pending Changes
              </span>
              <div className="space-y-1">
                {livePreviews.map((p) => {
                  const isEasing = p.direction === 'easing';
                  return (
                    <div
                      key={p.dial}
                      className="flex items-center justify-between text-[11px]"
                    >
                      <span className="text-slate-300">
                        {p.label} {p.from} → {p.to}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 font-semibold text-[10px] uppercase tracking-wider ${
                          isEasing ? 'text-teal-300' : 'text-rose-300'
                        }`}
                      >
                        <span>{isEasing ? 'easing' : 'worsening'}</span>
                        <span aria-hidden="true">{isEasing ? '▼' : '▲'}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Note Textarea */}
          <div className="space-y-1 font-sans">
            <label
              htmlFor="update-monster-note"
              className="text-xs text-slate-300 font-mono block"
            >
              What changed? (saved to the journey)
            </label>
            <textarea
              id="update-monster-note"
              rows={3}
              value={note}
              maxLength={500}
              placeholder="e.g. Broke the task down into a 15-minute outline; resistance decreased significantly."
              onChange={(e) => {
                setIsTouched(true);
                setNote(e.target.value);
              }}
              className="w-full p-2.5 text-xs bg-black/40 border border-white/10 rounded-lg text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500/60 leading-relaxed"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>1 to 500 characters</span>
              <span>{note.trim().length}/500</span>
            </div>
          </div>

          {/* Missing requirement warning or Error Message */}
          {errorMessage ? (
            <div className="flex items-start gap-1.5 p-2 bg-red-950/50 border border-red-800/40 rounded text-red-300 text-[11px] font-mono">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          ) : missingRequirement ? (
            <div className="text-[11px] font-mono text-slate-400 italic">
              {missingRequirement}
            </div>
          ) : null}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5 font-sans">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                canSave
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950/50'
                  : 'bg-white/5 text-slate-400 border border-white/5 cursor-not-allowed'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
