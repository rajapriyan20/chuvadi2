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
  X
} from 'lucide-react';
import { formatCurrency, formatDate, getAllExpenseCategories } from '../../utils/formatters';
import type { Account, Transaction, Entity, AccountType, Vehicle } from '../../types';
import type { User } from 'firebase/auth';
import { ChartOfAccounts } from '../finance/ChartOfAccounts';
import { InboxReviewTab } from '../finance/InboxReviewTab';
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

interface FinanceTabProps {
  accounts: Account[];
  transactions: Transaction[];
  vehicles?: Vehicle[];
  entities: Entity[];
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
  isGuestMode?: boolean;
  user?: User | null;
  activeSubTab?: 'coa' | 'transactions' | 'reports' | 'inbox';
  onSubTabChange?: (tab: 'coa' | 'transactions' | 'reports' | 'inbox') => void;
}

export const FinanceTab: React.FC<FinanceTabProps> = ({
  accounts,
  transactions,
  vehicles = [],
  entities: _entities,
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
  isGuestMode = false,
  user,
  activeSubTab,
  onSubTabChange
}) => {
  // Chart of Accounts is shown first by default, then Transactions, then Reports, then Inbox / Review
  const [internalSubTab, setInternalSubTab] = useState<'coa' | 'transactions' | 'reports' | 'inbox'>('coa');
  const subTab = activeSubTab || internalSubTab;
  const setSubTab = (t: 'coa' | 'transactions' | 'reports' | 'inbox') => {
    setInternalSubTab(t);
    onSubTabChange?.(t);
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME' | 'TRANSFER'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<TransactionSortOption>('DATE_DESC');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const availableCategories = useMemo(() => {
    return getAllExpenseCategories(transactions.map(t => t.category));
  }, [transactions]);

  // Filter & sort transactions (by default in order of transaction date)
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
        return (b.timestamp || 0) - (a.timestamp || 0);
      }
      if (sortBy === 'DATE_ASC') {
        const cmp = (a.date || '').localeCompare(b.date || '');
        if (cmp !== 0) return cmp;
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

  return (
    <div className="space-y-1.5 sm:space-y-2 pb-20 md:pb-8">
      {/* Sub-tab Switcher: Chart of Accounts FIRST, then Transactions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-0.5">
        <div className="inline-flex p-0.5 sm:p-1 bg-[#121820] rounded-xl sm:rounded-2xl border border-slate-800 self-start sm:self-auto">
          <button
            id="finance-subtab-coa-btn"
            onClick={() => setSubTab('coa')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold transition ${
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
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold transition ${
              subTab === 'transactions'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Receipt size={14} />
            <span>Transactions</span>
          </button>
          <button
            id="finance-subtab-reports-btn"
            onClick={() => setSubTab('reports')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold transition ${
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
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold transition ${
              subTab === 'inbox'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Inbox size={14} />
            <span>Inbox / Review</span>
          </button>
        </div>

        <div className="text-xs text-slate-400">
          {subTab === 'coa' && (
            <span>Categorised, Table & PowerBI Decomposition Views</span>
          )}
          {subTab === 'reports' && (
            <span>Visual Charts, Category Cash Flow & Analytics</span>
          )}
          {subTab === 'inbox' && (
            <span>Gmail Expense Extraction & Rule Filters</span>
          )}
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

      {/* View 2: Transactions Tab - Directly Starts from Transactions History */}
      {subTab === 'transactions' && (
        <div className="space-y-3 pt-1">
          {/* Header Summary & Active Filter Tags */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Transactions History</h2>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400 mt-0.5">
                <span className="font-medium text-slate-300">
                  {filteredTransactions.length} of {transactions.length} records
                </span>
                <span>•</span>
                <span className="text-amber-400 font-medium">
                  Sorted by {SORT_OPTIONS.find(o => o.id === sortBy)?.label}
                </span>

                {(searchTerm.trim() !== '' || typeFilter !== 'ALL' || categoryFilter !== 'ALL' || selectedAccountId !== 'ALL') && (
                  <>
                    <span>•</span>
                    <span className="text-slate-400 font-medium">Filtered:</span>
                    {typeFilter !== 'ALL' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-medium">
                        Type: {typeFilter === 'EXPENSE' ? 'Expense' : typeFilter === 'INCOME' ? 'Income' : 'Transfer'}
                        <button 
                          type="button" 
                          onClick={() => setTypeFilter('ALL')} 
                          className="hover:text-white cursor-pointer ml-0.5"
                          title="Remove type filter"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {categoryFilter !== 'ALL' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-medium">
                        Category: {categoryFilter}
                        <button 
                          type="button" 
                          onClick={() => setCategoryFilter('ALL')} 
                          className="hover:text-white cursor-pointer ml-0.5"
                          title="Remove category filter"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {selectedAccountId !== 'ALL' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-medium">
                        Account: {accounts.find(a => a.id === selectedAccountId)?.name || 'Account'}
                        <button 
                          type="button" 
                          onClick={() => setSelectedAccountId('ALL')} 
                          className="hover:text-white cursor-pointer ml-0.5"
                          title="Remove account filter"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {searchTerm.trim() !== '' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-medium">
                        "{searchTerm}"
                        <button 
                          type="button" 
                          onClick={() => setSearchTerm('')} 
                          className="hover:text-white cursor-pointer ml-0.5"
                          title="Clear search"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    <button 
                      type="button" 
                      onClick={() => {
                        setSearchTerm('');
                        setTypeFilter('ALL');
                        setCategoryFilter('ALL');
                        setSelectedAccountId('ALL');
                      }}
                      className="text-[10px] text-amber-400 hover:text-amber-300 underline font-semibold ml-1 cursor-pointer"
                    >
                      Clear all
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Record Transaction Button */}
            <button
              id="transactions-record-txn-btn"
              onClick={onOpenNewTxn}
              className="self-start sm:self-center px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md shrink-0 cursor-pointer"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Record Transaction</span>
            </button>
          </div>

          {/* Horizontally Stacked Filter & Sort Bar (Icon-first to maximize screen usage) */}
          <div className="flex items-center gap-2">
            {/* Scrollable Filter Inputs Container */}
            <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0">
              {/* Search Input with Icon */}
              <div className="relative flex-1 min-w-[130px] sm:min-w-[180px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search..."
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

              {/* Type Filter Select (Icon + compact options) */}
              <div className="relative shrink-0">
                <Filter size={13} className={`absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 ${typeFilter !== 'ALL' ? 'text-amber-400' : 'text-slate-400'}`} />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className={`bg-[#121820] border rounded-xl pl-7 pr-3 py-2 text-xs focus:outline-none cursor-pointer transition ${
                    typeFilter !== 'ALL'
                      ? 'border-amber-500/50 text-amber-300 font-semibold bg-amber-500/10'
                      : 'border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                  title="Filter by transaction type"
                >
                  <option value="ALL">All Types</option>
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                  <option value="TRANSFER">Transfer</option>
                </select>
              </div>

              {/* Category Filter Select (Icon + compact width) */}
              <div className="relative shrink-0">
                <Tag size={13} className={`absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 ${categoryFilter !== 'ALL' ? 'text-amber-400' : 'text-slate-400'}`} />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={`bg-[#121820] border rounded-xl pl-7 pr-3 py-2 text-xs focus:outline-none cursor-pointer transition max-w-[130px] sm:max-w-[160px] truncate ${
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

              {/* Account Filter Select (Icon + compact width) */}
              <div className="relative shrink-0">
                <Landmark size={13} className={`absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 ${selectedAccountId !== 'ALL' ? 'text-amber-400' : 'text-slate-400'}`} />
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className={`bg-[#121820] border rounded-xl pl-7 pr-3 py-2 text-xs focus:outline-none cursor-pointer transition max-w-[120px] sm:max-w-[150px] truncate ${
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
            </div>

            {/* Sort Button with Safe Popover Anchor (Outside overflow container so popover is never clipped) */}
            <div className="relative shrink-0">
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
                <span className="hidden sm:inline">Sort</span>
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

        {/* Transactions Table / List */}
        <div className="bg-[#131922] rounded-3xl border border-slate-800 divide-y divide-slate-800/60 overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-xs">
              No transactions match your current filters.
            </div>
          ) : (
            filteredTransactions.map((t) => {
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
                        <ArrowRightLeft size={16} />
                      ) : isExpense ? (
                        <ArrowUpRight size={16} />
                      ) : (
                        <ArrowDownLeft size={16} />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{t.description}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{formatDate(t.date)}</span>
                        <span>•</span>
                        <span className="text-amber-300/80">{t.category}</span>
                        {t.fuelLiters && <span>({t.fuelLiters}L)</span>}
                        {t.odometer && <span>• {t.odometer} km</span>}
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
    )}

  {/* View 3: Reports & Analytics Tab */}
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
