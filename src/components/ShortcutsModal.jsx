import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

const SHORTCUTS = [
  { key: 'Space', action: 'Play / Pause stream' },
  { key: 'F', action: 'Toggle Fullscreen mode' },
  { key: 'M', action: 'Mute / Unmute audio' },
  { key: 'ArrowUp', action: 'Previous channel in list' },
  { key: 'ArrowDown', action: 'Next channel in list' },
  { key: 'S', action: 'Focus search input' },
  { key: '1', action: 'Switch to Single View' },
  { key: '2', action: 'Switch to Dual Multi-View' },
  { key: '4', action: 'Switch to Quad Multi-View' },
  { key: 'Esc', action: 'Close dialogs / exit full view' }
];

export default function ShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', borderRadius: '16px', padding: '24px', position: 'relative' }}>
        <button onClick={onClose} className="btn-icon" style={{ position: 'absolute', top: '16px', right: '16px' }}>
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <Keyboard size={24} color="var(--accent-primary)" />
          <h2 style={{ fontSize: '18px', color: '#fff' }}>Keyboard Shortcuts</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {SHORTCUTS.map((item) => (
            <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{item.action}</span>
              <kbd style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)', color: '#818cf8', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, fontFamily: 'monospace' }}>
                {item.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
