import React, { useState, useEffect, useMemo } from 'react';
import ChannelCard from './ChannelCard';
import { SearchX, ChevronLeft, ChevronRight, SlidersHorizontal, LayoutGrid, List, Sparkles, Tv } from 'lucide-react';

const CHANNELS_PER_PAGE = 48;

export default function ChannelGrid({
  channels,
  currentChannel,
  onSelectChannel,
  favorites,
  onToggleFavorite,
  selectedCategory = 'All',
  selectedLanguage = 'ALL',
  searchQuery = ''
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [qualityFilter, setQualityFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('DEFAULT'); // DEFAULT, A-Z, Z-A
  const [viewLayout, setViewLayout] = useState('grid'); // 'grid' | 'list'

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedLanguage, qualityFilter, sortOrder]);

  // Apply Filter & Sort
  const processedChannels = useMemo(() => {
    let result = [...channels];

    if (qualityFilter !== 'ALL') {
      result = result.filter(ch => (ch.quality || 'SD').toUpperCase() === qualityFilter);
    }

    if (sortOrder === 'A-Z') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === 'Z-A') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [channels, qualityFilter, sortOrder]);

  const totalPages = Math.ceil(processedChannels.length / CHANNELS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * CHANNELS_PER_PAGE;
  const currentSlice = processedChannels.slice(startIndex, startIndex + CHANNELS_PER_PAGE);

  if (processedChannels.length === 0) {
    return (
      <div className="discovery-empty">
        <div className="discovery-empty-icon">
          <SearchX size={44} color="var(--accent)" />
        </div>
        <h3 className="discovery-empty-title">No Channels Found</h3>
        <p className="discovery-empty-desc">
          No streams match your filter "{searchQuery || selectedCategory || selectedLanguage}". Try resetting or searching another channel.
        </p>
      </div>
    );
  }

  return (
    <div className="channel-grid-container">
      {/* Top Filter Bar */}
      <div className="channel-grid-header">
        <div className="channel-count-badge">
          <Sparkles size={14} color="var(--accent)" />
          <span>
            Showing <strong>{startIndex + 1} - {Math.min(startIndex + CHANNELS_PER_PAGE, processedChannels.length)}</strong> of <strong>{processedChannels.length.toLocaleString()}</strong> Channels
          </span>
        </div>

        {/* Filters & Sorting */}
        <div className="channel-grid-controls">
          {/* Quality Filter */}
          <div className="grid-control-item">
            <SlidersHorizontal size={13} color="var(--accent-light)" />
            <select
              value={qualityFilter}
              onChange={(e) => setQualityFilter(e.target.value)}
              className="grid-select"
            >
              <option value="ALL">All Qualities</option>
              <option value="4K">4K Ultra HD</option>
              <option value="1080P">1080p FHD</option>
              <option value="720P">720p HD</option>
              <option value="SD">SD</option>
            </select>
          </div>

          {/* Sort Order */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="grid-select"
          >
            <option value="DEFAULT">Default Order</option>
            <option value="A-Z">A to Z</option>
            <option value="Z-A">Z to A</option>
          </select>

          {/* View toggle */}
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

      {/* Channel Grid Content */}
      <div className="channel-grid-scroll">
        <div
          className={`channel-cards-wrapper ${viewLayout === 'grid' ? 'grid-mode' : 'list-mode'}`}
        >
          {currentSlice.map((channel) => (
            <ChannelCard
              key={channel.id || channel.url}
              channel={channel}
              onSelectChannel={onSelectChannel}
              isPlaying={currentChannel && (currentChannel.id === channel.id || currentChannel.url === channel.url)}
              isFavorite={favorites.some(f => f.id === channel.id || f.url === channel.url)}
              onToggleFavorite={onToggleFavorite}
              viewLayout={viewLayout}
            />
          ))}
        </div>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="channel-grid-pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            className="pagination-btn"
          >
            <ChevronLeft size={16} />
            <span>Prev</span>
          </button>

          <span className="pagination-info">
            Page <strong style={{ color: 'var(--accent-light)' }}>{currentPage}</strong> of <strong>{totalPages}</strong>
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            className="pagination-btn"
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
