import React, { useState, useEffect, useMemo, useRef } from 'react';
import ChannelCard from './ChannelCard';
import EmptyState from './EmptyState';
import { SkeletonCard } from './SkeletonLoader';
import {
  ChevronLeft, ChevronRight, SlidersHorizontal, LayoutGrid, List,
  Sparkles, X, RotateCcw, Filter, ArrowDown
} from 'lucide-react';
import { CATEGORIES_LIST } from '../data/defaultChannels';

const INITIAL_BATCH = 24;
const BATCH_SIZE = 24;

export default function ChannelGrid({
  channels = [],
  currentChannel,
  onSelectChannel,
  favorites = [],
  onToggleFavorite,
  onOpenDetails,
  onShareChannel,
  selectedCategory = 'All',
  onCategorySwitch,
  selectedLanguage = 'ALL',
  onLanguageSwitch,
  searchQuery = '',
  isLoading = false
}) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const [qualityFilter, setQualityFilter] = useState('ALL');
  const [liveFilter, setLiveFilter] = useState('ALL'); // 'ALL' | 'ONLINE'
  const [favsOnlyFilter, setFavsOnlyFilter] = useState(false);
  const [sortOrder, setSortOrder] = useState('DEFAULT'); // 'DEFAULT' | 'A-Z' | 'Z-A' | 'RECENT' | 'FAVORITES'
  const [viewLayout, setViewLayout] = useState('grid'); // 'grid' | 'list'
  const sentinelRef = useRef(null);

  // Reset visibleCount when any filter changes
  useEffect(() => {
    setVisibleCount(INITIAL_BATCH);
  }, [searchQuery, selectedCategory, selectedLanguage, qualityFilter, liveFilter, favsOnlyFilter, sortOrder]);

  // Active filters count
  const hasActiveFilters = qualityFilter !== 'ALL' || liveFilter !== 'ALL' || favsOnlyFilter || sortOrder !== 'DEFAULT' || selectedCategory !== 'All' || selectedLanguage !== 'ALL';

  const clearAllFilters = () => {
    setQualityFilter('ALL');
    setLiveFilter('ALL');
    setFavsOnlyFilter(false);
    setSortOrder('DEFAULT');
    if (onCategorySwitch) onCategorySwitch('All');
    if (onLanguageSwitch) onLanguageSwitch('ALL');
  };

  // Filter & Sort Pipeline
  const processedChannels = useMemo(() => {
    let result = [...channels];

    // Favorites only filter
    if (favsOnlyFilter) {
      result = result.filter(ch => favorites.some(f => f.id === ch.id || f.url === ch.url));
    }

    // Quality Filter
    if (qualityFilter !== 'ALL') {
      result = result.filter(ch => (ch.quality || 'SD').toUpperCase().includes(qualityFilter));
    }

    // Live filter
    if (liveFilter === 'ONLINE') {
      result = result.filter(ch => ch.status !== 'offline');
    }

    // Sorting options (Requirement 24)
    if (sortOrder === 'A-Z') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === 'Z-A') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortOrder === 'RECENT') {
      result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    } else if (sortOrder === 'FAVORITES') {
      result.sort((a, b) => {
        const aFav = favorites.some(f => f.id === a.id || f.url === a.url);
        const bFav = favorites.some(f => f.id === b.id || f.url === b.url);
        return (bFav ? 1 : 0) - (aFav ? 1 : 0);
      });
    }

    return result;
  }, [channels, qualityFilter, liveFilter, favsOnlyFilter, sortOrder, favorites]);

  // Infinite scroll lazy loading observer
  useEffect(() => {
    if (visibleCount >= processedChannels.length) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount(prev => Math.min(prev + BATCH_SIZE, processedChannels.length));
        }
      },
      { rootMargin: '350px' }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }
    return () => observer.disconnect();
  }, [visibleCount, processedChannels.length]);

  const currentSlice = processedChannels.slice(0, visibleCount);

  return (
    <div className="channel-grid-container">
      {/* Filter and Control Bar */}
      <div className="channel-grid-header">
        <div className="channel-count-badge">
          <Sparkles size={14} color="var(--accent)" />
          <span>
            Showing <strong>{Math.min(visibleCount, processedChannels.length)}</strong> of <strong>{processedChannels.length.toLocaleString()}</strong> Channels
          </span>
        </div>

        {/* Filter Controls Row (Requirement 25) */}
        <div className="channel-grid-controls">
          {/* Quality Filter */}
          <div className="grid-control-item">
            <select
              value={qualityFilter}
              onChange={(e) => setQualityFilter(e.target.value)}
              className="grid-select"
              title="Filter by Quality"
            >
              <option value="ALL">All Qualities</option>
              <option value="1080P">1080p FHD</option>
              <option value="720P">720p HD</option>
              <option value="SD">SD</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="grid-control-item">
            <select
              value={liveFilter}
              onChange={(e) => setLiveFilter(e.target.value)}
              className="grid-select"
              title="Filter by Status"
            >
              <option value="ALL">All Statuses</option>
              <option value="ONLINE">🟢 Online Only</option>
            </select>
          </div>

          {/* Sort Order (Requirement 24) */}
          <div className="grid-control-item">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="grid-select"
              title="Sort Channels"
            >
              <option value="DEFAULT">Default Order</option>
              <option value="A-Z">Name: A to Z</option>
              <option value="Z-A">Name: Z to A</option>
              <option value="RECENT">Recently Added</option>
              <option value="FAVORITES">Favorites First</option>
            </select>
          </div>

          {/* Favorites Only Toggle */}
          <button
            onClick={() => setFavsOnlyFilter(!favsOnlyFilter)}
            className={`layout-toggle-btn ${favsOnlyFilter ? 'active' : ''}`}
            title="Show Favorites Only"
            style={{ width: 'auto', padding: '0 8px', fontSize: 11, fontWeight: 600, gap: 4 }}
          >
            <span>★ Favorites</span>
          </button>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="layout-toggle-btn"
              title="Clear all filters"
              style={{ width: 'auto', padding: '0 8px', fontSize: 11, color: '#f43f5e' }}
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}

          {/* View Mode Toggle: Grid vs List */}
          <div className="layout-toggle-group">
            <button
              className={`layout-toggle-btn ${viewLayout === 'grid' ? 'active' : ''}`}
              onClick={() => setViewLayout('grid')}
              title="Grid View"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              className={`layout-toggle-btn ${viewLayout === 'list' ? 'active' : ''}`}
              onClick={() => setViewLayout('list')}
              title="List View"
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Content / Skeletons / Empty State */}
      {isLoading ? (
        <SkeletonCard count={12} viewLayout={viewLayout} />
      ) : processedChannels.length === 0 ? (
        <EmptyState
          type={favsOnlyFilter ? 'favorites' : searchQuery ? 'search' : 'generic'}
          title={favsOnlyFilter ? 'No favorite channels found' : 'No channels match your filters'}
          message="Try changing the category or resetting your active filters to see all available channels."
          actionLabel="Reset All Filters"
          onAction={clearAllFilters}
        />
      ) : (
        <div className="channel-grid-scroll">
          <div className={`channel-cards-wrapper ${viewLayout === 'grid' ? 'grid-mode' : 'list-mode'}`}>
            {currentSlice.map((channel) => (
              <ChannelCard
                key={channel.id || channel.url}
                channel={channel}
                onSelectChannel={onSelectChannel}
                isPlaying={currentChannel && (currentChannel.id === channel.id || currentChannel.url === channel.url)}
                isFavorite={favorites.some(f => f.id === channel.id || f.url === channel.url)}
                onToggleFavorite={onToggleFavorite}
                onOpenDetails={onOpenDetails}
                onShareChannel={onShareChannel}
                viewLayout={viewLayout}
              />
            ))}
          </div>

          {/* Progressive Lazy Load Sentinel & Manual Button */}
          {visibleCount < processedChannels.length && (
            <div
              ref={sentinelRef}
              className="grid-lazy-load-sentinel"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '30px 0 10px',
                width: '100%'
              }}
            >
              <button
                onClick={() => setVisibleCount(v => Math.min(v + BATCH_SIZE, processedChannels.length))}
                className="btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 24px',
                  borderRadius: '24px',
                  fontSize: 13,
                  fontWeight: 600,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border)'
                }}
              >
                <ArrowDown size={14} />
                <span>Load More Channels ({processedChannels.length - visibleCount} remaining)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
