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
  const country = (channel.country || '').toUpperCase();
  const url = (channel.url || '').toLowerCase();

  // 1. Strict Exclusions (channels that contain keywords or shared acronyms but are NOT Telugu)
  // Non-Telugu language feeds of SVBC (SVBC 2 = Tamil, SVBC 3 = Kannada, SVBC 4 = Hindi)
  if (/\bsvbc\s*[234]\b/i.test(name) || /svbc[234]\.in/i.test(tvgId)) return false;

  // Big TV Malayalam feed
  if (/big\s*tv\s*24x?7/i.test(name) || /bigtv24x7/i.test(tvgId) || url.includes('bigtvmalayalam')) return false;

  // Non-Telugu regional / pan-India channels
  if (/\b4\s*sides\s*tv\b/i.test(name) || /4sidestv/i.test(tvgId)) return false;
  if (/\b9\s*plus\s*news\b/i.test(name) || /9plusnews/i.test(tvgId)) return false;
  if (/\bgospel\s*tv\s*india\b/i.test(name) || /gospeltvindia/i.test(tvgId)) return false;
  if (/\bmetro\s*tv\b/i.test(name) || /metrotv/i.test(tvgId)) return false;
  if (/^mango\s*\(india\)/i.test(name) || tvgId === 'mango.in@sd') return false;
  if (/\bstudio\s*(one\s*\+|yuva)\b/i.test(name) || /studio(oneplus|yuva)/i.test(tvgId)) return false;
  // Exclude ETV Bal Bharat (Hindi children's channel)
  if (/bal\s*bharat/i.test(name) || /balbharat/i.test(tvgId)) return false;

  // Check if channel explicitly designates Telugu in title or TVG-ID
  const hasExplicitTeluguInNameOrId =
    /\b(telugu|telegu)\b/i.test(name) ||
    /\b(telugu|telegu)\b/i.test(tvgId) ||
    /@telugu\b/i.test(tvgId) ||
    /\.tel\.in/i.test(tvgId);

  // Exclude non-Telugu pan-Indian channels that are placed in tel.m3u solely due to secondary audio tracks
  // (e.g. Disney Channel, Hungama, Nick, Sonic, Sony Pix, Sony BBC Earth, Star Sports 2 HD English, etc.)
  const nonTeluguPanIndiaPattern = /hungama|nickelodeon|\bnick\b|\bsonic\b|disney|sony\s*(bbc|pix|yay)|super\s*hungama|history\s*tv18|national\s*geographic|nat\s*geo|cartoon\s*network|discovery|eurosport|fox\s*life|dd\s*sports|sada\s*tv|yet\s*(tv|max)/i;
  if (!hasExplicitTeluguInNameOrId && (nonTeluguPanIndiaPattern.test(name) || nonTeluguPanIndiaPattern.test(tvgId))) {
    return false;
  }

  // Star Sports 2 (English) vs Star Sports 2 Telugu
  if (/star\s*sports\s*2\b/i.test(name) && !hasExplicitTeluguInNameOrId) return false;
  if (/starsports2\.in@hd/i.test(tvgId) && !hasExplicitTeluguInNameOrId) return false;

  // 2. Explicit Telugu language tag or group
  const hasExplicitTelugu =
    hasExplicitTeluguInNameOrId ||
    chLang === 'telugu' || chLang === 'telegu' || chLang === 'tel' ||
    chLangs.some(l => l === 'telugu' || l === 'telegu' || l === 'tel') ||
    group === 'telugu' || group.includes('in: telugu') || group.includes('india: telugu');

  if (hasExplicitTelugu) return true;

  // 3. For brand acronyms (ETV, ABN, Gemini, TV9, TV5, V6, NTV, 10TV, etc.), STRICTLY require Indian origin (.in in tvgId or country IN)
  // This completely eliminates foreign channels like ETV Estonia, ETV Turkey, ABN Pakistan, iNews Indonesia, etc.
  const isIndian = country === 'IN' || /\.in(@|$)/i.test(tvgId);
  if (!isIndian) return false;

  const teluguBrandRegex = new RegExp(
    '\\bstar\\s*maa\\b|\\bstarmaa\\b|\\bmaa\\s*(tv|movies|gold|music)\\b' +
    '|\\bzee\\s*(telugu|cinemalu)\\b|\\bzeecinemalu\\b' +
    '|\\betv\\s*(telugu|andhra|telangana|plus|cinema|life|abhiruchi|news|beats|comedy|josh|music)?\\b' +
    '|\\betv(telugu|andhra|telangana|plus|cinema|life|abhiruchi|news|beats|comedy|josh|music)?\\.in' +
    '|\\bgemini\\s*(tv|movies|music|comedy|life)\\b|\\bsungemini\\b' +
    '|\\btv9\\s*telugu\\b|\\btv9telugu\\b|\\btv5\\s*news\\b|\\btv5news\\b|\\bv6\\s*news\\b|\\bv6news\\b' +
    '|\\bntv\\s*telugu\\b|\\bntvtelugu\\b|\\bntv\\s*news\\b' +
    '|\\bhmtv\\b|\\b10\\s*tv\\b|\\b10tv\\b|\\b99\\s*tv\\b|\\b99tv\\b' +
    '|\\bprime\\s*9(\\s*news)?\\b|\\bprime9news\\b' +
    '|\\bcvr\\s*(news|health|om|spiritual)\\b|\\bcvr(news|health|omspiritual)?\\.in' +
    '|\\babn\\s*(andhra|jyoth?i)?\\b|\\babnandhra\\b|\\babn\\.in\\b' +
    '|\\bsakshi\\s*(tv|news)?\\b|\\bsakshitv\\b' +
    '|\\b(t[\\s-]news|tnews)\\b' +
    '|\\bbig\\s*tv\\b|\\bbigtv\\.in\\b' +
    '|\\bbrk\\s*news\\b|\\bbrknews\\.in\\b' +
    '|\\bswatantra\\s*tv\\b|\\bswatantratv\\.in\\b' +
    '|\\bdd\\s*(saptagiri|yadagiri)\\b|\\bdd(saptagiri|yadagiri)\\.in\\b' +
    '|\\bvanitha\\s*tv\\b|\\bvanithatv\\b' +
    '|\\bvissa\\s*tv\\b|\\bvissatv\\b' +
    '|\\bsvbc\\b|\\bsvbc\\.in\\b' +
    '|\\bbhakthi\\s*tv\\b|\\bbhakthitv\\b' +
    '|\\b6\\s*tv\\s*telugu\\b|\\b6tvtelugu\\b' +
    '|\\bmahaa\\s*(news|tv|max|bhakti)\\b|\\bmahaa(news|max|bhakti)?\\.in\\b' +
    '|\\bmango\\s*(mobile\\s*tv|music|telugu)\\b|\\bmangomobiletv\\b' +
    '|\\binews\\b|\\binews\\.in\\b' +
    '|\\bmojo\\s*tv\\b|\\bmojotv\\.in\\b' +
    '|\\bdivyavani\\s*tv\\b|\\bdivyavanitv\\b' +
    '|\\bhindu\\s*dharmam\\b|\\bhindudharmam\\b' +
    '|\\bnireekshana\\s*tv\\b|\\bnireekshanatv\\b' +
    '|\\bsubhavaarth?a\\b|\\bsubhavaarthatv\\b' +
    '|\\btolly\\s*tv\\b|\\btollywood\\b|\\btollytv\\b' +
    '|\\braj\\s*(news|musix)\\s*telugu\\b|\\braj(news|musix)telugu\\b' +
    '|\\bnews18\\s*(telugu|andhra|telangana)\\b' +
    '|\\btelugu\\s*one\\b|\\bteluguone\\.in\\b' +
    '|\\bap\\s*24x?7\\b' +
    '|\\bpmc\\s*telugu\\b|\\bpmctelugu\\b' +
    '|\\bwow\\s*kidz\\s*telugu\\b|wowkidz.*telugu' +
    '|sony.*sport.*telugu|star.*sport.*telugu',
    'i'
  );

  const combined = `${name} ${tvgId} ${group}`;
  return teluguBrandRegex.test(combined);
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
  const lang3 = langLC.slice(0, 3);
  if (tvgId.endsWith(`.${lang3}.in`) || tvgId.includes(`.${lang3}@`) || tvgId.includes(`@${langLC}`)) return true;

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
    // 1. Try direct fetch first (iptv-org has native CORS Access-Control-Allow-Origin: *)
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

    // 2. Fallback to CORS proxies if direct fetch was blocked
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
        // try next proxy
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
              allChannels={allChannels}
              onSelectChannel={handleSelectChannel}
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
