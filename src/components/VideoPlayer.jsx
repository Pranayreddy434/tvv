import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  Play, Pause, Volume2, VolumeX, Volume1, Maximize, PictureInPicture2,
  AlertTriangle, ExternalLink, Copy, Star, Tv, ShieldAlert, Monitor,
  ChevronDown, Check
} from 'lucide-react';

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

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hlsLevels, setHlsLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(-1);
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
    return () => clearTimeout(hideTimerRef.current);
  }, []);

  // Ensure Web Audio API boost context
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
      source.connect(gain);
      gain.connect(ctx.destination);
      audioCtxRef.current = ctx;
      gainNodeRef.current = gain;
      gain.gain.value = volume;
    } catch (e) {
      console.warn('AudioContext error:', e);
    }
  };

  // Load HLS stream
  useEffect(() => {
    if (!channel?.url) return;
    setIsLoading(true);
    setHasError(false);
    setErrorMsg('');
    setHlsLevels([]);
    setSelectedLevel(-1);

    const video = videoRef.current;
    if (!video) return;

    const streamUrl = corsProxy
      ? `https://corsproxy.io/?${encodeURIComponent(channel.url)}`
      : channel.url;

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 90 });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsLoading(false);
        setHlsLevels(data.levels || []);
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
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

    return () => { if (hlsRef.current) hlsRef.current.destroy(); };
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

  const volPct = Math.round((isMuted ? 0 : volume) * 100);
  const volSliderStyle = { '--val': `${Math.min(volPct, 100)}%` };

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

      {/* TOP BAR */}
      <div className="player-top-bar" style={{ opacity: controlsVisible ? 1 : 0, transition: 'opacity 0.3s' }}>
        <div className="player-channel-info">
          {channel.logo ? (
            <div className="player-channel-logo">
              <img src={channel.logo} alt={channel.name} onError={e => e.target.style.display = 'none'} />
            </div>
          ) : (
            <div className="player-channel-logo">
              <Tv size={20} color="rgba(255,255,255,0.6)" />
            </div>
          )}
          <div>
            <div className="player-channel-name">{channel.name}</div>
            <div className="player-channel-group">
              {channel.group}
              {channel.country !== 'Global' && ` · ${channel.country}`}
              {channel.language && channel.language !== 'English' && ` · ${channel.language}`}
            </div>
          </div>
          <span className={`badge badge-${(channel.quality || 'sd').toLowerCase()}`} style={{ marginLeft: 8 }}>
            {channel.quality}
          </span>
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
          <button onClick={cycleAspect} className="ctrl-btn" title="Aspect ratio" style={{ gap: 4, padding: '0 8px', width: 'auto' }}>
            <Monitor size={14} />
            <span style={{ fontSize: 10, textTransform: 'capitalize' }}>{aspectRatio}</span>
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
