import React from 'react';
import { Play, Star, Share2, Info, Sparkles, Tv, ShieldCheck } from 'lucide-react';
import { getCurrentAndNextProgram } from '../services/epgService';

export default function HeroBanner({
  channel,
  currentChannel,
  isPlaying,
  onPlayChannel,
  isFavorite,
  onToggleFavorite,
  onOpenDetails,
  onShareChannel
}) {
  const targetChannel = currentChannel || channel;

  if (!targetChannel) return null;

  const { current: currentProg, next: nextProg } = getCurrentAndNextProgram(targetChannel);
  const channelNum = targetChannel.channelNumber
    ? String(targetChannel.channelNumber).padStart(3, '0')
    : null;

  return (
    <section className="hero-banner-container">
      {/* Background Glow & Poster Art */}
      <div className="hero-backdrop">
        <div className="hero-gradient-overlay" />
        <div className="hero-ambient-orb" />
      </div>

      <div className="hero-content">
        {/* Top Badges */}
        <div className="hero-badges-row">
          <div className="hero-live-badge">
            <span className="live-dot" />
            <span>LIVE NOW</span>
          </div>

          {channelNum && (
            <span className="hero-num-badge">CH {channelNum}</span>
          )}

          <span className="hero-quality-badge">{targetChannel.quality || '1080p HD'}</span>

          {targetChannel.isNew && (
            <span className="ch-new-pill">NEW ADDITION</span>
          )}
        </div>

        {/* Channel Header & Title */}
        <div className="hero-title-block">
          <div className="hero-logo-box">
            {targetChannel.logo ? (
              <img
                src={targetChannel.logo}
                alt={targetChannel.name}
                referrerPolicy="no-referrer"
                className="hero-logo-img"
              />
            ) : (
              <Tv size={36} color="var(--accent-light)" />
            )}
          </div>

          <div>
            <h1 className="hero-channel-name">{targetChannel.name}</h1>
            <p className="hero-meta-subtitle">
              {targetChannel.language && <span>{targetChannel.language} • </span>}
              <span>{targetChannel.group || 'General Entertainment'}</span>
              {targetChannel.country && targetChannel.country !== 'Global' && (
                <span> • {targetChannel.country}</span>
              )}
            </p>
          </div>
        </div>

        {/* EPG / Now Playing Information Card */}
        <div className="hero-epg-box">
          <div className="hero-epg-current">
            <div className="hero-epg-label">NOW PLAYING</div>
            <div className="hero-program-title">{currentProg.title}</div>
            <div className="hero-program-time">{currentProg.time}</div>

            {/* Live Progress Bar */}
            <div className="hero-progress-track">
              <div
                className="hero-progress-fill"
                style={{ width: `${currentProg.progress || 50}%` }}
              />
            </div>
          </div>

          {nextProg && (
            <div className="hero-epg-next">
              <div className="hero-epg-label">UP NEXT</div>
              <div className="hero-next-title">{nextProg.title}</div>
              <div className="hero-next-time">{nextProg.time}</div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="hero-actions-row">
          <button
            onClick={() => onPlayChannel(targetChannel)}
            className="btn-hero-play"
            title={`Watch ${targetChannel.name}`}
          >
            <Play size={18} fill="currentColor" />
            <span>{currentChannel?.id === targetChannel.id && isPlaying ? 'Resume Watching' : 'Watch Live'}</span>
          </button>

          <button
            onClick={() => onToggleFavorite(targetChannel)}
            className={`btn-hero-action ${isFavorite ? 'active' : ''}`}
            title={isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
          >
            <Star
              size={17}
              fill={isFavorite ? '#F59E0B' : 'none'}
              color={isFavorite ? '#F59E0B' : 'currentColor'}
            />
            <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
          </button>

          <button
            onClick={() => onShareChannel ? onShareChannel(targetChannel) : null}
            className="btn-hero-action"
            title="Share channel link"
          >
            <Share2 size={17} />
            <span>Share</span>
          </button>

          {onOpenDetails && (
            <button
              onClick={() => onOpenDetails(targetChannel)}
              className="btn-hero-action"
              title="More Channel Details"
            >
              <Info size={17} />
              <span>Details</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
