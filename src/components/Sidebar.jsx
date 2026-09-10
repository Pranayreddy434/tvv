import React from 'react';
import { 
  Tv, Star, Clock, Globe, Film, Newspaper, Music, Trophy, Smile, 
  Sparkles, Grid, List, AlignJustify, Shuffle, ChevronRight, Hash 
} from 'lucide-react';

const CATEGORY_ICONS = {
  'News': Newspaper,
  'Movies': Film,
  'Music': Music,
  'Sports': Trophy,
  'Kids': Smile,
  'Animation': Smile,
  'Entertainment': Sparkles,
  'General': Tv,
};

export default function Sidebar({
  activeTab,
  setActiveTab,
  selectedCategory,
  setSelectedCategory,
  selectedCountry,
  setSelectedCountry,
  selectedLanguage,
  setSelectedLanguage,
  onLanguageModeSwitch,
  categories,
  countries,
  languages,
  favoritesCount,
  historyCount,
  categoryCounts,
  viewLayout,
  setViewLayout,
  onSurpriseMe,
  collapsed,
  setCollapsed
}) {
  return (
    <aside
      className="glass-panel"
      style={{
        width: collapsed ? '70px' : 'var(--sidebar-width)',
        minWidth: collapsed ? '70px' : 'var(--sidebar-width)',
        height: 'calc(100vh - var(--header-height))',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        zIndex: 40,
        overflow: 'hidden'
      }}
    >
      {/* View Mode Tabs (All, Favorites, History) */}
      <div style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <button
          onClick={() => { setActiveTab('all'); setSelectedCategory('All'); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justify: collapsed ? 'center' : 'space-between',
            padding: '10px 14px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: activeTab === 'all' && selectedCategory === 'All' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'all' && selectedCategory === 'All' ? '#ffffff' : 'var(--text-main)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Tv size={18} />
            {!collapsed && <span>All Channels</span>}
          </div>
        </button>

        <button
          onClick={() => setActiveTab('favorites')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justify: collapsed ? 'center' : 'space-between',
            padding: '10px 14px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: activeTab === 'favorites' ? 'rgba(236, 72, 153, 0.2)' : 'transparent',
            color: activeTab === 'favorites' ? '#f472b6' : 'var(--text-main)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Star size={18} fill={activeTab === 'favorites' ? "#f472b6" : "none"} color={activeTab === 'favorites' ? "#f472b6" : "currentColor"} />
            {!collapsed && <span>Favorites</span>}
          </div>
          {!collapsed && favoritesCount > 0 && (
            <span style={{ backgroundColor: 'rgba(236, 72, 153, 0.3)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>
              {favoritesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justify: collapsed ? 'center' : 'space-between',
            padding: '10px 14px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: activeTab === 'history' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
            color: activeTab === 'history' ? '#22d3ee' : 'var(--text-main)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={18} />
            {!collapsed && <span>Recently Watched</span>}
          </div>
          {!collapsed && historyCount > 0 && (
            <span style={{ backgroundColor: 'rgba(6, 182, 212, 0.3)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>
              {historyCount}
            </span>
          )}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Surprise Me / Channel Surfer Button */}
          <div style={{ padding: '12px 16px' }}>
            <button
              onClick={onSurpriseMe}
              className="glass-card"
              style={{
                width: '100%',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                gap: '8px',
                color: 'var(--text-main)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)',
                borderColor: 'rgba(255, 255, 255, 0.12)'
              }}
            >
              <Shuffle size={16} color="var(--accent-secondary)" />
              <span>Surprise Me (Channel Surf)</span>
            </button>
          </div>

          {/* View Layout Controls & Country Filter */}
          <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Layout
            </span>
            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(0, 0, 0, 0.2)', padding: '3px', borderRadius: '8px' }}>
              <button
                onClick={() => setViewLayout('grid')}
                className="btn-icon"
                style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: viewLayout === 'grid' ? 'var(--accent-primary)' : 'transparent', border: 'none' }}
                title="Grid View"
              >
                <Grid size={14} />
              </button>
              <button
                onClick={() => setViewLayout('list')}
                className="btn-icon"
                style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: viewLayout === 'list' ? 'var(--accent-primary)' : 'transparent', border: 'none' }}
                title="List View"
              >
                <List size={14} />
              </button>
              <button
                onClick={() => setViewLayout('compact')}
                className="btn-icon"
                style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: viewLayout === 'compact' ? 'var(--accent-primary)' : 'transparent', border: 'none' }}
                title="Compact View"
              >
                <AlignJustify size={14} />
              </button>
            </div>
          </div>

          {/* Language Selector */}
          {languages && languages.length > 0 && (
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  <Globe size={13} color="var(--accent-cyan)" />
                  <span>Language</span>
                </div>
                {selectedLanguage !== 'ALL' && (
                  <button
                    onClick={() => {
                      if (onLanguageModeSwitch) onLanguageModeSwitch('ALL');
                      else setSelectedLanguage('ALL');
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '11px', cursor: 'pointer' }}
                  >
                    Reset Filter
                  </button>
                )}
              </div>

              {/* Quick Language Pills (Telugu, Hindi, English) */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['ALL', 'Telugu', 'Hindi', 'English'].map(lang => {
                  const isSelected = selectedLanguage === lang;
                  return (
                    <button
                      key={lang}
                      onClick={() => {
                        if (onLanguageModeSwitch) onLanguageModeSwitch(lang);
                        else setSelectedLanguage(lang);
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-color)',
                        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                        color: isSelected ? '#818cf8' : 'var(--text-main)',
                        fontSize: '11px',
                        fontWeight: isSelected ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {lang === 'ALL' ? '🌐 All' : lang === 'Telugu' ? '🚩 Telugu' : lang === 'Hindi' ? '🇮🇳 Hindi' : '🇬🇧 English'}
                    </button>
                  );
                })}
              </div>

              {/* Full Languages Dropdown */}
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Languages ({languages.length})</option>
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Categories List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', fontWeight: 600, padding: '0 8px 8px 8px' }}>
              Categories ({categories.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {categories.map((cat) => {
                const IconComponent = CATEGORY_ICONS[cat] || Hash;
                const isSelected = activeTab === 'all' && selectedCategory === cat;
                const count = categoryCounts[cat] || 0;

                return (
                  <button
                    key={cat}
                    onClick={() => { setActiveTab('all'); setSelectedCategory(cat); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                      color: isSelected ? '#818cf8' : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: isSelected ? 600 : 400,
                      transition: 'all 0.15s ease',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      if (!isSelected) e.currentTarget.style.color = 'var(--text-main)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      if (!isSelected) e.currentTarget.style.color = 'var(--text-muted)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                      <IconComponent size={15} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat}</span>
                    </div>
                    <span style={{ fontSize: '11px', opacity: 0.6, backgroundColor: 'rgba(255, 255, 255, 0.06)', padding: '1px 6px', borderRadius: '10px' }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Footer Toggle Collapse */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="btn-icon"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <ChevronRight size={16} style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s' }} />
          {!collapsed && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Collapse Menu</span>}
        </button>
      </div>
    </aside>
  );
}
