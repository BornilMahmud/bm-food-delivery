import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }> };

const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
};

export const InstallPrompt: React.FC = () => {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosFallback, setIosFallback] = useState(false);

  useEffect(() => {
    if (isStandalone() || window.localStorage.getItem('bm-food-install-dismissed') === '1') return;
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent) && !('MSStream' in window);
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
      setVisible(true);
    };
    const onAppInstalled = () => {
      setVisible(false);
      setInstallEvent(null);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    if (isIos) {
      setIosFallback(true);
      setVisible(true);
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  if (!visible) return null;

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === 'accepted') setVisible(false);
    setInstallEvent(null);
  };

  const dismiss = () => {
    window.localStorage.setItem('bm-food-install-dismissed', '1');
    setVisible(false);
  };

  return (
    <aside className="bm-install-prompt" aria-label="Install BM Food Delivery">
      <div className="flex min-w-0 items-center gap-3">
        <img src="/bm-food-delivery-logo.png" alt="" className="h-11 w-11 shrink-0 rounded-xl bg-white object-cover" />
        <div className="min-w-0">
          <p className="truncate text-xs font-black text-[var(--bm-cream)]">Install BM Food Delivery</p>
          <p className="mt-0.5 text-[10px] leading-4 text-[var(--bm-ink-soft)]">Keep your orders one tap away.</p>
          {iosFallback && !installEvent && <p className="mt-1 text-[10px] leading-4 text-[var(--bm-saffron)]">Use Share, then “Add to Home Screen”.</p>}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        {installEvent && <button type="button" onClick={handleInstall} className="bm-button min-h-9 flex-1 px-3 py-2 text-[10px]"><Download className="h-3.5 w-3.5" /> Install app</button>}
        <button type="button" onClick={dismiss} aria-label="Dismiss install prompt" className="bm-button-secondary min-h-9 px-3 py-2 text-[10px]"><X className="h-3.5 w-3.5" /> Later</button>
      </div>
    </aside>
  );
};
