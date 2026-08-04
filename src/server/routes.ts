import { Router, Request, Response } from 'express';
import { searchManhwa, browseManhwa, getManhwaDetail } from './scraper.js';
import { createDownloadTask, createBatchDownloadTasks, getAllTasks, cancelTask, subscribeSSE } from './downloader.js';
import { getSettings, saveSettings } from './config.js';

export const apiRouter = Router();

// Image Proxy Endpoint
apiRouter.get('/proxy-image', async (req: Request, res: Response) => {
  try {
    const imgUrl = req.query.url as string;
    if (!imgUrl || !imgUrl.startsWith('http')) {
      return res.status(400).send('Invalid or missing image URL');
    }

    const settings = getSettings();
    const response = await fetch(imgUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': `${settings.baseUrl}/`,
      }
    });

    if (!response.ok) {
      return res.status(response.status).send('Failed to fetch proxied image');
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    res.status(500).send('Proxy error');
  }
});

// Search Manhwa
apiRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q || !q.trim()) {
      return res.json({ results: [] });
    }
    const results = await searchManhwa(q.trim());
    res.json({ results });
  } catch (err: any) {
    console.error('Search error:', err);
    res.status(500).json({ error: err.message || 'Failed to search manhwa' });
  }
});

// Browse Manhwa
apiRouter.get('/browse', async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as 'ing' | 'end' | 'all') || 'ing';
    const page = parseInt(req.query.page as string || '1', 10);
    const results = await browseManhwa(type, page);
    res.json({ results });
  } catch (err: any) {
    console.error('Browse error:', err);
    res.status(500).json({ error: err.message || 'Failed to browse manhwa list' });
  }
});

// Get Manhwa Detail & Chapters
apiRouter.get('/toon', async (req: Request, res: Response) => {
  try {
    const id = req.query.id as string;
    if (!id) {
      return res.status(400).json({ error: 'Missing toon id' });
    }
    const detail = await getManhwaDetail(id);
    res.json(detail);
  } catch (err: any) {
    console.error('Toon detail error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch manhwa detail' });
  }
});

// Download Single Chapter
apiRouter.post('/download/chapter', async (req: Request, res: Response) => {
  try {
    const { toonId, toonTitle, chapterNum, chapterTitle } = req.body;
    if (!toonId || !chapterNum) {
      return res.status(400).json({ error: 'Missing required parameters (toonId, chapterNum)' });
    }

    const task = await createDownloadTask(
      toonId,
      toonTitle || `Manhwa_${toonId}`,
      chapterNum,
      chapterTitle || `Chapter ${chapterNum}`
    );

    res.json({ success: true, task });
  } catch (err: any) {
    console.error('Download chapter error:', err);
    res.status(500).json({ error: err.message || 'Failed to start chapter download' });
  }
});

// Batch Download Chapters
apiRouter.post('/download/batch', async (req: Request, res: Response) => {
  try {
    const { toonId, chapters } = req.body;
    if (!toonId || !Array.isArray(chapters) || chapters.length === 0) {
      return res.status(400).json({ error: 'Missing toonId or empty chapters list' });
    }

    const tasks = await createBatchDownloadTasks(toonId, chapters);
    res.json({ success: true, count: tasks.length, tasks });
  } catch (err: any) {
    console.error('Batch download error:', err);
    res.status(500).json({ error: err.message || 'Failed to start batch download' });
  }
});

// List Download Tasks
apiRouter.get('/downloads', (req: Request, res: Response) => {
  const tasks = getAllTasks();
  res.json({ tasks });
});

// Cancel Download Task
apiRouter.delete('/downloads/:id', (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const success = cancelTask(id);
  res.json({ success });
});

// SSE Live Progress Streaming
apiRouter.get('/downloads/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial task list
  const initialPayload = JSON.stringify({ type: 'initial_tasks', tasks: getAllTasks() });
  res.write(`data: ${initialPayload}\n\n`);

  const unsubscribe = subscribeSSE((data: string) => {
    res.write(`data: ${data}\n\n`);
  });

  req.on('close', () => {
    unsubscribe();
  });
});

// Get Settings
apiRouter.get('/settings', (req: Request, res: Response) => {
  res.json(getSettings());
});

// Update Settings
apiRouter.post('/settings', (req: Request, res: Response) => {
  try {
    const updated = saveSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save settings' });
  }
});
