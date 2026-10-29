import React from 'react';
import { Search, X } from 'lucide-react';
import { ExploreCreatureItem, FilterCategory } from './types';

interface ExploreCreatureListProps {
  creatures: ExploreCreatureItem[];
  allCount: number;
  catalogueCount: number;
  foundationalCount: number;
  customCount: number;
  selectedId: string;
  onSelectId: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filter: FilterCategory;
  onFilterChange: (f: FilterCategory) => void;
}

export const ExploreCreatureList: React.FC<ExploreCreatureListProps> = ({
  creatures,
  allCount,
  catalogueCount,
  foundationalCount,
  customCount,
  selectedId,
  onSelectId,
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
}) => {
  return (
    <section className="w-full md:w-5/12 lg:w-4/12 border-r border-white/10 flex flex-col bg-[#08090d]">
      {/* Filter Chips & Search Bar */}
      <div className="p-4 border-b border-white/10 space-y-3 shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search archetypes or working meanings..."
            className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#c5a059]/50 font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono scrollbar-none">
          <button
            onClick={() => onFilterChange('all')}
            className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              filter === 'all'
                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            All ({allCount})
          </button>
          <button
            onClick={() => onFilterChange('catalogue')}
            className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              filter === 'catalogue'
                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            Archetypes ({catalogueCount})
          </button>
          <button
            onClick={() => onFilterChange('foundational')}
            className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              filter === 'foundational'
                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            Foundational ({foundationalCount})
          </button>
          {customCount > 0 && (
            <button
              onClick={() => onFilterChange('saved')}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                filter === 'saved'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              Customized ({customCount})
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Monster Cards List */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {creatures.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No creature matches found for &quot;{searchQuery}&quot;.
          </div>
        ) : (
          creatures.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <button
                key={item.id}
                onClick={() => onSelectId(item.id)}
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
  );
};
