import React from 'react';
import { X, Keyboard } from 'lucide-react';

const SHORTCUTS = [
  { key: 'Space', action: 'Play / Pause stream' },
  { key: 'F', action: 'Toggle Fullscreen mode' },
  { key: 'M', action: 'Mute / Unmute audio' },
  { key: 'P', action: 'Open playlist loader' },
  { key: '? or /', action: 'Show this shortcuts panel' },
  { key: 'Esc', action: 'Exit fullscreen / Close modals' },
];

export default function ShortcutsModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 420 }}>
        <h2 className="modal-title">
          <Keyboard size={20} color="var(--accent-light)" />
          Keyboard Shortcuts
        </h2>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SHORTCUTS.map(s => (
            <div key={s.key} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)', border: '1px solid var(--border)'
            }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{s.action}</span>
              <kbd style={{
                padding: '3px 8px', borderRadius: 6,
                background: 'var(--bg-hover)', border: '1px solid var(--border-hover)',
                color: '#a78bfa', fontSize: 12, fontWeight: 700,
                fontFamily: 'monospace'
              }}>{s.key}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
