import React, { useState, useEffect, useCallback } from 'react';
import { INITIAL_DRAGONS } from './data/dragons';
import { DragonProblem } from './types';
import { Scene } from './components/Scene';
import { Navigation } from './components/Navigation';
import { Dock } from './components/Dock';
import { DragonOverlay } from './components/DragonOverlay';
import { voidAudio } from './utils/audioAmbience';
import { BackupRestoreModal } from './components/BackupRestoreModal';

const ExploreView = React.lazy(() =>
  import('./components/ExploreView').then((m) => ({ default: m.ExploreView }))
);

export default function App() {
  const [dragons] = useState<DragonProblem[]>(INITIAL_DRAGONS);
  const [selectedDragonId, setSelectedDragonId] = useState<string | null>(null);
  const [cameraPreset, setCameraPreset] = useState<'overview' | 'hero' | 'inspect' | null>('overview');
  const [activeSection, setActiveSection] = useState<'world' | 'explore'>('world');
  const [audioActive, setAudioActive] = useState<boolean>(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);

  const selectedDragon = dragons.find((d) => d.id === selectedDragonId) || null;

  const handleSelectDragon = useCallback((id: string) => {
    setSelectedDragonId(id);
    setCameraPreset('inspect');
  }, []);

  const handleDeselectDragon = useCallback(() => {
    setSelectedDragonId(null);
    setCameraPreset('overview');
  }, []);

  const handleToggleAudio = useCallback(() => {
    const isPlaying = voidAudio.toggle();
    setAudioActive(isPlaying);
  }, []);

  // Keyboard shortcuts (Escape for returning to world view / closing explore, H for Zen Mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeSection === 'explore') {
          setActiveSection('world');
        } else if (selectedDragonId) {
          handleDeselectDragon();
        }
      } else if (e.key === 'h' || e.key === 'H') {
        const isTyping =
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA' ||
          (document.activeElement as HTMLElement)?.isContentEditable;
        if (!isTyping && activeSection !== 'explore') {
          setIsDockCollapsed((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDragonId, activeSection, handleDeselectDragon]);

  return (
    <div className="relative w-screen h-screen bg-[#07090e] overflow-hidden font-sans text-slate-100">
      {/* 3D WebGL Canvas Layer */}
      <Scene
        dragons={dragons}
        selectedDragonId={selectedDragonId}
        onSelectDragon={handleSelectDragon}
        onDeselectDragon={handleDeselectDragon}
        cameraPreset={cameraPreset}
        onClearPreset={() => setCameraPreset(null)}
        isActive={true}
      />

      {/* Top Navigation Bar with World Space, Bestiary, and Backup & Archive */}
      <Navigation
        activeSection={activeSection}
        onSelectSection={(section) => setActiveSection(section)}
        audioActive={audioActive}
        onToggleAudio={handleToggleAudio}
        selectedDragonName={selectedDragon ? selectedDragon.name : null}
        onReturnToWorld={handleDeselectDragon}
        onOpenBackup={() => setIsBackupModalOpen(true)}
      />

      {/* Selected Dragon Detail Overlay */}
      {selectedDragon && (
        <DragonOverlay
          dragon={selectedDragon}
          onClose={handleDeselectDragon}
        />
      )}

      {/* Camera & Perspective Dock */}
      <Dock
        onDeselectDragon={handleDeselectDragon}
        cameraPreset={cameraPreset}
        onSetCameraPreset={(preset) => {
          setSelectedDragonId(null);
          setCameraPreset(preset);
        }}
        isCollapsed={isDockCollapsed}
        onToggleCollapse={() => setIsDockCollapsed((prev) => !prev)}
      />

      {/* Complete Bestiary Archive & Backup Modal */}
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />

      {/* Integrated Explore Bestiary Overlay */}
      <React.Suspense fallback={null}>
        <ExploreView
          isOpen={activeSection === 'explore'}
          onClose={() => setActiveSection('world')}
          initialSelectedId={selectedDragonId}
        />
      </React.Suspense>
    </div>
  );
}
