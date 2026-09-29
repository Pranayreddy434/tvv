import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, List, Power, Star, Tv } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import { getCurrentAndNextProgram } from '../services/epgService';

export default function TVMode({ channel, channels = [], favorites = [], onSelectChannel, onToggleFavorite, onExit, ...playerProps }) {
  const [showList, setShowList] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(Math.max(0, channels.findIndex(c => c.id === channel?.id || c.url === channel?.url)));
  const currentIndex = Math.max(0, channels.findIndex(c => c.id === channel?.id || c.url === channel?.url));
  const program = getCurrentAndNextProgram(channel);
  const isFavorite = favorites.some(f => f.id === channel?.id || f.url === channel?.url);

  const tune = (index) => {
    const next = channels[(index + channels.length) % channels.length];
    if (next) onSelectChannel(next);
  };

  useEffect(() => setSelectedIndex(currentIndex), [currentIndex]);
  useEffect(() => {
    const onKeyDown = (event) => {
      const tag = event.target.tagName?.toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag)) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        showList ? setShowList(false) : onExit();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault(); tune(currentIndex + 1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault(); tune(currentIndex - 1);
      } else if (showList && event.key === 'ArrowDown') {
        event.preventDefault(); setSelectedIndex(i => Math.min(channels.length - 1, i + 1));
      } else if (showList && event.key === 'ArrowUp') {
        event.preventDefault(); setSelectedIndex(i => Math.max(0, i - 1));
      } else if (showList && event.key === 'Enter') {
        event.preventDefault(); tune(selectedIndex); setShowList(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [channels, currentIndex, onExit, selectedIndex, showList]);

  return <div className="tv-mode-shell">
    <div className="tv-mode-player"><VideoPlayer channel={channel} allChannels={channels} onSelectChannel={onSelectChannel} onToggleFavorite={onToggleFavorite} isFavorite={isFavorite} {...playerProps} /></div>
    <div className="tv-mode-bar">
      <div className="tv-mode-now"><Tv size={17} /><strong>{String(channel?.channelNumber || currentIndex + 1).padStart(3, '0')} · {channel?.name}</strong><span>{program.current?.title || 'Live broadcast'}</span></div>
      <div className="tv-mode-actions">
        <button onClick={() => tune(currentIndex - 1)} aria-label="Previous channel"><ChevronLeft size={19} /></button>
        <button onClick={() => setShowList(v => !v)} aria-label="Open channel list"><List size={19} /></button>
        <button onClick={() => tune(currentIndex + 1)} aria-label="Next channel"><ChevronRight size={19} /></button>
        <button onClick={() => onToggleFavorite(channel)} aria-label="Toggle favorite"><Star size={17} fill={isFavorite ? 'currentColor' : 'none'} /></button>
        <button onClick={onExit} aria-label="Exit TV mode"><Power size={17} /></button>
      </div>
    </div>
    {showList && <aside className="tv-mode-list" aria-label="Channel list">
      <div className="tv-mode-list-title">Channels <span>Enter to tune · Esc to close</span></div>
      {channels.slice(0, 100).map((item, index) => <button key={item.id || item.url} className={`${index === selectedIndex ? 'selected' : ''} ${item.id === channel?.id ? 'playing' : ''}`} onClick={() => { tune(index); setShowList(false); }}>
        <span>{String(item.channelNumber || index + 1).padStart(3, '0')}</span><b>{item.name}</b>{favorites.some(f => f.id === item.id || f.url === item.url) && <Star size={12} fill="currentColor" />}
      </button>)}
    </aside>}
  </div>;
}
