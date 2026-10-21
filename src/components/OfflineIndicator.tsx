import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-stone-900/90 text-white px-3.5 py-2 text-xs font-medium shadow-xl border border-stone-700 backdrop-blur-md no-print animate-in fade-in">
      <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
      <span>Modalità Offline — CJK Scribe funziona completamente in locale sul tuo dispositivo.</span>
    </div>
  );
};
