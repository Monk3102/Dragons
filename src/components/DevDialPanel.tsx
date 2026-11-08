import React from 'react';
import { useMonsters } from '../store/monsterStore';
import { ARCHETYPE_CATALOGUE } from '../data/archetypesCatalogue';
import { Dial } from '../types';
import { X, Plus, Trash2, Sliders } from 'lucide-react';

// Unique marker to test dead-code elimination in production bundle
export const DEV_PANEL_BUILD_MARKER = 'DEV_DIAL_PANEL_INTERNAL_DEBUG_ONLY';

interface DevDialPanelProps {
  onClose: () => void;
}

export default function DevDialPanel({ onClose }: DevDialPanelProps) {
  const { monsters, updateDials, addMonster, deleteMonster } = useMonsters();
  const aliveMonsters = monsters.filter((m) => m.status === 'alive');

  const handleDialChange = (
    id: string,
    current: { size: Dial; distance: Dial; ferocity: Dial },
    key: 'size' | 'distance' | 'ferocity',
    rawVal: number
  ) => {
    const val = Math.min(10, Math.max(1, Math.round(rawVal))) as Dial;
    if (current[key] === val) return;
    const newDials = { ...current, [key]: val };
    updateDials(id, newDials, 'Dev panel adjustment');
  };

  const handleAddTestMonster = () => {
    const randomSize = (Math.floor(Math.random() * 10) + 1) as Dial;
    const randomDistance = (Math.floor(Math.random() * 10) + 1) as Dial;
    const randomFerocity = (Math.floor(Math.random() * 10) + 1) as Dial;
    const randomArchetype =
      ARCHETYPE_CATALOGUE[Math.floor(Math.random() * ARCHETYPE_CATALOGUE.length)] ||
      ARCHETYPE_CATALOGUE[0];
    const n = monsters.length + 1;

    addMonster({
      name: `Test monster ${n}`,
      creatureTypeId: randomArchetype.id,
      problem: randomArchetype.workingMeaning || 'Dev test problem',
      size: randomSize,
      distance: randomDistance,
      ferocity: randomFerocity,
      note: 'Dev panel test monster',
      isSample: true,
    });
  };

  const handleRemoveAllSampleMonsters = () => {
    monsters.forEach((m) => {
      if (m.isSample) {
        deleteMonster(m.id);
      }
    });
  };

  return (
    <div className="fixed top-16 left-6 z-40 w-84 max-h-[80vh] bg-[#0c1017]/95 border border-amber-500/30 rounded-xl shadow-2xl backdrop-blur-md flex flex-col text-slate-200 text-xs font-mono select-none animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-2 text-amber-300 font-semibold tracking-wide">
          <Sliders className="w-3.5 h-3.5" />
          <span>DEV DIAL PANEL (D)</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close Dev Panel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="p-3 border-b border-white/10 grid grid-cols-2 gap-2 bg-white/[0.02]">
        <button
          onClick={handleAddTestMonster}
          className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>Add test monster</span>
        </button>
        <button
          onClick={handleRemoveAllSampleMonsters}
          className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-500/30 rounded-lg transition-colors cursor-pointer"
        >
          <Trash2 className="w-3 h-3" />
          <span>Remove samples</span>
        </button>
      </div>

      {/* Monsters Dial List */}
      <div className="p-3 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
        {aliveMonsters.length === 0 ? (
          <div className="text-center py-6 text-slate-500 italic">No alive monsters</div>
        ) : (
          aliveMonsters.map((monster) => {
            const dials = {
              size: monster.size,
              distance: monster.distance,
              ferocity: monster.ferocity,
            };

            return (
              <div
                key={monster.id}
                className="p-2.5 rounded-lg bg-black/50 border border-white/5 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-100 truncate max-w-[170px]" title={monster.name}>
                    {monster.name}
                  </span>
                  {monster.isSample && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      sample
                    </span>
                  )}
                </div>

                {/* Size slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Size</span>
                    <span className="text-amber-300">{monster.size}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={monster.size}
                    onChange={(e) =>
                      handleDialChange(monster.id, dials, 'size', Number(e.target.value))
                    }
                    className="w-full accent-amber-400 cursor-pointer h-1.5 bg-white/10 rounded"
                  />
                </div>

                {/* Distance slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Distance (1=near, 10=far)</span>
                    <span className="text-cyan-300">{monster.distance}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={monster.distance}
                    onChange={(e) =>
                      handleDialChange(monster.id, dials, 'distance', Number(e.target.value))
                    }
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded"
                  />
                </div>

                {/* Ferocity slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Ferocity</span>
                    <span className="text-red-400">{monster.ferocity}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={monster.ferocity}
                    onChange={(e) =>
                      handleDialChange(monster.id, dials, 'ferocity', Number(e.target.value))
                    }
                    className="w-full accent-red-500 cursor-pointer h-1.5 bg-white/10 rounded"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
