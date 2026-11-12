import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft, 
  Layers,
  Receipt,
  Inbox,
  PieChart,
  ArrowUpDown,
  Check,
  Filter,
  Tag,
  Landmark,
  X,
  ArrowRight,
  ListFilter,
  Table as TableIcon,
  Eye,
  TrendingDown,
  TrendingUp,
  Calendar,
  Fuel,
  CreditCard,
  Repeat
} from 'lucide-react';
import { 
  formatCurrency, 
  formatDate, 
  formatDateToLocalYMD, 
  getTodayLocalDateString, 
  getAllExpenseCategories,
  getTransferFlowStyle
} from '../../utils/formatters';
import type { Account, Transaction, Entity, AccountType, Vehicle, RecurringTransaction } from '../../types';
import type { User } from 'firebase/auth';
import { ChartOfAccounts } from '../finance/ChartOfAccounts';
import { InboxReviewTab } from '../finance/InboxReviewTab';
import { RecurringTab } from '../finance/RecurringTab';
import { ReportsTab } from './ReportsTab';

export type TransactionSortOption = 
  | 'DATE_DESC'
  | 'DATE_ASC'
  | 'AMOUNT_DESC'
  | 'AMOUNT_ASC'
  | 'ENTRY_DESC'
  | 'ENTRY_ASC';

const SORT_OPTIONS: { id: TransactionSortOption; label: string; desc: string }[] = [
  { id: 'DATE_DESC', label: 'Date: Newest First', desc: 'Default calendar order' },
  { id: 'DATE_ASC', label: 'Date: Oldest First', desc: 'Earliest transaction dates' },
  { id: 'AMOUNT_DESC', label: 'Amount: High to Low', desc: 'Largest transaction values' },
  { id: 'AMOUNT_ASC', label: 'Amount: Low to High', desc: 'Smallest transaction values' },
  { id: 'ENTRY_DESC', label: 'Recently Added', desc: 'Order of record creation' },
  { id: 'ENTRY_ASC', label: 'Oldest Added', desc: 'First records created' }
];

function getRelativeDateLabel(dateStr: string): string {
  if (!dateStr) return '';
  const today = getTodayLocalDateString();
  if (dateStr === today) return 'Today';
  
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const yesterdayStr = formatDateToLocalYMD(now);
  if (dateStr === yesterdayStr) return 'Yesterday';
  
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  } catch {
    return dateStr;
  }
}

interface FinanceTabProps {
  accounts: Account[];
  transactions: Transaction[];
  vehicles?: Vehicle[];
  entities: Entity[];
  recurringTransactions?: RecurringTransaction[];
  onOpenNewAccount: (defaultType?: AccountType) => void;
  onEditAccount: (account: Account) => void;
  onSaveAccount: (account: Account) => Promise<void>;
  onDeleteAccount?: (id: string) => Promise<void>;
  onOpenPassbook: (account: Account) => void;
  onSelectTxn: (txn: Transaction) => void;
  onOpenNewTxn: () => void;
  onOpenNewEntity: () => void;
  onDeleteEntity: (id: string) => Promise<void>;
  onOpenNewTxnWithDefaults?: (defaults: Partial<Transaction>, emailId?: string) => void;
  onOpenCreateRecurringModal?: () => void;
  onOpenEditRecurringModal?: (rule: RecurringTransaction) => void;
  onToggleRecurringActive?: (rule: RecurringTransaction) => Promise<void>;
  onDeleteRecurringRule?: (id: string) => Promise<void>;
  onPostRecurringNow?: (rule: RecurringTransaction) => Promise<void>;
  onRunRecurringCheck?: () => Promise<void>;
  isGuestMode?: boolean;
  user?: User | null;
  activeSubTab?: 'coa' | 'transactions' | 'recurring' | 'reports' | 'inbox';
  onSubTabChange?: (tab: 'coa' | 'transactions' | 'recurring' | 'reports' | 'inbox') => void;
}

