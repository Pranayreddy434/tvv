import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Play, Tv, Sparkles, Star, Search } from 'lucide-react';
import { getChannelSchedule } from '../services/epgService';

export default function TVGuide({
  channels = [],
  currentChannel,
  onSelectChannel,
  favorites = [],
  onToggleFavorite
}) {
  const [selectedDay, setSelectedDay] = useState(0); // 0 = Today, 1 = Tomorrow, 2 = Upcoming
  const [guideSearch, setGuideSearch] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState(
    channels[0]?.id || ''
  );

  const days = [
    { offset: 0, label: 'Today', date: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) },
    { offset: 1, label: 'Tomorrow', date: new Date(Date.now() + 86400000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) },
    { offset: 2, label: 'Upcoming', date: new Date(Date.now() + 172800000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) },
  ];

  const displayedGuideChannels = useMemo(() => {
    if (!guideSearch.trim()) return channels.slice(0, 100);
    const q = guideSearch.toLowerCase();
    return channels.filter(c => 
      (c.name || '').toLowerCase().includes(q) || 
      (c.group || '').toLowerCase().includes(q) ||
      (c.language || '').toLowerCase().includes(q)
    ).slice(0, 100);
  }, [channels, guideSearch]);

  const activeChannel = channels.find(c => c.id === selectedChannelId) || displayedGuideChannels[0] || channels[0];
  const schedule = activeChannel ? getChannelSchedule(activeChannel, selectedDay) : [];

  return (
    <div className="tvguide-container">
      {/* Guide Header */}
      <div className="tvguide-header">
        <div className="tvguide-header-title">
          <Calendar size={20} color="var(--accent-light)" />
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
              Live TV Electronic Program Guide (EPG)
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Real-time daily broadcasting schedules, upcoming shows, and prime-time events
            </p>
          </div>
        </div>

        {/* Day Navigation Tabs */}
        <div className="tvguide-day-tabs">
          {days.map((d) => (
            <button
              key={d.offset}
              className={`tvguide-day-btn ${selectedDay === d.offset ? 'active' : ''}`}
              onClick={() => setSelectedDay(d.offset)}
            >
              <span className="day-name">{d.label}</span>
              <span className="day-date">{d.date}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Guide Layout: Left Channels List, Right Schedule Timeline */}
      <div className="tvguide-body">
        {/* Left Channel Selector */}
        <div className="tvguide-channel-sidebar">
          <div className="tvguide-sidebar-title">
            <Tv size={14} />
            <span>Select Channel ({displayedGuideChannels.length})</span>
          </div>

          <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={13} style={{ position: 'absolute', left: 8, color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Filter guide channels..."
                value={guideSearch}
                onChange={e => setGuideSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px 8px 5px 26px',
                  fontSize: 12,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div className="tvguide-channel-list">
            {displayedGuideChannels.map((ch) => {
              const isSelected = (activeChannel?.id === ch.id);
              const isPlaying = (currentChannel?.id === ch.id);
              const num = ch.channelNumber ? String(ch.channelNumber).padStart(3, '0') : null;

              return (
                <button
                  key={ch.id || ch.url}
                  className={`tvguide-ch-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedChannelId(ch.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    {num && <span className="ch-num-pill">{num}</span>}
                    {ch.logo ? (
                      <img src={ch.logo} alt="" className="tvguide-ch-logo" onError={(e) => { e.target.style.display = 'none'; }} />
                    ) : (
                      <Tv size={16} color="var(--text-muted)" />
                    )}
                    <div style={{ textAlign: 'left', minWidth: 0 }}>
                      <div className="tvguide-ch-name">{ch.name}</div>
                      <div className="tvguide-ch-genre">{ch.group || ch.language}</div>
                    </div>
                  </div>

                  {isPlaying && <span className="live-dot" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Schedule View */}
        <div className="tvguide-schedule-panel">
          {activeChannel && (
            <div className="tvguide-active-channel-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="tvguide-banner-logo">
                  {activeChannel.logo ? (
                    <img src={activeChannel.logo} alt={activeChannel.name} />
                  ) : (
                    <Tv size={24} color="var(--accent-light)" />
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{activeChannel.name}</h3>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {activeChannel.language} • {activeChannel.group} • {activeChannel.quality || 'HD'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => onSelectChannel(activeChannel)}
                  className="btn-primary"
                  style={{ padding: '7px 14px', fontSize: 13 }}
                >
                  <Play size={15} fill="currentColor" />
                  <span>Watch Stream</span>
                </button>
                {onToggleFavorite && (
                  <button
                    onClick={() => onToggleFavorite(activeChannel)}
                    className="fav-btn"
                    style={{ background: 'var(--bg-elevated)', padding: '8px 10px', borderRadius: 8 }}
                  >
                    <Star
                      size={16}
                      fill={favorites.some(f => f.id === activeChannel.id) ? '#F59E0B' : 'none'}
                      color={favorites.some(f => f.id === activeChannel.id) ? '#F59E0B' : 'var(--text-muted)'}
                    />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Schedule Slots Table */}
          <div className="tvguide-slots-list">
            {schedule.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No program information available for this day.
              </div>
            ) : (
              schedule.map((item, index) => {
                const now = new Date();
                const nowM = now.getHours() * 60 + now.getMinutes();
                const [sh, sm] = item.startTime.split(':').map(Number);
                const [eh, em] = item.endTime.split(':').map(Number);
                const sM = sh * 60 + sm;
                let eM = eh * 60 + em;
                if (eM < sM) eM += 1440;
                const isCurrent = selectedDay === 0 && nowM >= sM && nowM < eM;

                return (
                  <div
                    key={item.id || index}
                    className={`tvguide-slot-row ${isCurrent ? 'current-slot' : ''}`}
                  >
                    <div className="tvguide-slot-time">
                      <Clock size={13} color={isCurrent ? 'var(--accent-light)' : 'var(--text-muted)'} />
                      <span>{item.displayStart}</span>
                    </div>

                    <div className="tvguide-slot-content">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="tvguide-slot-title">{item.title}</span>
                        {isCurrent && (
                          <span className="live-pill-inline">
                            <span className="live-dot" /> ON AIR NOW
                          </span>
                        )}
                      </div>
                      <span className="tvguide-slot-category">{item.category}</span>
                    </div>

                    <button
                      onClick={() => onSelectChannel(activeChannel)}
                      className="tvguide-slot-play-btn"
                      title="Tune in"
                    >
                      <Play size={12} fill="currentColor" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
