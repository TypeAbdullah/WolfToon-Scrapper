import React from 'react';
import { ManhwaCard } from './ManhwaCard';
import { ManhwaItem } from '../../shared/types';
import { ChevronLeft, ChevronRight, SearchX } from 'lucide-react';

interface ManhwaGridProps {
  title: string;
  items: ManhwaItem[];
  loading: boolean;
  error?: string | null;
  onItemClick: (item: ManhwaItem) => void;
  page?: number;
  onPageChange?: (page: number) => void;
}

export const ManhwaGrid: React.FC<ManhwaGridProps> = ({
  title,
  items,
  loading,
  error,
  onItemClick,
  page = 1,
  onPageChange,
}) => {
  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            {title}
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-400 border border-neutral-800">
              {items.length} titles
            </span>
          </h2>
        </div>

        {/* Pagination Buttons */}
        {onPageChange && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-neutral-300 px-3 py-1 rounded-lg bg-black border border-neutral-800">
              Page {page}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={loading || items.length === 0}
              className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-2xl glass-panel p-3 space-y-3 animate-pulse border border-neutral-800">
              <div className="aspect-[3/4] w-full rounded-xl bg-neutral-900" />
              <div className="h-3.5 bg-neutral-900 rounded w-3/4" />
              <div className="h-3 bg-neutral-900/60 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div className="p-8 rounded-2xl glass-panel text-center max-w-md mx-auto my-12 border-rose-900/50">
          <p className="text-rose-400 font-bold text-sm mb-1">Error Loading Catalog</p>
          <p className="text-neutral-400 text-xs">{error}</p>
        </div>
      )}

      {/* Empty Results */}
      {!loading && !error && items.length === 0 && (
        <div className="p-12 rounded-2xl glass-panel text-center max-w-md mx-auto my-12 border border-neutral-800">
          <SearchX className="w-10 h-10 text-neutral-600 mx-auto mb-3 stroke-[1.2]" />
          <h3 className="text-base font-bold text-white mb-1">No Manhwa Found</h3>
          <p className="text-neutral-400 text-xs leading-relaxed">
            Try pasting a direct link like <code className="text-white font-mono bg-neutral-900 px-1 py-0.5 rounded">http://wfwf433.com/list?toon=75355</code> or entering <code className="text-white font-mono bg-neutral-900 px-1 py-0.5 rounded">75355</code> in the search bar above!
          </p>
        </div>
      )}

      {/* Items Grid */}
      {!loading && !error && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map((item) => (
            <ManhwaCard key={item.id} item={item} onClick={onItemClick} />
          ))}
        </div>
      )}
    </section>
  );
};
