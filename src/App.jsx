import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import VideoPlayer from './components/VideoPlayer';
import ChannelGrid from './components/ChannelGrid';
import PlaylistModal from './components/PlaylistModal';
import ShortcutsModal from './components/ShortcutsModal';
import { parseM3U } from './services/m3uParser';
import { matchesLanguage, isTeluguChannel } from './services/languageService';
import { Tv, Star, Compass, ListPlus, Sparkles } from 'lucide-react';
import './index.css';

const DEFAULT_PLAYLIST = 'https://iptv-org.github.io/iptv/index.m3u';

function matchesCategory(channel, cat) {
  if (cat === 'All') return true;
  const group = (channel.group || '').toLowerCase();
  const name = (channel.name || '').toLowerCase();
  const catL = cat.toLowerCase();
  return group.includes(catL) || name.includes(catL);
}

function getLSJson(key, def) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
  catch { return def; }
}

export default function App() {
  const [allChannels, setAllChannels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState(
    localStorage.getItem('activePlaylist') || DEFAULT_PLAYLIST
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('ALL');

  const [currentChannel, setCurrentChannel] = useState(null);
  const [favorites, setFavorites] = useState(getLSJson('favChannels', []));
  const [history, setHistory] = useState(getLSJson('chHistory', []));
  const [corsProxy, setCorsProxy] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });
  const [activeTab, setActiveTab] = useState('all');
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Load playlist
  const loadPlaylist = useCallback(async (url) => {
    if (!url) return;
    setIsLoading(true);
    // 1. Try direct fetch first
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      const { channels } = parseM3U(text);
      setAllChannels(channels);
      localStorage.setItem('activePlaylist', url);
      setIsLoading(false);
      return;
    } catch (directErr) {
      console.warn('Direct playlist fetch failed, attempting fallback proxies:', directErr);
    }

    // 2. Fallback to CORS proxies
    const proxyUrls = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`
    ];
    let loaded = false;
    for (const pUrl of proxyUrls) {
      try {
        const res = await fetch(pUrl);
        if (!res.ok) continue;
        const text = await res.text();
        const { channels } = parseM3U(text);
        setAllChannels(channels);
        localStorage.setItem('activePlaylist', url);
        loaded = true;
        break;
      } catch {
        // try next
      }
    }
    if (!loaded) {
      console.error('All playlist fetch attempts failed for:', url);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { loadPlaylist(playlistUrl); }, [playlistUrl, loadPlaylist]);

  // Persist favorites & history
  useEffect(() => { localStorage.setItem('favChannels', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('chHistory', JSON.stringify(history.slice(0, 80))); }, [history]);

  // Filtered channels
  const filteredChannels = useMemo(() => {
    let list = allChannels;

    if (selectedLanguage !== 'ALL') {
      list = list.filter(ch => matchesLanguage(ch, selectedLanguage));
    }
    if (selectedCategory !== 'All') {
      list = list.filter(ch => matchesCategory(ch, selectedCategory));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(ch =>
        ch.name.toLowerCase().includes(q) ||
        (ch.group || '').toLowerCase().includes(q) ||
        (ch.country || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [allChannels, selectedLanguage, selectedCategory, searchQuery]);

  const handleSelectChannel = useCallback((ch) => {
    setCurrentChannel(ch);
    setHistory(prev => {
      const filtered = prev.filter(h => h.id !== ch.id && h.url !== ch.url);
      return [ch, ...filtered].slice(0, 80);
    });
    // On mobile, collapse sidebar when channel selected
    if (window.innerWidth < 768) setSidebarCollapsed(true);
  }, []);

  const handleToggleFavorite = useCallback((ch) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === ch.id || f.url === ch.url);
      return exists ? prev.filter(f => f.id !== ch.id && f.url !== ch.url) : [ch, ...prev];
    });
  }, []);

  const handleLanguageSwitch = useCallback((lang) => {
    setSelectedLanguage(lang);
    setActiveTab('all');
  }, []);

  const handleCategorySwitch = useCallback((cat) => {
    setSelectedCategory(cat);
    setActiveTab('all');
  }, []);

  const handleLoadUrl = useCallback((urlOrContent) => {
    if (urlOrContent.startsWith('#EXTM3U') || urlOrContent.startsWith('#EXTINF')) {
      const { channels } = parseM3U(urlOrContent);
      setAllChannels(channels);
      setPlaylistUrl('local');
    } else {
      setPlaylistUrl(urlOrContent);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
      if (e.key === '?' || e.key === '/') setShowShortcutsModal(true);
      if (e.key === 'p') setShowPlaylistModal(true);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const isFavorite = currentChannel
    ? favorites.some(f => f.id === currentChannel.id || f.url === currentChannel.url)
    : false;

  return (
    <div className="app-shell">
      {/* TOP BAR */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        totalChannels={filteredChannels.length}
        activePlaylistUrl={playlistUrl}
        onOpenPlaylistModal={() => setShowPlaylistModal(true)}
        onOpenShortcutsModal={() => setShowShortcutsModal(true)}
        corsProxy={corsProxy}
        setCorsProxy={setCorsProxy}
        onRefreshPlaylist={() => loadPlaylist(playlistUrl)}
        isLoading={isLoading}
        selectedCategory={selectedCategory}
        onCategorySwitch={handleCategorySwitch}
        selectedLanguage={selectedLanguage}
        onLanguageModeSwitch={handleLanguageSwitch}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />

      {/* APP BODY */}
      <div className="app-body">
        {/* Mobile Backdrop Overlay */}
        <div
          className={`sidebar-backdrop ${!sidebarCollapsed ? 'active' : ''}`}
          onClick={() => setSidebarCollapsed(true)}
          aria-hidden="true"
        />

        {/* LEFT SIDEBAR */}
        <Sidebar
          channels={filteredChannels}
          currentChannel={currentChannel}
          favorites={favorites}
          history={history}
          onSelectChannel={handleSelectChannel}
          onToggleFavorite={handleToggleFavorite}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
          onClose={() => setSidebarCollapsed(true)}
          selectedLanguage={selectedLanguage}
          onLanguageSwitch={handleLanguageSwitch}
          selectedCategory={selectedCategory}
          onCategorySwitch={handleCategorySwitch}
        />

        {/* MAIN PANEL */}
        <main className="main-panel">
          {isLoading && allChannels.length === 0 ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 20,
              background: 'radial-gradient(ellipse at center, rgba(255,87,34,0.06) 0%, transparent 70%)'
            }}>
              <div className="spin" style={{
                width: 52, height: 52,
                border: '3px solid var(--border)',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%'
              }} />
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Loading Channels</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  Fetching {playlistUrl === DEFAULT_PLAYLIST ? 'global IPTV directory' : 'playlist'}…
                </p>
              </div>
            </div>
          ) : !currentChannel ? (
            /* MOBILE & INITIAL DIRECTORY HUB:
               When no channel is selected, show the Channel Directory Grid immediately!
               Mobile users see channels right on screen without needing to click on top! */
            <div className="channels-discovery-hub">
              <div className="hub-banner">
                <div className="hub-banner-content">
                  <div className="hub-badge">
                    <Sparkles size={14} color="var(--accent)" />
                    <span>Live Channel Directory</span>
                  </div>
                  <h1 className="hub-title">Explore & Stream Live TV</h1>
                  <p className="hub-subtitle">
                    Select any channel below to start live stream playback instantly
                  </p>
                </div>
              </div>

              <ChannelGrid
                channels={filteredChannels}
                currentChannel={currentChannel}
                onSelectChannel={handleSelectChannel}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                selectedCategory={selectedCategory}
                selectedLanguage={selectedLanguage}
                searchQuery={searchQuery}
              />
            </div>
          ) : (
            <VideoPlayer
              channel={currentChannel}
              allChannels={allChannels}
              onSelectChannel={handleSelectChannel}
              onToggleFavorite={handleToggleFavorite}
              isFavorite={isFavorite}
              corsProxy={corsProxy}
              setCorsProxy={setCorsProxy}
              onOpenChannels={() => setSidebarCollapsed(false)}
            />
          )}
        </main>
      </div>

      {/* MOBILE BOTTOM DOCK (Sticky on phones & touch devices) */}
      <nav className="mobile-bottom-dock">
        <button
          className={`mobile-dock-btn ${!sidebarCollapsed ? 'active' : ''}`}
          onClick={() => {
            setSidebarCollapsed(!sidebarCollapsed);
            setActiveTab('all');
          }}
          title="Toggle Channels"
        >
          <Tv size={18} />
          <span>Channels</span>
        </button>

        <button
          className={`mobile-dock-btn ${activeTab === 'favorites' && !sidebarCollapsed ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('favorites');
            setSidebarCollapsed(false);
          }}
          title="Favorites"
        >
          <Star size={18} fill={favorites.length > 0 ? '#F59E0B' : 'none'} color="#F59E0B" />
          <span>Favorites</span>
        </button>

        <button
          className={`mobile-dock-btn ${!currentChannel ? 'active' : ''}`}
          onClick={() => {
            setCurrentChannel(null); // Show channels discovery grid
            setSidebarCollapsed(true);
          }}
          title="Browse All Channels"
        >
          <Compass size={18} />
          <span>Directory</span>
        </button>

        <button
          className="mobile-dock-btn"
          onClick={() => setShowPlaylistModal(true)}
          title="Playlists"
        >
          <ListPlus size={18} />
          <span>Playlist</span>
        </button>
      </nav>

      {/* MODALS */}
      {showPlaylistModal && (
        <PlaylistModal
          onClose={() => setShowPlaylistModal(false)}
          onLoadUrl={handleLoadUrl}
          activePlaylistUrl={playlistUrl}
        />
      )}

      {showShortcutsModal && (
        <ShortcutsModal onClose={() => setShowShortcutsModal(false)} />
      )}
    </div>
  );
}
