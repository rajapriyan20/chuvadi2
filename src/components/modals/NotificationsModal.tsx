import React, { useState, useMemo } from 'react';
import { 
  X, 
  Bell, 
  Check, 
  CheckCheck, 
  Settings as SettingsIcon, 
  Trash2, 
  Car, 
  Wallet, 
  Dumbbell, 
  CheckSquare, 
  CalendarDays, 
  Heart, 
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import type { AppNotification } from '../../services/notificationService';
import type { ActiveTab } from '../../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onClearAll: () => void;
  onOpenSettings: () => void;
  onSelectTab?: (tab: ActiveTab) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
  onOpenSettings,
  onSelectTab
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter(n => !n.read);
    }
    return notifications;
  }, [notifications, filter]);

  if (!isOpen) return null;

  const getCategoryIcon = (category: AppNotification['category']) => {
    switch (category) {
      case 'vehicle':
        return <Car size={15} className="text-amber-400" />;
      case 'finance':
        return <Wallet size={15} className="text-emerald-400" />;
      case 'todos':
        return <CheckSquare size={15} className="text-purple-400" />;
      case 'calendar':
        return <CalendarDays size={15} className="text-sky-400" />;
      case 'fitness':
        return <Dumbbell size={15} className="text-teal-400" />;
      case 'wellness':
        return <Heart size={15} className="text-pink-400" />;
      default:
        return <Info size={15} className="text-amber-400" />;
    }
  };

  const getCategoryBadgeClass = (category: AppNotification['category']) => {
    switch (category) {
      case 'vehicle':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/25';
      case 'finance':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25';
      case 'todos':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/25';
      case 'calendar':
        return 'bg-sky-500/15 text-sky-300 border-sky-500/25';
      case 'fitness':
        return 'bg-teal-500/15 text-teal-300 border-teal-500/25';
      case 'wellness':
        return 'bg-pink-500/15 text-pink-300 border-pink-500/25';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/30';
    }
  };

  const handleNotificationClick = (item: AppNotification) => {
    if (!item.read) {
      onMarkAsRead(item.id);
    }
    if (item.targetTab && onSelectTab) {
      onSelectTab(item.targetTab);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#101620] border border-slate-800 rounded-3xl w-full max-w-xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-[#131b26] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center relative">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] flex items-center justify-center shadow-sm">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Notifications</span>
                {unreadCount > 0 ? (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {unreadCount} unread
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    All caught up
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Alerts, renewals, reminders, and daily check-ins
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Direct Jump to Settings */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800/80 transition cursor-pointer"
              title="Configure Notification Preferences"
              aria-label="Notification Settings"
            >
              <SettingsIcon size={18} />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Action Controls & Filters Bar */}
        <div className="px-4 py-2.5 bg-[#0e141d] border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center bg-[#131b26] p-0.5 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                filter === 'all'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                filter === 'unread'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="px-2.5 py-1 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/60 transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Mark all notifications as read"
              >
                <CheckCheck size={13} className="text-emerald-400" />
                <span className="hidden sm:inline">Mark all read</span>
                <span className="sm:hidden">All read</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                title="Clear all notifications"
                aria-label="Clear all notifications"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 text-xs text-slate-300">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/50 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                <Bell size={22} className="opacity-40" />
              </div>
              <div className="text-sm font-bold text-slate-300">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {filter === 'unread'
                  ? 'All notifications have been marked as read. You are up to date!'
                  : 'You have no notifications pending. Active reminders for vehicle renewals, checklists, and calendar events will appear here.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isUnread = !notif.read;

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 rounded-2xl border transition group cursor-pointer relative overflow-hidden flex flex-col gap-2 ${
                    isUnread
                      ? 'bg-[#151d29] hover:bg-[#1a2433] border-amber-500/35 hover:border-amber-500/60 shadow-md'
                      : 'bg-[#0f141d]/70 hover:bg-[#131a24] border-slate-800/80 opacity-75 hover:opacity-100'
                  }`}
                >
                  {/* Top Bar: Icon, Title, Status & Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      {/* Unread Glow Pulse Indicator */}
                      {isUnread ? (
                        <div className="mt-1 shrink-0 flex items-center justify-center">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-4 ring-amber-400/20 animate-pulse" />
                        </div>
                      ) : (
                        <div className="mt-1 shrink-0 flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-slate-600" />
                        </div>
                      )}

                      <div className="w-7 h-7 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shrink-0">
                        {getCategoryIcon(notif.category)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`text-xs font-bold truncate ${
                            isUnread ? 'text-white' : 'text-slate-300'
                          }`}>
                            {notif.title}
                          </h3>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider border font-mono ${getCategoryBadgeClass(notif.category)}`}>
                            {notif.category}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                          {notif.date}
                        </div>
                      </div>
                    </div>

                    {/* Read status pill or Mark-as-read button */}
                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {isUnread ? (
                        <button
                          type="button"
                          onClick={() => onMarkAsRead(notif.id)}
                          className="px-2.5 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/35 text-[11px] font-bold transition active:scale-95 flex items-center gap-1 cursor-pointer shadow-sm"
                          title="Mark this notification as read"
                        >
                          <Check size={12} strokeWidth={2.5} />
                          <span>Mark read</span>
                        </button>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800/90 text-slate-400 text-[10px] font-semibold flex items-center gap-1 border border-slate-700/40">
                          <CheckCheck size={11} className="text-emerald-400" />
                          <span>Read</span>
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => onDeleteNotification(notif.id)}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Delete notification"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Body text & Deep Link hint */}
                  <div className="flex items-center justify-between gap-2 pl-5 sm:pl-7">
                    <p className={`text-xs leading-relaxed ${
                      isUnread ? 'text-slate-200' : 'text-slate-400'
                    }`}>
                      {notif.message}
                    </p>

                    {notif.targetTab && (
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 group-hover:text-amber-300 shrink-0 ml-1">
                        <span className="hidden sm:inline capitalize">Open {notif.targetTab}</span>
                        <ChevronRight size={13} className="transform group-hover:translate-x-0.5 transition" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800/80 bg-[#131b26] flex items-center justify-between text-xs shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="text-slate-400 hover:text-amber-300 flex items-center gap-1.5 transition cursor-pointer text-xs font-semibold"
          >
            <SettingsIcon size={14} className="text-amber-400" />
            <span>Customize Alerts & Times</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white font-semibold transition active:scale-95 cursor-pointer text-xs"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
