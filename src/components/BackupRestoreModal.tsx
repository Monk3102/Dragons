import React, { useState, useRef } from 'react';
import { Download, Upload, ShieldCheck, AlertTriangle, X, CheckCircle, Database } from 'lucide-react';
import { getLocalBestiaryRecords, saveLocalBestiaryRecord } from '../utils/localBestiary';
import { validateBackupJson, applyBackupImport, downloadCompleteBackup } from '../utils/localBackup';
import { useMonsters } from '../store/monsterStore';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreBestiary?: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  onRestoreBestiary,
}) => {
  const { monsters, replaceAll } = useMonsters();
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [validationSummary, setValidationSummary] = useState<{
    bestiaryCount: number;
    monsterCount: number;
    rawPayload: any;
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const localBestiary = getLocalBestiaryRecords();

  const handleExport = () => {
    downloadCompleteBackup([], [], undefined, monsters);
    setSuccessMessage('Bestiary archive JSON successfully downloaded to your device.');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setSuccessMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content !== 'string') return;

      const result = validateBackupJson(content);
      if (!result.isValid) {
        setImportError(result.error);
        setValidationSummary(null);
      } else {
        setValidationSummary({
          bestiaryCount: result.payload.userBestiaryRecords.length,
          monsterCount: result.payload.monsters?.length || 0,
          rawPayload: result.payload,
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (!validationSummary) return;

    try {
      const { mergedBestiary, mergedMonsters } = applyBackupImport(
        validationSummary.rawPayload,
        {
          bestiary: localBestiary,
          notes: [],
          chats: [],
          monsters,
        },
        importMode
      );

      // Save merged records to local storage
      mergedBestiary.forEach((rec) => saveLocalBestiaryRecord(rec));
      replaceAll(mergedMonsters);
      if (onRestoreBestiary) onRestoreBestiary();

      setSuccessMessage(
        `Successfully restored ${mergedBestiary.length} custom creature dossiers and ${mergedMonsters.length} monsters.`
      );
      setValidationSummary(null);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 2500);
    } catch (err) {
      setImportError(`Failed to apply import: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0b0d14] border border-[#c5a059]/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#07090e]">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-amber-300" />
            <h3 className="font-['Cinzel'] text-sm font-semibold tracking-wide text-white">
              BESTIARY ARCHIVE & BACKUP
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Status Banner */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Storage Mode</span>
              <span className="text-amber-300 font-semibold">
                Local Browser Storage (Account-Free)
              </span>
            </div>
            <div className="pt-1 text-center font-mono">
              <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
                <div className="text-lg font-bold text-slate-100">{localBestiary.length}</div>
                <div className="text-[10px] text-slate-400">Customized Creature Records</div>
              </div>
            </div>
          </div>

          {/* Export Section */}
          <div className="space-y-2">
            <div className="text-xs font-mono text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" />
              <span>1. Export Archive (JSON)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Downloads a verified JSON archive containing all 42 reference archetypes and your custom dossier notes.
            </p>
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#c5a059]/20 hover:bg-[#c5a059]/30 text-amber-100 border border-[#c5a059]/50 rounded-xl text-xs font-mono transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>Download Bestiary Backup (.json)</span>
            </button>
          </div>

          {/* Import / Restore Section */}
          <div className="space-y-3 pt-3 border-t border-white/10">
            <div className="text-xs font-mono text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span>2. Restore / Import Archive (JSON)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Restore previously exported creature dossiers onto this device.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />

            {!validationSummary ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/15 rounded-xl text-xs font-mono transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Select JSON Backup File...</span>
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-black/60 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-amber-200">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Valid Backup Verified</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {validationSummary.bestiaryCount} Custom Records · {validationSummary.monsterCount} Monsters
                  </span>
                </div>

                {/* Import Strategy Options */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    Import Mode:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <button
                      onClick={() => setImportMode('merge')}
                      className={`p-2 rounded-lg border text-left cursor-pointer transition-colors ${
                        importMode === 'merge'
                          ? 'bg-amber-500/20 border-amber-400/50 text-amber-100'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-semibold text-[11px]">Merge (Safe)</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">
                        Combines records without deleting existing items.
                      </div>
                    </button>

                    <button
                      onClick={() => setImportMode('replace')}
                      className={`p-2 rounded-lg border text-left cursor-pointer transition-colors ${
                        importMode === 'replace'
                          ? 'bg-red-950/40 border-red-500/50 text-red-200'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-semibold text-[11px]">Replace All</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">
                        Overwrites current records with backup file.
                      </div>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleConfirmImport}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer"
                  >
                    Confirm & Apply Import ({importMode.toUpperCase()})
                  </button>
                  <button
                    onClick={() => setValidationSummary(null)}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg text-xs font-mono transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Error & Success Notices */}
            {importError && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/30 text-red-200 text-xs flex items-center gap-2 font-mono">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2 font-mono">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
