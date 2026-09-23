import React from 'react';
import {
  Tv, RefreshCw, Shield, ListPlus, HelpCircle,
  Menu, Search as SearchIcon
} from 'lucide-react';

const CATEGORIES = [
  'All', 'News', 'Movies', 'Sports', 'Music', 'Entertainment',
  'General', 'Kids', 'Religious', 'Documentary', 'Animation', 'Comedy', 'Lifestyle', 'Shop', 'Weather',
];

const LANG_PILLS = [
  { label: '🌐 All', value: 'ALL' },
  { label: '🚩 Telugu', value: 'Telugu' },
  { label: '🇮🇳 Hindi', value: 'Hindi' },
  { label: '🇬🇧 English', value: 'English' },
  { label: '🇮🇳 Tamil', value: 'Tamil' },
];

export default function Header({
  searchQuery,
  setSearchQuery,
  totalChannels,
  activePlaylistUrl,
  onOpenPlaylistModal,
  onOpenShortcutsModal,
  corsProxy,
  setCorsProxy,
  onRefreshPlaylist,
  isLoading,
  selectedCategory,
  onCategorySwitch,
  selectedLanguage,
  onLanguageModeSwitch,
  sidebarCollapsed,
  setSidebarCollapsed,
}) {
  return (
    <header className="topbar">
      {/* Primary Top Row */}
      <div className="topbar-main">
        {/* Left: Brand + Channels Toggle */}
        <div className="topbar-left">
          <div className="topbar-brand">
            <div className="topbar-logo">
              <Tv size={20} color="#fff" />
            </div>
            <span className="topbar-title">StreamHub</span>
          </div>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`channels-toggle-btn ${!sidebarCollapsed ? 'active' : ''}`}
            title={sidebarCollapsed ? 'Show channel list' : 'Hide channel list'}
          >
            <Menu size={16} />
            <span className="toggle-text">Channels</span>
            {totalChannels > 0 && (
              <span className="toggle-badge">{totalChannels.toLocaleString()}</span>
            )}
          </button>
        </div>

        {/* Center: Search Bar */}
        <div className="search-wrap">
          <SearchIcon size={15} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder={`Search ${totalChannels > 0 ? totalChannels.toLocaleString() + ' ' : ''}channels…`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="search-clear"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="topbar-actions">
          <button
            onClick={onRefreshPlaylist}
            className="icon-btn"
            disabled={isLoading}
            title="Reload playlist"
          >
            <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
          </button>

          <button
            onClick={() => setCorsProxy(!corsProxy)}
            className={`icon-btn ${corsProxy ? 'active' : ''}`}
            title={corsProxy ? 'CORS Proxy ON (Bypasses stream blocks)' : 'CORS Proxy OFF'}
          >
            <Shield size={15} />
          </button>

          <button
            onClick={onOpenPlaylistModal}
            className="btn-primary playlist-btn"
            title="Add / Change M3U Playlist"
          >
            <ListPlus size={15} />
            <span className="btn-label">Playlist</span>
          </button>

          <button
            onClick={onOpenShortcutsModal}
            className="icon-btn shortcuts-btn"
            title="Keyboard shortcuts (?)"
          >
            <HelpCircle size={15} />
          </button>
        </div>
      </div>

      {/* Filter Row: Languages & Categories */}
      <div className="topbar-filters">
        <div className="filters-scroll-container">
          {/* Language Pills */}
          <div className="lang-pills">
            {LANG_PILLS.map(lp => (
              <button
                key={lp.value}
                className={`lang-pill ${selectedLanguage === lp.value ? 'active' : ''}`}
                onClick={() => onLanguageModeSwitch(lp.value)}
              >
                {lp.label}
              </button>
            ))}
          </div>

          <div className="filter-divider" />

          {/* Category Tabs */}
          <div className="category-tabs">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`cat-tab ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => onCategorySwitch(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

