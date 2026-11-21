import React, { useState } from 'react';
import { 
  LogIn, 
  LogOut, 
  User as UserIcon,
  Menu,
  Eye,
  Bell,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { ChuvadiLogo } from './ChuvadiLogo';
import { WhatsAppLogo } from './common/WhatsAppLogo';
import { LogoModal } from './common/LogoModal';
import { LogoutConfirmModal } from './modals/LogoutConfirmModal';
import type { User } from 'firebase/auth';
import type { ActiveTab, CloudSyncStatus } from '../types';

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
  onOpenSyncSettings?: () => void;
  syncStatus?: CloudSyncStatus;
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
  onOpenSyncSettings,
  syncStatus,
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
            <span className="text-slate-400 text-xs flex items-center gap-1.5">
              <span>developed by <strong className="text-slate-200 font-semibold">Rajapriyan</strong></span>
              <span className="text-[10px] text-slate-500 font-mono tracking-tight select-none">v1.2.0</span>
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

          {/* Real Cloud Sync Status Indicator */}
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
            ) : (() => {
              const phase = syncStatus?.phase || (isOnline ? 'connecting' : 'offline');
              const pending = syncStatus?.pendingCount || 0;
              const lastErr = syncStatus?.lastError;

              let label = 'Connecting...';
              let dotClass = 'bg-slate-400';
              let pillClass = 'bg-slate-900/80 border-slate-800 text-slate-300';
              let tooltip = 'Checking cloud connection...';

              if (phase === 'synced') {
                label = 'Cloud Synced';
                dotClass = 'bg-emerald-500';
                pillClass = 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/15';
                tooltip = syncStatus?.lastSyncedAt
                  ? `Cloud synced at ${new Date(syncStatus.lastSyncedAt).toLocaleTimeString()}. Tap for sync stats.`
                  : 'All collections verified in Cloud Firestore. Tap for sync stats.';
              } else if (phase === 'syncing' || phase === 'connecting') {
                label = pending > 0 ? `Syncing (${pending})...` : 'Syncing...';
                dotClass = 'bg-sky-400';
                pillClass = 'bg-sky-500/10 border-sky-500/25 text-sky-300 hover:bg-sky-500/15';
                tooltip = 'Synchronizing data with Cloud Firestore...';
              } else if (phase === 'pending') {
                label = pending > 0 ? `Pending (${pending})` : 'Pending Sync';
                dotClass = 'bg-amber-400';
                pillClass = 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/15';
                tooltip = `${pending} local item(s) queued — auto-syncing to Cloud. Tap for stats.`;
              } else if (phase === 'error') {
                label = 'Sync Error';
                dotClass = 'bg-rose-500';
                pillClass = 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/20';
                tooltip = lastErr ? `Sync error: ${lastErr}. Tap for details.` : 'Cloud sync encountered an error. Tap for details.';
              } else if (phase === 'offline') {
                label = pending > 0 ? `Offline • ${pending}` : 'Offline';
                dotClass = 'bg-rose-400';
                pillClass = 'bg-slate-900/90 border-rose-500/30 text-rose-300 hover:bg-slate-800';
                tooltip = pending > 0
                  ? `Offline: ${pending} change(s) queued locally and will auto-sync when online.`
                  : 'Offline: Using cached data. Changes will auto-sync when back online.';
              }

              return (
                <button
                  type="button"
                  onClick={() => onOpenSyncSettings?.()}
                  className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border transition cursor-pointer active:scale-95 ${pillClass}`}
                  title={tooltip}
                >
                  {phase === 'syncing' || phase === 'connecting' ? (
                    <RefreshCw size={10} className="animate-spin text-sky-400 shrink-0" />
                  ) : phase === 'error' ? (
                    <AlertTriangle size={10} className="text-rose-400 shrink-0" />
                  ) : (
                    <span className={`inline-flex rounded-full h-2 w-2 shrink-0 ${dotClass}`} />
                  )}
                  <span className="text-[10px] font-semibold tracking-tight">{label}</span>
                </button>
              );
            })()}
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
                          <button
                            type="button"
                            onClick={() => {
                              setShowUserMenu(false);
                              onOpenSyncSettings?.();
                            }}
                            className={`inline-block mt-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded border cursor-pointer transition ${
                              syncStatus?.phase === 'synced'
                                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                : syncStatus?.phase === 'error'
                                ? 'text-rose-300 bg-rose-500/15 border-rose-500/30'
                                : syncStatus?.phase === 'offline'
                                ? 'text-rose-300 bg-slate-800 border-rose-500/25'
                                : 'text-amber-300 bg-amber-500/10 border-amber-500/25'
                            }`}
                          >
                            {syncStatus?.phase === 'synced'
                              ? 'Cloud Synced'
                              : syncStatus?.phase === 'error'
                              ? 'Sync Error • View Stats'
                              : syncStatus?.phase === 'offline'
                              ? 'Offline (Cached)'
                              : syncStatus?.phase === 'pending'
                              ? `Pending Sync (${syncStatus.pendingCount})`
                              : 'Syncing...'}
                          </button>
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
