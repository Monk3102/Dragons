import React, { useState, useEffect, useCallback } from 'react';
import { INITIAL_DRAGONS } from './data/dragons';
import { DragonProblem } from './types';
import { Scene } from './components/Scene';
import { Navigation } from './components/Navigation';
import { Dock } from './components/Dock';
import { DragonOverlay } from './components/DragonOverlay';
import { NotesDrawer } from './components/NotesDrawer';
import { GeminiChatDrawer } from './components/GeminiChatDrawer';
import { voidAudio } from './utils/audioAmbience';
import { useFirebaseData } from './firebase/useFirebaseData';

export default function App() {
  const [dragons] = useState<DragonProblem[]>(INITIAL_DRAGONS);
  const [selectedDragonId, setSelectedDragonId] = useState<string | null>(null);
  const [cameraPreset, setCameraPreset] = useState<'overview' | 'hero' | 'inspect' | null>('overview');
  const [activeSection, setActiveSection] = useState<'world' | 'codex'>('world');
  const [audioActive, setAudioActive] = useState<boolean>(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  // Firebase Auth and Firestore integration
  const {
    user,
    signInWithGoogle,
    signOut,
    notes,
    addNote,
    deleteNote,
    chatMessages,
    saveChatMessage,
    clearChat,
  } = useFirebaseData();

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

  // Keyboard shortcuts (Escape for returning to world view / closing drawers, H for Zen Mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isChatOpen) {
          setIsChatOpen(false);
        } else if (activeSection === 'codex') {
          setActiveSection('world');
        } else if (selectedDragonId) {
          handleDeselectDragon();
        }
      } else if (e.key === 'h' || e.key === 'H') {
        if (
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA'
        ) {
          setIsDockCollapsed((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDragonId, activeSection, isChatOpen, handleDeselectDragon]);

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
      />

      {/* Top Navigation Bar with Firebase Auth & Chat triggers */}
      <Navigation
        activeSection={activeSection}
        onSelectSection={(section) => setActiveSection(section)}
        audioActive={audioActive}
        onToggleAudio={handleToggleAudio}
        selectedDragonName={selectedDragon ? selectedDragon.name : null}
        onReturnToWorld={handleDeselectDragon}
        onOpenChat={() => setIsChatOpen(true)}
        user={user}
        onSignIn={signInWithGoogle}
        onSignOut={signOut}
      />

      {/* Selected Dragon Detail Overlay with Gemini Confrontation */}
      {selectedDragon && (
        <DragonOverlay
          dragon={selectedDragon}
          onClose={handleDeselectDragon}
          onConfrontWithGemini={() => setIsChatOpen(true)}
        />
      )}

      {/* Unified Bottom Dock */}
      <Dock
        dragons={dragons}
        selectedDragonId={selectedDragonId}
        onSelectDragon={handleSelectDragon}
        onDeselectDragon={handleDeselectDragon}
        cameraPreset={cameraPreset}
        onSetCameraPreset={(preset) => {
          setSelectedDragonId(null);
          setCameraPreset(preset);
        }}
        isCollapsed={isDockCollapsed}
        onToggleCollapse={() => setIsDockCollapsed((prev) => !prev)}
      />

      {/* The Codex & Notes Drawer with Firestore Persistence */}
      <NotesDrawer
        isOpen={activeSection === 'codex'}
        onClose={() => setActiveSection('world')}
        dragons={dragons}
        onSelectDragon={(id) => {
          handleSelectDragon(id);
          setActiveSection('world');
        }}
        notes={notes}
        onAddNote={addNote}
        onDeleteNote={deleteNote}
        onOpenChatWithDragon={(id) => {
          setSelectedDragonId(id);
          setIsChatOpen(true);
        }}
        userEmail={user?.email}
      />

      {/* Multi-turn Gemini Chatbot with Role Selection and Firestore History */}
      <GeminiChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        selectedDragon={selectedDragon}
        dragons={dragons}
        chatMessages={chatMessages}
        onSendMessage={saveChatMessage}
        onClearChat={clearChat}
        userEmail={user?.email}
      />
    </div>
  );
}
