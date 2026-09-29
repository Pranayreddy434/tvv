import React, { useState } from 'react';
import {
  Settings, X, Palette, Play, History, Star,
  Trash2, AlertTriangle, Check, Shield, Sun, Moon,
  Wifi, Bell, Info, RefreshCw, Smartphone
} from 'lucide-react';

const THEME_OPTIONS = [
  { id: 'sunset', label: 'Sunset Ember', desc: 'Default high-contrast velvet dark & radiant fire accent' },
  { id: 'gold', label: 'Imperial Gold', desc: 'Deep warm obsidian with royal gold accents' },
  { id: 'cyber', label: 'Cyber Crimson', desc: 'Sleek neon dark with electric crimson styling' },
  { id: 'light', label: 'Daylight Minimal', desc: 'Clean high-visibility daylight IPTV theme' }
];

const STREAMING_MODES = [
  { id: 'auto', label: 'Auto (Adaptive)', desc: 'Automatically adjusts bitrate based on current network bandwidth' },
  { id: 'high', label: 'High Quality', desc: 'Prioritizes highest available resolution (1080p / 720p HD)' },
  { id: 'standard', label: 'Standard', desc: 'Balanced 480p/360p stream for smooth, stable playback' },
  { id: 'saver', label: 'Data Saver', desc: 'Optimized lowest bandwidth stream for mobile 3G/4G data savings' }
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
  const [activeTab, setActiveTab] = useState('playback'); // 'playback' | 'appearance' | 'data' | 'notifications' | 'about'

  const [streamingMode, setStreamingMode] = useState(() => {
    return localStorage.getItem('iptv_streaming_mode') || 'auto';
  });

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

  const handleStreamingModeChange = (mode) => {
    setStreamingMode(mode);
    localStorage.setItem('iptv_streaming_mode', mode);
  };

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

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Notifications are not supported in this browser.');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      new Notification('StreamHub IPTV', { body: 'Notifications are active! You will receive show reminders.' });
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box settings-modal-box">
        {/* Header */}
        <div className="settings-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="settings-header-icon">
              <Settings size={20} color="var(--accent-light)" />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>StreamHub Settings</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Preferences, streaming quality, and storage</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close" style={{ position: 'static' }} aria-label="Close Settings">
            <X size={18} />
          </button>
        </div>

        {/* Categories Tab Navigation */}
        <div className="settings-nav-tabs">
          <button
            className={`settings-nav-tab ${activeTab === 'playback' ? 'active' : ''}`}
            onClick={() => setActiveTab('playback')}
          >
            <Play size={14} />
            <span>Playback</span>
          </button>
          <button
            className={`settings-nav-tab ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            <Palette size={14} />
            <span>Appearance</span>
          </button>
          <button
            className={`settings-nav-tab ${activeTab === 'data' ? 'active' : ''}`}
            onClick={() => setActiveTab('data')}
          >
            <Trash2 size={14} />
            <span>Data & Storage</span>
          </button>
          <button
            className={`settings-nav-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={14} />
            <span>Notifications</span>
          </button>
          <button
            className={`settings-nav-tab ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            <Info size={14} />
            <span>About</span>
          </button>
        </div>

        {/* Content Panes */}
        <div className="settings-scroll-content">
          {/* TAB 1: PLAYBACK (with Data Saver Mode) */}
          {activeTab === 'playback' && (
            <div className="settings-pane">
              {/* Streaming Quality / Data Saver (Requirement 14) */}
              <div className="settings-group">
                <div className="settings-group-title">
                  <Wifi size={15} color="var(--accent-light)" />
                  <span>Streaming Mode & Data Saver</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                  Choose how StreamHub selects video quality for multi-rate HLS streams:
                </p>

                <div className="streaming-mode-grid">
                  {STREAMING_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      className={`streaming-mode-card ${streamingMode === mode.id ? 'active' : ''}`}
                      onClick={() => handleStreamingModeChange(mode.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{mode.label}</span>
                        {streamingMode === mode.id && <Check size={15} color="var(--accent-light)" />}
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{mode.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* General Playback Toggles */}
              <div className="settings-group">
                <div className="settings-group-title">
                  <Play size={15} color="var(--accent-light)" />
                  <span>Playback Behavior</span>
                </div>

                <div className="settings-row-item">
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Autoplay on Selection</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Immediately begin playing when channel is tapped</div>
                  </div>
                  <button
                    className={`toggle-switch ${autoplay ? 'on' : 'off'}`}
                    onClick={handleToggleAutoplay}
                    aria-label="Toggle Autoplay"
                  >
                    <span className="toggle-thumb" />
                  </button>
                </div>

                <div className="settings-row-item">
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Remember Last Channel</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Resume previous stream when opening StreamHub</div>
                  </div>
                  <button
                    className={`toggle-switch ${rememberLastChannel ? 'on' : 'off'}`}
                    onClick={handleToggleRemember}
                    aria-label="Toggle Remember Channel"
                  >
                    <span className="toggle-thumb" />
                  </button>
                </div>

                <div className="settings-row-item">
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Show Offline Streams</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Display streams even if broadcast server is pending</div>
                  </div>
                  <button
                    className={`toggle-switch ${showOffline ? 'on' : 'off'}`}
                    onClick={handleToggleShowOffline}
                    aria-label="Toggle Show Offline"
                  >
                    <span className="toggle-thumb" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="settings-pane">
              <div className="settings-group">
                <div className="settings-group-title">
                  <Palette size={15} color="var(--accent-light)" />
                  <span>Color Themes</span>
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
            </div>
          )}

          {/* TAB 3: DATA & STORAGE */}
          {activeTab === 'data' && (
            <div className="settings-pane">
              <div className="settings-group">
                <div className="settings-group-title">
                  <Trash2 size={15} color="#f43f5e" />
                  <span>Cache & Data Management</span>
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
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Clear Watched History</div>
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
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#f43f5e' }}>Reset All App Data</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Clear cache, custom playlists, and preferences</div>
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
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="settings-pane">
              <div className="settings-group">
                <div className="settings-group-title">
                  <Bell size={15} color="var(--accent-light)" />
                  <span>Program Reminders & Alerts</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                  StreamHub can notify you when your favorite live TV shows or sports matches are about to begin.
                </p>

                <div className="settings-row-item">
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Browser Notifications</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Permission status: <strong>{typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'Not supported'}</strong>
                    </div>
                  </div>
                  <button
                    onClick={requestNotificationPermission}
                    className="btn-secondary"
                    style={{ fontSize: 12, padding: '6px 12px' }}
                  >
                    Enable / Test
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ABOUT */}
          {activeTab === 'about' && (
            <div className="settings-pane">
              <div className="settings-group">
                <div className="settings-group-title">
                  <Info size={15} color="var(--accent-light)" />
                  <span>About StreamHub IPTV</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <p><strong>StreamHub OTT</strong> is a lightweight, mobile-first Web IPTV platform featuring high-definition HLS streaming, full EPG guides, multi-track audio, and zero-latency playback.</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Version: 3.5.0 • Progressive Web App (PWA) Ready</p>
                </div>
              </div>
            </div>
          )}
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
