import { useState, useEffect } from 'react';

/**
 * OfflineBanner — shows a sticky banner when the device goes offline.
 */
export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const goOffline = () => {
      setIsOffline(true);
      setWasOffline(true);
    };
    const goOnline = () => {
      setIsOffline(false);
      // Show "back online" briefly
      setTimeout(() => setWasOffline(false), 3000);
    };

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!isOffline && !wasOffline) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 text-center text-sm font-medium py-2 px-4 transition-all duration-300 ${
        isOffline
          ? 'bg-red-600/90 text-white'
          : 'bg-emerald-600/90 text-white'
      }`}
      role="alert"
      aria-live="assertive"
    >
      {isOffline ? (
        <span>📡 You're offline — some features may be unavailable</span>
      ) : (
        <span>✅ Back online</span>
      )}
    </div>
  );
}
