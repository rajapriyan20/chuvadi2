import React, { useState, useMemo } from 'react';
import { 
  Repeat, 
  Plus, 
  Search, 
  TrendingDown, 
  TrendingUp, 
  ArrowRightLeft, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Pause, 
  Play, 
  Pencil, 
  Trash2, 
  Zap, 
  Send,
  Layers,
  ChevronRight,
  Receipt,
  RotateCw,
  Sparkles
} from 'lucide-react';
import type { Account, RecurringTransaction, Transaction, RecurringFrequency } from '../../types';
import { 
  formatCurrency, 
  formatDate, 
  getTodayLocalDateString 
} from '../../utils/formatters';
import { 
  getFrequencyLabel, 
  calculateMonthlyEquivalent, 
  getRecurringStatusBadge,
  computeNextDueDate
} from '../../services/recurring';

interface RecurringTabProps {
  recurringTransactions: RecurringTransaction[];
  accounts: Account[];
  allTransactions: Transaction[];
  onOpenCreateModal: () => void;
  onOpenEditModal: (rule: RecurringTransaction) => void;
  onToggleActive: (rule: RecurringTransaction) => Promise<void>;
  onDeleteRule: (id: string) => Promise<void>;
  onPostNow: (rule: RecurringTransaction) => Promise<void>;
  onRunAutoPostCheck: () => Promise<void>;
  onSelectTxn?: (txn: Transaction) => void;
}

