import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Clock, Sparkles, Film, Languages, Hash, Play, Star } from 'lucide-react';
import ChannelCard from './ChannelCard';
import { analytics } from '../services/analyticsService';

const SEARCH_SUGGESTIONS = [
  'Telugu', 'Hindi', 'Tamil', 'News', 'Movies', 'Sports', 'Music', 'Kids', 'TV9', 'ETV', 'Gemini', 'Star Maa'
];

function normalize(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

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
      return data ? JSON.parse(data) : ['Telugu', 'News', 'Movies'];
    } catch {
      return ['Telugu', 'News', 'Movies'];
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

  // Grouped Search Results & Multi-token Matching
  const searchResults = useMemo(() => {
    const rawQ = query.trim().toLowerCase();
    if (!rawQ) return { channels: [], matchingCategories: [], matchingLanguages: [] };

    const queryTokens = rawQ.split(/\s+/).filter(Boolean);
    const compactQ = normalize(rawQ);
    const isNumQuery = /^\d+$/.test(rawQ);
    const queryNum = isNumQuery ? parseInt(rawQ, 10) : null;

    // Filter channels
    const channels = allChannels.filter(ch => {
      // 1. Channel number match
      if (queryNum !== null && ch.channelNumber === queryNum) return true;

      const name = (ch.name || '').toLowerCase();
      const compactName = normalize(name);
      const group = (ch.group || '').toLowerCase();
      const lang = (ch.language || '').toLowerCase();
      const country = (ch.country || '').toLowerCase();
      const cats = (ch.categories || []).map(c => c.toLowerCase());
      const desc = (ch.description || '').toLowerCase();

      // Compact match (e.g. "tv 9" matches "tv9", "tv9" matches "tv 9 telugu")
      if (compactQ && compactName.includes(compactQ)) return true;

      // Every word in query must match somewhere in channel metadata
      const allTokensMatch = queryTokens.every(token => {
        const compactToken = normalize(token);
        return (
          name.includes(token) ||
          compactName.includes(compactToken) ||
          group.includes(token) ||
          lang.includes(token) ||
          country.includes(token) ||
          desc.includes(token) ||
          cats.some(c => c.includes(token))
        );
      });

      return allTokensMatch;
    });

    // Extract matching distinct categories
    const matchedCats = new Set();
    const matchedLangs = new Set();

    allChannels.forEach(ch => {
      (ch.categories || []).forEach(cat => {
        if (cat.toLowerCase().includes(rawQ) || rawQ.includes(cat.toLowerCase())) {
          matchedCats.add(cat);
        }
      });
      if (ch.language && (ch.language.toLowerCase().includes(rawQ) || rawQ.includes(ch.language.toLowerCase()))) {
        matchedLangs.add(ch.language);
      }
    });

    return {
      channels,
      matchingCategories: Array.from(matchedCats).slice(0, 6),
      matchingLanguages: Array.from(matchedLangs).slice(0, 6)
    };
  }, [allChannels, query]);

  useEffect(() => {
    if (query.trim()) {
      analytics.searchPerformed(query.trim(), searchResults.channels.length);
    }
  }, [query, searchResults.channels.length]);

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
            placeholder="Search TV9, Telugu News, Movies, 101, Sports…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                saveRecentSearch(query);
                if (searchResults.channels.length > 0) {
                  onSelectChannel(searchResults.channels[0]);
                  onClose();
                }
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
              <span>Trending:</span>
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

        {/* Grouped Filter Results Header (Categories & Languages) */}
        {(searchResults.matchingCategories.length > 0 || searchResults.matchingLanguages.length > 0) && (
          <div className="search-grouped-pills-bar">
            {searchResults.matchingCategories.map(cat => (
              <button
                key={cat}
                className="search-group-pill cat"
                onClick={() => setQuery(cat)}
              >
                <Film size={12} />
                <span>Category: {cat}</span>
              </button>
            ))}
            {searchResults.matchingLanguages.map(lang => (
              <button
                key={lang}
                className="search-group-pill lang"
                onClick={() => setQuery(lang)}
              >
                <Languages size={12} />
                <span>Language: {lang}</span>
              </button>
            ))}
          </div>
        )}

        {/* Results Body */}
        <div className="smart-search-results-area">
          {!query.trim() ? (
            <div className="search-blank-hint">
              <Sparkles size={38} color="var(--accent-light)" />
              <h3>Search Any Live Channel</h3>
              <p>Type a channel name (e.g. "TV9 Telugu"), genre ("News", "Movies"), or channel number to instantly tune in.</p>
            </div>
          ) : searchResults.channels.length === 0 ? (
            <div className="search-no-results">
              <X size={36} color="var(--text-muted)" />
              <h3>No Channels Found</h3>
              <p>No broadcast match for "{query}". Try checking alternate spellings or searching for "Telugu", "Hindi", or "News".</p>
              <button onClick={() => setQuery('')} className="btn-primary" style={{ marginTop: 12 }}>
                Clear Search
              </button>
            </div>
          ) : (
            <div>
              <div className="search-results-header">
                <span>
                  Found <strong>{searchResults.channels.length}</strong> channel{searchResults.channels.length === 1 ? '' : 's'}
                  {searchResults.channels.length > 60 ? ' (showing top 60)' : ''}
                </span>
              </div>
              <div className="channel-cards-wrapper grid-mode">
                {searchResults.channels.slice(0, 60).map((channel) => (
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
