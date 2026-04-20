'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, X } from 'lucide-react';

/**
 * Banner that asks garage owners / admins to enable push notifications.
 * Shows once — dismissed permanently via localStorage.
 * Automatically subscribes after permission is granted.
 */
export default function PushPermissionBanner() {
  const [show, setShow] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    // Only show if push is supported and not already granted/denied
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    if (Notification.permission !== 'default') return;

    try {
      const dismissedAt = localStorage.getItem('push-banner-dismissed');
      if (dismissedAt) {
        const dismissCount = parseInt(localStorage.getItem('push-banner-dismiss-count') || '1');
        // After 2 dismissals — stop showing permanently
        if (dismissCount >= 2) return;
        // After first dismissal — wait 1 day before reminding
        const daysSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
        if (daysSince < 1) return;
      }
    } catch {}

    // Show after a short delay
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleEnable = useCallback(async () => {
    // Hide banner immediately — subscription continues in background
    setShow(false);
    try {
      localStorage.setItem('push-banner-dismissed', String(Date.now()));
      localStorage.setItem('push-banner-dismiss-count', '99');
    } catch {}

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Get VAPID public key from server
        const keyRes = await fetch('/api/push/subscribe');
        const keyData = await keyRes.json();
        if (!keyData.publicKey) throw new Error('No VAPID key');

        // Subscribe via Service Worker
        const reg = await navigator.serviceWorker.ready;
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(keyData.publicKey) as unknown as ArrayBuffer,
        });

        // Send subscription to server
        const subJson = subscription.toJSON();
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subJson.endpoint,
            keys: subJson.keys,
          }),
        });
      }
    } catch (err) {
      console.error('Push subscription failed:', err);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setShow(false);
    try {
      const count = parseInt(localStorage.getItem('push-banner-dismiss-count') || '0') + 1;
      localStorage.setItem('push-banner-dismissed', String(Date.now()));
      localStorage.setItem('push-banner-dismiss-count', String(count));
    } catch {}
  }, []);

  if (!show) return null;

  return (
    <div dir="rtl" className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 mb-4 animate-in slide-in-from-top duration-300">
      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
        <Bell size={20} className="text-blue-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-gray-800">הפעל התראות</p>
        <p className="text-xs text-gray-500">תזכורות לטסט, ביטוח, תורים ועדכוני טיפולים</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleEnable}
          disabled={subscribing}
          className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {subscribing ? 'מפעיל...' : 'הפעל'}
        </button>
        <button onClick={handleDismiss} className="p-1 text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

/** Convert base64url VAPID key to Uint8Array for pushManager.subscribe */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