export const RecurringTab: React.FC<RecurringTabProps> = ({
  recurringTransactions,
  accounts,
  allTransactions,
  onOpenCreateModal,
  onOpenEditModal,
  onToggleActive,
  onDeleteRule,
  onPostNow,
  onRunAutoPostCheck,
  onSelectTxn
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME' | 'TRANSFER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL');
  const [isCheckingDue, setIsCheckingDue] = useState(false);
  const [postingRuleId, setPostingRuleId] = useState<string | null>(null);
  const [expandedHistoryRuleId, setExpandedHistoryRuleId] = useState<string | null>(null);

  const todayStr = useMemo(() => getTodayLocalDateString(), []);

  // Summary Metrics computed across all active recurring rules
  const metrics = useMemo(() => {
    let monthlyExpenses = 0;
    let monthlyIncome = 0;
    let monthlyTransfers = 0;
    let activeCount = 0;
    let dueSoonCount = 0;

    for (const r of recurringTransactions) {
      if (!r.isActive) continue;
      activeCount++;
      const monthlyEquiv = calculateMonthlyEquivalent(r.amount, r.frequency, r.interval || 1);

      if (r.type === 'EXPENSE') monthlyExpenses += monthlyEquiv;
      else if (r.type === 'INCOME') monthlyIncome += monthlyEquiv;
      else if (r.type === 'TRANSFER') monthlyTransfers += monthlyEquiv;

      const badge = getRecurringStatusBadge(r, todayStr);
      if (badge.isDueToday || badge.isOverdue || (badge.diffDays > 0 && badge.diffDays <= 7)) {
        dueSoonCount++;
      }
    }

    return {
      monthlyExpenses,
      monthlyIncome,
      monthlyTransfers,
      netMonthly: monthlyIncome - monthlyExpenses,
      activeCount,
      totalCount: recurringTransactions.length,
      dueSoonCount
    };
  }, [recurringTransactions, todayStr]);

  // Filtered recurring rules
  const filteredRules = useMemo(() => {
    return recurringTransactions.filter(r => {
      if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;
      if (statusFilter === 'ACTIVE' && !r.isActive) return false;
      if (statusFilter === 'PAUSED' && r.isActive) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const descMatch = r.description?.toLowerCase().includes(query);
        const catMatch = r.category?.toLowerCase().includes(query);
        const notesMatch = r.notes?.toLowerCase().includes(query);
        const amtMatch = String(r.amount).includes(query);
        return descMatch || catMatch || notesMatch || amtMatch;
      }

      return true;
    }).sort((a, b) => {
      // Active first, then by nextDueDate ascending
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return (a.nextDueDate || '').localeCompare(b.nextDueDate || '');
    });
  }, [recurringTransactions, typeFilter, statusFilter, searchTerm]);

  // Map rule ID to generated ledger transactions
  const ruleTransactionsMap = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of allTransactions) {
      if (t.recurringTransactionId) {
        if (!map.has(t.recurringTransactionId)) {
          map.set(t.recurringTransactionId, []);
        }
        map.get(t.recurringTransactionId)!.push(t);
      }
    }
    // Sort transactions descending by date
    for (const [id, txns] of map.entries()) {
      txns.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    }
    return map;
  }, [allTransactions]);

  const handleRunCheck = async () => {
    setIsCheckingDue(true);
    try {
      await onRunAutoPostCheck();
    } finally {
      setIsCheckingDue(false);
    }
  };

  const handlePostNowClick = async (rule: RecurringTransaction) => {
    setPostingRuleId(rule.id);
    try {
      await onPostNow(rule);
    } finally {
      setPostingRuleId(null);
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Top Banner / Metrics Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Monthly Committed Outflow */}
        <div className="bg-[#121820] border border-rose-500/20 rounded-2xl p-3.5 sm:p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              Monthly Outflow
            </span>
            <div className="w-6 h-6 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <TrendingDown size={14} />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-mono font-bold text-rose-400">
            -{formatCurrency(metrics.monthlyExpenses)}
          </div>
          <div className="text-[10px] text-slate-500">
            Normalized monthly commitments
          </div>
        </div>

        {/* Monthly Recurring Inflow */}
        <div className="bg-[#121820] border border-emerald-500/20 rounded-2xl p-3.5 sm:p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              Monthly Inflow
            </span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <TrendingUp size={14} />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-mono font-bold text-emerald-400">
            +{formatCurrency(metrics.monthlyIncome)}
          </div>
          <div className="text-[10px] text-slate-500">
            Scheduled recurring credits
          </div>
        </div>

        {/* Net Recurring Delta */}
        <div className="bg-[#121820] border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              Net Monthly Flow
            </span>
            <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <ArrowRightLeft size={14} />
            </div>
          </div>
          <div className={`text-lg sm:text-2xl font-mono font-bold ${
            metrics.netMonthly >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {metrics.netMonthly >= 0 ? '+' : ''}{formatCurrency(metrics.netMonthly)}
          </div>
          <div className="text-[10px] text-slate-500">
            Contracted monthly savings margin
          </div>
        </div>

        {/* Active Rules & Status */}
        <div className="bg-[#121820] border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              Active Rules
            </span>
            <div className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <Repeat size={14} />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-mono font-bold text-white flex items-center gap-2">
            <span>{metrics.activeCount}</span>
            <span className="text-xs text-slate-500 font-sans font-normal">/ {metrics.totalCount} rules</span>
          </div>
          <div className="text-[10px] text-amber-400/90 font-medium flex items-center gap-1">
            <Zap size={11} className="shrink-0" />
            <span>{metrics.dueSoonCount} due within 7 days</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filters & Action Buttons */}
      <div className="bg-[#121820] rounded-2xl border border-slate-800/90 p-3 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search recurring rules (rent, salary, broadband, amount...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0b0f15] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleRunCheck}
              disabled={isCheckingDue}
              className="px-3 sm:px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Scan and post any recurring transactions currently due"
            >
              <RotateCw size={13} className={isCheckingDue ? 'animate-spin text-amber-400' : ''} />
              <span className="hidden sm:inline">Check & Post Due</span>
              <span className="sm:hidden">Check Due</span>
            </button>

            <button
              type="button"
              onClick={onOpenCreateModal}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Add Recurring Rule</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
          {/* Type filters */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            {(['ALL', 'EXPENSE', 'INCOME', 'TRANSFER'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer capitalize ${
                  typeFilter === t
                    ? 'bg-slate-800 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                {t === 'ALL' ? 'All Types' : t.toLowerCase()}
              </button>
            ))}
          </div>

          {/* Status filters */}
          <div className="flex items-center gap-1">
            {(['ALL', 'ACTIVE', 'PAUSED'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer capitalize ${
                  statusFilter === s
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {s === 'ALL' ? 'All' : s.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recurring Rules List */}
      <div className="space-y-3">
        {filteredRules.length === 0 ? (
          <div className="bg-[#121820] rounded-2xl border border-slate-800 p-8 sm:p-12 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
              <Repeat size={26} />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-base font-bold text-white">
                {searchTerm || typeFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'No recurring rules match your filters'
                  : 'No recurring transactions configured yet'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Recurring transactions automate static ledger entries for predictable outflows and inflows (rent, subscriptions, salary, SIP investments). When you open the app on or after the expected date, the entry is automatically posted to your ledger.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>Create First Recurring Rule</span>
              </button>
            </div>
          </div>
        ) : (
          filteredRules.map((rule) => {
            const isExpense = rule.type === 'EXPENSE';
            const isIncome = rule.type === 'INCOME';
            const isTransfer = rule.type === 'TRANSFER';

            const fromAcc = accounts.find(a => a.id === rule.fromAccountId);
            const toAcc = accounts.find(a => a.id === rule.toAccountId);
            const statusBadge = getRecurringStatusBadge(rule, todayStr);
            const generatedTxns = ruleTransactionsMap.get(rule.id) || [];
            const isExpanded = expandedHistoryRuleId === rule.id;

            return (
              <div
                key={rule.id}
                className={`bg-[#121820] rounded-2xl border transition overflow-hidden shadow-sm ${
                  !rule.isActive
                    ? 'border-slate-800/60 opacity-75'
                    : statusBadge.isDueToday
                    ? 'border-amber-500/40 ring-1 ring-amber-500/20'
                    : statusBadge.isOverdue
                    ? 'border-rose-500/40 ring-1 ring-rose-500/20'
                    : 'border-slate-800 hover:border-slate-700/80'
                }`}
              >
                {/* Main Card Content */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Type Icon + Rule Info */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isExpense
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                        : isIncome
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                    }`}>
                      {isExpense ? (
                        <TrendingDown size={18} />
                      ) : isIncome ? (
                        <TrendingUp size={18} />
                      ) : (
                        <ArrowRightLeft size={18} />
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                          {rule.description}
                        </h4>
                        
                        {/* Due status badge */}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusBadge.colorClass}`}>
                          {statusBadge.label}
                        </span>

                        {rule.autoPost && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            <Zap size={10} className="fill-amber-400/40" />
                            <span>Auto-Post</span>
                          </span>
                        )}
                      </div>

                      {/* Cadence, Category, Account Line */}
                      <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-medium text-[11px]">
                          {getFrequencyLabel(rule.frequency, rule.interval)}
                        </span>

                        {rule.type !== 'TRANSFER' && (
                          <>
                            <span aria-hidden="true">•</span>
                            <span className="text-amber-300/80 font-medium">{rule.category}</span>
                          </>
                        )}

                        <span aria-hidden="true">•</span>
                        {isTransfer ? (
                          <span className="text-slate-300 font-mono text-[11px]">
                            {fromAcc?.name || 'Source'} → {toAcc?.name || 'Destination'}
                          </span>
                        ) : isExpense ? (
                          <span className="text-slate-300 font-mono text-[11px]">
                            {fromAcc?.name || 'Account'}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono text-[11px]">
                            {toAcc?.name || 'Account'}
                          </span>
                        )}
                      </div>

                      {/* Next Expected Due Date & Last Posted Date */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono pt-0.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock size={11} className="text-slate-400" />
                          <span>Next Expected: <b className="text-slate-300 font-sans">{formatDate(rule.nextDueDate)}</b></span>
                        </span>
                        {rule.lastPostedDate && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Last Posted: {formatDate(rule.lastPostedDate)}</span>
                          </>
                        )}
                        {rule.endDate && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Expires: {formatDate(rule.endDate)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/60">
                    {/* Amount Block */}
                    <div className="text-left md:text-right">
                      <div className={`text-base sm:text-lg font-mono font-bold tabular-nums ${
                        isExpense
                          ? (rule.amount < 0 ? 'text-emerald-400' : 'text-rose-400')
                          : isIncome
                          ? 'text-emerald-400'
                          : 'text-blue-300'
                      }`}>
                        {isExpense && (rule.amount < 0 ? '+' : '-')}
                        {isIncome && '+'}
                        {isExpense ? formatCurrency(Math.abs(rule.amount)) : formatCurrency(rule.amount)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium capitalize">
                        {rule.frequency.toLowerCase()}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5">
                      {/* Post Now Manual Trigger */}
                      <button
                        type="button"
                        onClick={() => handlePostNowClick(rule)}
                        disabled={postingRuleId === rule.id}
                        className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 active:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Post an occurrence of this recurring rule to your ledger right now"
                      >
                        <Send size={13} className={postingRuleId === rule.id ? 'animate-bounce' : ''} />
                        <span className="hidden sm:inline">Post Now</span>
                      </button>

                      {/* Pause / Resume */}
                      <button
                        type="button"
                        onClick={() => onToggleActive(rule)}
                        className={`p-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                          rule.isActive
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                            : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
                        }`}
                        title={rule.isActive ? 'Pause recurring postings' : 'Resume recurring rule'}
                      >
                        {rule.isActive ? <Pause size={14} /> : <Play size={14} />}
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => onOpenEditModal(rule)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                        title="Edit recurring rule"
                      >
                        <Pencil size={14} />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => onDeleteRule(rule.id)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                        title="Delete recurring rule"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Generated History Footnote / Collapsible */}
                {generatedTxns.length > 0 && (
                  <div className="bg-[#0b0f15] border-t border-slate-800/80 px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => setExpandedHistoryRuleId(isExpanded ? null : rule.id)}
                      className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-amber-300 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 font-medium">
                        <Receipt size={13} className="text-amber-400" />
                        <span>Recorded Ledger Entries ({generatedTxns.length})</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <span>{isExpanded ? 'Hide history' : 'Show entries'}</span>
                        <ChevronRight size={13} className={`transition transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/60 space-y-1.5">
                        {generatedTxns.slice(0, 5).map((t) => (
                          <div
                            key={t.id}
                            onClick={() => onSelectTxn && onSelectTxn(t)}
                            className={`p-2 rounded-xl bg-[#121820] hover:bg-slate-800/50 border border-slate-800/60 flex items-center justify-between text-xs transition ${
                              onSelectTxn ? 'cursor-pointer' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span className="text-slate-200 font-medium">{formatDate(t.date)}</span>
                              <span className="text-slate-500 font-mono text-[11px]">#{t.id.slice(-6)}</span>
                            </div>
                            <div className="font-mono font-bold text-slate-300">
                              {formatCurrency(t.amount)}
                            </div>
                          </div>
                        ))}
                        {generatedTxns.length > 5 && (
                          <div className="text-center text-[10px] text-slate-500 italic pt-1">
                            +{generatedTxns.length - 5} older posted entries in your ledger
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
