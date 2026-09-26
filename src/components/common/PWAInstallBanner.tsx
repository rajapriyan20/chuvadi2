import React, { useState } from 'react';
import { Download, X, Smartphone, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { ChuvadiLogo } from '../ChuvadiLogo';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('chuvadi_install_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });
  const [isInstalling, setIsInstalling] = useState(false);

  // STRICT REQUIREMENT: Appears ONLY when the browser detects it's installable via 'beforeinstallprompt' event
  if (!isInstallable || isInstalled || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('chuvadi_install_banner_dismissed', 'true');
    } catch {
      // Ignore sessionStorage errors
    }
  };

  const handleAddToHomeScreen = async () => {
    setIsInstalling(true);
    try {
      // Triggers browser's native PWA installation dialog via deferredPrompt.prompt()
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div 
      id="pwa-install-banner"
      className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-40 animate-in slide-in-from-bottom duration-300 pointer-events-auto"
      role="region"
      aria-label="Install App Banner"
    >
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#121822]/95 backdrop-blur-md border border-amber-500/30 shadow-2xl shadow-black/80 flex flex-col gap-3">
        {/* Banner Top: App Identity + Dismiss Button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-1 rounded-xl bg-amber-500/10 border border-amber-500/20 shrink-0">
              <ChuvadiLogo size={36} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-sm font-bold text-white leading-tight">Install Chuvadi</h4>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 uppercase tracking-wide leading-none border border-amber-500/30">
                  Ready to Install
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                Add to your home screen for quick offline access and full-screen view.
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1.5 -mr-1 -mt-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0 cursor-pointer"
            title="Dismiss banner"
            aria-label="Dismiss banner"
          >
            <X size={16} />
          </button>
        </div>

        {/* Banner Actions: Dismiss & Add to Home Screen */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition active:scale-95 cursor-pointer"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={handleAddToHomeScreen}
            disabled={isInstalling}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/25 active:scale-95 cursor-pointer disabled:opacity-60"
          >
            <Download size={14} strokeWidth={2.5} className={isInstalling ? 'animate-bounce' : ''} />
            <span>Add to Home Screen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
