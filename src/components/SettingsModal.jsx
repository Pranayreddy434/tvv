import React, { useState } from 'react';
import {
  Settings, X, Palette, Play, History, Star,
  Trash2, AlertTriangle, Check, Shield, Sun, Moon
} from 'lucide-react';

const THEME_OPTIONS = [
  { id: 'sunset', label: 'Sunset Ember', desc: 'Default high-contrast velvet dark & radiant fire accent' },
  { id: 'gold', label: 'Imperial Gold', desc: 'Deep warm obsidian with royal gold accents' },
  { id: 'cyber', label: 'Cyber Crimson', desc: 'Sleek neon dark with electric crimson styling' },
  { id: 'light', label: 'Daylight Minimal', desc: 'Clean high-visibility daylight IPTV theme' }
];

export default function SettingsModal({
  isOpen,
  onClose,
  currentTheme,
  onThemeChange,
  onClearFavorites,
  onClearHistory,
  onResetAllData,
  favoritesCount = 0,
  historyCount = 0
}) {
  const [autoplay, setAutoplay] = useState(() => {
    return localStorage.getItem('iptv_autoplay') !== 'false';
  });

  const [rememberLastChannel, setRememberLastChannel] = useState(() => {
    return localStorage.getItem('iptv_remember_last') !== 'false';
  });

  const [showOffline, setShowOffline] = useState(() => {
    return localStorage.getItem('iptv_show_offline') !== 'false';
  });

  // Confirmation dialog state
  const [confirmAction, setConfirmAction] = useState(null); // 'favorites' | 'history' | 'reset'

  if (!isOpen) return null;

  const handleToggleAutoplay = () => {
    const val = !autoplay;
    setAutoplay(val);
    localStorage.setItem('iptv_autoplay', String(val));
  };

  const handleToggleRemember = () => {
    const val = !rememberLastChannel;
    setRememberLastChannel(val);
    localStorage.setItem('iptv_remember_last', String(val));
  };

  const handleToggleShowOffline = () => {
    const val = !showOffline;
    setShowOffline(val);
    localStorage.setItem('iptv_show_offline', String(val));
  };

  const executeConfirmAction = () => {
    if (confirmAction === 'favorites') {
      onClearFavorites();
    } else if (confirmAction === 'history') {
      onClearHistory();
    } else if (confirmAction === 'reset') {
      onResetAllData();
    }
    setConfirmAction(null);
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 540 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="settings-header-icon">
              <Settings size={20} color="var(--accent-light)" />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>StreamHub Settings</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Preferences, theme, and data management</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close" style={{ position: 'static' }}>
            <X size={18} />
          </button>
        </div>

        {/* Setting Groups */}
        <div className="settings-scroll-content">
          {/* Theme Selector */}
          <div className="settings-group">
            <div className="settings-group-title">
              <Palette size={15} color="var(--accent-light)" />
              <span>Appearance & Color Themes</span>
            </div>

            <div className="theme-options-grid">
              {THEME_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  className={`theme-card-option ${currentTheme === t.id ? 'active' : ''}`}
                  onClick={() => onThemeChange(t.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {t.id === 'light' ? <Sun size={15} /> : <Moon size={15} />}
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{t.label}</span>
                    </div>
                    {currentTheme === t.id && <Check size={14} color="var(--accent-light)" />}
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Playback Preferences */}
          <div className="settings-group">
            <div className="settings-group-title">
              <Play size={15} color="var(--accent-light)" />
              <span>Playback Preferences</span>
            </div>

            <div className="settings-row-item">
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Autoplay on Selection</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Immediately begin playing when channel is clicked</div>
              </div>
              <button
                className={`toggle-switch ${autoplay ? 'on' : 'off'}`}
                onClick={handleToggleAutoplay}
              >
                <span className="toggle-thumb" />
              </button>
            </div>

            <div className="settings-row-item">
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Remember Last Watched Channel</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Resume previous stream when opening StreamHub</div>
              </div>
              <button
                className={`toggle-switch ${rememberLastChannel ? 'on' : 'off'}`}
                onClick={handleToggleRemember}
              >
                <span className="toggle-thumb" />
              </button>
            </div>

            <div className="settings-row-item">
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Show Offline Streams</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Display streams even if server status is pending</div>
              </div>
              <button
                className={`toggle-switch ${showOffline ? 'on' : 'off'}`}
                onClick={handleToggleShowOffline}
              >
                <span className="toggle-thumb" />
              </button>
            </div>
          </div>

          {/* Storage & Privacy */}
          <div className="settings-group">
            <div className="settings-group-title">
              <Trash2 size={15} color="#f43f5e" />
              <span>Storage & Data Reset</span>
            </div>

            <div className="settings-danger-actions">
              <div className="danger-action-row">
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Clear Saved Favorites</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Currently {favoritesCount} channel(s) saved</div>
                </div>
                <button
                  onClick={() => setConfirmAction('favorites')}
                  className="btn-danger-outline"
                  disabled={favoritesCount === 0}
                >
                  Clear Favorites
                </button>
              </div>

              <div className="danger-action-row">
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Clear Recently Watched History</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Currently {historyCount} channel(s) in history</div>
                </div>
                <button
                  onClick={() => setConfirmAction('history')}
                  className="btn-danger-outline"
                  disabled={historyCount === 0}
                >
                  Clear History
                </button>
              </div>

              <div className="danger-action-row">
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f43f5e' }}>Reset All Local App Data</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Clear cache, custom playlists, and all settings</div>
                </div>
                <button
                  onClick={() => setConfirmAction('reset')}
                  className="btn-danger-solid"
                >
                  Reset All Data
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Modal Overlay */}
        {confirmAction && (
          <div className="confirm-modal-overlay">
            <div className="confirm-modal-box">
              <AlertTriangle size={36} color="#f43f5e" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
                Are you sure?
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>
                {confirmAction === 'favorites' && 'This will remove all channels from your favorites list.'}
                {confirmAction === 'history' && 'This will delete your recently watched channel playback history.'}
                {confirmAction === 'reset' && 'This will wipe all preferences, playlists, and cached channels.'}
              </p>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button onClick={() => setConfirmAction(null)} className="btn-secondary">
                  Cancel
                </button>
                <button onClick={executeConfirmAction} className="btn-danger-solid">
                  Confirm & Clear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
