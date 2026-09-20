import React, { useState, useMemo } from 'react';
import { X, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Download, Search } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Account, Transaction } from '../../types';

interface PassbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
  transactions: Transaction[];
  onSelectTxn: (txn: Transaction) => void;
}

export const PassbookModal: React.FC<PassbookModalProps> = ({
  isOpen,
  onClose,
  account,
  transactions,
  onSelectTxn
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter transactions involving this account
  const accountTxns = useMemo(() => {
    if (!account) return [];
    return transactions
      .filter((t) => t.fromAccountId === account.id || t.toAccountId === account.id)
      .filter((t) => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return (
          t.description.toLowerCase().includes(s) ||
          t.category.toLowerCase().includes(s) ||
          String(t.amount).includes(s)
        );
      });
  }, [account, transactions, searchTerm]);

  // Compute stats
  const { totalCredits, totalDebits } = useMemo(() => {
    if (!account) return { totalCredits: 0, totalDebits: 0 };
    let credits = 0;
    let debits = 0;
    for (const t of accountTxns) {
      if (t.type === 'INCOME' && t.toAccountId === account.id) {
        credits += t.amount;
      } else if (t.type === 'EXPENSE' && t.fromAccountId === account.id) {
        debits += t.amount;
      } else if (t.type === 'TRANSFER') {
        if (t.toAccountId === account.id) credits += t.amount;
        if (t.fromAccountId === account.id) debits += t.amount;
      }
    }
    return { totalCredits: credits, totalDebits: debits };
  }, [account, accountTxns]);

  if (!isOpen || !account) return null;

  const exportCSV = () => {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Debit (₹)', 'Credit (₹)'];
    const rows = accountTxns.map((t) => {
      const isDebit = t.fromAccountId === account.id;
      return [
        t.date,
        `"${t.description.replace(/"/g, '""')}"`,
        t.category,
        t.type,
        isDebit ? t.amount : '',
        !isDebit ? t.amount : ''
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${account.name.replace(/\s+/g, '_')}_passbook.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121820] w-full max-w-2xl rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#161e28]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: account.color || '#0284c7' }} />
              <h2 className="text-base font-bold text-white tracking-tight">{account.name} Passbook</h2>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {account.institution || account.type} {account.accountNumber ? `•••• ${account.accountNumber}` : ''}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1 border border-slate-700"
              title="Export Passbook CSV"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-[#0d1217] border-b border-slate-800/80">
          <div className="p-3 bg-[#161c24] rounded-2xl border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400">Current Balance</div>
            <div className="text-base font-bold text-amber-200 font-mono mt-0.5">
              {formatCurrency(account.balance)}
            </div>
          </div>
          <div className="p-3 bg-[#161c24] rounded-2xl border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-emerald-400">Total Inflow</div>
            <div className="text-base font-bold text-emerald-300 font-mono mt-0.5">
              +{formatCurrency(totalCredits)}
            </div>
          </div>
          <div className="p-3 bg-[#161c24] rounded-2xl border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-rose-400">Total Outflow</div>
            <div className="text-base font-bold text-rose-300 font-mono mt-0.5">
              -{formatCurrency(totalDebits)}
            </div>
          </div>
        </div>

        {/* Search filter */}
        <div className="px-4 py-2 border-b border-slate-800/80 bg-[#121820]">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by description, category, or amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0a0e14] border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Transaction Ledger Table */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-800/60">
          {accountTxns.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No transactions recorded for this account.
            </div>
          ) : (
            accountTxns.map((txn) => {
              const isDebit = txn.fromAccountId === account.id;
              const isCredit = txn.toAccountId === account.id;

              return (
                <div
                  key={txn.id}
                  onClick={() => onSelectTxn(txn)}
                  className="py-3 px-2 flex items-center justify-between hover:bg-slate-800/40 rounded-xl cursor-pointer transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        txn.type === 'TRANSFER'
                          ? 'bg-blue-500/15 text-blue-400'
                          : isDebit
                          ? 'bg-rose-500/15 text-rose-400'
                          : 'bg-emerald-500/15 text-emerald-400'
                      }`}
                    >
                      {txn.type === 'TRANSFER' ? (
                        <ArrowRightLeft size={16} />
                      ) : isDebit ? (
                        <ArrowUpRight size={16} />
                      ) : (
                        <ArrowDownLeft size={16} />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white tracking-tight">
                        {txn.description}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{formatDate(txn.date)}</span>
                        <span>•</span>
                        <span className="text-amber-300/80">{txn.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-xs font-bold font-mono ${
                        isDebit ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {isDebit ? '-' : '+'}{formatCurrency(txn.amount)}
                    </div>
                    <div className="text-[10px] text-slate-500 capitalize">
                      {txn.type.toLowerCase()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
