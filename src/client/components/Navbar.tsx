import React, { useState } from 'react';
import { Search, Settings, Download, BookOpen, CheckCircle, Command } from 'lucide-react';

interface NavbarProps {
  activeTab: 'ing' | 'end' | 'search';
  setActiveTab: (tab: 'ing' | 'end' | 'search') => void;
  onSearch: (query: string) => void;
  activeDownloadsCount: number;
  openDownloadManager: () => void;
  openSettings: () => void;
  searchQuery: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onSearch,
  activeDownloadsCount,
  openDownloadManager,
  openSettings,
  searchQuery: externalQuery,
}) => {
  const [query, setQuery] = useState(externalQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-2xl border-b border-white/10 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Vercel Style Logo */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('ing')}>
            <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-black shadow-vercel-glow transition-transform group-hover:scale-105">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 76 65">
                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold text-white tracking-tight group-hover:text-neutral-300 transition-colors">
                WolfScrape
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-400 border border-neutral-800">
                RAW
              </span>
            </div>
          </div>

          {/* Mobile Right Buttons */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={openDownloadManager}
              className="relative p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white"
            >
              <Download className="w-5 h-5" />
              {activeDownloadsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-black text-xs font-extrabold flex items-center justify-center shadow-lg">
                  {activeDownloadsCount}
                </span>
              )}
            </button>
            <button
              onClick={openSettings}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search / Direct URL Bar */}
        <form onSubmit={handleSubmit} className="w-full md:w-[460px] relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Paste URL (e.g. wfwf433.com/list?toon=75355), ID, or title..."
            className="w-full pl-10 pr-12 py-2 rounded-xl bg-neutral-900/90 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/40 transition-all text-xs font-mono"
          />
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-2.5" />
          {query ? (
            <button
              type="button"
              onClick={() => { setQuery(''); }}
              className="absolute right-3 top-2 text-neutral-500 hover:text-white text-xs bg-neutral-800 rounded-full w-4 h-4 flex items-center justify-center"
            >
              ✕
            </button>
          ) : (
            <div className="absolute right-3 top-2 flex items-center gap-1 text-[10px] font-mono text-neutral-500 bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700">
              <Command className="w-2.5 h-2.5" />
              <span>↵</span>
            </div>
          )}
        </form>

        {/* Desktop Controls & Tabs */}
        <div className="hidden md:flex items-center gap-3">
          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 p-1 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab('ing')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'ing'
                  ? 'bg-white text-black font-bold shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Ongoing
            </button>

            <button
              onClick={() => setActiveTab('end')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'end'
                  ? 'bg-white text-black font-bold shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Completed
            </button>

            {activeTab === 'search' && (
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black font-bold shadow-md"
              >
                <Search className="w-3.5 h-3.5" />
                Results
              </button>
            )}
          </nav>

          {/* Downloads Action Button */}
          <button
            onClick={openDownloadManager}
            className="relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-medium text-xs transition-all"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            <span>Downloads</span>
            {activeDownloadsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white text-black text-[10px] font-extrabold">
                {activeDownloadsCount}
              </span>
            )}
          </button>

          {/* Settings Button */}
          <button
            onClick={openSettings}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-all"
            title="Target Site Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
