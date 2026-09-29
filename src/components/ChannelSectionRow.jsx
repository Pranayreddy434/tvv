import React, { useRef, useEffect } from 'react';
import ChannelCard from './ChannelCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ChannelSectionRow({
  title,
  icon: Icon,
  subtitle,
  channels = [],
  currentChannel,
  onSelectChannel,
  favorites = [],
  onToggleFavorite,
  onOpenDetails,
  onShareChannel,
  badge,
  onViewAll,
  maxDisplay = 24
}) {
  const scrollRef = useRef(null);

  if (!channels || channels.length === 0) return null;

  const displayedChannels = channels.slice(0, maxDisplay);
  const remainingCount = channels.length - displayedChannels.length;

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Enable smooth horizontal scrolling with mouse wheel over the row
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollWidth > el.clientWidth) {
        const canScrollLeft = el.scrollLeft > 0;
        const canScrollRight = el.scrollLeft < (el.scrollWidth - el.clientWidth - 1);
        if ((e.deltaY > 0 && canScrollRight) || (e.deltaY < 0 && canScrollLeft)) {
          e.preventDefault();
          el.scrollLeft += e.deltaY;
        }
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <div className="channel-section-row">
      {/* Section Header */}
      <div className="section-row-header">
        <div className="section-title-group">
          {Icon && (
            <div className="section-icon-box">
              <Icon size={18} color="var(--accent-light)" />
            </div>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 className="section-title">{title}</h2>
              {badge && <span className="section-badge">{badge}</span>}
              <span className="section-count">({channels.length})</span>
            </div>
            {subtitle && <p className="section-subtitle">{subtitle}</p>}
          </div>
        </div>

        {/* Scroll Arrows & View All */}
        <div className="section-nav-arrows" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onViewAll && remainingCount > 0 && (
            <button
              onClick={onViewAll}
              className="section-view-all-btn"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--accent-light)',
                fontSize: '12px',
                fontWeight: 600,
                padding: '4px 10px',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
            >
              View All ({channels.length}) →
            </button>
          )}
          <button
            onClick={() => scroll('left')}
            className="section-arrow-btn"
            title="Scroll Left"
            aria-label="Previous Channels"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="section-arrow-btn"
            title="Scroll Right"
            aria-label="Next Channels"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div className="section-carousel-track" ref={scrollRef}>
        {displayedChannels.map((ch) => (
          <ChannelCard
            key={ch.id || ch.url}
            channel={ch}
            onSelectChannel={onSelectChannel}
            isPlaying={currentChannel && (currentChannel.id === ch.id || currentChannel.url === ch.url)}
            isFavorite={favorites.some(f => f.id === ch.id || f.url === ch.url)}
            onToggleFavorite={onToggleFavorite}
            onOpenDetails={onOpenDetails}
            onShareChannel={onShareChannel}
            viewLayout="rail"
          />
        ))}

        {remainingCount > 0 && onViewAll && (
          <div
            onClick={onViewAll}
            className="ch-grid-card rail-card view-all-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '160px',
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px dashed var(--border-hover)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              textAlign: 'center',
              gap: '8px'
            }}
          >
            <span style={{ fontSize: '24px', color: 'var(--accent-light)' }}>+{remainingCount}</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>More Channels</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Explore all in {title}</span>
          </div>
        )}
      </div>
    </div>
  );
}