export const FinanceTab: React.FC<FinanceTabProps> = ({
  accounts,
  transactions,
  vehicles = [],
  entities: _entities,
  recurringTransactions = [],
  onOpenNewAccount,
  onEditAccount,
  onSaveAccount,
  onDeleteAccount,
  onOpenPassbook,
  onSelectTxn,
  onOpenNewTxn,
  onOpenNewEntity: _onOpenNewEntity,
  onDeleteEntity: _onDeleteEntity,
  onOpenNewTxnWithDefaults,
  onOpenCreateRecurringModal,
  onOpenEditRecurringModal,
  onToggleRecurringActive,
  onDeleteRecurringRule,
  onPostRecurringNow,
  onRunRecurringCheck,
  isGuestMode = false,
  user,
  activeSubTab,
  onSubTabChange
}) => {
  // Subtab switcher state
  const [internalSubTab, setInternalSubTab] = useState<'coa' | 'transactions' | 'recurring' | 'reports' | 'inbox'>('coa');
  const subTab = activeSubTab || internalSubTab;
  const setSubTab = (t: 'coa' | 'transactions' | 'recurring' | 'reports' | 'inbox') => {
    setInternalSubTab(t);
    onSubTabChange?.(t);
  };

  // Transaction view mode: Stream (Timeline) vs Table (Spreadsheet)
  const [viewLayout, setViewLayout] = useState<'stream' | 'table'>('stream');

  // Filters & Sorting state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME' | 'TRANSFER'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<TransactionSortOption>('DATE_DESC');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const availableCategories = useMemo(() => {
    return getAllExpenseCategories(transactions.map(t => t.category));
  }, [transactions]);

  // Filter & sort transactions
  const filteredTransactions = useMemo(() => {
    const list = transactions.filter((t) => {
      if (typeFilter !== 'ALL' && t.type !== typeFilter) return false;
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
      if (selectedAccountId !== 'ALL') {
        if (t.fromAccountId !== selectedAccountId && t.toAccountId !== selectedAccountId) {
          return false;
        }
      }
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        return (
          t.description.toLowerCase().includes(s) ||
          t.category.toLowerCase().includes(s) ||
          String(t.amount).includes(s)
        );
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'DATE_DESC') {
        const cmp = (b.date || '').localeCompare(a.date || '');
        if (cmp !== 0) return cmp;
        const timeCmp = (b.time || '00:00').localeCompare(a.time || '00:00');
        if (timeCmp !== 0) return timeCmp;
        return (b.timestamp || 0) - (a.timestamp || 0);
      }
      if (sortBy === 'DATE_ASC') {
        const cmp = (a.date || '').localeCompare(b.date || '');
        if (cmp !== 0) return cmp;
        const timeCmp = (a.time || '00:00').localeCompare(b.time || '00:00');
        if (timeCmp !== 0) return timeCmp;
        return (a.timestamp || 0) - (b.timestamp || 0);
      }
      if (sortBy === 'AMOUNT_DESC') {
        const cmp = (b.amount || 0) - (a.amount || 0);
        if (cmp !== 0) return cmp;
        return (b.date || '').localeCompare(a.date || '');
      }
      if (sortBy === 'AMOUNT_ASC') {
        const cmp = (a.amount || 0) - (b.amount || 0);
        if (cmp !== 0) return cmp;
        return (b.date || '').localeCompare(a.date || '');
      }
      if (sortBy === 'ENTRY_DESC') {
        return (b.timestamp || 0) - (a.timestamp || 0);
      }
      if (sortBy === 'ENTRY_ASC') {
        return (a.timestamp || 0) - (b.timestamp || 0);
      }
      return 0;
    });
  }, [transactions, typeFilter, categoryFilter, selectedAccountId, searchTerm, sortBy]);

  // Summary Metrics computed from filtered transactions (excluding disabled)
  const summaryMetrics = useMemo(() => {
    let expenses = 0;
    let income = 0;
    let transfers = 0;
    for (const t of filteredTransactions) {
      if (t.disabled) continue; // Excluded from ledger balance calculations
      if (t.type === 'EXPENSE') expenses += (t.amount || 0);
      else if (t.type === 'INCOME') income += (t.amount || 0);
      else if (t.type === 'TRANSFER') transfers += (t.amount || 0);
    }
    return {
      expenses,
      income,
      transfers,
      net: income - expenses,
      count: filteredTransactions.length
    };
  }, [filteredTransactions]);

  // Grouped transactions by date for Stream view
  const groupedTransactions = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of filteredTransactions) {
      const d = t.date || 'Undated';
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(t);
    }

    const groups: {
      date: string;
      dateLabel: string;
      relativeLabel: string;
      dayExpenses: number;
      dayIncome: number;
      dayTransfers: number;
      items: Transaction[];
    }[] = [];

    for (const [date, items] of map.entries()) {
      let dayExpenses = 0;
      let dayIncome = 0;
      let dayTransfers = 0;
      for (const item of items) {
        if (item.disabled) continue; // Excluded from daily totals
        if (item.type === 'EXPENSE') dayExpenses += (item.amount || 0);
        else if (item.type === 'INCOME') dayIncome += (item.amount || 0);
        else if (item.type === 'TRANSFER') dayTransfers += (item.amount || 0);
      }
      groups.push({
        date,
        dateLabel: formatDate(date),
        relativeLabel: getRelativeDateLabel(date),
        dayExpenses,
        dayIncome,
        dayTransfers,
        items
      });
    }
    return groups;
  }, [filteredTransactions]);

  const hasActiveFilters = searchTerm.trim() !== '' || typeFilter !== 'ALL' || categoryFilter !== 'ALL' || selectedAccountId !== 'ALL';

  const clearAllFilters = () => {
    setSearchTerm('');
    setTypeFilter('ALL');
    setCategoryFilter('ALL');
    setSelectedAccountId('ALL');
  };

  return (
    <div className="space-y-3 pb-20 md:pb-8">
      {/* Sub-tab Switcher: Chart of Accounts FIRST, then Transactions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-0.5">
        <div className="inline-flex p-1 bg-[#121820] rounded-2xl border border-slate-800 self-start sm:self-auto">
          <button
            id="finance-subtab-coa-btn"
            onClick={() => setSubTab('coa')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              subTab === 'coa'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Layers size={14} />
            <span>Chart of Accounts</span>
          </button>
          <button
            id="finance-subtab-transactions-btn"
            onClick={() => setSubTab('transactions')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              subTab === 'transactions'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Receipt size={14} />
            <span>Transactions</span>
          </button>
          <button
            id="finance-subtab-recurring-btn"
            onClick={() => setSubTab('recurring')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              subTab === 'recurring'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Repeat size={14} />
            <span>Recurring</span>
            {recurringTransactions && recurringTransactions.length > 0 && (
              <span className={`px-1.5 py-0.2 text-[10px] rounded-md font-mono ${
                subTab === 'recurring' ? 'bg-slate-950/25 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
              }`}>
                {recurringTransactions.length}
              </span>
            )}
          </button>
          <button
            id="finance-subtab-reports-btn"
            onClick={() => setSubTab('reports')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              subTab === 'reports'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <PieChart size={14} />
            <span>Reports & Analytics</span>
          </button>
          <button
            id="finance-subtab-inbox-btn"
            onClick={() => setSubTab('inbox')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              subTab === 'inbox'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Inbox size={14} />
            <span>Inbox / Review</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 hidden lg:block">
          {subTab === 'coa' && <span>Categorised, Table & PowerBI Decomposition Views</span>}
          {subTab === 'transactions' && <span>Chronological Ledger, High-Density Table & Financial Auditing</span>}
          {subTab === 'recurring' && <span>Scheduled Subscriptions, Inflows & Automated Posting Engine</span>}
          {subTab === 'reports' && <span>Visual Charts, Category Cash Flow & Analytics</span>}
          {subTab === 'inbox' && <span>Gmail Expense Extraction & Rule Filters</span>}
        </div>
      </div>

      {/* View 1: Chart of Accounts */}
      {subTab === 'coa' && (
        <ChartOfAccounts
          accounts={accounts}
          transactions={transactions}
          onOpenNewAccount={onOpenNewAccount}
          onEditAccount={onEditAccount}
          onSaveAccount={onSaveAccount}
          onDeleteAccount={onDeleteAccount}
          onOpenPassbook={onOpenPassbook}
          onSelectTxn={onSelectTxn}
        />
      )}

      {/* View 2: Redesigned Transactions Module */}
      {subTab === 'transactions' && (
        <div className="space-y-3.5 pt-0.5">
          {/* Top Bar Header & Record CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-white tracking-tight">Transactions Ledger</h2>
                <span className="text-xs font-mono text-slate-400">
                  {summaryMetrics.count} {summaryMetrics.count === 1 ? 'record' : 'records'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Double-entry cashflows, categorized receipts, and bank transfers
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              {/* View Mode Toggle: Stream vs Table */}
              <div className="inline-flex p-1 bg-[#121820] rounded-xl border border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewLayout('stream')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    viewLayout === 'stream'
                      ? 'bg-slate-800 text-amber-300 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Timeline / Stream view grouped by date"
                >
                  <ListFilter size={13} />
                  <span>Stream</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewLayout('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    viewLayout === 'table'
                      ? 'bg-slate-800 text-amber-300 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="High-density spreadsheet table grid"
                >
                  <TableIcon size={13} />
                  <span>Table</span>
                </button>
              </div>

              {/* Record Transaction Button */}
              <button
                id="transactions-record-txn-btn"
                onClick={onOpenNewTxn}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md shrink-0 cursor-pointer"
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>Record Transaction</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Outflows / Expenses */}
            <div className="bg-[#121820] border border-slate-800/90 rounded-2xl p-3 sm:p-3.5">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                <span>Total Outflow</span>
                <TrendingDown size={14} className="text-rose-400" />
              </div>
              <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-rose-400 mt-1">
                -{formatCurrency(summaryMetrics.expenses)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Expenses in view</div>
            </div>

            {/* Inflows / Income */}
            <div className="bg-[#121820] border border-slate-800/90 rounded-2xl p-3 sm:p-3.5">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                <span>Total Inflow</span>
                <TrendingUp size={14} className="text-emerald-400" />
              </div>
              <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-emerald-400 mt-1">
                +{formatCurrency(summaryMetrics.income)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Income credits in view</div>
            </div>

            {/* Net Movement */}
            <div className="bg-[#121820] border border-slate-800/90 rounded-2xl p-3 sm:p-3.5">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                <span>Net Cashflow</span>
                <ArrowRightLeft size={14} className={summaryMetrics.net >= 0 ? "text-emerald-400" : "text-amber-400"} />
              </div>
              <div 
                className={`text-base sm:text-lg font-bold font-mono tabular-nums mt-1 ${
                  summaryMetrics.net > 0 
                    ? 'text-emerald-400' 
                    : summaryMetrics.net < 0 
                    ? 'text-amber-400' 
                    : 'text-slate-300'
                }`}
              >
                {summaryMetrics.net > 0 && '+'}
                {formatCurrency(summaryMetrics.net)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Net balance delta</div>
            </div>

            {/* Internal Transfers Volume */}
            <div className="bg-[#121820] border border-slate-800/90 rounded-2xl p-3 sm:p-3.5">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                <span>Transfers</span>
                <ArrowRight size={14} className="text-blue-400" />
              </div>
              <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-blue-300 mt-1">
                {formatCurrency(summaryMetrics.transfers)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Account reallocations</div>
            </div>
          </div>

          {/* Interactive Filter Toolbar */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              {/* Type Segmented Buttons */}
              <div className="inline-flex p-1 bg-[#121820] rounded-2xl border border-slate-800 shrink-0 self-start">
                {(
                  [
                    { id: 'ALL', label: 'All Records' },
                    { id: 'EXPENSE', label: 'Expenses' },
                    { id: 'INCOME', label: 'Income' },
                    { id: 'TRANSFER', label: 'Transfers' }
                  ] as const
                ).map((tab) => {
                  const isActive = typeFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setTypeFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isActive
                          ? tab.id === 'TRANSFER'
                            ? 'bg-blue-500/25 text-blue-300 border border-blue-500/40 shadow-sm'
                            : tab.id === 'EXPENSE'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                            : tab.id === 'INCOME'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                            : 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Sort Popover Button */}
              <div className="relative self-end sm:self-auto">
                <button
                  id="transactions-sort-btn"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSortMenu(prev => !prev);
                  }}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-sm cursor-pointer ${
                    sortBy !== 'DATE_DESC'
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-[#121820] hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                  title="Change transaction sorting"
                >
                  <ArrowUpDown size={13} className={sortBy !== 'DATE_DESC' ? 'text-amber-400' : 'text-slate-400'} />
                  <span>{SORT_OPTIONS.find(o => o.id === sortBy)?.label || 'Sort'}</span>
                </button>

                {showSortMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowSortMenu(false)} 
                    />
                    <div className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] bg-[#161d26] border border-slate-700/90 rounded-2xl shadow-2xl py-1.5 z-50 divide-y divide-slate-800/80 animate-fadeIn">
                      <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-900/60">
                        Sort Transactions By
                      </div>
                      <div className="py-1">
                        {SORT_OPTIONS.map((opt) => {
                          const isSelected = sortBy === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setSortBy(opt.id);
                                setShowSortMenu(false);
                              }}
                              className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-800/60 transition cursor-pointer ${
                                isSelected ? 'text-amber-400 font-bold bg-amber-500/10' : 'text-slate-300'
                              }`}
                            >
                              <div>
                                <div className="text-xs">{opt.label}</div>
                                <div className="text-[10px] text-slate-500 font-normal">{opt.desc}</div>
                              </div>
                              {isSelected && <Check size={14} className="text-amber-400 shrink-0 ml-2" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Filter Inputs Strip: Search, Category, Account */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[140px] sm:min-w-[200px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search description, payee, amount..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#121820] border border-slate-800 rounded-xl pl-8 pr-7 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                    title="Clear search"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Category Select */}
              <div className="relative shrink-0">
                <Tag size={13} className={`absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 ${categoryFilter !== 'ALL' ? 'text-amber-400' : 'text-slate-400'}`} />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={`bg-[#121820] border rounded-xl pl-7 pr-3 py-2 text-xs focus:outline-none cursor-pointer transition max-w-[140px] sm:max-w-[170px] truncate ${
                    categoryFilter !== 'ALL'
                      ? 'border-amber-500/50 text-amber-300 font-semibold bg-amber-500/10'
                      : 'border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                  title="Filter by category"
                >
                  <option value="ALL">All Categories</option>
                  {availableCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Account Select */}
              <div className="relative shrink-0">
                <Landmark size={13} className={`absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 ${selectedAccountId !== 'ALL' ? 'text-amber-400' : 'text-slate-400'}`} />
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className={`bg-[#121820] border rounded-xl pl-7 pr-3 py-2 text-xs focus:outline-none cursor-pointer transition max-w-[130px] sm:max-w-[160px] truncate ${
                    selectedAccountId !== 'ALL'
                      ? 'border-amber-500/50 text-amber-300 font-semibold bg-amber-500/10'
                      : 'border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                  title="Filter by account"
                >
                  <option value="ALL">All Accounts</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              {/* Reset Filters CTA if any filter active */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-2.5 py-2 text-xs text-amber-400 hover:text-amber-300 underline font-semibold shrink-0 cursor-pointer"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* =============================================================== */}
          {/* VIEW MODE 1: Chronological Ledger Stream (Grouped by Date)     */}
          {/* =============================================================== */}
          {viewLayout === 'stream' && (
            <div className="space-y-4">
              {filteredTransactions.length === 0 ? (
                <div className="bg-[#121820] rounded-2xl border border-slate-800/90 p-12 text-center">
                  <Receipt size={32} className="mx-auto text-slate-600 mb-3" />
                  <h4 className="text-sm font-bold text-slate-300">No Transactions Found</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {hasActiveFilters 
                      ? "No records match your selected filters. Try clearing some filters to see more entries."
                      : "Start tracking by recording your first transaction or importing from Gmail."}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    {hasActiveFilters ? (
                      <button
                        type="button"
                        onClick={clearAllFilters}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={onOpenNewTxn}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Record Transaction
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                groupedTransactions.map((group) => {
                  const dayNet = group.dayIncome - group.dayExpenses;
                  return (
                    <div key={group.date} className="space-y-1.5">
                      {/* Date Group Header */}
                      <div className="flex items-center justify-between px-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">{group.dateLabel}</span>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className="text-slate-400">{group.relativeLabel}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-mono">
                          {group.dayExpenses > 0 && (
                            <span className="text-rose-400 font-semibold">
                              Spent: {formatCurrency(group.dayExpenses)}
                            </span>
                          )}
                          {group.dayIncome > 0 && (
                            <span className="text-emerald-400 font-semibold">
                              Inflow: +{formatCurrency(group.dayIncome)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Items in this date group */}
                      <div className="bg-[#121820] rounded-2xl border border-slate-800/80 divide-y divide-slate-800/60 overflow-hidden shadow-sm">
                        {group.items.map((t) => {
                          const isExpense = t.type === 'EXPENSE';
                          const isIncome = t.type === 'INCOME';
                          const isTransfer = t.type === 'TRANSFER';
                          const transferStyle = isTransfer ? getTransferFlowStyle(t, accounts) : null;

                          const fromAccountName = accounts.find(a => a.id === t.fromAccountId)?.name || 'Source Account';
                          const toAccountName = accounts.find(a => a.id === t.toAccountId)?.name || 'Destination Account';

                          return (
                            <div
                              key={t.id}
                              onClick={() => onSelectTxn(t)}
                              className="p-3.5 flex items-center justify-between hover:bg-slate-800/40 cursor-pointer transition group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {/* Type Icon */}
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                    isTransfer
                                      ? transferStyle?.badgeBgClass
                                      : isExpense
                                      ? 'bg-rose-500/15 text-rose-400'
                                      : 'bg-emerald-500/15 text-emerald-400'
                                  }`}
                                >
                                  {isTransfer ? (
                                    <ArrowRightLeft size={16} />
                                  ) : isExpense ? (
                                    <ArrowUpRight size={16} />
                                  ) : (
                                    <ArrowDownLeft size={16} />
                                  )}
                                </div>

                                {/* Description and Unboxed Metadata */}
                                <div className="min-w-0">
                                  {isTransfer ? (
                                    <div className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                                      <span className="text-slate-200">{fromAccountName}</span>
                                      <ArrowRight size={12} className="text-blue-400 shrink-0" />
                                      <span className="text-slate-200">{toAccountName}</span>
                                    </div>
                                  ) : (
                                    <div className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                                      {t.description}
                                    </div>
                                  )}

                                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <span className={isTransfer ? "text-blue-300/80 font-medium" : "text-amber-300/80"}>
                                      {t.category || (isTransfer ? 'Transfer' : 'General')}
                                    </span>
                                    
                                    {!isTransfer && (
                                      <>
                                        <span aria-hidden="true" className="text-slate-600">·</span>
                                        <span className="text-slate-400 truncate max-w-[140px] sm:max-w-xs">
                                          {isExpense ? fromAccountName : toAccountName}
                                        </span>
                                      </>
                                    )}

                                    {t.isFuel && t.fuelLiters && (
                                      <>
                                        <span aria-hidden="true" className="text-slate-600">·</span>
                                        <span className="text-amber-400 font-mono flex items-center gap-1">
                                          <Fuel size={10} />
                                          {t.fuelLiters}L
                                        </span>
                                      </>
                                    )}

                                    {t.odometer && (
                                      <>
                                        <span aria-hidden="true" className="text-slate-600">·</span>
                                        <span className="text-slate-400 font-mono">
                                          {t.odometer.toLocaleString()} km
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Amount & Type on Right */}
                              <div className="text-right shrink-0 ml-3">
                                <div
                                  className={`text-sm font-bold font-mono tabular-nums ${
                                    t.disabled
                                      ? 'line-through text-slate-500 opacity-60'
                                      : isTransfer 
                                      ? transferStyle?.colorClass 
                                      : isExpense 
                                      ? 'text-rose-400' 
                                      : 'text-emerald-400'
                                  }`}
                                >
                                  {isTransfer 
                                    ? `${transferStyle?.sign}${formatCurrency(t.amount)}` 
                                    : isExpense 
                                    ? `-${formatCurrency(t.amount)}` 
                                    : `+${formatCurrency(t.amount)}`}
                                </div>
                                <div className="text-[10px] text-slate-500 capitalize flex items-center justify-end gap-1 mt-0.5">
                                  <span>{t.type.toLowerCase()}</span>
                                  {t.disabled && (
                                    <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                      Disabled
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* VIEW MODE 2: High-Density Table / Spreadsheet Grid              */}
          {/* =============================================================== */}
          {viewLayout === 'table' && (
            <div className="bg-[#121820] rounded-2xl border border-slate-800/90 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#0e141c] text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-800">
                      <th className="py-3 px-3.5">Date</th>
                      <th className="py-3 px-3.5">Description / Payee</th>
                      <th className="py-3 px-3.5">Category</th>
                      <th className="py-3 px-3.5">Account / Flow</th>
                      <th className="py-3 px-3.5">Type</th>
                      <th className="py-3 px-3.5 text-right">Amount</th>
                      <th className="py-3 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                          No transactions match your current filters.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((t) => {
                        const isExpense = t.type === 'EXPENSE';
                        const isIncome = t.type === 'INCOME';
                        const isTransfer = t.type === 'TRANSFER';
                        const transferStyle = isTransfer ? getTransferFlowStyle(t, accounts) : null;

                        const fromAccountName = accounts.find(a => a.id === t.fromAccountId)?.name || '—';
                        const toAccountName = accounts.find(a => a.id === t.toAccountId)?.name || '—';

                        return (
                          <tr
                            key={t.id}
                            onClick={() => onSelectTxn(t)}
                            className="hover:bg-slate-800/40 cursor-pointer transition group"
                          >
                            {/* Date */}
                            <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-slate-300">
                              {formatDate(t.date)}
                            </td>

                            {/* Description */}
                            <td className="py-2.5 px-3.5 max-w-[220px] truncate font-medium text-white group-hover:text-amber-300 transition-colors">
                              {t.description}
                              {t.isFuel && t.fuelLiters && (
                                <span className="ml-1.5 text-[10px] text-amber-400 font-mono">
                                  ({t.fuelLiters}L)
                                </span>
                              )}
                            </td>

                            {/* Category */}
                            <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-300">
                              <span className={isTransfer ? "text-blue-300/80" : "text-amber-300/90"}>
                                {t.category || (isTransfer ? 'Transfer' : 'General')}
                              </span>
                            </td>

                            {/* Account Flow */}
                            <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-400 text-[11px]">
                              {isTransfer ? (
                                <span className="flex items-center gap-1">
                                  <span>{fromAccountName}</span>
                                  <ArrowRight size={10} className="text-blue-400 shrink-0" />
                                  <span>{toAccountName}</span>
                                </span>
                              ) : isExpense ? (
                                <span>{fromAccountName}</span>
                              ) : (
                                <span>{toAccountName}</span>
                              )}
                            </td>

                            {/* Type */}
                            <td className="py-2.5 px-3.5 whitespace-nowrap">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider ${
                                  isTransfer
                                    ? (transferStyle?.isBankInTo ? 'text-emerald-400' : transferStyle?.isBankInFrom ? 'text-rose-400' : 'text-blue-400')
                                    : isExpense
                                    ? 'text-rose-400'
                                    : 'text-emerald-400'
                                }`}
                              >
                                {t.type}
                              </span>
                            </td>

                            {/* Amount */}
                            <td className="py-2.5 px-3.5 whitespace-nowrap text-right font-mono font-bold tabular-nums">
                              <span
                                className={
                                  t.disabled
                                    ? 'line-through text-slate-500 opacity-60'
                                    : isTransfer
                                    ? transferStyle?.colorClass
                                    : isExpense
                                    ? 'text-rose-400'
                                    : 'text-emerald-400'
                                }
                              >
                                {isTransfer 
                                  ? `${transferStyle?.sign}${formatCurrency(t.amount)}` 
                                  : isExpense 
                                  ? `-${formatCurrency(t.amount)}` 
                                  : `+${formatCurrency(t.amount)}`}
                              </span>
                              {t.disabled && (
                                <span className="ml-1.5 text-[9px] font-bold px-1 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                  Disabled
                                </span>
                              )}
                            </td>

                            {/* Action / Inspect */}
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectTxn(t);
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition cursor-pointer"
                                title="View transaction details"
                              >
                                <Eye size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View 3: Recurring Transactions Command Center */}
      {subTab === 'recurring' && (
        <div className="pt-1">
          <RecurringTab
            recurringTransactions={recurringTransactions}
            accounts={accounts}
            allTransactions={transactions}
            onOpenCreateModal={onOpenCreateRecurringModal || (() => {})}
            onOpenEditModal={onOpenEditRecurringModal || (() => {})}
            onToggleActive={onToggleRecurringActive || (async () => {})}
            onDeleteRule={onDeleteRecurringRule || (async () => {})}
            onPostNow={onPostRecurringNow || (async () => {})}
            onRunAutoPostCheck={onRunRecurringCheck || (async () => {})}
            onSelectTxn={onSelectTxn}
          />
        </div>
      )}

      {/* View 4: Reports & Analytics Tab */}
      {subTab === 'reports' && (
        <div className="pt-2">
          <ReportsTab
            transactions={transactions}
            accounts={accounts}
            vehicles={vehicles}
            onSelectTxn={onSelectTxn}
          />
        </div>
      )}

      {/* View 4: Inbox / Review Tab */}
      {subTab === 'inbox' && (
        <InboxReviewTab
          accounts={accounts}
          isGuestMode={isGuestMode}
          user={user}
          onOpenNewTxnWithDefaults={(defaults, emailId) => {
            if (onOpenNewTxnWithDefaults) {
              onOpenNewTxnWithDefaults(defaults, emailId);
            }
          }}
        />
      )}
    </div>
  );
};
