import React, { useState } from 'react';
import VideoPlayer from './VideoPlayer';
import { LayoutGrid, Plus, X, Tv } from 'lucide-react';

export default function MultiView({
  channels,
  favorites,
  onToggleFavorite,
  corsProxy,
  setCorsProxy,
  multiViewMode,
  setMultiViewMode
}) {
  // Up to 4 active channels in MultiView
  const [activeChannels, setActiveChannels] = useState([
    channels[0] || null,
    channels[1] || null,
    channels[2] || null,
    channels[3] || null
  ]);
  const [selectingSlot, setSelectingSlot] = useState(null);

  const slotCount = multiViewMode === 'dual' ? 2 : 4;

  const handleSelectSlotChannel = (slotIndex, channel) => {
    const updated = [...activeChannels];
    updated[slotIndex] = channel;
    setActiveChannels(updated);
    setSelectingSlot(null);
  };

  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-base)', position: 'relative' }}>
      {/* Top MultiView Info Header */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LayoutGrid size={18} color="var(--accent)" />
          <h2 style={{ fontSize: '15px', color: '#E8FFF4' }}>
            Multi-View Mode ({slotCount} Channels)
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setMultiViewMode('dual')}
            className={`btn-icon ${multiViewMode === 'dual' ? 'active' : ''}`}
            style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px' }}
          >
            2 Channels
          </button>
          <button
            onClick={() => setMultiViewMode('quad')}
            className={`btn-icon ${multiViewMode === 'quad' ? 'active' : ''}`}
            style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px' }}
          >
            4 Channels
          </button>
          <button
            onClick={() => setMultiViewMode('single')}
            className="btn-icon"
            style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px' }}
          >
            Exit Multi-View
          </button>
        </div>
      </div>

      {/* Grid Layout of Players */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: multiViewMode === 'dual' ? '1fr 1fr' : '1fr 1fr',
          gridTemplateRows: multiViewMode === 'dual' ? '1fr' : '1fr 1fr',
          gap: '2px',
          backgroundColor: '#040706'
        }}
      >
        {Array.from({ length: slotCount }).map((_, index) => {
          const ch = activeChannels[index];

          return (
            <div key={index} style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: 'var(--bg-surface)', overflow: 'hidden' }}>
              {ch ? (
                <>
                  <VideoPlayer
                    channel={ch}
                    onToggleFavorite={onToggleFavorite}
                    isFavorite={favorites.some(f => f.id === ch.id)}
                    corsProxy={corsProxy}
                    setCorsProxy={setCorsProxy}
                  />
                  <button
                    onClick={() => setSelectingSlot(index)}
                    className="ctrl-btn"
                    style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 40, backgroundColor: 'rgba(0,0,0,0.7)' }}
                    title="Change Channel for this screen"
                  >
                    <Tv size={14} color="var(--accent)" />
                  </button>
                </>
              ) : (
                <div
                  onClick={() => setSelectingSlot(index)}
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    gap: '12px'
                  }}
                >
                  <Plus size={36} color="var(--accent)" />
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Select Channel for Screen {index + 1}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Channel Selection Overlay for Slot */}
      {selectingSlot !== null && (
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.88)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', flexDirection: 'column', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', color: '#E8FFF4' }}>Select Channel for Screen #{selectingSlot + 1}</h3>
            <button onClick={() => setSelectingSlot(null)} className="ctrl-btn">
              <X size={18} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
            {channels.slice(0, 100).map(c => (
              <div
                key={c.id || c.url}
                onClick={() => handleSelectSlotChannel(selectingSlot, c)}
                className="ch-grid-card"
                style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <Tv size={16} color="var(--accent)" />
                <span style={{ fontSize: '13px', color: '#E8FFF4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
