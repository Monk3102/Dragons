import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Compass,
  BookOpen,
  Download,
  Search,
  Sparkles,
  Send,
  Edit3,
  Trash2,
  Save,
  X,
  RotateCcw,
  Bot,
  User as UserIcon,
  CheckCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { ArchetypeCatalogueEntry, MonsterRecord, DragonProblem } from '../types';
import { ARCHETYPE_CATALOGUE } from '../data/archetypesCatalogue';
import { INITIAL_DRAGONS } from '../data/dragons';
import { CreaturePreviewCanvas } from './CreaturePreviewCanvas';
import {
  getLocalBestiaryRecords,
  saveLocalBestiaryRecord,
  deleteLocalBestiaryRecord,
  exportBestiaryToJson,
} from '../utils/localBestiary';

interface ExploreViewProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedId?: string | null;
}

type ExploreMode = 'creatures' | 'discover';
type FilterCategory = 'all' | 'catalogue' | 'foundational' | 'saved';

interface DiscoverChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
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
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Sync initial selection
  useEffect(() => {
    if (initialSelectedId) {
      setSelectedId(initialSelectedId);
    }
  }, [initialSelectedId]);

  // Combined list of all items for browsing
  const allCreatures = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      index?: number;
      isFoundational?: boolean;
      workingMeaning?: string;
      subtitle?: string;
      category?: string;
      temperament?: string;
      manifestation?: string;
      voice?: string;
      roots?: string;
      somaticFeeling?: string;
      inquiry?: string;
      status?: string;
      isCustom?: boolean;
    }> = [];

    // 1. Foundational Dragons
    INITIAL_DRAGONS.forEach((d) => {
      // Check if user has an override in local bestiary
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
    return allCreatures.find((c) => c.id === selectedId) || allCreatures[0];
  }, [allCreatures, selectedId]);

  // Scroll chat to bottom
  useEffect(() => {
    if (mode === 'discover') {
      chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [discoverMessages, mode, isChatLoading]);

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
      status: (currentCreature.status as any) || 'Formidable',
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
      status: (editForm.status as any) || 'Formidable',
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
          message: userText,
          systemInstruction,
          history: discoverMessages
            .slice(-6)
            .map((m) => ({ role: m.role, content: m.content })),
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
    } catch (err: any) {
      setChatError(
        'The reflection channel encountered an interruption. Please try your inquiry again.'
      );
    } finally {
      setIsChatLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 bg-[#07090e]/95 backdrop-blur-xl flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-[#c5a059]/20 bg-[#0a0b10] flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Compass className="w-4 h-4 text-amber-200" />
          </div>
          <div>
            <h1 className="text-base font-bold font-['Cinzel'] tracking-wider text-slate-100 flex items-center gap-2">
              <span>DRACO ANIMI</span>
              <span className="text-xs text-amber-400/80 font-normal font-sans">
                / Explore & Bestiary
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">
              Catalogue of 42 Mythological Archetypes & Personal Monsters
            </p>
          </div>
        </div>

        {/* Center Mode Switcher */}
        <div className="flex items-center p-1 bg-black/50 border border-white/10 rounded-xl">
          <button
            onClick={() => setMode('creatures')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
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
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportBestiaryToJson()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-amber-200 hover:text-amber-100 border border-[#c5a059]/30 rounded-lg text-xs font-mono transition-colors cursor-pointer"
            title="Download JSON file with complete catalogue and custom records"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Data (JSON)</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Return to World Space"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

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
          {/* Left Panel: Search & Creature Cards Grid/List */}
          <section className="w-full md:w-5/12 lg:w-4/12 border-r border-white/10 flex flex-col bg-[#08090d]">
            {/* Filter Chips & Search Bar */}
            <div className="p-4 border-b border-white/10 space-y-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search archetypes or working meanings..."
                  className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#c5a059]/50 font-sans"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono scrollbar-none">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    filter === 'all'
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  All ({allCreatures.length})
                </button>
                <button
                  onClick={() => setFilter('catalogue')}
                  className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    filter === 'catalogue'
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  Archetypes (42)
                </button>
                <button
                  onClick={() => setFilter('foundational')}
                  className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    filter === 'foundational'
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  Foundational (3)
                </button>
                {userRecords.length > 0 && (
                  <button
                    onClick={() => setFilter('saved')}
                    className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      filter === 'saved'
                        ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    Customized ({userRecords.length})
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Monster Cards List */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {filteredCreatures.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No creature matches found for &quot;{searchQuery}&quot;.
                </div>
              ) : (
                filteredCreatures.map((item) => {
                  const isSelected = item.id === selectedId;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedId(item.id);
                        setIsEditing(false);
                      }}
                      className={`w-full text-left p-3.5 transition-all flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-white/[0.08] border-l-2 border-[#c5a059]'
                          : 'hover:bg-white/[0.03] border-l-2 border-transparent'
                      }`}
                    >
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-amber-300/80 shrink-0">
                        {item.index ? `#${String(item.index).padStart(2, '0')}` : '3D'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-['Cinzel'] text-xs font-semibold text-slate-200 truncate">
                            {item.name}
                          </span>
                          {item.isCustom && (
                            <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30">
                              Custom
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 font-sans leading-relaxed">
                          {item.workingMeaning || item.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Right Panel: Detailed Dossier & Isolated 3D Preview Canvas */}
          <section className="hidden md:flex flex-1 flex-col overflow-y-auto bg-[#0a0b0e] p-6">
            {currentCreature ? (
              <div className="max-w-3xl mx-auto w-full space-y-6">
                {/* Dossier Header */}
                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#c5a059]/20 text-amber-200 border border-[#c5a059]/40">
                        {currentCreature.index
                          ? `ARCHETYPE #${currentCreature.index}`
                          : 'FOUNDATIONAL LEVIATHAN'}
                      </span>
                      {currentCreature.isCustom && (
                        <span className="font-mono text-[10px] text-amber-400 border border-amber-400/30 px-1.5 py-0.5 rounded">
                          Saved in Bestiary
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold font-['Cinzel'] tracking-wide text-slate-100">
                      {currentCreature.name}
                    </h2>
                    <p className="text-sm text-amber-200/90 font-serif italic mt-1">
                      {currentCreature.workingMeaning || currentCreature.subtitle}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isEditing ? (
                      <>
                        <button
                          onClick={handleStartEdit}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded-lg text-xs font-mono transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                          <span>Customize</span>
                        </button>
                        <button
                          onClick={() => {
                            setMode('discover');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c5a059]/20 hover:bg-[#c5a059]/30 text-amber-100 border border-[#c5a059]/40 rounded-lg text-xs font-mono transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Inquire</span>
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono transition-colors cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Record</span>
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg text-xs font-mono transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3D Preview Canvas: Isolated Placeholder */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>ARCHETYPAL GEOMETRY (PREVIEW PLACEHOLDER)</span>
                    <span className="text-[10px] text-amber-400/60">
                      Isolated from World Space
                    </span>
                  </div>
                  <CreaturePreviewCanvas
                    creatureName={currentCreature.name}
                    color="#1c202a"
                    accentColor="#c5a059"
                  />
                </div>

                {/* Characteristics and Editing Fields */}
                {!isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-1.5">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                        Canonical Working Meaning
                      </span>
                      <p className="text-xs text-slate-200 font-sans leading-relaxed">
                        {currentCreature.workingMeaning || 'Unspecified baseline.'}
                      </p>
                    </div>

                    <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-1.5">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                        Temperament & State
                      </span>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-200 font-sans">
                          {currentCreature.temperament || 'Dormant'}
                        </p>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-amber-300 border border-white/10">
                          {currentCreature.status || 'Formidable'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-1.5 md:col-span-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                        Manifestation Pattern
                      </span>
                      <p className="text-xs text-slate-300 font-sans leading-relaxed">
                        {currentCreature.manifestation}
                      </p>
                    </div>

                    <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-1.5">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                        Deceptive Whisper / Voice
                      </span>
                      <p className="text-xs text-amber-200/80 font-serif italic">
                        {currentCreature.voice}
                      </p>
                    </div>

                    <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-1.5">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                        Somatic Felt Sensation
                      </span>
                      <p className="text-xs text-slate-300 font-sans">
                        {currentCreature.somaticFeeling}
                      </p>
                    </div>

                    <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-1.5 md:col-span-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                        Core Psychological Roots
                      </span>
                      <p className="text-xs text-slate-300 font-sans leading-relaxed">
                        {currentCreature.roots}
                      </p>
                    </div>

                    <div className="p-4 bg-amber-950/20 border border-amber-500/20 rounded-xl space-y-1.5 md:col-span-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-amber-300/80">
                        Reflective Inquiry Question
                      </span>
                      <p className="text-xs text-amber-100/90 font-serif leading-relaxed">
                        {currentCreature.inquiry}
                      </p>
                    </div>

                    {currentCreature.isCustom && (
                      <div className="md:col-span-2 pt-2 flex items-center justify-end">
                        {confirmDeleteId === currentCreature.id ? (
                          <div className="flex items-center gap-2 bg-red-950/50 p-2 rounded-lg border border-red-500/30">
                            <span className="text-xs text-red-200">
                              Revert this record to baseline?
                            </span>
                            <button
                              onClick={() => handleDeleteCustomRecord(currentCreature.id)}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-mono"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 text-slate-400 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(currentCreature.id)}
                            className="flex items-center gap-1.5 text-xs text-red-400/80 hover:text-red-300 font-mono transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Revert to Canonical Baseline</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Edit Form */
                  <div className="space-y-4 bg-white/[0.02] border border-[#c5a059]/30 rounded-xl p-5">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="text-xs font-mono text-amber-300">
                        EDITING BESTIARY RECORD
                      </span>
                      <span className="text-[11px] text-slate-400 font-sans">
                        Changes are saved locally to DRACO_ANIMI_LOCAL_BESTIARY_v1
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-mono text-slate-400 mb-1">
                          Monster Name
                        </label>
                        <input
                          type="text"
                          value={editForm.name || ''}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, name: e.target.value }))
                          }
                          className="w-full px-3 py-1.5 bg-black/50 border border-white/15 rounded-lg text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono text-slate-400 mb-1">
                          Status
                        </label>
                        <select
                          value={editForm.status || 'Formidable'}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              status: e.target.value as any,
                            }))
                          }
                          className="w-full px-3 py-1.5 bg-black/50 border border-white/15 rounded-lg text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                        >
                          <option value="Formidable">Formidable</option>
                          <option value="Under Inspection">Under Inspection</option>
                          <option value="Acknowledged">Acknowledged</option>
                          <option value="Resting">Resting</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-mono text-slate-400 mb-1">
                          Working Meaning / Personal Archetype Summary
                        </label>
                        <input
                          type="text"
                          value={editForm.subtitle || ''}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, subtitle: e.target.value }))
                          }
                          className="w-full px-3 py-1.5 bg-black/50 border border-white/15 rounded-lg text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-mono text-slate-400 mb-1">
                          Manifestation (How this pattern shows up in daily life)
                        </label>
                        <textarea
                          rows={2}
                          value={editForm.manifestation || ''}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              manifestation: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-1.5 bg-black/50 border border-white/15 rounded-lg text-xs text-slate-100 focus:border-amber-400 focus:outline-none resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono text-slate-400 mb-1">
                          Deceptive Whisper / Inner Voice
                        </label>
                        <input
                          type="text"
                          value={editForm.voice || ''}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, voice: e.target.value }))
                          }
                          className="w-full px-3 py-1.5 bg-black/50 border border-white/15 rounded-lg text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono text-slate-400 mb-1">
                          Somatic / Physical Sensation
                        </label>
                        <input
                          type="text"
                          value={editForm.somaticFeeling || ''}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              somaticFeeling: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-1.5 bg-black/50 border border-white/15 rounded-lg text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-mono text-slate-400 mb-1">
                          Reflective Question / Inquiry
                        </label>
                        <input
                          type="text"
                          value={editForm.inquiry || ''}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, inquiry: e.target.value }))
                          }
                          className="w-full px-3 py-1.5 bg-black/50 border border-white/15 rounded-lg text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </section>
        </div>
      ) : (
        /* Discover Mode: AI Inquisitive Identification & Exploratory Reflection */
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#0a0b0e]">
          {/* Left Reference Bar: Active Creature Focus */}
          <div className="w-full md:w-80 border-r border-white/10 p-5 bg-[#08090d] space-y-4 shrink-0 overflow-y-auto">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-300">
              <Info className="w-4 h-4" />
              <span>CURRENT ARCHETYPE FOCUS</span>
            </div>

            <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-2">
              <div className="font-mono text-[10px] text-amber-200/70">
                {currentCreature.index ? `ARCHETYPE #${currentCreature.index}` : '3D LEVIATHAN'}
              </div>
              <h3 className="font-['Cinzel'] text-sm font-semibold text-slate-100">
                {currentCreature.name}
              </h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                {currentCreature.workingMeaning || currentCreature.subtitle}
              </p>
            </div>

            <div className="p-4 bg-amber-950/20 border border-amber-500/20 rounded-xl space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-amber-300/80">
                Guiding Inscription
              </span>
              <p className="text-xs text-amber-100/90 font-serif italic">
                {currentCreature.inquiry}
              </p>
            </div>

            <div className="p-3 bg-black/40 border border-white/5 rounded-lg space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                Interaction Boundary
              </span>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                The Discover oracle does not dispense advice, action plans, or quick fixes.
                Its sole purpose is to listen and help identify the shape and origin of the monster.
              </p>
            </div>
          </div>

          {/* Right: Exploratory Chat Stream */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#07090c]">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {discoverMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-2xl ${
                    msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      msg.role === 'user'
                        ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-300 border border-white/10'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <UserIcon className="w-3.5 h-3.5" />
                    ) : (
                      <Bot className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div
                    className={`p-4 rounded-xl text-xs leading-relaxed space-y-1 ${
                      msg.role === 'user'
                        ? 'bg-amber-950/30 border border-amber-500/30 text-amber-100 rounded-tr-none'
                        : 'bg-white/[0.04] border border-white/10 text-slate-200 rounded-tl-none font-serif text-[13px]'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <div className="text-[9px] font-mono text-slate-500 text-right pt-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex gap-3 max-w-xl mr-auto animate-pulse">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  </div>
                  <div className="p-3 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-slate-400 font-mono">
                    Reflecting on the nature of the beast...
                  </div>
                </div>
              )}

              {chatError && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{chatError}</span>
                </div>
              )}

              <div ref={chatScrollRef} />
            </div>

            {/* Chat Input Box */}
            <form
              onSubmit={handleSendDiscoverChat}
              className="p-4 border-t border-white/10 bg-[#0a0b10] flex items-center gap-3 shrink-0"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Describe what you are wrestling with (exploring ${currentCreature?.name})...`}
                disabled={isChatLoading}
                className="flex-1 px-4 py-2.5 bg-black/50 border border-white/15 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#c5a059]/60 font-sans"
              />
              <button
                type="submit"
                disabled={isChatLoading || !chatInput.trim()}
                className="px-4 py-2.5 bg-[#c5a059] hover:bg-[#d6b168] disabled:opacity-40 text-black font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Inquire</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
