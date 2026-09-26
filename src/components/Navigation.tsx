import React from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  Car, 
  CheckSquare, 
  PieChart, 
  Sparkles,
  CalendarDays,
  Heart,
  Dumbbell 
} from 'lucide-react';
import type { ActiveTab, TabVisibilityMap } from '../types';

interface NavigationProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  renewalsCount?: number;
  pendingTodosCount?: number;
  tabVisibility?: TabVisibilityMap;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  renewalsCount = 0,
  pendingTodosCount = 0,
  tabVisibility
}) => {
  const desktopTabs = [
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
    { id: 'calendar' as ActiveTab, label: 'Calendar', icon: CalendarDays },
    { id: 'exercise' as ActiveTab, label: 'Exercise', icon: Dumbbell },
    { id: 'menstrual' as ActiveTab, label: 'Cycle', icon: Heart },
    { id: 'reports' as ActiveTab, label: 'Reports', icon: PieChart },
    { 
      id: 'ai' as ActiveTab, 
      label: 'Chuvadi AI', 
      icon: Sparkles,
      highlight: true
    },
  ];

  const mobileTabs = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'finance' as ActiveTab, label: 'Finance', icon: Wallet },
    { id: 'calendar' as ActiveTab, label: 'Calendar', icon: CalendarDays },
    { id: 'exercise' as ActiveTab, label: 'Exercise', icon: Dumbbell },
    { id: 'menstrual' as ActiveTab, label: 'Cycle', icon: Heart },
    { 
      id: 'garage' as ActiveTab, 
      label: 'Garage', 
      icon: Car, 
      badge: renewalsCount > 0 ? `${renewalsCount}` : undefined,
    },
    { 
      id: 'todos' as ActiveTab, 
      label: 'Tasks', 
      icon: CheckSquare,
      badge: pendingTodosCount > 0 ? `${pendingTodosCount}` : undefined,
    },
  ];

  const visibleDesktopTabs = desktopTabs.filter(tab => !tabVisibility || tabVisibility[tab.id] !== false);
  const visibleMobileTabs = mobileTabs.filter(tab => !tabVisibility || tabVisibility[tab.id] !== false);

  return (
    <>
      {/* Desktop Navigation Bar */}
      <nav className="hidden md:block bg-[#0f141c]/90 border-b border-slate-800/80 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-1 py-1.5 overflow-x-auto scrollbar-none">
          {visibleDesktopTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition relative whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                    : tab.highlight
                    ? 'text-emerald-400 hover:bg-emerald-950/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon size={15} className={isActive ? 'text-amber-400' : tab.highlight ? 'text-emerald-400' : ''} />
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

      {/* Mobile Bottom Navigation Bar */}
      <nav 
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c1017]/95 backdrop-blur-lg border-t border-slate-800/90 px-1 py-1 flex items-center justify-around shadow-2xl safe-area-bottom overflow-x-auto"
      >
        {visibleMobileTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 min-w-[50px] flex flex-col items-center justify-center py-1 rounded-xl transition relative ${
                isActive
                  ? 'text-amber-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className="relative">
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-bold flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 ${isActive ? 'font-bold text-amber-300' : 'font-medium'}`}>
                {tab.label}
              </span>

              {isActive && (
                <span className="w-1 h-1 rounded-full bg-amber-400 absolute bottom-0.5" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
