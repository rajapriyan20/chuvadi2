import React, { useState, useMemo } from 'react';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  Filter, 
  ChevronRight, 
  Calendar, 
  Layers, 
  Wallet, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Account, AccountType } from '../../types';
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

type SortField = 'name' | 'category' | 'type' | 'reconciledDate' | 'balance';
type SortOrder = 'asc' | 'desc';

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
      return <ArrowUpDown size={12} className="text-slate-500 opacity-60" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp size={12} className="text-amber-400" />
    ) : (
      <ArrowDown size={12} className="text-amber-400" />
    );
  };

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

        <div className="flex items-center justify-between sm:justify-end gap-2 text-[11px] text-slate-400 px-1">
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
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-slate-800/80 bg-[#0e141c] text-[11px] font-semibold text-slate-400 uppercase tracking-wider select-none">
                <th 
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Account Name</span>
                    {renderSortIcon('name')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('category')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Category</span>
                    {renderSortIcon('category')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('type')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Nature</span>
                    {renderSortIcon('type')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('reconciledDate')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition min-w-[115px]"
                >
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <span>Date of Reco</span>
                    {renderSortIcon('reconciledDate')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('balance')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Current Balance</span>
                    {renderSortIcon('balance')}
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/40 text-xs">
              {sortedAccounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                    <p>No accounts found matching your filter criteria.</p>
                    <button
                      type="button"
                      onClick={onOpenNewAccount}
                      className="mt-3 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold transition"
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
                      {/* Column 1: Account Name (Clicking opens Account Details Popup) */}
                      <td 
                        onClick={() => onOpenAccount(acc)}
                        className="py-2.5 px-4"
                        title="Click to view account details, reco date, passbook, edit, or delete"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <BankLogo
                            iconId={acc.icon}
                            name={acc.name}
                            institution={acc.institution}
                            size={22}
                          />
                          <div className="min-w-0">
                            <span className="font-semibold text-white group-hover:text-amber-300 transition truncate block">
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

                      {/* Column 2: Category Badge (Clicking opens Category Details Popup) */}
                      <td className="py-2.5 px-3">
                        {cat ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenCategory(cat);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#0a0e14] hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 transition text-[11px] font-medium max-w-[180px] truncate"
                            title="Click to view category details, icon, or edit"
                          >
                            <span 
                              className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                            >
                              <CatIcon size={10} />
                            </span>
                            <span className="truncate">{catTitle}</span>
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Column 3: Account Nature */}
                      <td className="py-2.5 px-3" onClick={() => onOpenAccount(acc)}>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          isLiability
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                        }`}>
                          {isLiability ? 'Liability' : 'Asset'}
                        </span>
                      </td>

                      {/* Column 4: Date of Reco */}
                      <td className="py-2.5 px-3" onClick={() => onOpenAccount(acc)}>
                        {acc.reconciledDate ? (
                          <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
                            <Calendar size={12} className="text-slate-500" />
                            <span>{formatDate(acc.reconciledDate)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px] italic">Not set</span>
                        )}
                      </td>

                      {/* Column 5: Balance */}
                      <td 
                        onClick={() => onOpenAccount(acc)}
                        className="py-2.5 px-4 text-right"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <span className={`font-mono font-bold text-xs sm:text-sm ${
                            isLiability ? 'text-amber-300' : 'text-amber-100'
                          }`}>
                            {formatCurrency(acc.balance)}
                          </span>
                          <ChevronRight size={13} className="text-slate-600 group-hover:text-slate-400 transition shrink-0" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer Summary Row */}
            {sortedAccounts.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-700 bg-[#0e141c] text-xs font-bold text-white">
                  <td colSpan={3} className="py-3 px-4">
                    <span className="text-slate-400 uppercase text-[10px] tracking-wider">Total ({sortedAccounts.length} Accounts):</span>
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                    Net Sum
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-sm text-amber-200 font-bold">
                    {formatCurrency(totalFilteredBalance)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
