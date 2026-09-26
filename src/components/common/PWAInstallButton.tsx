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
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm p-3 sm:p-4 flex flex-col items-center justify-center animate-in fade-in"
          onClick={() => setShowIOSGuide(false)}
        >
          <div 
            className="w-full max-w-sm rounded-2xl bg-[#121824] border border-slate-700 shadow-2xl my-auto max-h-[calc(100dvh-1.5rem)] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#151c28] shrink-0">
              <div className="flex items-center gap-2">
                <Smartphone size={18} className="text-amber-400" />
                <h3 className="text-sm font-bold text-white">Install on iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 text-xs text-slate-300">
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

            <div className="p-3 border-t border-slate-800/80 bg-[#10151f] shrink-0">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-semibold text-white transition active:scale-95"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chrome Android Guide Modal */}
      {showAndroidGuide && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm p-3 sm:p-4 flex flex-col items-center justify-center animate-in fade-in"
          onClick={() => setShowAndroidGuide(false)}
        >
          <div 
            className="w-full max-w-sm rounded-2xl bg-[#121824] border border-slate-700 shadow-2xl my-auto max-h-[calc(100dvh-1.5rem)] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#151c28] shrink-0">
              <div className="flex items-center gap-2">
                <Smartphone size={18} className="text-amber-400" />
                <h3 className="text-sm font-bold text-white">Install on Android Chrome</h3>
              </div>
              <button
                onClick={() => setShowAndroidGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 text-xs text-slate-300">
              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <p className="font-semibold text-amber-200">
                  To install Chuvadi directly from Google Chrome:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-slate-200">
                  <li className="leading-relaxed">Tap the <strong className="text-white">three dots (⋮)</strong> menu in the top-right corner of Chrome.</li>
                  <li className="leading-relaxed">Select <strong className="text-amber-300">Install app</strong> or <strong className="text-amber-300">Add to Home screen</strong>.</li>
                  <li className="leading-relaxed">Tap <strong className="text-white">Install</strong> to confirm.</li>
                </ol>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Once installed, Chuvadi appears on your device home screen and app drawer with fast standalone loading and offline support.
              </p>
            </div>

            <div className="p-3 border-t border-slate-800/80 bg-[#10151f] shrink-0">
              <button
                onClick={() => setShowAndroidGuide(false)}
                className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 py-2.5 text-xs font-bold text-slate-950 transition active:scale-95 shadow-md shadow-amber-500/20"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
