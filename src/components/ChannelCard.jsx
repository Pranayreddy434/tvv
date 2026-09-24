import React, { useState } from 'react';
import { Star, Tv, Radio, Play } from 'lucide-react';

export default function ChannelCard({
  channel,
  onSelectChannel,
  isPlaying,
  isFavorite,
  onToggleFavorite,
  viewLayout = 'grid'
}) {
  const [imgError, setImgError] = useState(false);
  const qualityClass = `badge badge-${(channel.quality || 'sd').toLowerCase()}`;

  if (viewLayout === 'compact') {
    return (
      <div
        onClick={() => onSelectChannel(channel)}
        className={`ch-compact-row ${isPlaying ? 'playing' : ''}`}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          {isPlaying ? (
            <span className="live-dot" />
          ) : (
            <Radio size={14} color="var(--text-muted)" />
          )}
          <span className="ch-compact-name">
            {channel.name}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={qualityClass}>{channel.quality}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(channel);
            }}
            className="fav-btn"
          >
            <Star
              size={14}
              fill={isFavorite ? "#F59E0B" : "none"}
              color={isFavorite ? "#F59E0B" : "var(--text-muted)"}
            />
          </button>
        </div>
      </div>
    );
  }

  if (viewLayout === 'list') {
    return (
      <div
        onClick={() => onSelectChannel(channel)}
        className={`ch-list-row ${isPlaying ? 'playing' : ''}`}
      >
        <div className="ch-list-logo-wrap">
          {channel.logo && !imgError ? (
            <img
              src={channel.logo}
              alt={channel.name}
              referrerPolicy="no-referrer"
              className="ch-list-logo"
              onError={() => setImgError(true)}
            />
          ) : (
            <Tv size={20} color="var(--text-muted)" />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 className="ch-list-title">
              {channel.name}
            </h3>
            {isPlaying && <span className="live-dot" />}
          </div>
          <p className="ch-list-sub">
            {channel.group} {channel.country !== 'Global' ? `• ${channel.country}` : ''}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className={qualityClass}>{channel.quality}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(channel);
            }}
            className="fav-btn"
          >
            <Star
              size={16}
              fill={isFavorite ? "#F59E0B" : "none"}
              color={isFavorite ? "#F59E0B" : "var(--text-muted)"}
            />
          </button>
        </div>
      </div>
    );
  }

  // Default Grid View Card
  return (
    <div
      onClick={() => onSelectChannel(channel)}
      className={`ch-grid-card ${isPlaying ? 'playing' : ''}`}
    >
      {/* Top Card Bar (Quality & Language Badge & Favorite Star) */}
      <div className="ch-card-topbar">
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <span className={qualityClass}>{channel.quality}</span>
          {(channel.isMultiAudio || (channel.languages && channel.languages.length > 1)) && (
            <span className="ch-audio-badge-sm" title="Multi-Audio Available">
              🎧 Audio
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(channel);
          }}
          className="fav-btn"
          title={isFavorite ? "Remove Favorite" : "Add Favorite"}
        >
          <Star
            size={16}
            fill={isFavorite ? "#F59E0B" : "none"}
            color={isFavorite ? "#F59E0B" : "rgba(255, 255, 255, 0.3)"}
          />
        </button>
      </div>

      {/* Center Logo Thumbnail */}
      <div className="ch-card-logo-container">
        {channel.logo && !imgError ? (
          <img
            src={channel.logo}
            alt={channel.name}
            referrerPolicy="no-referrer"
            className="ch-card-logo-img"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="ch-card-logo-fallback">
            <Tv size={24} color="var(--accent-light)" />
          </div>
        )}
      </div>

      {/* Channel Title & Group */}
      <div className="ch-card-info-wrap">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isPlaying && <span className="live-dot" />}
          <h4 className="ch-card-name">
            {channel.name}
          </h4>
        </div>
        <p className="ch-card-group">
          {channel.group || 'Live Broadcast'}
        </p>
      </div>

      {/* Hover Play Glow Overlay */}
      <div className="ch-hover-play">
        <Play size={18} fill="var(--accent)" color="var(--accent)" />
      </div>
    </div>
  );
}
