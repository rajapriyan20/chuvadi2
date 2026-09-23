import React, { useState } from 'react';
import { 
  Plus, 
  Sparkles, 
  Download, 
  Settings as SettingsIcon, 
  LogIn, 
  LogOut, 
  User as UserIcon,
  Menu,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ChuvadiLogo } from './ChuvadiLogo';
import { WhatsAppLogo } from './common/WhatsAppLogo';
import type { User } from 'firebase/auth';

interface HeaderProps {
  totalNetWorth: number;
  monthlyExpense: number;
  user: User | null;
  isOnline: boolean;
  onOpenQuickAdd: () => void;
  onOpenAi: () => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onToggleSideMenu: () => void;
  unreadNotificationsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  totalNetWorth,
  monthlyExpense,
  user,
  isOnline,
  onOpenQuickAdd,
  onOpenAi,
  onOpenExport,
  onOpenSettings,
  onLogin,
  onLogout,
  onToggleSideMenu,
  unreadNotificationsCount = 0
}) => {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showStatusTooltip, setShowStatusTooltip] = useState(false);

  const handleLogoutClick = async () => {
    const userEmail = user?.email || 'your account';
    if (window.confirm(`Sign out from ${userEmail}?`)) {
      setIsSigningOut(true);
      try {
        await onLogout();
      } catch (err) {
        console.error('Logout error:', err);
      } finally {
        setIsSigningOut(false);
      }
    }
  };

  const handleLoginClick = async () => {
    setIsSigningIn(true);
    try {
      await onLogin();
    } catch (err) {
      console.error('Login error:', err);
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

          {/* Sync & Online Status Indicator with descriptive label */}
          <div 
            className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer select-none"
            onClick={() => setShowStatusTooltip(prev => !prev)}
            title={isOnline ? 'Cloud database is connected and syncing live.' : 'Offline: Changes are saved locally and will sync when reconnected.'}
          >
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-800">
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

            <div className="flex items-center gap-2.5">
              <ChuvadiLogo size={32} />
              <div className="hidden xs:block">
                <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                  Chuvadi
                  <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20">
                    Life OS
                  </span>
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

            {/* Export Data */}
            <button
              id="header-export-btn"
              onClick={onOpenExport}
              className="p-2 rounded-xl bg-[#161c24] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
              title="Export CSV / JSON Backup"
            >
              <Download size={16} />
            </button>

            {/* Settings */}
            <button
              id="header-settings-btn"
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-[#161c24] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
              title="Application Settings"
            >
              <SettingsIcon size={16} />
            </button>

            {/* Auth State Button */}
            {user ? (
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
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition font-medium active:scale-95"
                title="Sign In with Google for Cloud Sync"
              >
                <LogIn size={14} className="text-amber-400" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
