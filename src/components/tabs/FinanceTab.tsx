import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft, 
  Layers,
  Receipt,
  Inbox
} from 'lucide-react';
import { formatCurrency, formatDate, DEFAULT_CATEGORIES } from '../../utils/formatters';
import type { Account, Transaction, Entity, AccountType } from '../../types';
import { ChartOfAccounts } from '../finance/ChartOfAccounts';
import { InboxReviewTab } from '../finance/InboxReviewTab';

interface FinanceTabProps {
  accounts: Account[];
  transactions: Transaction[];
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
}

export const FinanceTab: React.FC<FinanceTabProps> = ({
  accounts,
  transactions,
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
  isGuestMode = false
}) => {
  // Chart of Accounts is shown first by default, then Transactions, then Inbox / Review
  const [subTab, setSubTab] = useState<'coa' | 'transactions' | 'inbox'>('coa');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME' | 'TRANSFER'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
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
  }, [transactions, typeFilter, categoryFilter, selectedAccountId, searchTerm]);

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
          {subTab === 'transactions' && (
            <span>Ledger History & Search</span>
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
        <div className="space-y-4 pt-2">
          {/* Transactions Search & Filter Bar */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-base font-bold text-white tracking-tight">Transactions History</h2>
              
              <div className="flex items-center gap-2">
                <button
                  id="transactions-record-txn-btn"
                  onClick={onOpenNewTxn}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md"
                >
                  <Plus size={15} strokeWidth={2.5} />
                  <span>Record Transaction</span>
                </button>
              </div>
            </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search description, category, amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#121820] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full bg-[#121820] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Types</option>
              <option value="EXPENSE">Expenses Only</option>
              <option value="INCOME">Income Only</option>
              <option value="TRANSFER">Transfers Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-[#121820] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Categories</option>
              {DEFAULT_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
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
    </div>
  )}

  {/* View 3: Inbox / Review Tab */}
  {subTab === 'inbox' && (
    <InboxReviewTab
      accounts={accounts}
      isGuestMode={isGuestMode}
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
