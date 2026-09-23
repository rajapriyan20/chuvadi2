import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  RotateCcw, 
  Layers, 
  Wallet, 
  FolderTree, 
  Lock, 
  Sun, 
  Moon, 
  Calendar,
  CreditCard,
  Building2,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Account, Transaction } from '../../types';
import { BankLogo } from '../common/BankLogo';
import { CategoryDefinition, resolveCategoryIcon } from './ChartOfAccounts';

interface CoaDiagramViewProps {
  accounts: Account[];
  transactions?: Transaction[];
  categoriesList: CategoryDefinition[];
  mainCategories: CategoryDefinition[];
  subCategoriesByParent: Map<string, CategoryDefinition[]>;
  groupedAccounts: Map<string, Account[]>;
  totalBalance: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  getCategoryTitle: (cat: CategoryDefinition) => string;
  onOpenAccount?: (account: Account) => void;
  onOpenCategory?: (category: CategoryDefinition) => void;
}

export const CoaDiagramView: React.FC<CoaDiagramViewProps> = ({
  accounts,
  transactions = [],
  categoriesList,
  mainCategories,
  subCategoriesByParent,
  groupedAccounts,
  totalBalance,
  searchTerm,
  setSearchTerm,
  getCategoryTitle
}) => {
  // Canvas Theme: 'dark' (app theme) or 'light' (PowerBI visual theme)
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');

  // Expansion state
  const [isRootExpanded, setIsRootExpanded] = useState<boolean>(true);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [selectedSubCatId, setSelectedSubCatId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Sort by 'balance' or 'name'
  const [sortBy, setSortBy] = useState<'balance' | 'name'>('balance');

  // SVG connector lines path coordinates
  const containerRef = useRef<HTMLDivElement>(null);
  const [connectorPaths, setConnectorPaths] = useState<{
    id: string;
    d: string;
    isActive: boolean;
  }[]>([]);

  // Compute total balance for any category (including subcategories)
  const getCategoryTotal = (cat: CategoryDefinition): number => {
    const catKey = cat.id || cat.type;
    const directAccs = groupedAccounts.get(catKey) || [];
    let sum = directAccs.reduce((acc, a) => acc + (a.balance || 0), 0);

    const subs = subCategoriesByParent.get(catKey) || [];
    for (const sub of subs) {
      const subKey = sub.id || sub.type;
      const subAccs = groupedAccounts.get(subKey) || [];
      sum += subAccs.reduce((acc, a) => acc + (a.balance || 0), 0);
    }
    return sum;
  };

  // Sorted and filtered main categories
  const displayedCategories = useMemo(() => {
    let list = [...mainCategories];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(cat => {
        const title = getCategoryTitle(cat).toLowerCase();
        const catKey = cat.id || cat.type;
        const accs = groupedAccounts.get(catKey) || [];
        const hasMatchingAcc = accs.some(a => 
          a.name.toLowerCase().includes(term) ||
          (a.institution && a.institution.toLowerCase().includes(term))
        );
        return title.includes(term) || hasMatchingAcc;
      });
    }

    list.sort((a, b) => {
      if (sortBy === 'balance') {
        return getCategoryTotal(b) - getCategoryTotal(a);
      }
      return getCategoryTitle(a).localeCompare(getCategoryTitle(b));
    });

    return list;
  }, [mainCategories, searchTerm, sortBy, groupedAccounts, subCategoriesByParent, getCategoryTitle]);

  // Default select first/highest category on mount or when categories change
  useEffect(() => {
    if (displayedCategories.length > 0) {
      const exists = displayedCategories.some(c => (c.id || c.type) === selectedCatId);
      if (!exists) {
        const highest = [...displayedCategories].sort((a, b) => getCategoryTotal(b) - getCategoryTotal(a))[0];
        setSelectedCatId(highest ? (highest.id || highest.type) : (displayedCategories[0].id || displayedCategories[0].type));
      }
    } else {
      setSelectedCatId(null);
    }
  }, [displayedCategories]);

  // Active Main Category definition
  const activeCategory = useMemo(() => {
    if (!selectedCatId) return null;
    return categoriesList.find(c => (c.id || c.type) === selectedCatId) || null;
  }, [selectedCatId, categoriesList]);

  // Subcategories of selected category (if any)
  const activeSubCategories = useMemo(() => {
    if (!selectedCatId) return [];
    const subs = subCategoriesByParent.get(selectedCatId) || [];
    return [...subs].sort((a, b) => {
      if (sortBy === 'balance') {
        const balA = (groupedAccounts.get(a.id || a.type) || []).reduce((s, acc) => s + (acc.balance || 0), 0);
        const balB = (groupedAccounts.get(b.id || b.type) || []).reduce((s, acc) => s + (acc.balance || 0), 0);
        return balB - balA;
      }
      return getCategoryTitle(a).localeCompare(getCategoryTitle(b));
    });
  }, [selectedCatId, subCategoriesByParent, sortBy, groupedAccounts, getCategoryTitle]);

  // Accounts to display in the accounts column (`Wallet`)
  const displayedAccounts = useMemo(() => {
    if (!activeCategory) return [];

    let accs: Account[] = [];
    if (activeSubCategories.length > 0 && selectedSubCatId) {
      accs = [...(groupedAccounts.get(selectedSubCatId) || [])];
    } else {
      const direct = groupedAccounts.get(selectedCatId!) || [];
      const subs = subCategoriesByParent.get(selectedCatId!) || [];
      const subAccs = subs.flatMap(s => groupedAccounts.get(s.id || s.type) || []);
      accs = direct.length > 0 || subs.length === 0 ? direct : subAccs;
      if (accs.length === 0 && subAccs.length > 0) {
        accs = subAccs;
      }
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      accs = accs.filter(a => 
        a.name.toLowerCase().includes(term) || 
        (a.institution && a.institution.toLowerCase().includes(term)) ||
        (a.accountNumber && a.accountNumber.includes(term))
      );
    }

    accs.sort((a, b) => {
      if (sortBy === 'balance') {
        return (b.balance || 0) - (a.balance || 0);
      }
      return a.name.localeCompare(b.name);
    });

    return accs;
  }, [activeCategory, activeSubCategories, selectedSubCatId, selectedCatId, groupedAccounts, subCategoriesByParent, searchTerm, sortBy]);

  // Selected Account entity for the 4th column expanded details
  const selectedAccount = useMemo(() => {
    if (!selectedAccountId) return null;
    return accounts.find(a => a.id === selectedAccountId) || null;
  }, [selectedAccountId, accounts]);

  // Recent transactions for the selected account
  const selectedAccountTxns = useMemo(() => {
    if (!selectedAccountId || !transactions.length) return [];
    return transactions
      .filter(t => t.fromAccountId === selectedAccountId || t.toAccountId === selectedAccountId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 4);
  }, [selectedAccountId, transactions]);

  // Reset visual
  const handleResetVisual = () => {
    setIsRootExpanded(true);
    if (displayedCategories.length > 0) {
      const highest = [...displayedCategories].sort((a, b) => getCategoryTotal(b) - getCategoryTotal(a))[0];
      setSelectedCatId(highest ? (highest.id || highest.type) : (displayedCategories[0].id || displayedCategories[0].type));
    }
    setSelectedSubCatId(null);
    setSelectedAccountId(null);
    setSearchTerm('');
  };

  // Node Expansion Handlers: Clicking category/subcat/account ONLY expands further!
  const handleCategoryClick = (catKey: string) => {
    setSelectedCatId(catKey);
    setSelectedSubCatId(null);
    setSelectedAccountId(null);
  };

  const handleSubCategoryClick = (scKey: string) => {
    setSelectedSubCatId(scKey);
    setSelectedAccountId(null);
  };

  const handleAccountClick = (accId: string) => {
    setSelectedAccountId(prev => (prev === accId ? null : accId));
  };

  // Dynamic offset to vertically center the "Total Funds" root node with the middle (e.g. 3rd/4th box) of categories
  const rootOffsetTop = useMemo(() => {
    if (!isRootExpanded || displayedCategories.length <= 1) return 0;
    // Align with the middle box (e.g. 3rd box when 5 categories are present)
    const middleIndex = Math.min(3, Math.floor((displayedCategories.length - 1) / 2));
    return middleIndex * 86 + 22;
  }, [isRootExpanded, displayedCategories.length]);

  // Recalculate connectors whenever selection or DOM tree expands/updates
  useEffect(() => {
    const updateConnectors = () => {
      if (!containerRef.current || !isRootExpanded) {
        setConnectorPaths([]);
        return;
      }

      const containerRect = containerRef.current.getBoundingClientRect();
      const paths: { id: string; d: string; isActive: boolean }[] = [];

      // 1. Root -> Categories
      const rootEl = containerRef.current.querySelector('[data-pbi-node="root"]');
      if (rootEl) {
        const rootRect = rootEl.getBoundingClientRect();
        const startX = rootRect.right - containerRect.left + containerRef.current.scrollLeft;
        const startY = rootRect.top + rootRect.height / 2 - containerRect.top + containerRef.current.scrollTop;

        for (const cat of displayedCategories) {
          const catKey = cat.id || cat.type;
          const catEl = containerRef.current.querySelector(`[data-pbi-node="cat-${catKey}"]`);
          if (catEl) {
            const catRect = catEl.getBoundingClientRect();
            const endX = catRect.left - containerRect.left + containerRef.current.scrollLeft;
            const endY = catRect.top + catRect.height / 2 - containerRect.top + containerRef.current.scrollTop;

            const dx = endX - startX;
            const cx1 = startX + dx * 0.45;
            const cy1 = startY;
            const cx2 = endX - dx * 0.45;
            const cy2 = endY;

            const isSelected = catKey === selectedCatId;
            paths.push({
              id: `root-to-${catKey}`,
              d: `M ${startX} ${startY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${endX} ${endY}`,
              isActive: isSelected
            });
          }
        }
      }

      // 2. Selected Category -> Subcategories OR Accounts
      if (selectedCatId) {
        const catEl = containerRef.current.querySelector(`[data-pbi-node="cat-${selectedCatId}"]`);
        if (catEl) {
          const catRect = catEl.getBoundingClientRect();
          const startX = catRect.right - containerRect.left + containerRef.current.scrollLeft;
          const startY = catRect.top + catRect.height / 2 - containerRect.top + containerRef.current.scrollTop;

          if (activeSubCategories.length > 0) {
            // Curves to subcategories
            for (const sc of activeSubCategories) {
              const scKey = sc.id || sc.type;
              const scEl = containerRef.current.querySelector(`[data-pbi-node="subcat-${scKey}"]`);
              if (scEl) {
                const scRect = scEl.getBoundingClientRect();
                const endX = scRect.left - containerRect.left + containerRef.current.scrollLeft;
                const endY = scRect.top + scRect.height / 2 - containerRect.top + containerRef.current.scrollTop;

                const dx = endX - startX;
                const cx1 = startX + dx * 0.45;
                const cy1 = startY;
                const cx2 = endX - dx * 0.45;
                const cy2 = endY;

                const isSelected = scKey === selectedSubCatId;
                paths.push({
                  id: `cat-to-subcat-${scKey}`,
                  d: `M ${startX} ${startY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${endX} ${endY}`,
                  isActive: isSelected
                });
              }
            }

            // Curve from selected subcategory to accounts
            if (selectedSubCatId) {
              const subCatEl = containerRef.current.querySelector(`[data-pbi-node="subcat-${selectedSubCatId}"]`);
              if (subCatEl) {
                const subCatRect = subCatEl.getBoundingClientRect();
                const subStartX = subCatRect.right - containerRect.left + containerRef.current.scrollLeft;
                const subStartY = subCatRect.top + subCatRect.height / 2 - containerRect.top + containerRef.current.scrollTop;

                for (const acc of displayedAccounts) {
                  const accEl = containerRef.current.querySelector(`[data-pbi-node="acc-${acc.id}"]`);
                  if (accEl) {
                    const accRect = accEl.getBoundingClientRect();
                    const endX = accRect.left - containerRect.left + containerRef.current.scrollLeft;
                    const endY = accRect.top + accRect.height / 2 - containerRect.top + containerRef.current.scrollTop;

                    const dx = endX - subStartX;
                    const cx1 = subStartX + dx * 0.45;
                    const cy1 = subStartY;
                    const cx2 = endX - dx * 0.45;
                    const cy2 = endY;

                    const isAccSelected = acc.id === selectedAccountId;
                    paths.push({
                      id: `subcat-to-acc-${acc.id}`,
                      d: `M ${subStartX} ${subStartY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${endX} ${endY}`,
                      isActive: isAccSelected || !selectedAccountId
                    });
                  }
                }
              }
            }
          } else {
            // Direct curves from Selected Category to Accounts
            for (const acc of displayedAccounts) {
              const accEl = containerRef.current.querySelector(`[data-pbi-node="acc-${acc.id}"]`);
              if (accEl) {
                const accRect = accEl.getBoundingClientRect();
                const endX = accRect.left - containerRect.left + containerRef.current.scrollLeft;
                const endY = accRect.top + accRect.height / 2 - containerRect.top + containerRef.current.scrollTop;

                const dx = endX - startX;
                const cx1 = startX + dx * 0.45;
                const cy1 = startY;
                const cx2 = endX - dx * 0.45;
                const cy2 = endY;

                const isAccSelected = acc.id === selectedAccountId;
                paths.push({
                  id: `cat-to-acc-${acc.id}`,
                  d: `M ${startX} ${startY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${endX} ${endY}`,
                  isActive: isAccSelected || !selectedAccountId
                });
              }
            }
          }
        }
      }

      // 3. Selected Account -> Account Breakdown / Details Leaf Node
      if (selectedAccountId) {
        const accEl = containerRef.current.querySelector(`[data-pbi-node="acc-${selectedAccountId}"]`);
        const detailEl = containerRef.current.querySelector(`[data-pbi-node="acc-detail-${selectedAccountId}"]`);
        if (accEl && detailEl) {
          const accRect = accEl.getBoundingClientRect();
          const detailRect = detailEl.getBoundingClientRect();
          const startX = accRect.right - containerRect.left + containerRef.current.scrollLeft;
          const startY = accRect.top + accRect.height / 2 - containerRect.top + containerRef.current.scrollTop;
          const endX = detailRect.left - containerRect.left + containerRef.current.scrollLeft;
          const endY = detailRect.top + 45 - containerRect.top + containerRef.current.scrollTop;

          const dx = endX - startX;
          const cx1 = startX + dx * 0.45;
          const cy1 = startY;
          const cx2 = endX - dx * 0.45;
          const cy2 = endY;

          paths.push({
            id: `acc-to-detail-${selectedAccountId}`,
            d: `M ${startX} ${startY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${endX} ${endY}`,
            isActive: true
          });
        }
      }

      setConnectorPaths(paths);
    };

    const timer = setTimeout(updateConnectors, 40);
    window.addEventListener('resize', updateConnectors);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateConnectors);
    };
  }, [
    isRootExpanded, 
    rootOffsetTop,
    selectedCatId, 
    selectedSubCatId, 
    selectedAccountId,
    displayedCategories, 
    activeSubCategories, 
    displayedAccounts
  ]);

  const isDark = themeMode === 'dark';

  return (
    <div className="space-y-3 animate-fadeIn select-none">
      {/* PowerBI Style Top Action Toolbar */}
      <div className={`flex flex-wrap items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-2xl border transition-colors ${
        isDark ? 'bg-[#131922] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              placeholder="Search tree (categories, accounts)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full border rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none transition ${
                isDark 
                  ? 'bg-[#0a0e14] border-slate-800 text-white placeholder-slate-500 focus:border-sky-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-500'
              }`}
            />
          </div>

          <button
            type="button"
            onClick={handleResetVisual}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition active:scale-95 ${
              isDark
                ? 'bg-[#0a0e14] hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title="Reset visual to root decomposition state"
          >
            <RotateCcw size={12} className="text-sky-500" />
            <span className="hidden sm:inline">Reset visual</span>
          </button>
        </div>

        {/* Sort & Theme Toggles */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setSortBy(prev => (prev === 'balance' ? 'name' : 'balance'))}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium transition ${
              isDark 
                ? 'bg-[#0a0e14] border-slate-800 text-slate-300 hover:text-white' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title={`Sort tree by: ${sortBy === 'balance' ? 'Highest balance' : 'Alphabetical'}`}
          >
            Sort: <span className="font-bold text-sky-500">{sortBy === 'balance' ? 'Value' : 'Name'}</span>
          </button>

          <button
            type="button"
            onClick={() => setThemeMode(prev => (prev === 'dark' ? 'light' : 'dark'))}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition ${
              isDark 
                ? 'bg-[#0a0e14] border-slate-800 text-amber-300 hover:text-amber-200' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
            }`}
            title="Toggle Canvas Theme (Light / Dark)"
          >
            {isDark ? <Sun size={13} className="text-amber-400" /> : <Moon size={13} className="text-slate-600" />}
            <span className="hidden sm:inline">{isDark ? 'Light Canvas' : 'Dark Canvas'}</span>
          </button>
        </div>
      </div>

      {/* Main PowerBI Decomposition Canvas */}
      <div 
        ref={containerRef}
        className={`relative rounded-2xl sm:rounded-3xl border overflow-x-auto p-4 sm:p-6 transition-colors shadow-inner min-h-[480px] scrollbar-thin ${
          isDark 
            ? 'bg-[#0a0e15] border-slate-800 scrollbar-thumb-slate-800' 
            : 'bg-[#ffffff] border-slate-200 scrollbar-thumb-slate-300'
        }`}
      >
        {/* SVG Connector Layer */}
        <svg 
          className="absolute inset-0 pointer-events-none z-0 w-full h-full min-w-[850px]"
          style={{ overflow: 'visible' }}
        >
          {connectorPaths.map((path) => (
            <path
              key={path.id}
              d={path.d}
              fill="none"
              stroke={path.isActive ? '#0284c7' : (isDark ? '#263445' : '#cbd5e1')}
              strokeWidth={path.isActive ? 2.5 : 1.5}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          ))}
        </svg>

        <div className="relative z-10 flex items-start gap-12 sm:gap-16 min-w-[820px] pt-1 pb-4">
          
          {/* ========================================================= */}
          {/* COLUMN 0: ROOT NODE ("Total Funds")                       */}
          {/* ========================================================= */}
          <div className="flex flex-col items-start w-[170px] shrink-0">
            <div className="h-9 mb-4 flex items-end">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Breakdown
              </span>
            </div>

            {/* Vertically centered root card aligning with 3rd box (middle) of categories */}
            <div 
              style={{ marginTop: `${rootOffsetTop}px` }}
              className="w-full transition-all duration-200"
            >
              {/* Root Card */}
              <div
                data-pbi-node="root"
                onClick={() => setIsRootExpanded(!isRootExpanded)}
                className={`w-full rounded-md border transition-all duration-200 cursor-pointer shadow-sm group ${
                  isDark 
                    ? 'bg-[#131b26] border-slate-700/80 hover:border-sky-500' 
                    : 'bg-white border-slate-300 hover:border-sky-500'
                } ${isRootExpanded ? (isDark ? 'ring-1 ring-sky-500/50' : 'ring-1 ring-sky-500/40') : ''}`}
                title="Click to toggle tree breakdown"
              >
                <div className="w-full h-1.5 bg-[#0284c7] rounded-t-sm" />

                <div className="p-2.5">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className={`text-xs font-bold truncate ${isDark ? 'text-slate-200 group-hover:text-sky-300' : 'text-slate-800 group-hover:text-sky-600'}`}>
                      Total Funds
                    </span>
                    <span className="text-[10px] text-sky-500 font-mono">
                      100%
                    </span>
                  </div>
                  <div className={`text-sm font-black font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatCurrency(totalBalance)}
                  </div>
                  <div className="mt-2 pt-1 border-t border-slate-800/40 flex items-center justify-between text-[10px] text-slate-500">
                    <span>{accounts.length} Accounts</span>
                    <span className="text-sky-500 font-bold">{isRootExpanded ? 'Expanded' : 'Collapsed'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* COLUMN 1: CATEGORIES ("Wallet_cat")                      */}
          {/* Clicking ONLY expands further into subcategories/accounts */}
          {/* ========================================================= */}
          {isRootExpanded && (
            <div className="flex flex-col items-start w-[185px] shrink-0">
              <div className="w-full mb-3 pb-1 border-b-2 border-sky-500 flex items-center gap-1.5">
                <Lock size={13} className="text-sky-500" />
                <span className={`text-xs font-extrabold tracking-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  Wallet_cat
                </span>
              </div>

              <div className="w-full flex justify-center py-0.5 mb-1 text-slate-400">
                <ChevronUp size={15} className="opacity-70 hover:opacity-100 cursor-pointer" />
              </div>

              <div className="w-full space-y-3 max-h-[580px] overflow-y-auto scrollbar-none pr-1">
                {displayedCategories.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-500 italic">
                    No matching categories.
                  </div>
                ) : (
                  displayedCategories.map((cat) => {
                    const catKey = cat.id || cat.type;
                    const isSelected = selectedCatId === catKey;
                    const catTotal = getCategoryTotal(cat);
                    const percentOfTotal = totalBalance > 0 ? (catTotal / totalBalance) * 100 : 0;
                    const barWidth = Math.min(100, Math.max(3, percentOfTotal));
                    const CatIcon = resolveCategoryIcon(cat);
                    const catTitle = getCategoryTitle(cat);

                    return (
                      <div
                        key={catKey}
                        data-pbi-node={`cat-${catKey}`}
                        onClick={() => handleCategoryClick(catKey)}
                        className={`w-full rounded-md border transition-all duration-150 cursor-pointer shadow-sm relative group ${
                          isSelected
                            ? (isDark 
                                ? 'bg-[#141f2d] border-sky-400 ring-2 ring-sky-500/30 shadow-sky-500/10' 
                                : 'bg-sky-50/70 border-sky-500 ring-2 ring-sky-500/20 shadow-md')
                            : (isDark 
                                ? 'bg-[#111722] border-slate-700/80 hover:border-slate-600' 
                                : 'bg-white border-slate-200 hover:border-slate-300')
                        }`}
                        title="Click to expand this category into its accounts"
                      >
                        {/* Top Blue Proportion Bar */}
                        <div className={`w-full h-1.5 rounded-t-sm overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                          <div 
                            className="h-full bg-[#0284c7] transition-all duration-300"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>

                        <div className="p-2.5">
                          <div className="flex items-center justify-between gap-1.5">
                            {/* Category Name: Clicking expands further only */}
                            <div
                              className={`text-xs font-bold truncate flex-1 flex items-center gap-1.5 ${
                                isSelected 
                                  ? (isDark ? 'text-sky-300' : 'text-sky-700') 
                                  : (isDark ? 'text-slate-200 group-hover:text-sky-300' : 'text-slate-800 group-hover:text-sky-600')
                              }`}
                            >
                              <span 
                                className="w-3.5 h-3.5 rounded flex items-center justify-center shrink-0"
                                style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                              >
                                <CatIcon size={10} />
                              </span>
                              <span className="truncate">{catTitle}</span>
                            </div>

                            <span className="text-[10px] text-sky-500/80 font-semibold shrink-0">
                              {isSelected ? '▶' : ''}
                            </span>
                          </div>

                          <div className="flex items-baseline justify-between gap-2 mt-1">
                            <span className={`text-xs font-extrabold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {formatCurrency(catTotal)}
                            </span>
                            <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {percentOfTotal.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="w-full flex justify-center py-0.5 mt-1 text-slate-400">
                <ChevronDown size={15} className="opacity-70 hover:opacity-100 cursor-pointer" />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* COLUMN 1.5 (OPTIONAL): SUBCATEGORIES                      */}
          {/* Clicking ONLY expands further into accounts               */}
          {/* ========================================================= */}
          {isRootExpanded && selectedCatId && activeSubCategories.length > 0 && (
            <div className="flex flex-col items-start w-[185px] shrink-0">
              <div className="w-full mb-3 pb-1 border-b-2 border-sky-500 flex items-center gap-1.5">
                <FolderTree size={13} className="text-sky-500" />
                <span className={`text-xs font-extrabold tracking-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  Subcategory
                </span>
              </div>

              <div className="w-full space-y-3 max-h-[580px] overflow-y-auto scrollbar-none pr-1">
                {activeSubCategories.map((subCat) => {
                  const scKey = subCat.id || subCat.type;
                  const isSelected = selectedSubCatId === scKey;
                  const scTotal = (groupedAccounts.get(scKey) || []).reduce((sum, a) => sum + (a.balance || 0), 0);
                  const parentTotal = activeCategory ? getCategoryTotal(activeCategory) : 1;
                  const percentOfParent = parentTotal > 0 ? (scTotal / parentTotal) * 100 : 0;
                  const barWidth = Math.min(100, Math.max(3, percentOfParent));
                  const ScIcon = resolveCategoryIcon(subCat);
                  const scTitle = getCategoryTitle(subCat);

                  return (
                    <div
                      key={scKey}
                      data-pbi-node={`subcat-${scKey}`}
                      onClick={() => handleSubCategoryClick(scKey)}
                      className={`w-full rounded-md border transition-all duration-150 cursor-pointer shadow-sm relative group ${
                        isSelected
                          ? (isDark 
                              ? 'bg-[#141f2d] border-sky-400 ring-2 ring-sky-500/30' 
                              : 'bg-sky-50/70 border-sky-500 ring-2 ring-sky-500/20 shadow-md')
                          : (isDark 
                              ? 'bg-[#111722] border-slate-700/80 hover:border-slate-600' 
                              : 'bg-white border-slate-200 hover:border-slate-300')
                      }`}
                      title="Click to expand subcategory accounts"
                    >
                      <div className={`w-full h-1.5 rounded-t-sm overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        <div 
                          className="h-full bg-[#0284c7] transition-all duration-300"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>

                      <div className="p-2.5">
                        <div className="flex items-center justify-between gap-1.5">
                          <div
                            className={`text-xs font-bold truncate flex-1 flex items-center gap-1.5 ${
                              isSelected 
                                ? (isDark ? 'text-sky-300' : 'text-sky-700') 
                                : (isDark ? 'text-slate-200 group-hover:text-sky-300' : 'text-slate-800 group-hover:text-sky-600')
                            }`}
                          >
                            <span 
                              className="w-3.5 h-3.5 rounded flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${subCat.color}25`, color: subCat.color }}
                            >
                              <ScIcon size={10} />
                            </span>
                            <span className="truncate">{scTitle}</span>
                          </div>

                          <span className="text-[10px] text-sky-500/80 font-semibold shrink-0">
                            {isSelected ? '▶' : ''}
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between gap-2 mt-1">
                          <span className={`text-xs font-extrabold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {formatCurrency(scTotal)}
                          </span>
                          <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {percentOfParent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* COLUMN 2: ACCOUNTS ("Wallet")                             */}
          {/* Clicking ONLY expands further into Account Detail column! */}
          {/* ========================================================= */}
          {isRootExpanded && selectedCatId && (
            <div className="flex flex-col items-start w-[190px] shrink-0">
              <div className="w-full mb-3 pb-1 border-b-2 border-sky-500 flex items-center gap-1.5">
                <Wallet size={13} className="text-sky-500" />
                <span className={`text-xs font-extrabold tracking-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  Wallet
                </span>
              </div>

              <div className="w-full flex justify-center py-0.5 mb-1 text-slate-400">
                <ChevronUp size={15} className="opacity-70 hover:opacity-100 cursor-pointer" />
              </div>

              <div className="w-full space-y-3 max-h-[580px] overflow-y-auto scrollbar-none pr-1">
                {displayedAccounts.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500 italic">
                    No accounts under this selection.
                  </div>
                ) : (
                  displayedAccounts.map((acc) => {
                    const isSelected = selectedAccountId === acc.id;
                    const parentTotal = activeCategory ? getCategoryTotal(activeCategory) : 1;
                    const percentOfCategory = parentTotal > 0 ? ((acc.balance || 0) / parentTotal) * 100 : 0;
                    const barWidth = Math.min(100, Math.max(3, percentOfCategory));

                    return (
                      <div
                        key={acc.id}
                        data-pbi-node={`acc-${acc.id}`}
                        onClick={() => handleAccountClick(acc.id)}
                        className={`w-full rounded-md border transition-all duration-150 cursor-pointer shadow-sm relative group ${
                          isSelected
                            ? (isDark 
                                ? 'bg-[#141f2d] border-sky-400 ring-2 ring-sky-500/40 shadow-md' 
                                : 'bg-sky-50/80 border-sky-500 ring-2 ring-sky-500/30 shadow-md')
                            : (isDark 
                                ? 'bg-[#111722] border-slate-700/80 hover:border-sky-400 hover:bg-[#141e2b]' 
                                : 'bg-white border-slate-200 hover:border-sky-500 hover:bg-sky-50/40')
                        }`}
                        title="Click account to expand its breakdown & activity details"
                      >
                        {/* Top Blue Proportion Bar */}
                        <div className={`w-full h-1.5 rounded-t-sm overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                          <div 
                            className="h-full bg-[#0284c7] transition-all duration-300"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>

                        <div className="p-2.5">
                          <div className="flex items-center justify-between gap-1.5">
                            {/* Account Name: Clicking expands further only */}
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <BankLogo
                                iconId={acc.icon}
                                name={acc.name}
                                institution={acc.institution}
                                size={14}
                              />
                              <span className={`text-xs font-bold truncate ${
                                isSelected
                                  ? (isDark ? 'text-sky-300 font-extrabold' : 'text-sky-700 font-extrabold')
                                  : (isDark ? 'text-slate-200 group-hover:text-sky-300' : 'text-slate-800 group-hover:text-sky-600')
                              }`}>
                                {acc.name}
                              </span>
                            </div>

                            <span className="text-[10px] text-sky-500 font-semibold shrink-0">
                              {isSelected ? '▼' : '▶'}
                            </span>
                          </div>

                          <div className="flex items-baseline justify-between gap-2 mt-1">
                            <span className={`text-xs font-extrabold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {formatCurrency(acc.balance)}
                            </span>
                            <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {percentOfCategory.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="w-full flex justify-center py-0.5 mt-1 text-slate-400">
                <ChevronDown size={15} className="opacity-70 hover:opacity-100 cursor-pointer" />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* COLUMN 3: EXPANDED ACCOUNT BREAKDOWN & ACTIVITY LEAF NODE */}
          {/* Appears when an account is clicked in the tree           */}
          {/* ========================================================= */}
          {isRootExpanded && selectedAccount && (
            <div 
              data-pbi-node={`acc-detail-${selectedAccount.id}`}
              className="flex flex-col items-start w-[240px] sm:w-[260px] shrink-0 animate-fadeIn"
            >
              <div className="w-full mb-3 pb-1 border-b-2 border-sky-500 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <CreditCard size={13} className="text-sky-500" />
                  <span className={`text-xs font-extrabold tracking-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    Account Detail
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAccountId(null)}
                  className={`text-[10px] font-semibold hover:underline ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Collapse
                </button>
              </div>

              {/* Account Detail Card */}
              <div className={`w-full rounded-md border p-3.5 space-y-3 shadow-md ${
                isDark 
                  ? 'bg-[#131b26] border-sky-500/50' 
                  : 'bg-white border-sky-400'
              }`}>
                {/* Header Info */}
                <div className="flex items-center gap-2.5">
                  <BankLogo
                    iconId={selectedAccount.icon}
                    name={selectedAccount.name}
                    institution={selectedAccount.institution}
                    size={24}
                  />
                  <div className="min-w-0 flex-1">
                    <div className={`text-xs font-black truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {selectedAccount.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {selectedAccount.institution || selectedAccount.type}
                      {selectedAccount.accountNumber ? ` •••• ${selectedAccount.accountNumber}` : ''}
                    </div>
                  </div>
                </div>

                {/* Balance Strip */}
                <div className={`p-2 rounded-lg ${isDark ? 'bg-[#0b1017]' : 'bg-slate-50'} border border-slate-800/60`}>
                  <div className="text-[10px] uppercase font-semibold text-slate-400">
                    Net Balance
                  </div>
                  <div className="text-base font-black font-mono text-amber-300">
                    {formatCurrency(selectedAccount.balance)}
                  </div>
                </div>

                {/* Reconciliation Date Info */}
                <div className="space-y-1 text-[11px]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock size={11} className="text-sky-400" />
                      <span>Last Reconciled:</span>
                    </span>
                    <span className="font-mono text-slate-200 font-semibold">
                      {selectedAccount.reconciledDate ? formatDate(selectedAccount.reconciledDate) : 'Not recorded'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Account Category:</span>
                    <span className="font-semibold text-slate-300 capitalize">
                      {selectedAccount.type.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Recent Activity Mini-List (Directly in the tree) */}
                <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <span>Recent Activity</span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {selectedAccountTxns.length} entries
                    </span>
                  </div>

                  {selectedAccountTxns.length === 0 ? (
                    <div className="text-[11px] text-slate-500 italic py-1 text-center">
                      No recorded transactions
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {selectedAccountTxns.map((txn) => {
                        const isCredit = txn.type === 'INCOME' || (txn.type === 'TRANSFER' && txn.toAccountId === selectedAccount.id);
                        return (
                          <div 
                            key={txn.id}
                            className={`p-1.5 rounded flex items-center justify-between text-[10px] ${
                              isDark ? 'bg-[#0e141d]' : 'bg-slate-100'
                            }`}
                          >
                            <div className="min-w-0 pr-1 truncate">
                              <div className="font-medium text-slate-200 truncate">
                                {txn.description || txn.category || 'Transaction'}
                              </div>
                              <div className="text-[9px] text-slate-500 font-mono">
                                {formatDate(txn.date)}
                              </div>
                            </div>
                            <div className={`font-mono font-bold shrink-0 ${isCredit ? 'text-emerald-400' : 'text-slate-300'}`}>
                              {isCredit ? '+' : '-'}{formatCurrency(txn.amount)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Legend / Quick Help footer */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 px-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-[#0284c7] rounded-sm inline-block" />
            <span>Proportion of Total Funds</span>
          </span>
          <span>•</span>
          <span>Click any category or account to expand its breakdown directly in the tree</span>
        </div>
      </div>
    </div>
  );
};
