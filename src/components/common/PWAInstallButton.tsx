import React, { useState } from 'react';
import { Download, Smartphone, Check, X, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'banner';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = ''
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);

  // If already installed as a standalone app, hide the prompt
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // In mobile Chrome or desktop where beforeinstallprompt hasn't fired yet or was dismissed
      setShowAndroidGuide(true);
    }
  };

  return (
    <>
      {variant === 'compact' && (
        <button
          onClick={handleInstallClick}
          title="Install Chuvadi App"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition shadow-sm ${className}`}
        >
          <Download size={14} className="text-amber-400" />
          <span className="hidden sm:inline">Install App</span>
          <span className="sm:hidden">Install</span>
        </button>
      )}

      {variant === 'full' && (
        <button
          onClick={handleInstallClick}
          className={`w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 text-amber-200 hover:border-amber-500/50 hover:bg-amber-500/20 transition ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300">
              <Download size={18} />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white">Install Chuvadi on Phone</div>
              <div className="text-[11px] text-slate-400">Add to home screen for full offline access</div>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-500/20 rounded-lg text-amber-300">
            {isInstallable ? 'Install Now' : 'How to Install'}
          </span>
        </button>
      )}

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[#121824] border border-slate-700 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone size={18} className="text-amber-400" />
                <h3 className="text-sm font-bold text-white">Install on iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 shrink-0">
                  <Share2 size={16} />
                </div>
                <div>
                  <strong className="text-white block mb-0.5">1. Tap Share</strong>
                  In Safari bottom toolbar, tap the <strong>Share</strong> button (box with upward arrow).
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                  <PlusSquare size={16} />
                </div>
                <div>
                  <strong className="text-white block mb-0.5">2. Add to Home Screen</strong>
                  Scroll down the action sheet and tap <strong>Add to Home Screen</strong>.
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                  <Check size={16} />
                </div>
                <div>
                  <strong className="text-white block mb-0.5">3. Done!</strong>
                  Tap <strong>Add</strong> in the top-right. Chuvadi launches like a native app without browser bars.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-semibold text-white transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Chrome Android Guide Modal */}
      {showAndroidGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[#121824] border border-slate-700 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone size={18} className="text-amber-400" />
                <h3 className="text-sm font-bold text-white">Install on Android Chrome</h3>
              </div>
              <button
                onClick={() => setShowAndroidGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-300">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2">
                <p>
                  To install Chuvadi directly from Google Chrome:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-200">
                  <li>Tap the <strong>three dots (⋮)</strong> menu in the top-right corner of Chrome.</li>
                  <li>Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                  <li>Tap <strong>Install</strong> to confirm.</li>
                </ol>
              </div>
              <p className="text-[11px] text-slate-400">
                Once installed, Chuvadi appears on your device home screen and app drawer with fast standalone loading and offline support.
              </p>
            </div>

            <button
              onClick={() => setShowAndroidGuide(false)}
              className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 py-2.5 text-xs font-semibold text-slate-950 transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
