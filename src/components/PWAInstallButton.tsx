import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Check } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'button' | 'badge' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'compact',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running inside standalone PWA mode, don't show
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'button') {
      return (
        <button
          type="button"
          onClick={install}
          className={`flex items-center gap-2 rounded-lg bg-amber-800 px-3.5 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-amber-900 transition-colors ${className}`}
          title="Installa CJK Scribe come app autonoma (PWA)"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Installa App</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={install}
        className={`flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors shadow-2xs ${className}`}
        title="Installa CJK Scribe sulla schermata home o sul computer per usarla a schermo intero e offline"
      >
        <Smartphone className="w-3.5 h-3.5 text-amber-800" />
        <span className="hidden sm:inline">Installa PWA</span>
        <span className="sm:hidden">Installa</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100 transition-colors shadow-2xs ${className}`}
          title="Installa su iPhone o iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-800" />
          <span>Installa su iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 no-print animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-stone-200">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-amber-800" />
                  <h3 className="text-base font-bold text-stone-900">
                    Installa su iPhone / iPad
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-stone-600 leading-relaxed">
                <p className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-xs font-bold shrink-0">
                    1
                  </span>
                  <span>
                    Tocca il pulsante <strong>Condividi</strong> (icona quadrato con freccia verso l'alto) nella barra di Safari in basso.
                  </span>
                </p>
                <p className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-xs font-bold shrink-0">
                    2
                  </span>
                  <span>
                    Scorri le opzioni verso il basso e seleziona <strong>Aggiungi alla schermata Home</strong>.
                  </span>
                </p>
                <p className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-xs font-bold shrink-0">
                    3
                  </span>
                  <span>
                    Conferma con <strong>Aggiungi</strong> in alto a destra: CJK Scribe si aprirà a schermo intero come una vera app nativa!
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-amber-800 py-2.5 text-sm font-semibold text-white hover:bg-amber-900 transition-colors shadow-xs"
              >
                Ho capito
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
