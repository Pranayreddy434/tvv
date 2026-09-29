import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('tvv_install_dismissed') === 'true');
  useEffect(() => {
    const handler = event => { event.preventDefault(); setDeferredPrompt(event); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  if (!deferredPrompt || dismissed) return null;
  return <div className="install-prompt"><Download size={17} /><span><b>Install TVV</b><small>Watch like an app, even from your home screen.</small></span><button onClick={async () => { deferredPrompt.prompt(); await deferredPrompt.userChoice; setDeferredPrompt(null); }}>Install</button><button aria-label="Dismiss install" onClick={() => { localStorage.setItem('tvv_install_dismissed', 'true'); setDismissed(true); }}><X size={16} /></button></div>;
}
