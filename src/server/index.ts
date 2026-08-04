import fs from 'fs';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './routes.js';
import { getSettings } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

export const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Serve downloaded ZIP files
const settings = getSettings();
app.use('/downloads', express.static(settings.downloadDir));

// Serve built frontend assets in production
const clientDist = path.join(rootDir, 'dist');
app.use(express.static(clientDist));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/downloads')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  const indexPath = path.join(clientDist, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('API server is running. Start Vite dev server for UI.');
  }
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` WFWF Manhwa Scraper Server running on port ${PORT}`);
    console.log(` Target Site URL: ${settings.baseUrl}`);
    console.log(` Downloads Directory: ${settings.downloadDir}`);
    console.log(`====================================================`);
  });
}
