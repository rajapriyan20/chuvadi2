import React, { useMemo, useState, useRef, useEffect } from 'react';
import { 
  TrendingDown, 
  TrendingUp, 
  PieChart, 
  ArrowUpRight, 
  Wallet, 
  Fuel, 
  Layers, 
  Calculator, 
  ChevronLeft, 
  ChevronRight, 
  GalleryHorizontal, 
  LayoutGrid,
  Landmark
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Transaction, Vehicle, Account } from '../../types';

interface ReportsTabProps {
  transactions: Transaction[];
  accounts: Account[];
  vehicles: Vehicle[];
  onSelectTxn?: (txn: Transaction) => void;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  transactions,
  accounts,
  vehicles,
  onSelectTxn
}) => {
  // Overview Layout Mode: 'carousel' (horizontal scrollable track) | 'grid' (compact horizontal grid)
  const [overviewLayout, setOverviewLayout] = useState<'carousel' | 'grid'>(() => {
    try {
      return (localStorage.getItem('chuvadi_reports_overview_layout') as 'carousel' | 'grid') || 'carousel';
    } catch {
      return 'carousel';
    }
  });

  const handleToggleLayout = (mode: 'carousel' | 'grid') => {
    setOverviewLayout(mode);
    try {
      localStorage.setItem('chuvadi_reports_overview_layout', mode);
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

  // Compute category distribution & primary totals
  const { categoryData, totalExpense, totalIncome, incomeCount, expenseCount, fuelExpenses, totalFuelLiters, avgDailySpend } = useMemo(() => {
    const catMap = new Map<string, number>();
    let exp = 0;
    let inc = 0;
    let incCount = 0;
    let expCount = 0;
    let fuelCost = 0;
    let fuelLit = 0;
    const expenseDates = new Set<string>();

    for (const t of transactions) {
      if (t.type === 'EXPENSE') {
        exp += t.amount;
        expCount++;
        catMap.set(t.category, (catMap.get(t.category) || 0) + t.amount);
        if (t.date) expenseDates.add(t.date);

        if (t.fuelLiters || t.category === 'Fuel' || t.category === 'Transport') {
          fuelCost += t.amount;
        }
      } else if (t.type === 'INCOME') {
        inc += t.amount;
        incCount++;
      }

      if (t.fuelLiters) {
        fuelLit += Number(t.fuelLiters) || 0;
      }
    }

    const sortedCats = Array.from(catMap.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: exp > 0 ? (amount / exp) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    const avgSpend = expenseDates.size > 0 ? Math.round(exp / expenseDates.size) : 0;

    return { 
      categoryData: sortedCats, 
      totalExpense: exp, 
      totalIncome: inc,
      incomeCount: incCount,
      expenseCount: expCount,
      fuelExpenses: fuelCost,
      totalFuelLiters: fuelLit,
      avgDailySpend: avgSpend
    };
  }, [transactions]);

  // Net Savings & Rate
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Liquid Balance & Total Net Worth from accounts
  const { totalNetWorth, liquidBalance } = useMemo(() => {
    let nw = 0;
    let liquid = 0;
    for (const a of accounts) {
      const bal = Number(a.balance) || 0;
      nw += bal;
      if (a.type === 'CASH' || a.type === 'BANK') {
        liquid += bal;
      }
    }
    return { totalNetWorth: nw, liquidBalance: liquid };
  }, [accounts]);

  // Top 5 largest expenses
  const topExpenses = useMemo(() => {
    return transactions
      .filter(t => t.type === 'EXPENSE')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions]);

  const topCategory = categoryData[0];

  // Overview Cards List
  const overviewCards = useMemo(() => [
    {
      id: 'total-income',
      label: 'Total Inflow',
      value: `+${formatCurrency(totalIncome)}`,
      subtext: `${incomeCount} credits recorded`,
      icon: TrendingUp,
      accent: 'emerald' as const,
      badge: null
    },
    {
      id: 'total-expense',
      label: 'Total Outflow',
      value: `-${formatCurrency(totalExpense)}`,
      subtext: `${expenseCount} expenses logged`,
      icon: TrendingDown,
      accent: 'rose' as const,
      badge: null
    },
    {
      id: 'net-savings',
      label: 'Net Savings',
      value: `${netSavings >= 0 ? '+' : ''}${formatCurrency(netSavings)}`,
      subtext: totalIncome > 0 ? `${savingsRate}% savings rate` : 'Cashflow balance',
      icon: PieChart,
      accent: 'amber' as const,
      badge: totalIncome > 0 ? {
        text: `${savingsRate}%`,
        variant: savingsRate >= 20 ? 'success' as const : 'warning' as const
      } : null
    },
    {
      id: 'net-worth',
      label: 'Net Worth',
      value: formatCurrency(totalNetWorth),
      subtext: `Liquid: ${formatCurrency(liquidBalance)}`,
      icon: Landmark,
      accent: 'sky' as const,
      badge: {
        text: `${accounts.length} accts`,
        variant: 'info' as const
      }
    },
    {
      id: 'fleet-fuel',
      label: 'Fleet & Fuel',
      value: formatCurrency(fuelExpenses),
      subtext: totalFuelLiters > 0 ? `${totalFuelLiters.toFixed(1)}L pumped • ${vehicles.length} fleet` : `${vehicles.length} vehicles registered`,
      icon: Fuel,
      accent: 'amber' as const,
      badge: null
    },
    {
      id: 'avg-daily',
      label: 'Avg Daily Outflow',
      value: formatCurrency(avgDailySpend),
      subtext: 'Across active spending days',
      icon: Calculator,
      accent: 'indigo' as const,
      badge: null
    },
    {
      id: 'top-cat',
      label: 'Top Category',
      value: topCategory ? topCategory.name : 'None',
      subtext: topCategory ? `${formatCurrency(topCategory.amount)} (${topCategory.percentage.toFixed(0)}%)` : 'No expenses',
      icon: Layers,
      accent: 'teal' as const,
      badge: topCategory ? {
        text: `${topCategory.percentage.toFixed(0)}%`,
        variant: 'info' as const
      } : null
    }
  ], [
    totalIncome,
    incomeCount,
    totalExpense,
    expenseCount,
    netSavings,
    savingsRate,
    totalNetWorth,
    liquidBalance,
    accounts.length,
    fuelExpenses,
    totalFuelLiters,
    vehicles.length,
    avgDailySpend,
    topCategory
  ]);

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

  const categoryColors = [
    '#f59e0b', '#10b981', '#0ea5e9', '#ec4899', '#8b5cf6', 
    '#f97316', '#6366f1', '#14b8a6', '#64748b'
  ];

  return (
    <div className="space-y-4 pb-20 md:pb-8 animate-fadeIn">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-0.5">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <PieChart size={18} className="text-amber-400" />
            <span>Financial Reports & Analytics</span>
          </h2>
          <div className="text-xs text-slate-400 mt-0.5">
            Cashflow distribution, category breakdowns, and high-impact spendings
          </div>
        </div>

        {/* View Mode Toggle & Carousel Chevrons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* View Mode Toggle: Carousel vs Grid */}
          <div className="flex items-center bg-[#131922] p-0.5 rounded-xl border border-slate-800 text-slate-400">
            <button
              type="button"
              onClick={() => handleToggleLayout('carousel')}
              className={`p-1 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
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
              className={`p-1 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
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

          {/* Carousel Scroll Chevrons */}
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

      {/* Sleek Horizontal Overview Carousel / Grid Section */}
      {overviewLayout === 'carousel' ? (
        <div className="relative group/carousel">
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
                  className={`min-w-[200px] sm:min-w-[220px] max-w-[260px] flex-1 shrink-0 snap-start p-3 bg-[#131922] hover:bg-[#18212c] rounded-2xl border ${styles.border} transition group shadow-sm relative overflow-hidden flex flex-col justify-between h-[92px]`}
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
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
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
                  <div className="text-[10px] text-slate-400 truncate">
                    {card.subtext}
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
                className={`p-3 bg-[#131922] hover:bg-[#18212c] rounded-2xl border ${styles.border} transition group shadow-sm relative overflow-hidden flex flex-col justify-between h-[92px]`}
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
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
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
                <div className="text-[10px] text-slate-400 truncate">
                  {card.subtext}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Two Column Grid: Expenses by Category + Top Largest Expenses (Fits cleanly above/near fold) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-1">
        {/* Category Breakdown Progress List */}
        <div className="p-4 sm:p-5 bg-[#131922] rounded-2xl border border-slate-800 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Layers size={14} className="text-amber-400" />
              <span>Expenses by Category</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400 font-medium">
              {categoryData.length} {categoryData.length === 1 ? 'category' : 'categories'}
            </span>
          </div>

          {categoryData.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No expense records found to generate category analytics.
            </div>
          ) : (
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 no-scrollbar">
              {categoryData.map((cat, idx) => {
                const color = categoryColors[idx % categoryColors.length];
                return (
                  <div key={cat.name} className="space-y-1.5 group">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="font-semibold text-white group-hover:text-amber-300 transition truncate">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="font-mono text-slate-400 text-[11px]">{cat.percentage.toFixed(1)}%</span>
                        <span className="font-mono font-bold text-white text-xs">{formatCurrency(cat.amount)}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden">
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
        <div className="p-4 sm:p-5 bg-[#131922] rounded-2xl border border-slate-800 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ArrowUpRight size={14} className="text-rose-400" />
              <span>Largest Expenses</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400 font-medium">
              Top 5 Impact Items
            </span>
          </div>

          <div className="divide-y divide-slate-800/70">
            {topExpenses.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">No records available</div>
            ) : (
              topExpenses.map((t) => (
                <div 
                  key={t.id} 
                  onClick={() => onSelectTxn && onSelectTxn(t)}
                  className={`py-2.5 flex items-center justify-between transition ${
                    onSelectTxn ? 'hover:bg-slate-800/40 cursor-pointer -mx-2 px-2 rounded-xl' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
                      <ArrowUpRight size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{t.description}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                        <span>{formatDate(t.date)}</span>
                        <span>•</span>
                        <span className="text-amber-300/80">{t.category}</span>
                        {t.fuelLiters && <span>• {t.fuelLiters}L</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-mono font-bold text-rose-400 shrink-0 ml-2">
                    -{formatCurrency(t.amount)}
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
