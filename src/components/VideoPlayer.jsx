import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Hls from 'hls.js';
import {
  Play, Pause, Volume2, VolumeX, Volume1, Maximize, Minimize, PictureInPicture2,
  AlertTriangle, ExternalLink, Copy, Star, Tv, ShieldAlert, Monitor,
  ChevronDown, Check, Languages, X, Menu, Zap, Radio, ChevronLeft, ChevronRight,
  Share2, RotateCcw, RotateCw, Clock, Sparkles, Film
} from 'lucide-react';
import {
  AUDIO_LANGUAGES,
  matchesLanguage,
  ISO_LANG_MAP
} from '../services/languageService';
import { getCurrentAndNextProgram } from '../services/epgService';
import { analytics } from '../services/analyticsService';

const REGIONAL_NATIVE_NAMES = {
  Telugu: 'తెలుగు',
  Hindi: 'हिंदी',
  English: 'English',
  Tamil: 'தமிழ்',
  Kannada: 'ಕನ್ನಡ',
  Malayalam: 'മലയാളം',
  Bengali: 'বাংলা',
  Marathi: 'मराठी',
  Gujarati: 'ગુજરાતી',
  Punjabi: 'ਪੰਜਾਬੀ',
  Odia: 'ଓଡ଼ିଆ',
  Urdu: 'اردو',
};

function getTrackLabel(track, index) {
  if (!track) return `Audio ${index + 1}`;
  const langKey = (track.lang || '').toLowerCase().trim();
  if (langKey && ISO_LANG_MAP[langKey]) {
    if (track.name && !track.name.toLowerCase().startsWith('audio') && track.name.toLowerCase() !== langKey) {
      return `${ISO_LANG_MAP[langKey]} (${track.name})`;
    }
    return ISO_LANG_MAP[langKey];
  }
  if (track.name && !track.name.toLowerCase().startsWith('audio_') && !track.name.toLowerCase().startsWith('audio 0')) {
    const lowerName = track.name.toLowerCase();
    for (const [, val] of Object.entries(ISO_LANG_MAP)) {
      if (lowerName.includes(val.toLowerCase())) return val;
    }
    return track.name;
  }
  return track.lang ? track.lang.toUpperCase() : `Audio Track ${index + 1}`;
}

const CATEGORIES_TABS = ['All', 'Telugu', 'News', 'Movies', 'Sports', 'Entertainment', 'Music', 'Kids', 'Devotional'];

