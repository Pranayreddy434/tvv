import React, { useState } from 'react';
import { X, Upload, Link, Check, Radio, Sparkles, ExternalLink } from 'lucide-react';

const PRESET_PLAYLISTS = [
  { name: '🚩 iptv-org • Telugu (80+ Live Channels)', url: 'https://iptv-org.github.io/iptv/languages/tel.m3u' },
  { name: '🌐 iptv-org Index (All 10,000+ Channels)', url: 'https://iptv-org.github.io/iptv/index.m3u' },
  { name: '🇮🇳 iptv-org • India (All Indian Channels)', url: 'https://iptv-org.github.io/iptv/countries/in.m3u' },
  { name: '🇬🇧 iptv-org • UK', url: 'https://iptv-org.github.io/iptv/countries/gb.m3u' },
  { name: '🇺🇸 iptv-org • USA', url: 'https://iptv-org.github.io/iptv/countries/us.m3u' },
  { name: '🇩🇪 iptv-org • Germany', url: 'https://iptv-org.github.io/iptv/countries/de.m3u' },
];

export default function PlaylistModal({ onClose, onLoadUrl, activePlaylistUrl }) {
  const [url, setUrl] = useState(activePlaylistUrl || '');
  const [loaded, setLoaded] = useState(false);

  const handleLoad = () => {
    if (!url.trim()) return;
    onLoadUrl(url.trim());
    setLoaded(true);
    setTimeout(onClose, 600);
  };

  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { onLoadUrl(ev.target.result); onClose(); };
    reader.readAsText(file);
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <h2 className="modal-title">
          <Radio size={20} color="var(--accent-light)" />
          Load M3U Playlist
        </h2>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>

        {/* URL input */}
        <div style={{ marginBottom: 16 }}>
          <div className="modal-label">M3U URL</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Link size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="url"
                className="modal-input"
                placeholder="https://example.com/playlist.m3u"
                value={url}
                onChange={e => { setUrl(e.target.value); setLoaded(false); }}
                style={{ paddingLeft: 36 }}
              />
            </div>
            <button
              onClick={handleLoad}
              className="btn-primary"
              style={{ whiteSpace: 'nowrap' }}
            >
              {loaded ? <Check size={15} /> : <Sparkles size={15} />}
              Load
            </button>
          </div>
        </div>

        {/* Presets */}
        <div style={{ marginBottom: 16 }}>
          <div className="modal-label">Quick Presets</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {PRESET_PLAYLISTS.map(p => (
              <button
                key={p.url}
                className={`preset-btn ${activePlaylistUrl === p.url ? 'active' : ''}`}
                onClick={() => { setUrl(p.url); onLoadUrl(p.url); setLoaded(true); setTimeout(onClose, 600); }}
              >
                <span>{p.name}</span>
                {activePlaylistUrl === p.url
                  ? <Check size={14} color="var(--accent)" />
                  : <ExternalLink size={13} style={{ opacity: 0.4 }} />}
              </button>
            ))}
          </div>
        </div>

        {/* Local file */}
        <div>
          <div className="modal-label">Upload Local M3U File</div>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
            borderRadius: 'var(--radius-md)', border: '2px dashed var(--border-hover)',
            background: 'var(--bg-card)', cursor: 'pointer', transition: 'var(--transition)'
          }}>
            <Upload size={18} color="var(--accent-light)" />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Click to browse .m3u / .m3u8 file</span>
            <input type="file" accept=".m3u,.m3u8" style={{ display: 'none' }} onChange={handleFile} />
          </label>
        </div>
      </div>
    </div>
  );
}
