import React, { useState, useEffect } from 'react';
import { X, Settings, Save, Globe, Cpu, Folder, Check } from 'lucide-react';
import { AppSettings } from '../../shared/types';
import { getSettings, saveSettings } from '../api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsSaved,
}) => {
  const [baseUrl, setBaseUrl] = useState('https://wfwf433.com');
  const [maxConcurrentImages, setMaxConcurrentImages] = useState(5);
  const [downloadDir, setDownloadDir] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getSettings().then((s) => {
        setBaseUrl(s.baseUrl);
        setMaxConcurrentImages(s.maxConcurrentImages);
        setDownloadDir(s.downloadDir);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveSettings({
        baseUrl: baseUrl.trim(),
        maxConcurrentImages: Number(maxConcurrentImages),
      });
      setSavedSuccess(true);
      onSettingsSaved();
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl glass-modal overflow-hidden shadow-2xl border border-white/10">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <Settings className="w-4 h-4 text-white" />
            <h3 className="font-bold text-sm text-white">Target Site & Scraper Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Base URL Input */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-neutral-400" />
              Target Website Domain Base URL
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://wfwf433.com"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-white"
            />
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              If the site updates domain (e.g. wfwf434.com), update this base URL here without restarting the application!
            </p>
          </div>

          {/* Concurrency Input */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-neutral-400" />
              Max Concurrent Image Downloads
            </label>
            <input
              type="number"
              min="1"
              max="15"
              value={maxConcurrentImages}
              onChange={(e) => setMaxConcurrentImages(parseInt(e.target.value, 10) || 5)}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-mono text-white focus:outline-none focus:border-white"
            />
            <p className="text-[11px] text-neutral-500">
              Recommended: 5 to 8 parallel image downloads per chapter.
            </p>
          </div>

          {/* Download Directory Readonly Info */}
          {downloadDir && (
            <div className="space-y-1.5 pt-2 border-t border-neutral-900">
              <label className="block text-xs font-mono text-neutral-400 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-neutral-500" />
                Storage Directory:
              </label>
              <p className="text-xs font-mono text-neutral-300 break-all bg-neutral-950 p-2.5 rounded-xl border border-neutral-900">
                {downloadDir}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-900">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-semibold text-xs transition-all border border-neutral-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs shadow-lg transition-all disabled:opacity-50"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-black" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Settings'}</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
