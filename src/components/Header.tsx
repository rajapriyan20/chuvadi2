import React, { useState } from 'react';
import { 
  LogIn, 
  LogOut, 
  User as UserIcon,
  Menu,
  Eye,
  Bell
} from 'lucide-react';
import { ChuvadiLogo } from './ChuvadiLogo';
import { WhatsAppLogo } from './common/WhatsAppLogo';
import { LogoModal } from './common/LogoModal';
import { LogoutConfirmModal } from './modals/LogoutConfirmModal';
import type { User } from 'firebase/auth';
import type { ActiveTab } from '../types';

interface HeaderProps {
  totalNetWorth: number;
  monthlyExpense: number;
  user: User | null;
  isOnline: boolean;
  isGuestMode?: boolean;
  activeTab?: ActiveTab;
  isRootTab?: boolean;
  onBackToDashboard?: () => void;
  onCloseApp?: () => void;
  onOpenQuickAdd?: () => void;
  onOpenAi: () => void;
  onOpenExport?: () => void;
  onOpenSettings?: () => void;
  onOpenNotificationSettings?: () => void;
  onOpenNotifications?: () => void;
  notificationsEnabled?: boolean;
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
  activeTab = 'dashboard',
  isRootTab = activeTab === 'dashboard',
  onBackToDashboard: _onBackToDashboard,
  onCloseApp,
  onOpenQuickAdd,
  onOpenAi,
  onOpenExport,
  onOpenSettings,
  onOpenNotificationSettings,
  onOpenNotifications,
  notificationsEnabled = false,
  onLogin,
  onLogout,
  onExitGuestMode,
  onToggleSideMenu,
  unreadNotificationsCount = 0
}) => {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showLogoPopup, setShowLogoPopup] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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

  const handleBellClick = () => {
    if (!notificationsEnabled) {
      if (onOpenNotificationSettings) onOpenNotificationSettings();
    } else {
      if (onOpenNotifications) onOpenNotifications();
      else if (onOpenNotificationSettings) onOpenNotificationSettings();
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
              <button
                type="button"
                onClick={handleExitGuestClick}
                className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/25 hover:border-amber-500/40 text-amber-300 font-medium transition cursor-pointer active:scale-95"
                title="Guest Mode: Click to exit demo and return to Welcome screen"
              >
                <Eye size={11} className="text-amber-400" />
                <span className="text-[10px]">Guest Demo (Exit)</span>
              </button>
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
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              id="header-side-menu-trigger-btn"
              onClick={onToggleSideMenu}
              className="p-2 rounded-xl bg-[#161c24] hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-slate-800 transition active:scale-95 relative cursor-pointer"
              title="Open Navigation Menu"
              aria-label="Toggle Side Menu Navigation"
            >
              <Menu size={20} />
              {notificationsEnabled && unreadNotificationsCount > 0 && (
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
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Notification Bell: opens Settings if disabled, opens Notifications tray if enabled */}
            <button
              id="header-notifications-btn"
              onClick={handleBellClick}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700/60 transition active:scale-95 relative cursor-pointer"
              title={notificationsEnabled ? "View Notifications" : "Setup Notification Settings"}
              aria-label={notificationsEnabled ? "View Notifications" : "Setup Notification Settings"}
            >
              <Bell size={16} />
              {notificationsEnabled && unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] flex items-center justify-center shadow-sm">
                  {unreadNotificationsCount}
                </span>
              )}
              {!notificationsEnabled && (
                <span 
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400/70 ring-2 ring-[#0d1218]" 
                  title="Notifications not enabled. Tap to setup." 
                />
              )}
            </button>

            {/* Auth State Button */}
            {isGuestMode ? (
              <button
                id="header-login-btn"
                onClick={handleLoginClick}
                disabled={isSigningIn}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-xs font-bold transition active:scale-95 shadow-md shadow-amber-500/20 shrink-0 cursor-pointer"
                title="Sign In with Google for Cloud Sync"
              >
                <LogIn size={13} strokeWidth={2.5} />
                <span>Sign In</span>
              </button>
            ) : user ? (
              <div className="relative shrink-0">
                <button
                  id="header-user-avatar-btn"
                  type="button"
                  onClick={() => setShowUserMenu(prev => !prev)}
                  className="w-8 h-8 rounded-full border border-amber-500/40 hover:border-amber-400 transition active:scale-95 cursor-pointer overflow-hidden flex items-center justify-center bg-slate-800 shadow-sm"
                  title={`Signed in as ${user.displayName || user.email || 'User'}. Click for account details & logout.`}
                >
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="User" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <UserIcon size={16} className="text-amber-400" />
                  )}
                </button>

                {showUserMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowUserMenu(false)} 
                    />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-[#141b24] border border-slate-700/80 rounded-2xl shadow-2xl p-3 z-50 animate-fadeIn divide-y divide-slate-800/80">
                      <div className="flex items-center gap-3 pb-3">
                        {user.photoURL ? (
                          <img 
                            src={user.photoURL} 
                            alt="User" 
                            className="w-10 h-10 rounded-full object-cover border border-amber-500/40 shrink-0" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold shrink-0">
                            {(user.displayName || user.email || 'U')[0].toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">
                            {user.displayName || 'Google Account'}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {user.email || ''}
                          </p>
                          <span className="inline-block mt-0.5 text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            Cloud Sync Active
                          </span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          id="user-menu-logout-btn"
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            setShowLogoutConfirm(true);
                          }}
                          disabled={isSigningOut}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 text-xs font-semibold border border-rose-500/30 transition active:scale-95 cursor-pointer"
                        >
                          <LogOut size={14} />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
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
      <LogoModal isOpen={showLogoPopup} onClose={() => setShowLogoPopup(false)} />

      {/* Logout Confirmation Popup Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirmLogout={async () => {
          setShowLogoutConfirm(false);
          await handleLogoutClick();
        }}
        user={user}
        isLoggingOut={isSigningOut}
      />
    </header>
  );
};
