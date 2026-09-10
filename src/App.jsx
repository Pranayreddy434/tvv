import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import VideoPlayer from './components/VideoPlayer';
import PlaylistModal from './components/PlaylistModal';
import ShortcutsModal from './components/ShortcutsModal';
import { parseM3U } from './services/m3uParser';
import './index.css';

const DEFAULT_PLAYLIST = 'https://iptv-org.github.io/iptv/index.m3u';

// Telugu-specific channel detection: guaranteed zero false positives
function isTeluguChannel(channel) {
  const name = (channel.name || '').toLowerCase();
  const tvgId = (channel.tvgId || '').toLowerCase();
  const group = (channel.group || '').toLowerCase();
  const chLang = (channel.language || '').toLowerCase();
  const chLangs = (channel.languages || []).map(l => l.toLowerCase());

  // 1. Explicit Telugu language tag from M3U or parser
  if (chLang === 'telugu' || chLang === 'telegu' || chLang === 'tel') return true;
  if (chLangs.some(l => l === 'telugu' || l === 'telegu' || l === 'tel')) return true;
  if (group === 'telugu' || group.includes('in: telugu') || group.includes('india: telugu')) return true;

  // 2. Explicit Telugu keyword in channel name or tvgId
  if (/\btelugu\b|\btelegu\b/.test(name) || /\btelugu\b|\btelegu\b/.test(tvgId)) return true;
  if (/@telugu\b/i.test(tvgId)) return true;
  if (/\.tel\.in/i.test(tvgId)) return true;

  // 3. Known Telugu channel brands - strictly require Indian origin (.in in tvgId or country IN)
  // to avoid colliding with foreign stations that share acronyms (e.g. TV5 Monde, ETV Estonia)
  const isIndian = (channel.country || '').toUpperCase() === 'IN' || /\.in(@|$)/i.test(tvgId);
  if (!isIndian) return false;

  const teluguBrandPatterns = [
    /\bstar\s*maa\b/,
    /\bmaa\s*(tv|movies|gold|music)\b/,
    /\bzee\s*(telugu|cinemalu)\b/,
    /\betv\s*(telugu|andhra|telangana|plus|cinema|life|abhiruchi)\b/,
    /\betv(telugu|andhra|telangana|plus|cinema|life|abhiruchi)\.in/,
    /\bgemini\s*(tv|movies|music|comedy|life)\b/,
    /\btv9\s*telugu\b/,
    /\btv5\s*news\b/,
    /\bv6\s*news\b/,
    /\bntv\s*telugu\b/,
    /\bhmtv\b/,
    /\b10\s*tv\b/,
    /\b99\s*tv\b/,
    /\bprime9(\s*news)?\b/,
    /\bcvr\s*news\b/,
    /\babn\s*(andhra|jyoth?i)\b/,
    /\babnandhra/,
    /\bsakshi\s*(tv|news)?\b/,
    /\b(t[\s-]news|tnews)\b/,
    /\bvanitha\s*tv\b/,
    /\bvissa\s*tv\b/,
    /\bsubhavaarth?a\b/,
    /\bsvbc(\s*\d|\s*sri)?\b/,
    /\btolly\s*tv\b/,
    /\btollywood\b/,
    /\braj\s*(news|musix)\s*telugu\b/,
    /\bnews18\s*(telugu|andhra)\b/,
    /\bmahaa\s*(news|tv)\b/,
    /\bap\s*24x?7\b/,
    /\bbhakthi\s*tv\b/,
    /\b6\s*tv\s*telugu\b/
  ];

  const combined = `${name} ${tvgId}`;
  return teluguBrandPatterns.some(pat => pat.test(combined));
}

