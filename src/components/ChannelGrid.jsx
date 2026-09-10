import React, { useState, useEffect, useMemo } from 'react';
import ChannelCard from './ChannelCard';
import { SearchX, ChevronLeft, ChevronRight, Layers, SlidersHorizontal } from 'lucide-react';

const CHANNELS_PER_PAGE = 48;

export default function ChannelGrid({
  channels,
  currentChannel,
  onSelectChannel,
  favorites,
  onToggleFavorite,
  viewLayout,
  selectedCategory,
  searchQuery
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [qualityFilter, setQualityFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('DEFAULT'); // DEFAULT, A-Z, Z-A

  // Reset page when search or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, qualityFilter, sortOrder]);

  // Apply Filter & Sort
  const processedChannels = useMemo(() => {
    let result = [...channels];

    if (qualityFilter !== 'ALL') {
      result = result.filter(ch => ch.quality.toUpperCase() === qualityFilter);
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', color: 'var(--text-muted)' }}>
        <SearchX size={54} color="rgba(255, 255, 255, 0.2)" style={{ marginBottom: '16px' }} />
        <h3 style={{ fontSize: '18px', color: 'var(--text-main)' }}>No Channels Found</h3>
        <p style={{ fontSize: '13px', marginTop: '6px', maxWidth: '380px', textAlign: 'center' }}>
          No channels match your current search "{searchQuery}" or selected category filter. Try clearing your search query.
        </p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top Filter Bar */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(10, 12, 20, 0.4)' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Showing <strong style={{ color: 'var(--text-main)' }}>{startIndex + 1} - {Math.min(startIndex + CHANNELS_PER_PAGE, processedChannels.length)}</strong> of <strong style={{ color: 'var(--accent-primary)' }}>{processedChannels.length.toLocaleString()}</strong> channels
        </div>

        {/* Filters & Sorting */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Quality Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <SlidersHorizontal size={14} color="var(--text-muted)" />
            <select
              value={qualityFilter}
              onChange={(e) => setQualityFilter(e.target.value)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Qualities</option>
              <option value="4K">4K</option>
              <option value="1080P">1080p (FHD)</option>
              <option value="720P">720p (HD)</option>
              <option value="SD">SD</option>
            </select>
          </div>

          {/* Sort Order */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="DEFAULT">Default Order</option>
            <option value="A-Z">Name: A to Z</option>
            <option value="Z-A">Name: Z to A</option>
          </select>
        </div>
      </div>

      {/* Channel Grid Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        <div
          style={{
            display: viewLayout === 'grid' ? 'grid' : 'flex',
            gridTemplateColumns: viewLayout === 'grid' ? 'repeat(auto-fill, minmax(200px, 1fr))' : 'none',
            flexDirection: viewLayout !== 'grid' ? 'column' : 'none',
            gap: viewLayout === 'compact' ? '6px' : '14px'
          }}
        >
          {currentSlice.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              onSelectChannel={onSelectChannel}
              isPlaying={currentChannel && currentChannel.id === channel.id}
              isFavorite={favorites.some(f => f.id === channel.id || f.url === channel.url)}
              onToggleFavorite={onToggleFavorite}
              viewLayout={viewLayout}
            />
          ))}
        </div>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(10, 12, 20, 0.6)' }}>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            className="btn-icon"
            style={{ opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </button>

          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Page <strong style={{ color: '#fff' }}>{currentPage}</strong> of <strong>{totalPages}</strong>
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            className="btn-icon"
            style={{ opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
