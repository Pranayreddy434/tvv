import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import VideoPlayer from './components/VideoPlayer';
import ChannelGrid from './components/ChannelGrid';
import HeroBanner from './components/HeroBanner';
import ContinueWatchingRow from './components/ContinueWatchingRow';
import ChannelSectionRow from './components/ChannelSectionRow';
import TVGuide from './components/TVGuide';
import SmartSearchModal from './components/SmartSearchModal';
import SettingsModal from './components/SettingsModal';
import ChannelDetailsModal from './components/ChannelDetailsModal';
import ChannelNumberDialer from './components/ChannelNumberDialer';
import PlaylistModal from './components/PlaylistModal';
import ShortcutsModal from './components/ShortcutsModal';
import MobileBottomNav from './components/MobileBottomNav';
import MiniPlayer from './components/MiniPlayer';
import EmptyState from './components/EmptyState';

import { parseM3U } from './services/m3uParser';
import { matchesLanguage, isTeluguChannel } from './services/languageService';
import { ChannelManager } from './services/channelManager';
import { analytics } from './services/analyticsService';

import {
  Tv, Star, Film, Radio, Sparkles, Newspaper, Clapperboard,
  Music, Trophy, Baby, HeartHandshake, Clock, Compass, Shield, Globe, Flame
} from 'lucide-react';
import './index.css';

const DEFAULT_PLAYLIST = 'https://iptv-org.github.io/iptv/countries/in.m3u';

function getLSJson(key, def) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : def;
  } catch {
    return def;
  }
}

