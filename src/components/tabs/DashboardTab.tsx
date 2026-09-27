import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Car, 
  CheckSquare, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft,
  ChevronRight,
  ShieldAlert,
  Wallet,
  Sparkles,
  LogIn,
  ArrowLeft,
  Calendar,
  CalendarDays,
  Dumbbell,
  Heart,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  PieChart,
  Receipt,
  X
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

  // Dynamic Time-of-Day Greeting
  const greeting = useMemo(() => {
    const hour = today.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, [today]);

  const formattedToday = useMemo(() => {
    return today.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
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

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-fadeIn">
      
      {/* 1. Executive Life OS Header Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-br from-[#151c27] via-[#101620] to-[#0c1017] rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20 font-mono">
                சுவடி • Life Command Center
              </span>
              <span className="text-xs text-slate-400">
                {formattedToday}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {greeting}, welcome back
            </h1>
            <p className="text-xs text-slate-400">
              Here is your personal life manuscript: financial health, garage renewals, today’s tasks, and calendar events.
            </p>
          </div>

          {/* Quick Life Pulse Chips */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => onSelectTab('finance')}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="View Finance Ledger & Accounts"
            >
              <Wallet size={13} className="text-amber-400" />
              <span>{accounts.length} Accounts</span>
            </button>

            <button
              onClick={() => onSelectTab('garage')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm ${
                criticalRenewals.length > 0
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="View Garage & Fleet"
            >
              <Car size={13} className="text-sky-400" />
              <span>{vehicles.length} Vehicles</span>
              {criticalRenewals.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>

            <button
              onClick={() => onSelectTab('todos')}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="View Checklists & Tasks"
            >
              <CheckSquare size={13} className="text-emerald-400" />
              <span>{totalPendingTodos} Pending</span>
            </button>
          </div>
        </div>

        {/* Guest Demo Prompt Banner */}
        {isGuestMode && (
          <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-medium">
              <Sparkles size={14} className="text-amber-400 shrink-0" />
              <span>You are viewing Chuvadi in <strong>Guest Demo Mode</strong>. Try all modules freely.</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {onLogin && (
                <button
                  onClick={onLogin}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold transition active:scale-95 cursor-pointer shadow-sm"
                >
                  <LogIn size={12} className="inline mr-1 stroke-[2.5]" />
                  Sign In with Google
                </button>
              )}
              {onExitGuestMode && (
                <button
                  onClick={onExitGuestMode}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95 cursor-pointer"
                >
                  <ArrowLeft size={12} className="inline mr-1" />
                  Exit
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Primary Financial Command Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Net Worth Card */}
        <div 
          onClick={() => onSelectTab('finance')}
          className="p-5 bg-gradient-to-br from-[#182230] to-[#121922] rounded-3xl border border-amber-500/25 shadow-lg relative overflow-hidden cursor-pointer hover:border-amber-500/40 transition group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Total Net Worth</span>
            <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
              <Wallet size={15} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-200 font-mono mt-2 tracking-tight">
            {formatCurrency(totalNetWorth)}
          </div>
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
            <span>Liquid Cash / Bank:</span>
            <span className="font-mono font-bold text-slate-200">{formatCurrency(liquidBalance)}</span>
          </div>
        </div>

        {/* Monthly Inflow */}
        <div 
          onClick={() => onSelectTab('finance')}
          className="p-5 bg-[#141b24] hover:bg-[#18212c] rounded-3xl border border-emerald-900/30 shadow-md cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Monthly Inflow</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
              <TrendingUp size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-2">
            +{formatCurrency(monthlyIncome)}
          </div>
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
            <span>Credits recorded:</span>
            <span className="text-emerald-300 font-semibold font-mono">
              {transactions.filter(t => t.type === 'INCOME').length} items
            </span>
          </div>
        </div>

        {/* Monthly Outflow & Savings Rate */}
        <div 
          onClick={() => onSelectTab('finance')}
          className="p-5 bg-[#141b24] hover:bg-[#18212c] rounded-3xl border border-rose-900/30 shadow-md cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Monthly Expenses</span>
            <div className="w-7 h-7 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center group-hover:scale-110 transition">
              <TrendingDown size={15} />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono mt-2">
            -{formatCurrency(monthlyExpense)}
          </div>
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
            <span>Net Monthly Balance:</span>
            <span className={`font-mono font-bold ${netSavings >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
              {netSavings >= 0 ? '+' : ''}{formatCurrency(netSavings)} {monthlyIncome > 0 && `(${savingsRate}%)`}
            </span>
          </div>
        </div>
      </div>

      {/* Finance Hub Sub-navigation Shortcuts */}
      <div className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-2xl bg-[#121820] border border-slate-800/90 text-xs shadow-sm">
        <span className="text-slate-400 font-medium hidden sm:inline text-[11px] px-1">Finance Hub:</span>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              if (onSelectFinanceSubTab) onSelectFinanceSubTab('coa');
              onSelectTab('finance');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/60 transition active:scale-95 cursor-pointer shadow-sm"
          >
            <Layers size={13} className="text-amber-400" />
            <span>Chart of Accounts</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onSelectFinanceSubTab) onSelectFinanceSubTab('transactions');
              onSelectTab('finance');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/60 transition active:scale-95 cursor-pointer shadow-sm"
          >
            <Receipt size={13} className="text-emerald-400" />
            <span>Transactions</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onSelectFinanceSubTab) onSelectFinanceSubTab('reports');
              onSelectTab('finance');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 transition active:scale-95 cursor-pointer shadow-sm"
          >
            <PieChart size={13} className="text-amber-400" />
            <span>Reports & Analytics</span>
          </button>
        </div>
      </div>

      {/* 3. Critical Renewal Alerts (PUC & Insurance Watch) */}
      {criticalRenewals.length > 0 && (
        <div className="p-4 bg-amber-950/30 border border-amber-600/40 rounded-3xl space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
              <ShieldAlert size={16} className="animate-pulse" />
              <span>Imminent Vehicle Expirations ({criticalRenewals.length})</span>
            </div>
            <button
              onClick={() => onSelectTab('garage')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View Garage</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {criticalRenewals.map((r, i) => (
              <div
                key={i}
                onClick={() => onSelectTab('garage')}
                className="p-3 bg-[#131922] hover:bg-[#18202c] rounded-2xl border border-amber-700/30 flex items-center justify-between cursor-pointer transition active:scale-98"
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Car size={13} className="text-amber-400" />
                    <span>{r.vehicle.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {r.type} expires on {formatDate(r.date)}
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                  r.status.isOverdue
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {r.status.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Upcoming Horizon: Calendar Events & Birthdays (Next 14 Days) */}
      {upcomingEvents.length > 0 && (
        <div className="p-4 bg-[#141c27] rounded-3xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-300 uppercase tracking-wider">
              <CalendarDays size={15} />
              <span>Upcoming Life Events & Birthdays</span>
            </div>
            <button
              onClick={() => onSelectTab('calendar')}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Unified Calendar</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {upcomingEvents.map((ev) => {
              const evDate = new Date(ev.date);
              const diffDays = Math.ceil((evDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const isBday = ev.category === 'BIRTHDAY';

              return (
                <div
                  key={ev.id}
                  onClick={() => onSelectTab('calendar')}
                  className="p-3 rounded-2xl bg-[#0f141d] hover:bg-[#161e2b] border border-slate-800/80 transition cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base">{isBday ? '🎂' : '📅'}</span>
                    <span className="text-[10px] font-mono font-bold text-sky-300 px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                      {diffDays === 0 ? 'Today!' : diffDays === 1 ? 'Tomorrow' : `in ${diffDays}d`}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white truncate">{ev.title}</div>
                  <div className="text-[10px] text-slate-400">{formatDate(ev.date)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Two Column Grid: Active Priorities (Checklists) + Recent Ledger Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
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

          <div className="space-y-3">
            {pinnedTodos.length === 0 ? (
              <div 
                onClick={() => onSelectTab('todos')}
                className="p-6 bg-[#131922] hover:bg-[#17202c] rounded-3xl border border-slate-800 text-center text-slate-500 text-xs cursor-pointer transition"
              >
                No pinned checklists. Tap to organize trip preps, maintenance checkups, or shopping lists.
              </div>
            ) : (
              pinnedTodos.slice(0, 2).map((note) => (
                <div
                  key={note.id}
                  className="p-4 bg-[#141b24] rounded-3xl border border-amber-500/20 shadow-sm space-y-2.5"
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

                        {/* Date display & picker icon on Dashboard item (Requirement 5) */}
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
              className="p-4 rounded-3xl bg-[#121822] hover:bg-[#16202c] border border-slate-800 transition cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5 text-emerald-300">
                  <Dumbbell size={14} />
                  <span>Fitness & Wellness Pulse</span>
                </span>
                <ChevronRight size={13} className="text-slate-500" />
              </div>

              <div className="text-[11px] text-slate-400 space-y-1">
                {isFirstOfMonth ? (
                  <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 font-bold">
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

          <div className="bg-[#131922] rounded-3xl border border-slate-800/90 divide-y divide-slate-800/60 overflow-hidden shadow-sm">
            {recentTransactions.length === 0 ? (
              <div 
                onClick={() => onSelectTab('finance')}
                className="p-8 text-center text-slate-500 text-xs cursor-pointer hover:bg-slate-800/20 transition"
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
                    className="p-3.5 flex items-center justify-between hover:bg-slate-800/40 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                          t.type === 'TRANSFER'
                            ? 'bg-blue-500/15 text-blue-400'
                            : isExpense
                            ? 'bg-rose-500/15 text-rose-400'
                            : 'bg-emerald-500/15 text-emerald-400'
                        }`}
                      >
                        {t.type === 'TRANSFER' ? (
                          <ArrowRightLeft size={16} />
                        ) : isExpense ? (
                          <ArrowUpRight size={16} />
                        ) : (
                          <ArrowDownLeft size={16} />
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

                    <div className="text-right shrink-0">
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
          <div className="pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {accounts.slice(0, 4).map((acc) => (
                <div
                  key={acc.id}
                  onClick={() => onOpenPassbook(acc)}
                  className="p-3.5 bg-[#141b24] hover:bg-[#18212c] rounded-2xl border border-slate-800 transition cursor-pointer group shadow-sm"
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
                  <div className="text-xs font-bold text-white group-hover:text-amber-300 truncate mt-1.5">
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
