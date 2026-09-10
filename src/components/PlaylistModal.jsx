import React, { useState } from 'react';
import { X, Upload, Link, Check, Radio, Sparkles } from 'lucide-react';

const PRESET_PLAYLISTS = [
  { name: 'iptv-org Index (Global All Channels)', url: 'https://iptv-org.github.io/iptv/index.m3u' },
  { name: '🚩 Telugu Channels (iptv-org Dedicated)', url: 'https://iptv-org.github.io/iptv/languages/tel.m3u' },
  { name: '🇮🇳 Hindi Channels (iptv-org Dedicated)', url: 'https://iptv-org.github.io/iptv/languages/hin.m3u' },
  { name: '🇬🇧 English Channels (iptv-org Dedicated)', url: 'https://iptv-org.github.io/iptv/languages/eng.m3u' },
  { name: '🇮🇳 Tamil Channels (iptv-org Dedicated)', url: 'https://iptv-org.github.io/iptv/languages/tam.m3u' },
  { name: 'iptv-org Categories - Movies', url: 'https://iptv-org.github.io/iptv/categories/movies.m3u' },
  { name: 'iptv-org Categories - Sports', url: 'https://iptv-org.github.io/iptv/categories/sports.m3u' },
  { name: 'iptv-org Categories - News', url: 'https://iptv-org.github.io/iptv/categories/news.m3u' }
];

export default function PlaylistModal({
  isOpen,
  onClose,
  activePlaylistUrl,
  onLoadUrlPlaylist,
  onLoadLocalFilePlaylist
}) {
  const [inputUrl, setInputUrl] = useState(activePlaylistUrl);

  if (!isOpen) return null;

  const handleSubmitUrl = (e) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      onLoadUrlPlaylist(inputUrl.trim());
      onClose();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target.result;
      onLoadLocalFilePlaylist(content, file.name);
      onClose();
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '540px', borderRadius: '16px', padding: '24px', position: 'relative' }}>
        <button onClick={onClose} className="btn-icon" style={{ position: 'absolute', top: '16px', right: '16px' }}>
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <Radio size={24} color="var(--accent-primary)" />
          <h2 style={{ fontSize: '18px', color: '#fff' }}>Load IPTV Playlist</h2>
        </div>

        {/* Enter URL Form */}
        <form onSubmit={handleSubmitUrl} style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
            Playlist M3U / M3U8 URL
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="url"
              placeholder="https://iptv-org.github.io/iptv/index.m3u"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 14px',
                backgroundColor: 'rgba(0,0,0,0.4)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13px',
                outline: 'none'
              }}
              required
            />
            <button type="submit" className="btn-primary" style={{ padding: '10px 16px' }}>
              Load
            </button>
          </div>
        </form>

        {/* Or Upload Local M3U File */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
            Or Upload Local M3U File
          </label>
          <label
            className="glass-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '10px',
              padding: '14px',
              cursor: 'pointer',
              borderColor: 'dashed rgba(255, 255, 255, 0.2)'
            }}
          >
            <Upload size={18} color="var(--accent-cyan)" />
            <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>Select .m3u or .m3u8 file from device</span>
            <input type="file" accept=".m3u,.m3u8,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>

        {/* Presets */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 600 }}>
            Curated Presets (iptv-org)
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {PRESET_PLAYLISTS.map((preset) => {
              const isSelected = activePlaylistUrl === preset.url;
              return (
                <button
                  key={preset.url}
                  onClick={() => {
                    setInputUrl(preset.url);
                    onLoadUrlPlaylist(preset.url);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    color: isSelected ? '#818cf8' : 'var(--text-main)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    textAlign: 'left'
                  }}
                >
                  <span>{preset.name}</span>
                  {isSelected && <Check size={16} color="var(--accent-primary)" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
