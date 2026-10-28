import React from 'react';
import { Volume2, VolumeX, MessageSquare, LogIn, LogOut, User } from 'lucide-react';
import { FirebaseUser } from '../firebase/config';

interface NavigationProps {
  activeSection: 'world' | 'codex';
  onSelectSection: (section: 'world' | 'codex') => void;
  audioActive: boolean;
  onToggleAudio: () => void;
  selectedDragonName: string | null;
  onReturnToWorld: () => void;
  onOpenChat: () => void;
  user: FirebaseUser | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeSection,
  onSelectSection,
  audioActive,
  onToggleAudio,
  selectedDragonName,
  onReturnToWorld,
  onOpenChat,
  user,
  onSignIn,
  onSignOut,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-20 pointer-events-auto">
      <div className="flex items-center justify-between gap-8 px-6 py-4 bg-gradient-to-b from-[#07090e]/95 via-[#07090e]/60 to-transparent">
        {/* Zone 1: Single text element wordmark */}
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
        <nav className="flex items-center gap-5 text-xs font-medium tracking-wider text-slate-400">
          <button
            onClick={() => {
              onSelectSection('world');
              if (selectedDragonName) onReturnToWorld();
            }}
            className={`transition-colors whitespace-nowrap pb-0.5 border-b cursor-pointer ${
              activeSection === 'world' && !selectedDragonName
                ? 'text-white border-white'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            World Space
          </button>

          <button
            onClick={() => onSelectSection('codex')}
            className={`transition-colors whitespace-nowrap pb-0.5 border-b cursor-pointer ${
              activeSection === 'codex'
                ? 'text-white border-white'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Chronicle Notes
          </button>

          <button
            onClick={onOpenChat}
            className="flex items-center gap-1.5 transition-colors whitespace-nowrap text-amber-200/90 hover:text-amber-100 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Counsel Oracle</span>
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

        {/* Zone 3: Auth & Audio Control */}
        <div className="flex items-center gap-3 shrink-0">
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

          {user ? (
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-5 h-5 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className="hidden sm:inline text-xs text-slate-200 max-w-[120px] truncate">
                {user.displayName || user.email?.split('@')[0]}
              </span>
              <button
                onClick={onSignOut}
                className="text-slate-400 hover:text-white transition-colors p-1"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 border border-white/15 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-200" />
              <span>Google Sign-In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
