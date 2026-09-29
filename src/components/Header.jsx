import React, { useState, useEffect } from 'react';
import {
  Tv, Home, Film, Calendar, Star, Search, Settings,
  RefreshCw, Shield, ListPlus, HelpCircle, Menu, Hash,
  Palette, Sparkles, X
} from 'lucide-react';
import { CATEGORIES_LIST } from '../data/defaultChannels';

export default function Header({
  activeNav = 'home',
  onNavigate,
  searchQuery,
  setSearchQuery,
  onOpenSearchModal,
  totalChannels = 0,
  favoritesCount = 0,
  activePlaylistUrl,
  onOpenPlaylistModal,
  onOpenShortcutsModal,
  onOpenSettingsModal,
  onOpenDialerModal,
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
  const [showCatDropdown, setShowCatDropdown] = useState(false);

  return (
    <header className="topbar">
      {/* Top Main Navigation Row */}
      <div className="topbar-main">
        {/* Left: Brand + Navigation Links */}
        <div className="topbar-left">
          <div
            className="topbar-brand"
            onClick={() => onNavigate && onNavigate('home')}
            style={{ cursor: 'pointer' }}
          >
            <div className="topbar-logo">
              <Tv size={20} color="#fff" />
            </div>
            <div className="brand-text-wrap">
              <span className="topbar-title">StreamHub</span>
              <span className="topbar-badge">OTT</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="topbar-nav-links" aria-label="Main Navigation">
            <button
              className={`nav-link-btn ${activeNav === 'home' ? 'active' : ''}`}
              onClick={() => onNavigate('home')}
            >
              <Home size={15} />
              <span>Home</span>
            </button>

            <button
              className={`nav-link-btn ${activeNav === 'live' ? 'active' : ''}`}
              onClick={() => onNavigate('live')}
            >
              <Tv size={15} />
              <span>Live TV</span>
            </button>

            <button
              className={`nav-link-btn ${activeNav === 'categories' ? 'active' : ''}`}
              onClick={() => onNavigate('categories')}
            >
              <Film size={15} />
              <span>Categories</span>
            </button>

            <button
              className={`nav-link-btn ${activeNav === 'tvguide' ? 'active' : ''}`}
              onClick={() => onNavigate('tvguide')}
            >
              <Calendar size={15} />
              <span>TV Guide</span>
            </button>

            <button
              className={`nav-link-btn ${activeNav === 'favorites' ? 'active' : ''}`}
              onClick={() => onNavigate('favorites')}
            >
              <Star size={15} fill={favoritesCount > 0 ? '#F59E0B' : 'none'} color={favoritesCount > 0 ? '#F59E0B' : 'currentColor'} />
              <span>Favorites</span>
              {favoritesCount > 0 && <span className="nav-badge-count">{favoritesCount}</span>}
            </button>
          </nav>
        </div>

        {/* Center: Search Bar Trigger or Inline Input */}
        <div className="search-wrap" onClick={onOpenSearchModal}>
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search channels, languages, categories (or press /)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={(e) => { e.stopPropagation(); onOpenSearchModal(); }}
            readOnly
          />
          <kbd className="search-hotkey-kbd">/</kbd>
        </div>

        {/* Right: Actions (Channel # Dialer, CORS Proxy, Reload, Playlist, Shortcuts, Settings) */}
        <div className="topbar-actions">
          {/* Quick Channel # Dialer */}
          <button
            onClick={onOpenDialerModal}
            className="theme-selector-btn"
            title="Dial Channel Number (#)"
          >
            <Hash size={14} color="var(--accent-light)" />
            <span>Channel #</span>
          </button>

          {/* CORS Proxy Toggle */}
          <button
            onClick={() => setCorsProxy(!corsProxy)}
            className={`icon-btn ${corsProxy ? 'active-gold' : ''}`}
            title={corsProxy ? 'CORS Proxy Active (Bypasses stream restrictions)' : 'CORS Proxy Disabled'}
          >
            <Shield size={16} />
          </button>

          {/* Refresh Streams */}
          <button
            onClick={onRefreshPlaylist}
            className="icon-btn"
            disabled={isLoading}
            title="Refresh channels"
          >
            <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
          </button>

          {/* Load M3U Playlist */}
          <button
            onClick={onOpenPlaylistModal}
            className="btn-primary playlist-btn"
            title="Load M3U Playlist"
          >
            <ListPlus size={15} />
            <span className="btn-label">Playlist</span>
          </button>

          {/* Settings Modal */}
          <button
            onClick={onOpenSettingsModal}
            className="icon-btn"
            title="Settings"
          >
            <Settings size={16} />
          </button>

          {/* Shortcuts */}
          <button
            onClick={onOpenShortcutsModal}
            className="icon-btn shortcuts-btn"
            title="Keyboard Shortcuts (?)"
          >
            <HelpCircle size={15} />
          </button>

          {/* Mobile Drawer Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="mobile-sidebar-toggle-btn"
            title="Toggle channel drawer"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {/* Sub-Header Horizontal Category Tabs (Instant Filtering) */}
      <div className="topbar-filters">
        <div className="filters-scroll-container">
          {CATEGORIES_LIST.map((cat) => (
            <button
              key={cat}
              className={`cat-tab ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => {
                onCategorySwitch(cat);
                onNavigate('categories');
              }}
            >
              {cat === 'All' ? '🌐 All Channels' : cat}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
