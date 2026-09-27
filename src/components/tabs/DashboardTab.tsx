import React, { useMemo, useState, useRef, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Car, 
  CheckSquare, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft,
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
  Wallet,
  Sparkles,
  LogIn,
  ArrowLeft,
  Calendar,
  CalendarDays,
  Dumbbell,
  Layers,
  PieChart,
  Receipt,
  X,
  LayoutGrid,
  GalleryHorizontal
} from 'lucide-react';
import { formatCurrency, formatDate, getDaysRemaining } from '../../utils/formatters';
import type { 
  Account, 
  Transaction, 
  Vehicle, 
  TodoNote, 
  ActiveTab, 
  CalendarEvent, 
  ExerciseLog, 
  BodyProfileLog, 
  MenstrualLog, 
  MenstrualCycleSettings 
} from '../../types';

interface DashboardTabProps {
  totalNetWorth: number;
  monthlyExpense: number;
  monthlyIncome: number;
  accounts: Account[];
  transactions: Transaction[];
  vehicles: Vehicle[];
  todos: TodoNote[];
  calendarEvents?: CalendarEvent[];
  exerciseLogs?: ExerciseLog[];
  bodyProfileLogs?: BodyProfileLog[];
  menstrualLogs?: MenstrualLog[];
  menstrualSettings?: MenstrualCycleSettings;
  onOpenPassbook: (account: Account) => void;
  onSelectTxn: (txn: Transaction) => void;
  onSelectTab: (tab: ActiveTab) => void;
  onSelectFinanceSubTab?: (subTab: 'coa' | 'transactions' | 'reports' | 'inbox') => void;
  onToggleTodoItem: (noteId: string, itemId: string) => void;
  onUpdateTodoItemDate?: (noteId: string, itemId: string, date: string) => void;
  isGuestMode?: boolean;
  onLogin?: () => void;
  onExitGuestMode?: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  totalNetWorth,
  monthlyExpense,
  monthlyIncome,
  accounts,
  transactions,
  vehicles,
  todos,
  calendarEvents = [],
  exerciseLogs = [],
  bodyProfileLogs = [],
  menstrualLogs = [],
  menstrualSettings,
  onOpenPassbook,
  onSelectTxn,
  onSelectTab,
  onSelectFinanceSubTab,
  onToggleTodoItem,
  onUpdateTodoItemDate,
  isGuestMode = false,
  onLogin,
  onExitGuestMode
}) => {
  const today = new Date();

  // Overview Layout Mode: 'carousel' (horizontal scrollable track) | 'grid' (compact horizontal grid)
  const [overviewLayout, setOverviewLayout] = useState<'carousel' | 'grid'>(() => {
    try {
      return (localStorage.getItem('chuvadi_dashboard_overview_layout') as 'carousel' | 'grid') || 'carousel';
    } catch {
      return 'carousel';
    }
  });

  const handleToggleLayout = (mode: 'carousel' | 'grid') => {
    setOverviewLayout(mode);
    try {
      localStorage.setItem('chuvadi_dashboard_overview_layout', mode);
    } catch {}
  };

  // Carousel ref and scroll handling
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 8);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 8);
    }
  };

  const handleScrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollStep = 280;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollStep : scrollStep,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const el = carouselRef.current;
    if (el && overviewLayout === 'carousel') {
      checkScrollability();
      el.addEventListener('scroll', checkScrollability, { passive: true });
      window.addEventListener('resize', checkScrollability);
      return () => {
        el.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
      };
    }
  }, [overviewLayout]);

  // Dynamic Time-of-Day Greeting
  const greeting = useMemo(() => {
    const hour = today.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, [today]);

  const formattedToday = useMemo(() => {
    return today.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }, [today]);

  // Identify critical renewals expiring in <= 30 days
  const criticalRenewals = useMemo(() => {
    return vehicles.flatMap((v) => {
      const list: Array<{ vehicle: Vehicle; type: 'Insurance' | 'PUC'; date: string; status: any }> = [];
      if (v.insuranceExpiry) {
        const status = getDaysRemaining(v.insuranceExpiry);
        if (status && (status.days <= 30 || status.isOverdue)) {
          list.push({ vehicle: v, type: 'Insurance', date: v.insuranceExpiry, status });
        }
      }
      if (v.pucExpiry) {
        const status = getDaysRemaining(v.pucExpiry);
        if (status && (status.days <= 30 || status.isOverdue)) {
          list.push({ vehicle: v, type: 'PUC', date: v.pucExpiry, status });
        }
      }
      return list;
    });
  }, [vehicles]);

  // Upcoming Calendar events & Birthdays within next 14 days
  const upcomingEvents = useMemo(() => {
    return calendarEvents
      .filter((ev) => {
        if (!ev.date) return false;
        const evDate = new Date(ev.date);
        const diffDays = Math.ceil((evDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 14;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 4);
  }, [calendarEvents, today]);

  // Pinned Checklists
  const pinnedTodos = useMemo(() => todos.filter((t) => t.pinned), [todos]);
  const totalPendingTodos = useMemo(() => {
    return todos.reduce((acc, t) => acc + (t.items ? t.items.filter(i => !i.completed).length : 0), 0);
  }, [todos]);

  // Net Savings & Rate
  const netSavings = monthlyIncome - monthlyExpense;
  const savingsRate = monthlyIncome > 0 ? Math.round((netSavings / monthlyIncome) * 100) : 0;

  // Liquid Balance (Cash & Bank accounts)
  const liquidBalance = useMemo(() => {
    return accounts
      .filter(a => a.type === 'CASH' || a.type === 'BANK')
      .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  }, [accounts]);

  // Last Workout & Body Profile
  const lastWorkout = exerciseLogs[0];
  const lastBodyProfile = bodyProfileLogs[0];
  const isFirstOfMonth = today.getDate() === 1;

  const recentTransactions = transactions.slice(0, 5);

  // Next Upcoming Horizon Event
  const nextHorizonEvent = upcomingEvents[0];
  const nextHorizonDiffDays = useMemo(() => {
    if (!nextHorizonEvent?.date) return null;
    const evDate = new Date(nextHorizonEvent.date);
    return Math.ceil((evDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }, [nextHorizonEvent, today]);

  // Unified Overview Cards Data Model
  const overviewCards = useMemo(() => [
    {
      id: 'net-worth',
      label: 'Net Worth',
      value: formatCurrency(totalNetWorth),
      subtext: `Liquid: ${formatCurrency(liquidBalance)}`,
      icon: Wallet,
      accent: 'amber' as const,
      badge: null,
      onClick: () => onSelectTab('finance'),
      tooltip: 'View Financial Ledger & Net Worth'
    },
    {
      id: 'inflow',
      label: 'Monthly Inflow',
      value: `+${formatCurrency(monthlyIncome)}`,
      subtext: `${transactions.filter(t => t.type === 'INCOME').length} credits recorded`,
      icon: TrendingUp,
      accent: 'emerald' as const,
      badge: null,
      onClick: () => onSelectTab('finance'),
      tooltip: 'View Monthly Incomes'
    },
    {
      id: 'outflow',
      label: 'Monthly Outflow',
      value: `-${formatCurrency(monthlyExpense)}`,
      subtext: `Net: ${netSavings >= 0 ? '+' : ''}${formatCurrency(netSavings)} (${savingsRate}%)`,
      icon: TrendingDown,
      accent: 'rose' as const,
      badge: null,
      onClick: () => onSelectTab('finance'),
      tooltip: 'View Monthly Expenses'
    },
    {
      id: 'garage',
      label: 'Garage Fleet',
      value: `${vehicles.length} ${vehicles.length === 1 ? 'Vehicle' : 'Vehicles'}`,
      subtext: criticalRenewals.length > 0 ? `${criticalRenewals.length} urgent renewals` : 'All renewals active',
      icon: Car,
      accent: 'sky' as const,
      badge: criticalRenewals.length > 0 ? {
        text: `${criticalRenewals.length} due`,
        variant: 'warning' as const
      } : null,
      onClick: () => onSelectTab('garage'),
      tooltip: 'View Vehicles, Fuel & Maintenance'
    },
    {
      id: 'todos',
      label: 'Active Tasks',
      value: `${totalPendingTodos} Pending`,
      subtext: `${pinnedTodos.length} pinned checklists`,
      icon: CheckSquare,
      accent: 'amber' as const,
      badge: null,
      onClick: () => onSelectTab('todos'),
      tooltip: 'View Checklists & Reminders'
    },
    {
      id: 'horizon',
      label: 'Upcoming Horizon',
      value: nextHorizonEvent ? nextHorizonEvent.title : 'All Clear',
      subtext: nextHorizonEvent 
        ? `${nextHorizonDiffDays === 0 ? 'Today' : nextHorizonDiffDays === 1 ? 'Tomorrow' : `in ${nextHorizonDiffDays}d`} • ${formatDate(nextHorizonEvent.date)}`
        : 'No events in 14 days',
      icon: CalendarDays,
      accent: 'indigo' as const,
      badge: nextHorizonEvent ? {
        text: nextHorizonDiffDays === 0 ? 'Today' : nextHorizonDiffDays === 1 ? 'Tmrw' : `${nextHorizonDiffDays}d`,
        variant: 'info' as const
      } : null,
      onClick: () => onSelectTab('calendar'),
      tooltip: 'View Unified Calendar & Events'
    },
    {
      id: 'fitness',
      label: 'Fitness & Pulse',
      value: lastBodyProfile?.weightKg != null ? `${lastBodyProfile.weightKg} kg` : (lastWorkout ? 'Logged' : 'Pulse'),
      subtext: isFirstOfMonth 
        ? '🔔 1st of month: log body stats'
        : (lastWorkout ? `Last: ${lastWorkout.description}` : 'Track workouts & body'),
      icon: Dumbbell,
      accent: 'teal' as const,
      badge: isFirstOfMonth ? {
        text: 'Due',
        variant: 'amber' as const
      } : null,
      onClick: () => onSelectTab('exercise'),
      tooltip: 'View Fitness & Body Profile'
    }
  ], [
    totalNetWorth,
    liquidBalance,
    monthlyIncome,
    transactions,
    monthlyExpense,
    netSavings,
    savingsRate,
    vehicles.length,
    criticalRenewals.length,
    totalPendingTodos,
    pinnedTodos.length,
    nextHorizonEvent,
    nextHorizonDiffDays,
    lastBodyProfile,
    lastWorkout,
    isFirstOfMonth,
    onSelectTab
  ]);

  // Color Map for Overview Cards
  const accentStyles = {
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      iconBg: 'bg-amber-500/15 text-amber-400',
      valueText: 'text-amber-200',
      badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/15 text-emerald-400',
      valueText: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    },
    rose: {
      border: 'border-rose-500/20 hover:border-rose-500/40',
      iconBg: 'bg-rose-500/15 text-rose-400',
      valueText: 'text-rose-400',
      badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30'
    },
    sky: {
      border: 'border-sky-500/20 hover:border-sky-500/40',
      iconBg: 'bg-sky-500/15 text-sky-400',
      valueText: 'text-sky-300',
      badgeBg: 'bg-sky-500/15 text-sky-300 border-sky-500/30'
    },
    indigo: {
      border: 'border-indigo-500/20 hover:border-indigo-500/40',
      iconBg: 'bg-indigo-500/15 text-indigo-400',
      valueText: 'text-indigo-200',
      badgeBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
    },
    teal: {
      border: 'border-teal-500/20 hover:border-teal-500/40',
      iconBg: 'bg-teal-500/15 text-teal-400',
      valueText: 'text-teal-300',
      badgeBg: 'bg-teal-500/15 text-teal-300 border-teal-500/30'
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-8 animate-fadeIn">
      
      {/* 1. Executive Life OS Header Banner (Compact & High-Density) */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-[#151c27] via-[#101620] to-[#0c1017] rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 font-mono">
                  சுவடி • Life OS
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {formattedToday}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
                {greeting}, welcome back
              </h1>
            </div>
          </div>

          {/* Quick Shortcuts & Navigation Hub */}
          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => {
                if (onSelectFinanceSubTab) onSelectFinanceSubTab('coa');
                onSelectTab('finance');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700/70 transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Chart of Accounts"
            >
              <Layers size={13} className="text-amber-400 shrink-0" />
              <span className="hidden sm:inline">Accounts</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onSelectFinanceSubTab) onSelectFinanceSubTab('transactions');
                onSelectTab('finance');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700/70 transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Ledger Transactions"
            >
              <Receipt size={13} className="text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">Ledger</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onSelectFinanceSubTab) onSelectFinanceSubTab('reports');
                onSelectTab('finance');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-xs font-semibold text-amber-300 border border-amber-500/30 transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Reports & Analytics"
            >
              <PieChart size={13} className="text-amber-400 shrink-0" />
              <span className="hidden sm:inline">Reports</span>
            </button>

            {/* Guest Demo Prompt Inlined */}
            {isGuestMode && onLogin && (
              <button
                onClick={onLogin}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm flex items-center gap-1"
                title="Sign in with Google to save permanently"
              >
                <LogIn size={12} className="stroke-[2.5]" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Sleek Horizontal Overview Carousel / Grid Section */}
      <div className="space-y-2">
        {/* Controls Bar: Title, Layout Toggle (Carousel vs Grid), and Carousel Nav Chevrons */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span>Overview & Vital Metrics</span>
            </span>
            <span className="text-[10px] font-mono font-medium text-slate-500 px-1.5 py-0.2 rounded bg-slate-800/80 border border-slate-700/40">
              {overviewCards.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Carousel vs Grid */}
            <div className="flex items-center bg-[#131922] p-0.5 rounded-xl border border-slate-800 text-slate-400">
              <button
                type="button"
                onClick={() => handleToggleLayout('carousel')}
                className={`p-1 sm:px-2 sm:py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                  overviewLayout === 'carousel'
                    ? 'bg-amber-500/20 text-amber-300 font-semibold'
                    : 'hover:text-slate-200'
                }`}
                title="Horizontal Scrollable Carousel"
              >
                <GalleryHorizontal size={13} />
                <span className="hidden sm:inline text-[11px]">Carousel</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleLayout('grid')}
                className={`p-1 sm:px-2 sm:py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                  overviewLayout === 'grid'
                    ? 'bg-amber-500/20 text-amber-300 font-semibold'
                    : 'hover:text-slate-200'
                }`}
                title="Compact Horizontal Grid"
              >
                <LayoutGrid size={13} />
                <span className="hidden sm:inline text-[11px]">Grid</span>
              </button>
            </div>

            {/* Carousel Scroll Arrow Chevrons (visible when carousel mode is active) */}
            {overviewLayout === 'carousel' && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleScrollCarousel('left')}
                  disabled={!canScrollLeft}
                  className="w-7 h-7 rounded-lg bg-[#141c26] hover:bg-[#1a2533] disabled:opacity-30 disabled:pointer-events-none text-slate-300 hover:text-white border border-slate-800 flex items-center justify-center transition active:scale-95 cursor-pointer shadow-sm"
                  title="Scroll left"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => handleScrollCarousel('right')}
                  disabled={!canScrollRight}
                  className="w-7 h-7 rounded-lg bg-[#141c26] hover:bg-[#1a2533] disabled:opacity-30 disabled:pointer-events-none text-slate-300 hover:text-white border border-slate-800 flex items-center justify-center transition active:scale-95 cursor-pointer shadow-sm"
                  title="Scroll right"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* The Overview Deck Container */}
        {overviewLayout === 'carousel' ? (
          <div className="relative group/carousel">
            {/* Scrollable Horizontal Track */}
            <div 
              ref={carouselRef}
              className="flex items-stretch gap-2.5 overflow-x-auto pb-1 pt-0.5 scroll-smooth no-scrollbar snap-x snap-mandatory"
            >
              {overviewCards.map((card) => {
                const styles = accentStyles[card.accent];
                const IconComponent = card.icon;

                return (
                  <div
                    key={card.id}
                    onClick={card.onClick}
                    title={card.tooltip}
                    className={`min-w-[200px] sm:min-w-[220px] max-w-[260px] flex-1 shrink-0 snap-start p-3 bg-[#131922] hover:bg-[#18212c] rounded-2xl border ${styles.border} transition group cursor-pointer shadow-sm relative overflow-hidden flex flex-col justify-between h-[92px]`}
                  >
                    {/* Top Row: Label + Icon & Badge */}
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 group-hover:text-slate-300 truncate">
                        {card.label}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {card.badge && (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono border ${
                            card.badge.variant === 'warning'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                              : card.badge.variant === 'info'
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          }`}>
                            {card.badge.text}
                          </span>
                        )}
                        <div className={`w-6 h-6 rounded-lg ${styles.iconBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition`}>
                          <IconComponent size={13} />
                        </div>
                      </div>
                    </div>

                    {/* Value */}
                    <div className={`text-xl sm:text-2xl font-black font-mono tracking-tight truncate ${styles.valueText}`}>
                      {card.value}
                    </div>

                    {/* Subtext Footer */}
                    <div className="text-[10px] text-slate-400 truncate flex items-center justify-between">
                      <span className="truncate">{card.subtext}</span>
                      <ChevronRight size={11} className="text-slate-600 group-hover:text-slate-400 shrink-0 ml-1 transition transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Compact Responsive Grid Mode: High density horizontal tiles */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
            {overviewCards.map((card) => {
              const styles = accentStyles[card.accent];
              const IconComponent = card.icon;

              return (
                <div
                  key={card.id}
                  onClick={card.onClick}
                  title={card.tooltip}
                  className={`p-3 bg-[#131922] hover:bg-[#18212c] rounded-2xl border ${styles.border} transition group cursor-pointer shadow-sm relative overflow-hidden flex flex-col justify-between h-[92px]`}
                >
                  {/* Top Row: Label + Icon & Badge */}
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 group-hover:text-slate-300 truncate">
                      {card.label}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {card.badge && (
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono border ${
                          card.badge.variant === 'warning'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                            : card.badge.variant === 'info'
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}>
                          {card.badge.text}
                        </span>
                      )}
                      <div className={`w-6 h-6 rounded-lg ${styles.iconBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition`}>
                        <IconComponent size={13} />
                      </div>
                    </div>
                  </div>

                  {/* Value */}
                  <div className={`text-lg sm:text-xl font-black font-mono tracking-tight truncate ${styles.valueText}`}>
                    {card.value}
                  </div>

                  {/* Subtext Footer */}
                  <div className="text-[10px] text-slate-400 truncate flex items-center justify-between">
                    <span className="truncate">{card.subtext}</span>
                    <ChevronRight size={11} className="text-slate-600 group-hover:text-slate-400 shrink-0 ml-1 transition transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Compact Imminent Expiration Alert Strip (PUC & Insurance Watch) */}
      {criticalRenewals.length > 0 && (
        <div className="px-3.5 py-2.5 bg-amber-950/25 border border-amber-600/35 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs animate-fadeIn">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wider text-[11px] shrink-0">
              <ShieldAlert size={14} className="animate-pulse" />
              <span>Imminent Renewals ({criticalRenewals.length}):</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {criticalRenewals.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSelectTab('garage')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#131922] hover:bg-[#18212c] border border-amber-600/30 text-slate-200 text-xs transition cursor-pointer"
                >
                  <Car size={11} className="text-amber-400" />
                  <strong className="text-white font-semibold">{r.vehicle.name}</strong>
                  <span className="text-slate-400 text-[11px]">{r.type}</span>
                  <span className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    r.status.isOverdue
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {r.status.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectTab('garage')}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 shrink-0 self-end sm:self-auto cursor-pointer"
          >
            <span>Garage</span>
            <ChevronRight size={13} />
          </button>
        </div>
      )}

      {/* 4. Compact Horizon Strip: Upcoming Events & Birthdays (Next 14 Days) */}
      {upcomingEvents.length > 0 && (
        <div className="px-3.5 py-2 rounded-2xl bg-[#121822] border border-slate-800/80 flex items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-sky-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 shrink-0">
              <CalendarDays size={13} />
              <span>Horizon:</span>
            </span>
            {upcomingEvents.map((ev) => {
              const evDate = new Date(ev.date);
              const diffDays = Math.ceil((evDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const isBday = ev.category === 'BIRTHDAY';

              return (
                <button 
                  key={ev.id}
                  type="button"
                  onClick={() => onSelectTab('calendar')}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-[11px] text-slate-300 hover:text-white cursor-pointer transition shrink-0 border border-slate-700/40"
                >
                  <span>{isBday ? '🎂' : '📅'}</span>
                  <span className="font-medium text-slate-200 max-w-[130px] truncate">{ev.title}</span>
                  <span className="text-[10px] font-mono font-bold text-sky-300">
                    {diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tmrw' : `${diffDays}d`}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('calendar')}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span className="hidden sm:inline">Calendar</span>
            <ChevronRight size={13} />
          </button>
        </div>
      )}

      {/* 5. Two Column Grid: Active Priorities (Checklists) + Recent Ledger Stream (FITS ABOVE THE FOLD) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Pinned Priorities & Checklists (1 column on large) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <CheckSquare size={14} className="text-amber-400" />
              <span>Priorities & Checklists</span>
            </h2>
            <button
              onClick={() => onSelectTab('todos')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Manage</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-2.5">
            {pinnedTodos.length === 0 ? (
              <div 
                onClick={() => onSelectTab('todos')}
                className="p-5 bg-[#131922] hover:bg-[#17202c] rounded-2xl border border-slate-800 text-center text-slate-500 text-xs cursor-pointer transition"
              >
                No pinned checklists. Tap to organize trip preps, maintenance checkups, or shopping lists.
              </div>
            ) : (
              pinnedTodos.slice(0, 2).map((note) => (
                <div
                  key={note.id}
                  className="p-3.5 bg-[#141b24] rounded-2xl border border-amber-500/20 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-amber-200 truncate">{note.title}</h3>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {note.items.filter(i => i.completed).length}/{note.items.length} done
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {note.items.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 group/dashitem py-0.5"
                      >
                        <div 
                          onClick={() => onToggleTodoItem(note.id, item.id)}
                          className="flex items-center gap-2 cursor-pointer min-w-0 flex-1"
                        >
                          <input
                            type="checkbox"
                            checked={item.completed}
                            readOnly
                            className="w-3.5 h-3.5 accent-amber-500 rounded pointer-events-none shrink-0"
                          />
                          <span className={`text-xs truncate ${item.completed ? 'line-through text-slate-500' : 'text-slate-200 group-hover/dashitem:text-white'}`}>
                            {item.text}
                          </span>
                        </div>

                        {/* Date display & picker icon on Dashboard item */}
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {item.date ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] sm:text-xs font-mono">
                              <label 
                                className="relative flex items-center gap-1 cursor-pointer"
                                title={`Target date: ${item.date}. Tap to change`}
                              >
                                <Calendar size={11} className="text-amber-400 shrink-0" />
                                <span>{item.date}</span>
                                {onUpdateTodoItemDate && (
                                  <input
                                    type="date"
                                    value={item.date}
                                    onChange={(e) => onUpdateTodoItemDate(note.id, item.id, e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                  />
                                )}
                              </label>
                              {onUpdateTodoItemDate && (
                                <button
                                  type="button"
                                  onClick={() => onUpdateTodoItemDate(note.id, item.id, '')}
                                  className="text-amber-400 hover:text-rose-400 p-0.5 transition cursor-pointer"
                                  title="Remove date"
                                >
                                  <X size={10} />
                                </button>
                              )}
                            </span>
                          ) : onUpdateTodoItemDate ? (
                            <label 
                              className="relative p-1 rounded hover:bg-slate-700/60 text-slate-400 hover:text-amber-300 cursor-pointer transition shrink-0"
                              title="Add date to item"
                            >
                              <Calendar size={12} className="text-slate-400 hover:text-amber-300" />
                              <input
                                type="date"
                                onChange={(e) => onUpdateTodoItemDate(note.id, item.id, e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              />
                            </label>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}

            {/* Wellness & Fitness Monthly Pulse Card */}
            <div 
              onClick={() => onSelectTab('exercise')}
              className="p-3.5 rounded-2xl bg-[#121822] hover:bg-[#16202c] border border-slate-800 transition cursor-pointer space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5 text-teal-300">
                  <Dumbbell size={14} />
                  <span>Fitness & Wellness Pulse</span>
                </span>
                <ChevronRight size={13} className="text-slate-500" />
              </div>

              <div className="text-[11px] text-slate-400 space-y-1">
                {isFirstOfMonth ? (
                  <div className="p-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 font-bold text-[10px]">
                    🔔 Today is 1st of the month! Log your body measurements.
                  </div>
                ) : lastBodyProfile ? (
                  <div className="flex items-center justify-between">
                    <span>Latest Body Weight:</span>
                    <strong className="text-slate-200 font-mono">
                      {lastBodyProfile.weightKg != null ? `${lastBodyProfile.weightKg} kg` : 'Logged'}
                    </strong>
                  </div>
                ) : null}

                {lastWorkout ? (
                  <div className="flex items-center justify-between text-[10px]">
                    <span>Last Workout:</span>
                    <span className="text-slate-300 truncate max-w-[150px]">{lastWorkout.description} ({formatDate(lastWorkout.date)})</span>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-500">Record workouts and monthly body profile in Exercise.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions Ledger (2 columns on large) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Layers size={14} className="text-amber-400" />
              <span>Recent Ledger History</span>
            </h2>
            <button
              onClick={() => onSelectTab('finance')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Full Passbook</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="bg-[#131922] rounded-2xl border border-slate-800/90 divide-y divide-slate-800/60 overflow-hidden shadow-sm">
            {recentTransactions.length === 0 ? (
              <div 
                onClick={() => onSelectTab('finance')}
                className="p-6 text-center text-slate-500 text-xs cursor-pointer hover:bg-slate-800/20 transition"
              >
                No recent transactions recorded yet. Tap to view finance accounts.
              </div>
            ) : (
              recentTransactions.map((t) => {
                const isExpense = t.type === 'EXPENSE';
                const isIncome = t.type === 'INCOME';

                return (
                  <div
                    key={t.id}
                    onClick={() => onSelectTxn(t)}
                    className="p-3 sm:p-3.5 flex items-center justify-between hover:bg-slate-800/40 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          t.type === 'TRANSFER'
                            ? 'bg-blue-500/15 text-blue-400'
                            : isExpense
                            ? 'bg-rose-500/15 text-rose-400'
                            : 'bg-emerald-500/15 text-emerald-400'
                        }`}
                      >
                        {t.type === 'TRANSFER' ? (
                          <ArrowRightLeft size={14} />
                        ) : isExpense ? (
                          <ArrowUpRight size={14} />
                        ) : (
                          <ArrowDownLeft size={14} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white tracking-tight truncate">
                          {t.description}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5 truncate">
                          <span>{formatDate(t.date)}</span>
                          <span>•</span>
                          <span className="text-amber-300/80">{t.category}</span>
                          {t.fuelLiters && <span>({t.fuelLiters}L)</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <div
                        className={`text-xs font-bold font-mono ${
                          isExpense ? 'text-rose-400' : isIncome ? 'text-emerald-400' : 'text-blue-300'
                        }`}
                      >
                        {isExpense ? '-' : isIncome ? '+' : ''}{formatCurrency(t.amount)}
                      </div>
                      <div className="text-[10px] text-slate-500 capitalize">{t.type.toLowerCase()}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Accounts & Passbooks Grid */}
          <div className="pt-1">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {accounts.slice(0, 4).map((acc) => (
                <div
                  key={acc.id}
                  onClick={() => onOpenPassbook(acc)}
                  className="p-3 bg-[#141b24] hover:bg-[#18212c] rounded-xl border border-slate-800 transition cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: acc.color || '#0284c7' }}
                    />
                    <span className="text-[9px] uppercase font-semibold text-slate-400">
                      {acc.type}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white group-hover:text-amber-300 truncate mt-1">
                    {acc.name}
                  </div>
                  <div className="text-xs font-bold text-amber-200 font-mono mt-0.5">
                    {formatCurrency(acc.balance)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
