import React from 'react';
import { Play, RotateCcw, X, Tv, Clock } from 'lucide-react';

function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Recently';
  const diff = Date.now() - Number(timestamp);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 2) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ContinueWatchingRow({
  history = [],
  lastWatched,
  onPlayChannel,
  onRemoveItem,
  onClearAll
}) {
  // Consolidate list from history or lastWatched
  const items = React.useMemo(() => {
    if (Array.isArray(history) && history.length > 0) {
      return history.slice(0, 15);
    }
    if (lastWatched) {
      return [lastWatched];
    }
    return [];
  }, [history, lastWatched]);

  if (items.length === 0) return null;

  return (
    <div className="continue-watching-section">
      <div className="section-header-row">
        <div className="section-title-wrap">
          <div className="section-icon-badge">
            <RotateCcw size={16} color="var(--accent-light)" />
          </div>
          <div>
            <h2 className="section-title">Continue Watching</h2>
            <p className="section-subtitle">Jump straight back into your recently viewed broadcasts</p>
          </div>
        </div>

        {items.length > 1 && onClearAll && (
          <button
            onClick={onClearAll}
            className="clear-history-link-btn"
            title="Clear Continue Watching"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="continue-watching-carousel">
        {items.map((item) => {
          const ch = item.channel || item;
          const channelNum = ch.channelNumber
            ? String(ch.channelNumber).padStart(3, '0')
            : null;
          const watchedAt = item.lastWatched || item.watchedAt;

          return (
            <div
              key={ch.id || ch.url}
              className="continue-card"
              onClick={() => onPlayChannel(ch)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') onPlayChannel(ch); }}
            >
              {/* Individual Card Remove Button */}
              {onRemoveItem && (
                <button
                  className="continue-card-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(ch);
                  }}
                  title="Remove from Continue Watching"
                  aria-label={`Remove ${ch.name}`}
                >
                  <X size={13} />
                </button>
              )}

              {/* Logo / Thumbnail Box */}
              <div className="continue-card-thumb">
                {ch.logo ? (
                  <img
                    src={ch.logo}
                    alt={ch.name}
                    referrerPolicy="no-referrer"
                    className="continue-card-img"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="continue-card-fallback">
                    <Tv size={24} color="var(--accent-light)" />
                  </div>
                )}
                <div className="continue-card-play-hover">
                  <Play size={18} fill="#fff" />
                </div>
              </div>

              {/* Info Details */}
              <div className="continue-card-body">
                <div className="continue-card-title-row">
                  {channelNum && <span className="ch-num-pill-sm">{channelNum}</span>}
                  <span className="continue-card-name" title={ch.name}>
                    {ch.name}
                  </span>
                </div>

                <div className="continue-card-meta">
                  <span className="continue-card-genre">{ch.group || ch.language || 'Live'}</span>
                  {watchedAt && (
                    <span className="continue-card-time">
                      <Clock size={11} style={{ marginRight: 3, verticalAlign: -1 }} />
                      {formatRelativeTime(watchedAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
