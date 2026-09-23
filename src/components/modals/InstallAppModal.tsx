import React, { useState, useEffect } from 'react';
import { 
  X, 
  Smartphone, 
  Download, 
  Share2, 
  MoreVertical, 
  PlusSquare, 
  CheckCircle2, 
  ExternalLink,
  Laptop
} from 'lucide-react';
import { ChuvadiLogo } from '../ChuvadiLogo';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activePlatform, setActivePlatform] = useState<'android' | 'ios' | 'desktop'>('android');

  useEffect(() => {
    // Detect if already installed / standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Detect user OS
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setActivePlatform('ios');
    } else if (/android/.test(ua)) {
      setActivePlatform('android');
    } else {
      setActivePlatform('desktop');
    }

    // Capture browser's native install prompt if available
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121820] w-full max-w-md rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#161d26]">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-base">
            <Smartphone size={18} />
            <span>Install Chuvadi App</span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          {/* App Branding Card */}
          <div className="flex items-center gap-3.5 p-3.5 bg-[#161c24] rounded-2xl border border-slate-800">
            <ChuvadiLogo size={46} />
            <div>
              <div className="text-base font-bold text-white flex items-center gap-2">
                <span>Chuvadi</span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                  PWA Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Full-screen app experience, instant offline launch, and no browser address bars!
              </p>
            </div>
          </div>

          {/* Already installed banner */}
          {isInstalled && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
              <span>Chuvadi is already running in standalone app mode on this device!</span>
            </div>
          )}

          {/* Instant Native 1-Click Install Button if supported by browser */}
          {deferredPrompt && (
            <button
              onClick={handleNativeInstall}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl text-sm font-bold transition shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <Download size={18} strokeWidth={2.5} />
              <span>Install to Home Screen (1-Tap)</span>
            </button>
          )}

          {/* Platform Switcher Tabs */}
          <div>
            <div className="flex rounded-xl bg-slate-900/80 p-1 border border-slate-800">
              <button
                onClick={() => setActivePlatform('android')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activePlatform === 'android'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Android (Chrome)
              </button>
              <button
                onClick={() => setActivePlatform('ios')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activePlatform === 'ios'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                iPhone / iPad (Safari)
              </button>
              <button
                onClick={() => setActivePlatform('desktop')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activePlatform === 'desktop'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Computer (PC/Mac)
              </button>
            </div>
          </div>

          {/* Instructions Step-by-Step */}
          <div className="bg-[#151c26] p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span>How to add to your Home Screen:</span>
            </div>

            {activePlatform === 'android' && (
              <ol className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Tap the <strong className="text-white">three dots menu (<MoreVertical size={13} className="inline -mt-0.5" />)</strong> in the top-right corner of Chrome.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Tap <strong className="text-amber-300">"Install app"</strong> or <strong className="text-amber-300">"Add to Home screen"</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Confirm <strong className="text-white">"Install"</strong>. The Chuvadi app icon will appear right on your phone's app drawer and home screen!
                  </span>
                </li>
              </ol>
            )}

            {activePlatform === 'ios' && (
              <ol className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Open this page in <strong className="text-white">Safari</strong> and tap the <strong className="text-white">Share button (<Share2 size={13} className="inline -mt-0.5 text-sky-400" />)</strong> at the bottom.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Scroll down and tap <strong className="text-amber-300">"Add to Home Screen"</strong> (<PlusSquare size={13} className="inline -mt-0.5 text-amber-400" />).
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Tap <strong className="text-white">"Add"</strong> in the top right. It will now launch as a dedicated standalone iOS app without Safari controls.
                  </span>
                </li>
              </ol>
            )}

            {activePlatform === 'desktop' && (
              <ol className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    In Chrome or Edge, click the <strong className="text-amber-300">Install icon (<Download size={13} className="inline -mt-0.5 text-amber-400" />)</strong> in the URL address bar.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Click <strong className="text-white">"Install"</strong>. Chuvadi will open in its own clean window and be pinned to your Taskbar / Dock.
                  </span>
                </li>
              </ol>
            )}
          </div>

          {/* Benefits summary */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
            <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800">
              <span className="text-slate-200 font-semibold block">⚡ Instant Launch</span>
              Launches like a native app with zero browser clutter.
            </div>
            <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800">
              <span className="text-slate-200 font-semibold block">📶 Works Offline</span>
              Cached local mirror ensures access anytime, anywhere.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
