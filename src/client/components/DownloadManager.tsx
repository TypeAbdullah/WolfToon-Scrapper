import React from 'react';
import { X, Download, AlertCircle, CheckCircle2, Loader2, Ban, FolderArchive, FileDown } from 'lucide-react';
import { DownloadTask } from '../../shared/types';
import { cancelDownload } from '../api';

interface DownloadManagerProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: DownloadTask[];
}

export const DownloadManager: React.FC<DownloadManagerProps> = ({
  isOpen,
  onClose,
  tasks,
}) => {
  if (!isOpen) return null;

  const activeTasks = tasks.filter(t => t.status === 'downloading' || t.status === 'zipping' || t.status === 'queued');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const failedTasks = tasks.filter(t => t.status === 'failed' || t.status === 'cancelled');

  const handleCancel = async (id: string) => {
    await cancelDownload(id);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-black border-l border-neutral-800 shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
            <div className="flex items-center gap-2.5">
              <Download className="w-4 h-4 text-white" />
              <h3 className="font-bold text-sm text-white">Download Manager</h3>
              {activeTasks.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-white text-black text-[10px] font-extrabold">
                  {activeTasks.length} active
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Active Downloads Section */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase font-mono font-bold text-neutral-400 tracking-wider flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                Active Queue ({activeTasks.length})
              </h4>

              {activeTasks.length === 0 ? (
                <p className="text-xs text-neutral-500 italic p-3 rounded-xl bg-neutral-950 border border-neutral-900 font-mono">
                  No active downloads in progress.
                </p>
              ) : (
                <div className="space-y-3">
                  {activeTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-2xl glass-panel space-y-2.5 border-neutral-800"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h5 className="font-bold text-xs text-white line-clamp-1">{task.toonTitle}</h5>
                          <span className="text-[11px] font-mono text-neutral-400">{task.chapterTitle}</span>
                        </div>
                        <button
                          onClick={() => handleCancel(task.id)}
                          className="text-neutral-500 hover:text-rose-400 p-1 transition-colors"
                          title="Cancel Download"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Status Text & Progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                          <span>
                            {task.status === 'queued' && 'Queued...'}
                            {task.status === 'downloading' && `Downloading (${task.downloadedImages}/${task.totalImages} imgs)`}
                            {task.status === 'zipping' && 'Compressing into ZIP archive...'}
                          </span>
                          <span className="text-white font-bold">{task.progress}%</span>
                        </div>

                        <div className="w-full h-1.5 rounded-full bg-neutral-900 overflow-hidden border border-neutral-800">
                          <div
                            className="h-full bg-white transition-all duration-300 rounded-full"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Downloads Section */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs uppercase font-mono font-bold text-neutral-400 tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                Completed ZIPs ({completedTasks.length})
              </h4>

              {completedTasks.length === 0 ? (
                <p className="text-xs text-neutral-500 italic p-3 rounded-xl bg-neutral-950 border border-neutral-900 font-mono">
                  No completed downloads yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-2xl glass-panel space-y-2 border-neutral-800"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <h5 className="font-bold text-xs text-white truncate max-w-[200px]">
                            {task.toonTitle}
                          </h5>
                          <p className="text-[11px] font-mono text-neutral-400">{task.chapterTitle}</p>
                        </div>

                        {task.downloadUrl && (
                          <a
                            href={task.downloadUrl}
                            download={task.zipFileName}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs transition-all shadow-md"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            <span>Save ZIP</span>
                          </a>
                        )}
                      </div>
                      
                      <div className="text-[10px] font-mono text-neutral-500 flex items-center gap-1 pt-1.5 border-t border-neutral-900">
                        <FolderArchive className="w-3 h-3 text-neutral-400" />
                        <span className="truncate">{task.zipFileName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Failed Downloads Section */}
            {failedTasks.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs uppercase font-mono font-bold text-rose-400 tracking-wider flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Failed / Cancelled ({failedTasks.length})
                </h4>

                <div className="space-y-2">
                  {failedTasks.map((task) => (
                    <div key={task.id} className="p-3 rounded-xl bg-neutral-950 border border-rose-900/40 text-xs text-rose-300 font-mono">
                      <div className="font-semibold">{task.toonTitle} - {task.chapterTitle}</div>
                      <p className="text-[11px] text-rose-400/80 mt-0.5">{task.error || 'Failed'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
};
