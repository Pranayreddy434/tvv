import React, { useState } from 'react';
import { Play, Pause, X, Maximize2, Tv } from 'lucide-react';

export default function MiniPlayer({
  channel,
  isPlaying = false,
  onTogglePlay,
  onClose,
  onExpand,
  streamHealth = 'online'
}) {
  const [imgError, setImgError] = useState(false);

  if (!channel) return null;

  const channelNum = channel.channelNumber
    ? String(channel.channelNumber).padStart(3, '0')
    : null;

  return (
    <div
      className="mini-player-bar"
      onClick={onExpand}
      role="region"
      aria-label={`Mini Player: ${channel.name}`}
    >
      {/* Left: Channel Logo or Fallback */}
      <div className="mini-player-left">
        <div className="mini-player-logo-box">
          {channel.logo && !imgError ? (
            <img
              src={channel.logo}
              alt={channel.name}
              referrerPolicy="no-referrer"
              className="mini-player-logo"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="mini-player-logo-fallback">
              <Tv size={16} color="var(--accent-light)" />
              <span className="mini-logo-initials">
                {channel.name ? channel.name.slice(0, 2).toUpperCase() : 'TV'}
              </span>
            </div>
          )}
        </div>

        {/* Center Text: Channel Name, Number & Live Indicator */}
        <div className="mini-player-info">
          <div className="mini-player-title-row">
            {channelNum && <span className="ch-num-pill-sm">{channelNum}</span>}
            <span className="mini-player-name" title={channel.name}>
              {channel.name}
            </span>
            <span className="live-pill-inline-sm">
              <span className="live-dot" /> LIVE
            </span>
          </div>
          <div className="mini-player-meta">
            <span>{channel.group || 'Live TV'}</span>
            {channel.language && <span> • {channel.language}</span>}
            <span className="mini-player-tap-hint">Tap to expand</span>
          </div>
        </div>
      </div>

      {/* Right: Controls (Play/Pause, Expand, Close) */}
      <div className="mini-player-actions" onClick={(e) => e.stopPropagation()}>
        <button
          className="mini-btn-play"
          onClick={onTogglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause size={17} fill="currentColor" />
          ) : (
            <Play size={17} fill="currentColor" style={{ marginLeft: 2 }} />
          )}
        </button>

        <button
          className="mini-btn-expand"
          onClick={onExpand}
          aria-label="Reopen Video Player"
          title="Reopen Player"
        >
          <Maximize2 size={16} />
        </button>

        <button
          className="mini-btn-close"
          onClick={onClose}
          aria-label="Close Mini Player"
          title="Close Player"
        >
          <X size={17} />
        </button>
      </div>
    </div>
  );
}