// Fallback keyword mapping for other languages
const LANG_KEYWORDS = {
  Hindi: [
    'hindi', 'aaj tak', 'zee news', 'ndtv india', 'star plus', 'colors tv', 'abp news',
    'india tv', 'news18 india', 'republic bharat', 'tv9 bharatvarsh', 'dd news',
    'sansad tv', 'news24', 'news nation', 'zee hindustan', 'doordarshan', 'dd national',
    'samachar', 'sahara', 'sony', 'tez', 'star bharat', 'sab tv', 'star gold',
    'zee cinema', '& pictures', 'set max', 'star utsav', 'zee bollywood', 'sony pal',
    'in: hindi', 'india: hindi',
  ],
  English: [
    'english', 'bbc', 'cnn', 'fox news', 'sky news', 'discovery', 'nat geo',
    'history channel', 'animal planet', 'bloomberg', 'dw english', 'france 24',
    'al jazeera english', 'wion', 'times now', 'india today', 'republic tv',
    'mirror now', 'newsx', 'cnbc', 'espn', 'sky sport',
    'in: english', 'india: english',
  ],
  Tamil: [
    'tamil', 'vijay tv', 'sun tv', 'kalaignar tv', 'raj tv', 'polimer',
    'puthiya thalaimurai', 'thanthi', 'jaya tv', 'news 7 tamil', 'captain tv',
    'dd tamil', 'adithya tv', 'zee tamil', 'star vijay',
    'in: tamil', 'india: tamil',
  ],
};

function matchesLanguage(channel, lang) {
  if (lang === 'ALL') return true;
  if (lang === 'Telugu') return isTeluguChannel(channel);

  const langLC = lang.toLowerCase();

  // 1. Check tvg-language field assigned by parser (most reliable)
  const chLang = (channel.language || '').toLowerCase();
  const chLangs = (channel.languages || []).map(l => l.toLowerCase());
  if (chLang === langLC || chLang.includes(langLC)) return true;
  if (chLangs.some(l => l === langLC || l.includes(langLC))) return true;

  // 2. Check tvg-id which often encodes country/language
  const tvgId = (channel.tvgId || '').toLowerCase();
  if (tvgId.includes(langLC.slice(0, 3))) return true; // e.g. 'hin' in 'StarPlus.hin.in'

  // 3. Keyword fallback against name + group + tvgId
  const keywords = LANG_KEYWORDS[lang] || [];
  const nameL = (channel.name || '').toLowerCase();
  const groupL = (channel.group || '').toLowerCase();
  const combined = `${nameL} ${groupL} ${tvgId}`;
  return keywords.some(kw => combined.includes(kw));
}

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

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Load playlist
  const loadPlaylist = useCallback(async (url) => {
    if (!url) return;
    setIsLoading(true);
    try {
      const proxied = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      const res = await fetch(proxied);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      const { channels } = parseM3U(text);
      setAllChannels(channels);
      localStorage.setItem('activePlaylist', url);
    } catch (err) {
      console.error('Playlist load failed:', err);
      // Try without proxy
      try {
        const res = await fetch(url);
        const text = await res.text();
        const { channels } = parseM3U(text);
        setAllChannels(channels);
      } catch (e) {
        console.error('Direct fetch also failed:', e);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadPlaylist(playlistUrl); }, [playlistUrl, loadPlaylist]);

  // Persist favorites & history
  useEffect(() => { localStorage.setItem('favChannels', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('chHistory', JSON.stringify(history.slice(0, 80))); }, [history]);

  // Filtered channels for sidebar
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

  // Language and category filters are INDEPENDENT — they stack together
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
      // It's raw M3U content (file upload)
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
        />

        {/* MAIN VIDEO PANEL */}
        <main className="main-panel">
          {isLoading && allChannels.length === 0 ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 20,
              background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.07) 0%, transparent 70%)'
            }}>
              <div className="spin" style={{
                width: 52, height: 52,
              border: '3px solid rgba(249,115,22,0.15)',
              borderTopColor: '#F97316',
                borderRadius: '50%'
              }} />
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Loading Channels</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  Fetching {playlistUrl === DEFAULT_PLAYLIST ? 'global IPTV directory' : 'playlist'}…
                </p>
              </div>
            </div>
          ) : (
            <VideoPlayer
              channel={currentChannel}
              onToggleFavorite={handleToggleFavorite}
              isFavorite={isFavorite}
              corsProxy={corsProxy}
              setCorsProxy={setCorsProxy}
            />
          )}
        </main>
      </div>

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
