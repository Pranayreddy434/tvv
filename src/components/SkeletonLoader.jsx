import React from 'react';

export function SkeletonCard({ count = 8, viewLayout = 'grid' }) {
  return (
    <div className={`channel-cards-wrapper ${viewLayout === 'grid' ? 'grid-mode' : 'list-mode'}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="skeleton-card">
          <div className="skeleton-topbar shimmer" />
          <div className="skeleton-logo shimmer" />
          <div className="skeleton-line shimmer" style={{ width: '75%', height: 14, margin: '8px auto 4px' }} />
          <div className="skeleton-line shimmer" style={{ width: '45%', height: 11, margin: '0 auto' }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="skeleton-hero shimmer">
      <div style={{ height: 24, width: 140, borderRadius: 6, marginBottom: 16 }} className="shimmer" />
      <div style={{ height: 42, width: 280, borderRadius: 8, marginBottom: 12 }} className="shimmer" />
      <div style={{ height: 18, width: 200, borderRadius: 6, marginBottom: 20 }} className="shimmer" />
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ height: 44, width: 130, borderRadius: 8 }} className="shimmer" />
        <div style={{ height: 44, width: 110, borderRadius: 8 }} className="shimmer" />
      </div>
    </div>
  );
}
