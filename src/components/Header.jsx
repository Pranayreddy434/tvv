import React, { useState } from 'react';
import { Tv, RefreshCw, Shield, ListPlus, HelpCircle, ChevronLeft, ChevronRight, Search as SearchIcon } from 'lucide-react';

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
      {/* Brand */}
      <div className="topbar-brand">
        <div className="topbar-logo">
          <Tv size={20} color="#fff" />
        </div>
        <span className="topbar-title #fff">StreamHub</span>
      </div>

      {/* Sidebar toggle */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="icon-btn"
        title={sidebarCollapsed ? 'Show channels' : 'Hide channels'}
      >
        {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className="topbar-divider" />

      {/* Language Pills — independent, don't reset category */}
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

      <div className="topbar-divider" />

      {/* Category Tabs — independent, don't reset language */}
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

      {/* Search */}
      <div className="search-wrap">
        <SearchIcon size={15} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder={`Search ${totalChannels.toLocaleString()} channels…`}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>
        )}
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
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
          title={corsProxy ? 'CORS Proxy ON — click to disable' : 'CORS Proxy OFF — click to enable'}
        >
          <Shield size={15} />
        </button>

        <button onClick={onOpenPlaylistModal} className="btn-primary">
          <ListPlus size={15} />
          <span>Playlist</span>
        </button>

        <button onClick={onOpenShortcutsModal} className="icon-btn" title="Keyboard shortcuts (?)">
          <HelpCircle size={15} />
        </button>
      </div>
    </header>
  );
}
