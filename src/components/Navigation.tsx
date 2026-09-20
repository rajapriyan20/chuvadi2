import React from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  Car, 
  CheckSquare, 
  PieChart, 
  Sparkles 
} from 'lucide-react';
import type { ActiveTab } from '../types';

interface NavigationProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  renewalsCount?: number;
  pendingTodosCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  renewalsCount = 0,
  pendingTodosCount = 0
}) => {
  const tabs = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'finance' as ActiveTab, label: 'Finance', icon: Wallet },
    { 
      id: 'garage' as ActiveTab, 
      label: 'Garage', 
      icon: Car, 
      badge: renewalsCount > 0 ? `${renewalsCount}` : undefined,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold'
    },
    { 
      id: 'todos' as ActiveTab, 
      label: 'Checklists', 
      icon: CheckSquare,
      badge: pendingTodosCount > 0 ? `${pendingTodosCount}` : undefined,
      badgeColor: 'bg-emerald-500 text-slate-950 font-bold'
    },
    { id: 'reports' as ActiveTab, label: 'Reports', icon: PieChart },
    { 
      id: 'ai' as ActiveTab, 
      label: 'Chuvadi AI', 
      icon: Sparkles,
      highlight: true
    },
  ];

  return (
    <>
      {/* Desktop Navigation Bar */}
      <nav className="hidden md:block bg-[#0f141c]/90 border-b border-slate-800/80 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-1 py-1.5 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition relative whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                    : tab.highlight
                    ? 'text-emerald-400 hover:bg-emerald-950/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-amber-400' : tab.highlight ? 'text-emerald-400' : ''} />
                <span>{tab.label}</span>

                {tab.badge && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${tab.badgeColor || 'bg-amber-500 text-slate-950'}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar (Fixed for quick one-thumb navigation) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d1218]/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 safe-area-pb">
        <div className="grid grid-cols-6 gap-1 max-w-md mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`mobile-nav-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition relative ${
                  isActive
                    ? 'text-amber-400 bg-amber-500/10'
                    : tab.highlight
                    ? 'text-emerald-400 hover:text-emerald-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                  {tab.badge && (
                    <span className="absolute -top-1.5 -right-2 px-1 py-0.2 text-[9px] font-bold rounded-full bg-amber-500 text-slate-950">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium tracking-tight mt-1 truncate max-w-full">
                  {tab.id === 'ai' ? 'AI' : tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
