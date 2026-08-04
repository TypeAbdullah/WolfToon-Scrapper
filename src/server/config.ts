import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { AppSettings } from '../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

const SETTINGS_FILE = process.env.VERCEL
  ? path.join(os.tmpdir(), 'settings.json')
  : path.join(rootDir, 'settings.json');

const DEFAULT_DOWNLOAD_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'downloads')
  : path.join(rootDir, 'downloads');

const defaultSettings: AppSettings = {
  baseUrl: 'https://wfwf433.com',
  maxConcurrentImages: 5,
  downloadDir: DEFAULT_DOWNLOAD_DIR,
};

let currentSettings: AppSettings = { ...defaultSettings };

export function loadSettings(): AppSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const loaded = JSON.parse(data);
      currentSettings = { ...defaultSettings, ...loaded };
    }
  } catch (err) {
    console.error('Failed to load settings file, using defaults:', err);
  }
  
  // Safely ensure download dir exists
  try {
    if (!fs.existsSync(currentSettings.downloadDir)) {
      fs.mkdirSync(currentSettings.downloadDir, { recursive: true });
    }
  } catch (err) {
    console.warn('Could not create download directory:', err);
  }

  return currentSettings;
}

export function saveSettings(newSettings: Partial<AppSettings>): AppSettings {
  currentSettings = { ...currentSettings, ...newSettings };
  
  // Clean up trailing slash on base url
  if (currentSettings.baseUrl.endsWith('/')) {
    currentSettings.baseUrl = currentSettings.baseUrl.slice(0, -1);
  }

  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(currentSettings, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save settings file:', err);
  }

  try {
    if (!fs.existsSync(currentSettings.downloadDir)) {
      fs.mkdirSync(currentSettings.downloadDir, { recursive: true });
    }
  } catch (err) {
    console.warn('Could not create download directory:', err);
  }

  return currentSettings;
}

export function getSettings(): AppSettings {
  return currentSettings;
}

// Initial load
loadSettings();
