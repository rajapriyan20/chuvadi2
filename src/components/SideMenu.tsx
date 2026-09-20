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
  MessageCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { ChuvadiLogo } from './ChuvadiLogo';
import type { ActiveTab } from '../types';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  renewalsCount?: number;
  pendingTodosCount?: number;
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
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 sm:w-80 bg-[#0d1218] border-r border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-[#111720]">
          <div className="flex items-center gap-2">
            <ChuvadiLogo size={36} showText={true} />
          </div>
          <button
            id="close-side-menu-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Close Menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Developer Credit & WhatsApp Contact Banner in Side Menu */}
        <div className="px-4 py-3 bg-[#131922] border-b border-slate-800/60 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] text-slate-400 font-medium">Developed by</div>
            <div className="text-xs font-bold text-slate-200 truncate">Rajapriyan</div>
          </div>
          <a
            href="https://wa.me/919600001118"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition active:scale-95 shrink-0"
            title="Chat on WhatsApp (+91 9600001118)"
          >
            <MessageCircle size={14} className="fill-emerald-400/20 text-emerald-400" />
            <span>WhatsApp</span>
          </a>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1.5">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
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
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition group ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-200 border border-amber-500/30 shadow-sm'
                    : item.highlight
                    ? 'text-emerald-300 hover:bg-emerald-950/30 hover:text-emerald-200 border border-emerald-500/15'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : item.highlight
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800/80 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-700'
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold truncate">
                      {item.label}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {item.subtitle}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor || 'bg-amber-500 text-slate-950'}`}>
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight 
                    size={14} 
                    className={`transition-transform ${isActive ? 'text-amber-400 translate-x-0.5' : 'text-slate-600 group-hover:text-slate-400'}`} 
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Utility Bottom Section */}
        <div className="p-3 border-t border-slate-800/80 bg-[#10151d] space-y-2">
          {onOpenQuickAdd && (
            <button
              onClick={() => {
                onOpenQuickAdd();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Record Transaction</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            {onOpenExport && (
              <button
                onClick={() => {
                  onOpenExport();
                  onClose();
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700/60 transition"
              >
                <Download size={14} />
                <span>Export</span>
              </button>
            )}

            {onOpenSettings && (
              <button
                onClick={() => {
                  onOpenSettings();
                  onClose();
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700/60 transition"
              >
                <SettingsIcon size={14} />
                <span>Settings</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
