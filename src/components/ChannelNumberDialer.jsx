import React, { useState, useEffect } from 'react';
import { Hash, X, Play, Delete, ArrowRight } from 'lucide-react';
import { analytics } from '../services/analyticsService';

export default function ChannelNumberDialer({
  isOpen,
  onClose,
  allChannels = [],
  onSelectChannel
}) {
  const [dialed, setDialed] = useState('');

  const num = parseInt(dialed, 10);
  const matchedChannel = !isNaN(num)
    ? allChannels.find(c => c.channelNumber === num)
    : null;

  const handleDigit = (digit) => {
    if (dialed.length < 3) {
      const next = dialed + digit;
      setDialed(next);
      const targetNum = parseInt(next, 10);
      const ch = allChannels.find(c => c.channelNumber === targetNum);
      if (ch && next.length === 3) {
        setTimeout(() => {
          onSelectChannel(ch);
          analytics.channelNumberDialed(targetNum);
          onClose();
          setDialed('');
        }, 400);
      }
    }
  };

  const handleBackspace = () => {
    setDialed(prev => prev.slice(0, -1));
  };

  const handleTune = () => {
    if (matchedChannel) {
      onSelectChannel(matchedChannel);
      analytics.channelNumberDialed(matchedChannel.channelNumber);
      onClose();
      setDialed('');
    }
  };

  // Keyboard number listener when modal is open
  useEffect(() => {
    if (!isOpen) { setDialed(''); return; }

    const handleKey = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        handleTune();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, dialed, matchedChannel]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box channel-dialer-modal">
        <button onClick={onClose} className="modal-close">
          <X size={18} />
        </button>

        <div className="dialer-header">
          <Hash size={20} color="var(--accent-light)" />
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Enter Channel Number</h3>
        </div>

        {/* Dialed Display Box */}
        <div className="dialer-display">
          <div className="dialed-digits">
            {dialed ? dialed.padStart(3, '0') : '___'}
          </div>
          <div className="dialed-channel-preview">
            {matchedChannel ? (
              <span className="preview-found">
                🟢 {matchedChannel.name} ({matchedChannel.quality || 'HD'})
              </span>
            ) : dialed ? (
              <span className="preview-notfound">No channel #{dialed}</span>
            ) : (
              <span className="preview-prompt">Type 1-3 digits or use keypad below</span>
            )}
          </div>
        </div>

        {/* 1-9 Numeric Keypad (TV Remote Style) */}
        <div className="dialer-keypad-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
            <button
              key={d}
              className="keypad-digit-btn"
              onClick={() => handleDigit(String(d))}
            >
              {d}
            </button>
          ))}
          <button
            className="keypad-digit-btn fn"
            onClick={handleBackspace}
            title="Delete digit"
          >
            <Delete size={18} />
          </button>
          <button
            className="keypad-digit-btn"
            onClick={() => handleDigit('0')}
          >
            0
          </button>
          <button
            className="keypad-digit-btn tune"
            onClick={handleTune}
            disabled={!matchedChannel}
            title="Tune into channel"
          >
            <ArrowRight size={20} />
          </button>
        </div>

        {matchedChannel && (
          <button onClick={handleTune} className="btn-primary" style={{ width: '100%', marginTop: 14 }}>
            <Play size={16} fill="currentColor" />
            <span>Tune to {matchedChannel.name}</span>
          </button>
        )}
      </div>
    </div>
  );
}
