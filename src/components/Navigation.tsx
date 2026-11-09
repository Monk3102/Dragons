import React from 'react';
import { Volume2, VolumeX, Database } from 'lucide-react';

interface NavigationProps {
  activeSection: 'world' | 'explore' | 'counsel';
  onSelectSection: (section: 'world' | 'explore' | 'counsel') => void;
  audioActive: boolean;
  onToggleAudio: () => void;
  selectedDragonName: string | null;
  onReturnToWorld: () => void;
  onOpenBackup?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeSection,
  onSelectSection,
  audioActive,
  onToggleAudio,
  selectedDragonName,
  onReturnToWorld,
  onOpenBackup,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 pointer-events-auto">
      <div className="flex items-center justify-between gap-8 px-6 py-3.5 bg-gradient-to-b from-[#07090e]/95 via-[#07090e]/85 to-transparent backdrop-blur-sm border-b border-white/[0.06]">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              onSelectSection('world');
              onReturnToWorld();
            }}
            className="text-lg font-bold font-['Cinzel'] tracking-widest text-slate-100 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
          >
            DRACO ANIMI
          </button>
          <span className="hidden lg:inline text-xs text-slate-500 font-serif italic">
            / The Inner Leviathans
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-3 text-xs font-medium tracking-wider text-slate-400">
          <button
            onClick={() => {
              onSelectSection('world');
              if (selectedDragonName) onReturnToWorld();
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wider transition-all duration-300 cursor-pointer ${
              activeSection === 'world' && !selectedDragonName
                ? 'bg-white/10 text-white border border-white/20 shadow-sm'
                : 'bg-transparent text-slate-400 border border-transparent hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                activeSection === 'world' && !selectedDragonName
                  ? 'bg-slate-200 shadow-[0_0_6px_rgba(255,255,255,0.6)]'
                  : 'bg-slate-600'
              }`}
            />
            <span>World Space</span>
          </button>

          <button
            onClick={() => onSelectSection(activeSection === 'counsel' ? 'world' : 'counsel')}
            className={`group relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wider transition-all duration-300 cursor-pointer ${
              activeSection === 'counsel'
                ? 'bg-indigo-400/15 text-indigo-200 border border-indigo-400/50 shadow-[0_0_16px_rgba(129,140,248,0.25)]'
                : 'bg-white/[0.03] text-slate-400 border border-white/10 hover:border-indigo-300/40 hover:text-indigo-200 hover:bg-white/[0.07]'
            }`}
            aria-expanded={activeSection === 'counsel'}
            title="Seek counsel with the Sentry and manifest a new monster"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                activeSection === 'counsel'
                  ? 'bg-indigo-400 shadow-[0_0_6px_#818cf8] scale-110'
                  : 'bg-slate-500 group-hover:bg-indigo-300/70'
              }`}
            />
            <span>Counsel</span>
            {activeSection === 'counsel' && (
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 bg-indigo-400/20 text-indigo-300 rounded tracking-normal">
                Active
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectSection(activeSection === 'explore' ? 'world' : 'explore')}
            className={`group relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wider transition-all duration-300 cursor-pointer ${
              activeSection === 'explore'
                ? 'bg-amber-400/15 text-amber-200 border border-amber-400/50 shadow-[0_0_16px_rgba(251,191,36,0.22)]'
                : 'bg-white/[0.03] text-slate-400 border border-white/10 hover:border-amber-300/40 hover:text-amber-200 hover:bg-white/[0.07]'
            }`}
            aria-expanded={activeSection === 'explore'}
            title="Toggle integrated Bestiary & Archetype exploration"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                activeSection === 'explore'
                  ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24] scale-110'
                  : 'bg-slate-500 group-hover:bg-amber-300/70'
              }`}
            />
            <span>Explore Bestiary</span>
            {activeSection === 'explore' && (
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 bg-amber-400/20 text-amber-300 rounded tracking-normal">
                Open
              </span>
            )}
          </button>

          {selectedDragonName && (
            <div className="hidden xl:flex items-center gap-2 text-slate-300">
              <span className="text-slate-600">/</span>
              <span className="text-amber-200/90 font-['Cinzel'] text-xs">
                {selectedDragonName}
              </span>
            </div>
          )}
        </nav>

        {/* Zone 3: Local Data Backup & Audio Control */}
        <div className="flex items-center gap-2.5 shrink-0">
          {onOpenBackup && (
            <button
              onClick={onOpenBackup}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg border border-[#c5a059]/30 bg-[#c5a059]/10 hover:bg-[#c5a059]/25 text-amber-200 transition-all cursor-pointer shadow-sm"
              title="Backup, export, or restore Draco Animi bestiary data (JSON)"
            >
              <Database className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Backup & Archive</span>
            </button>
          )}

          <button
            onClick={onToggleAudio}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
              audioActive
                ? 'bg-white/10 text-slate-200 border-white/20'
                : 'bg-transparent text-slate-400 border-white/5 hover:border-white/15 hover:text-slate-300'
            }`}
            title="Toggle procedural ambient void drone"
          >
            {audioActive ? (
              <Volume2 className="w-3.5 h-3.5 text-amber-200" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
