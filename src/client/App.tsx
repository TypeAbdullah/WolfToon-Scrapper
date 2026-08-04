import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { ManhwaGrid } from './components/ManhwaGrid';
import { ManhwaDetailModal } from './components/ManhwaDetailModal';
import { DownloadManager } from './components/DownloadManager';
import { SettingsModal } from './components/SettingsModal';
import { ManhwaItem, DownloadTask } from '../shared/types';
import { browseManhwa, searchManhwa, connectSSE, getDownloads } from './api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ing' | 'end' | 'search'>('ing');
  const [searchQuery, setSearchQuery] = useState('');

  // Items & pagination state
  const [items, setItems] = useState<ManhwaItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals & Drawers state
  const [selectedManhwa, setSelectedManhwa] = useState<ManhwaItem | null>(null);
  const [isDownloadManagerOpen, setIsDownloadManagerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Download Tasks state
  const [tasks, setTasks] = useState<DownloadTask[]>([]);

  // Connect SSE for live download status updates
  useEffect(() => {
    // Initial fetch of tasks
    getDownloads().then(setTasks).catch(() => {});

    const unsubscribe = connectSSE(
      (updatedTask) => {
        setTasks((prev) => {
          const index = prev.findIndex((t) => t.id === updatedTask.id);
          if (index >= 0) {
            const next = [...prev];
            next[index] = updatedTask;
            return next;
          }
          return [updatedTask, ...prev];
        });
      },
      (initialTasks) => {
        setTasks(initialTasks);
      }
    );

    return () => unsubscribe();
  }, []);

  // Fetch manhwa list depending on tab or search query
  const loadContent = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'search') {
        if (!searchQuery.trim()) {
          setItems([]);
          setLoading(false);
          return;
        }
        const results = await searchManhwa(searchQuery);
        setItems(results);
      } else {
        const results = await browseManhwa(activeTab, page);
        setItems(results);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch content from WFWF.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, searchQuery]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Tab change handler
  const handleTabChange = (tab: 'ing' | 'end' | 'search') => {
    setActiveTab(tab);
    setPage(1);
  };

  // Search submit handler
  const handleSearchSubmit = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    // Check if input is a direct URL (e.g. http://wfwf433.com/list?toon=75355) or numeric toon ID (e.g. 75355)
    const toonMatch = trimmed.match(/toon=(\d+)/i) || (trimmed.match(/^\d+$/) ? [null, trimmed] : null);

    if (toonMatch && toonMatch[1]) {
      const toonId = toonMatch[1];
      // Open detail modal directly for this toon ID!
      setSelectedManhwa({
        id: toonId,
        toonId: toonId,
        title: `Manhwa #${toonId}`,
        href: `/list?toon=${toonId}`,
      });
      return;
    }

    setSearchQuery(trimmed);
    setActiveTab('search');
    setPage(1);
  };

  const activeDownloadsCount = tasks.filter(
    (t) => t.status === 'downloading' || t.status === 'zipping' || t.status === 'queued'
  ).length;

  const sectionTitle =
    activeTab === 'search'
      ? `Search Results for "${searchQuery}"`
      : activeTab === 'end'
      ? 'Completed Manhwa (완결)'
      : 'Ongoing Manhwa (연재)';

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0d14]">
      {/* Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onSearch={handleSearchSubmit}
        activeDownloadsCount={activeDownloadsCount}
        openDownloadManager={() => setIsDownloadManagerOpen(true)}
        openSettings={() => setIsSettingsOpen(true)}
        searchQuery={searchQuery}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8">
        <ManhwaGrid
          title={sectionTitle}
          items={items}
          loading={loading}
          error={error}
          onItemClick={(item) => setSelectedManhwa(item)}
          page={activeTab !== 'search' ? page : undefined}
          onPageChange={activeTab !== 'search' ? (p) => setPage(p) : undefined}
        />
      </main>

      {/* Manhwa Detail Modal */}
      <ManhwaDetailModal
        item={selectedManhwa}
        onClose={() => setSelectedManhwa(null)}
        onDownloadStarted={() => setIsDownloadManagerOpen(true)}
      />

      {/* Download Manager Drawer */}
      <DownloadManager
        isOpen={isDownloadManagerOpen}
        onClose={() => setIsDownloadManagerOpen(false)}
        tasks={tasks}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsSaved={() => loadContent()}
      />
    </div>
  );
};