function getCachedM3u() {
  try {
    const data = localStorage.getItem('cached_m3u_channels');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setCachedM3u(list) {
  try {
    const compact = (list || []).slice(0, 1000).map(c => ({
      id: c.id,
      name: c.name,
      logo: c.logo,
      url: c.url,
      streamUrl: c.streamUrl || c.url,
      language: c.language,
      languages: c.languages,
      group: c.group,
      categories: c.categories,
      quality: c.quality,
      status: c.status || 'online',
      country: c.country
    }));
    localStorage.setItem('cached_m3u_channels', JSON.stringify(compact));
  } catch {}
}

export default function App() {
  // Initialize channels immediately with curated high-definition default channels + cached playlist
  const [allChannels, setAllChannels] = useState(() => {
    const cached = getCachedM3u();
    return ChannelManager.getActiveChannels(cached);
  });
  const [isLoading, setIsLoading] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState(() => {
    const saved = localStorage.getItem('activePlaylist');
    // Clear out stale single-language playlist
    if (saved && (saved.includes('iptv-org.github.io/iptv/languages/tel.m3u') || saved.includes('iptv-org.github.io/iptv/index.m3u'))) {
      localStorage.removeItem('activePlaylist');
      return DEFAULT_PLAYLIST;
    }
    return saved || DEFAULT_PLAYLIST;
  });

  // Navigation State
  const [activeNav, setActiveNav] = useState('home'); // 'home' | 'live' | 'categories' | 'tvguide' | 'favorites' | 'settings'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('ALL');

  // Channel Selection & Persistence
  const [currentChannel, setCurrentChannel] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [lastWatchedChannel, setLastWatchedChannel] = useState(() => getLSJson('lastWatchedChannel', null));
  const [favorites, setFavorites] = useState(() => getLSJson('favChannels', []));
  const [history, setHistory] = useState(() => getLSJson('chHistory', []));
  const [corsProxy, setCorsProxy] = useState(false);

  // Layout & Drawers
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState('all');

  // Modals
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDetailsChannel, setShowDetailsChannel] = useState(null);
  const [showDialerModal, setShowDialerModal] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Theme
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('appTheme') || 'sunset';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('appTheme', currentTheme);
  }, [currentTheme]);

  // Persist Favorites, History & Last Watched
  useEffect(() => {
    localStorage.setItem('favChannels', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('chHistory', JSON.stringify(history.slice(0, 20)));
  }, [history]);

  useEffect(() => {
    if (lastWatchedChannel) {
      localStorage.setItem('lastWatchedChannel', JSON.stringify(lastWatchedChannel));
    }
  }, [lastWatchedChannel]);

  // Load / Merge M3U playlist on explicit request or auto-load
  const loadPlaylist = useCallback(async (url) => {
    if (!url || url === 'local') return;
    setIsLoading(true);

    const applyParsedChannels = (m3uList) => {
      if (m3uList && m3uList.length > 0) {
        const active = ChannelManager.getActiveChannels(m3uList);
        setAllChannels(active);
        setCachedM3u(m3uList);
      }
      localStorage.setItem('activePlaylist', url);
      setIsLoading(false);
    };

    try {
      const res = await fetch(url);
      if (res.ok) {
        const text = await res.text();
        const { channels: m3uList } = parseM3U(text, 1500);
        applyParsedChannels(m3uList);
        return;
      }
    } catch (err) {
      // Fallback to CORS proxy
    }

    const proxyUrls = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`
    ];

    for (const pUrl of proxyUrls) {
      try {
        const res = await fetch(pUrl);
        if (!res.ok) continue;
        const text = await res.text();
        const { channels: m3uList } = parseM3U(text, 1500);
        applyParsedChannels(m3uList);
        return;
      } catch {
        // try next proxy
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const targetUrl = playlistUrl || DEFAULT_PLAYLIST;
    const timer = setTimeout(() => {
      loadPlaylist(targetUrl);
    }, 800);
    return () => clearTimeout(timer);
  }, [playlistUrl, loadPlaylist]);

  // Play a channel with local view counter for Trending feature (Requirement 7)
  const handleSelectChannel = useCallback((ch) => {
    if (!ch) return;
    setCurrentChannel(ch);
    setLastWatchedChannel(ch);
    setIsPlaying(true);
    setActiveNav('live');

    try {
      const views = getLSJson('iptv_channel_views', {});
      const chKey = ch.id || ch.url;
      views[chKey] = (views[chKey] || 0) + 1;
      localStorage.setItem('iptv_channel_views', JSON.stringify(views));
    } catch (e) {}

    setHistory(prev => {
      const filtered = prev.filter(h => {
        const id = h.id || h.url;
        const targetId = ch.id || ch.url;
        return id !== targetId;
      });
      const entry = { ...ch, lastWatched: Date.now() };
      return [entry, ...filtered].slice(0, 20);
    });

    if (window.innerWidth < 1024) {
      setSidebarCollapsed(true);
    }
  }, []);

  const handleRemoveHistoryItem = useCallback((ch) => {
    setHistory(prev => prev.filter(h => (h.id || h.url) !== (ch.id || ch.url)));
  }, []);

  // Toggle favorite
  const handleToggleFavorite = useCallback((ch) => {
    if (!ch) return;
    setFavorites(prev => {
      const exists = prev.some(f => f.id === ch.id || f.url === ch.url);
      if (exists) {
        return prev.filter(f => f.id !== ch.id && f.url !== ch.url);
      } else {
        return [ch, ...prev];
      }
    });
  }, []);

  // Share Channel (Web Share API with fallback)
  const handleShareChannel = useCallback((ch) => {
    if (!ch) return;
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `${ch.name} - StreamHub IPTV`,
        text: `Watch ${ch.name} live on StreamHub IPTV!`,
        url: shareUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert(`Link for "${ch.name}" copied to clipboard!`);
    }
  }, []);

  // Clear data handlers
  const handleClearFavorites = () => setFavorites([]);
  const handleClearHistory = () => setHistory([]);
  const handleResetAllData = () => {
    localStorage.clear();
    setFavorites([]);
    setHistory([]);
    setLastWatchedChannel(null);
    setCurrentTheme('sunset');
    setAllChannels(ChannelManager.getActiveChannels());
  };

  // Keyboard number listener for direct channel dialing
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return;

      if (e.key === '/' || e.key === '?') {
        e.preventDefault();
        setShowSearchModal(true);
      } else if (e.key === 'p' || e.key === 'P') {
        setShowPlaylistModal(true);
      } else if (e.key >= '0' && e.key <= '9') {
        setShowDialerModal(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Homepage Filtered Sections
  const featuredChannel = currentChannel || allChannels[0];

  const hindiChannels = useMemo(() => {
    return allChannels.filter(c => matchesLanguage(c, 'Hindi'));
  }, [allChannels]);

  const teluguChannels = useMemo(() => {
    return allChannels.filter(c => isTeluguChannel(c));
  }, [allChannels]);

  const tamilChannels = useMemo(() => {
    return allChannels.filter(c => matchesLanguage(c, 'Tamil'));
  }, [allChannels]);

  const englishChannels = useMemo(() => {
    return allChannels.filter(c => matchesLanguage(c, 'English'));
  }, [allChannels]);

  const malayalamChannels = useMemo(() => {
    return allChannels.filter(c => matchesLanguage(c, 'Malayalam'));
  }, [allChannels]);

  const kannadaChannels = useMemo(() => {
    return allChannels.filter(c => matchesLanguage(c, 'Kannada'));
  }, [allChannels]);

  const newsChannels = useMemo(() => {
    return allChannels.filter(c => {
      const g = (c.group || '').toLowerCase();
      const n = (c.name || '').toLowerCase();
      return g.includes('news') || n.includes('news') || (c.categories && c.categories.includes('News'));
    });
  }, [allChannels]);

  const movieChannels = useMemo(() => {
    return allChannels.filter(c => {
      const g = (c.group || '').toLowerCase();
      const n = (c.name || '').toLowerCase();
      return g.includes('movie') || g.includes('cinema') || n.includes('cinema') || n.includes('movie') || (c.categories && c.categories.includes('Movies'));
    });
  }, [allChannels]);

  const entertainmentChannels = useMemo(() => {
    return allChannels.filter(c => {
      const g = (c.group || '').toLowerCase();
      return g.includes('entertainment') || g.includes('general') || (c.categories && c.categories.includes('Entertainment'));
    });
  }, [allChannels]);

  const musicChannels = useMemo(() => {
    return allChannels.filter(c => {
      const g = (c.group || '').toLowerCase();
      const n = (c.name || '').toLowerCase();
      return g.includes('music') || n.includes('beats') || n.includes('music') || (c.categories && c.categories.includes('Music'));
    });
  }, [allChannels]);

  const sportsChannels = useMemo(() => {
    return allChannels.filter(c => {
      const g = (c.group || '').toLowerCase();
      const n = (c.name || '').toLowerCase();
      return g.includes('sport') || n.includes('sport') || (c.categories && c.categories.includes('Sports'));
    });
  }, [allChannels]);

  const kidsChannels = useMemo(() => {
    return allChannels.filter(c => {
      const g = (c.group || '').toLowerCase();
      const n = (c.name || '').toLowerCase();
      const cats = (c.categories || []).map(x => (x || '').toLowerCase());
      return (
        g.includes('kid') ||
        g.includes('animat') ||
        g.includes('cartoon') ||
        n.includes('kid') ||
        n.includes('yay') ||
        n.includes('hungama') ||
        n.includes('shark') ||
        n.includes('cocomelon') ||
        cats.includes('kids') ||
        cats.includes('animation')
      );
    });
  }, [allChannels]);

  const devotionalChannels = useMemo(() => {
    return allChannels.filter(c => {
      const g = (c.group || '').toLowerCase();
      const n = (c.name || '').toLowerCase();
      return g.includes('religio') || g.includes('spirit') || n.includes('bhakthi') || n.includes('svbc') || n.includes('dharmam') || (c.categories && c.categories.includes('Devotional'));
    });
  }, [allChannels]);

  const recentlyAddedChannels = useMemo(() => {
    return allChannels.filter(c => c.isNew);
  }, [allChannels]);

  // Locally calculated Trending / Most Watched (Requirement 7)
  const trendingChannels = useMemo(() => {
    try {
      const views = getLSJson('iptv_channel_views', {});
      const entries = Object.entries(views);
      if (entries.length === 0) return [];
      const viewMap = new Map(entries);
      const scored = allChannels
        .filter(c => viewMap.has(c.id || c.url))
        .map(c => ({
          channel: c,
          count: viewMap.get(c.id || c.url) || 0
        }))
        .sort((a, b) => b.count - a.count);

      return scored.slice(0, 14).map(s => s.channel);
    } catch {
      return [];
    }
  }, [allChannels, history]);

  // Dedicated Telugu rails (Requirement 11: Telugu-First Experience)
  const teluguNewsChannels = useMemo(() => {
    return teluguChannels.filter(c => {
      const g = (c.group || '').toLowerCase();
      const n = (c.name || '').toLowerCase();
      return g.includes('news') || n.includes('news') || n.includes('tv9') || n.includes('ntv') || n.includes('abn') || n.includes('v6') || n.includes('10tv') || n.includes('sakshi') || n.includes('t news') || n.includes('prime9');
    });
  }, [teluguChannels]);

  const teluguMovieChannels = useMemo(() => {
    return teluguChannels.filter(c => {
      const g = (c.group || '').toLowerCase();
      const n = (c.name || '').toLowerCase();
      return g.includes('movie') || g.includes('cinema') || n.includes('cinema') || n.includes('movie') || n.includes('tollywood') || n.includes('gemini movies') || n.includes('star maa movies');
    });
  }, [teluguChannels]);

  const teluguMusicChannels = useMemo(() => {
    return teluguChannels.filter(c => {
      const g = (c.group || '').toLowerCase();
      const n = (c.name || '').toLowerCase();
      return g.includes('music') || n.includes('music') || n.includes('musix') || n.includes('beats');
    });
  }, [teluguChannels]);

  const teluguDevotionalChannels = useMemo(() => {
    return teluguChannels.filter(c => {
      const g = (c.group || '').toLowerCase();
      const n = (c.name || '').toLowerCase();
      return g.includes('religio') || g.includes('spirit') || g.includes('devotional') || n.includes('bhakthi') || n.includes('svbc') || n.includes('subhavaartha');
    });
  }, [teluguChannels]);

  // Smart Recommendations with "Because you watched..." (Requirement 8)
  const recommendationContext = useMemo(() => {
    const target = currentChannel || lastWatchedChannel || (history.length > 0 ? history[0] : null);
    if (!target) {
      return {
        title: 'Recommended Channels',
        subtitle: 'Handpicked popular broadcasts for your viewing pleasure',
        channels: allChannels.slice(0, 12)
      };
    }

    const targetLang = target.language;
    const targetGroup = (target.group || '').toLowerCase();

    const matched = allChannels
      .filter(c => (c.id || c.url) !== (target.id || target.url))
      .filter(c => {
        const sameLang = targetLang && matchesLanguage(c, targetLang);
        const sameGroup = targetGroup && (c.group || '').toLowerCase() === targetGroup;
        return sameLang || sameGroup;
      })
      .slice(0, 12);

    return {
      title: `Because you watched ${target.name}`,
      subtitle: `More top ${target.language || ''} ${target.group || 'Live TV'} channels you might like`,
      channels: matched.length > 0 ? matched : allChannels.slice(0, 12)
    };
  }, [allChannels, currentChannel, lastWatchedChannel, history]);

  // General Filter for Categories / Directory tab
  const categoryFilteredChannels = useMemo(() => {
    let list = allChannels;
    if (selectedCategory !== 'All') {
      const catL = selectedCategory.toLowerCase();
      list = list.filter(ch => {
        if (selectedCategory === 'Telugu') return isTeluguChannel(ch);
        if (['Hindi', 'Tamil', 'English', 'Malayalam', 'Kannada', 'Bengali', 'Marathi', 'Punjabi'].includes(selectedCategory)) {
          return matchesLanguage(ch, selectedCategory);
        }
        const g = (ch.group || '').toLowerCase();
        const n = (ch.name || '').toLowerCase();
        const cats = (ch.categories || []).map(c => c.toLowerCase());
        const lang = (ch.language || '').toLowerCase();
        return g.includes(catL) || n.includes(catL) || cats.includes(catL) || lang.includes(catL);
      });
    }
    if (selectedLanguage !== 'ALL') {
      list = list.filter(ch => matchesLanguage(ch, selectedLanguage));
    }
    return list;
  }, [allChannels, selectedCategory, selectedLanguage]);

  return (
    <div className="app-shell">
      {/* Top Main Navigation Bar */}
      <Header
        activeNav={activeNav}
        onNavigate={(nav) => {
          setActiveNav(nav);
          if (nav === 'live' && !currentChannel && allChannels.length > 0) {
            handleSelectChannel(allChannels[0]);
          }
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenSearchModal={() => setShowSearchModal(true)}
        totalChannels={allChannels.length}
        favoritesCount={favorites.length}
        activePlaylistUrl={playlistUrl}
        onOpenPlaylistModal={() => setShowPlaylistModal(true)}
        onOpenShortcutsModal={() => setShowShortcutsModal(true)}
        onOpenSettingsModal={() => setShowSettingsModal(true)}
        onOpenDialerModal={() => setShowDialerModal(true)}
        corsProxy={corsProxy}
        setCorsProxy={setCorsProxy}
        onRefreshPlaylist={() => loadPlaylist(playlistUrl)}
        isLoading={isLoading}
        selectedCategory={selectedCategory}
        onCategorySwitch={(cat) => setSelectedCategory(cat)}
        selectedLanguage={selectedLanguage}
        onLanguageModeSwitch={(lang) => setSelectedLanguage(lang)}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />

      <div className="app-body">
        {/* Mobile Backdrop */}
        <div
          className={`sidebar-backdrop ${!sidebarCollapsed ? 'active' : ''}`}
          onClick={() => setSidebarCollapsed(true)}
          aria-hidden="true"
        />

        {/* Channels Drawer / Sidebar */}
        <Sidebar
          channels={categoryFilteredChannels}
          currentChannel={currentChannel}
          favorites={favorites}
          history={history}
          onSelectChannel={handleSelectChannel}
          onToggleFavorite={handleToggleFavorite}
          activeTab={activeSidebarTab}
          setActiveTab={setActiveSidebarTab}
          collapsed={sidebarCollapsed}
          onClose={() => setSidebarCollapsed(true)}
          selectedLanguage={selectedLanguage}
          onLanguageSwitch={(l) => setSelectedLanguage(l)}
          selectedCategory={selectedCategory}
          onCategorySwitch={(c) => setSelectedCategory(c)}
        />

        {/* Main Display Panel */}
        <main className="main-panel">
          {/* TAB 1: HOMEPAGE (OTT / STREAMING PLATFORM EXPERIENCE) */}
          {activeNav === 'home' && (
            <div className="homepage-content-view">
              {/* Hero / Now Playing */}
              <HeroBanner
                channel={featuredChannel}
                currentChannel={currentChannel}
                isPlaying={Boolean(currentChannel)}
                onPlayChannel={handleSelectChannel}
                isFavorite={favorites.some(f => f.id === featuredChannel?.id)}
                onToggleFavorite={handleToggleFavorite}
                onOpenDetails={(ch) => setShowDetailsChannel(ch)}
                onShareChannel={handleShareChannel}
              />

              {/* Continue Watching Section (Requirement 6) */}
              {(history.length > 0 || lastWatchedChannel) && (
                <ContinueWatchingRow
                  history={history}
                  lastWatched={lastWatchedChannel}
                  onPlayChannel={handleSelectChannel}
                  onRemoveItem={handleRemoveHistoryItem}
                  onClearAll={handleClearHistory}
                />
              )}

              {/* Locally Calculated Trending / Most Watched (Requirement 7) */}
              {trendingChannels.length > 0 && (
                <ChannelSectionRow
                  title="🔥 Trending Channels"
                  icon={Flame}
                  subtitle="Most watched broadcasts based on your local viewing activity"
                  channels={trendingChannels}
                  currentChannel={currentChannel}
                  onSelectChannel={handleSelectChannel}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenDetails={(ch) => setShowDetailsChannel(ch)}
                  onShareChannel={handleShareChannel}
                  badge="Trending"
                />
              )}

              {/* My Favorites Rail */}
              {favorites.length > 0 && (
                <ChannelSectionRow
                  title="My Favorites"
                  icon={Star}
                  subtitle="Your personally starred live channels"
                  channels={favorites}
                  currentChannel={currentChannel}
                  onSelectChannel={handleSelectChannel}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenDetails={(ch) => setShowDetailsChannel(ch)}
                  onShareChannel={handleShareChannel}
                  badge="Saved"
                  onViewAll={() => setActiveNav('favorites')}
                />
              )}

              {/* Hindi Live TV Section */}
              {hindiChannels.length > 0 && (
                <ChannelSectionRow
                  title="Hindi Live TV"
                  icon={Tv}
                  subtitle="Top national Hindi entertainment, news, movies, and music"
                  channels={hindiChannels}
                  currentChannel={currentChannel}
                  onSelectChannel={handleSelectChannel}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenDetails={(ch) => setShowDetailsChannel(ch)}
                  onShareChannel={handleShareChannel}
                  badge="Popular"
                  onViewAll={() => { setSelectedCategory('Hindi'); setActiveNav('categories'); }}
                />
              )}

              {/* Telugu Live TV Section (Requirement 11: Telugu-First Experience) */}
              {teluguChannels.length > 0 && (
                <ChannelSectionRow
                  title="Telugu Live TV"
                  icon={Tv}
                  subtitle="Top regional entertainment, movies, and news from AP & Telangana"
                  channels={teluguChannels}
                  currentChannel={currentChannel}
                  onSelectChannel={handleSelectChannel}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenDetails={(ch) => setShowDetailsChannel(ch)}
                  onShareChannel={handleShareChannel}
                  badge="Telugu"
                  onViewAll={() => { setSelectedCategory('Telugu'); setActiveNav('categories'); }}
                />
              )}

              {/* Dedicated Telugu Sub-rails: News, Movies, Music, Devotional */}
              {teluguNewsChannels.length > 0 && (
                <ChannelSectionRow
                  title="📰 Telugu News 24/7"
                  icon={Newspaper}
                  subtitle="Live breaking bulletins, political debates, and AP & Telangana ground updates"
                  channels={teluguNewsChannels}
                  currentChannel={currentChannel}
                  onSelectChannel={handleSelectChannel}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenDetails={(ch) => setShowDetailsChannel(ch)}
                  onShareChannel={handleShareChannel}
                  badge="Live News"
                  onViewAll={() => { setSelectedCategory('Telugu'); setActiveNav('categories'); }}
                />
              )}

              {teluguMovieChannels.length > 0 && (
                <ChannelSectionRow
                  title="🎬 Telugu Movies & Cinema"
                  icon={Clapperboard}
                  subtitle="Tollywood blockbusters, golden era cinema, and nonstop film entertainment"
                  channels={teluguMovieChannels}
                  currentChannel={currentChannel}
                  onSelectChannel={handleSelectChannel}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenDetails={(ch) => setShowDetailsChannel(ch)}
                  onShareChannel={handleShareChannel}
                  badge="Movies"
                  onViewAll={() => { setSelectedCategory('Telugu'); setActiveNav('categories'); }}
                />
              )}

              {teluguMusicChannels.length > 0 && (
                <ChannelSectionRow
                  title="🎵 Telugu Music & Chartbusters"
                  icon={Music}
                  subtitle="Tollywood soundtracks, melodies, and non-stop music countdowns"
                  channels={teluguMusicChannels}
                  currentChannel={currentChannel}
                  onSelectChannel={handleSelectChannel}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenDetails={(ch) => setShowDetailsChannel(ch)}
                  onShareChannel={handleShareChannel}
                  onViewAll={() => { setSelectedCategory('Telugu'); setActiveNav('categories'); }}
                />
              )}

              {teluguDevotionalChannels.length > 0 && (
                <ChannelSectionRow
                  title="🙏 Telugu Devotional & Darshan"
                  icon={HeartHandshake}
                  subtitle="Sacred Tirumala darshans, daily rituals, and spiritual discourses"
                  channels={teluguDevotionalChannels}
                  currentChannel={currentChannel}
                  onSelectChannel={handleSelectChannel}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenDetails={(ch) => setShowDetailsChannel(ch)}
                  onShareChannel={handleShareChannel}
                  onViewAll={() => { setSelectedCategory('Telugu'); setActiveNav('categories'); }}
                />
              )}

              {/* Tamil Live TV Section */}
              {tamilChannels.length > 0 && (
                <ChannelSectionRow
                  title="Tamil Live TV"
                  icon={Tv}
                  subtitle="Leading Tamil entertainment, 24x7 news, serials, and cinema"
                  channels={tamilChannels}
                  currentChannel={currentChannel}
                  onSelectChannel={handleSelectChannel}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenDetails={(ch) => setShowDetailsChannel(ch)}
                  onShareChannel={handleShareChannel}
                  badge="Live"
                  onViewAll={() => { setSelectedCategory('Tamil'); setActiveNav('categories'); }}
                />
              )}

              {/* English & Global Live TV Section */}
              {englishChannels.length > 0 && (
                <ChannelSectionRow
                  title="English & World TV"
                  icon={Globe}
                  subtitle="World news, international documentaries, sports, and Hollywood cinema"
                  channels={englishChannels}
                  currentChannel={currentChannel}
                  onSelectChannel={handleSelectChannel}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenDetails={(ch) => setShowDetailsChannel(ch)}
                  onShareChannel={handleShareChannel}
                  badge="Global"
                  onViewAll={() => { setSelectedCategory('English'); setActiveNav('categories'); }}
                />
              )}

              {/* Malayalam Live TV Section */}
              {malayalamChannels.length > 0 && (
                <ChannelSectionRow
                  title="Malayalam Live TV"
                  icon={Tv}
                  subtitle="Kerala regional news, entertainment, and cultural broadcasts"
                  channels={malayalamChannels}
                  currentChannel={currentChannel}
                  onSelectChannel={handleSelectChannel}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenDetails={(ch) => setShowDetailsChannel(ch)}
                  onShareChannel={handleShareChannel}
                  onViewAll={() => { setSelectedCategory('Malayalam'); setActiveNav('categories'); }}
                />
              )}

              {/* Kannada Live TV Section */}
              {kannadaChannels.length > 0 && (
                <ChannelSectionRow
                  title="Kannada Live TV"
                  icon={Tv}
                  subtitle="Karnataka state news, debates, entertainment, and local updates"
                  channels={kannadaChannels}
                  currentChannel={currentChannel}
                  onSelectChannel={handleSelectChannel}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenDetails={(ch) => setShowDetailsChannel(ch)}
                  onShareChannel={handleShareChannel}
                  onViewAll={() => { setSelectedCategory('Kannada'); setActiveNav('categories'); }}
                />
              )}

              {/* News Section */}
              <ChannelSectionRow
                title="News Channels"
                icon={Newspaper}
                subtitle="Live 24/7 breaking news and current affairs bulletins"
                channels={newsChannels}
                currentChannel={currentChannel}
                onSelectChannel={handleSelectChannel}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onOpenDetails={(ch) => setShowDetailsChannel(ch)}
                onShareChannel={handleShareChannel}
                onViewAll={() => { setSelectedCategory('News'); setActiveNav('categories'); }}
              />

              {/* Movies Section */}
              <ChannelSectionRow
                title="Movies & Cinema"
                icon={Clapperboard}
                subtitle="Blockbuster releases, superhit cinema, and non-stop film channels"
                channels={movieChannels}
                currentChannel={currentChannel}
                onSelectChannel={handleSelectChannel}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onOpenDetails={(ch) => setShowDetailsChannel(ch)}
                onShareChannel={handleShareChannel}
                onViewAll={() => { setSelectedCategory('Movies'); setActiveNav('categories'); }}
              />

              {/* Entertainment Section */}
              <ChannelSectionRow
                title="Entertainment & Serials"
                icon={Sparkles}
                subtitle="Prime family drama, comedy shows, and star specials"
                channels={entertainmentChannels}
                currentChannel={currentChannel}
                onSelectChannel={handleSelectChannel}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onOpenDetails={(ch) => setShowDetailsChannel(ch)}
                onShareChannel={handleShareChannel}
                onViewAll={() => { setSelectedCategory('Entertainment'); setActiveNav('categories'); }}
              />

              {/* Music Section */}
              <ChannelSectionRow
                title="Music & Chartbusters"
                icon={Music}
                subtitle="Trending music videos, soundtrack releases, and melodies"
                channels={musicChannels}
                currentChannel={currentChannel}
                onSelectChannel={handleSelectChannel}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onOpenDetails={(ch) => setShowDetailsChannel(ch)}
                onShareChannel={handleShareChannel}
                onViewAll={() => { setSelectedCategory('Music'); setActiveNav('categories'); }}
              />

              {/* Sports Section */}
              <ChannelSectionRow
                title="Sports Arena"
                icon={Trophy}
                subtitle="Live cricket, football, athletics, and championship coverage"
                channels={sportsChannels}
                currentChannel={currentChannel}
                onSelectChannel={handleSelectChannel}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onOpenDetails={(ch) => setShowDetailsChannel(ch)}
                onShareChannel={handleShareChannel}
                onViewAll={() => { setSelectedCategory('Sports'); setActiveNav('categories'); }}
              />

              {/* Kids Section */}
              <ChannelSectionRow
                title="Kids & Cartoons"
                icon={Baby}
                subtitle="Animated series, children's rhymes, and family-friendly cartoons"
                channels={kidsChannels}
                currentChannel={currentChannel}
                onSelectChannel={handleSelectChannel}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onOpenDetails={(ch) => setShowDetailsChannel(ch)}
                onShareChannel={handleShareChannel}
                onViewAll={() => { setSelectedCategory('Kids'); setActiveNav('categories'); }}
              />

              {/* Devotional Section */}
              <ChannelSectionRow
                title="Devotional & Spiritual"
                icon={HeartHandshake}
                subtitle="Sacred temple darshans, rituals, and spiritual discourses"
                channels={devotionalChannels}
                currentChannel={currentChannel}
                onSelectChannel={handleSelectChannel}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onOpenDetails={(ch) => setShowDetailsChannel(ch)}
                onShareChannel={handleShareChannel}
                onViewAll={() => { setSelectedCategory('Devotional'); setActiveNav('categories'); }}
              />

              {/* Recently Added Section */}
              {recentlyAddedChannels.length > 0 && (
                <ChannelSectionRow
                  title="Recently Added Channels"
                  icon={Sparkles}
                  subtitle="Fresh additions to our streaming directory"
                  channels={recentlyAddedChannels}
                  currentChannel={currentChannel}
                  onSelectChannel={handleSelectChannel}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenDetails={(ch) => setShowDetailsChannel(ch)}
                  onShareChannel={handleShareChannel}
                  badge="NEW"
                  onViewAll={() => { setSelectedCategory('All'); setActiveNav('categories'); }}
                />
              )}

              {/* Smart Recommendations with "Because you watched..." (Requirement 8) */}
              <ChannelSectionRow
                title={recommendationContext.title}
                icon={Compass}
                subtitle={recommendationContext.subtitle}
                channels={recommendationContext.channels}
                currentChannel={currentChannel}
                onSelectChannel={handleSelectChannel}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onOpenDetails={(ch) => setShowDetailsChannel(ch)}
                onShareChannel={handleShareChannel}
              />
            </div>
          )}

          {/* TAB 2: LIVE TV PLAYER (SPLIT DESKTOP / STACKED MOBILE) */}
          {activeNav === 'live' && (
            <VideoPlayer
              channel={currentChannel || allChannels[0]}
              allChannels={allChannels}
              onSelectChannel={handleSelectChannel}
              onToggleFavorite={handleToggleFavorite}
              isFavorite={favorites.some(f => f.id === (currentChannel?.id || allChannels[0]?.id))}
              corsProxy={corsProxy}
              setCorsProxy={setCorsProxy}
              onOpenChannels={() => setSidebarCollapsed(false)}
              onOpenSearch={() => setShowSearchModal(true)}
              onOpenDetails={(ch) => setShowDetailsChannel(ch)}
              onBrowseChannels={(cat) => {
                if (cat) setSelectedCategory(cat);
                setActiveNav('categories');
              }}
              selectedCategory={selectedCategory}
              onCategorySwitch={(cat) => {
                setSelectedCategory(cat);
              }}
            />
          )}

          {/* TAB 3: CATEGORIES & CHANNEL DIRECTORY GRID */}
          {activeNav === 'categories' && (
            <div className="categories-directory-view">
              <div className="directory-header-banner">
                <h1 className="directory-title">
                  {selectedCategory === 'All' ? 'All Channels Directory' : `${selectedCategory} Live TV`}
                </h1>
                <p className="directory-subtitle">
                  Browse, filter by quality, or sort through {categoryFilteredChannels.length.toLocaleString()} verified broadcast streams
                </p>
              </div>

              <ChannelGrid
                channels={categoryFilteredChannels}
                currentChannel={currentChannel}
                onSelectChannel={handleSelectChannel}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onOpenDetails={(ch) => setShowDetailsChannel(ch)}
                onShareChannel={handleShareChannel}
                selectedCategory={selectedCategory}
                onCategorySwitch={(c) => setSelectedCategory(c)}
                selectedLanguage={selectedLanguage}
                onLanguageSwitch={(l) => setSelectedLanguage(l)}
                searchQuery={searchQuery}
                isLoading={isLoading && allChannels.length === 0}
              />
            </div>
          )}

          {/* TAB 4: TV GUIDE / EPG */}
          {activeNav === 'tvguide' && (
            <TVGuide
              channels={allChannels}
              currentChannel={currentChannel}
              onSelectChannel={handleSelectChannel}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
            />
          )}

          {/* TAB 5: FAVORITES */}
          {activeNav === 'favorites' && (
            <div className="favorites-page-view">
              <div className="directory-header-banner">
                <h1 className="directory-title">★ My Favorites</h1>
                <p className="directory-subtitle">
                  {favorites.length} channel(s) saved for quick instant playback
                </p>
              </div>

              {favorites.length === 0 ? (
                <EmptyState
                  type="favorites"
                  title="No favorite channels yet"
                  message="Browse the channel directory and click the star icon on any channel card to pin it here."
                  actionLabel="Browse Channels"
                  onAction={() => setActiveNav('categories')}
                />
              ) : (
                <ChannelGrid
                  channels={favorites}
                  currentChannel={currentChannel}
                  onSelectChannel={handleSelectChannel}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenDetails={(ch) => setShowDetailsChannel(ch)}
                  onShareChannel={handleShareChannel}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Persistent Mini Player when viewing other screens (Requirement 2) */}
      {currentChannel && activeNav !== 'live' && (
        <MiniPlayer
          channel={currentChannel}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(prev => !prev)}
          onClose={() => setCurrentChannel(null)}
          onExpand={() => setActiveNav('live')}
        />
      )}

      {/* Sticky Bottom Navigation for Mobile Touch Screens (Requirement 16) */}
      <MobileBottomNav
        activeNav={activeNav}
        onNavigate={(nav) => {
          if (nav === 'settings') {
            setShowSettingsModal(true);
          } else {
            setActiveNav(nav);
            if (nav === 'live' && !currentChannel && allChannels.length > 0) {
              handleSelectChannel(allChannels[0]);
            }
          }
        }}
        favoritesCount={favorites.length}
      />

      {/* MODALS */}
      {/* 1. Smart Search Modal */}
      <SmartSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        allChannels={allChannels}
        currentChannel={currentChannel}
        onSelectChannel={handleSelectChannel}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
        onOpenDetails={(ch) => setShowDetailsChannel(ch)}
        onShareChannel={handleShareChannel}
      />

      {/* 2. Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        currentTheme={currentTheme}
        onThemeChange={(t) => setCurrentTheme(t)}
        onClearFavorites={handleClearFavorites}
        onClearHistory={handleClearHistory}
        onResetAllData={handleResetAllData}
        favoritesCount={favorites.length}
        historyCount={history.length}
      />

      {/* 3. Channel Details Modal */}
      {showDetailsChannel && (
        <ChannelDetailsModal
          channel={showDetailsChannel}
          onClose={() => setShowDetailsChannel(null)}
          onPlayChannel={handleSelectChannel}
          isFavorite={favorites.some(f => f.id === showDetailsChannel.id)}
          onToggleFavorite={handleToggleFavorite}
          onShareChannel={handleShareChannel}
        />
      )}

      {/* 4. Channel Number Dialer Modal */}
      <ChannelNumberDialer
        isOpen={showDialerModal}
        onClose={() => setShowDialerModal(false)}
        allChannels={allChannels}
        onSelectChannel={handleSelectChannel}
        favorites={favorites}
        history={history}
      />

      {/* 5. M3U Playlist Modal */}
      {showPlaylistModal && (
        <PlaylistModal
          onClose={() => setShowPlaylistModal(false)}
          onLoadUrl={(urlOrText) => {
            if (urlOrText.startsWith('#EXTM3U') || urlOrText.startsWith('#EXTINF')) {
              const { channels: parsed } = parseM3U(urlOrText);
              setAllChannels(ChannelManager.getActiveChannels(parsed));
              setPlaylistUrl('local');
            } else {
              setPlaylistUrl(urlOrText);
              loadPlaylist(urlOrText);
            }
          }}
          activePlaylistUrl={playlistUrl}
        />
      )}

      {/* 6. Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <ShortcutsModal onClose={() => setShowShortcutsModal(false)} />
      )}
    </div>
  );
}
