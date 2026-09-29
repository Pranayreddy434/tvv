import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Clock, Play, Tv, Sparkles, Star, Search, Bell, BellRing, Check, ChevronRight } from 'lucide-react';
import { getChannelSchedule, getCurrentAndNextProgram } from '../services/epgService';

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
  const [reminders, setReminders] = useState(() => {
    try {
      const data = localStorage.getItem('iptv_program_reminders');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });
  const [reminderToast, setReminderToast] = useState(null);

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
  const currentNext = useMemo(() => getCurrentAndNextProgram(activeChannel), [activeChannel]);

  // Handle program reminder flow with Web Notifications API
  const handleToggleReminder = async (item, ch) => {
    const reminderId = `${item.id || item.title}_${item.startTime}`;
    const exists = reminders.some(r => r.id === reminderId);

    if (exists) {
      const updated = reminders.filter(r => r.id !== reminderId);
      setReminders(updated);
      localStorage.setItem('iptv_program_reminders', JSON.stringify(updated));
      showToast(`Reminder cancelled for ${item.title}`);
      return;
    }

    if (!('Notification' in window)) {
      alert('Browser notifications are not supported on this device.');
      return;
    }

    let permission = Notification.permission;
    if (permission === 'default') {
      try {
        permission = await Notification.requestPermission();
      } catch (e) {
        permission = 'denied';
      }
    }

    if (permission !== 'granted') {
      alert('Please allow browser notifications in site settings to receive show reminders.');
      return;
    }

    const newReminder = {
      id: reminderId,
      title: item.title,
      channelName: ch.name,
      startTime: item.displayStart,
      dateOffset: selectedDay,
      addedAt: Date.now()
    };

    const updated = [...reminders, newReminder];
    setReminders(updated);
    localStorage.setItem('iptv_program_reminders', JSON.stringify(updated));
    showToast(`🔔 Reminder set for "${item.title}" at ${item.displayStart}!`);

    // In-browser test notification or scheduled notification
    try {
      new Notification(`StreamHub TV Reminder`, {
        body: `You will be notified when "${item.title}" starts on ${ch.name}!`,
        icon: ch.logo || '/icon.svg'
      });
    } catch (e) {}
  };

  const showToast = (msg) => {
    setReminderToast(msg);
    setTimeout(() => setReminderToast(null), 3500);
  };

  return (
    <div className="tvguide-container">
      {/* Toast Alert */}
      {reminderToast && (
        <div className="epg-reminder-toast">
          <BellRing size={16} color="var(--accent-light)" />
          <span>{reminderToast}</span>
        </div>
      )}

      {/* Guide Header */}
      <div className="tvguide-header">
        <div className="tvguide-header-title">
          <Calendar size={22} color="var(--accent-light)" />
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
              Live TV Guide & Schedules
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Browse real-time daily programming, live broadcasts, and set reminders
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

      {/* Main Guide Layout */}
      <div className="tvguide-body">
        {/* Left Channel Selector */}
        <div className="tvguide-channel-sidebar">
          <div className="tvguide-sidebar-title">
            <Tv size={14} />
            <span>Select Channel ({displayedGuideChannels.length})</span>
          </div>

          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search TV guide channels..."
                value={guideSearch}
                onChange={e => setGuideSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 32px',
                  fontSize: 13,
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    {num && <span className="ch-num-pill-sm">{num}</span>}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <div className="tvguide-banner-logo">
                  {activeChannel.logo ? (
                    <img src={activeChannel.logo} alt={activeChannel.name} onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <Tv size={26} color="var(--accent-light)" />
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>{activeChannel.name}</h2>
                    <span className="live-pill-inline">
                      <span className="live-dot" /> LIVE
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {activeChannel.language} • {activeChannel.group} • {activeChannel.quality || 'HD'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={() => onSelectChannel(activeChannel)}
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: 13 }}
                >
                  <Play size={15} fill="currentColor" />
                  <span>Watch Stream</span>
                </button>
                {onToggleFavorite && (
                  <button
                    onClick={() => onToggleFavorite(activeChannel)}
                    className="fav-btn"
                    style={{ background: 'var(--bg-elevated)', padding: '9px 12px', borderRadius: 8 }}
                    title="Toggle Favorite"
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

          {/* Current & Next Quick Showcase Card for Mobile & Desktop */}
          {activeChannel && (
            <div className="epg-live-now-card">
              <div className="epg-now-col">
                <div className="epg-pill-label">
                  <span className="live-dot" /> NOW ON AIR
                </div>
                <h3 className="epg-now-title">{currentNext.current.title}</h3>
                <div className="epg-time-badge">
                  <Clock size={12} />
                  <span>{currentNext.current.time}</span>
                </div>
              </div>

              <div className="epg-next-col">
                <div className="epg-pill-label next">UP NEXT</div>
                <h3 className="epg-next-title">{currentNext.next.title}</h3>
                <div className="epg-time-badge">
                  <Clock size={12} />
                  <span>{currentNext.next.time}</span>
                </div>
              </div>
            </div>
          )}

          {/* Full Schedule Slots Table */}
          <div className="tvguide-slots-list">
            {schedule.length === 0 ? (
              <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Tv size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
                <h3>Program information unavailable</h3>
                <p style={{ fontSize: 13, marginTop: 4 }}>This broadcast source does not currently transmit Electronic Program Guide metadata.</p>
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
                const reminderId = `${item.id || item.title}_${item.startTime}`;
                const isReminded = reminders.some(r => r.id === reminderId);

                return (
                  <div
                    key={item.id || index}
                    className={`tvguide-slot-row ${isCurrent ? 'current-slot' : ''}`}
                  >
                    <div className="tvguide-slot-time">
                      <Clock size={13} color={isCurrent ? 'var(--accent-light)' : 'var(--text-muted)'} />
                      <div className="slot-time-range">
                        <span className="slot-start">{item.displayStart}</span>
                        <span className="slot-end">{item.displayEnd}</span>
                      </div>
                    </div>

                    <div className="tvguide-slot-content">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="tvguide-slot-title">{item.title}</span>
                        {isCurrent && (
                          <span className="live-pill-inline">
                            <span className="live-dot" /> LIVE
                          </span>
                        )}
                      </div>
                      <span className="tvguide-slot-category">{item.category}</span>
                    </div>

                    <div className="tvguide-slot-actions">
                      {!isCurrent && (
                        <button
                          onClick={() => handleToggleReminder(item, activeChannel)}
                          className={`tvguide-remind-btn ${isReminded ? 'active' : ''}`}
                          title={isReminded ? "Cancel reminder" : "Remind me when show starts"}
                          aria-label={isReminded ? "Reminder active" : "Remind me"}
                        >
                          {isReminded ? <BellRing size={14} color="var(--accent-light)" /> : <Bell size={14} />}
                          <span className="remind-label">{isReminded ? 'Reminded' : 'Remind me'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => onSelectChannel(activeChannel)}
                        className="tvguide-slot-play-btn"
                        title={`Watch ${activeChannel.name}`}
                        aria-label={`Tune to ${activeChannel.name}`}
                      >
                        <Play size={13} fill="currentColor" />
                      </button>
                    </div>
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
