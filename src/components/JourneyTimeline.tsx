import React, { useState, useMemo } from 'react';
import { JourneyEntry } from '../types';
import { describeEntry, formatDateTime, DialName } from '../utils/journeyFormat';

interface JourneyTimelineProps {
  journey: JourneyEntry[];
}

const DIAL_LABELS: Record<DialName, string> = {
  size: 'Size',
  distance: 'Distance',
  ferocity: 'Ferocity',
};

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({ journey }) => {
  const [showAll, setShowAll] = useState(false);

  // Compute descriptions relative to chronological predecessor, then reverse for newest-first display
  const items = useMemo(() => {
    if (!journey || journey.length === 0) return [];
    return journey
      .map((entry, idx) => ({
        entry,
        desc: describeEntry(entry, idx > 0 ? journey[idx - 1] : undefined),
      }))
      .reverse();
  }, [journey]);

  if (items.length === 0) {
    return null;
  }

  const visibleItems = showAll ? items : items.slice(0, 5);
  const hasMore = items.length > 5;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
          Journey Log ({items.length})
        </span>
        {hasMore && (
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            {showAll ? 'Show less' : `Show all (${items.length})`}
          </button>
        )}
      </div>

      <ol className="relative border-l border-white/10 ml-2 space-y-4" aria-label="Monster journey timeline">
        {visibleItems.map(({ entry, desc }) => {
          const isSpawn = entry.kind === 'spawn';
          const isSlain = entry.kind === 'slain';

          return (
            <li
              key={entry.id}
              className="ml-3 pl-1"
              aria-label={`${desc.label} entry at ${formatDateTime(entry.at)}`}
            >
              {/* Timeline marker node */}
              <div
                className={`absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full border ${
                  isSlain
                    ? 'bg-emerald-500 border-emerald-300'
                    : isSpawn
                    ? 'bg-amber-500 border-amber-300'
                    : 'bg-cyan-500 border-cyan-300'
                }`}
                aria-hidden="true"
              />

              <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 space-y-2">
                {/* Header: Label badge and timestamp */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded tracking-wider uppercase ${
                      isSlain
                        ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/50'
                        : isSpawn
                        ? 'bg-amber-950/70 text-amber-300 border border-amber-800/50'
                        : 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/50'
                    }`}
                  >
                    {desc.label}
                  </span>
                  <time
                    dateTime={entry.at}
                    className="text-[10px] font-mono text-slate-400"
                  >
                    {formatDateTime(entry.at)}
                  </time>
                </div>

                {/* Dial changes */}
                {desc.changes.length > 0 && (
                  <div className="space-y-1 font-mono text-xs">
                    {desc.changes.map((change) => {
                      const isEasing = change.direction === 'easing';
                      return (
                        <div
                          key={change.dial}
                          className="flex items-center justify-between text-[11px] py-0.5 px-2 rounded bg-black/20"
                        >
                          <span className="text-slate-300">
                            {DIAL_LABELS[change.dial]} {change.from} → {change.to}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 font-semibold text-[10px] uppercase tracking-wider ${
                              isEasing
                                ? 'text-teal-300'
                                : 'text-rose-300'
                            }`}
                          >
                            <span>{isEasing ? 'easing' : 'worsening'}</span>
                            <span aria-hidden="true">{isEasing ? '▼' : '▲'}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Initial state summary if spawn */}
                {isSpawn && (
                  <div className="font-mono text-[10px] text-slate-400 flex gap-3">
                    <span>Size {entry.size}</span>
                    <span>·</span>
                    <span>Distance {entry.distance}</span>
                    <span>·</span>
                    <span>Ferocity {entry.ferocity}</span>
                  </div>
                )}

                {/* Journey Note with preserved whitespace */}
                {entry.note && (
                  <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed border-t border-white/5 pt-1.5 mt-1 font-sans">
                    {entry.note}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
