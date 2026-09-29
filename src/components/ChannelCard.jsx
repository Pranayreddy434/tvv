import React, { useState } from 'react';
import { Star, Tv, Play, Share2, Info, Check } from 'lucide-react';
import { analytics } from '../services/analyticsService';

export default function ChannelCard({
  channel,
  onSelectChannel,
  isPlaying = false,
  isFavorite = false,
  onToggleFavorite,
  onOpenDetails,
  onShareChannel,
  viewLayout = 'grid' // 'grid' | 'rail' | 'list' | 'compact'
}) {
  const [imgError, setImgError] = useState(false);
  const [sharedToast, setSharedToast] = useState(false);

  if (!channel) return null;

  const qualityClass = `badge badge-${(channel.quality || 'sd').toLowerCase()}`;
  const channelNum = channel.channelNumber
    ? String(channel.channelNumber).padStart(3, '0')
    : null;

  const handleShare = (e) => {
    e.stopPropagation();
    if (onShareChannel) {
      onShareChannel(channel);
      return;
    }
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `${channel.name} - Live on StreamHub`,
        text: `Watch ${channel.name} live on StreamHub IPTV!`,
        url: shareUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      setSharedToast(true);
      setTimeout(() => setSharedToast(false), 2000);
    }
  };

  const handleFav = (e) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(channel);
      if (!isFavorite) {
        analytics.favoriteAdded(channel);
      } else {
        analytics.favoriteRemoved(channel);
      }
    }
  };

  const handleDetails = (e) => {
    e.stopPropagation();
    if (onOpenDetails) onOpenDetails(channel);
  };

  // Compact row layout (e.g. for fast lists)
  if (viewLayout === 'compact') {
    return (
      <div
        onClick={() => onSelectChannel(channel)}
        className={`ch-compact-row ${isPlaying ? 'playing' : ''}`}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') onSelectChannel(channel); }}
        role="button"
        aria-label={`Play ${channel.name}`}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          {channelNum && <span className="ch-num-pill">{channelNum}</span>}
          {isPlaying ? (
            <span className="live-dot" />
          ) : (
            <span className="ch-status-dot online" title="Status: Online" />
          )}
          <span className="ch-compact-name">{channel.name}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={qualityClass}>{channel.quality || 'SD'}</span>
          <button
            onClick={handleFav}
            className="fav-btn"
            title={isFavorite ? 'Remove Favorite' : 'Add Favorite'}
            aria-label="Toggle Favorite"
          >
            <Star
              size={14}
              fill={isFavorite ? '#F59E0B' : 'none'}
              color={isFavorite ? '#F59E0B' : 'var(--text-muted)'}
            />
          </button>
        </div>
      </div>
    );
  }

  // List row layout
  if (viewLayout === 'list') {
    return (
      <div
        onClick={() => onSelectChannel(channel)}
        className={`ch-list-row ${isPlaying ? 'playing' : ''}`}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') onSelectChannel(channel); }}
        role="button"
        aria-label={`Play ${channel.name}`}
      >
        <div className="ch-list-logo-wrap">
          {channel.logo && !imgError ? (
            <img
              src={channel.logo}
              alt={channel.name}
              referrerPolicy="no-referrer"
              className="ch-list-logo"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <Tv size={20} color="var(--accent-light)" />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {channelNum && <span className="ch-num-pill">{channelNum}</span>}
            <h3 className="ch-list-title">{channel.name}</h3>
            {channel.isNew && <span className="ch-new-pill">NEW</span>}
            {isPlaying && (
              <span className="live-pill-inline">
                <span className="live-dot" /> LIVE
              </span>
            )}
          </div>
          <p className="ch-list-sub">
            {channel.language && <span>{channel.language} • </span>}
            {channel.group || 'General'}
            {channel.country && channel.country !== 'Global' && ` • ${channel.country}`}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={qualityClass}>{channel.quality || 'SD'}</span>
          <button
            onClick={handleShare}
            className="card-quick-action-btn"
            title="Share channel"
            aria-label="Share"
          >
            {sharedToast ? <Check size={14} color="var(--accent-light)" /> : <Share2 size={14} />}
          </button>
          <button
            onClick={handleFav}
            className="fav-btn"
            title={isFavorite ? 'Remove Favorite' : 'Add Favorite'}
            aria-label="Toggle Favorite"
          >
            <Star
              size={16}
              fill={isFavorite ? '#F59E0B' : 'none'}
              color={isFavorite ? '#F59E0B' : 'var(--text-muted)'}
            />
          </button>
          <button
            className="btn-play-sm"
            onClick={(e) => { e.stopPropagation(); onSelectChannel(channel); }}
            title="Watch now"
          >
            <Play size={13} fill="currentColor" />
            <span>Watch</span>
          </button>
        </div>
      </div>
    );
  }

  // Standard Grid / Rail Card
  return (
    <div
      onClick={() => onSelectChannel(channel)}
      className={`ch-grid-card ${viewLayout === 'rail' ? 'rail-card' : ''} ${isPlaying ? 'playing' : ''}`}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onSelectChannel(channel); }}
      role="button"
      aria-label={`Play ${channel.name}`}
    >
      {/* Top Bar with Number, Badges, and Action Icons */}
      <div className="ch-card-topbar">
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          {channelNum && <span className="ch-num-pill">{channelNum}</span>}
          <span className={qualityClass}>{channel.quality || 'SD'}</span>
          {channel.isNew && <span className="ch-new-pill">NEW</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {onOpenDetails && (
            <button
              onClick={handleDetails}
              className="card-quick-action-btn"
              title="Channel Information"
              aria-label="Channel Details"
            >
              <Info size={13} />
            </button>
          )}

          <button
            onClick={handleShare}
            className="card-quick-action-btn"
            title="Share Channel"
            aria-label="Share Channel"
          >
            {sharedToast ? <Check size={13} color="var(--accent-light)" /> : <Share2 size={13} />}
          </button>

          <button
            onClick={handleFav}
            className="fav-btn"
            title={isFavorite ? 'Remove Favorite' : 'Add Favorite'}
            aria-label="Toggle Favorite"
          >
            <Star
              size={15}
              fill={isFavorite ? '#F59E0B' : 'none'}
              color={isFavorite ? '#F59E0B' : 'rgba(255, 255, 255, 0.4)'}
            />
          </button>
        </div>
      </div>

      {/* Center Logo Area */}
      <div className="ch-card-logo-container">
        {channel.logo && !imgError ? (
          <img
            src={channel.logo}
            alt={channel.name}
            referrerPolicy="no-referrer"
            className="ch-card-logo-img"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="ch-card-logo-fallback">
            <Tv size={26} color="var(--accent-light)" />
            <span className="ch-fallback-initials">
              {channel.name.slice(0, 3).toUpperCase()}
            </span>
          </div>
        )}

        {/* Status Indicator in Corner */}
        <div className="ch-live-indicator-corner">
          <span className="ch-status-indicator online">
            <span className="status-ping" />
            <span className="status-label">LIVE</span>
          </span>
        </div>
      </div>

      {/* Bottom Information */}
      <div className="ch-card-info-wrap">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isPlaying && <span className="live-dot" />}
          <h4 className="ch-card-name" title={channel.name}>
            {channel.name}
          </h4>
        </div>

        <div className="ch-card-tags-row">
          {channel.language && (
            <span className="ch-lang-tag">{channel.language}</span>
          )}
          <span className="ch-group-tag">{channel.group || 'Entertainment'}</span>
        </div>
      </div>

      {/* Hover Action Bar with Watch Button */}
      <div className="ch-hover-overlay">
        <div className="ch-hover-watch-btn">
          <Play size={16} fill="#fff" color="#fff" />
          <span>Watch</span>
        </div>
      </div>
    </div>
  );
}
