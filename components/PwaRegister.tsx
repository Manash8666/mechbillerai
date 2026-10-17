'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[MotoBan PWA] Service Worker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.warn('[MotoBan PWA] Service Worker registration failed:', error);
          });
      });
    }
  }, []);

  return null;
}
