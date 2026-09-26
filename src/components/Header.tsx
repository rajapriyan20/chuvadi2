import React, { useState } from 'react';
import { 
  Plus, 
  LogIn, 
  LogOut, 
  User as UserIcon,
  Menu,
  Eye,
  ArrowLeft,
  X
} from 'lucide-react';
import { ChuvadiLogo } from './ChuvadiLogo';
import { WhatsAppLogo } from './common/WhatsAppLogo';
import { PWAInstallButton } from './common/PWAInstallButton';
import type { User } from 'firebase/auth';

interface HeaderProps {
  totalNetWorth: number;
  monthlyExpense: number;
  user: User | null;
  isOnline: boolean;
  isGuestMode?: boolean;
  onOpenQuickAdd: () => void;
  onOpenAi: () => void;
  onOpenExport?: () => void;
  onOpenSettings?: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onExitGuestMode?: () => void;
  onToggleSideMenu: () => void;
  unreadNotificationsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  totalNetWorth,
  monthlyExpense,
  user,
  isOnline,
  isGuestMode = false,
  onOpenQuickAdd,
  onOpenAi,
  onOpenExport,
  onOpenSettings,
  onLogin,
  onLogout,
  onExitGuestMode,
  onToggleSideMenu,
  unreadNotificationsCount = 0
}) => {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showLogoPopup, setShowLogoPopup] = useState(false);

  const handleLogoutClick = async () => {
    setIsSigningOut(true);
    try {
      await onLogout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleExitGuestClick = () => {
    if (onExitGuestMode) {
      onExitGuestMode();
    }
  };

  const handleLoginClick = async () => {
    setIsSigningIn(true);
    try {
      await onLogin();
    } catch (err: any) {
      if (
        err?.code !== 'auth/popup-closed-by-user' &&
        err?.code !== 'auth/cancelled-popup-request' &&
        err?.code !== 'auth/user-cancelled'
      ) {
        console.warn('Sign-in error:', err);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 transition-colors">
      {/* Top Credit & WhatsApp Announcement Bar */}
      <div className="bg-[#090d13] border-b border-slate-800/80 px-3 sm:px-6 lg:px-8 py-1.5 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 text-xs">
              developed by <strong className="text-slate-200 font-semibold">Rajapriyan</strong>
            </span>
            <a
              href="https://wa.me/919600001118"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center p-1 sm:p-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 transition active:scale-95 shadow-sm"
              title="Chat on WhatsApp (+91 9600001118)"
              aria-label="Chat on WhatsApp (+91 9600001118)"
            >
              <WhatsAppLogo size={14} />
            </a>
          </div>

          {/* Sync & Online Status Indicator */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 select-none">
            {isGuestMode ? (
              <div 
                className="flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/25 text-amber-300 font-medium"
                title="You are in Guest Mode with sample demo data. No changes are saved to the cloud."
              >
                <Eye size={11} className="text-amber-400" />
                <span className="text-[10px]">Guest Demo (Offline)</span>
              </div>
            ) : (
              <div 
                className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-800"
                title={isOnline ? 'Cloud database is connected and syncing live.' : 'Offline: Changes are saved locally.'}
              >
                <span className="relative flex h-2 w-2">
                  {isOnline ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  )}
                </span>
                <span className="text-[10px] font-medium text-slate-300">
                  {isOnline ? 'Cloud Live' : 'Offline'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="bg-[#0d1218]/95 backdrop-blur-md border-b border-amber-950/20 px-3 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
          {/* Hamburger Menu Trigger & Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              id="header-side-menu-trigger-btn"
              onClick={onToggleSideMenu}
              className="p-2 rounded-xl bg-[#161c24] hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-slate-800 transition active:scale-95 relative"
              title="Open Navigation Menu"
              aria-label="Toggle Side Menu Navigation"
            >
              <Menu size={20} />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-[#0d1218]" />
              )}
            </button>

            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Clickable Logo with WhatsApp DP-style popup trigger */}
              <button
                onClick={() => setShowLogoPopup(true)}
                className="relative rounded-2xl p-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 transition active:scale-95 cursor-pointer group shrink-0"
                title="Click to view logo"
                aria-label="View Chuvadi logo in full resolution"
              >
                <ChuvadiLogo size={36} />
                <div className="absolute inset-0 rounded-2xl bg-white/0 group-hover:bg-white/5 transition-colors" />
              </button>

              {/* App Heading & Tagline */}
              <div className="flex flex-col justify-center select-none">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                    Chuvadi
                  </span>
                  {isGuestMode && (
                    <span className="text-[9px] uppercase font-bold text-amber-400 bg-amber-400/10 px-1 py-0.2 rounded border border-amber-400/20 leading-none">
                      Demo
                    </span>
                  )}
                </div>
                <span className="text-[10px] sm:text-[11px] text-amber-300/80 font-medium tracking-tight mt-0.5 leading-tight">
                  A manuscript to track life!
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons & Profile Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Quick Record Button */}
            <button
              id="header-quick-add-btn"
              onClick={onOpenQuickAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition active:scale-95"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span className="hidden xs:inline">Record</span>
            </button>

            {/* PWA Install Button */}
            <PWAInstallButton variant="compact" />

            {/* Auth State Button */}
            {isGuestMode ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  id="header-exit-guest-btn"
                  onClick={handleExitGuestClick}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition active:scale-95 shadow-sm"
                  title="Exit Guest Mode and return to Welcome screen"
                >
                  <ArrowLeft size={13} />
                  <span>Exit Demo</span>
                </button>

                <button
                  id="header-login-btn"
                  onClick={handleLoginClick}
                  disabled={isSigningIn}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-xs font-bold transition active:scale-95 shadow-md shadow-amber-500/20"
                  title="Sign In with Google for Cloud Sync"
                >
                  <LogIn size={13} strokeWidth={2.5} />
                  <span>Sign In</span>
                </button>
              </div>
            ) : user ? (
              <button
                id="header-logout-btn"
                onClick={handleLogoutClick}
                disabled={isSigningOut}
                className="flex items-center gap-1.5 p-1.5 pr-2.5 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 text-xs border border-slate-700/60 transition active:scale-95 group"
                title={`Signed in as ${user.email || 'User'}. Click to sign out.`}
              >
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="User" 
                    className="w-5 h-5 rounded-full object-cover border border-slate-600 group-hover:border-rose-400" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserIcon size={14} className="text-amber-400 group-hover:text-rose-400" />
                )}
                <span className="text-[11px] font-medium hidden sm:inline max-w-[90px] truncate">
                  {user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'Account'}
                </span>
                <LogOut size={13} className="text-slate-400 group-hover:text-rose-400 transition" />
              </button>
            ) : (
              <button
                id="header-login-btn"
                onClick={handleLoginClick}
                disabled={isSigningIn}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition active:scale-95 shadow-sm"
                title="Sign In with Google for Cloud Sync"
              >
                <LogIn size={14} strokeWidth={2.5} />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* WhatsApp DP-style High-Resolution Logo Lightbox Modal */}
      {showLogoPopup && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md p-3 sm:p-6 flex flex-col items-center justify-center animate-in fade-in duration-200"
          onClick={() => setShowLogoPopup(false)}
        >
          <div 
            className="w-full max-w-sm sm:max-w-md bg-[#111722] border border-amber-500/25 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-[#141b26] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">Chuvadi</h3>
                  <p className="text-[10px] text-amber-300/80 leading-tight">A manuscript to track life!</p>
                </div>
              </div>
              <button
                onClick={() => setShowLogoPopup(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-95"
                title="Close"
                aria-label="Close Logo View"
              >
                <X size={18} />
              </button>
            </div>

            {/* High-Resolution SVG Logo Display (WhatsApp DP Style) */}
            <div className="p-6 sm:p-8 flex flex-col items-center justify-center bg-gradient-to-b from-[#151c27] via-[#0f141d] to-[#0c1017] relative select-none">
              <div className="absolute inset-0 bg-radial-gradient from-amber-500/10 via-transparent to-transparent pointer-events-none" />
              
              <div className="relative p-3 rounded-2xl bg-black/40 border border-amber-500/25 shadow-2xl flex items-center justify-center">
                <ChuvadiLogo size={280} />
              </div>

              {/* Sub-label description */}
              <div className="mt-5 text-center space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                  <span>சுவடி • Palm-Leaf Ledger</span>
                </div>
                <p className="text-xs text-slate-200 font-medium">
                  Inscribed with Tamil letters <strong className="text-amber-300">"கீ ர் த்"</strong> &amp; traditional stylus
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Inspired by ancient palm-leaf manuscripts crafted across eras to inscribe wisdom, deeds, accounts, and milestones.
                </p>
              </div>
            </div>

            {/* Bottom Dismiss Button */}
            <div className="p-3 border-t border-slate-800/80 bg-[#111722] shrink-0">
              <button
                onClick={() => setShowLogoPopup(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition active:scale-95"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
