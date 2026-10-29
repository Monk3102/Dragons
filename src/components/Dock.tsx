import React from 'react';
import { ChevronDown, ChevronUp, User, Globe } from 'lucide-react';

interface DockProps {
  onDeselectDragon: () => void;
  cameraPreset: 'overview' | 'hero' | 'inspect' | null;
  onSetCameraPreset: (preset: 'overview' | 'hero' | 'inspect') => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Dock: React.FC<DockProps> = ({
  onDeselectDragon,
  cameraPreset,
  onSetCameraPreset,
  isCollapsed,
  onToggleCollapse,
}) => {
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex flex-col items-center max-w-[min(640px,94vw)] w-full transition-transform duration-300">
      {/* Collapse / Zen Mode Toggle */}
      <button
        onClick={onToggleCollapse}
        className="flex items-center gap-1.5 px-3 py-1 mb-1.5 rounded-full bg-[#0b0d14]/80 border border-white/10 text-[11px] font-mono tracking-wider text-slate-400 hover:text-slate-200 hover:bg-[#0b0d14] transition-all shadow-lg cursor-pointer"
        title="Toggle Zen Mode (H)"
      >
        {isCollapsed ? (
          <>
            <ChevronUp className="w-3 h-3 text-slate-400" />
            <span>Show Dock</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3 h-3 text-slate-400" />
            <span>Zen View</span>
          </>
        )}
      </button>

      {/* Main Dock Container */}
      {!isCollapsed && (
        <div className="w-full bg-[#0b0d14]/90 border border-white/10 rounded-2xl p-2.5 sm:p-3 shadow-2xl backdrop-blur-md flex items-center justify-between gap-4 text-xs">
          {/* Left section: Camera Perspective Presets */}
          <div className="flex items-center gap-1.5 bg-white/[0.03] p-1 rounded-xl border border-white/5">
            <button
              onClick={() => {
                onDeselectDragon();
                onSetCameraPreset('overview');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                cameraPreset === 'overview' || cameraPreset === null
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Wide atmospheric world overview"
            >
              <Globe className="w-3.5 h-3.5 text-amber-200/90" />
              <span>World Void</span>
            </button>

            <button
              onClick={() => {
                onDeselectDragon();
                onSetCameraPreset('hero');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                cameraPreset === 'hero'
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="View from behind the lone sentry with sword"
            >
              <User className="w-3.5 h-3.5 text-slate-300" />
              <span>Lone Sentry</span>
            </button>
          </div>

          {/* Right section: Gesture & Orbit Helper hint */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400 pr-2">
            <span>Orbit: Drag</span>
            <span>·</span>
            <span>Zoom: Scroll</span>
            <span>·</span>
            <span>Focus: Click</span>
          </div>
        </div>
      )}
    </div>
  );
};
