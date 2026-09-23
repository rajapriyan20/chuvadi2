import React, { useState } from 'react';
import { 
  LogIn, 
  ShieldCheck, 
  Sparkles, 
  Flame, 
  Car, 
  Wallet, 
  CheckCircle2, 
  Lock,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { ChuvadiLogo } from '../ChuvadiLogo';
import { WhatsAppLogo } from './WhatsAppLogo';

interface AuthScreenProps {
  onLogin: () => Promise<any>;
  onContinueAsGuest?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onContinueAsGuest }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onLogin();
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.code === 'auth/user-cancelled'
      ) {
        // User closed or dismissed the popup voluntarily
        return;
      }
      if (err?.code === 'auth/popup-blocked') {
        setError('The sign-in popup was blocked by your browser. Please allow popups for this site and try again.');
        return;
      }
      console.warn('Sign-in attempt failed:', err);
      setError(err?.message || 'Failed to sign in. Please check your network or try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d12] text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 selection:bg-amber-500 selection:text-slate-950">
      {/* Top Bar with Developer attribution & WhatsApp */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">developed by</span>
          <strong className="text-slate-300 font-semibold">Rajapriyan</strong>
          <a
            href="https://wa.me/919600001118"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center p-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 transition ml-1"
            title="Chat on WhatsApp (+91 9600001118)"
          >
            <WhatsAppLogo size={13} />
          </a>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
          <Lock size={12} className="text-amber-400" />
          <span>Private & Encrypted</span>
        </div>
      </div>

      {/* Main Center Auth Card */}
      <div className="w-full max-w-md mx-auto my-auto py-8">
        <div className="bg-[#121820] border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative overflow-hidden backdrop-blur-xl">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-20 -right-20 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Logo & App Title */}
          <div className="flex flex-col items-center text-center mb-7">
            <div className="p-3 bg-[#161c24] rounded-2xl border border-slate-800 shadow-inner mb-3">
              <ChuvadiLogo size={56} />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Chuvadi</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Life OS
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 max-w-xs leading-relaxed">
              Personal finance ledger, garage & vehicle manager, daily checklists, and exercise tracking.
            </p>
          </div>

          {/* Security & Feature Badges */}
          <div className="space-y-2.5 mb-7 bg-[#0d1218] p-3.5 rounded-2xl border border-slate-800/70">
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck size={14} />
              </div>
              <span>Secured with your personal Google account</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                <Sparkles size={14} />
              </div>
              <span>Cloud synchronization across phone & laptop</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                <Lock size={14} />
              </div>
              <span>Atomic transactions & offline cached mirror</span>
            </div>
          </div>

          {/* Error Message if any */}
          {error && (
            <div className="mb-4 p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-2xl transition shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign In with Google</span>
                </>
              )}
            </button>

            {onContinueAsGuest && (
              <button
                onClick={onContinueAsGuest}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-2xl border border-slate-800 transition"
              >
                <span>Preview / Explore in Guest Mode</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Feature Icons Strip */}
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div className="p-2.5 rounded-2xl bg-[#0d1218] border border-slate-800/60">
            <Wallet size={16} className="text-amber-400 mx-auto mb-1" />
            <div className="text-[11px] font-medium text-slate-300">Finance & Cash</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-[#0d1218] border border-slate-800/60">
            <Car size={16} className="text-sky-400 mx-auto mb-1" />
            <div className="text-[11px] font-medium text-slate-300">Garage & Fuel</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-[#0d1218] border border-slate-800/60">
            <Flame size={16} className="text-emerald-400 mx-auto mb-1" />
            <div className="text-[11px] font-medium text-slate-300">Fitness Logs</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-slate-600 py-2">
        <span>© {new Date().getFullYear()} Chuvadi • All rights reserved</span>
      </div>
    </div>
  );
};
