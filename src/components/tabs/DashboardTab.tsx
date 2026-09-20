import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Car, 
  AlertTriangle, 
  CheckSquare, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft,
  ChevronRight,
  ShieldAlert,
  Wallet
} from 'lucide-react';
import { formatCurrency, formatDate, getDaysRemaining } from '../../utils/formatters';
import type { Account, Transaction, Vehicle, TodoNote, ActiveTab } from '../../types';

interface DashboardTabProps {
  totalNetWorth: number;
  monthlyExpense: number;
  monthlyIncome: number;
  accounts: Account[];
  transactions: Transaction[];
  vehicles: Vehicle[];
  todos: TodoNote[];
  onOpenQuickAdd: () => void;
  onOpenPassbook: (account: Account) => void;
  onSelectTxn: (txn: Transaction) => void;
  onSelectTab: (tab: ActiveTab) => void;
  onToggleTodoItem: (noteId: string, itemId: string) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  totalNetWorth,
  monthlyExpense,
  monthlyIncome,
  accounts,
  transactions,
  vehicles,
  todos,
  onOpenQuickAdd,
  onOpenPassbook,
  onSelectTxn,
  onSelectTab,
  onToggleTodoItem
}) => {
  // Identify critical renewals expiring in <= 30 days
  const criticalRenewals = vehicles.flatMap((v) => {
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

  const recentTransactions = transactions.slice(0, 6);
  const pinnedTodos = todos.filter(t => t.pinned);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Financial Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Net Worth */}
        <div className="p-5 bg-gradient-to-br from-[#18202b] to-[#121820] rounded-3xl border border-amber-500/20 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Total Net Worth</span>
            <Wallet size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-100 font-mono mt-2 tracking-tight">
            {formatCurrency(totalNetWorth)}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span>Across {accounts.length} active accounts</span>
          </div>
        </div>

        {/* Monthly Inflow */}
        <div className="p-5 bg-[#141b24] rounded-3xl border border-emerald-900/30 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Monthly Inflow</span>
            <TrendingUp size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-2">
            +{formatCurrency(monthlyIncome)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Salary & credits this month</div>
        </div>

        {/* Monthly Expenses */}
        <div className="p-5 bg-[#141b24] rounded-3xl border border-rose-900/30 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Monthly Expenses</span>
            <TrendingDown size={16} className="text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono mt-2">
            -{formatCurrency(monthlyExpense)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Total outflow recorded</div>
        </div>
      </div>

      {/* Critical Renewal Alerts Banner (if any) */}
      {criticalRenewals.length > 0 && (
        <div className="p-4 bg-amber-950/30 border border-amber-600/40 rounded-3xl">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm mb-2">
            <ShieldAlert size={18} className="animate-pulse" />
            <span>Upcoming Garage Renewals ({criticalRenewals.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {criticalRenewals.map((r, i) => (
              <div
                key={i}
                onClick={() => onSelectTab('garage')}
                className="p-3 bg-[#131922] hover:bg-[#18202c] rounded-2xl border border-amber-700/30 flex items-center justify-between cursor-pointer transition"
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Car size={14} className="text-amber-400" />
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

      {/* Quick Accounts Carousel / Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Accounts & Passbooks
          </h2>
          <button
            onClick={() => onSelectTab('finance')}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {accounts.slice(0, 4).map((acc) => (
            <div
              key={acc.id}
              onClick={() => onOpenPassbook(acc)}
              className="p-4 bg-[#141b24] hover:bg-[#18212c] rounded-2xl border border-slate-800 transition cursor-pointer group shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: acc.color || '#0284c7' }}
                />
                <span className="text-[10px] uppercase font-semibold text-slate-400">
                  {acc.type}
                </span>
              </div>
              <div className="text-xs font-bold text-white group-hover:text-amber-300 truncate mt-2">
                {acc.name}
              </div>
              <div className="text-sm font-bold text-amber-200 font-mono mt-1">
                {formatCurrency(acc.balance)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout: Recent Transactions + Pinned Checklists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions (2 columns on large) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Recent Transactions
            </h2>
            <button
              onClick={() => onSelectTab('finance')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>Full Ledger</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="bg-[#131922] rounded-3xl border border-slate-800/90 divide-y divide-slate-800/60 overflow-hidden">
            {recentTransactions.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No recent transactions. Tap "+ Record" to add your first expense or income.
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
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                          t.type === 'TRANSFER'
                            ? 'bg-blue-500/15 text-blue-400'
                            : isExpense
                            ? 'bg-rose-500/15 text-rose-400'
                            : 'bg-emerald-500/15 text-emerald-400'
                        }`}
                      >
                        {t.type === 'TRANSFER' ? (
                          <ArrowRightLeft size={17} />
                        ) : isExpense ? (
                          <ArrowUpRight size={17} />
                        ) : (
                          <ArrowDownLeft size={17} />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white tracking-tight">
                          {t.description}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{formatDate(t.date)}</span>
                          <span>•</span>
                          <span className="text-amber-300/80">{t.category}</span>
                          {t.fuelLiters && <span>({t.fuelLiters}L)</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
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
        </div>

        {/* Pinned Checklists (1 column on large) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Active Checklists
            </h2>
            <button
              onClick={() => onSelectTab('todos')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>Manage</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {pinnedTodos.length === 0 ? (
              <div className="p-6 bg-[#131922] rounded-3xl border border-slate-800 text-center text-slate-500 text-xs">
                No pinned checklists. Keep track of vehicle maintenance, shopping, or financial goals.
              </div>
            ) : (
              pinnedTodos.map((note) => (
                <div
                  key={note.id}
                  className="p-4 bg-[#141b24] rounded-3xl border border-amber-500/20 shadow-sm space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-amber-200">{note.title}</h3>
                    <span className="text-[10px] text-slate-400">
                      {note.items.filter(i => i.completed).length}/{note.items.length} done
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {note.items.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => onToggleTodoItem(note.id, item.id)}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          readOnly
                          className="w-3.5 h-3.5 accent-amber-500 rounded pointer-events-none"
                        />
                        <span className={`text-xs ${item.completed ? 'line-through text-slate-500' : 'text-slate-300 group-hover:text-white'}`}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
