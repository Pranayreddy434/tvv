import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import VideoPlayer from './components/VideoPlayer';
import ChannelGrid from './components/ChannelGrid';
import MultiView from './components/MultiView';
import PlaylistModal from './components/PlaylistModal';
import ShortcutsModal from './components/ShortcutsModal';
import { fetchPlaylist, parseM3U } from './services/m3uParser';
import { Tv, Sparkles, AlertCircle } from 'lucide-react';

const DEFAULT_PLAYLIST_URL = 'https://iptv-org.github.io/iptv/index.m3u';

export default function App() {
  const [playlistUrl, setPlaylistUrl] = useState(DEFAULT_PLAYLIST_URL);
  const [channels, setChannels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Selected state
  const [currentChannel, setCurrentChannel] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'favorites', 'history'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState('ALL');
  const [selectedLanguage, setSelectedLanguage] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewLayout, setViewLayout] = useState('grid'); // 'grid', 'list', 'compact'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Advanced features state
  const [corsProxy, setCorsProxy] = useState(false);
  const [multiViewMode, setMultiViewMode] = useState('single'); // 'single', 'dual', 'quad'
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  // LocalStorage state for Favorites & History
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('streamhub_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('streamhub_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Save favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('streamhub_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error('Failed to save favorites:', e);
    }
  }, [favorites]);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('streamhub_history', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history:', e);
    }
  }, [history]);

  // Load Playlist function
  const loadPlaylistData = useCallback(async (url = playlistUrl, useCors = corsProxy) => {
    setIsLoading(true);
    setLoadError('');
    try {
      const data = await fetchPlaylist(url, useCors);
      setChannels(data.channels);
      setCategories(['All', ...data.categories]);
      setCountries(['ALL', ...data.countries]);
      setLanguages(data.languages || []);

      // Set initial playing channel if none selected
      if (data.channels.length > 0 && !currentChannel) {
        setCurrentChannel(data.channels[0]);
      }
    } catch (err) {
      console.error('Playlist load error:', err);
      setLoadError(`Failed to load playlist (${err.message}). Try enabling CORS proxy or loading a custom M3U file.`);
    } finally {
      setIsLoading(false);
    }
  }, [playlistUrl, corsProxy, currentChannel]);

  // Fetch playlist on startup or URL / CORS change
  useEffect(() => {
    loadPlaylistData(playlistUrl, corsProxy);
  }, [playlistUrl, corsProxy]);

  // Handle Channel Selection
  const handleSelectChannel = (channel) => {
    setCurrentChannel(channel);

    // Add to history (unshift & dedup)
    setHistory(prev => {
      const filtered = prev.filter(c => c.id !== channel.id && c.url !== channel.url);
      return [channel, ...filtered].slice(0, 50); // keep last 50
    });
  };

  // Toggle Favorite Status
  const handleToggleFavorite = (channel) => {
    setFavorites(prev => {
      const exists = prev.some(c => c.id === channel.id || c.url === channel.url);
      if (exists) {
        return prev.filter(c => c.id !== channel.id && c.url !== channel.url);
      } else {
        return [channel, ...prev];
      }
    });
  };

  // Surprise Me / Channel Surfer
  const handleSurpriseMe = () => {
    if (channels.length === 0) return;
    const randomIndex = Math.floor(Math.random() * channels.length);
    handleSelectChannel(channels[randomIndex]);
  };

  // Language mode switch handler (auto-loads dedicated language playlist)
  const handleLanguageModeSwitch = (lang) => {
    setSelectedLanguage(lang);
    setActiveTab('all');
    setSelectedCategory('All');
    setSearchQuery('');

    if (lang === 'Telugu') {
      setPlaylistUrl('https://iptv-org.github.io/iptv/languages/tel.m3u');
    } else if (lang === 'Hindi') {
      setPlaylistUrl('https://iptv-org.github.io/iptv/languages/hin.m3u');
    } else if (lang === 'English') {
      setPlaylistUrl('https://iptv-org.github.io/iptv/languages/eng.m3u');
    } else if (lang === 'ALL') {
      setPlaylistUrl(DEFAULT_PLAYLIST_URL);
    }
  };

  // Custom Local File Upload
  const handleLoadLocalFilePlaylist = (m3uContent, fileName) => {
    setIsLoading(true);
    setLoadError('');
    try {
      const data = parseM3U(m3uContent);
      setChannels(data.channels);
      setCategories(['All', ...data.categories]);
      setCountries(['ALL', ...data.countries]);
      setLanguages(data.languages || []);
      setPlaylistUrl(`File: ${fileName}`);
      if (data.channels.length > 0) {
        setCurrentChannel(data.channels[0]);
      }
    } catch (e) {
      setLoadError('Failed to parse uploaded M3U file.');
    } finally {
      setIsLoading(false);
    }
  };

  // Category Counts calculation
  const categoryCounts = useMemo(() => {
    const counts = { All: channels.length };
    channels.forEach(ch => {
      if (ch.group) {
        counts[ch.group] = (counts[ch.group] || 0) + 1;
      }
    });
    return counts;
  }, [channels]);

  // Filtered Channels for Display
  const displayedChannels = useMemo(() => {
    let source = channels;
    if (activeTab === 'favorites') {
      source = favorites;
    } else if (activeTab === 'history') {
      source = history;
    }

    return source.filter(ch => {
      // Category filter
      if (activeTab === 'all' && selectedCategory !== 'All' && ch.group !== selectedCategory) {
        return false;
      }
      // Country filter
      if (selectedCountry !== 'ALL' && ch.country !== selectedCountry) {
        return false;
      }
      // Language filter
      if (selectedLanguage !== 'ALL' && (!ch.languages || !ch.languages.includes(selectedLanguage))) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const nameMatch = ch.name.toLowerCase().includes(query);
        const groupMatch = ch.group ? ch.group.toLowerCase().includes(query) : false;
        const countryMatch = ch.country ? ch.country.toLowerCase().includes(query) : false;
        const langMatch = ch.language ? ch.language.toLowerCase().includes(query) : false;
        return nameMatch || groupMatch || countryMatch || langMatch;
      }
      return true;
    });
  }, [channels, favorites, history, activeTab, selectedCategory, selectedCountry, selectedLanguage, searchQuery]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        // Play/pause handled inside player or state if needed
      } else if (e.key === 'f' || e.key === 'F') {
        // Fullscreen toggle handled in player
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        const searchInput = document.querySelector('header input[type="text"]');
        if (searchInput) searchInput.focus();
      } else if (e.key === '1') {
        setMultiViewMode('single');
      } else if (e.key === '2') {
        setMultiViewMode('dual');
      } else if (e.key === '4') {
        setMultiViewMode('quad');
      } else if (e.key === '?') {
        setIsShortcutsModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app-container">
      {/* Header Bar */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        totalChannels={channels.length}
        activePlaylistUrl={playlistUrl}
        onOpenPlaylistModal={() => setIsPlaylistModalOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        multiViewMode={multiViewMode}
        setMultiViewMode={setMultiViewMode}
        corsProxy={corsProxy}
        setCorsProxy={setCorsProxy}
        onRefreshPlaylist={() => loadPlaylistData(playlistUrl, corsProxy)}
        isLoading={isLoading}
      />

      {/* Main Workspace Body */}
      <div className="main-content">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedCountry={selectedCountry}
          setSelectedCountry={setSelectedCountry}
          selectedLanguage={selectedLanguage}
          setSelectedLanguage={setSelectedLanguage}
          onLanguageModeSwitch={handleLanguageModeSwitch}
          categories={categories}
          countries={countries}
          languages={languages}
          favoritesCount={favorites.length}
          historyCount={history.length}
          categoryCounts={categoryCounts}
          viewLayout={viewLayout}
          setViewLayout={setViewLayout}
          onSurpriseMe={handleSurpriseMe}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />

        {/* Content Area */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--header-height))', overflow: 'hidden', position: 'relative' }}>
          {isLoading ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', color: '#fff' }}>
              <div className="spin" style={{ width: '48px', height: '48px', border: '4px solid rgba(255, 255, 255, 0.1)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%' }}></div>
              <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Loading IPTV Channel Repository...</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Parsing thousands of live streams from iptv-org</p>
            </div>
          ) : loadError ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px', textAlign: 'center', gap: '16px' }}>
              <AlertCircle size={56} color="#ef4444" />
              <h2 style={{ fontSize: '20px', color: '#fff' }}>Playlist Loading Error</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '500px' }}>{loadError}</p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button onClick={() => setCorsProxy(!corsProxy)} className="btn-primary">
                  {corsProxy ? 'Disable CORS Proxy' : 'Enable CORS Proxy & Retry'}
                </button>
                <button onClick={() => setIsPlaylistModalOpen(true)} className="btn-icon" style={{ padding: '10px 18px' }}>
                  Load Custom Playlist
                </button>
              </div>
            </div>
          ) : multiViewMode !== 'single' ? (
            /* MultiView Screen */
            <MultiView
              channels={displayedChannels.length > 0 ? displayedChannels : channels}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              corsProxy={corsProxy}
              setCorsProxy={setCorsProxy}
              multiViewMode={multiViewMode}
              setMultiViewMode={setMultiViewMode}
            />
          ) : (
            /* Split View: Video Player on Top / Left & Channel Grid */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              {/* Player Box (Responsive height) */}
              <div style={{ height: '52vh', minHeight: '320px', width: '100%', backgroundColor: '#000', borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
                <VideoPlayer
                  channel={currentChannel}
                  onToggleFavorite={handleToggleFavorite}
                  isFavorite={favorites.some(f => f.id === currentChannel?.id || f.url === currentChannel?.url)}
                  corsProxy={corsProxy}
                  setCorsProxy={setCorsProxy}
                />
              </div>

              {/* Channel Grid Section */}
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <ChannelGrid
                  channels={displayedChannels}
                  currentChannel={currentChannel}
                  onSelectChannel={handleSelectChannel}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  viewLayout={viewLayout}
                  selectedCategory={selectedCategory}
                  searchQuery={searchQuery}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        activePlaylistUrl={playlistUrl}
        onLoadUrlPlaylist={(url) => setPlaylistUrl(url)}
        onLoadLocalFilePlaylist={handleLoadLocalFilePlaylist}
      />

      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
}
