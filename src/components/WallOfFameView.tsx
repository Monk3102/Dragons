import React, { useState, useMemo, useEffect } from 'react';
import { Monster } from '../types';
import { useMonsters } from '../store/monsterStore';
import { ARCHETYPE_CATALOGUE } from '../data/archetypesCatalogue';
import { computeWallStats, sortSlain, filterByCreature, getFightLengthInDays, WallSortKey } from '../utils/wallStats';
import { formatDateTime } from '../utils/journeyFormat';
import { JourneyTimeline } from './JourneyTimeline';
import { ConfirmDialog } from './ConfirmDialog';
import { Trophy, X, Trash2, ChevronDown, ChevronUp, Calendar, Clock, BookOpen } from 'lucide-react';

export interface WallOfFameViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WallOfFameView: React.FC<WallOfFameViewProps> = ({ isOpen, onClose }) => {
  const { monsters, deleteMonster } = useMonsters();

  const [sortKey, setSortKey] = useState<WallSortKey>('newest-slain');
  const [creatureFilter, setCreatureFilter] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [monsterToDelete, setMonsterToDelete] = useState<Monster | null>(null);

  // Esc key closes Wall of Fame (unless a confirmation dialog is active)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (monsterToDelete) return; // Let confirm dialog handle Esc
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, monsterToDelete, onClose]);

  // All slain monsters
  const slainMonsters = useMemo(() => {
    return monsters.filter((m) => m.status === 'slain');
  }, [monsters]);

  // Aggregate statistics computed using wallStats helper
  const stats = useMemo(() => {
    return computeWallStats(slainMonsters);
  }, [slainMonsters]);

  // Distinct creature types that appear in slain list
  const availableCreatureTypes = useMemo(() => {
    const typeSet = new Set<string>();
    slainMonsters.forEach((m) => typeSet.add(m.creatureTypeId));
    return Array.from(typeSet).map((id) => {
      const entry = ARCHETYPE_CATALOGUE.find((a) => a.id === id);
      return { id, name: entry ? entry.name : id };
    });
  }, [slainMonsters]);

  // Filtered and sorted cards (memoized)
  const displayedMonsters = useMemo(() => {
    const filtered = filterByCreature(slainMonsters, creatureFilter);
    return sortSlain(filtered, sortKey);
  }, [slainMonsters, creatureFilter, sortKey]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteConfirm = () => {
    if (!monsterToDelete) return;
    deleteMonster(monsterToDelete.id);
    setMonsterToDelete(null);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Wall of Fame"
      className="fixed inset-0 z-50 bg-[#07090e]/98 backdrop-blur-xl flex flex-col text-slate-100 overflow-hidden animate-in fade-in duration-200"
    >
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-white/10 bg-[#0b0d14]/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#c5a059]/15 border border-[#c5a059]/40 text-[#c5a059] shadow-[0_0_16px_rgba(197,160,89,0.2)]">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-['Cinzel'] tracking-wider text-white flex items-center gap-2">
              <span>WALL OF FAME</span>
              <span className="text-xs font-mono font-normal text-[#c5a059] px-2 py-0.5 rounded bg-[#c5a059]/10 border border-[#c5a059]/30">
                {slainMonsters.length} {slainMonsters.length === 1 ? 'Monster Slain' : 'Monsters Slain'}
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              The monumental inner dragons you have confronted, unmasked, and laid to rest.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          title="Return to World (Esc)"
          aria-label="Close Wall of Fame"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Header Stats Bar */}
        <section
          aria-label="Wall of Fame Statistics"
          className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono"
        >
          {/* Total Slain */}
          <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-1">
            <span className="text-[10px] tracking-wider text-slate-400 uppercase block">
              Total Slain
            </span>
            <div className="text-2xl font-bold text-amber-200">
              {stats.totalSlain}
            </div>
            <div className="text-[10px] text-slate-500">Conquered threats</div>
          </div>

          {/* Longest Fight */}
          <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-1">
            <span className="text-[10px] tracking-wider text-slate-400 uppercase block">
              Longest Fight
            </span>
            <div className="text-2xl font-bold text-cyan-200">
              {stats.longestFightDays} <span className="text-xs font-normal text-slate-400">days</span>
            </div>
            <div className="text-[10px] text-slate-500">From spawn to victory</div>
          </div>

          {/* Average Fight Length */}
          <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-1">
            <span className="text-[10px] tracking-wider text-slate-400 uppercase block">
              Average Fight Length
            </span>
            <div className="text-2xl font-bold text-slate-200">
              {stats.averageFightDays} <span className="text-xs font-normal text-slate-400">days</span>
            </div>
            <div className="text-[10px] text-slate-500">Mean confrontation time</div>
          </div>

          {/* Most Ferocious When Slain */}
          <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-1">
            <span className="text-[10px] tracking-wider text-slate-400 uppercase block">
              Most Ferocious Slain
            </span>
            <div className="text-sm font-bold text-rose-300 font-['Cinzel'] truncate mt-1">
              {stats.mostFerociousMonster ? stats.mostFerociousMonster.name : '—'}
            </div>
            <div className="text-[10px] text-slate-400">
              {stats.mostFerociousMonster
                ? `Ferocity ${stats.mostFerociousMonster.ferocity}/10`
                : 'No monsters slain yet'}
            </div>
          </div>
        </section>

        {/* Filters and Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
          <div className="flex items-center gap-3 flex-wrap text-xs font-mono">
            {/* Sort Selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Sort by:</span>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as WallSortKey)}
                className="bg-[#0b0d14] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-[#c5a059] transition-colors cursor-pointer"
              >
                <option value="newest-slain">Newest Slain</option>
                <option value="longest-fight">Longest Fight</option>
                <option value="highest-ferocity">Highest Ferocity</option>
              </select>
            </div>

            {/* Creature Filter */}
            {availableCreatureTypes.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Creature:</span>
                <select
                  value={creatureFilter}
                  onChange={(e) => setCreatureFilter(e.target.value)}
                  className="bg-[#0b0d14] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-[#c5a059] transition-colors cursor-pointer"
                >
                  <option value="all">All Creatures ({slainMonsters.length})</option>
                  {availableCreatureTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="text-xs font-mono text-slate-400">
            Showing {displayedMonsters.length} of {slainMonsters.length}
          </div>
        </div>

        {/* Empty State */}
        {displayedMonsters.length === 0 && (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-500">
              <Trophy className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-sm text-slate-400 font-serif italic max-w-md mx-auto">
              No monsters slain yet. When you defeat one, it will be remembered here.
            </p>
          </div>
        )}

        {/* Slain Monster Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedMonsters.map((monster) => {
            const archetype = ARCHETYPE_CATALOGUE.find((a) => a.id === monster.creatureTypeId);
            const creatureName = archetype ? archetype.name : monster.creatureTypeId;
            const fightDays = getFightLengthInDays(monster.createdAt, monster.slainAt);
            const spawnEntry = monster.journey && monster.journey.length > 0 ? monster.journey[0] : null;
            const isExpanded = expandedIds.has(monster.id);

            return (
              <article
                key={monster.id}
                className="bg-[#0b0d14]/90 border border-white/10 hover:border-[#c5a059]/40 rounded-xl p-5 space-y-4 shadow-xl transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-[10px] font-mono tracking-wider text-amber-300 uppercase">
                        <span>{creatureName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-emerald-400">Slain</span>
                      </div>
                      <h2 className="text-lg font-bold font-['Cinzel'] tracking-wide text-white mt-0.5">
                        {monster.name}
                      </h2>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setMonsterToDelete(monster)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Delete permanently"
                        aria-label={`Delete permanently: ${monster.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Problem Description */}
                  {monster.problem && (
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {monster.problem}
                    </p>
                  )}

                  {/* Meta / Timeline info */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-black/40 border border-white/5 rounded-lg font-mono text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">
                        {formatDateTime(monster.createdAt)} → {monster.slainAt ? formatDateTime(monster.slainAt) : '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Fight: {fightDays} days</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <BookOpen className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{monster.journey.length} journal {monster.journey.length === 1 ? 'entry' : 'entries'}</span>
                    </div>
                  </div>

                  {/* Dials at spawn vs at end */}
                  <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-lg space-y-1.5 font-mono text-[11px]">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Evolution of Dials
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-1.5 bg-black/30 rounded border border-white/5 space-y-0.5">
                        <span className="text-[9px] text-slate-400 block uppercase">At Spawn</span>
                        <div className="text-slate-300 text-[10px]">
                          Size {spawnEntry ? spawnEntry.size : monster.size} · Dist {spawnEntry ? spawnEntry.distance : monster.distance} · Fero {spawnEntry ? spawnEntry.ferocity : monster.ferocity}
                        </div>
                      </div>
                      <div className="p-1.5 bg-black/30 rounded border border-white/5 space-y-0.5">
                        <span className="text-[9px] text-emerald-400 block uppercase">When Slain</span>
                        <div className="text-slate-200 text-[10px] font-semibold">
                          Size {monster.size} · Dist {monster.distance} · Fero {monster.ferocity}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Final Note */}
                  {monster.finalNote && (
                    <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-lg space-y-1">
                      <span className="text-[10px] font-mono tracking-wider text-emerald-400 uppercase block">
                        Victory Lesson / Final Reflection
                      </span>
                      <p className="text-xs text-slate-200 italic whitespace-pre-wrap leading-relaxed">
                        "{monster.finalNote}"
                      </p>
                    </div>
                  )}

                  {/* Expandable Journey Timeline (rendered strictly only when expanded) */}
                  {isExpanded && monster.journey.length > 0 && (
                    <div className="pt-2 border-t border-white/10 animate-in fade-in duration-200">
                      <JourneyTimeline journey={monster.journey} />
                    </div>
                  )}
                </div>

                {/* Card Footer: Show/Hide Journey Button */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <button
                    onClick={() => toggleExpand(monster.id)}
                    className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span>Hide journey</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        <span>Show journey ({monster.journey.length})</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setMonsterToDelete(monster)}
                    className="text-[11px] font-mono text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    Delete permanently
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Delete Permanently Confirmation Dialog with required "DELETE" input */}
      <ConfirmDialog
        isOpen={Boolean(monsterToDelete)}
        onClose={() => setMonsterToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Permanently?"
        message={
          <div className="space-y-2">
            <p>
              This will permanently delete{' '}
              <strong className="text-white font-['Cinzel']">
                {monsterToDelete ? monsterToDelete.name : 'this monster'}
              </strong>{' '}
              from your Wall of Fame.
            </p>
            <p className="text-rose-300 text-xs">
              This action cannot be undone. We strongly recommend exporting a backup archive before permanently deleting monsters.
            </p>
          </div>
        }
        confirmText="Permanently Delete"
        cancelText="Cancel"
        requireTypedConfirmation="DELETE"
        isDanger={true}
      />
    </div>
  );
};
