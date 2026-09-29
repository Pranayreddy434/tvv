import React from 'react';
import { Home, Tv, Film, Star, Settings } from 'lucide-react';

export default function MobileBottomNav({
  activeNav,
  onNavigate,
  favoritesCount = 0
}) {
  return (
    <nav className="mobile-bottom-dock" aria-label="Mobile Bottom Navigation">
      <button
        className={`mobile-dock-btn ${activeNav === 'home' ? 'active' : ''}`}
        onClick={() => onNavigate('home')}
        title="Home"
        aria-label="Home"
      >
        <Home size={20} />
        <span>Home</span>
      </button>

      <button
        className={`mobile-dock-btn ${activeNav === 'live' ? 'active' : ''}`}
        onClick={() => onNavigate('live')}
        title="Live TV"
        aria-label="Live TV"
      >
        <Tv size={20} />
        <span>Live</span>
      </button>

      <button
        className={`mobile-dock-btn ${activeNav === 'categories' ? 'active' : ''}`}
        onClick={() => onNavigate('categories')}
        title="Categories"
        aria-label="Categories"
      >
        <Film size={20} />
        <span>Categories</span>
      </button>

      <button
        className={`mobile-dock-btn ${activeNav === 'favorites' ? 'active' : ''}`}
        onClick={() => onNavigate('favorites')}
        title="Favorites"
        aria-label="Favorites"
      >
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <Star
            size={20}
            fill={favoritesCount > 0 ? '#F59E0B' : 'none'}
            color={favoritesCount > 0 ? '#F59E0B' : 'currentColor'}
          />
          {favoritesCount > 0 && <span className="dock-badge-dot" />}
        </div>
        <span>Favorites</span>
      </button>

      <button
        className={`mobile-dock-btn ${activeNav === 'settings' ? 'active' : ''}`}
        onClick={() => onNavigate('settings')}
        title="Settings"
        aria-label="Settings"
      >
        <Settings size={20} />
        <span>Settings</span>
      </button>
    </nav>
  );
}
