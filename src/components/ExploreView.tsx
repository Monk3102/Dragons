import React, { useState, useMemo, useEffect } from 'react';
import { Compass, BookOpen, Download, Sparkles, CheckCircle, X } from 'lucide-react';
import { MonsterRecord, MonsterStatus } from '../types';
import { ARCHETYPE_CATALOGUE } from '../data/archetypesCatalogue';
import { INITIAL_DRAGONS } from '../data/dragons';
import {
  getLocalBestiaryRecords,
  saveLocalBestiaryRecord,
  deleteLocalBestiaryRecord,
  exportBestiaryToJson,
} from '../utils/localBestiary';
import { ExploreMode, FilterCategory, ExploreCreatureItem, DiscoverChatMessage } from './explore/types';
import { ExploreCreatureList } from './explore/ExploreCreatureList';
import { ExploreCreatureDetail } from './explore/ExploreCreatureDetail';
import { ExploreDiscoverChat } from './explore/ExploreDiscoverChat';

interface ExploreViewProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedId?: string | null;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  isOpen,
  onClose,
  initialSelectedId,
}) => {
  const [mode, setMode] = useState<ExploreMode>('creatures');
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userRecords, setUserRecords] = useState<MonsterRecord[]>(() =>
    getLocalBestiaryRecords()
  );

  // Selected item ID (defaults to dragon-inertia or archetype-dragon)
  const [selectedId, setSelectedId] = useState<string>(
    initialSelectedId || 'archetype-dragon'
  );

  // Editing state for creature characteristics
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<MonsterRecord>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Discover AI Chat State
  const [discoverMessages, setDiscoverMessages] = useState<DiscoverChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'model',
      content:
        'I am here to explore with you the nature, textures, and origins of the monsters inhabiting your inner landscape. Describe what you are experiencing, and together we can discern which mythological archetype mirrors its shape.',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Sync initial selection
  useEffect(() => {
    if (initialSelectedId) {
      setSelectedId(initialSelectedId);
    }
  }, [initialSelectedId]);

  // Combined list of all items for browsing
  const allCreatures = useMemo(() => {
    const list: ExploreCreatureItem[] = [];

    // 1. Foundational Dragons
    INITIAL_DRAGONS.forEach((d) => {
      const userOverride = userRecords.find((r) => r.id === d.id);
      list.push({
        id: d.id,
        name: d.name,
        isFoundational: true,
        workingMeaning: d.category,
        subtitle: d.subtitle,
        category: d.category,
        temperament: userOverride?.temperament || d.temperament,
        manifestation: userOverride?.manifestation || d.manifestation,
        voice: userOverride?.voice || d.voice,
        roots: userOverride?.roots || d.roots,
        somaticFeeling: userOverride?.somaticFeeling || d.somaticFeeling,
        inquiry: userOverride?.inquiry || d.inquiry,
        status: userOverride?.status || d.status,
        isCustom: !!userOverride,
      });
    });

    // 2. 42 Canonical Archetypes
    ARCHETYPE_CATALOGUE.forEach((a) => {
      const userOverride = userRecords.find((r) => r.id === a.id);
      list.push({
        id: a.id,
        name: a.name,
        index: a.index,
        isFoundational: false,
        workingMeaning: a.workingMeaning,
        subtitle: a.subtitle || `Archetype #${a.index}`,
        category: userOverride?.category || 'Archetypal Shadow',
        temperament: userOverride?.temperament || 'Dormant until activated',
        manifestation: userOverride?.manifestation || a.workingMeaning,
        voice: userOverride?.voice || `"${a.workingMeaning}."`,
        roots: userOverride?.roots || 'Human survival adaptations & primal reflexes',
        somaticFeeling: userOverride?.somaticFeeling || 'Visceral internal resonance',
        inquiry:
          userOverride?.inquiry ||
          `Where in your current life does the pattern of ${a.name.toLowerCase()} silently take hold?`,
        status: userOverride?.status || 'Formidable',
        isCustom: !!userOverride,
      });
    });

    // 3. Any additional custom records created by the user not in standard set
    userRecords.forEach((r) => {
      if (!list.some((item) => item.id === r.id)) {
        list.push({
          id: r.id,
          name: r.name,
          subtitle: r.subtitle,
          category: r.category,
          temperament: r.temperament,
          manifestation: r.manifestation,
          voice: r.voice,
          roots: r.roots,
          somaticFeeling: r.somaticFeeling,
          inquiry: r.inquiry,
          status: r.status,
          isCustom: true,
        });
      }
    });

    return list;
  }, [userRecords]);

  // Filtered creatures
  const filteredCreatures = useMemo(() => {
    return allCreatures.filter((c) => {
      if (filter === 'foundational' && !c.isFoundational) return false;
      if (filter === 'catalogue' && (c.isFoundational || c.index === undefined)) return false;
      if (filter === 'saved' && !c.isCustom) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesMeaning = (c.workingMeaning || '').toLowerCase().includes(q);
        const matchesSub = (c.subtitle || '').toLowerCase().includes(q);
        return matchesName || matchesMeaning || matchesSub;
      }
      return true;
    });
  }, [allCreatures, filter, searchQuery]);

  // Current active creature object
  const currentCreature = useMemo(() => {
    return allCreatures.find((c) => c.id === selectedId) || allCreatures[0] || null;
  }, [allCreatures, selectedId]);

  // Start editing current creature
  const handleStartEdit = () => {
    if (!currentCreature) return;
    setEditForm({
      id: currentCreature.id,
      name: currentCreature.name,
      subtitle: currentCreature.subtitle || '',
      category: currentCreature.category || '',
      temperament: currentCreature.temperament || '',
      manifestation: currentCreature.manifestation || '',
      voice: currentCreature.voice || '',
      roots: currentCreature.roots || '',
      somaticFeeling: currentCreature.somaticFeeling || '',
      inquiry: currentCreature.inquiry || '',
      status: currentCreature.status || 'Formidable',
      isCustom: true,
    });
    setIsEditing(true);
  };

  // Save edited characteristics into local bestiary
  const handleSaveEdit = () => {
    if (!editForm.id || !editForm.name) return;
    const recordToSave: MonsterRecord = {
      id: editForm.id,
      name: editForm.name,
      subtitle: editForm.subtitle || 'Personal Archetype Variant',
      category: editForm.category || 'Personal Inquiry',
      temperament: editForm.temperament || 'Formidable',
      manifestation: editForm.manifestation || '',
      voice: editForm.voice || '',
      roots: editForm.roots || '',
      somaticFeeling: editForm.somaticFeeling || '',
      inquiry: editForm.inquiry || '',
      status: (editForm.status as MonsterStatus) || 'Formidable',
      isCustom: true,
    };

    const updated = saveLocalBestiaryRecord(recordToSave);
    setUserRecords(updated);
    setIsEditing(false);
    setSaveSuccessNotice(`Saved custom dossier for ${recordToSave.name}`);
    setTimeout(() => setSaveSuccessNotice(null), 3000);
  };

  // Delete / Revert customized record
  const handleDeleteCustomRecord = (id: string) => {
    const updated = deleteLocalBestiaryRecord(id);
    setUserRecords(updated);
    setConfirmDeleteId(null);
    setIsEditing(false);
    setSaveSuccessNotice('Reverted creature to canonical baseline');
    setTimeout(() => setSaveSuccessNotice(null), 3000);
  };

  // Handle Discover AI Chat submission
  const handleSendDiscoverChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userText = chatInput.trim();
    const userMsg: DiscoverChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString(),
    };

    setDiscoverMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);
    setChatError(null);

    // Build strictly non-prescriptive, inquisitive instructions
    const systemInstruction = `You are the Creature Identification and Inquiry Guide in Draco Animi.
Your sole role is to act as a reflective listener and creature-identification companion.
You are NOT a problem-solving assistant, therapist, or advisor.

CRITICAL RULES:
1. Listen carefully and respond naturally to what the user describes.
2. Reflect the user's emotional tone and inner experience without providing advice, solutions, coping mechanisms, action plans, steps, or instructions for defeating or fixing monsters.
3. NEVER tell the user what to do or offer therapeutic remedies.
4. When context is needed, ask at most ONE thoughtful, non-leading inquiry.
5. Tentatively explore whether the experience mirrors any of the 42 mythological archetypes (e.g. Dragon, Hydra, Sirens, Minotaur, Medusa, Vampire, Werewolf, Cyclops, Cerberus, Giant, Trickster, Shadow Monster, Fenrir, Jörmungandr, etc.) or currently active: '${currentCreature?.name}'.
6. Present creature interpretations tentatively, explain why a creature might fit, and invite the user to confirm or disagree.
7. Maintain an eerie, introspective, respectful, and philosophical tone. Maximum 140 words.`;

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...discoverMessages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: userText },
          ],
          systemInstruction,
          model: 'gemini-3.8-flash',
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      const aiReply =
        data.reply ||
        'The void absorbs the words in silence. Consider what boundary or creature was evoked.';

      setDiscoverMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'model',
          content: aiReply,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch {
      setChatError(
        'The reflection channel encountered an interruption. Please try your inquiry again.'
      );
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-x-0 bottom-0 top-[57px] z-30 flex flex-col overflow-hidden transition-all duration-300 ease-out transform ${
        isOpen
          ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
          : 'opacity-0 translate-y-3 scale-[0.99] pointer-events-none'
      }`}
      role="region"
      aria-label="Draco Animi Bestiary"
      aria-hidden={!isOpen}
    >
      {/* Frosted atmospheric backdrop revealing the continuous 3D void */}
      <div className="absolute inset-0 bg-[#07090e]/90 backdrop-blur-xl -z-10" />

      {/* Integrated Section Sub-header */}
      <div className="px-6 py-2.5 border-b border-[#c5a059]/20 bg-[#0a0b10]/80 flex items-center justify-between gap-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Compass className="w-3.5 h-3.5 text-amber-200" />
          </div>
          <div>
            <h2 className="text-xs uppercase font-semibold font-mono tracking-wider text-amber-100 flex items-center gap-2">
              <span>Bestiary Catalogue</span>
              <span className="text-[10px] text-slate-400 font-mono font-normal hidden sm:inline">
                ({allCreatures.length} Archetypes & Personal Leviathans)
              </span>
            </h2>
          </div>
        </div>

        {/* Center Mode Switcher */}
        <div className="flex items-center p-0.5 bg-black/60 border border-white/10 rounded-xl">
          <button
            onClick={() => setMode('creatures')}
            className={`flex items-center gap-2 px-3.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              mode === 'creatures'
                ? 'bg-[#c5a059]/20 text-amber-100 border border-[#c5a059]/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Creatures ({allCreatures.length})</span>
          </button>
          <button
            onClick={() => setMode('discover')}
            className={`flex items-center gap-2 px-3.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              mode === 'discover'
                ? 'bg-[#c5a059]/20 text-amber-100 border border-[#c5a059]/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Discover & Inquire</span>
          </button>
        </div>

        {/* Right Tools: Export & Close */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => exportBestiaryToJson()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-amber-200 hover:text-amber-100 border border-[#c5a059]/30 rounded-lg text-xs font-mono transition-colors cursor-pointer"
            title="Download JSON file with complete catalogue and custom records"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Bestiary</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/10 transition-colors cursor-pointer"
            title="Return to World Space (Esc)"
            aria-label="Close Explore View"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>
      </div>

      {/* Save / Notice Alert */}
      {saveSuccessNotice && (
        <div className="bg-emerald-950/80 border-b border-emerald-500/30 text-emerald-200 text-xs px-6 py-2 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveSuccessNotice}</span>
        </div>
      )}

      {/* Main Content Area */}
      {mode === 'creatures' ? (
        <div className="flex-1 flex overflow-hidden">
          <ExploreCreatureList
            creatures={filteredCreatures}
            allCount={allCreatures.length}
            catalogueCount={42}
            foundationalCount={3}
            customCount={userRecords.length}
            selectedId={selectedId}
            onSelectId={(id) => {
              setSelectedId(id);
              setIsEditing(false);
            }}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filter={filter}
            onFilterChange={setFilter}
          />

          <ExploreCreatureDetail
            creature={currentCreature}
            isEditing={isEditing}
            editForm={editForm}
            onFormChange={setEditForm}
            onStartEdit={handleStartEdit}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={() => setIsEditing(false)}
            onSwitchToDiscover={() => setMode('discover')}
            confirmDeleteId={confirmDeleteId}
            onConfirmDelete={handleDeleteCustomRecord}
            onCancelDelete={() => setConfirmDeleteId(null)}
            onRequestDelete={(id) => setConfirmDeleteId(id)}
          />
        </div>
      ) : (
        <ExploreDiscoverChat
          currentCreature={currentCreature}
          discoverMessages={discoverMessages}
          chatInput={chatInput}
          isChatLoading={isChatLoading}
          chatError={chatError}
          onInputChange={setChatInput}
          onSendMessage={handleSendDiscoverChat}
        />
      )}
    </div>
  );
};
