import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Clock, Sparkles, Filter, Play } from 'lucide-react';
import ChannelCard from './ChannelCard';
import { analytics } from '../services/analyticsService';

const SEARCH_SUGGESTIONS = [
  'Telugu', 'Zee', 'ETV', 'News', 'Movies', 'Sports', 'Gemini', 'Bhakthi', 'HD', 'Kids', 'Hindi', 'English'
];

export default function SmartSearchModal({
  isOpen,
  onClose,
  allChannels = [],
  currentChannel,
  onSelectChannel,
  favorites = [],
  onToggleFavorite,
  onOpenDetails,
  onShareChannel
}) {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const data = localStorage.getItem('iptv_recent_searches');
      return data ? JSON.parse(data) : ['Telugu', 'Zee', 'ETV', 'News'];
    } catch {
      return ['Telugu', 'Zee', 'News'];
    }
  });

  const saveRecentSearch = (term) => {
    if (!term.trim()) return;
    const clean = term.trim();
    const updated = [clean, ...recentSearches.filter(s => s.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
    setRecentSearches(updated);
    localStorage.setItem('iptv_recent_searches', JSON.stringify(updated));
  };

  const removeRecentSearch = (e, term) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== term);
    setRecentSearches(updated);
    localStorage.setItem('iptv_recent_searches', JSON.stringify(updated));
  };

  // Instant Debounced / Live Filter
  const filteredChannels = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return allChannels.filter(ch => {
      const name = (ch.name || '').toLowerCase();
      const group = (ch.group || '').toLowerCase();
      const lang = (ch.language || '').toLowerCase();
      const country = (ch.country || '').toLowerCase();
      const quality = (ch.quality || '').toLowerCase();
      const categories = (ch.categories || []).map(c => c.toLowerCase());

      return (
        name.includes(q) ||
        group.includes(q) ||
        lang.includes(q) ||
        country.includes(q) ||
        quality.includes(q) ||
        categories.some(cat => cat.includes(q))
      );
    });
  }, [allChannels, query]);

  useEffect(() => {
    if (query.trim()) {
      analytics.searchPerformed(query.trim(), filteredChannels.length);
    }
  }, [query, filteredChannels.length]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="smart-search-modal">
        {/* Search Header Input */}
        <div className="smart-search-input-wrap">
          <Search size={20} className="smart-search-icon" />
          <input
            type="text"
            className="smart-search-input"
            placeholder="Search channels by name, language, category, or quality (e.g. 'Zee', 'News', 'HD')…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                saveRecentSearch(query);
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="smart-search-clear"
              title="Clear search"
              aria-label="Clear Search"
            >
              <X size={16} />
            </button>
          )}
          <button onClick={onClose} className="modal-close" style={{ position: 'static' }}>
            <X size={18} />
          </button>
        </div>

        {/* Suggestions & Recent Searches */}
        <div className="smart-search-tags-row">
          {recentSearches.length > 0 && (
            <div className="search-tags-group">
              <div className="search-tags-label">
                <Clock size={12} />
                <span>Recent:</span>
              </div>
              {recentSearches.map((term) => (
                <button
                  key={term}
                  className="search-tag-pill recent"
                  onClick={() => { setQuery(term); saveRecentSearch(term); }}
                >
                  <span>{term}</span>
                  <span
                    className="tag-remove"
                    onClick={(e) => removeRecentSearch(e, term)}
                    title="Remove"
                  >
                    ×
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="search-tags-group">
            <div className="search-tags-label">
              <Sparkles size={12} color="var(--accent-light)" />
              <span>Try:</span>
            </div>
            {SEARCH_SUGGESTIONS.map((term) => (
              <button
                key={term}
                className="search-tag-pill"
                onClick={() => { setQuery(term); saveRecentSearch(term); }}
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Results Body */}
        <div className="smart-search-results-area">
          {!query.trim() ? (
            <div className="search-blank-hint">
              <Sparkles size={36} color="var(--accent-light)" />
              <h3>Search Anything Live</h3>
              <p>Type any channel name like "Zee Telugu", "10TV", "Movies", or "Sports" to view streams instantly.</p>
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className="search-no-results">
              <X size={36} color="var(--text-muted)" />
              <h3>No Channels Found</h3>
              <p>No channels match your query "{query}". Check spelling or try a broader keyword like "News" or "Telugu".</p>
              <button onClick={() => setQuery('')} className="btn-primary" style={{ marginTop: 12 }}>
                Clear Search
              </button>
            </div>
          ) : (
            <div>
              <div className="search-results-header">
                <span>Found <strong>{filteredChannels.length}</strong> matching channels {filteredChannels.length > 60 ? '(showing top 60)' : ''}</span>
              </div>
              <div className="channel-cards-wrapper grid-mode">
                {filteredChannels.slice(0, 60).map((channel) => (
                  <ChannelCard
                    key={channel.id || channel.url}
                    channel={channel}
                    onSelectChannel={(ch) => {
                      saveRecentSearch(query);
                      onSelectChannel(ch);
                      onClose();
                    }}
                    isPlaying={currentChannel && (currentChannel.id === channel.id || currentChannel.url === channel.url)}
                    isFavorite={favorites.some(f => f.id === channel.id || f.url === channel.url)}
                    onToggleFavorite={onToggleFavorite}
                    onOpenDetails={onOpenDetails}
                    onShareChannel={onShareChannel}
                    viewLayout="grid"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
