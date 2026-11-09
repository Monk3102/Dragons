import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DragonProblem, Monster } from './types';
import { Scene } from './components/Scene';
import { Navigation } from './components/Navigation';
import { Dock } from './components/Dock';
import { voidAudio } from './utils/audioAmbience';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { useMonsters } from './store/monsterStore';
import { layoutMonsters } from './scene/dialMapping';
import { monsterToDragonProblem } from './scene/monsterVisuals';
import { Toast, ToastAction } from './components/Toast';
import { shouldRemind, daysSinceExport, getLastExportTime } from './utils/backupReminder';

const ExploreView = React.lazy(() =>
  import('./components/ExploreView').then((m) => ({ default: m.ExploreView }))
);

const CounselView = React.lazy(() =>
  import('./components/CounselView').then((m) => ({ default: m.CounselView }))
);

const WallOfFameView = React.lazy(() =>
  import('./components/WallOfFameView').then((m) => ({ default: m.WallOfFameView }))
);

const DragonOverlay = React.lazy(() =>
  import('./components/DragonOverlay').then((m) => ({ default: m.DragonOverlay }))
);

// Dynamic import strictly in development mode for zero production bundle footprint
const DevDialPanel = import.meta.env.DEV
  ? React.lazy(new Function("return import('./components/DevDialPanel')") as () => Promise<{ default: React.ComponentType<{ onClose: () => void }> }>)
  : null;

export default function App() {
  const { monsters } = useMonsters();

  // Memoize whole 3D visual adapter keyed on the monsters array
  const dragons = useMemo<DragonProblem[]>(() => {
    const alive = monsters.filter((m) => m.status === 'alive');
    const layout = layoutMonsters(alive);
    return alive.map((m) => {
      const pos = layout.get(m.id)!;
      return {
        ...monsterToDragonProblem(m, pos),
        createdAt: m.createdAt,
      };
    });
  }, [monsters]);

  // Leaving animation dragons snapshot list (held for 1.6s after being slain)
  const [leavingDragons, setLeavingDragons] = useState<(DragonProblem & { leaving: boolean })[]>([]);

  // Combined 3D entities for Scene
  const sceneDragons = useMemo<DragonProblem[]>(() => {
    return [...dragons, ...leavingDragons];
  }, [dragons, leavingDragons]);

  const [selectedDragonId, setSelectedDragonId] = useState<string | null>(null);
  const [cameraPreset, setCameraPreset] = useState<'overview' | 'hero' | 'inspect' | null>('overview');
  const [activeSection, setActiveSection] = useState<'world' | 'explore' | 'counsel' | 'wall'>('world');
  const [audioActive, setAudioActive] = useState<boolean>(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [isDevPanelOpen, setIsDevPanelOpen] = useState<boolean>(false);
  const [toastState, setToastState] = useState<{ message: string; action?: ToastAction } | null>(null);

  // Backup reminder computation
  const nonSampleCount = useMemo(() => monsters.filter((m) => !m.isSample).length, [monsters]);
  const lastExportIso = getLastExportTime();
  const isReminderActive = shouldRemind(nonSampleCount, lastExportIso);
  const daysSinceExportCount = daysSinceExport(lastExportIso);
  const backupTooltip =
    daysSinceExportCount === null
      ? 'Last backup: never'
      : `Last backup: ${daysSinceExportCount} ${daysSinceExportCount === 1 ? 'day' : 'days'} ago`;

  const selectedDragon = sceneDragons.find((d) => d.id === selectedDragonId) || null;
  const selectedMonster = monsters.find((m) => m.id === selectedDragonId) || null;

  const handleSelectDragon = useCallback((id: string) => {
    setSelectedDragonId(id);
    setCameraPreset('inspect');
  }, []);

  const handleDeselectDragon = useCallback(() => {
    setSelectedDragonId(null);
    setCameraPreset('overview');
  }, []);

  const handleSlaySuccess = useCallback(
    (slainMonster: Monster) => {
      // 1. Snapshot the 3D entity representation before removing
      const dragonSnapshot = dragons.find((d) => d.id === slainMonster.id);
      if (dragonSnapshot) {
        const leavingItem = { ...dragonSnapshot, leaving: true };
        setLeavingDragons((prev) => [...prev.filter((d) => d.id !== slainMonster.id), leavingItem]);
        setTimeout(() => {
          setLeavingDragons((prev) => prev.filter((d) => d.id !== slainMonster.id));
        }, 1600);
      }

      // 2. Deselect and reset camera to overview
      setSelectedDragonId(null);
      setCameraPreset('overview');

      // 3. Show Toast notification
      setToastState({
        message: `${slainMonster.name} has been slain. It now rests on the Wall of Fame.`,
        action: {
          label: 'View Wall of Fame',
          onClick: () => setActiveSection('wall'),
        },
      });
    },
    [dragons]
  );


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
        if (activeSection === 'explore' || activeSection === 'wall') {
          setActiveSection('world');
        } else if (activeSection === 'counsel') {
          // Handled inside CounselView with dirty-check confirmation dialog
        } else if (selectedDragonId) {
          handleDeselectDragon();
        }
      } else if ((e.key === 'h' || e.key === 'H') && !isTyping) {
        if (activeSection !== 'explore' && activeSection !== 'counsel' && activeSection !== 'wall') {
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
      {/* 3D WebGL Canvas Layer (rendering paused while in counsel or wall view to conserve GPU) */}
      <Scene
        dragons={sceneDragons}
        selectedDragonId={selectedDragonId}
        onSelectDragon={handleSelectDragon}
        onDeselectDragon={handleDeselectDragon}
        cameraPreset={cameraPreset}
        onClearPreset={() => setCameraPreset(null)}
        isActive={activeSection !== 'counsel' && activeSection !== 'wall'}
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
        shouldBackupReminder={isReminderActive}
        backupTooltip={backupTooltip}
      />

      {/* Selected Dragon Detail Overlay with Dials block */}
      {selectedDragon && (
        <React.Suspense fallback={null}>
          <DragonOverlay
            dragon={selectedDragon}
            monster={selectedMonster}
            onClose={handleDeselectDragon}
            onSlaySuccess={handleSlaySuccess}
          />
        </React.Suspense>
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

      {/* Wall of Fame Overlay */}
      <React.Suspense fallback={null}>
        <WallOfFameView
          isOpen={activeSection === 'wall'}
          onClose={() => setActiveSection('world')}
        />
      </React.Suspense>

      {/* Slay Victory Toast Notification */}
      {toastState && (
        <Toast
          message={toastState.message}
          action={toastState.action}
          onClose={() => setToastState(null)}
        />
      )}

      {/* Developer Dial Panel (Loaded exclusively in development mode via 'D' key) */}
      {import.meta.env.DEV && DevDialPanel && isDevPanelOpen && (
        <React.Suspense fallback={null}>
          <DevDialPanel onClose={() => setIsDevPanelOpen(false)} />
        </React.Suspense>
      )}
    </div>
  );
}
