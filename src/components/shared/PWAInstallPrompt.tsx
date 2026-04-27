'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * PWA Install Prompt + Service Worker Registration
 * Shows a Hebrew install banner when the app can be installed
 */
export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Register Service Worker with update handling
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        // Check for updates every 30 minutes
        setInterval(() => reg.update(), 30 * 60 * 1000);

        // When a new SW is waiting, tell it to activate immediately
        const onStateChange = () => {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        };

        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing;
          if (newSW) {
            newSW.addEventListener('statechange', onStateChange);
          }
        });

        // Reload when the new SW takes over
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        });
      }).catch(() => {
        /* SW registration failed — non-fatal */
      });
    }

    // Check if already installed — multiple detection methods
    const isRunningAsApp =
      window.matchMedia('(display-mode: standalone)').matches ||   // Android Chrome PWA
      window.matchMedia('(display-mode: fullscreen)').matches ||   // TWA mode
      window.matchMedia('(display-mode: minimal-ui)').matches ||   // Some PWA launchers
      (navigator as unknown as { standalone?: boolean }).standalone === true || // iOS Safari
      document.referrer.includes('android-app://');                 // Android TWA referrer

    if (isRunningAsApp) {
      setIsInstalled(true);
      // Persist so we never prompt again even if detection fails later
      try { localStorage.setItem('pwa-installed', '1'); } catch {}
      return;
    }

    // Check if we previously detected installation
    try {
      if (localStorage.getItem('pwa-installed') === '1') {
        setIsInstalled(true);
        return;
      }
    } catch {}

    // Check if user already dismissed twice — stop showing
    try {
      const dismissCount = parseInt(localStorage.getItem('pwa-dismiss-count') || '0', 10);
      if (dismissCount >= 2) return;
    } catch {}

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show banner after 8 seconds of usage
      setTimeout(() => setShowBanner(true), 8000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful install
    const installedHandler = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
      try { localStorage.setItem('pwa-installed', '1'); } catch {}
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setShowBanner(false);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    setDeferredPrompt(null);
    // Increment dismiss counter — stop showing after 2 dismissals
    try {
      const count = parseInt(localStorage.getItem('pwa-dismiss-count') || '0', 10);
      localStorage.setItem('pwa-dismiss-count', String(count + 1));
    } catch {}
  }, []);

  if (isInstalled || !showBanner || !deferredPrompt) return null;

  return (
    <div
      dir="rtl"
      className="fixed bottom-20 lg:bottom-4 left-4 right-4 mx-auto max-w-md z-50 animate-in slide-in-from-bottom duration-500"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 flex items-center gap-3">
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">התקן את AutoLog</p>
          <p className="text-xs text-gray-500">גישה מהירה ישירות מהמסך שלך</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={handleInstall}
            className="px-4 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            התקן
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-1 text-gray-400 text-xs hover:text-gray-600 transition-colors"
          >
            לא עכשיו
          </button>
        </div>
      </div>
    </div>
  );
}
