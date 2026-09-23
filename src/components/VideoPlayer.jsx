import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Hls from 'hls.js';
import {
  Play, Pause, Volume2, VolumeX, Volume1, Maximize, PictureInPicture2,
  AlertTriangle, ExternalLink, Copy, Star, Tv, ShieldAlert, Monitor,
  ChevronDown, Check, Languages, X
} from 'lucide-react';

const ISO_LANG_MAP = {
  tel: 'Telugu',
  te: 'Telugu',
  hin: 'Hindi',
  hi: 'Hindi',
  tam: 'Tamil',
  ta: 'Tamil',
  kan: 'Kannada',
  kn: 'Kannada',
  mal: 'Malayalam',
  ml: 'Malayalam',
  ben: 'Bengali',
  bn: 'Bengali',
  mar: 'Marathi',
  mr: 'Marathi',
  guj: 'Gujarati',
  gu: 'Gujarati',
  pan: 'Punjabi',
  pa: 'Punjabi',
  urd: 'Urdu',
  ur: 'Urdu',
  ori: 'Odia',
  or: 'Odia',
  eng: 'English',
  en: 'English',
  spa: 'Spanish',
  es: 'Spanish',
  fra: 'French',
  fr: 'French',
  deu: 'German',
  de: 'German',
  ita: 'Italian',
  it: 'Italian',
  por: 'Portuguese',
  pt: 'Portuguese',
  rus: 'Russian',
  ru: 'Russian',
  ara: 'Arabic',
  ar: 'Arabic',
  kor: 'Korean',
  ko: 'Korean',
  jpn: 'Japanese',
  ja: 'Japanese',
  zho: 'Chinese',
  zh: 'Chinese',
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

export default function VideoPlayer({
  channel,
  onToggleFavorite,
  isFavorite,
  corsProxy,
  setCorsProxy,
}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const containerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const gainNodeRef = useRef(null);
  const vocalFilterRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(true);
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
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef(null);

  const showControls = () => {
    setControlsVisible(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3500);
  };

  useEffect(() => {
    return () => {
      clearTimeout(hideTimerRef.current);
      clearTimeout(audioToastTimerRef.current);
    };
  }, []);

  const showAudioNotification = (label) => {
    setAudioToast(label);
    clearTimeout(audioToastTimerRef.current);
    audioToastTimerRef.current = setTimeout(() => setAudioToast(null), 2200);
  };

  // Ensure Web Audio API boost context & dialogue clarity filter
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
      console.warn('AudioContext error:', e);
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

  // Switch Audio Track
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

  // Load HLS stream
  useEffect(() => {
    if (!channel?.url) return;
    setIsLoading(true);
    setHasError(false);
    setErrorMsg('');
    setHlsLevels([]);
    setSelectedLevel(-1);
    setAudioTracks([]);
    setSelectedAudioTrack(-1);
    setShowAudioModal(false);
    setAudioToast(null);

    const video = videoRef.current;
    if (!video) return;

    const streamUrl = corsProxy
      ? `https://api.allorigins.win/raw?url=${encodeURIComponent(channel.url)}`
      : channel.url;

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    const updateAudioTracksFromHls = (hlsInstance) => {
      if (!hlsInstance) return;
      const tracks = hlsInstance.audioTracks || [];
      if (tracks.length > 0) {
        setAudioTracks([...tracks]);
        setSelectedAudioTrack(hlsInstance.audioTrack >= 0 ? hlsInstance.audioTrack : 0);
      }
    };

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 90 });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_LOADED, () => {
        updateAudioTracksFromHls(hls);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsLoading(false);
        setHlsLevels(data.levels || []);
        updateAudioTracksFromHls(hls);
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => {
        if (data.audioTracks && data.audioTracks.length > 0) {
          setAudioTracks([...data.audioTracks]);
          setSelectedAudioTrack(hls.audioTrack >= 0 ? hls.audioTrack : 0);
        } else {
          updateAudioTracksFromHls(hls);
        }
      });

      hls.on(Hls.Events.LEVEL_LOADED, () => {
        updateAudioTracksFromHls(hls);
      });

      hls.on(Hls.Events.AUDIO_TRACK_LOADED, () => {
        updateAudioTracksFromHls(hls);
      });

      hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_, data) => {
        setSelectedAudioTrack(data.id);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            setErrorMsg('Network error — stream may be geo-blocked or offline.');
            hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            setHasError(true);
            setErrorMsg('Stream could not be loaded. Try enabling CORS Proxy or open externally.');
            hls.destroy();
          }
          setIsLoading(false);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        if (video.audioTracks && video.audioTracks.length > 0) {
          const list = Array.from(video.audioTracks).map((t, idx) => ({
            id: idx,
            name: t.label || t.language || `Track ${idx + 1}`,
            lang: t.language,
            enabled: t.enabled
          }));
          setAudioTracks(list);
          const active = list.findIndex(t => t.enabled);
          setSelectedAudioTrack(active >= 0 ? active : 0);
        }
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      });
      video.addEventListener('error', () => {
        setHasError(true);
        setErrorMsg('Stream format not supported in this browser.');
        setIsLoading(false);
      });
    } else {
      setHasError(true);
      setErrorMsg('HLS not supported in this browser.');
      setIsLoading(false);
    }

    const handlePlaying = () => {
      if (hlsRef.current) updateAudioTracksFromHls(hlsRef.current);
    };
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('playing', handlePlaying);
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [channel, corsProxy]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    ensureAudioCtx();
    if (isPlaying) { videoRef.current.pause(); setIsPlaying(false); }
    else { videoRef.current.play().then(() => setIsPlaying(true)).catch(console.error); }
  };

  const handleVolumeChange = (val) => {
    const v = typeof val === 'number' ? val : parseFloat(val.target.value);
    setVolume(v);
    ensureAudioCtx();
    if (videoRef.current) { videoRef.current.volume = Math.min(v, 1); setIsMuted(v === 0); }
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await videoRef.current?.requestPictureInPicture();
    } catch (e) { console.error(e); }
  };

  const copyUrl = () => {
    if (!channel) return;
    navigator.clipboard.writeText(channel.url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const cycleAspect = () => {
    const modes = ['contain', 'cover', 'fill'];
    setAspectRatio(modes[(modes.indexOf(aspectRatio) + 1) % modes.length]);
  };

  // Keyboard shortcut listener for VideoPlayer actions
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
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'a' || e.key === 'A') {
        if (audioTracks.length > 1) {
          e.preventDefault();
          const curIdx = selectedAudioTrack >= 0 ? selectedAudioTrack : 0;
          const nextIdx = (curIdx + 1) % audioTracks.length;
          handleAudioTrackChange(nextIdx);
        } else {
          setShowAudioModal(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [audioTracks, selectedAudioTrack, isPlaying, isMuted, volume, handleAudioTrackChange]);

  const volPct = Math.round((isMuted ? 0 : volume) * 100);
  const volSliderStyle = { '--val': `${Math.min(volPct, 100)}%` };

  // Calculate active audio labels and multi-audio state
  const activeAudioTrack = audioTracks.find(t => (t.id ?? -1) === selectedAudioTrack) || audioTracks[selectedAudioTrack];
  const activeAudioName = activeAudioTrack
    ? getTrackLabel(activeAudioTrack, selectedAudioTrack)
    : (channel?.languages && channel.languages.length > 0 ? channel.languages[0] : (channel?.language || 'Default Audio'));
  const hasMultipleAudios = audioTracks.length > 1 || (channel?.languages && channel.languages.length > 1) || channel?.isMultiAudio;

  // Build audio options list strictly focused on Audio Tracks & Languages (NO channel names)
  const audioOptions = useMemo(() => {
    const list = [];
    if (audioTracks.length > 0) {
      audioTracks.forEach((track, idx) => {
        const trackId = track.id ?? idx;
        const isCurrent = (selectedAudioTrack === trackId) || (selectedAudioTrack < 0 && idx === 0);
        list.push({
          id: trackId,
          type: 'hls_track',
          label: getTrackLabel(track, idx),
          desc: track.lang ? `Language code: ${track.lang.toUpperCase()}` : 'Embedded audio track',
          badge: track.default ? 'Default' : undefined,
          selected: isCurrent,
        });
      });
    } else if (channel?.languages && channel.languages.length > 1) {
      channel.languages.forEach((lang, idx) => {
        const isCurrent = selectedAudioTrack === idx || (selectedAudioTrack < 0 && idx === 0);
        list.push({
          id: idx,
          type: 'lang_meta',
          label: `${lang} Audio`,
          desc: `Station audio language: ${lang}`,
          badge: idx === 0 ? 'Primary' : undefined,
          selected: isCurrent,
        });
      });
    } else {
      list.push({
        id: 0,
        type: 'default',
        label: `${activeAudioName}`,
        desc: 'Direct station audio transmission',
        badge: 'Stereo',
        selected: true,
      });
    }
    return list;
  }, [audioTracks, selectedAudioTrack, channel, activeAudioName]);

  const handleSelectAudioOption = (opt) => {
    if (opt.type === 'hls_track') {
      handleAudioTrackChange(opt.id);
    } else {
      setSelectedAudioTrack(opt.id);
      showAudioNotification(`Audio: ${opt.label}`);
    }
    setShowAudioModal(false);
  };

  if (!channel) {
    return (
      <div className="player-wrap">
        <div className="player-empty">
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(249,115,22,0.18), rgba(56,189,248,0.10))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(249,115,22,0.2)'
          }}>
            <Tv size={36} color="rgba(249,115,22,0.65)" />
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Select a Channel</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Browse and pick a channel from the sidebar to start streaming
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="player-wrap"
      onMouseMove={showControls}
      onMouseLeave={() => isPlaying && setControlsVisible(false)}
      style={{ cursor: controlsVisible ? 'default' : 'none' }}
    >
      {/* Video */}
      <video
        ref={videoRef}
        className="player-video"
        onClick={togglePlay}
        style={{ objectFit: aspectRatio }}
      />

      {/* Audio notification HUD */}
      {audioToast && (
        <div className="audio-toast">
          <Languages size={15} color="#FB923C" />
          <span>{audioToast}</span>
        </div>
      )}

      {/* Audio Language Selection Popover */}
      {showAudioModal && (
        <div className="audio-modal-popover" onClick={e => e.stopPropagation()}>
          <div className="audio-modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Languages size={16} color="#FB923C" />
              <span style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>Audio Options</span>
            </div>
            <button className="audio-modal-close" onClick={() => setShowAudioModal(false)} title="Close audio menu">
              <X size={15} />
            </button>
          </div>

          <div className="audio-modal-body">
            {/* Audio Options List: STRICTLY AUDIO TRACKS & AUDIO LANGUAGES */}
            <div className="audio-section-label">Select Audio Track / Language:</div>
            <div className="audio-tracks-list">
              {audioOptions.map((opt) => (
                <button
                  key={opt.id}
                  className={`audio-track-item ${opt.selected ? 'active' : ''}`}
                  onClick={() => handleSelectAudioOption(opt)}
                >
                  <div className="audio-track-radio">
                    {opt.selected && <div className="audio-radio-inner" />}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                    <span className="audio-track-name">{opt.label}</span>
                    {opt.desc && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{opt.desc}</span>}
                  </div>
                  {opt.badge && <span className="audio-default-tag">{opt.badge}</span>}
                  {opt.selected && <Check size={14} color="#10b981" />}
                </button>
              ))}
            </div>

            {/* Audio Sound Enhancements */}
            <div style={{ marginTop: 12 }}>
              <div className="audio-section-label">Audio Enhancement:</div>
              <button
                className={`audio-enhancement-btn ${speechClarity ? 'active' : ''}`}
                onClick={toggleSpeechClarity}
                title="Boost vocal clarity on dialogues"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <Volume2 size={16} color={speechClarity ? '#10b981' : 'var(--text-muted)'} />
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: '#fff' }}>Dialogue Clarity Boost</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Enhances speech presence (1kHz–4kHz)</div>
                  </div>
                </div>
                <span className={`toggle-pill ${speechClarity ? 'on' : 'off'}`}>
                  {speechClarity ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>

            {/* Volume Boost quick switch */}
            <div style={{ marginTop: 12 }}>
              <div className="audio-section-label">Volume Level:</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                {[1, 2, 3, 4].map(b => (
                  <button
                    key={b}
                    className={`boost-pill ${volume === b ? 'active' : ''}`}
                    style={{ flex: 1, padding: '5px 0', fontSize: 11 }}
                    onClick={() => handleVolumeChange(b)}
                  >
                    {b * 100}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="audio-modal-footer">
            <span>Tip: Press <kbd className="shortcut-kbd">A</kbd> to cycle audio languages</span>
          </div>
        </div>
      )}

      {/* TOP BAR */}
      <div className="player-top-bar" style={{ opacity: controlsVisible ? 1 : 0, transition: 'opacity 0.3s' }}>
        <div className="player-channel-info">
          {channel.logo ? (
            <div className="player-channel-logo">
              <img src={channel.logo} alt={channel.name} referrerPolicy="no-referrer" onError={e => e.target.style.display = 'none'} />
            </div>
          ) : (
            <div className="player-channel-logo">
              <Tv size={20} color="rgba(255,255,255,0.6)" />
            </div>
          )}
          <div className="player-channel-text">
            <div className="player-channel-name">{channel.name}</div>
            <div className="player-channel-group">
              <span>{channel.group}</span>
              {channel.country !== 'Global' && <span className="meta-hide-mobile">{` · ${channel.country}`}</span>}
              {channel.language && <span className="meta-hide-mobile">{` · ${channel.language}`}</span>}
            </div>
          </div>
          <span className={`badge badge-${(channel.quality || 'sd').toLowerCase()} player-badge`}>
            {channel.quality}
          </span>
          {/* Top Bar Audio Pill */}
          <button
            className={`player-audio-pill ${hasMultipleAudios ? 'multi' : ''}`}
            onClick={() => setShowAudioModal(prev => !prev)}
            title="Audio Options (Press 'A' to switch)"
          >
            <Languages size={12} />
            <span>Audio: {activeAudioName}</span>
            {hasMultipleAudios && <span className="audio-badge-dot" />}
          </button>
        </div>

        <div className="player-top-actions">
          <button
            onClick={() => onToggleFavorite(channel)}
            className="ctrl-btn"
            style={{ borderColor: isFavorite ? 'rgba(244,63,94,0.5)' : undefined, background: isFavorite ? 'rgba(244,63,94,0.15)' : undefined }}
            title={isFavorite ? 'Remove favorite' : 'Add favorite'}
          >
            <Star size={15} fill={isFavorite ? '#f43f5e' : 'none'} color={isFavorite ? '#f43f5e' : undefined} />
          </button>
          <button onClick={copyUrl} className="ctrl-btn" title="Copy stream URL">
            {copiedLink ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
          </button>
          <a href={channel.url} target="_blank" rel="noopener noreferrer" className="ctrl-btn" title="Open externally">
            <ExternalLink size={15} />
          </a>
        </div>
      </div>

      {/* LOADING */}
      {isLoading && !hasError && (
        <div className="player-loading">
          <div className="spin" style={{
            width: 44, height: 44,
            border: '3px solid rgba(255,255,255,0.1)',
            borderTopColor: '#F97316',
            borderRadius: '50%'
          }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>
            Connecting to live stream…
          </span>
        </div>
      )}

      {/* ERROR */}
      {hasError && (
        <div className="player-error">
          <AlertTriangle size={48} color="#f43f5e" />
          <div>
            <h3 style={{ fontSize: 18, color: '#fff', marginBottom: 8 }}>Playback Error</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: 420 }}>{errorMsg}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setCorsProxy(!corsProxy)}
              className="btn-primary"
              style={{ background: corsProxy ? 'linear-gradient(135deg,#38bdf8,#0e7490)' : undefined }}
            >
              <ShieldAlert size={15} />
              {corsProxy ? 'Disable CORS Proxy' : 'Enable CORS Proxy'}
            </button>
            <a href={channel.url} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, textDecoration: 'none' }}>
              <ExternalLink size={15} /> Open Externally
            </a>
          </div>
        </div>
      )}

      {/* CONTROLS BAR */}
      <div className="player-controls" style={{ opacity: controlsVisible ? 1 : 0, transition: 'opacity 0.3s' }}>
        <div className="controls-row">
          {/* Play/Pause */}
          <button className="play-btn" onClick={togglePlay}>
            {isPlaying
              ? <Pause size={18} fill="#111" color="#111" />
              : <Play size={18} fill="#111" color="#111" style={{ marginLeft: 2 }} />}
          </button>

          {/* Live badge */}
          <div className="live-badge">
            <span className="live-dot" />
            <span className="live-label">LIVE</span>
          </div>

          {/* Volume */}
          <div className="volume-group">
            <button onClick={toggleMute} className="ctrl-btn" style={{ border: 'none', background: 'none', width: 28, height: 28 }}>
              {isMuted || volume === 0
                ? <VolumeX size={16} color="rgba(255,255,255,0.7)" />
                : volume < 0.5
                  ? <Volume1 size={16} color="rgba(255,255,255,0.7)" />
                  : <Volume2 size={16} color={volume > 1 ? '#f43f5e' : 'rgba(255,255,255,0.7)'} />}
            </button>

            <input
              type="range"
              className="vol-slider"
              min="0" max="4" step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              style={volSliderStyle}
              title="Volume (up to 400% boost)"
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

          {/* Audio Language Option */}
          <div className="audio-control-wrap">
            <button
              className={`ctrl-btn audio-toggle-btn ${showAudioModal ? 'active' : ''} ${hasMultipleAudios ? 'highlight' : ''}`}
              onClick={() => setShowAudioModal(prev => !prev)}
              title="Audio Options (Press 'A' to switch)"
            >
              <Languages size={15} />
              <span className="audio-btn-label">{activeAudioName}</span>
            </button>
            {audioTracks.length > 1 && (
              <select
                className="ctrl-select audio-select"
                value={selectedAudioTrack}
                onChange={e => handleAudioTrackChange(parseInt(e.target.value))}
                title="Select Audio Language"
              >
                {audioTracks.map((track, idx) => (
                  <option key={track.id ?? idx} value={track.id ?? idx}>
                    {getTrackLabel(track, idx)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Quality Picker */}
          {hlsLevels.length > 0 && (
            <select
              className="ctrl-select"
              value={selectedLevel}
              onChange={e => {
                const lv = parseInt(e.target.value);
                setSelectedLevel(lv);
                if (hlsRef.current) hlsRef.current.currentLevel = lv;
              }}
            >
              <option value={-1}>Auto</option>
              {hlsLevels.map((lv, i) => (
                <option key={i} value={i}>{lv.height ? `${lv.height}p` : `Level ${i + 1}`}</option>
              ))}
            </select>
          )}

          {/* Aspect ratio */}
          <button onClick={cycleAspect} className="ctrl-btn aspect-btn" title="Aspect ratio">
            <Monitor size={14} />
            <span className="aspect-label">{aspectRatio}</span>
          </button>

          {/* PiP */}
          <button onClick={togglePiP} className="ctrl-btn" title="Picture-in-Picture">
            <PictureInPicture2 size={15} />
          </button>

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="ctrl-btn" title="Fullscreen">
            <Maximize size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
