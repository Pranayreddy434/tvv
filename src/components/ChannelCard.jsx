import React, { useState } from 'react';
import { Star, Tv, Play, Radio, Signal } from 'lucide-react';

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
        style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          padding: '8px 14px',
          backgroundColor: isPlaying ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-glass-card)',
          border: isPlaying ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={(e) => {
          if (!isPlaying) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
        }}
        onMouseLeave={(e) => {
          if (!isPlaying) e.currentTarget.style.backgroundColor = 'var(--bg-glass-card)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          {isPlaying ? (
            <span className="live-indicator"></span>
          ) : (
            <Radio size={14} color="var(--text-dim)" />
          )}
          <span style={{ fontSize: '13px', fontWeight: isPlaying ? 600 : 400, color: isPlaying ? '#818cf8' : 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {channel.name}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={qualityClass} style={{ fontSize: '9px', padding: '1px 5px' }}>{channel.quality}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(channel);
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
          >
            <Star size={14} fill={isFavorite ? "#ec4899" : "none"} color={isFavorite ? "#ec4899" : "var(--text-dim)"} />
          </button>
        </div>
      </div>
    );
  }

  if (viewLayout === 'list') {
    return (
      <div
        onClick={() => onSelectChannel(channel)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '10px 16px',
          backgroundColor: isPlaying ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-glass-card)',
          border: isPlaying ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
          borderRadius: '10px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'rgba(0, 0, 0, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, padding: '4px' }}>
          {channel.logo && !imgError ? (
            <img
              src={channel.logo}
              alt={channel.name}
              referrerPolicy="no-referrer"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={() => setImgError(true)}
            />
          ) : (
            <Tv size={22} color="var(--text-muted)" />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: isPlaying ? '#818cf8' : 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {channel.name}
            </h3>
            {isPlaying && <span className="live-indicator"></span>}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
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
            className="btn-icon"
            style={{ border: 'none', background: 'none' }}
          >
            <Star size={16} fill={isFavorite ? "#ec4899" : "none"} color={isFavorite ? "#ec4899" : "var(--text-dim)"} />
          </button>
        </div>
      </div>
    );
  }

  // Default Grid View Card
  return (
    <div
      onClick={() => onSelectChannel(channel)}
      className="glass-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '14px',
        position: 'relative',
        cursor: 'pointer',
        borderColor: isPlaying ? 'var(--accent-primary)' : 'var(--border-color)',
        boxShadow: isPlaying ? '0 0 15px var(--accent-glow)' : 'none'
      }}
    >
      {/* Top Card Bar (Quality & Language Badge & Favorite Star) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <span className={qualityClass}>{channel.quality}</span>
          {channel.language && channel.language !== 'English' && (
            <span style={{ fontSize: '10px', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '2px 6px', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.3)', fontWeight: 600 }}>
              {channel.language}
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(channel);
          }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          title={isFavorite ? "Remove Favorite" : "Add Favorite"}
        >
          <Star size={18} fill={isFavorite ? "#ec4899" : "none"} color={isFavorite ? "#ec4899" : "rgba(255, 255, 255, 0.4)"} />
        </button>
      </div>

      {/* Center Logo Thumbnail */}
      <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', overflow: 'hidden' }}>
        {channel.logo && !imgError ? (
          <img
            src={channel.logo}
            alt={channel.name}
            referrerPolicy="no-referrer"
            style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Tv size={26} color="var(--text-muted)" />
          </div>
        )}
      </div>

      {/* Channel Title & Group */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isPlaying && <span className="live-indicator"></span>}
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: isPlaying ? '#818cf8' : 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.3' }}>
            {channel.name}
          </h4>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {channel.group}
        </p>
      </div>
    </div>
  );
}
