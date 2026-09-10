import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, PictureInPicture2, 
  Settings, RotateCcw, AlertTriangle, ExternalLink, Copy, Star, 
  Tv, ShieldAlert, Monitor, FastForward, Clock, Layers, Volume1
} from 'lucide-react';

export default function VideoPlayer({
  channel,
  onToggleFavorite,
  isFavorite,
  corsProxy,
  setCorsProxy,
  onNextChannel,
  onPrevChannel
}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1); // 0 to 4 (400% VLC boost)
  const [isMuted, setIsMuted] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('contain'); // contain, cover, fill
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hlsLevels, setHlsLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(-1); // -1 = Auto
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [sleepTimer, setSleepTimer] = useState(0); // in minutes
  const [copiedLink, setCopiedLink] = useState(false);

  // Web Audio API Gain Booster (VLC 400% Volume Boost)
  const audioCtxRef = useRef(null);
  const gainNodeRef = useRef(null);

  const ensureAudioBoostCtx = () => {
    if (!videoRef.current) return;
    if (!audioCtxRef.current) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        const source = ctx.createMediaElementSource(videoRef.current);
        const gainNode = ctx.createGain();
        
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        audioCtxRef.current = ctx;
        gainNodeRef.current = gainNode;
      } catch (e) {
        console.warn('AudioContext boost setup error:', e);
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  // Initialize HLS Stream
  useEffect(() => {
    if (!channel || !channel.url) return;

    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');
    setHlsLevels([]);
    setSelectedLevel(-1);

    const video = videoRef.current;
    if (!video) return;

    let streamUrl = channel.url;
    if (corsProxy) {
      streamUrl = `https://corsproxy.io/?${encodeURIComponent(channel.url)}`;
    }

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        xhrSetup: (xhr) => {
          if (channel.userAgent) {
            // Note: browser might restrict setting User-Agent directly, handled gracefully
          }
        }
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setIsLoading(false);
        setHlsLevels(data.levels || []);
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setErrorMessage('Network error: Stream server unreachable or CORS restricted.');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setErrorMessage('Media error: Stream format unplayable.');
              hls.recoverMediaError();
              break;
            default:
              setHasError(true);
              setErrorMessage('Unable to play stream. Try toggling CORS Proxy or selecting another channel.');
              hls.destroy();
              break;
          }
          setIsLoading(false);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS for Safari
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      });
      video.addEventListener('error', () => {
        setHasError(true);
        setErrorMessage('Stream format error or browser restricted.');
        setIsLoading(false);
      });
    } else {
      setHasError(true);
      setErrorMessage('HLS video playback is not supported in this browser.');
      setIsLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [channel, corsProxy]);

  // Sleep Timer effect
  useEffect(() => {
    if (sleepTimer <= 0) return;
    const timer = setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      setSleepTimer(0);
      alert('Sleep timer completed. Playback paused.');
    }, sleepTimer * 60 * 1000);

    return () => clearTimeout(timer);
  }, [sleepTimer]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    ensureAudioBoostCtx();
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleVolumeChange = (val) => {
    const newVol = typeof val === 'number' ? val : parseFloat(val.target.value);
    setVolume(newVol);
    ensureAudioBoostCtx();

    if (videoRef.current) {
      videoRef.current.volume = Math.min(newVol, 1.0);
      setIsMuted(newVol === 0);
    }

    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = newVol;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    ensureAudioBoostCtx();
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    videoRef.current.muted = nextMute;
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = nextMute ? 0 : volume;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const changeQualityLevel = (levelIndex) => {
    setSelectedLevel(levelIndex);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
    }
  };

  const changeAspectRatio = () => {
    const modes = ['contain', 'cover', 'fill'];
    const next = modes[(modes.indexOf(aspectRatio) + 1) % modes.length];
    setAspectRatio(next);
  };

  const copyStreamUrl = () => {
    if (!channel) return;
    navigator.clipboard.writeText(channel.url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!channel) {
    return (
      <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', color: 'var(--text-muted)' }}>
        <Tv size={64} color="rgba(255, 255, 255, 0.15)" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '20px', color: 'var(--text-main)' }}>No Channel Selected</h2>
        <p style={{ fontSize: '13px', marginTop: '6px' }}>Select a channel from the left sidebar to start streaming.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        height: '100%',
        backgroundColor: '#000',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      {/* Top Overlay Bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '16px 20px',
          background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.85) 0%, transparent 100%)',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          zIndex: 30,
          pointerEvents: 'auto'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {channel.logo ? (
            <img
              src={channel.logo}
              alt={channel.name}
              style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '4px' }}
              onError={(e) => e.target.style.display = 'none'}
            />
          ) : (
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tv size={20} color="#fff" />
            </div>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>{channel.name}</h2>
              <span className={`badge badge-${channel.quality.toLowerCase()}`}>{channel.quality}</span>
              {channel.country !== 'Global' && (
                <span style={{ fontSize: '11px', backgroundColor: 'rgba(255, 255, 255, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                  {channel.country}
                </span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{channel.group}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onToggleFavorite(channel)}
            className="btn-icon"
            style={{ backgroundColor: isFavorite ? 'rgba(236, 72, 153, 0.2)' : 'rgba(0, 0, 0, 0.4)' }}
            title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          >
            <Star size={18} fill={isFavorite ? "#ec4899" : "none"} color={isFavorite ? "#ec4899" : "#fff"} />
          </button>
          <button onClick={copyStreamUrl} className="btn-icon" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }} title="Copy Stream URL">
            <Copy size={18} color={copiedLink ? "#10b981" : "#fff"} />
          </button>
          <a
            href={channel.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-icon"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
            title="Open Direct Stream URL"
          >
            <ExternalLink size={18} />
          </a>
        </div>
      </div>

      {/* Video Element */}
      <div style={{ flex: 1, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <video
          ref={videoRef}
          onClick={togglePlay}
          style={{
            width: '100%',
            height: '100%',
            objectFit: aspectRatio,
            backgroundColor: '#000'
          }}
        />

        {/* Loading Spinner */}
        {isLoading && !hasError && (
          <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#fff' }}>
            <div className="spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(255, 255, 255, 0.2)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%' }}></div>
            <span style={{ fontSize: '13px', fontWeight: 500 }}>Connecting to Live Stream...</span>
          </div>
        )}

        {/* Error Overlay */}
        {hasError && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(10, 12, 20, 0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px', textAlign: 'center', gap: '16px', zIndex: 25 }}>
            <AlertTriangle size={48} color="#ef4444" />
            <div>
              <h3 style={{ fontSize: '18px', color: '#fff', marginBottom: '6px' }}>Playback Error</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '450px' }}>
                {errorMessage || 'This live channel stream could not be loaded directly.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={() => setCorsProxy(!corsProxy)}
                className="btn-primary"
                style={{ backgroundColor: corsProxy ? '#06b6d4' : '#6366f1' }}
              >
                <ShieldAlert size={16} />
                <span>{corsProxy ? 'Disable CORS Proxy' : 'Enable CORS Proxy'}</span>
              </button>
              <a href={channel.url} target="_blank" rel="noopener noreferrer" className="btn-icon" style={{ padding: '10px 16px', gap: '8px' }}>
                <ExternalLink size={16} />
                <span>Open Stream Externally</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Custom Video Controls */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px 24px',
          background: 'linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, transparent 100%)',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          zIndex: 30
        }}
      >
        {/* Play/Pause & Live Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button onClick={togglePlay} className="btn-icon" style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', border: 'none' }}>
            {isPlaying ? <Pause size={18} fill="#fff" /> : <Play size={18} fill="#fff" style={{ marginLeft: '2px' }} />}
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '4px 10px', borderRadius: '12px' }}>
            <span className="live-indicator"></span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', letterSpacing: '0.5px' }}>LIVE</span>
          </div>

          {/* Volume Control with 400% Super Boost */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px' }}>
            <button onClick={toggleMute} className="btn-icon" style={{ border: 'none', background: 'none', padding: '4px' }}>
              {isMuted || volume === 0 ? <VolumeX size={18} /> : volume < 0.5 ? <Volume1 size={18} /> : <Volume2 size={18} color={volume > 1 ? "#ec4899" : "currentColor"} />}
            </button>

            <input
              type="range"
              min="0"
              max="4"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              style={{ width: '100px', accentColor: volume > 1 ? '#ec4899' : 'var(--accent-primary)', cursor: 'pointer' }}
              title="Volume Range: 0% to 400% Super Boost"
            />

            <span style={{ fontSize: '12px', fontWeight: 700, minWidth: '45px', color: volume > 1 ? '#ec4899' : '#fff' }}>
              {Math.round((isMuted ? 0 : volume) * 100)}% {volume > 1 ? '🔥' : ''}
            </span>

            {/* Quick Boost Preset Buttons */}
            <div style={{ display: 'flex', gap: '3px', marginLeft: '4px' }}>
              {[1, 2, 3, 4].map(b => (
                <button
                  key={b}
                  onClick={() => handleVolumeChange(b)}
                  style={{
                    padding: '2px 5px',
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: volume === b ? '#ec4899' : 'rgba(255,255,255,0.15)',
                    backgroundColor: volume === b ? 'rgba(236, 72, 153, 0.25)' : 'rgba(0,0,0,0.3)',
                    color: volume === b ? '#f472b6' : 'var(--text-muted)',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title={`Set volume to ${b * 100}%`}
                >
                  {b * 100}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Player Options & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Quality Picker */}
          {hlsLevels.length > 0 && (
            <select
              value={selectedLevel}
              onChange={(e) => changeQualityLevel(parseInt(e.target.value))}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                color: '#fff',
                border: '1px solid var(--border-color)',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value={-1}>Quality: Auto</option>
              {hlsLevels.map((level, idx) => (
                <option key={idx} value={idx}>
                  {level.height ? `${level.height}p` : `Level ${idx + 1}`}
                </option>
              ))}
            </select>
          )}

          {/* Aspect Ratio Toggle */}
          <button onClick={changeAspectRatio} className="btn-icon" style={{ padding: '6px 10px', fontSize: '12px', gap: '4px' }} title={`Aspect Ratio: ${aspectRatio}`}>
            <Monitor size={16} />
            <span style={{ textTransform: 'capitalize' }}>{aspectRatio}</span>
          </button>

          {/* Picture in Picture */}
          <button onClick={togglePiP} className="btn-icon" title="Picture in Picture">
            <PictureInPicture2 size={18} />
          </button>

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="btn-icon" title="Toggle Fullscreen">
            <Maximize size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
