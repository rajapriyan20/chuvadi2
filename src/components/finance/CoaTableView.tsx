import React, { useState, useMemo, useRef } from 'react';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  ChevronRight, 
  Calendar, 
  Layers, 
  GripVertical,
  RotateCcw
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Account } from '../../types';
import { BankLogo } from '../common/BankLogo';
import { CategoryDefinition, resolveCategoryIcon } from './ChartOfAccounts';

interface CoaTableViewProps {
  accounts: Account[];
  categoriesList: CategoryDefinition[];
  getCategoryTitle: (cat: CategoryDefinition) => string;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onOpenAccount: (account: Account) => void;
  onOpenCategory: (category: CategoryDefinition) => void;
  onOpenNewAccount: () => void;
}

export type SortField = 'name' | 'category' | 'type' | 'reconciledDate' | 'balance';
export type SortOrder = 'asc' | 'desc';
export type ColumnId = 'name' | 'balance' | 'category' | 'type' | 'reconciledDate';

// Default column order: Current Balance is placed as the second column
export const DEFAULT_COLUMN_ORDER: ColumnId[] = [
  'name',
  'balance',
  'category',
  'type',
  'reconciledDate'
];

interface ColumnMeta {
  id: ColumnId;
  label: string;
  sortField: SortField;
  align: 'left' | 'right';
  minWidth: string;
}

const COLUMN_CONFIG: Record<ColumnId, ColumnMeta> = {
  name: {
    id: 'name',
    label: 'Account Name',
    sortField: 'name',
    align: 'left',
    minWidth: 'min-w-[140px]'
  },
  balance: {
    id: 'balance',
    label: 'Current Balance',
    sortField: 'balance',
    align: 'right',
    minWidth: 'min-w-[125px]'
  },
  category: {
    id: 'category',
    label: 'Category',
    sortField: 'category',
    align: 'left',
    minWidth: 'min-w-[105px]'
  },
  type: {
    id: 'type',
    label: 'Nature',
    sortField: 'type',
    align: 'left',
    minWidth: 'min-w-[75px]'
  },
  reconciledDate: {
    id: 'reconciledDate',
    label: 'Date of Reco',
    sortField: 'reconciledDate',
    align: 'left',
    minWidth: 'min-w-[95px]'
  }
};

