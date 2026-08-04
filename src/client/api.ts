import { ManhwaItem, ManhwaDetail, DownloadTask, AppSettings } from '../shared/types';

export function getProxiedImageUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('http')) {
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  }
  return url;
}

export async function searchManhwa(query: string): Promise<ManhwaItem[]> {
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to search manhwa');
  const data = await res.json();
  return data.results || [];
}

export async function browseManhwa(type: 'ing' | 'end' | 'all' = 'ing', page: number = 1): Promise<ManhwaItem[]> {
  const res = await fetch(`/api/browse?type=${type}&page=${page}`);
  if (!res.ok) throw new Error('Failed to fetch browse list');
  const data = await res.json();
  return data.results || [];
}

export async function getManhwaDetail(id: string): Promise<ManhwaDetail> {
  const res = await fetch(`/api/toon?id=${id}`);
  if (!res.ok) throw new Error('Failed to fetch manhwa detail');
  return res.json();
}

export async function startSingleDownload(toonId: string, toonTitle: string, chapterNum: string, chapterTitle: string): Promise<DownloadTask> {
  const res = await fetch('/api/download/chapter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toonId, toonTitle, chapterNum, chapterTitle }),
  });
  if (!res.ok) throw new Error('Failed to start chapter download');
  const data = await res.json();
  return data.task;
}

export async function startBatchDownload(toonId: string, chapters: { num: string; title: string }[]): Promise<DownloadTask[]> {
  const res = await fetch('/api/download/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toonId, chapters }),
  });
  if (!res.ok) throw new Error('Failed to start batch download');
  const data = await res.json();
  return data.tasks;
}

export async function getDownloads(): Promise<DownloadTask[]> {
  const res = await fetch('/api/downloads');
  if (!res.ok) throw new Error('Failed to fetch download tasks');
  const data = await res.json();
  return data.tasks || [];
}

export async function cancelDownload(id: string): Promise<boolean> {
  const res = await fetch(`/api/downloads/${id}`, { method: 'DELETE' });
  if (!res.ok) return false;
  const data = await res.json();
  return data.success;
}

export async function getSettings(): Promise<AppSettings> {
  const res = await fetch('/api/settings');
  if (!res.ok) throw new Error('Failed to get settings');
  return res.json();
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to save settings');
  const data = await res.json();
  return data.settings;
}

export function connectSSE(onTaskUpdate: (task: DownloadTask) => void, onInitialTasks: (tasks: DownloadTask[]) => void) {
  const eventSource = new EventSource('/api/downloads/events');

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'initial_tasks') {
        onInitialTasks(data.tasks);
      } else if (data.type === 'task_update') {
        onTaskUpdate(data.task);
      }
    } catch (err) {
      console.error('Error parsing SSE event:', err);
    }
  };

  eventSource.onerror = (err) => {
    console.warn('SSE Connection error, retrying...', err);
  };

  return () => {
    eventSource.close();
  };
}
