import React, { useState } from 'react';
import { X, Play, Star, Share2, Copy, Check, Tv, Radio, ShieldCheck, Globe } from 'lucide-react';
import { getCurrentAndNextProgram } from '../services/epgService';

export default function ChannelDetailsModal({
  channel,
  onClose,
  onPlayChannel,
  isFavorite,
  onToggleFavorite,
  onShareChannel
}) {
  const [copied, setCopied] = useState(false);

  if (!channel) return null;

  const { current: currentProg, next: nextProg } = getCurrentAndNextProgram(channel);
  const channelNum = channel.channelNumber ? String(channel.channelNumber).padStart(3, '0') : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(channel.url || channel.streamUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box channel-details-modal">
        <button onClick={onClose} className="modal-close">
          <X size={18} />
        </button>

        {/* Channel Banner Header */}
        <div className="details-header-block">
          <div className="details-logo-wrap">
            {channel.logo ? (
              <img src={channel.logo} alt={channel.name} referrerPolicy="no-referrer" />
            ) : (
              <Tv size={36} color="var(--accent-light)" />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {channelNum && <span className="ch-num-pill">CH {channelNum}</span>}
              <h2 className="details-title">{channel.name}</h2>
              {channel.isNew && <span className="ch-new-pill">NEW</span>}
            </div>

            <div className="details-meta-row">
              <span className="live-pill-inline">
                <span className="live-dot" /> LIVE STREAM
              </span>
              <span className={`badge badge-${(channel.quality || 'sd').toLowerCase()}`}>
                {channel.quality || 'HD'}
              </span>
              {channel.language && (
                <span className="details-meta-item">
                  <Globe size={12} /> {channel.language}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* EPG Schedule Preview */}
        <div className="details-epg-box">
          <div className="details-epg-item">
            <div className="epg-badge-label">NOW BROADCASTING</div>
            <div className="epg-show-title">{currentProg.title}</div>
            <div className="epg-show-time">{currentProg.time}</div>
          </div>

          {nextProg && (
            <div className="details-epg-item">
              <div className="epg-badge-label">UP NEXT</div>
              <div className="epg-show-title">{nextProg.title}</div>
              <div className="epg-show-time">{nextProg.time}</div>
            </div>
          )}
        </div>

        {/* Technical Metadata */}
        <div className="details-specs-grid">
          <div className="spec-card">
            <span className="spec-label">Category</span>
            <span className="spec-val">{channel.group || 'General'}</span>
          </div>
          <div className="spec-card">
            <span className="spec-label">Language</span>
            <span className="spec-val">{channel.language || 'Original'}</span>
          </div>
          <div className="spec-card">
            <span className="spec-label">Region</span>
            <span className="spec-val">{channel.country || 'India'}</span>
          </div>
          <div className="spec-card">
            <span className="spec-label">Health</span>
            <span className="spec-val" style={{ color: '#10B981' }}>🟢 Online</span>
          </div>
        </div>

        {/* Description */}
        {channel.description && (
          <p className="details-desc">{channel.description}</p>
        )}

        {/* Action Buttons */}
        <div className="details-actions-footer">
          <button
            onClick={() => { onPlayChannel(channel); onClose(); }}
            className="btn-primary"
            style={{ flex: 1, padding: '10px 18px', fontSize: 14 }}
          >
            <Play size={16} fill="currentColor" />
            <span>Watch Live</span>
          </button>

          <button
            onClick={() => onToggleFavorite(channel)}
            className="btn-secondary"
            title={isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
          >
            <Star
              size={16}
              fill={isFavorite ? '#F59E0B' : 'none'}
              color={isFavorite ? '#F59E0B' : 'currentColor'}
            />
            <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
          </button>

          <button
            onClick={() => onShareChannel ? onShareChannel(channel) : null}
            className="btn-secondary"
            title="Share channel"
          >
            <Share2 size={16} />
            <span>Share</span>
          </button>

          <button
            onClick={handleCopy}
            className="btn-secondary"
            title="Copy stream URL"
          >
            {copied ? <Check size={16} color="var(--accent-light)" /> : <Copy size={16} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
