import React, { useState } from 'react';
import { Book, Image as ImageIcon } from 'lucide-react';
import { ManhwaItem } from '../../shared/types';
import { getProxiedImageUrl } from '../api';

interface ManhwaCardProps {
  item: ManhwaItem;
  onClick: (item: ManhwaItem) => void;
}

export const ManhwaCard: React.FC<ManhwaCardProps> = ({ item, onClick }) => {
  const [imgError, setImgError] = useState(false);
  const proxiedCover = getProxiedImageUrl(item.coverUrl);

  return (
    <div
      onClick={() => onClick(item)}
      className="group relative cursor-pointer flex flex-col rounded-2xl glass-panel glass-panel-hover overflow-hidden transition-all duration-300 border border-white/10"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-950">
        {!imgError && proxiedCover ? (
          <img
            src={proxiedCover}
            alt={item.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-neutral-600 bg-neutral-950">
            <ImageIcon className="w-10 h-10 mb-2 stroke-[1.2] text-neutral-700" />
            <span className="text-xs text-neutral-500 font-medium text-center line-clamp-2">{item.title}</span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-85 group-hover:opacity-60 transition-opacity" />

        {/* Latest Chapter Badge */}
        {item.latestChapter && (
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-white font-mono text-[10px] font-semibold border border-white/20">
            {item.latestChapter}
          </div>
        )}

        {/* Quick View Hover Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-[2px]">
          <span className="px-3.5 py-1.5 rounded-lg bg-white text-black font-bold text-xs shadow-2xl flex items-center gap-1.5 transform translate-y-1 group-hover:translate-y-0 transition-transform">
            <Book className="w-3.5 h-3.5" />
            View Chapters
          </span>
        </div>
      </div>

      {/* Info Content */}
      <div className="p-3.5 flex flex-col flex-grow justify-between gap-2 bg-neutral-950/60">
        <h3 className="font-semibold text-xs text-neutral-100 group-hover:text-white transition-colors line-clamp-2 leading-relaxed">
          {item.title}
        </h3>

        <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-900 font-mono">
          <span>#{item.toonId}</span>
          <span className="text-neutral-300 group-hover:text-white font-semibold transition-colors">Explore →</span>
        </div>
      </div>
    </div>
  );
};
