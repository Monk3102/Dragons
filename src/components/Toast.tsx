import React, { useEffect } from 'react';
import { Trophy, X } from 'lucide-react';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastProps {
  message: string;
  action?: ToastAction;
  onClose: () => void;
  durationMs?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  action,
  onClose,
  durationMs = 8000,
}) => {
  useEffect(() => {
    if (durationMs <= 0) return;
    const timer = setTimeout(() => {
      onClose();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[calc(100%-2rem)] px-4 py-3 bg-[#0b0d14]/95 border border-[#c5a059]/60 shadow-[0_0_24px_rgba(197,160,89,0.25)] rounded-xl backdrop-blur-md text-slate-100 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-1.5 rounded-lg bg-[#c5a059]/20 text-amber-300 shrink-0 border border-[#c5a059]/40">
          <Trophy className="w-4 h-4" />
        </div>
        <p className="text-xs font-medium leading-snug truncate">
          {message}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {action && (
          <button
            onClick={() => {
              action.onClick();
              onClose();
            }}
            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[#c5a059] hover:bg-[#d6b16a] text-black transition-colors cursor-pointer shadow-sm whitespace-nowrap"
          >
            {action.label}
          </button>
        )}
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