export default function VideoPlayer({
  channel,
  allChannels = [],
  onSelectChannel,
  onToggleFavorite,
  isFavorite,
  corsProxy,
  setCorsProxy,
  onOpenChannels,
  onOpenSearch,
  onOpenDetails,
  onBrowseChannels,
  selectedCategory = 'All',
  onCategorySwitch
}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const containerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const gainNodeRef = useRef(null);
  const vocalFilterRef = useRef(null);
  const networkRetriesRef = useRef(0);
  const triedProxyRef = useRef(false);

  const [activeCategory, setActiveCategory] = useState(() => {
    return channel?.categories?.[0] || channel?.group || selectedCategory || 'All';
  });

  useEffect(() => {
    if (channel?.categories?.[0]) {
      setActiveCategory(channel.categories[0]);
    } else if (channel?.group) {
      setActiveCategory(channel.group);
    }
  }, [channel?.id, channel?.url]);

  const categoryChannels = useMemo(() => {
    if (!allChannels || allChannels.length === 0) return [];
    if (activeCategory === 'All') return allChannels.slice(0, 36);
    const catL = activeCategory.toLowerCase();
    return allChannels.filter(c => {
      if (activeCategory === 'Telugu') return matchesLanguage(c, 'Telugu') || (c.group && c.group.toLowerCase().includes('telugu'));
      const g = (c.group || '').toLowerCase();
      const n = (c.name || '').toLowerCase();
      const cats = (c.categories || []).map(x => x.toLowerCase());
      return g.includes(catL) || n.includes(catL) || cats.includes(catL);
    }).slice(0, 36);
  }, [allChannels, activeCategory]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [streamHealth, setStreamHealth] = useState('online'); // 'online' | 'checking' | 'offline'
  const [hlsLevels, setHlsLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(-1);
  const [audioTracks, setAudioTracks] = useState([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState(-1);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [speechClarity, setSpeechClarity] = useState(false);
  const [audioToast, setAudioToast] = useState(null);
  const audioToastTimerRef = useRef(null);
  const [aspectRatio, setAspectRatio] = useState('contain');
  const [copiedLink, setCopiedLink] = useState(false);
  const [sharedToast, setSharedToast] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLandscapeMode, setIsLandscapeMode] = useState(false);
  const [showOSD, setShowOSD] = useState(false);
  const osdTimerRef = useRef(null);

  // Swipe & Tap gesture tracking for mobile touch screens
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const lastTapRef = useRef({ time: 0, x: 0, y: 0 });
  const singleTapTimerRef = useRef(null);

  const isPipSupported = typeof document !== 'undefined' && 'pictureInPictureEnabled' in document;

  const showControls = () => {
    setControlsVisible(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3800);
  };

  const triggerOSD = () => {
    setShowOSD(true);
    clearTimeout(osdTimerRef.current);
    osdTimerRef.current = setTimeout(() => setShowOSD(false), 3200);
  };

  useEffect(() => {
    const handleFsChange = () => {
      const fs = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement ||
        videoRef.current?.webkitDisplayingFullscreen
      );
      if (!fs && !document.fullscreenElement && !document.webkitFullscreenElement) {
        setIsFullscreen(false);
        analytics.fullscreenToggled(false);
        if (window.screen?.orientation?.unlock) {
          try { window.screen.orientation.unlock(); } catch (e) {}
        }
      } else if (fs) {
        setIsFullscreen(true);
        analytics.fullscreenToggled(true);
        triggerOSD();
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);

    const videoEl = videoRef.current;
    const onWebkitBegin = () => {
      setIsFullscreen(true);
      analytics.fullscreenToggled(true);
      triggerOSD();
    };
    const onWebkitEnd = () => {
      setIsFullscreen(false);
      analytics.fullscreenToggled(false);
    };

    if (videoEl) {
      videoEl.addEventListener('webkitbeginfullscreen', onWebkitBegin);
      videoEl.addEventListener('webkitendfullscreen', onWebkitEnd);
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
      if (videoEl) {
        videoEl.removeEventListener('webkitbeginfullscreen', onWebkitBegin);
        videoEl.removeEventListener('webkitendfullscreen', onWebkitEnd);
      }
      clearTimeout(hideTimerRef.current);
      clearTimeout(audioToastTimerRef.current);
      clearTimeout(osdTimerRef.current);
      clearTimeout(singleTapTimerRef.current);
    };
  }, []);

  // Handle physical device rotation while in fullscreen & prevent background scrolling
  useEffect(() => {
    const handleOrientationChange = () => {
      if (isFullscreen) {
        const isPortrait = (typeof window.matchMedia === 'function' && window.matchMedia('(orientation: portrait)').matches) || (window.innerHeight > window.innerWidth);
        setIsLandscapeMode(isPortrait);
      }
    };

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    const sOrient = typeof window !== 'undefined' ? window.screen?.orientation : null;
    if (sOrient && typeof sOrient.addEventListener === 'function') {
      try {
        sOrient.addEventListener('change', handleOrientationChange);
      } catch (e) {}
    }

    if (isFullscreen) {
      if (document.body) document.body.style.overflow = 'hidden';
      if (document.documentElement) document.documentElement.style.overflow = 'hidden';
    } else {
      if (document.body) document.body.style.overflow = '';
      if (document.documentElement) document.documentElement.style.overflow = '';
    }

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (sOrient && typeof sOrient.removeEventListener === 'function') {
        try {
          sOrient.removeEventListener('change', handleOrientationChange);
        } catch (e) {}
      }
      if (document.body) document.body.style.overflow = '';
      if (document.documentElement) document.documentElement.style.overflow = '';
    };
  }, [isFullscreen]);

  const showAudioNotification = (label, duration = 2500) => {
    setAudioToast(label);
    clearTimeout(audioToastTimerRef.current);
    audioToastTimerRef.current = setTimeout(() => setAudioToast(null), duration);
  };

  // Web Audio Context setup for volume boost and dialogue clarity
  const ensureAudioCtx = () => {
    if (!videoRef.current) return;
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
      return;
    }
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const source = ctx.createMediaElementSource(videoRef.current);
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = 2500;
      filter.Q.value = 1.2;
      filter.gain.value = speechClarity ? 7 : 0;

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      audioCtxRef.current = ctx;
      gainNodeRef.current = gain;
      vocalFilterRef.current = filter;
      gain.gain.value = volume;
    } catch (e) {
      // AudioContext could be blocked by browser policy until gesture
    }
  };

  const toggleSpeechClarity = () => {
    ensureAudioCtx();
    const next = !speechClarity;
    setSpeechClarity(next);
    if (vocalFilterRef.current) {
      vocalFilterRef.current.gain.value = next ? 7 : 0;
    }
    showAudioNotification(next ? '🎙️ Dialogue Clarity: ON' : '🎙️ Dialogue Clarity: OFF');
  };

  // Audio track handler
  const handleAudioTrackChange = useCallback((trackId) => {
    if (trackId < 0) return;
    setSelectedAudioTrack(trackId);
    if (hlsRef.current) {
      hlsRef.current.audioTrack = trackId;
    } else if (videoRef.current?.audioTracks) {
      Array.from(videoRef.current.audioTracks).forEach((t, idx) => {
        t.enabled = (idx === trackId);
      });
    }
    const track = audioTracks.find(t => (t.id ?? -1) === trackId) || audioTracks[trackId];
    if (track) {
      showAudioNotification(`Audio: ${getTrackLabel(track, trackId)}`);
    }
  }, [audioTracks]);

  // Load HLS Stream
  const loadStream = useCallback(() => {
    if (!channel?.url) return;
    setIsLoading(true);
    setHasError(false);
    setErrorMsg('');
    setStreamHealth('checking');
    setHlsLevels([]);
    setSelectedLevel(-1);
    setAudioTracks([]);
    setSelectedAudioTrack(-1);
    setShowAudioModal(false);
    setAudioToast(null);
    triggerOSD();

    networkRetriesRef.current = 0;
    triedProxyRef.current = false;

    const video = videoRef.current;
    if (!video) return;

    const streamUrl = corsProxy
      ? `https://api.allorigins.win/raw?url=${encodeURIComponent(channel.url)}`
      : channel.url;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const updateAudioTracksFromHls = (hlsInstance) => {
      if (!hlsInstance) return;
      const tracks = hlsInstance.audioTracks || [];
      if (tracks.length > 0) {
        setAudioTracks([...tracks]);
        setSelectedAudioTrack(hlsInstance.audioTrack >= 0 ? hlsInstance.audioTrack : 0);
      }
    };

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        fragLoadingTimeOut: 15000,
        manifestLoadingTimeOut: 15000
      });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsLoading(false);
        setStreamHealth('online');
        setHlsLevels(data.levels || []);
        updateAudioTracksFromHls(hls);
        video.play().then(() => {
          setIsPlaying(true);
          analytics.channelPlay(channel);
        }).catch(() => {
          setIsPlaying(false);
        });
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => {
        if (data.audioTracks && data.audioTracks.length > 0) {
          setAudioTracks([...data.audioTracks]);
          setSelectedAudioTrack(hls.audioTrack >= 0 ? hls.audioTrack : 0);
        }
      });

      hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_, data) => {
        setSelectedAudioTrack(data.id);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            networkRetriesRef.current += 1;
            if (networkRetriesRef.current <= 1) {
              setErrorMsg('Connection buffering, retrying...');
              hls.startLoad();
            } else if (!triedProxyRef.current && !corsProxy) {
              triedProxyRef.current = true;
              setErrorMsg('Direct stream restricted, trying CORS proxy fallback...');
              const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(channel.url)}`;
              hls.loadSource(proxyUrl);
              hls.startLoad();
            } else {
              setHasError(true);
              setStreamHealth('offline');
              setErrorMsg('Stream unreachable or restricted. Please select another channel or browse categories.');
              setIsLoading(false);
              hls.destroy();
            }
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            setHasError(true);
            setStreamHealth('offline');
            setErrorMsg('Unable to play this channel format.');
            analytics.channelError(channel, data.details || 'HLS Fatal Error');
            setIsLoading(false);
            hls.destroy();
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        setStreamHealth('online');
        video.play().then(() => {
          setIsPlaying(true);
          analytics.channelPlay(channel);
        }).catch(() => {});
      });
      video.addEventListener('error', () => {
        setHasError(true);
        setStreamHealth('offline');
        setErrorMsg('Stream format not supported in this browser.');
        setIsLoading(false);
        analytics.channelError(channel, 'HTML5 Video Error');
      });
    } else {
      setHasError(true);
      setStreamHealth('offline');
      setErrorMsg('HLS playback is not supported in this browser.');
      setIsLoading(false);
    }
  }, [channel, corsProxy]);

  useEffect(() => {
    loadStream();
    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [loadStream]);

  // Channel switching (Prev / Next)
  const currentIndex = allChannels.findIndex(
    c => c.id === channel?.id || c.url === channel?.url
  );

  const handlePrevChannel = useCallback(() => {
    if (allChannels.length === 0) return;
    const prevIdx = (currentIndex - 1 + allChannels.length) % allChannels.length;
    onSelectChannel(allChannels[prevIdx]);
  }, [allChannels, currentIndex, onSelectChannel]);

  const handleNextChannel = useCallback(() => {
    if (allChannels.length === 0) return;
    const nextIdx = (currentIndex + 1) % allChannels.length;
    onSelectChannel(allChannels[nextIdx]);
  }, [allChannels, currentIndex, onSelectChannel]);

  // Mobile touch and tap handling (Clean & Safe: NEVER switch channels on screen touch)
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  };

  const handleTouchEnd = (e) => {
    // Never switch channels on touch or swipe. Delegate to tap handler.
    handlePlayerTap(e);
  };

  // Screen Tap / Click Handler - toggles controls or fullscreen, NEVER switches channels
  const handlePlayerTap = (e) => {
    // If interacting with interactive controls or overlay buttons, ignore
    if (
      e.target.closest('button') ||
      e.target.closest('select') ||
      e.target.closest('input') ||
      e.target.closest('.audio-track-popover') ||
      e.target.closest('.player-top-bar') ||
      e.target.closest('.player-bottom-controls') ||
      e.target.closest('.player-center-play-btn')
    ) {
      return;
    }

    const now = Date.now();
    // Guard against duplicate synthetic clicks fired right after touchEnd
    if (e.type === 'click' && now - touchStartRef.current.time < 500 && touchStartRef.current.time > 0) {
      return;
    }

    // Double tap within 300ms toggles fullscreen (YouTube style), NEVER changes channel
    if (now - lastTapRef.current.time < 300) {
      clearTimeout(singleTapTimerRef.current);
      lastTapRef.current = { time: 0, x: 0, y: 0 };
      toggleFullscreen();
      return;
    }

    const touch = e.changedTouches ? e.changedTouches[0] : e;
    lastTapRef.current = { time: now, x: touch.clientX, y: touch.clientY };

    // Single tap: toggle controls overlay
    clearTimeout(singleTapTimerRef.current);
    singleTapTimerRef.current = setTimeout(() => {
      setControlsVisible(prev => {
        const next = !prev;
        if (next) showControls();
        return next;
      });
    }, 280);
  };

  // Keyboard navigation & Escape key handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return;

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          e.preventDefault();
          toggleFullscreen();
        }
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrevChannel();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNextChannel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!isPlaying) togglePlay();
      } else if (e.key === '/' && onOpenSearch) {
        e.preventDefault();
        onOpenSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isFullscreen, handlePrevChannel, handleNextChannel, onOpenSearch]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    ensureAudioCtx();
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleVolumeChange = (val) => {
    const v = typeof val === 'number' ? val : parseFloat(val.target.value);
    setVolume(v);
    ensureAudioCtx();
    if (videoRef.current) {
      videoRef.current.volume = Math.min(v, 1);
      setIsMuted(v === 0);
    }
    if (gainNodeRef.current) gainNodeRef.current.gain.value = v;
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    ensureAudioCtx();
    const next = !isMuted;
    setIsMuted(next);
    videoRef.current.muted = next;
    if (gainNodeRef.current) gainNodeRef.current.gain.value = next ? 0 : volume;
  };

  // Robust cross-platform Fullscreen / Maximize toggle (supports iOS Safari, Android, Desktop, & YouTube-style Landscape Rotation)
  const toggleFullscreen = useCallback(async () => {
    const isCurrentlyFs = Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement ||
      videoRef.current?.webkitDisplayingFullscreen ||
      isFullscreen
    );

    if (isCurrentlyFs) {
      // Exit fullscreen
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          await document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        }
      } catch (err) {
        // Ignored if already exiting
      }

      // Exit iOS Safari video fullscreen if active
      if (videoRef.current?.webkitDisplayingFullscreen && videoRef.current.webkitExitFullscreen) {
        try {
          videoRef.current.webkitExitFullscreen();
        } catch (e) {}
      }

      // Unlock screen orientation
      if (window.screen?.orientation?.unlock) {
        try {
          window.screen.orientation.unlock();
        } catch (e) {}
      }

      setIsLandscapeMode(false);
      setIsFullscreen(false);
      analytics.fullscreenToggled(false);
    } else {
      // Enter Fullscreen & Rotate
      let enteredNative = false;
      const container = containerRef.current;
      const video = videoRef.current;

      // 1. Try standard container requestFullscreen
      if (container?.requestFullscreen) {
        try {
          await container.requestFullscreen({ navigationUI: 'hide' });
          enteredNative = true;
        } catch (err) {
          console.warn('Standard requestFullscreen failed:', err);
        }
      }

      // 2. Try WebKit container requestFullscreen (Desktop Safari, older Android)
      if (!enteredNative && container?.webkitRequestFullscreen) {
        try {
          container.webkitRequestFullscreen();
          enteredNative = true;
        } catch (err) {
          console.warn('webkitRequestFullscreen failed:', err);
        }
      }

      // 3. Try Screen Orientation Lock to landscape (works in Android Chrome / PWA)
      if (window.screen?.orientation && typeof window.screen.orientation.lock === 'function') {
        try {
          await window.screen.orientation.lock('landscape');
        } catch (e1) {
          try {
            await window.screen.orientation.lock('landscape-primary');
          } catch (e2) {}
        }
      }

      // 4. On mobile/touch screens in portrait: activate YouTube-style CSS 90-degree landscape rotation!
      const isPortrait = (typeof window.matchMedia === 'function' && window.matchMedia('(orientation: portrait)').matches) || (window.innerHeight > window.innerWidth);
      const isMobile = window.innerWidth <= 900 || ('ontouchstart' in window) || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);

      if (isMobile && isPortrait) {
        setIsLandscapeMode(true);
      } else {
        setIsLandscapeMode(false);
      }

      // 5. In all cases, activate CSS maximize (.player-wrap.is-fullscreen)
      setIsFullscreen(true);
      analytics.fullscreenToggled(true);
      triggerOSD();
    }
  }, [isFullscreen]);

  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        analytics.pipToggled(false);
      } else {
        await videoRef.current?.requestPictureInPicture();
        analytics.pipToggled(true);
      }
    } catch (e) {
      console.error('PiP error:', e);
    }
  };

  const copyUrl = () => {
    if (!channel) return;
    navigator.clipboard.writeText(channel.url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = () => {
    if (!channel) return;
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `${channel.name} - StreamHub IPTV`,
        text: `Watch ${channel.name} live on StreamHub IPTV!`,
        url: shareUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      setSharedToast(true);
      setTimeout(() => setSharedToast(false), 2000);
    }
  };

  const cycleAspect = () => {
    const modes = ['contain', 'cover', 'fill'];
    setAspectRatio(modes[(modes.indexOf(aspectRatio) + 1) % modes.length]);
  };

  // Recommended Channels: Same language or category, excluding current
  const recommendedChannels = useMemo(() => {
    if (!channel || allChannels.length === 0) return [];
    return allChannels
      .filter(c => c.id !== channel.id && c.url !== channel.url)
      .filter(c => (c.language === channel.language || c.group === channel.group))
      .slice(0, 6);
  }, [channel, allChannels]);

  // EPG details for current channel
  const { current: currentProg, next: nextProg } = getCurrentAndNextProgram(channel);
  const channelNum = channel?.channelNumber ? String(channel.channelNumber).padStart(3, '0') : null;

  const volPct = Math.round((isMuted ? 0 : volume) * 100);
  const volSliderStyle = { '--val': `${Math.min(volPct, 100)}%` };

  if (!channel) {
    return (
      <div className="player-wrap">
        <div className="player-empty">
          <div className="player-empty-icon-wrap">
            <Tv size={36} color="var(--accent)" />
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>
              Select a Channel
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 380, margin: '0 auto 16px' }}>
              Pick any channel from the live directory to start ultra-fast streaming
            </p>
            {onBrowseChannels && (
              <button onClick={onBrowseChannels} className="btn-primary" style={{ margin: '0 auto' }}>
                <Film size={16} />
                <span>Browse All Channels</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="player-page-layout">
      {/* LEFT COLUMN: Main Video Player */}
      <div className="player-main-column">
        <div
          ref={containerRef}
          className={`player-wrap ${isFullscreen ? 'is-fullscreen' : ''} ${isLandscapeMode ? 'is-rotated-landscape' : ''}`}
          onMouseMove={showControls}
          onMouseLeave={() => isPlaying && setControlsVisible(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={handlePlayerTap}
          style={{ cursor: controlsVisible ? 'default' : 'none' }}
        >
          {/* Native Video Element */}
          <video
            ref={videoRef}
            className="player-video"
            style={{ objectFit: aspectRatio }}
            playsInline
            webkit-playsinline="true"
          />

          {/* Center Play/Pause Overlay Indicator (Tap friendly on Mobile) */}
          <div
            className={`player-center-overlay ${controlsVisible || !isPlaying ? 'visible' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
          >
            <button
              className="player-center-play-btn"
              aria-label={isPlaying ? 'Pause' : 'Play'}
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
            >
              {isPlaying ? <Pause size={30} fill="#fff" /> : <Play size={30} fill="#fff" style={{ marginLeft: 3 }} />}
            </button>
          </div>

          {/* Fullscreen TV Mode Clean OSD Banner (Fades out automatically) */}
          <div className={`player-osd-banner ${showOSD ? 'visible' : ''}`}>
            <div className="osd-content">
              {channelNum && <span className="ch-num-pill">CH {channelNum}</span>}
              <span className="osd-channel-name">{channel.name}</span>
              <span className="live-pill-inline">
                <span className="live-dot" /> LIVE
              </span>
              <span className="badge badge-hd">{channel.quality || 'HD'}</span>
              <span className="osd-program-title">{currentProg.title}</span>
            </div>
          </div>

          {/* Audio Notification HUD Toast */}
          {audioToast && (
            <div className="audio-toast">
              <Languages size={15} color="var(--accent-light)" />
              <span>{audioToast}</span>
            </div>
          )}

          {/* Top Control Bar Overlay */}
          <div className="player-top-bar" style={{ opacity: controlsVisible ? 1 : 0, pointerEvents: controlsVisible ? 'auto' : 'none' }}>
            <div className="player-channel-info">
              {channel.logo ? (
                <div className="player-channel-logo">
                  <img src={channel.logo} alt={channel.name} referrerPolicy="no-referrer" onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
              ) : (
                <div className="player-channel-logo">
                  <Tv size={20} color="rgba(255,255,255,0.6)" />
                </div>
              )}
              <div className="player-channel-text">
                <div className="player-channel-title-row">
                  {channelNum && <span className="ch-num-pill">CH {channelNum}</span>}
                  <span className="player-channel-name" title={channel.name}>{channel.name}</span>
                </div>
                <div className="player-channel-group">
                  <span>{channel.group || 'Live TV'}</span>
                  {channel.language && <span> • {channel.language}</span>}
                </div>
              </div>

              {/* Live Status indicator */}
              <span className={`player-status-pill ${streamHealth}`}>
                <span className="live-dot" />
                <span>{streamHealth === 'online' ? 'LIVE' : streamHealth === 'checking' ? 'CHECKING' : 'OFFLINE'}</span>
              </span>

              <span className={`badge badge-${(channel.quality || 'sd').toLowerCase()} player-badge`}>
                {channel.quality || 'HD'}
              </span>
            </div>

            <div className="player-top-actions">
              {onOpenChannels && (
                <button onClick={onOpenChannels} className="ctrl-btn" title="Channels Drawer">
                  <Menu size={15} />
                </button>
              )}
              <button
                onClick={() => onToggleFavorite(channel)}
                className="ctrl-btn"
                style={{
                  borderColor: isFavorite ? 'rgba(245,158,11,0.5)' : undefined,
                  background: isFavorite ? 'rgba(245,158,11,0.15)' : undefined
                }}
                title={isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
              >
                <Star size={15} fill={isFavorite ? '#F59E0B' : 'none'} color={isFavorite ? '#F59E0B' : undefined} />
              </button>
              <button onClick={handleShare} className="ctrl-btn" title="Share Channel">
                {sharedToast ? <Check size={15} color="var(--accent-light)" /> : <Share2 size={15} />}
              </button>
              <button onClick={copyUrl} className="ctrl-btn desk-only-btn" title="Copy Stream URL">
                {copiedLink ? <Check size={15} color="var(--accent-light)" /> : <Copy size={15} />}
              </button>
              <a href={channel.url} target="_blank" rel="noopener noreferrer" className="ctrl-btn desk-only-btn" title="Open Stream Externally">
                <ExternalLink size={15} />
              </a>

              {/* Quick Screen Rotate Button in Top Bar when in Fullscreen */}
              {isFullscreen && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLandscapeMode(prev => !prev);
                  }}
                  className={`ctrl-btn rotate-btn ${isLandscapeMode ? 'active-gold' : ''}`}
                  title={isLandscapeMode ? "Rotate to Portrait" : "Rotate to Landscape"}
                  aria-label="Rotate Screen"
                >
                  <RotateCw size={15} />
                </button>
              )}

              {/* Quick Top Corner Maximize/Minimize Button */}
              <button
                onClick={toggleFullscreen}
                className={`ctrl-btn top-max-btn ${isFullscreen ? 'active-gold' : ''}`}
                title={isFullscreen ? "Exit Fullscreen (F)" : "Maximize Screen (F)"}
                aria-label={isFullscreen ? "Exit Fullscreen" : "Maximize Screen"}
              >
                {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
              </button>
            </div>
          </div>

          {/* Loading Indicator */}
          {isLoading && !hasError && (
            <div className="player-loading">
              <div className="spin" style={{
                width: 46, height: 46,
                border: '3px solid rgba(255,255,255,0.12)',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%'
              }} />
              <span style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>
                Connecting to {channel.name}…
              </span>
            </div>
          )}

          {/* Automatic Stream Error Handling (Requirement 13) */}
          {hasError && (
            <div className="player-error">
              <AlertTriangle size={46} color="#f43f5e" />
              <div>
                <h3 style={{ fontSize: 18, color: '#fff', marginBottom: 6 }}>Unable to play {channel.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: 440, margin: '0 auto' }}>
                  {errorMsg || 'The broadcast server is temporarily unreachable or geo-restricted.'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button onClick={loadStream} className="btn-primary">
                  <RotateCcw size={15} />
                  <span>Retry Stream</span>
                </button>
                <button onClick={handleNextChannel} className="btn-primary" style={{ background: 'var(--gradient-accent)' }}>
                  <Play size={15} fill="#fff" />
                  <span>Play Next Channel</span>
                </button>
                <button
                  onClick={() => setCorsProxy(!corsProxy)}
                  className="btn-secondary"
                  title="Toggle CORS Proxy"
                >
                  <ShieldAlert size={15} />
                  <span>{corsProxy ? 'Disable Proxy' : 'Enable CORS Proxy'}</span>
                </button>
                {onBrowseChannels && (
                  <button onClick={() => onBrowseChannels(activeCategory)} className="btn-secondary">
                    <Tv size={15} />
                    <span>Browse {activeCategory !== 'All' ? activeCategory : ''} Channels</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Bottom Player Controls Bar - Responsive Two-Tier Layout */}
          <div className="player-controls" style={{ opacity: controlsVisible ? 1 : 0, pointerEvents: controlsVisible ? 'auto' : 'none' }}>
            {/* Primary Row: Playback Controls & Prominent Maximize Button */}
            <div className="controls-row controls-row-primary">
              {/* Play / Pause */}
              <button className="play-btn" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'} title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}>
                {isPlaying
                  ? <Pause size={18} fill="#111" color="#111" />
                  : <Play size={18} fill="#111" color="#111" style={{ marginLeft: 2 }} />}
              </button>

              {/* Previous / Next Channel Buttons */}
              <div className="ch-nav-buttons-group">
                <button onClick={handlePrevChannel} className="ctrl-btn prev-ch-btn" title="Previous Channel (↑)">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={handleNextChannel} className="ctrl-btn next-ch-btn" title="Next Channel (↓)">
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* LIVE Badge */}
              <div className="live-badge">
                <span className="live-dot" />
                <span className="live-label">LIVE</span>
              </div>

              {/* Volume & Boost */}
              <div className="volume-group">
                <button onClick={toggleMute} className="ctrl-btn vol-btn" aria-label="Mute / Unmute" title={isMuted ? "Unmute (M)" : "Mute (M)"}>
                  {isMuted || volume === 0
                    ? <VolumeX size={16} color="rgba(255,255,255,0.85)" />
                    : volume < 0.5
                      ? <Volume1 size={16} color="rgba(255,255,255,0.85)" />
                      : <Volume2 size={16} color={volume > 1 ? '#f43f5e' : 'rgba(255,255,255,0.85)'} />}
                </button>

                <input
                  type="range"
                  className="vol-slider"
                  min="0" max="4" step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  style={volSliderStyle}
                  title="Volume (up to 400% boost)"
                  aria-label="Volume Slider"
                />

                <span className="vol-pct">{volPct}%{volume > 1 ? ' 🔥' : ''}</span>

                <div className="boost-pills">
                  {[1, 2, 3, 4].map(b => (
                    <button
                      key={b}
                      className={`boost-pill ${volume === b ? 'active' : ''}`}
                      onClick={() => handleVolumeChange(b)}
                      title={`${b * 100}% volume`}
                    >
                      {b * 100}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="spacer" />

              {/* Screen Rotate Button when in Fullscreen (YouTube style) */}
              {isFullscreen && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLandscapeMode(prev => !prev);
                  }}
                  className={`ctrl-btn rotate-btn ${isLandscapeMode ? 'active-gold' : ''}`}
                  title={isLandscapeMode ? "Rotate to Portrait" : "Rotate to Landscape"}
                  aria-label="Rotate Screen"
                >
                  <RotateCw size={15} />
                  <span className="rotate-btn-text">{isLandscapeMode ? "Portrait" : "Rotate"}</span>
                </button>
              )}

              {/* Prominent Maximize / Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className={`ctrl-btn fullscreen-btn ${isFullscreen ? 'active-fullscreen' : ''}`}
                title={isFullscreen ? "Exit Fullscreen (F)" : "Maximize Screen (F)"}
                aria-label={isFullscreen ? "Exit Fullscreen" : "Maximize Screen"}
              >
                {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
                <span className="fullscreen-btn-text">{isFullscreen ? 'Minimize' : 'Maximize'}</span>
              </button>
            </div>

            {/* Secondary Row: Stream Features (Quality, Multi-Audio, Clarity, Aspect Ratio, PiP) */}
            <div className="controls-row controls-row-secondary">
              {/* Quality / Resolution Picker */}
              {hlsLevels.length > 0 && (
                <div className="ctrl-feature-item">
                  <select
                    className="ctrl-select player-quality-select"
                    value={selectedLevel}
                    onChange={e => {
                      const lv = parseInt(e.target.value);
                      setSelectedLevel(lv);
                      if (hlsRef.current) hlsRef.current.currentLevel = lv;
                    }}
                    title="Stream Resolution"
                  >
                    <option value={-1}>Auto Quality</option>
                    {hlsLevels.map((lv, i) => (
                      <option key={i} value={i}>{lv.height ? `${lv.height}p` : `Level ${i + 1}`}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Multi-Audio Track / Language Selector */}
              {audioTracks.length > 0 && (
                <div className="ctrl-feature-item audio-track-container">
                  <button
                    onClick={() => setShowAudioModal(prev => !prev)}
                    className={`ctrl-btn audio-track-toggle-btn ${showAudioModal ? 'active-gold' : ''}`}
                    title="Audio Track / Language"
                  >
                    <Languages size={15} />
                    <span className="ctrl-feature-label">
                      {audioTracks[selectedAudioTrack] ? getTrackLabel(audioTracks[selectedAudioTrack], selectedAudioTrack) : 'Audio'}
                    </span>
                    <ChevronDown size={12} />
                  </button>

                  {showAudioModal && (
                    <div className="audio-track-popover">
                      <div className="audio-popover-header">
                        <Languages size={14} color="var(--accent-light)" />
                        <span>Select Audio Track</span>
                        <button onClick={() => setShowAudioModal(false)} className="audio-popover-close">
                          <X size={14} />
                        </button>
                      </div>
                      <div className="audio-popover-list">
                        {audioTracks.map((tr, idx) => {
                          const isSelected = selectedAudioTrack === (tr.id ?? idx) || (selectedAudioTrack === -1 && idx === 0);
                          return (
                            <button
                              key={tr.id ?? idx}
                              className={`audio-track-item ${isSelected ? 'active' : ''}`}
                              onClick={() => {
                                handleAudioTrackChange(tr.id ?? idx);
                                setShowAudioModal(false);
                              }}
                            >
                              <span>{getTrackLabel(tr, idx)}</span>
                              {isSelected && <Check size={14} color="var(--accent-light)" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Dialogue Clarity Boost */}
              <button
                onClick={toggleSpeechClarity}
                className={`ctrl-btn ${speechClarity ? 'active-gold' : ''}`}
                title="Dialogue Clarity (Boost Vocal Audio)"
              >
                <Zap size={15} />
                <span className="ctrl-feature-label">Clarity</span>
              </button>

              {/* Aspect Ratio */}
              <button onClick={cycleAspect} className="ctrl-btn aspect-btn" title={`Aspect Ratio: ${aspectRatio}`}>
                <Monitor size={15} />
                <span className="ctrl-feature-label">{aspectRatio.toUpperCase()}</span>
              </button>

              {/* PiP */}
              {isPipSupported && (
                <button onClick={togglePiP} className="ctrl-btn" title="Picture-in-Picture">
                  <PictureInPicture2 size={15} />
                </button>
              )}

              {/* Reload Stream */}
              <button onClick={loadStream} className="ctrl-btn" title="Reload Stream">
                <RotateCcw size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Channel Details Sidebar & "You May Also Like" */}
      <div className="player-info-sidebar">
        {/* Channel Header Banner */}
        <div className="sidebar-section-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 12 }}>
            <div className="sidebar-channel-logo">
              {channel.logo ? (
                <img src={channel.logo} alt={channel.name} referrerPolicy="no-referrer" />
              ) : (
                <Tv size={28} color="var(--accent-light)" />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {channelNum && <span className="ch-num-pill">CH {channelNum}</span>}
                <h3 className="sidebar-channel-name">{channel.name}</h3>
              </div>
              <div className="sidebar-channel-meta">
                <span className="live-pill-inline">
                  <span className="live-dot" /> LIVE
                </span>
                <span>• {channel.language}</span>
                <span>• {channel.group || 'Live TV'}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="sidebar-action-bar">
            <button
              onClick={() => onToggleFavorite(channel)}
              className={`sidebar-btn ${isFavorite ? 'active' : ''}`}
            >
              <Star size={15} fill={isFavorite ? '#F59E0B' : 'none'} color={isFavorite ? '#F59E0B' : 'currentColor'} />
              <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
            </button>

            <button onClick={handleShare} className="sidebar-btn">
              <Share2 size={15} />
              <span>Share</span>
            </button>

            {onOpenDetails && (
              <button onClick={() => onOpenDetails(channel)} className="sidebar-btn">
                <Clock size={15} />
                <span>Details</span>
              </button>
            )}
          </div>
        </div>

        {/* EPG Now Playing Section (Requirement 14 & 15) */}
        <div className="sidebar-section-box">
          <div className="sidebar-box-title">
            <Clock size={14} color="var(--accent-light)" />
            <span>ELECTRONIC PROGRAM GUIDE</span>
          </div>

          <div className="sidebar-epg-current">
            <div className="epg-badge-label">NOW BROADCASTING</div>
            <div className="epg-show-title">{currentProg.title}</div>
            <div className="epg-show-time">{currentProg.time}</div>
            <div className="hero-progress-track" style={{ marginTop: 8 }}>
              <div className="hero-progress-fill" style={{ width: `${currentProg.progress || 50}%` }} />
            </div>
          </div>

          {nextProg && (
            <div className="sidebar-epg-next" style={{ marginTop: 12 }}>
              <div className="epg-badge-label">UP NEXT</div>
              <div className="epg-show-title">{nextProg.title}</div>
              <div className="epg-show-time">{nextProg.time}</div>
            </div>
          )}
        </div>

        {/* Quick Prev / Next Channel Buttons */}
        <div className="sidebar-section-box">
          <div className="sidebar-box-title">
            <Tv size={14} color="var(--accent-light)" />
            <span>CHANNEL SWITCHING</span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handlePrevChannel} className="btn-secondary" style={{ flex: 1, padding: '8px 12px', fontSize: 13 }}>
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>
            <button onClick={handleNextChannel} className="btn-secondary" style={{ flex: 1, padding: '8px 12px', fontSize: 13 }}>
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Category Switcher & Channel Rail while playing */}
        <div className="sidebar-section-box">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div className="sidebar-box-title" style={{ margin: 0 }}>
              <Film size={14} color="var(--accent-light)" />
              <span>EXPLORE CATEGORIES</span>
            </div>
            {onBrowseChannels && (
              <button
                onClick={() => onBrowseChannels(activeCategory)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-light)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3
                }}
              >
                Full Grid <ExternalLink size={11} />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="sidebar-cat-pills-scroll" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, scrollbarWidth: 'none' }}>
            {CATEGORIES_TABS.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  if (onCategorySwitch) onCategorySwitch(cat);
                }}
                className={`sidebar-cat-pill ${activeCategory === cat ? 'active' : ''}`}
                style={{
                  padding: '4px 10px',
                  borderRadius: 16,
                  fontSize: 11,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  border: '1px solid',
                  borderColor: activeCategory === cat ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                  background: activeCategory === cat ? 'var(--accent)' : 'rgba(255,255,255,0.04)',
                  color: activeCategory === cat ? '#000' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Filtered Channel Quick List */}
          <div className="sidebar-channel-quick-list" style={{ maxHeight: '250px', overflowY: 'auto', marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {categoryChannels.map(ch => {
              const isCurrent = channel?.id === ch.id || channel?.url === ch.url;
              return (
                <div
                  key={ch.id || ch.url}
                  onClick={() => onSelectChannel(ch)}
                  className={`sidebar-rec-item ${isCurrent ? 'active-playing-item' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '6px 10px',
                    borderRadius: 8,
                    background: isCurrent ? 'rgba(255, 107, 0, 0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isCurrent ? 'var(--accent)' : 'transparent'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div className="rec-logo-wrap" style={{ width: 28, height: 28, borderRadius: 6, overflow: 'hidden', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {ch.logo ? (
                      <img src={ch.logo} alt="" loading="lazy" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
                    ) : (
                      <Tv size={14} color="var(--accent-light)" />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: isCurrent ? 'var(--accent-light)' : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ch.name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {ch.group || ch.language} • {ch.quality || 'HD'}
                    </div>
                  </div>
                  {isCurrent ? (
                    <span className="live-dot" style={{ width: 6, height: 6 }} />
                  ) : (
                    <Play size={12} color="var(--text-muted)" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommended Channels: "You May Also Like" (Requirement 16) */}
        {recommendedChannels.length > 0 && (
          <div className="sidebar-section-box">
            <div className="sidebar-box-title">
              <Sparkles size={14} color="var(--accent-light)" />
              <span>YOU MAY ALSO LIKE</span>
            </div>

            <div className="sidebar-recommended-list">
              {recommendedChannels.map(rec => (
                <div
                  key={rec.id || rec.url}
                  className="sidebar-rec-item"
                  onClick={() => onSelectChannel(rec)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="rec-logo-wrap">
                    {rec.logo ? (
                      <img src={rec.logo} alt="" loading="lazy" referrerPolicy="no-referrer" />
                    ) : (
                      <Tv size={16} color="var(--accent-light)" />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="rec-name">{rec.name}</div>
                    <div className="rec-meta">{rec.language} • {rec.group}</div>
                  </div>
                  <Play size={13} fill="var(--accent-light)" color="var(--accent-light)" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
