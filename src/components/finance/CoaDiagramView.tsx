import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  RotateCcw, 
  Layers, 
  Wallet, 
  FolderTree, 
  ExternalLink,
  Lock,
  Sun,
  Moon,
  Info
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import type { Account } from '../../types';
import { BankLogo } from '../common/BankLogo';
import { CategoryDefinition, resolveCategoryIcon } from './ChartOfAccounts';

interface CoaDiagramViewProps {
  accounts: Account[];
  categoriesList: CategoryDefinition[];
  mainCategories: CategoryDefinition[];
  subCategoriesByParent: Map<string, CategoryDefinition[]>;
  groupedAccounts: Map<string, Account[]>;
  totalBalance: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  getCategoryTitle: (cat: CategoryDefinition) => string;
  onOpenAccount: (account: Account) => void;
  onOpenCategory: (category: CategoryDefinition) => void;
}

interface NodePosition {
  x: number;
  y: number;
  side: 'left' | 'right';
}

export const CoaDiagramView: React.FC<CoaDiagramViewProps> = ({
  accounts,
  categoriesList,
  mainCategories,
  subCategoriesByParent,
  groupedAccounts,
  totalBalance,
  searchTerm,
  setSearchTerm,
  getCategoryTitle,
  onOpenAccount,
  onOpenCategory
}) => {
  // Theme state: 'light' (like the user's PowerBI screenshot) or 'dark' (matching app default)
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');

  // Expansion state
  // PowerBI decomposition tree starts with Root expanded to Categories.
  const [isRootExpanded, setIsRootExpanded] = useState<boolean>(true);

  // Selected Category ID (defaults to the category with highest balance, or first category)
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);

  // Selected Subcategory ID (if applicable)
  const [selectedSubCatId, setSelectedSubCatId] = useState<string | null>(null);

  // Sort by 'balance' (highest first, like PowerBI) or 'name'
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
        if (title.includes(term)) return true;
        // Check if any child account matches
        const catKey = cat.id || cat.type;
        const direct = groupedAccounts.get(catKey) || [];
        const subs = subCategoriesByParent.get(catKey) || [];
        const subAccs = subs.flatMap(s => groupedAccounts.get(s.id || s.type) || []);
        return [...direct, ...subAccs].some(a => 
          a.name.toLowerCase().includes(term) || 
          (a.institution && a.institution.toLowerCase().includes(term))
        );
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

  // Set initial selected category
  useEffect(() => {
    if (displayedCategories.length > 0) {
      const exists = displayedCategories.some(c => (c.id || c.type) === selectedCatId);
      if (!exists || !selectedCatId) {
        // Pick the category with the highest balance (like "Bank" in PowerBI)
        const highest = [...displayedCategories].sort((a, b) => getCategoryTotal(b) - getCategoryTotal(a))[0];
        setSelectedCatId(highest ? (highest.id || highest.type) : (displayedCategories[0].id || displayedCategories[0].type));
      }
    } else {
      setSelectedCatId(null);
    }
  }, [displayedCategories]);

  // Active Category Definition
  const activeCategory = useMemo(() => {
    if (!selectedCatId) return null;
    return categoriesList.find(c => (c.id || c.type) === selectedCatId) || null;
  }, [selectedCatId, categoriesList]);

  // Subcategories under active category (if any)
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

  // Set initial subcategory if applicable
  useEffect(() => {
    if (activeSubCategories.length > 0) {
      const exists = activeSubCategories.some(sc => (sc.id || sc.type) === selectedSubCatId);
      if (!exists) {
        setSelectedSubCatId(activeSubCategories[0].id || activeSubCategories[0].type);
      }
    } else {
      setSelectedSubCatId(null);
    }
  }, [activeSubCategories]);

  // Active Subcategory Definition
  const activeSubCategory = useMemo(() => {
    if (!selectedSubCatId) return null;
    return categoriesList.find(c => (c.id || c.type) === selectedSubCatId) || null;
  }, [selectedSubCatId, categoriesList]);

  // Accounts to display in the rightmost column (`Wallet`)
  const displayedAccounts = useMemo(() => {
    if (!activeCategory) return [];

    let accs: Account[] = [];
    if (activeSubCategories.length > 0 && selectedSubCatId) {
      // Subcategory is selected -> show accounts of this subcategory
      accs = [...(groupedAccounts.get(selectedSubCatId) || [])];
    } else {
      // Show direct accounts of the category, or all accounts if no subcategories
      const direct = groupedAccounts.get(selectedCatId!) || [];
      const subs = subCategoriesByParent.get(selectedCatId!) || [];
      const subAccs = subs.flatMap(s => groupedAccounts.get(s.id || s.type) || []);
      accs = direct.length > 0 || subs.length === 0 ? direct : subAccs;
      // If direct accounts is empty but has subaccounts and no subcategory column, fallback
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

  // Max reference balance for percentage bars
  const maxCategoryBalance = useMemo(() => {
    if (displayedCategories.length === 0) return 1;
    return Math.max(...displayedCategories.map(getCategoryTotal), 1);
  }, [displayedCategories]);

  const maxAccountBalance = useMemo(() => {
    if (displayedAccounts.length === 0) return 1;
    return Math.max(...displayedAccounts.map(a => a.balance || 0), 1);
  }, [displayedAccounts]);

  // Reset visual (collapse back to root, or reset to top category)
  const handleResetVisual = () => {
    setIsRootExpanded(true);
    if (displayedCategories.length > 0) {
      const highest = [...displayedCategories].sort((a, b) => getCategoryTotal(b) - getCategoryTotal(a))[0];
      setSelectedCatId(highest ? (highest.id || highest.type) : (displayedCategories[0].id || displayedCategories[0].type));
    }
    setSearchTerm('');
  };

  // Calculate smooth SVG bezier paths between columns
  useEffect(() => {
    const updateConnectors = () => {
      if (!containerRef.current || !isRootExpanded) {
        setConnectorPaths([]);
        return;
      }

      const containerRect = containerRef.current.getBoundingClientRect();
      const paths: { id: string; d: string; isActive: boolean }[] = [];

      // 1. Curve from Root Node to Selected Category Node
      const rootEl = containerRef.current.querySelector('[data-pbi-node="root"]');
      if (rootEl && selectedCatId) {
        const rootRect = rootEl.getBoundingClientRect();
        const startX = rootRect.right - containerRect.left + containerRef.current.scrollLeft;
        const startY = rootRect.top + rootRect.height / 2 - containerRect.top + containerRef.current.scrollTop;

        // Path to each category node (active one is solid blue, inactive are subtle)
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

      // 2. Curve from Selected Category Node to Subcategories OR Accounts
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

                    paths.push({
                      id: `subcat-to-acc-${acc.id}`,
                      d: `M ${subStartX} ${subStartY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${endX} ${endY}`,
                      isActive: true
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

                paths.push({
                  id: `cat-to-acc-${acc.id}`,
                  d: `M ${startX} ${startY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${endX} ${endY}`,
                  isActive: true
                });
              }
            }
          }
        }
      }

      setConnectorPaths(paths);
    };

    // Run after DOM render
    const timer = setTimeout(updateConnectors, 40);
    window.addEventListener('resize', updateConnectors);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateConnectors);
    };
  }, [
    isRootExpanded, 
    selectedCatId, 
    selectedSubCatId, 
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
            title="Reset visual to original decomposition state"
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

          {/* Canvas Theme Toggle (Light like PowerBI screenshot vs Dark app theme) */}
          <button
            type="button"
            onClick={() => setThemeMode(prev => (prev === 'dark' ? 'light' : 'dark'))}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition ${
              isDark 
                ? 'bg-[#0a0e14] border-slate-800 text-amber-300 hover:text-amber-200' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
            }`}
            title="Toggle Canvas Theme (PowerBI Light / Dark)"
          >
            {isDark ? <Sun size={13} className="text-amber-400" /> : <Moon size={13} className="text-slate-600" />}
            <span className="hidden sm:inline">{isDark ? 'Light Canvas' : 'Dark Canvas'}</span>
          </button>
        </div>
      </div>

      {/* Main PowerBI Decomposition Canvas */}
      <div 
        ref={containerRef}
        className={`relative rounded-2xl sm:rounded-3xl border overflow-x-auto p-4 sm:p-6 transition-colors shadow-inner min-h-[460px] scrollbar-thin ${
          isDark 
            ? 'bg-[#0a0e15] border-slate-800 scrollbar-thumb-slate-800' 
            : 'bg-[#ffffff] border-slate-200 scrollbar-thumb-slate-300'
        }`}
      >
        {/* SVG Connector Layer */}
        <svg 
          className="absolute inset-0 pointer-events-none z-0 w-full h-full min-w-[760px]"
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

        <div className="relative z-10 flex items-start gap-12 sm:gap-16 min-w-[740px] pt-1 pb-4">
          
          {/* ========================================================= */}
          {/* COLUMN 0: ROOT NODE ("Total Funds")                       */}
          {/* ========================================================= */}
          <div className="flex flex-col items-start w-[170px] shrink-0">
            {/* Header placeholder matching PowerBI column header alignment */}
            <div className="h-9 mb-4 flex items-end">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Breakdown
              </span>
            </div>

            {/* Root Card (Total Funds) */}
            <div
              data-pbi-node="root"
              onClick={() => setIsRootExpanded(!isRootExpanded)}
              className={`w-full rounded-md border transition-all duration-200 cursor-pointer shadow-sm group ${
                isDark 
                  ? 'bg-[#131b26] border-slate-700/80 hover:border-sky-500' 
                  : 'bg-white border-slate-300 hover:border-sky-500'
              } ${isRootExpanded ? (isDark ? 'ring-1 ring-sky-500/50' : 'ring-1 ring-sky-500/40') : ''}`}
            >
              {/* PowerBI Full Blue Proportion Bar on Top */}
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
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* COLUMN 1: CATEGORIES ("Wallet_cat")                      */}
          {/* ========================================================= */}
          {isRootExpanded && (
            <div className="flex flex-col items-start w-[185px] shrink-0">
              {/* PowerBI Column Header: [Lock/Icon] Wallet_cat */}
              <div className="w-full mb-3 pb-1 border-b-2 border-sky-500 flex items-center gap-1.5">
                <Lock size={13} className="text-sky-500" />
                <span className={`text-xs font-extrabold tracking-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  Wallet_cat
                </span>
              </div>

              {/* Up chevron navigation icon */}
              <div className="w-full flex justify-center py-0.5 mb-1 text-slate-400">
                <ChevronUp size={15} className="opacity-70 hover:opacity-100 cursor-pointer" />
              </div>

              {/* Category Cards List */}
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
                        onClick={() => setSelectedCatId(catKey)}
                        className={`w-full rounded-md border transition-all duration-150 cursor-pointer shadow-sm relative group ${
                          isSelected
                            ? (isDark 
                                ? 'bg-[#141f2d] border-sky-400 ring-2 ring-sky-500/30 shadow-sky-500/10' 
                                : 'bg-sky-50/70 border-sky-500 ring-2 ring-sky-500/20 shadow-md')
                            : (isDark 
                                ? 'bg-[#111722] border-slate-700/80 hover:border-slate-600' 
                                : 'bg-white border-slate-200 hover:border-slate-300')
                        }`}
                      >
                        {/* PowerBI Top Blue Proportion Bar */}
                        <div className={`w-full h-1.5 rounded-t-sm overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                          <div 
                            className="h-full bg-[#0284c7] transition-all duration-300"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>

                        <div className="p-2.5">
                          <div className="flex items-center justify-between gap-1.5">
                            {/* Category Name (Clicking opens Category Details Pop-up as required) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenCategory(cat);
                              }}
                              className={`text-xs font-bold truncate text-left transition flex-1 flex items-center gap-1.5 ${
                                isSelected 
                                  ? (isDark ? 'text-sky-300 hover:underline' : 'text-sky-700 hover:underline') 
                                  : (isDark ? 'text-slate-200 hover:text-sky-300' : 'text-slate-800 hover:text-sky-600')
                              }`}
                              title="Click name to open category details & edit modal"
                            >
                              <span 
                                className="w-3.5 h-3.5 rounded flex items-center justify-center shrink-0"
                                style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                              >
                                <CatIcon size={10} />
                              </span>
                              <span className="truncate">{catTitle}</span>
                            </button>

                            {/* Info icon hint for opening category details */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenCategory(cat);
                              }}
                              className="text-slate-400 hover:text-sky-400 opacity-0 group-hover:opacity-100 transition p-0.5"
                              title="Category details"
                            >
                              <ExternalLink size={10} />
                            </button>
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

              {/* Down chevron navigation icon */}
              <div className="w-full flex justify-center py-0.5 mt-1 text-slate-400">
                <ChevronDown size={15} className="opacity-70 hover:opacity-100 cursor-pointer" />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* COLUMN 1.5 (OPTIONAL): SUBCATEGORIES IF PRESENT           */}
          {/* ========================================================= */}
          {isRootExpanded && selectedCatId && activeSubCategories.length > 0 && (
            <div className="flex flex-col items-start w-[185px] shrink-0">
              {/* Column Header: Subcategory */}
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
                      onClick={() => setSelectedSubCatId(scKey)}
                      className={`w-full rounded-md border transition-all duration-150 cursor-pointer shadow-sm relative group ${
                        isSelected
                          ? (isDark 
                              ? 'bg-[#141f2d] border-sky-400 ring-2 ring-sky-500/30' 
                              : 'bg-sky-50/70 border-sky-500 ring-2 ring-sky-500/20 shadow-md')
                          : (isDark 
                              ? 'bg-[#111722] border-slate-700/80 hover:border-slate-600' 
                              : 'bg-white border-slate-200 hover:border-slate-300')
                      }`}
                    >
                      {/* Proportion Bar */}
                      <div className={`w-full h-1.5 rounded-t-sm overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        <div 
                          className="h-full bg-[#0284c7] transition-all duration-300"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>

                      <div className="p-2.5">
                        <div className="flex items-center justify-between gap-1.5">
                          {/* Subcategory Name (Clicking opens Category Details Pop-up) */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenCategory(subCat);
                            }}
                            className={`text-xs font-bold truncate text-left transition flex-1 flex items-center gap-1.5 ${
                              isSelected 
                                ? (isDark ? 'text-sky-300 hover:underline' : 'text-sky-700 hover:underline') 
                                : (isDark ? 'text-slate-200 hover:text-sky-300' : 'text-slate-800 hover:text-sky-600')
                            }`}
                            title="Click name to open category details & edit modal"
                          >
                            <span 
                              className="w-3.5 h-3.5 rounded flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${subCat.color}25`, color: subCat.color }}
                            >
                              <ScIcon size={10} />
                            </span>
                            <span className="truncate">{scTitle}</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenCategory(subCat);
                            }}
                            className="text-slate-400 hover:text-sky-400 opacity-0 group-hover:opacity-100 transition p-0.5"
                          >
                            <ExternalLink size={10} />
                          </button>
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
          {/* ========================================================= */}
          {isRootExpanded && selectedCatId && (
            <div className="flex flex-col items-start w-[190px] shrink-0">
              {/* PowerBI Column Header: [Wallet Icon] Wallet */}
              <div className="w-full mb-3 pb-1 border-b-2 border-sky-500 flex items-center gap-1.5">
                <Wallet size={13} className="text-sky-500" />
                <span className={`text-xs font-extrabold tracking-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  Wallet
                </span>
              </div>

              {/* Up chevron */}
              <div className="w-full flex justify-center py-0.5 mb-1 text-slate-400">
                <ChevronUp size={15} className="opacity-70 hover:opacity-100 cursor-pointer" />
              </div>

              {/* Accounts Cards List */}
              <div className="w-full space-y-3 max-h-[580px] overflow-y-auto scrollbar-none pr-1">
                {displayedAccounts.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500 italic">
                    No accounts under this selection.
                  </div>
                ) : (
                  displayedAccounts.map((acc) => {
                    const parentTotal = activeCategory ? getCategoryTotal(activeCategory) : 1;
                    const percentOfCategory = parentTotal > 0 ? ((acc.balance || 0) / parentTotal) * 100 : 0;
                    const barWidth = Math.min(100, Math.max(3, percentOfCategory));

                    return (
                      <div
                        key={acc.id}
                        data-pbi-node={`acc-${acc.id}`}
                        onClick={() => onOpenAccount(acc)}
                        className={`w-full rounded-md border transition-all duration-150 cursor-pointer shadow-sm relative group ${
                          isDark 
                            ? 'bg-[#111722] border-slate-700/80 hover:border-sky-400 hover:bg-[#141e2b]' 
                            : 'bg-white border-slate-200 hover:border-sky-500 hover:bg-sky-50/40'
                        }`}
                        title="Click to view account details, reco date, passbook, edit or delete"
                      >
                        {/* PowerBI Top Blue Proportion Bar */}
                        <div className={`w-full h-1.5 rounded-t-sm overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                          <div 
                            className="h-full bg-[#0284c7] transition-all duration-300"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>

                        <div className="p-2.5">
                          <div className="flex items-center justify-between gap-1.5">
                            {/* Account Name (Clicking opens Account Details Pop-up as required) */}
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <BankLogo
                                iconId={acc.icon}
                                name={acc.name}
                                institution={acc.institution}
                                size={14}
                              />
                              <span className={`text-xs font-bold truncate group-hover:underline ${
                                isDark ? 'text-slate-200 group-hover:text-sky-300' : 'text-slate-800 group-hover:text-sky-600'
                              }`}>
                                {acc.name}
                              </span>
                            </div>

                            <ExternalLink size={10} className="text-slate-400 opacity-0 group-hover:opacity-100 transition shrink-0" />
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

              {/* Down chevron */}
              <div className="w-full flex justify-center py-0.5 mt-1 text-slate-400">
                <ChevronDown size={15} className="opacity-70 hover:opacity-100 cursor-pointer" />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Legend / Quick Help footer matching PowerBI mobile bar */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 px-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-[#0284c7] rounded-sm inline-block" />
            <span>Proportion of Total Funds</span>
          </span>
          <span>•</span>
          <span>Click any category or account to open its full details modal</span>
        </div>
      </div>
    </div>
  );
};
