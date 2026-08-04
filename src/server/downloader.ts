import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { getSettings } from './config.js';
import { getChapterImageUrls, getManhwaDetail } from './scraper.js';
import { DownloadTask, TaskStatus } from '../shared/types.js';

// In-memory store for tasks
const tasks = new Map<string, DownloadTask>();
const activeAbortControllers = new Map<string, AbortController>();

// SSE Event Listeners
type SSEClient = (data: string) => void;
const sseClients = new Set<SSEClient>();

export function subscribeSSE(client: SSEClient) {
  sseClients.add(client);
  return () => sseClients.delete(client);
}

function broadcastTaskUpdate(task: DownloadTask) {
  const payload = JSON.stringify({ type: 'task_update', task });
  sseClients.forEach(client => {
    try {
      client(payload);
    } catch (err) {
      // Ignore client write errors
    }
  });
}

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '_').trim();
}

export function getAllTasks(): DownloadTask[] {
  return Array.from(tasks.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getTask(id: string): DownloadTask | undefined {
  return tasks.get(id);
}

export function cancelTask(id: string): boolean {
  const task = tasks.get(id);
  if (!task) return false;

  const controller = activeAbortControllers.get(id);
  if (controller) {
    controller.abort();
    activeAbortControllers.delete(id);
  }

  task.status = 'cancelled';
  task.error = 'Download cancelled by user';
  broadcastTaskUpdate(task);
  return true;
}

export async function createDownloadTask(
  toonId: string,
  toonTitle: string,
  chapterNum: string,
  chapterTitle: string
): Promise<DownloadTask> {
  const taskId = `${toonId}_ch${chapterNum}_${Date.now()}`;
  
  const task: DownloadTask = {
    id: taskId,
    toonId,
    toonTitle,
    chapterNum,
    chapterTitle,
    status: 'queued',
    progress: 0,
    totalImages: 0,
    downloadedImages: 0,
    failedImages: 0,
    createdAt: new Date().toISOString(),
  };

  tasks.set(taskId, task);
  broadcastTaskUpdate(task);

  // Process task asynchronously
  processTask(taskId).catch(err => {
    console.error(`Task ${taskId} unhandled error:`, err);
  });

  return task;
}

export async function createBatchDownloadTasks(
  toonId: string,
  chapters: { num: string; title: string }[]
): Promise<DownloadTask[]> {
  // Get toon detail to have clean toon title if possible
  let toonTitle = `Manhwa_${toonId}`;
  try {
    const detail = await getManhwaDetail(toonId);
    toonTitle = detail.title;
  } catch (err) {
    console.warn(`Could not fetch toon detail for batch ${toonId}, using fallback title.`);
  }

  const createdTasks: DownloadTask[] = [];
  for (const ch of chapters) {
    const task = await createDownloadTask(toonId, toonTitle, ch.num, ch.title);
    createdTasks.push(task);
  }

  return createdTasks;
}

async function processTask(taskId: string) {
  const task = tasks.get(taskId);
  if (!task || task.status === 'cancelled') return;

  const settings = getSettings();
  const abortController = new AbortController();
  activeAbortControllers.set(taskId, abortController);

  try {
    task.status = 'downloading';
    task.progress = 5;
    broadcastTaskUpdate(task);

    // Step 1: Fetch chapter image URLs
    const imageUrls = await getChapterImageUrls(task.toonId, task.chapterNum);
    if (imageUrls.length === 0) {
      throw new Error('No images found in chapter. The chapter might be empty or protected.');
    }

    task.totalImages = imageUrls.length;
    task.progress = 10;
    broadcastTaskUpdate(task);

    // Create target directory: <downloadDir>/<toonTitle>/
    const cleanToonTitle = sanitizeFilename(task.toonTitle);
    const cleanChapterTitle = sanitizeFilename(task.chapterTitle || `Chapter_${task.chapterNum}`);
    
    const toonDir = path.join(settings.downloadDir, cleanToonTitle);
    if (!fs.existsSync(toonDir)) {
      fs.mkdirSync(toonDir, { recursive: true });
    }

    const zipFileName = `${cleanChapterTitle}.zip`;
    const zipFilePath = path.join(toonDir, zipFileName);
    
    // Temporary directory for downloading raw images before zipping
    const tempImgDir = path.join(toonDir, `_temp_${taskId}`);
    if (!fs.existsSync(tempImgDir)) {
      fs.mkdirSync(tempImgDir, { recursive: true });
    }

    // Step 2: Download images concurrently
    const downloadedFilePaths: string[] = [];
    const concurrency = Math.max(1, Math.min(settings.maxConcurrentImages, 10));

    for (let i = 0; i < imageUrls.length; i += concurrency) {
      if ((task.status as string) === 'cancelled' || abortController.signal.aborted) {
        throw new Error('Download cancelled');
      }

      const chunk = imageUrls.slice(i, i + concurrency);
      const promises = chunk.map(async (url, chunkIdx) => {
        const index = i + chunkIdx;
        const extMatch = url.match(/\.(jpg|jpeg|png|webp)/i);
        const ext = extMatch ? extMatch[1] : 'jpg';
        const imgFileName = `${String(index + 1).padStart(3, '0')}.${ext}`;
        const imgFilePath = path.join(tempImgDir, imgFileName);

        let success = false;
        let attempts = 0;
        const maxAttempts = 3;

        while (!success && attempts < maxAttempts) {
          if (abortController.signal.aborted) break;
          attempts++;
          try {
            const res = await fetch(url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': `${settings.baseUrl}/`,
              },
              signal: abortController.signal,
            });

            if (res.ok) {
              const buffer = Buffer.from(await res.arrayBuffer());
              fs.writeFileSync(imgFilePath, buffer);
              downloadedFilePaths.push(imgFilePath);
              success = true;
            }
          } catch (err: any) {
            if (err.name === 'AbortError') throw err;
            await new Promise(r => setTimeout(r, 500 * attempts));
          }
        }

        if (success) {
          task.downloadedImages++;
        } else {
          task.failedImages++;
        }

        // Update progress (from 10% to 80%)
        const imgProgress = Math.round(10 + (task.downloadedImages / task.totalImages) * 70);
        task.progress = imgProgress;
        broadcastTaskUpdate(task);
      });

      await Promise.all(promises);
    }

    if (downloadedFilePaths.length === 0) {
      throw new Error('Failed to download any images for this chapter.');
    }

    // Step 3: Package into ZIP archive
    task.status = 'zipping';
    task.progress = 85;
    broadcastTaskUpdate(task);

    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 6 } });

    await new Promise<void>((resolve, reject) => {
      output.on('close', () => resolve());
      archive.on('error', err => reject(err));

      archive.pipe(output);

      // Append files in sorted numerical order
      const files = fs.readdirSync(tempImgDir).sort();
      for (const file of files) {
        archive.file(path.join(tempImgDir, file), { name: file });
      }

      archive.finalize();
    });

    // Cleanup temp images directory
    fs.rmSync(tempImgDir, { recursive: true, force: true });

    // Step 4: Mark complete
    task.status = 'completed';
    task.progress = 100;
    task.zipFileName = zipFileName;
    task.downloadUrl = `/downloads/${encodeURIComponent(cleanToonTitle)}/${encodeURIComponent(zipFileName)}`;
    task.completedAt = new Date().toISOString();
    broadcastTaskUpdate(task);

  } catch (err: any) {
    if ((task.status as string) !== 'cancelled') {
      task.status = 'failed';
      task.error = err.message || 'Unknown error occurred during download';
      broadcastTaskUpdate(task);
    }
  } finally {
    activeAbortControllers.delete(taskId);
  }
}
