import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DragonProblem } from './types';
import { Scene } from './components/Scene';
import { Navigation } from './components/Navigation';
import { Dock } from './components/Dock';
import { DragonOverlay } from './components/DragonOverlay';
import { voidAudio } from './utils/audioAmbience';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { useMonsters } from './store/monsterStore';
import { layoutMonsters } from './scene/dialMapping';
import { monsterToDragonProblem } from './scene/monsterVisuals';

const ExploreView = React.lazy(() =>
  import('./components/ExploreView').then((m) => ({ default: m.ExploreView }))
);

const CounselView = React.lazy(() =>
  import('./components/CounselView').then((m) => ({ default: m.CounselView }))
);

// Dynamic import strictly in development mode for zero production bundle footprint
const DevDialPanel = import.meta.env.DEV
  ? React.lazy(new Function("return import('./components/DevDialPanel')") as any)
  : null;

export default function App() {
  const { monsters } = useMonsters();

  // Memoize whole 3D visual adapter keyed on the monsters array
  const dragons = useMemo<DragonProblem[]>(() => {
    const alive = monsters.filter((m) => m.status === 'alive');
    const layout = layoutMonsters(alive);
    return alive.map((m) => {
      const pos = layout.get(m.id)!;
      const d = monsterToDragonProblem(m, pos);
      (d as any).createdAt = m.createdAt;
      return d;
    });
  }, [monsters]);

  const [selectedDragonId, setSelectedDragonId] = useState<string | null>(null);
  const [cameraPreset, setCameraPreset] = useState<'overview' | 'hero' | 'inspect' | null>('overview');
  const [activeSection, setActiveSection] = useState<'world' | 'explore' | 'counsel'>('world');
  const [audioActive, setAudioActive] = useState<boolean>(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [isDevPanelOpen, setIsDevPanelOpen] = useState<boolean>(false);

  const selectedDragon = dragons.find((d) => d.id === selectedDragonId) || null;
  const selectedMonster = monsters.find((m) => m.id === selectedDragonId) || null;

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

  // Keyboard shortcuts (Escape for world/explore, H for Dock, D for Dev Dial Panel)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isTyping =
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if (e.key === 'Escape') {
        if (activeSection === 'explore') {
          setActiveSection('world');
        } else if (activeSection === 'counsel') {
          // Handled inside CounselView with dirty-check confirmation dialog
        } else if (selectedDragonId) {
          handleDeselectDragon();
        }
      } else if ((e.key === 'h' || e.key === 'H') && !isTyping) {
        if (activeSection !== 'explore' && activeSection !== 'counsel') {
          setIsDockCollapsed((prev) => !prev);
        }
      } else if ((e.key === 'd' || e.key === 'D') && !isTyping && import.meta.env.DEV) {
        setIsDevPanelOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDragonId, activeSection, handleDeselectDragon]);

  return (
    <div className="relative w-screen h-screen bg-[#07090e] overflow-hidden font-sans text-slate-100">
      {/* 3D WebGL Canvas Layer (rendering paused while in counsel view to conserve GPU) */}
      <Scene
        dragons={dragons}
        selectedDragonId={selectedDragonId}
        onSelectDragon={handleSelectDragon}
        onDeselectDragon={handleDeselectDragon}
        cameraPreset={cameraPreset}
        onClearPreset={() => setCameraPreset(null)}
        isActive={activeSection !== 'counsel'}
      />

      {/* Top Navigation Bar with World Space, Counsel, Bestiary, and Backup & Archive */}
      <Navigation
        activeSection={activeSection}
        onSelectSection={(section) => setActiveSection(section)}
        audioActive={audioActive}
        onToggleAudio={handleToggleAudio}
        selectedDragonName={selectedDragon ? selectedDragon.name : null}
        onReturnToWorld={handleDeselectDragon}
        onOpenBackup={() => setIsBackupModalOpen(true)}
      />

      {/* Selected Dragon Detail Overlay with Dials block */}
      {selectedDragon && (
        <DragonOverlay
          dragon={selectedDragon}
          monster={selectedMonster}
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

      {/* Counsel & Spawn Overlay */}
      <React.Suspense fallback={null}>
        <CounselView
          isOpen={activeSection === 'counsel'}
          onClose={() => setActiveSection('world')}
          onMonsterSpawned={(newId) => {
            setActiveSection('world');
            handleSelectDragon(newId);
          }}
        />
      </React.Suspense>

      {/* Developer Dial Panel (Loaded exclusively in development mode via 'D' key) */}
      {import.meta.env.DEV && DevDialPanel && isDevPanelOpen && (
        <React.Suspense fallback={null}>
          <DevDialPanel onClose={() => setIsDevPanelOpen(false)} />
        </React.Suspense>
      )}
    </div>
  );
}
