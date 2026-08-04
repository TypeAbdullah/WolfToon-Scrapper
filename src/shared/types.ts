export interface ManhwaItem {
  id: string;
  toonId: string;
  title: string;
  href: string;
  coverUrl?: string;
  latestChapter?: string;
  status?: string;
  genres?: string[];
}

export interface ChapterItem {
  toonId: string;
  num: string;
  title: string;
  href: string;
  date?: string;
}

export interface ManhwaDetail {
  id: string;
  toonId: string;
  title: string;
  coverUrl?: string;
  description?: string;
  author?: string;
  status?: string;
  genres?: string[];
  chapters: ChapterItem[];
}

export type TaskStatus = 'queued' | 'downloading' | 'zipping' | 'completed' | 'failed' | 'cancelled';

export interface DownloadTask {
  id: string;
  toonId: string;
  toonTitle: string;
  chapterNum: string;
  chapterTitle: string;
  status: TaskStatus;
  progress: number;
  totalImages: number;
  downloadedImages: number;
  failedImages: number;
  zipFileName?: string;
  downloadUrl?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface AppSettings {
  baseUrl: string;
  maxConcurrentImages: number;
  downloadDir: string;
}
