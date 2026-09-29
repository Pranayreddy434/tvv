import React from 'react';
import { Home, Tv, Star, Search, Settings } from 'lucide-react';

export default function MobileBottomNav({
  activeNav,
  onNavigate,
  favoritesCount = 0
}) {
  return (
    <nav className="mobile-bottom-dock" aria-label="Mobile Navigation">
      <button
        className={`mobile-dock-btn ${activeNav === 'home' ? 'active' : ''}`}
        onClick={() => onNavigate('home')}
        title="Home"
      >
        <Home size={19} />
        <span>Home</span>
      </button>

      <button
        className={`mobile-dock-btn ${activeNav === 'live' ? 'active' : ''}`}
        onClick={() => onNavigate('live')}
        title="Live TV"
      >
        <Tv size={19} />
        <span>Live</span>
      </button>

      <button
        className={`mobile-dock-btn ${activeNav === 'favorites' ? 'active' : ''}`}
        onClick={() => onNavigate('favorites')}
        title="My Favorites"
      >
        <div style={{ position: 'relative' }}>
          <Star
            size={19}
            fill={favoritesCount > 0 ? '#F59E0B' : 'none'}
            color={favoritesCount > 0 ? '#F59E0B' : 'currentColor'}
          />
          {favoritesCount > 0 && (
            <span className="dock-badge-dot" />
          )}
        </div>
        <span>Favorites</span>
      </button>

      <button
        className={`mobile-dock-btn ${activeNav === 'search' ? 'active' : ''}`}
        onClick={() => onNavigate('search')}
        title="Search Channels"
      >
        <Search size={19} />
        <span>Search</span>
      </button>

      <button
        className={`mobile-dock-btn ${activeNav === 'settings' ? 'active' : ''}`}
        onClick={() => onNavigate('settings')}
        title="Settings"
      >
        <Settings size={19} />
        <span>Settings</span>
      </button>
    </nav>
  );
}
