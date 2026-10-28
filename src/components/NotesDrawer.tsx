import React, { useState } from 'react';
import { DragonProblem } from '../types';
import { ConfrontationNoteItem } from '../firebase/useFirebaseData';
import { X, BookOpen, Feather, Trash2, MessageSquare, Cloud } from 'lucide-react';

interface NotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  dragons: DragonProblem[];
  onSelectDragon: (id: string) => void;
  notes: ConfrontationNoteItem[];
  onAddNote: (dragonId: string, dragonName: string, text: string, status?: ConfrontationNoteItem['status']) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
  onOpenChatWithDragon: (dragonId: string) => void;
  userEmail?: string | null;
}

export const NotesDrawer: React.FC<NotesDrawerProps> = ({
  isOpen,
  onClose,
  dragons,
  onSelectDragon,
  notes,
  onAddNote,
  onDeleteNote,
  onOpenChatWithDragon,
  userEmail,
}) => {
  const [selectedDragonId, setSelectedDragonId] = useState<string>(dragons[0]?.id || '');
  const [reflectionText, setReflectionText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentDragon = dragons.find((d) => d.id === selectedDragonId) || dragons[0];
  const currentDragonNotes = notes.filter((n) => n.dragonId === currentDragon.id);

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflectionText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddNote(currentDragon.id, currentDragon.name, reflectionText.trim(), 'Acknowledged');
      setReflectionText('');
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end pointer-events-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-xl h-full bg-[#090b10] border-l border-white/10 text-slate-200 shadow-2xl flex flex-col z-50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#07090e]">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-amber-200" />
            <div>
              <div className="flex items-center gap-2 text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                <Cloud className="w-3 h-3 text-sky-400" />
                <span>Firestore Persisted Chronicle</span>
              </div>
              <h2 className="text-base font-bold font-['Cinzel'] tracking-wider text-white">
                THE CODEX & CHRONICLE
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Close notes drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Philosophy Banner */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-slate-400 uppercase">
              <span>Truth of the Void</span>
              {userEmail ? (
                <span className="text-sky-300">Synced: {userEmail}</span>
              ) : (
                <span className="text-slate-500">Guest mode (sign in to sync)</span>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "We do not conquer the dragon by pretending it does not exist. We stand in the void, name its true proportion, and discover that every terror is finite."
            </p>
          </div>

          {/* Dragon selector tabs */}
          <div>
            <span className="text-xs font-mono tracking-wider text-slate-400 uppercase block mb-2">
              Select Dragon Subject
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {dragons.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDragonId(d.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    d.id === currentDragon.id
                      ? 'bg-white/10 border-white/30 text-white'
                      : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: d.coreGlow }}
                    />
                    <span className="text-xs font-semibold truncate">{d.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {d.category}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions for active dragon */}
          <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-white/[0.02] border border-white/5 text-xs">
            <button
              onClick={() => {
                onSelectDragon(currentDragon.id);
                onClose();
              }}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-md transition-colors"
            >
              Focus in 3D Void →
            </button>

            <button
              onClick={() => {
                onOpenChatWithDragon(currentDragon.id);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 rounded-md font-medium transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Confront with Gemini</span>
            </button>
          </div>

          {/* New Reflection Input */}
          <form onSubmit={handleSaveNote} className="space-y-3 pt-1">
            <div>
              <label className="text-xs font-mono tracking-wider text-slate-300 uppercase block mb-1.5 flex items-center gap-1.5">
                <Feather className="w-3.5 h-3.5 text-amber-200/90" />
                <span>Log a Confrontation Entry in Firestore</span>
              </label>
              <textarea
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder={`What did you notice when staring into ${currentDragon.name}? Record your small step...`}
                rows={3}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-white/30 transition-colors resize-none"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!reflectionText.trim() || isSubmitting}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:hover:bg-white/10 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                {isSubmitting ? 'Saving to Firestore...' : 'Record Entry'}
              </button>
            </div>
          </form>

          {/* Logged Chronicle Notes */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <span className="text-xs font-mono tracking-wider text-slate-400 uppercase block">
              Chronicle History ({currentDragonNotes.length})
            </span>

            {currentDragonNotes.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                No entries recorded for this dragon yet. Log your first confrontation above.
              </p>
            ) : (
              <div className="space-y-2">
                {currentDragonNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 bg-white/[0.02] border border-white/5 rounded-lg space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>{note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Recorded'}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-200/80 font-serif text-[10px] uppercase border border-amber-500/20 px-1.5 py-0.5 rounded">
                          {note.status}
                        </span>
                        <button
                          onClick={() => onDeleteNote(note.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-0.5"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {note.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
