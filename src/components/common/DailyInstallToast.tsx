import React, { useState, useEffect, useRef } from 'react';
import { Download, X, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { ChuvadiLogo } from '../ChuvadiLogo';
import { InstallAppModal } from '../modals/InstallAppModal';

export const DailyInstallToast: React.FC = () => {
  const { isInstalled, isInstallable, install } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [progress, setProgress] = useState(100); // 100% down to 0% over 5 seconds
  const timerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    // 1. Check if user is already running inside an installed standalone PWA app
    const isStandalone = 
      typeof window !== 'undefined' && (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://')
      );

    if (isStandalone || isInstalled) {
      return;
    }

    // 2. Check if already displayed today (once per day)
    const todayStr = new Date().toISOString().split('T')[0];
    const STORAGE_KEY = 'chuvadi_daily_install_toast_date';
    const lastShown = localStorage.getItem(STORAGE_KEY);

    if (lastShown === todayStr) {
      return;
    }

    // Record that the toast was shown for today
    try {
      localStorage.setItem(STORAGE_KEY, todayStr);
    } catch {
      // Ignore storage errors in private browsing
    }

    // Show the small floating box
    setIsVisible(true);
    setProgress(100);

    const DURATION = 5000; // 5 seconds
    const TICK_INTERVAL = 50; // update bar every 50ms
    const step = (TICK_INTERVAL / DURATION) * 100;

    intervalRef.current = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - step));
    }, TICK_INTERVAL);

    timerRef.current = setTimeout(() => {
      setIsVisible(false);
      clearInterval(intervalRef.current);
    }, DURATION);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isInstalled]);

  const handleDismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsVisible(false);
  };

  const handleInstallClick = async () => {
    handleDismiss();
    if (isInstallable) {
      await install();
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {isVisible && (
        <aside
          id="daily-install-toast"
          role="status"
          aria-live="polite"
          aria-label="Install Chuvadi App"
          className="fixed top-4 right-3 sm:right-6 z-50 max-w-[21rem] w-full bg-[#121822]/95 backdrop-blur-md border border-amber-500/40 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden animate-in slide-in-from-top-3 duration-300 pointer-events-auto"
        >
          {/* Main Content Card */}
          <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#16202c] border border-slate-700/80 flex items-center justify-center p-1 shrink-0">
                <ChuvadiLogo size={32} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 leading-tight">
                  <span className="text-xs font-bold text-white truncate">Install Chuvadi</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 uppercase tracking-tight border border-amber-500/30">
                    App
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 truncate mt-0.5">
                  Add to home screen for quick offline access
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex items-center gap-1 py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs transition active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer"
                title="Install App"
              >
                <Download size={13} strokeWidth={2.5} />
                <span>Install</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Dismiss (auto-closes in 5s)"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* 5-second countdown progress bar */}
          <div className="h-1 w-full bg-slate-800/80 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </aside>
      )}

      {/* Manual Installation Guide Modal (Used when browser beforeinstallprompt is not directly firing, e.g. iOS Safari) */}
      <InstallAppModal 
        isOpen={showGuideModal} 
        onClose={() => setShowGuideModal(false)} 
      />
    </>
  );
};
