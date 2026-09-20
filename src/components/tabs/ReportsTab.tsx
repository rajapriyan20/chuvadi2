import React, { useMemo } from 'react';
import { PieChart, TrendingDown, TrendingUp, Fuel, ArrowUpRight } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Transaction, Vehicle, Account } from '../../types';

interface ReportsTabProps {
  transactions: Transaction[];
  accounts: Account[];
  vehicles: Vehicle[];
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  transactions,
  accounts,
  vehicles
}) => {
  // Compute category distribution for expenses
  const { categoryData, totalExpense, totalIncome } = useMemo(() => {
    const catMap = new Map<string, number>();
    let exp = 0;
    let inc = 0;

    for (const t of transactions) {
      if (t.type === 'EXPENSE') {
        exp += t.amount;
        catMap.set(t.category, (catMap.get(t.category) || 0) + t.amount);
      } else if (t.type === 'INCOME') {
        inc += t.amount;
      }
    }

    const sortedCats = Array.from(catMap.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: exp > 0 ? (amount / exp) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    return { categoryData: sortedCats, totalExpense: exp, totalIncome: inc };
  }, [transactions]);

  // Top 5 largest expenses
  const topExpenses = useMemo(() => {
    return transactions
      .filter(t => t.type === 'EXPENSE')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions]);

  const categoryColors = [
    '#f59e0b', '#10b981', '#0ea5e9', '#ec4899', '#8b5cf6', 
    '#f97316', '#6366f1', '#14b8a6', '#64748b'
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <div>
        <h2 className="text-base font-bold text-white tracking-tight">Financial Reports & Insights</h2>
        <div className="text-xs text-slate-400">Cash flow distribution, category breakdown, and top spendings</div>
      </div>

      {/* Cashflow Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-[#141b24] rounded-3xl border border-emerald-900/30">
          <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center justify-between">
            <span>Total Income</span>
            <TrendingUp size={15} />
          </div>
          <div className="text-xl font-extrabold text-emerald-300 font-mono mt-1">
            +{formatCurrency(totalIncome)}
          </div>
        </div>

        <div className="p-4 bg-[#141b24] rounded-3xl border border-rose-900/30">
          <div className="text-[10px] uppercase font-bold text-rose-400 flex items-center justify-between">
            <span>Total Expenses</span>
            <TrendingDown size={15} />
          </div>
          <div className="text-xl font-extrabold text-rose-300 font-mono mt-1">
            -{formatCurrency(totalExpense)}
          </div>
        </div>

        <div className="p-4 bg-[#141b24] rounded-3xl border border-amber-500/20">
          <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center justify-between">
            <span>Net Savings</span>
            <PieChart size={15} />
          </div>
          <div className={`text-xl font-extrabold font-mono mt-1 ${totalIncome >= totalExpense ? 'text-amber-200' : 'text-rose-400'}`}>
            {formatCurrency(totalIncome - totalExpense)}
          </div>
        </div>
      </div>

      {/* Category Breakdown Progress List */}
      <div className="p-5 bg-[#131922] rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Expenses by Category
        </h3>

        {categoryData.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            No expense records found to generate category analytics.
          </div>
        ) : (
          <div className="space-y-3">
            {categoryData.map((cat, idx) => {
              const color = categoryColors[idx % categoryColors.length];
              return (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="font-semibold text-white">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400">{cat.percentage.toFixed(1)}%</span>
                      <span className="font-mono font-bold text-white">{formatCurrency(cat.amount)}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(2, cat.percentage))}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top 5 Major Expenses */}
      <div className="p-5 bg-[#131922] rounded-3xl border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Largest Expenses
        </h3>

        <div className="divide-y divide-slate-800/60">
          {topExpenses.length === 0 ? (
            <div className="text-center py-4 text-slate-500 text-xs">No records available</div>
          ) : (
            topExpenses.map((t) => (
              <div key={t.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
                    <ArrowUpRight size={14} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{t.description}</div>
                    <div className="text-[10px] text-slate-400">
                      {formatDate(t.date)} • {t.category}
                    </div>
                  </div>
                </div>
                <div className="text-xs font-mono font-bold text-rose-400">
                  -{formatCurrency(t.amount)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
