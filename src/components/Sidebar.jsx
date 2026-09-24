import React, { useState, useMemo } from 'react';
import { Tv, Star, ChevronLeft, ChevronRight, SlidersHorizontal, Clock, ArrowDownAZ, ArrowUpAZ, X } from 'lucide-react';

const CHANNELS_PER_PAGE = 60;

function ChannelItem({ channel, isPlaying, isFavorite, onSelect, onToggleFavorite }) {
  const [imgErr, setImgErr] = useState(false);
  const qClass = `badge badge-${(channel.quality || 'sd').toLowerCase()}`;

  return (
    <div
      className={`ch-card fade-in ${isPlaying ? 'playing' : ''}`}
      onClick={() => onSelect(channel)}
    >
      <div className="ch-logo">
        {channel.logo && !imgErr ? (
          <img src={channel.logo} alt="" referrerPolicy="no-referrer" onError={() => setImgErr(true)} />
        ) : (
          <Tv size={18} color="var(--text-muted)" />
        )}
      </div>

      <div className="ch-info">
        <div className="ch-name">{channel.name}</div>
        <div className="ch-meta">
          {isPlaying && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="live-dot" style={{ width: 6, height: 6, flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: 'var(--accent-light)', fontWeight: 700 }}>LIVE</span>
            </span>
          )}
          <span className="ch-group">{channel.group}</span>
          {(channel.isMultiAudio || (channel.languages && channel.languages.length > 1)) && (
            <span
              className="ch-audio-badge"
              title={`Multi-Language Audio available: ${channel.languages ? channel.languages.join(', ') : 'Multiple tracks'}`}
            >
              🎧 Audio
            </span>
          )}
        </div>
      </div>

      <div className="ch-actions">
        <span className={qClass}>{channel.quality}</span>
        <button
          onClick={e => { e.stopPropagation(); onToggleFavorite(channel); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: isFavorite ? '#F59E0B' : 'var(--text-muted)',
            padding: '2px', lineHeight: 0,
            transition: 'var(--transition)'
          }}
          title={isFavorite ? 'Remove favorite' : 'Add favorite'}
        >
          <Star size={13} fill={isFavorite ? '#F59E0B' : 'none'} />
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({
  channels,
  currentChannel,
  favorites,
  history,
  onSelectChannel,
  onToggleFavorite,
  activeTab,
  setActiveTab,
  collapsed,
  onClose,
  selectedLanguage = 'ALL',
  onLanguageSwitch,
  selectedCategory = 'All',
  onCategorySwitch,
}) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('DEFAULT');
  const [qualityFilter, setQualityFilter] = useState('ALL');

  // Source by tab
  const source = useMemo(() => {
    if (activeTab === 'favorites') return favorites;
    if (activeTab === 'history') return history;
    return channels;
  }, [channels, favorites, history, activeTab]);

  // Filter + sort
  const processed = useMemo(() => {
    let list = [...source];
    if (qualityFilter === 'MULTI_AUDIO') {
      list = list.filter(ch => ch.isMultiAudio || (ch.languages && ch.languages.length > 1));
    } else if (qualityFilter !== 'ALL') {
      list = list.filter(ch => (ch.quality || 'SD').toUpperCase() === qualityFilter);
    }
    if (sort === 'A-Z') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'Z-A') list.sort((a, b) => b.name.localeCompare(a.name));
    return list;
  }, [source, sort, qualityFilter]);

  const totalPages = Math.max(1, Math.ceil(processed.length / CHANNELS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const slice = processed.slice((safePage - 1) * CHANNELS_PER_PAGE, safePage * CHANNELS_PER_PAGE);

  // Reset page when source/filters change
  useMemo(() => { setPage(1); }, [sort, qualityFilter, activeTab, channels.length]);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Header: tabs + controls */}
      <div className="sidebar-header">
        {/* Mobile Header Bar */}
        <div className="sidebar-mobile-header">
          <div className="sidebar-mobile-title">
            <Tv size={16} color="var(--accent)" />
            <span>Channel Directory</span>
          </div>
          {onClose && (
            <button className="sidebar-close-btn" onClick={onClose} title="Close channel drawer">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Tab row */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { key: 'all', label: `Channels (${channels.length.toLocaleString()})` },
            { key: 'favorites', label: `★ ${favorites.length}` },
            { key: 'history', label: `⏱ ${history.length}` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
              style={{
                flex: 1,
                padding: '6px 6px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid',
                borderColor: activeTab === tab.key ? 'var(--border-active)' : 'var(--border)',
                background: activeTab === tab.key ? 'var(--accent-dim)' : 'transparent',
                color: activeTab === tab.key ? 'var(--accent-light)' : 'var(--text-muted)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--transition)',
                fontFamily: 'var(--font-body)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Desktop Controls (Hidden on smaller screens) */}
        <div className="sidebar-controls sidebar-desktop-controls">
          <select
            className="sidebar-select"
            value={qualityFilter}
            onChange={e => setQualityFilter(e.target.value)}
            title="Filter by Quality"
          >
            <option value="ALL">All Qualities</option>
            <option value="MULTI_AUDIO">🎧 Multi-Audio</option>
            <option value="4K">4K Quality</option>
            <option value="1080P">1080p</option>
            <option value="720P">720p</option>
            <option value="SD">SD Quality</option>
          </select>
          <select
            className="sidebar-select"
            value={sort}
            onChange={e => setSort(e.target.value)}
            title="Sort channels"
          >
            <option value="DEFAULT">Default</option>
            <option value="A-Z">A → Z</option>
            <option value="Z-A">Z → A</option>
          </select>
        </div>

        {/* Mobile / Smaller Screen Controls: Select Language & Select Category */}
        <div className="sidebar-mobile-filters">
          <div className="sidebar-mobile-select-group">
            <label className="sidebar-select-tag">Select Language</label>
            <select
              className="sidebar-select sidebar-responsive-select"
              value={selectedLanguage}
              onChange={e => onLanguageSwitch && onLanguageSwitch(e.target.value)}
            >
              <option value="ALL">🌐 All Languages</option>
              <option value="Telugu">🚩 Telugu</option>
              <option value="Hindi">🇮🇳 Hindi</option>
              <option value="English">🇬🇧 English</option>
              <option value="Tamil">🇮🇳 Tamil</option>
            </select>
          </div>

          <div className="sidebar-mobile-select-group">
            <label className="sidebar-select-tag">Select Category</label>
            <select
              className="sidebar-select sidebar-responsive-select"
              value={selectedCategory}
              onChange={e => onCategorySwitch && onCategorySwitch(e.target.value)}
            >
              <option value="All">📁 All Categories</option>
              <option value="News">News</option>
              <option value="Movies">Movies</option>
              <option value="Sports">Sports</option>
              <option value="Music">Music</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Kids">Kids</option>
              <option value="General">General</option>
              <option value="Documentary">Documentary</option>
              <option value="Religious">Religious</option>
              <option value="Lifestyle">Lifestyle</option>
            </select>
          </div>
        </div>

        <div className="sidebar-meta">
          <span className="sidebar-count">
            {processed.length.toLocaleString()} channels
          </span>
          <span className="sidebar-count">
            Page {safePage}/{totalPages}
          </span>
        </div>
      </div>

      {/* Channel List */}
      <div className="channel-list">
        {slice.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No channels found
          </div>
        ) : (
          slice.map(ch => (
            <ChannelItem
              key={ch.id || ch.url}
              channel={ch}
              isPlaying={currentChannel?.id === ch.id || currentChannel?.url === ch.url}
              isFavorite={favorites.some(f => f.id === ch.id || f.url === ch.url)}
              onSelect={onSelectChannel}
              onToggleFavorite={onToggleFavorite}
            />
          ))
        )}
      </div>

      {/* Pagination Bar firmly docked at bottom without overlap */}
      {totalPages > 1 && (
        <div className="pagination-bar">
          <button
            className="page-btn"
            disabled={safePage === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="page-info">{safePage} / {totalPages}</span>
          <button
            className="page-btn"
            disabled={safePage === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </aside>
  );
}
