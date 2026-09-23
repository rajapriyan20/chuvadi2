import React from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  Car, 
  CheckSquare, 
  PieChart, 
  Sparkles, 
  X, 
  Plus, 
  Download, 
  Settings as SettingsIcon, 
  Layers, 
  Receipt,
  ExternalLink,
  ChevronRight,
  Dumbbell,
  LogOut,
  ArrowLeft,
  LogIn,
  Eye
} from 'lucide-react';
import { ChuvadiLogo } from './ChuvadiLogo';
import { WhatsAppLogo } from './common/WhatsAppLogo';
import type { ActiveTab } from '../types';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  renewalsCount?: number;
  pendingTodosCount?: number;
  isGuestMode?: boolean;
  onExitGuestMode?: () => void;
  onLogin?: () => void;
  onOpenQuickAdd?: () => void;
  onOpenExport?: () => void;
  onOpenSettings?: () => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  renewalsCount = 0,
  pendingTodosCount = 0,
  isGuestMode = false,
  onExitGuestMode,
  onLogin,
  onOpenQuickAdd,
  onOpenExport,
  onOpenSettings
}) => {
  const menuItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      subtitle: 'Overview & Net Balance',
      icon: LayoutDashboard,
    },
    {
      id: 'finance' as ActiveTab,
      label: 'Finance',
      subtitle: 'Ledger, Accounts & COA',
      icon: Wallet,
      hasSubNav: true
    },
    {
      id: 'garage' as ActiveTab,
      label: 'Garage',
      subtitle: 'Vehicles, Fuel & Service',
      icon: Car,
      badge: renewalsCount > 0 ? `${renewalsCount} due` : undefined,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold'
    },
    {
      id: 'todos' as ActiveTab,
      label: 'Checklists',
      subtitle: 'Personal Tasks & Notes',
      icon: CheckSquare,
      badge: pendingTodosCount > 0 ? `${pendingTodosCount}` : undefined,
      badgeColor: 'bg-emerald-500 text-slate-950 font-bold'
    },
    {
      id: 'exercise' as ActiveTab,
      label: 'Exercise Log',
      subtitle: 'Daily Workouts & Fitness',
      icon: Dumbbell,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Reports',
      subtitle: 'Spending Breakdown & Trends',
      icon: PieChart,
    },
    {
      id: 'ai' as ActiveTab,
      label: 'Chuvadi AI',
      subtitle: 'Voice Dictate & Receipt AI',
      icon: Sparkles,
      highlight: true
    }
  ];

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <aside
        id="side-navigation-menu"
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 sm:w-80 h-[100dvh] max-h-[100dvh] bg-[#0d1218] border-r border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="px-3.5 py-2.5 sm:p-4 border-b border-slate-800/80 flex items-center justify-between bg-[#111720] shrink-0">
          <div className="flex items-center gap-2">
            <ChuvadiLogo size={32} showText={true} />
          </div>
          <button
            id="close-side-menu-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Close Menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Developer Credit & WhatsApp Contact Banner in Side Menu */}
        <div className="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-[#131922] border-b border-slate-800/60 flex items-center justify-between gap-2 shrink-0">
          <div className="min-w-0">
            <div className="text-[10px] text-slate-400 font-medium">Developed by</div>
            <div className="text-xs font-bold text-slate-200 truncate">Rajapriyan</div>
          </div>
          <a
            href="https://wa.me/919600001118"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition active:scale-95 shrink-0"
            title="Chat on WhatsApp (+91 9600001118)"
          >
            <WhatsAppLogo size={14} />
            <span>WhatsApp</span>
          </a>
        </div>

        {/* Navigation Items (Scrollable if height is constrained, but compact so it fits directly) */}
        <div className="flex-1 min-h-0 overflow-y-auto py-2 px-2.5 sm:py-3 sm:px-3 space-y-1 sm:space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Navigation
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`sidemenu-tab-${item.id}`}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-2 sm:p-2.5 rounded-xl sm:rounded-2xl text-left transition group ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-200 border border-amber-500/30 shadow-sm'
                    : item.highlight
                    ? 'text-emerald-300 hover:bg-emerald-950/30 hover:text-emerald-200 border border-emerald-500/15'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : item.highlight
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800/80 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-700'
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold truncate leading-tight">
                      {item.label}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate leading-tight">
                      {item.subtitle}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {item.badge && (
                    <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold ${item.badgeColor || 'bg-amber-500 text-slate-950'}`}>
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight 
                    size={13} 
                    className={`transition-transform ${isActive ? 'text-amber-400 translate-x-0.5' : 'text-slate-600 group-hover:text-slate-400'}`} 
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Utility Bottom Section - ALWAYS visible & pinned without scrolling */}
        <div className="p-2.5 sm:p-3 border-t border-slate-800/80 bg-[#10151d] space-y-1.5 sm:space-y-2 shrink-0 mt-auto shadow-2xl">
          {onOpenQuickAdd && (
            <button
              onClick={() => {
                onOpenQuickAdd();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Record Transaction</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            {onOpenExport && (
              <button
                id="sidemenu-export-btn"
                onClick={() => {
                  onOpenExport();
                  onClose();
                }}
                className="flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700/60 transition active:scale-95"
              >
                <Download size={13} />
                <span>Export</span>
              </button>
            )}

            {onOpenSettings && (
              <button
                id="sidemenu-settings-btn"
                onClick={() => {
                  onOpenSettings();
                  onClose();
                }}
                className="flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700/60 transition active:scale-95"
              >
                <SettingsIcon size={13} />
                <span>Settings</span>
              </button>
            )}
          </div>

          {/* Guest Mode Controls */}
          {isGuestMode ? (
            <div className="space-y-2 pt-1 border-t border-slate-800/80">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                <div className="font-bold flex items-center gap-1.5 mb-0.5">
                  <Eye size={12} />
                  <span>Guest Demo Mode</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Changes exist only in this browser session. Sign in to save permanently.
                </p>
              </div>

              {onLogin && (
                <button
                  onClick={() => {
                    onClose();
                    onLogin();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-xs font-bold transition active:scale-95 shadow-md shadow-amber-500/20"
                >
                  <LogIn size={13} strokeWidth={2.5} />
                  <span>Sign In with Google</span>
                </button>
              )}

              {onExitGuestMode && (
                <button
                  id="sidemenu-exit-guest-btn"
                  onClick={() => {
                    onClose();
                    onExitGuestMode();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition active:scale-95 shadow-sm"
                >
                  <ArrowLeft size={13} />
                  <span>Exit Demo Mode</span>
                </button>
              )}
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
};
