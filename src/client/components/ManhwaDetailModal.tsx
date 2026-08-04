import React, { useState, useEffect, useMemo } from 'react';
import { X, Download, Search, CheckSquare, Square, Layers, Loader2, Calendar, Link as LinkIcon } from 'lucide-react';
import { ManhwaItem, ManhwaDetail, ChapterItem } from '../../shared/types';
import { getManhwaDetail, startSingleDownload, startBatchDownload, getProxiedImageUrl } from '../api';

interface ManhwaDetailModalProps {
  item: ManhwaItem | null;
  onClose: () => void;
  onDownloadStarted: () => void;
}

export const ManhwaDetailModal: React.FC<ManhwaDetailModalProps> = ({
  item,
  onClose,
  onDownloadStarted,
}) => {
  const [detail, setDetail] = useState<ManhwaDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Selection state for batch download
  const [selectedNumSet, setSelectedNumSet] = useState<Set<string>>(new Set());
  const [filterText, setFilterText] = useState('');

  // Quick Range Selection state
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');

  const [downloadingNums, setDownloadingNums] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!item) {
      setDetail(null);
      setSelectedNumSet(new Set());
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedNumSet(new Set());

    getManhwaDetail(item.toonId)
      .then((data) => {
        setDetail(data);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load chapter details from WFWF.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [item]);

  // Filtered chapters list
  const filteredChapters = useMemo(() => {
    if (!detail) return [];
    if (!filterText.trim()) return detail.chapters;
    const query = filterText.toLowerCase();
    return detail.chapters.filter(
      (ch) => ch.title.toLowerCase().includes(query) || ch.num.includes(query)
    );
  }, [detail, filterText]);

  if (!item) return null;

  const proxiedCover = getProxiedImageUrl(detail?.coverUrl || item.coverUrl);

  // Toggle chapter selection
  const toggleSelect = (num: string) => {
    setSelectedNumSet((prev) => {
      const next = new Set(prev);
      if (next.has(num)) {
        next.delete(num);
      } else {
        next.add(num);
      }
      return next;
    });
  };

  // Select all / deselect all filtered chapters
  const handleSelectAllFiltered = () => {
    if (filteredChapters.length === 0) return;
    const allFilteredSelected = filteredChapters.every((ch) => selectedNumSet.has(ch.num));
    setSelectedNumSet((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredChapters.forEach((ch) => next.delete(ch.num));
      } else {
        filteredChapters.forEach((ch) => next.add(ch.num));
      }
      return next;
    });
  };

  // Apply Range selection
  const handleApplyRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail) return;
    const from = parseFloat(rangeFrom);
    const to = parseFloat(rangeTo);

    if (isNaN(from) || isNaN(to)) return;

    const minNum = Math.min(from, to);
    const maxNum = Math.max(from, to);

    const next = new Set(selectedNumSet);
    detail.chapters.forEach((ch) => {
      const n = parseFloat(ch.num);
      if (!isNaN(n) && n >= minNum && n <= maxNum) {
        next.add(ch.num);
      }
    });

    setSelectedNumSet(next);
  };

  // Start single chapter download
  const handleSingleDownload = async (ch: ChapterItem) => {
    if (!detail) return;
    setDownloadingNums((prev) => new Set(prev).add(ch.num));

    try {
      await startSingleDownload(detail.toonId, detail.title, ch.num, ch.title);
      onDownloadStarted();
    } catch (err: any) {
      alert(`Download error: ${err.message}`);
    } finally {
      setDownloadingNums((prev) => {
        const next = new Set(prev);
        next.delete(ch.num);
        return next;
      });
    }
  };

  // Start batch download
  const handleBatchDownload = async () => {
    if (!detail || selectedNumSet.size === 0) return;

    const selectedChapters = detail.chapters
      .filter((ch) => selectedNumSet.has(ch.num))
      .map((ch) => ({ num: ch.num, title: ch.title }));

    try {
      await startBatchDownload(detail.toonId, selectedChapters);
      onDownloadStarted();
      setSelectedNumSet(new Set());
    } catch (err: any) {
      alert(`Batch download error: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-3xl glass-modal overflow-hidden shadow-2xl border border-white/10">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
              toon={item.toonId}
            </span>
            <h3 className="font-bold text-base text-white truncate max-w-md sm:max-w-xl">
              {detail?.title || item.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-white">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-neutral-400" />
            <p className="text-neutral-300 font-mono text-xs">Parsing chapter index from WFWF...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-8 text-center my-12 max-w-md mx-auto">
            <p className="text-rose-400 font-bold mb-2 text-sm">Failed to load catalog</p>
            <p className="text-neutral-400 text-xs">{error}</p>
          </div>
        )}

        {/* Modal Body Content */}
        {!loading && !error && detail && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Top Meta Info */}
            <div className="flex flex-col sm:flex-row gap-6 items-start bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
              {proxiedCover && (
                <img
                  src={proxiedCover}
                  alt={detail.title}
                  className="w-28 sm:w-36 aspect-[3/4] object-cover rounded-xl border border-neutral-800 flex-shrink-0"
                />
              )}
              <div className="space-y-2.5 flex-1">
                <h2 className="text-xl font-bold text-white tracking-tight">{detail.title}</h2>
                
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="px-2.5 py-1 rounded-md bg-white text-black font-bold">
                    {detail.chapters.length} Chapters
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-neutral-900 text-neutral-300 border border-neutral-800">
                    ID: #{detail.toonId}
                  </span>
                </div>

                {detail.description && (
                  <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed pt-1">
                    {detail.description}
                  </p>
                )}
              </div>
            </div>

            {/* Chapter Selection & Range Tools */}
            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                
                {/* Search / Filter input */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="Filter chapter number or title..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white font-mono"
                  />
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                </div>

                {/* Range Select Form */}
                <form onSubmit={handleApplyRange} className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400 font-mono">Range:</span>
                  <input
                    type="number"
                    value={rangeFrom}
                    onChange={(e) => setRangeFrom(e.target.value)}
                    placeholder="From"
                    className="w-20 px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-mono text-center text-white focus:outline-none focus:border-white"
                  />
                  <span className="text-neutral-500 text-xs">-</span>
                  <input
                    type="number"
                    value={rangeTo}
                    onChange={(e) => setRangeTo(e.target.value)}
                    placeholder="To"
                    className="w-20 px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-mono text-center text-white focus:outline-none focus:border-white"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-white transition-all"
                  >
                    Select Range
                  </button>
                </form>

              </div>

              {/* Selection Bar Action */}
              <div className="flex items-center justify-between bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <button
                  onClick={handleSelectAllFiltered}
                  className="flex items-center gap-2 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
                >
                  {filteredChapters.length > 0 &&
                  filteredChapters.every((ch) => selectedNumSet.has(ch.num)) ? (
                    <CheckSquare className="w-4 h-4 text-white" />
                  ) : (
                    <Square className="w-4 h-4 text-neutral-600" />
                  )}
                  <span>Select All Filtered ({filteredChapters.length})</span>
                </button>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-400 font-mono">
                    Selected: <strong className="text-white">{selectedNumSet.size}</strong> chapters
                  </span>

                  <button
                    onClick={handleBatchDownload}
                    disabled={selectedNumSet.size === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <Layers className="w-4 h-4" />
                    Batch Download ZIP ({selectedNumSet.size})
                  </button>
                </div>
              </div>

              {/* Chapters List Table */}
              <div className="border border-neutral-800 rounded-2xl overflow-hidden bg-neutral-950 max-h-[350px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-neutral-900 border-b border-neutral-800 text-neutral-400 text-xs font-mono uppercase">
                    <tr>
                      <th className="p-3 w-12 text-center">Select</th>
                      <th className="p-3">Chapter Title</th>
                      <th className="p-3 w-32">Date</th>
                      <th className="p-3 w-32 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900 text-xs font-mono">
                    {filteredChapters.map((ch) => {
                      const isSelected = selectedNumSet.has(ch.num);
                      const isDownloading = downloadingNums.has(ch.num);

                      return (
                        <tr
                          key={ch.num}
                          className={`hover:bg-neutral-900/60 transition-colors ${
                            isSelected ? 'bg-neutral-900' : ''
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(ch.num)}
                              className="w-4 h-4 rounded border-neutral-800 bg-neutral-950 text-white focus:ring-white cursor-pointer"
                            />
                          </td>
                          <td className="p-3 font-medium text-neutral-200">
                            {ch.title}
                          </td>
                          <td className="p-3 text-neutral-500 text-[11px]">
                            {ch.date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-neutral-600" />
                                {ch.date}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleSingleDownload(ch)}
                              disabled={isDownloading}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold transition-all disabled:opacity-50 border border-neutral-700"
                            >
                              {isDownloading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                              <span>ZIP</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
