import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft, 
  BookOpen, 
  Edit3, 
  UserCheck, 
  UserMinus,
  CheckCircle2,
  Layers,
  Receipt
} from 'lucide-react';
import { formatCurrency, formatDate, DEFAULT_CATEGORIES } from '../../utils/formatters';
import type { Account, Transaction, Entity, AccountType } from '../../types';
import { ChartOfAccounts } from '../finance/ChartOfAccounts';

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
}

export const FinanceTab: React.FC<FinanceTabProps> = ({
  accounts,
  transactions,
  entities,
  onOpenNewAccount,
  onEditAccount,
  onSaveAccount,
  onDeleteAccount,
  onOpenPassbook,
  onSelectTxn,
  onOpenNewTxn,
  onOpenNewEntity,
  onDeleteEntity
}) => {
  const [subTab, setSubTab] = useState<'transactions' | 'coa'>('transactions');
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

  // Receivables & Payables stats
  const totalReceivables = entities.filter(e => e.type === 'RECEIVABLE').reduce((sum, e) => sum + e.amount, 0);
  const totalPayables = entities.filter(e => e.type === 'PAYABLE').reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-1.5 sm:space-y-2 pb-20 md:pb-8">
      {/* Sub-tab Switcher: Transactions vs Chart of Accounts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-0.5">
        <div className="inline-flex p-0.5 sm:p-1 bg-[#121820] rounded-xl sm:rounded-2xl border border-slate-800 self-start sm:self-auto">
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
        </div>

        <div className="text-xs text-slate-400">
          {subTab === 'transactions' && (
            <span>Ledger History & Account Balances</span>
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

      {/* View 2: Current Transactions Page */}
      {subTab === 'transactions' && (
        <div className="space-y-6 pt-2">
        <>
          {/* Header & Accounts Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Your Accounts</h2>
                <div className="text-xs text-slate-400">Click any account to open its detailed Passbook ledger</div>
              </div>
              <button
                onClick={() => onOpenNewAccount()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161c24] hover:bg-slate-800 text-amber-300 border border-slate-700 text-xs font-semibold transition"
              >
                <Plus size={15} />
                <span>Add Account</span>
              </button>
            </div>

        {/* Accounts Grid - Compact 2 columns on mobile, 3 columns on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              onClick={() => onOpenPassbook(acc)}
              className="p-3 sm:p-4 bg-[#141b24] hover:bg-[#18212c] rounded-2xl sm:rounded-3xl border border-slate-800 transition relative group shadow-sm flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full shrink-0" style={{ backgroundColor: acc.color || '#0284c7' }} />
                    <span className="text-[9px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                      {acc.type}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditAccount(acc);
                    }}
                    className="p-1 -mr-1 -mt-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition"
                    title="Edit account"
                  >
                    <Edit3 size={12} className="sm:w-[13px] sm:h-[13px]" />
                  </button>
                </div>

                <div className="text-xs sm:text-sm font-bold text-white mt-1.5 sm:mt-2 group-hover:text-amber-300 truncate">
                  {acc.name}
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                  {acc.institution || 'Account'} {acc.accountNumber ? `•••• ${acc.accountNumber}` : ''}
                </div>
              </div>

              <div className="mt-2.5 pt-2 sm:mt-3.5 sm:pt-2.5 border-t border-slate-800/80 flex items-end sm:items-center justify-between gap-1">
                <div className="min-w-0">
                  <div className="text-[8px] sm:text-[10px] text-slate-500 uppercase font-medium">Balance</div>
                  <div className="text-xs sm:text-base font-extrabold text-amber-200 font-mono truncate">
                    {formatCurrency(acc.balance)}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenPassbook(acc);
                  }}
                  className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-[10px] sm:text-xs font-semibold transition shrink-0"
                >
                  <BookOpen size={11} className="sm:w-[13px] sm:h-[13px]" />
                  <span className="hidden xs:inline">Passbook</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Receivables & Payables Ledger Tracker */}
      <div className="p-4 bg-[#131922] rounded-3xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Receivables & Payables (Credits / Debts)
            </h3>
          </div>
          <button
            onClick={onOpenNewEntity}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <Plus size={13} />
            <span>Track Person / Loan</span>
          </button>
        </div>

        {/* Summary badges */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-[#161c24] rounded-2xl border border-emerald-900/30">
            <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
              <UserCheck size={13} />
              <span>To Collect (Receivables)</span>
            </div>
            <div className="text-base font-bold text-emerald-300 font-mono mt-0.5">
              {formatCurrency(totalReceivables)}
            </div>
          </div>
          <div className="p-3 bg-[#161c24] rounded-2xl border border-rose-900/30">
            <div className="text-[10px] uppercase font-bold text-rose-400 flex items-center gap-1">
              <UserMinus size={13} />
              <span>To Pay (Payables)</span>
            </div>
            <div className="text-base font-bold text-rose-300 font-mono mt-0.5">
              {formatCurrency(totalPayables)}
            </div>
          </div>
        </div>

        {/* Entity chips / list */}
        {entities.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {entities.map((e) => (
              <div
                key={e.id}
                className="p-2.5 bg-[#161d27] rounded-xl border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">{e.name}</div>
                  <div className="text-[10px] text-slate-400">
                    {e.type === 'RECEIVABLE' ? 'Owes you' : 'You owe'} {e.dueDate ? `• Due ${formatDate(e.dueDate)}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold font-mono ${e.type === 'RECEIVABLE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(e.amount)}
                  </span>
                  <button
                    onClick={() => onDeleteEntity(e.id)}
                    className="p-1 text-slate-500 hover:text-emerald-400 transition"
                    title="Mark as Settled"
                  >
                    <CheckCircle2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transactions Search & Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-white tracking-tight">Transactions History</h2>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewTxn}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
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
    </>
    </div>
  )}
</div>
);
};
