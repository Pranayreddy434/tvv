import React from 'react';
import { Star, Clock, Search, WifiOff, Tv, Sparkles } from 'lucide-react';

export default function EmptyState({
  type = 'generic', // 'favorites' | 'history' | 'search' | 'offline' | 'generic'
  title,
  message,
  actionLabel,
  onAction
}) {
  const configs = {
    favorites: {
      icon: Star,
      defaultTitle: 'No favorite channels yet',
      defaultMessage: 'Click the star icon on any channel card to add it to your personal favorites list.',
      color: '#F59E0B'
    },
    history: {
      icon: Clock,
      defaultTitle: "You haven't watched any channels yet",
      defaultMessage: 'Channels you play will automatically appear here for quick access.',
      color: 'var(--accent-light)'
    },
    search: {
      icon: Search,
      defaultTitle: 'No channels found',
      defaultMessage: 'Try adjusting your search terms or clearing active category filters.',
      color: 'var(--text-muted)'
    },
    offline: {
      icon: WifiOff,
      defaultTitle: 'No playable channels are currently available',
      defaultMessage: 'Please check your internet connection or try enabling the CORS Proxy.',
      color: '#f43f5e'
    },
    generic: {
      icon: Tv,
      defaultTitle: 'No channels to display',
      defaultMessage: 'Try choosing another category or loading an M3U playlist.',
      color: 'var(--accent-light)'
    }
  };

  const config = configs[type] || configs.generic;
  const Icon = config.icon;

  return (
    <div className="empty-state-wrap">
      <div className="empty-state-icon-box" style={{ borderColor: `${config.color}33`, background: `${config.color}15` }}>
        <Icon size={38} color={config.color} />
      </div>
      <h3 className="empty-state-title">{title || config.defaultTitle}</h3>
      <p className="empty-state-message">{message || config.defaultMessage}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary" style={{ marginTop: 14 }}>
          <Sparkles size={15} />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
