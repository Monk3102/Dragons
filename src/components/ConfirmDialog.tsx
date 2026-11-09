import React, { useEffect, useRef, useState, useId } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  requireTypedConfirmation?: string;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  requireTypedConfirmation,
  isLoading = false,
}) => {
  const [typedInput, setTypedInput] = useState('');
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Reset typed input when opened or closed
  useEffect(() => {
    if (isOpen) {
      setTypedInput('');
      // Auto-focus input if required, or cancel button
      const timer = setTimeout(() => {
        if (requireTypedConfirmation && inputRef.current) {
          inputRef.current.focus();
        } else if (cancelButtonRef.current) {
          cancelButtonRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, requireTypedConfirmation]);

  // Handle Escape key and focus trapping inside modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isConfirmed = requireTypedConfirmation
    ? typedInput.trim() === requireTypedConfirmation
    : true;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isConfirmed && !isLoading) {
      onConfirm();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative w-full max-w-md bg-[#0b0d14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#07090e]">
          <div className="flex items-center gap-2.5">
            {isDanger ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-[#c5a059]" />
            )}
            <h3 id={titleId} className="font-['Cinzel'] text-sm font-semibold tracking-wide text-white">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close dialog"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div id={descId} className="text-xs text-slate-300 leading-relaxed space-y-2">
            {typeof message === 'string' ? <p>{message}</p> : message}
          </div>

          {/* Optional Typed Confirmation (e.g. DELETE) */}
          {requireTypedConfirmation && (
            <div className="space-y-1.5 pt-2">
              <label
                htmlFor="confirm-typed-input"
                className="block text-[11px] font-mono text-slate-400 tracking-wider uppercase"
              >
                Type <span className="text-rose-300 font-bold">{requireTypedConfirmation}</span> to confirm:
              </label>
              <input
                ref={inputRef}
                id="confirm-typed-input"
                type="text"
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                autoComplete="off"
                spellCheck="false"
                placeholder={requireTypedConfirmation}
                className="w-full px-3 py-2 bg-black/50 border border-white/15 focus:border-rose-400/80 rounded-lg text-xs font-mono text-slate-100 placeholder:text-slate-600 outline-none transition-colors"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
            <button
              ref={cancelButtonRef}
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="submit"
              disabled={!isConfirmed || isLoading}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isDanger
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_12px_rgba(225,29,72,0.3)]'
                  : 'bg-[#c5a059] hover:bg-[#d6b16a] text-black font-semibold shadow-[0_0_12px_rgba(197,160,89,0.3)]'
              }`}
            >
              {isLoading ? 'Processing...' : confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
