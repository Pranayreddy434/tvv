import React from 'react';
import { Tv, Search, Shield, LayoutGrid, HelpCircle, ListPlus, Radio, RefreshCw } from 'lucide-react';

export default function Header({
  searchQuery,
  setSearchQuery,
  totalChannels,
  activePlaylistUrl,
  onOpenPlaylistModal,
  onOpenShortcutsModal,
  multiViewMode,
  setMultiViewMode,
  corsProxy,
  setCorsProxy,
  onRefreshPlaylist,
  isLoading
}) {
  return (
    <header className="glass-panel" style={{ height: 'var(--header-height)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 50, borderBottom: '1px solid var(--border-color)' }}>
      {/* Brand & Stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setSearchQuery('')}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px var(--accent-glow)' }}>
            <Tv size={24} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', lineHeight: '1.2' }} className="gradient-text">StreamHub IPTV</h1>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="live-indicator"></span>
              {isLoading ? 'Loading playlist...' : `${totalChannels.toLocaleString()} Channels`}
            </p>
          </div>
        </div>

        {/* Playlist Pill */}
        <button
          onClick={onOpenPlaylistModal}
          className="btn-icon"
          style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', gap: '6px', background: 'rgba(255, 255, 255, 0.04)' }}
          title="Change Playlist URL or Load Custom M3U File"
        >
          <Radio size={14} color="var(--accent-cyan)" />
          <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activePlaylistUrl.includes('tel.m3u') ? '🚩 Telugu Playlist' : activePlaylistUrl.includes('hin.m3u') ? '🇮🇳 Hindi Playlist' : activePlaylistUrl.includes('eng.m3u') ? '🇬🇧 English Playlist' : activePlaylistUrl.includes('tam.m3u') ? '🇮🇳 Tamil Playlist' : activePlaylistUrl.includes('index.m3u') ? 'iptv-org Global' : 'Custom Playlist'}
          </span>
        </button>

        <button
          onClick={onRefreshPlaylist}
          className="btn-icon"
          disabled={isLoading}
          style={{ padding: '6px', borderRadius: '50%' }}
          title="Reload Playlist"
        >
          <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
        </button>
      </div>

      {/* Global Search Bar */}
      <div style={{ flex: '0 1 420px', position: 'relative' }}>
        <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Search channels by name, category, or country (e.g. Sports, BBC, HBO, France)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 16px 10px 42px',
            backgroundColor: 'rgba(10, 12, 20, 0.6)',
            border: '1px solid var(--border-color)',
            borderRadius: '24px',
            color: 'var(--text-main)',
            fontSize: '13px',
            outline: 'none',
            transition: 'all 0.2s ease'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px' }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Control Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* CORS Proxy Toggle */}
        <button
          onClick={() => setCorsProxy(!corsProxy)}
          className="btn-icon"
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            gap: '6px',
            borderColor: corsProxy ? 'rgba(6, 182, 212, 0.5)' : 'var(--border-color)',
            backgroundColor: corsProxy ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.05)'
          }}
          title={corsProxy ? "CORS Proxy ACTIVE (Bypasses stream origin blocks)" : "Enable CORS Proxy for restricted streams"}
        >
          <Shield size={14} color={corsProxy ? "var(--accent-cyan)" : "var(--text-muted)"} />
          <span>CORS Proxy {corsProxy ? 'ON' : 'OFF'}</span>
        </button>

        {/* MultiView Toggle */}
        <button
          onClick={() => setMultiViewMode(multiViewMode === 'single' ? 'dual' : multiViewMode === 'dual' ? 'quad' : 'single')}
          className="btn-icon"
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            gap: '6px',
            borderColor: multiViewMode !== 'single' ? 'rgba(236, 72, 153, 0.5)' : 'var(--border-color)',
            backgroundColor: multiViewMode !== 'single' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(255, 255, 255, 0.05)'
          }}
          title="Toggle Multi-View (Watch multiple channels at once)"
        >
          <LayoutGrid size={14} color={multiViewMode !== 'single' ? "var(--accent-secondary)" : "var(--text-muted)"} />
          <span style={{ textTransform: 'capitalize' }}>{multiViewMode} View</span>
        </button>

        {/* Custom Playlist Loader Button */}
        <button onClick={onOpenPlaylistModal} className="btn-primary" style={{ padding: '8px 14px', fontSize: '13px' }}>
          <ListPlus size={16} />
          <span>Load M3U</span>
        </button>

        {/* Keyboard Shortcuts Button */}
        <button onClick={onOpenShortcutsModal} className="btn-icon" title="Keyboard Shortcuts (?)">
          <HelpCircle size={18} />
        </button>
      </div>
    </header>
  );
}
