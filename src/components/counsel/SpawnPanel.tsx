import React, { useState, useEffect } from 'react';
import { ARCHETYPE_CATALOGUE } from '../../data/archetypesCatalogue';
import { createMonster } from '../../store/monsterLogic';
import { useMonsters } from '../../store/monsterStore';
import { Dial } from '../../types';
import { Proposal } from '../../../server/counsel';
import { Sparkles, AlertCircle } from 'lucide-react';

interface SpawnPanelProps {
  proposal: Proposal | null;
  onSpawnSuccess: (newMonsterId: string) => void;
  onHasDirtyFormChange: (isDirty: boolean) => void;
}

export const SpawnPanel: React.FC<SpawnPanelProps> = ({
  proposal,
  onSpawnSuccess,
  onHasDirtyFormChange,
}) => {
  const { addMonster } = useMonsters();

  // Form State with required defaults
  const [name, setName] = useState('');
  const [creatureTypeId, setCreatureTypeId] = useState('archetype-dragon');
  const [problem, setProblem] = useState('');
  const [size, setSize] = useState<Dial>(5);
  const [distance, setDistance] = useState<Dial>(5);
  const [ferocity, setFerocity] = useState<Dial>(5);
  const [note, setNote] = useState('');

  // Track whether the user has manually edited each field since the last proposal
  const [userEdited, setUserEdited] = useState<{
    name: boolean;
    creatureTypeId: boolean;
    problem: boolean;
    size: boolean;
    distance: boolean;
    ferocity: boolean;
    note: boolean;
  }>({
    name: false,
    creatureTypeId: false,
    problem: false,
    size: false,
    distance: false,
    ferocity: false,
    note: false,
  });

  const [activeProposal, setActiveProposal] = useState<Proposal | null>(null);
  const [spawnError, setSpawnError] = useState<string | null>(null);

  // Check if form has any typed content (for Esc confirmation)
  useEffect(() => {
    const isDirty =
      name.trim().length > 0 ||
      problem.trim().length > 0 ||
      note.trim().length > 0;
    onHasDirtyFormChange(isDirty);
  }, [name, problem, note, onHasDirtyFormChange]);

  // When a proposal arrives, fill unedited fields
  useEffect(() => {
    if (!proposal) return;

    setActiveProposal(proposal);

    if (!userEdited.name) {
      setName(proposal.name);
    }
    if (!userEdited.creatureTypeId) {
      setCreatureTypeId(proposal.creatureTypeId);
    }
    if (!userEdited.problem) {
      setProblem(proposal.problem);
    }
    if (!userEdited.size) {
      setSize(proposal.size);
    }
    if (!userEdited.distance) {
      setDistance(proposal.distance);
    }
    if (!userEdited.ferocity) {
      setFerocity(proposal.ferocity);
    }
    if (!userEdited.note) {
      setNote(proposal.reasoning);
    }
  }, [proposal, userEdited]);

  const selectedArchetype =
    ARCHETYPE_CATALOGUE.find((a) => a.id === creatureTypeId) || ARCHETYPE_CATALOGUE[0];

  // Inline Validation Reasons
  const validationIssues: string[] = [];
  if (!name.trim()) {
    validationIssues.push('Monster name is required (1 to 80 characters).');
  } else if (name.trim().length > 80) {
    validationIssues.push('Monster name exceeds 80 characters.');
  }

  if (problem.length > 300) {
    validationIssues.push('Problem description cannot exceed 300 characters.');
  }

  if (!note.trim()) {
    validationIssues.push('A spawn note is required (1 to 500 characters).');
  } else if (note.trim().length > 500) {
    validationIssues.push('Spawn note cannot exceed 500 characters.');
  }

  const isValid = validationIssues.length === 0;

  const handleSpawn = () => {
    setSpawnError(null);

    const input = {
      name: name.trim(),
      creatureTypeId,
      problem: problem.trim(),
      size,
      distance,
      ferocity,
      note: note.trim(),
    };

    // Step 1: Validate with pure createMonster logic
    const createRes = createMonster(input);
    if (!createRes.ok) {
      setSpawnError(createRes.error);
      return;
    }

    // Step 2: Add to store
    const storeRes = addMonster(input);
    if (!storeRes.ok || !storeRes.monster) {
      setSpawnError(storeRes.error || 'Failed to save monster to journal.');
      return;
    }

    // Success: notify parent with the new monster ID
    onSpawnSuccess(storeRes.monster.id);
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0d14]/90 border border-white/10 rounded-2xl p-5 md:p-6 overflow-y-auto scrollbar-thin text-slate-200 text-xs font-mono">
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-white tracking-wide font-['Cinzel']">
            MANIFEST DRAGON FORM
          </h2>
        </div>
        {activeProposal && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30">
            Sentry Proposal Loaded
          </span>
        )}
      </div>

      <div className="space-y-4 flex-1">
        {/* Name Field */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label htmlFor="spawn-name" className="text-slate-300 font-semibold">
              Monster Name *
            </label>
            <span className="text-[10px] text-slate-500">{name.length}/80</span>
          </div>
          <input
            id="spawn-name"
            type="text"
            value={name}
            maxLength={80}
            onChange={(e) => {
              setName(e.target.value);
              setUserEdited((prev) => ({ ...prev, name: true }));
            }}
            placeholder="e.g. The Inertia Leviathan"
            className="w-full px-3 py-2 bg-black/50 border border-white/15 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 text-xs font-sans"
          />
        </div>

        {/* Creature Type Select */}
        <div className="space-y-1">
          <label htmlFor="spawn-creature-type" className="text-slate-300 font-semibold block">
            Creature Archetype
          </label>
          <select
            id="spawn-creature-type"
            value={creatureTypeId}
            onChange={(e) => {
              setCreatureTypeId(e.target.value);
              setUserEdited((prev) => ({ ...prev, creatureTypeId: true }));
            }}
            className="w-full px-3 py-2 bg-[#121620] border border-white/15 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500/50 text-xs font-sans cursor-pointer"
          >
            {ARCHETYPE_CATALOGUE.map((archetype) => (
              <option key={archetype.id} value={archetype.id} className="bg-[#0b0d14]">
                {archetype.name} (#{archetype.index})
              </option>
            ))}
          </select>
          {selectedArchetype?.workingMeaning && (
            <p className="text-[11px] text-amber-300/80 italic mt-1 font-sans">
              "{selectedArchetype.workingMeaning}"
            </p>
          )}
        </div>

        {/* Problem Description */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label htmlFor="spawn-problem" className="text-slate-300 font-semibold">
              The Problem It Represents
            </label>
            <span className="text-[10px] text-slate-500">{problem.length}/300</span>
          </div>
          <textarea
            id="spawn-problem"
            value={problem}
            maxLength={300}
            rows={3}
            onChange={(e) => {
              setProblem(e.target.value);
              setUserEdited((prev) => ({ ...prev, problem: true }));
            }}
            placeholder="What inner barrier or fear does this entity embody?"
            className="w-full px-3 py-2 bg-black/50 border border-white/15 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 text-xs font-sans resize-none"
          />
        </div>

        {/* Sliders */}
        <div className="space-y-3.5 pt-1 border-t border-white/10">
          {/* Size */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label htmlFor="spawn-size" className="text-slate-300">
                Size (1 tiny, 10 huge)
              </label>
              <span className="text-amber-300 font-bold">{size}/10</span>
            </div>
            <input
              id="spawn-size"
              type="range"
              min={1}
              max={10}
              step={1}
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value) as Dial);
                setUserEdited((prev) => ({ ...prev, size: true }));
              }}
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-white/10 rounded"
            />
            {activeProposal?.dialReasons?.size && (
              <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                {activeProposal.dialReasons.size}
              </p>
            )}
          </div>

          {/* Distance */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label htmlFor="spawn-distance" className="text-slate-300">
                Distance (1 very near, 10 very far)
              </label>
              <span className="text-cyan-300 font-bold">{distance}/10</span>
            </div>
            <input
              id="spawn-distance"
              type="range"
              min={1}
              max={10}
              step={1}
              value={distance}
              onChange={(e) => {
                setDistance(Number(e.target.value) as Dial);
                setUserEdited((prev) => ({ ...prev, distance: true }));
              }}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded"
            />
            {activeProposal?.dialReasons?.distance && (
              <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                {activeProposal.dialReasons.distance}
              </p>
            )}
          </div>

          {/* Ferocity */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label htmlFor="spawn-ferocity" className="text-slate-300">
                Ferocity (1 mild, 10 severe)
              </label>
              <span className="text-red-400 font-bold">{ferocity}/10</span>
            </div>
            <input
              id="spawn-ferocity"
              type="range"
              min={1}
              max={10}
              step={1}
              value={ferocity}
              onChange={(e) => {
                setFerocity(Number(e.target.value) as Dial);
                setUserEdited((prev) => ({ ...prev, ferocity: true }));
              }}
              className="w-full accent-red-500 cursor-pointer h-1.5 bg-white/10 rounded"
            />
            {activeProposal?.dialReasons?.ferocity && (
              <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                {activeProposal.dialReasons.ferocity}
              </p>
            )}
          </div>
        </div>

        {/* Initial Journal Note */}
        <div className="space-y-1 pt-1 border-t border-white/10">
          <div className="flex justify-between items-center">
            <label htmlFor="spawn-note" className="text-slate-300 font-semibold">
              Why this monster? (saved as the first journal entry) *
            </label>
            <span className="text-[10px] text-slate-500">{note.length}/500</span>
          </div>
          <textarea
            id="spawn-note"
            value={note}
            maxLength={500}
            rows={3}
            onChange={(e) => {
              setNote(e.target.value);
              setUserEdited((prev) => ({ ...prev, note: true }));
            }}
            placeholder="Document why this monster is appearing in your inner void right now..."
            className="w-full px-3 py-2 bg-black/50 border border-white/15 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 text-xs font-sans resize-none"
          />
        </div>
      </div>

      {/* Validation Messages & Spawn Action */}
      <div className="pt-4 border-t border-white/10 space-y-2.5 mt-2">
        {!isValid && (
          <div className="space-y-1 text-[11px] text-amber-300/90 font-sans">
            {validationIssues.map((issue, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70" />
                <span>{issue}</span>
              </div>
            ))}
          </div>
        )}

        {spawnError && (
          <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{spawnError}</span>
          </div>
        )}

        <button
          onClick={handleSpawn}
          disabled={!isValid}
          className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-xs tracking-wider uppercase transition-all shadow-lg shadow-amber-950/40 cursor-pointer"
        >
          Spawn Dragon into Void
        </button>
      </div>
    </div>
  );
};
