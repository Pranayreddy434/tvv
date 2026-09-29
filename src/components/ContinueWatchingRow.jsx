import React from 'react';
import { Play, RotateCcw, X, Tv, Clock } from 'lucide-react';

export default function ContinueWatchingRow({
  lastWatched,
  onPlayChannel,
  onDismiss
}) {
  if (!lastWatched) return null;

  const channelNum = lastWatched.channelNumber
    ? String(lastWatched.channelNumber).padStart(3, '0')
    : null;

  return (
    <div className="continue-watching-banner">
      <div className="continue-watching-left">
        <div className="continue-icon-pill">
          <RotateCcw size={15} color="var(--accent-light)" />
          <span>CONTINUE WATCHING</span>
        </div>

        <div className="continue-channel-info">
          <div className="continue-logo-box">
            {lastWatched.logo ? (
              <img
                src={lastWatched.logo}
                alt={lastWatched.name}
                referrerPolicy="no-referrer"
                className="continue-logo-img"
              />
            ) : (
              <Tv size={22} color="var(--accent-light)" />
            )}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {channelNum && <span className="ch-num-pill">{channelNum}</span>}
              <h3 className="continue-title">{lastWatched.name}</h3>
              <span className="live-dot" />
            </div>
            <p className="continue-sub">
              {lastWatched.language && <span>{lastWatched.language} • </span>}
              <span>{lastWatched.group || 'Live Stream'}</span>
              <span> • Ready to resume</span>
            </p>
          </div>
        </div>
      </div>

      <div className="continue-actions">
        <button
          onClick={() => onPlayChannel(lastWatched)}
          className="btn-continue-play"
          title={`Resume ${lastWatched.name}`}
        >
          <Play size={16} fill="currentColor" />
          <span>Resume</span>
        </button>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="btn-continue-dismiss"
            title="Dismiss Continue Watching"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