export const CoaTableView: React.FC<CoaTableViewProps> = ({
  accounts,
  categoriesList,
  getCategoryTitle,
  searchTerm,
  setSearchTerm,
  onOpenAccount,
  onOpenCategory,
  onOpenNewAccount
}) => {
  const [sortField, setSortField] = useState<SortField>('balance');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');

  // Column order state with localStorage persistence
  const [columnOrder, setColumnOrder] = useState<ColumnId[]>(() => {
    try {
      const saved = localStorage.getItem('chuvadi_coa_table_column_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_COLUMN_ORDER.length) {
          const allValid = DEFAULT_COLUMN_ORDER.every(col => parsed.includes(col));
          if (allValid) return parsed as ColumnId[];
        }
      }
    } catch {}
    return DEFAULT_COLUMN_ORDER;
  });

  // Drag and drop state for column reordering
  const [draggedCol, setDraggedCol] = useState<ColumnId | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ColumnId | null>(null);
  const dragOccurredRef = useRef<boolean>(false);

  // Build quick category lookup
  const categoryMap = useMemo(() => {
    const map = new Map<string, CategoryDefinition>();
    for (const cat of categoriesList) {
      map.set(cat.id || cat.type, cat);
    }
    return map;
  }, [categoriesList]);

  // Find category for an account
  const getAccountCategory = (acc: Account): CategoryDefinition | undefined => {
    if (acc.categoryId && categoryMap.has(acc.categoryId)) {
      return categoryMap.get(acc.categoryId);
    }
    return categoriesList.find(c => (!c.parentId || c.parentId === 'MAIN') && c.type === acc.type)
      || categoriesList.find(c => c.type === acc.type)
      || categoriesList[0];
  };

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      // Type filter
      if (selectedTypeFilter !== 'ALL' && acc.type !== selectedTypeFilter) {
        return false;
      }

      // Search term filter
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const cat = getAccountCategory(acc);
      const catTitle = cat ? getCategoryTitle(cat).toLowerCase() : '';

      return (
        acc.name.toLowerCase().includes(term) ||
        (acc.institution && acc.institution.toLowerCase().includes(term)) ||
        (acc.accountNumber && acc.accountNumber.includes(term)) ||
        catTitle.includes(term) ||
        (acc.type && acc.type.toLowerCase().includes(term))
      );
    });
  }, [accounts, selectedTypeFilter, searchTerm, categoryMap, categoriesList, getCategoryTitle]);

  // Sort accounts
  const sortedAccounts = useMemo(() => {
    return [...filteredAccounts].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'category') {
        const catA = getAccountCategory(a);
        const catB = getAccountCategory(b);
        const titleA = catA ? getCategoryTitle(catA) : '';
        const titleB = catB ? getCategoryTitle(catB) : '';
        comparison = titleA.localeCompare(titleB);
      } else if (sortField === 'type') {
        comparison = (a.type || '').localeCompare(b.type || '');
      } else if (sortField === 'reconciledDate') {
        const dateA = a.reconciledDate || '';
        const dateB = b.reconciledDate || '';
        comparison = dateA.localeCompare(dateB);
      } else if (sortField === 'balance') {
        comparison = (a.balance || 0) - (b.balance || 0);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredAccounts, sortField, sortOrder, categoryMap, categoriesList, getCategoryTitle]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder(field === 'balance' ? 'desc' : 'asc');
    }
  };

  const totalFilteredBalance = useMemo(() => {
    return sortedAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  }, [sortedAccounts]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={11} className="text-slate-500 opacity-60 shrink-0" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp size={11} className="text-amber-400 shrink-0" />
    ) : (
      <ArrowDown size={11} className="text-amber-400 shrink-0" />
    );
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, colId: ColumnId) => {
    dragOccurredRef.current = false;
    setDraggedCol(colId);
    e.dataTransfer.setData('text/plain', colId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colId: ColumnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedCol && draggedCol !== colId) {
      dragOccurredRef.current = true;
      if (dragOverCol !== colId) {
        setDragOverCol(colId);
      }
    }
  };

  const handleDragLeave = (_e: React.DragEvent, colId: ColumnId) => {
    if (dragOverCol === colId) {
      setDragOverCol(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetColId: ColumnId) => {
    e.preventDefault();
    if (!draggedCol || draggedCol === targetColId) {
      setDraggedCol(null);
      setDragOverCol(null);
      return;
    }
    const fromIndex = columnOrder.indexOf(draggedCol);
    const toIndex = columnOrder.indexOf(targetColId);
    if (fromIndex !== -1 && toIndex !== -1) {
      const next = [...columnOrder];
      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, draggedCol);
      setColumnOrder(next);
      try {
        localStorage.setItem('chuvadi_coa_table_column_order', JSON.stringify(next));
      } catch {}
    }
    setDraggedCol(null);
    setDragOverCol(null);
  };

  const handleDragEnd = () => {
    setDraggedCol(null);
    setDragOverCol(null);
    setTimeout(() => {
      dragOccurredRef.current = false;
    }, 120);
  };

  const handleHeaderClick = (colId: ColumnId) => {
    if (dragOccurredRef.current) return;
    const config = COLUMN_CONFIG[colId];
    if (config) {
      handleSort(config.sortField);
    }
  };

  const handleResetColumns = () => {
    setColumnOrder(DEFAULT_COLUMN_ORDER);
    try {
      localStorage.removeItem('chuvadi_coa_table_column_order');
    } catch {}
  };

  const isCustomColumnOrder = useMemo(() => {
    return JSON.stringify(columnOrder) !== JSON.stringify(DEFAULT_COLUMN_ORDER);
  }, [columnOrder]);

  return (
    <div className="space-y-2.5 animate-fadeIn">
      {/* Table Action & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-[#131922] p-2.5 sm:p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search table by name, category, or bank..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0a0e14] border border-slate-800 focus:border-amber-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
            />
          </div>

          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="bg-[#0a0e14] border border-slate-800 focus:border-amber-500 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 font-medium focus:outline-none cursor-pointer"
            aria-label="Filter by type"
          >
            <option value="ALL">All Types</option>
            <option value="BANK">Bank</option>
            <option value="CASH">Cash</option>
            <option value="CREDIT_CARD">Credit Card</option>
            <option value="INVESTMENT">Investment</option>
            <option value="LOAN">Loan</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5 text-[11px] text-slate-400 px-1">
          {/* Column Drag Hint & Reset */}
          {isCustomColumnOrder && (
            <button
              type="button"
              onClick={handleResetColumns}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-semibold transition"
              title="Reset table columns to default arrangement"
            >
              <RotateCcw size={10} />
              <span>Reset Columns</span>
            </button>
          )}

          <span>
            Showing <strong className="text-white font-mono">{sortedAccounts.length}</strong> of{' '}
            <strong className="text-slate-300 font-mono">{accounts.length}</strong>
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="font-semibold text-amber-200 font-mono">
            {formatCurrency(totalFilteredBalance)}
          </span>
        </div>
      </div>

      {/* Tabulated Accounts Table */}
      <div className="bg-[#131922] rounded-2xl sm:rounded-3xl border border-slate-800/90 overflow-hidden shadow-sm">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-[#0e141c] text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider select-none">
                {columnOrder.map((colId) => {
                  const cfg = COLUMN_CONFIG[colId];
                  const isBeingDragged = draggedCol === colId;
                  const isDraggedOver = dragOverCol === colId && draggedCol !== colId;
                  const isRightAligned = cfg.align === 'right';

                  return (
                    <th
                      key={colId}
                      draggable
                      onDragStart={(e) => handleDragStart(e, colId)}
                      onDragOver={(e) => handleDragOver(e, colId)}
                      onDragLeave={(e) => handleDragLeave(e, colId)}
                      onDrop={(e) => handleDrop(e, colId)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleHeaderClick(colId)}
                      className={`py-2 px-2.5 sm:px-3 transition-all cursor-grab active:cursor-grabbing hover:text-white ${cfg.minWidth} ${
                        isBeingDragged ? 'opacity-40 bg-slate-800/50' : ''
                      } ${
                        isDraggedOver ? 'bg-amber-500/20 border-l-2 border-r-2 border-amber-400 ring-1 ring-amber-400 text-amber-300' : ''
                      }`}
                      title="Drag to shift column order. Click to sort."
                    >
                      <div className={`flex items-center gap-1.5 ${isRightAligned ? 'justify-end' : 'justify-start'}`}>
                        {/* Drag Handle Grip Icon */}
                        <GripVertical 
                          size={12} 
                          className="text-slate-500 hover:text-amber-400 shrink-0 cursor-grab active:cursor-grabbing" 
                        />
                        <span className="whitespace-nowrap">{cfg.label}</span>
                        {renderSortIcon(cfg.sortField)}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/40 text-xs">
              {sortedAccounts.length === 0 ? (
                <tr>
                  <td colSpan={columnOrder.length} className="py-6 text-center text-slate-500 italic">
                    <p>No accounts found matching your filter criteria.</p>
                    <button
                      type="button"
                      onClick={onOpenNewAccount}
                      className="mt-2.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold transition"
                    >
                      + Add New Account
                    </button>
                  </td>
                </tr>
              ) : (
                sortedAccounts.map((acc, index) => {
                  const cat = getAccountCategory(acc);
                  const catTitle = cat ? getCategoryTitle(cat) : 'General';
                  const CatIcon = cat ? resolveCategoryIcon(cat) : Layers;
                  const isLiability = acc.type === 'CREDIT_CARD' || acc.type === 'LOAN';

                  return (
                    <tr
                      key={acc.id || index}
                      className="hover:bg-[#18212c]/70 transition-colors group cursor-pointer"
                    >
                      {columnOrder.map((colId) => {
                        switch (colId) {
                          case 'name':
                            return (
                              <td
                                key={colId}
                                onClick={() => onOpenAccount(acc)}
                                className="py-1.5 px-2.5 sm:px-3"
                                title="Click to view account details, reco date, passbook, edit, or delete"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <BankLogo
                                    iconId={acc.icon}
                                    name={acc.name}
                                    institution={acc.institution}
                                    size={20}
                                  />
                                  <div className="min-w-0">
                                    <span className="font-semibold text-xs text-white group-hover:text-amber-300 transition truncate block max-w-[140px] sm:max-w-none">
                                      {acc.name}
                                    </span>
                                    {(acc.institution || acc.accountNumber) && (
                                      <span className="text-[10px] text-slate-400 truncate block">
                                        {acc.institution || ''}{acc.institution && acc.accountNumber ? ' • ' : ''}
                                        {acc.accountNumber ? `•••• ${acc.accountNumber}` : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                            );

                          case 'balance':
                            return (
                              <td 
                                key={colId}
                                onClick={() => onOpenAccount(acc)}
                                className="py-1.5 px-2.5 sm:px-3 text-right whitespace-nowrap"
                              >
                                <div className="flex items-center justify-end gap-1 whitespace-nowrap shrink-0">
                                  <span className={`font-mono font-bold text-xs whitespace-nowrap tabular-nums shrink-0 ${
                                    isLiability ? 'text-amber-300' : 'text-amber-100'
                                  }`}>
                                    {formatCurrency(acc.balance)}
                                  </span>
                                  <ChevronRight size={12} className="text-slate-600 group-hover:text-slate-400 transition shrink-0" />
                                </div>
                              </td>
                            );

                          case 'category':
                            return (
                              <td key={colId} className="py-1.5 px-2">
                                {cat ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenCategory(cat);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#0a0e14] hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 transition text-[10px] sm:text-[11px] font-medium max-w-[130px] truncate"
                                    title="Click to view category details, icon, or edit"
                                  >
                                    <span 
                                      className="w-3.5 h-3.5 rounded flex items-center justify-center shrink-0"
                                      style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                                    >
                                      <CatIcon size={9} />
                                    </span>
                                    <span className="truncate">{catTitle}</span>
                                  </button>
                                ) : (
                                  <span className="text-slate-500 text-[10px]">—</span>
                                )}
                              </td>
                            );

                          case 'type':
                            return (
                              <td key={colId} className="py-1.5 px-2" onClick={() => onOpenAccount(acc)}>
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-semibold border ${
                                  isLiability
                                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                }`}>
                                  {isLiability ? 'Liability' : 'Asset'}
                                </span>
                              </td>
                            );

                          case 'reconciledDate':
                            return (
                              <td key={colId} className="py-1.5 px-2 whitespace-nowrap" onClick={() => onOpenAccount(acc)}>
                                {acc.reconciledDate ? (
                                  <div className="flex items-center gap-1 text-slate-300 font-mono text-[10px] sm:text-[11px] whitespace-nowrap">
                                    <Calendar size={11} className="text-slate-500 shrink-0" />
                                    <span>{formatDate(acc.reconciledDate)}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-500 text-[10px] italic">Not set</span>
                                )}
                              </td>
                            );

                          default:
                            return null;
                        }
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer Summary Row: Dynamically aligned with columnOrder */}
            {sortedAccounts.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-700 bg-[#0e141c] text-xs font-bold text-white">
                  {columnOrder.map((colId) => {
                    if (colId === 'name') {
                      return (
                        <td key={colId} className="py-2 px-2.5 sm:px-3">
                          <span className="text-slate-400 uppercase text-[10px] tracking-wider whitespace-nowrap">
                            Total ({sortedAccounts.length} Accs)
                          </span>
                        </td>
                      );
                    }
                    if (colId === 'balance') {
                      return (
                        <td key={colId} className="py-2 px-2.5 sm:px-3 text-right font-mono text-xs sm:text-sm text-amber-200 font-bold whitespace-nowrap tabular-nums">
                          {formatCurrency(totalFilteredBalance)}
                        </td>
                      );
                    }
                    return (
                      <td key={colId} className="py-2 px-2 text-slate-500 text-[10px]">
                        —
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
