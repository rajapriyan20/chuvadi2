import React from 'react';
import { ArrowLeft, Eye, LogIn } from 'lucide-react';

interface GuestModeOverlayProps {
  onExitGuestMode: () => void;
  onLogin?: () => void;
}

export const GuestModeOverlay: React.FC<GuestModeOverlayProps> = ({
  onExitGuestMode,
  onLogin,
}) => {
  return (
    <div 
      id="guest-mode-overlay-pill"
      className="fixed bottom-4 left-3 sm:left-6 z-30 pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-300"
      role="complementary"
      aria-label="Guest Demo Controls"
    >
      <div className="flex items-center gap-2 p-1.5 pl-3 pr-1.5 rounded-full bg-[#10151f]/95 hover:bg-[#141b27] border border-amber-500/35 shadow-2xl shadow-black/80 backdrop-blur-md transition-all select-none">
        {/* Pulsing indicator & label */}
        <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
          </span>
          <span className="hidden xs:inline">Guest Demo</span>
          <span className="xs:hidden">Demo</span>
        </div>

        <div className="h-3.5 w-px bg-slate-700/80" />

        {/* Exit Demo Action Button */}
        <button
          type="button"
          onClick={onExitGuestMode}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/90 hover:bg-rose-950/60 hover:text-rose-200 hover:border-rose-500/40 text-slate-300 border border-slate-700 text-xs font-semibold transition active:scale-95 cursor-pointer shadow-sm"
          title="Exit Guest Demo and return to Welcome screen"
          aria-label="Exit Guest Demo"
        >
          <ArrowLeft size={12} strokeWidth={2.5} />
          <span>Exit Demo</span>
        </button>

        {/* Optional Sign In Quick Trigger if onLogin provided */}
        {onLogin && (
          <button
            type="button"
            onClick={onLogin}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-semibold transition active:scale-95 cursor-pointer shadow-sm"
            title="Sign In with Google to sync to cloud"
          >
            <LogIn size={11} strokeWidth={2.5} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </div>
  );
};
