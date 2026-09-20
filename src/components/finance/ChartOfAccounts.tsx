import React, { useState, useMemo } from 'react';
import { 
  Folder, 
  FolderOpen, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Minus,
  Filter,
  Edit3, 
  Check, 
  X, 
  BookOpen, 
  Landmark, 
  Wallet, 
  CreditCard, 
  PiggyBank, 
  HandCoins, 
  Layers,
  Search,
  CheckCircle2,
  Trash2,
  FolderPlus,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Sparkles,
  Building2,
  Briefcase,
  TrendingUp,
  Coins,
  Receipt,
  Tag,
  ShieldCheck,
  CircleDollarSign,
  Table,
  GitFork
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Account, AccountType, Transaction } from '../../types';
import { BankLogo, BankLogoPicker, resolveBankLogoId } from '../common/BankLogo';
import { CoaTableView } from './CoaTableView';
import { CoaDiagramView } from './CoaDiagramView';

interface ChartOfAccountsProps {
  accounts: Account[];
  transactions?: Transaction[];
  onOpenNewAccount: (defaultType?: AccountType) => void;
  onEditAccount: (account: Account) => void;
  onSaveAccount: (account: Account) => Promise<void>;
  onDeleteAccount?: (id: string) => Promise<void>;
  onOpenPassbook: (account: Account) => void;
  onSelectTxn?: (txn: Transaction) => void;
}

export interface CategoryDefinition {
  id?: string;
  type: AccountType;
  title: string;
  description: string;
  icon?: React.ElementType;
  iconName?: string;
  color: string;
  isCustom?: boolean;
  parentId?: string; // ID/key of parent category; undefined or 'MAIN' means top-level Main Category
}

export const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  Landmark,
  Wallet,
  CreditCard,
  PiggyBank,
  HandCoins,
  Layers,
  Building2,
  Briefcase,
  TrendingUp,
  Coins,
  Receipt,
  Tag,
  Folder,
  ShieldCheck,
  CircleDollarSign
};

export const AVAILABLE_CATEGORY_ICONS = [
  { id: 'Landmark', label: 'Bank', icon: Landmark },
  { id: 'Wallet', label: 'Wallet', icon: Wallet },
  { id: 'CreditCard', label: 'Card', icon: CreditCard },
  { id: 'PiggyBank', label: 'Piggy Bank', icon: PiggyBank },
  { id: 'HandCoins', label: 'Coins', icon: HandCoins },
  { id: 'Layers', label: 'Layers', icon: Layers },
  { id: 'Building2', label: 'Building', icon: Building2 },
  { id: 'Briefcase', label: 'Business', icon: Briefcase },
  { id: 'TrendingUp', label: 'Invest', icon: TrendingUp },
  { id: 'Coins', label: 'Gold', icon: Coins },
  { id: 'Receipt', label: 'Receipt', icon: Receipt },
  { id: 'Tag', label: 'Tag', icon: Tag },
  { id: 'Folder', label: 'Folder', icon: Folder },
  { id: 'ShieldCheck', label: 'Safety', icon: ShieldCheck },
  { id: 'CircleDollarSign', label: 'Dollar', icon: CircleDollarSign }
];

const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  {
    type: 'BANK',
    title: 'Bank Accounts',
    description: 'Savings, Salary, and Checking bank accounts',
    icon: Landmark,
    iconName: 'Landmark',
    color: '#0284c7'
  },
  {
    type: 'CASH',
    title: 'Cash & Wallets',
    description: 'Physical cash in hand, petty cash, and mobile wallets',
    icon: Wallet,
    iconName: 'Wallet',
    color: '#10b981'
  },
  {
    type: 'CREDIT_CARD',
    title: 'Credit Cards',
    description: 'Credit cards and revolving credit lines (Liabilities)',
    icon: CreditCard,
    iconName: 'CreditCard',
    color: '#f43f5e'
  },
  {
    type: 'INVESTMENT',
    title: 'Investments & Wealth',
    description: 'Mutual funds, Stocks, Fixed Deposits, PF & Gold',
    icon: PiggyBank,
    iconName: 'PiggyBank',
    color: '#8b5cf6'
  },
  {
    type: 'LOAN',
    title: 'Loans & Borrowings',
    description: 'Personal loans, Home loans, Vehicle finance',
    icon: HandCoins,
    iconName: 'HandCoins',
    color: '#ea580c'
  },
  {
    type: 'OTHER',
    title: 'Other Accounts',
    description: 'Miscellaneous assets, reserves, and general ledgers',
    icon: Layers,
    iconName: 'Layers',
    color: '#64748b'
  }
];

const getCategoryIcon = (type: AccountType): React.ElementType => {
  switch (type) {
    case 'BANK': return Landmark;
    case 'CASH': return Wallet;
    case 'CREDIT_CARD': return CreditCard;
    case 'INVESTMENT': return PiggyBank;
    case 'LOAN': return HandCoins;
    default: return Layers;
  }
};

const getDefaultIconNameForType = (type: AccountType): string => {
  switch (type) {
    case 'BANK': return 'Landmark';
    case 'CASH': return 'Wallet';
    case 'CREDIT_CARD': return 'CreditCard';
    case 'INVESTMENT': return 'PiggyBank';
    case 'LOAN': return 'HandCoins';
    default: return 'Layers';
  }
};

export const resolveCategoryIcon = (cat: CategoryDefinition): React.ElementType => {
  if (cat.iconName && CATEGORY_ICON_MAP[cat.iconName]) {
    return CATEGORY_ICON_MAP[cat.iconName];
  }
  return getCategoryIcon(cat.type);
};

export const ChartOfAccounts: React.FC<ChartOfAccountsProps> = ({
  accounts,
  transactions = [],
  onOpenNewAccount,
  onEditAccount,
  onSaveAccount,
  onDeleteAccount,
  onOpenPassbook,
  onSelectTxn
}) => {
  // Category List state (combines default categories and user-created custom categories)
  const [categoriesList, setCategoriesList] = useState<CategoryDefinition[]>(() => {
    try {
      const saved = localStorage.getItem('chuvadi_custom_categories_list');
      if (saved) {
        const parsed: CategoryDefinition[] = JSON.parse(saved);
        return parsed.map(c => ({
          ...c,
          icon: (c.iconName && CATEGORY_ICON_MAP[c.iconName]) || getCategoryIcon(c.type)
        }));
      }
    } catch {}
    return DEFAULT_CATEGORIES;
  });

  // Custom Category Heading Names (persisted in localStorage)
  const [customCategoryNames, setCustomCategoryNames] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('chuvadi_custom_category_names');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  // Collapsed state for each category & subcategory
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Active View State: 'CATEGORISED' | 'TABLE' | 'DIAGRAM'
  const [activeView, setActiveView] = useState<'CATEGORISED' | 'TABLE' | 'DIAGRAM'>(() => {
    try {
      const saved = localStorage.getItem('chuvadi_coa_active_view');
      if (saved === 'CATEGORISED' || saved === 'TABLE' || saved === 'DIAGRAM') {
        return saved;
      }
    } catch {}
    return 'CATEGORISED';
  });

  const handleViewChange = (view: 'CATEGORISED' | 'TABLE' | 'DIAGRAM') => {
    setActiveView(view);
    try {
      localStorage.setItem('chuvadi_coa_active_view', view);
    } catch {}
  };

  // Top "+ New" Dropdown Menu state
  const [isNewMenuOpen, setIsNewMenuOpen] = useState<boolean>(false);

  // "Add Category" Modal state
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatParentId, setNewCatParentId] = useState<string>('MAIN');
  const [newCatType, setNewCatType] = useState<AccountType>('BANK');
  const [newCatIconName, setNewCatIconName] = useState<string>('Landmark');
  const [newCatDesc, setNewCatDesc] = useState<string>('');
  const [newCatColor, setNewCatColor] = useState<string>('#0284c7');

  // Account Pop-up State (Triggered by clicking on an account)
  const [selectedAccountForPopup, setSelectedAccountForPopup] = useState<Account | null>(null);
  const [isEditingAccountInPopup, setIsEditingAccountInPopup] = useState<boolean>(false);
  const [popupAccountName, setPopupAccountName] = useState<string>('');
  const [popupAccountType, setPopupAccountType] = useState<AccountType>('BANK');
  const [popupAccountCategoryId, setPopupAccountCategoryId] = useState<string>('BANK');
  const [popupAccountIcon, setPopupAccountIcon] = useState<string>('none');
  const [popupTxnSearch, setPopupTxnSearch] = useState<string>('');
  const [isSavingAccountPopup, setIsSavingAccountPopup] = useState<boolean>(false);
  const [isDeletingAccountPopup, setIsDeletingAccountPopup] = useState<boolean>(false);

  // Category Heading Pop-up State (Triggered by clicking on category heading)
  const [selectedCategoryForPopup, setSelectedCategoryForPopup] = useState<CategoryDefinition | null>(null);
  const [isEditingCategoryInPopup, setIsEditingCategoryInPopup] = useState<boolean>(false);
  const [popupCategoryName, setPopupCategoryName] = useState<string>('');
  const [popupCategoryParentId, setPopupCategoryParentId] = useState<string>('MAIN');
  const [popupCategoryType, setPopupCategoryType] = useState<AccountType>('BANK');
  const [popupCategoryIconName, setPopupCategoryIconName] = useState<string>('Landmark');
  const [popupCategoryColor, setPopupCategoryColor] = useState<string>('#0284c7');
  const [isSavingCategoryPopup, setIsSavingCategoryPopup] = useState<boolean>(false);
  const [isDeletingCategoryPopup, setIsDeletingCategoryPopup] = useState<boolean>(false);

  // Separate top-level / main categories from sub-categories
  const { mainCategories, subCategoriesByParent, allCategoryKeys } = useMemo(() => {
    const allKeys = new Set(categoriesList.map(c => c.id || c.type));
    const main: CategoryDefinition[] = [];
    const subMap = new Map<string, CategoryDefinition[]>();

    for (const cat of categoriesList) {
      const parent = cat.parentId;
      if (parent && parent !== 'MAIN' && allKeys.has(parent)) {
        if (!subMap.has(parent)) {
          subMap.set(parent, []);
        }
        subMap.get(parent)?.push(cat);
      } else {
        main.push(cat);
      }
    }
    return { mainCategories: main, subCategoriesByParent: subMap, allCategoryKeys: allKeys };
  }, [categoriesList]);

  // Group accounts by category key (supports explicit categoryId or falls back to acc.type)
  const groupedAccounts = useMemo(() => {
    const map = new Map<string, Account[]>();
    for (const cat of categoriesList) {
      const key = cat.id || cat.type;
      map.set(key, []);
    }

    for (const acc of accounts) {
      let matchedKey: string | undefined = acc.categoryId;
      if (!matchedKey || !map.has(matchedKey)) {
        // Fallback: match to a main category with matching type, or any category with matching type
        const matchingCat = categoriesList.find(c => (!c.parentId || c.parentId === 'MAIN') && c.type === acc.type)
          || categoriesList.find(c => c.type === acc.type);
        matchedKey = matchingCat ? (matchingCat.id || matchingCat.type) : (acc.type || 'OTHER');
      }

      if (!map.has(matchedKey)) {
        map.set(matchedKey, []);
      }
      map.get(matchedKey)?.push(acc);
    }
    return map;
  }, [accounts, categoriesList]);

  // Overall totals
  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  }, [accounts]);

  // Toggle category collapse
  const toggleCategory = (key: string) => {
    setCollapsedCategories(prev => {
      const current = prev[key] ?? true;
      return {
        ...prev,
        [key]: !current
      };
    });
  };

  const collapseAll = () => {
    const all: Record<string, boolean> = {};
    for (const cat of categoriesList) {
      const key = cat.id || cat.type;
      all[key] = true;
    }
    setCollapsedCategories(all);
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    for (const cat of categoriesList) {
      const key = cat.id || cat.type;
      all[key] = false;
    }
    setCollapsedCategories(all);
  };

  // Helper to get category title (custom or default)
  const getCategoryTitle = (cat: CategoryDefinition) => {
    const key = cat.id || cat.type;
    return customCategoryNames[key] || cat.title;
  };

  const getCategoryDefinitionByType = (type: AccountType): CategoryDefinition => {
    return categoriesList.find(c => c.type === type) || categoriesList[0] || DEFAULT_CATEGORIES[0];
  };

  // Reusable Category Icon Picker Component
  const renderCategoryIconPicker = (
    selectedIcon: string, 
    onSelect: (id: string) => void
  ) => {
    return (
      <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 p-2 bg-[#0a0e14] rounded-xl border border-slate-800 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
        {AVAILABLE_CATEGORY_ICONS.map((item) => {
          const IconComp = item.icon;
          const isSelected = selectedIcon === item.id;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => onSelect(item.id)}
              title={item.label}
              className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 transition ${
                isSelected
                  ? 'bg-amber-500/20 border-2 border-amber-500 text-amber-300 scale-105 shadow-md'
                  : 'bg-[#121820] border border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <IconComp size={18} />
              <span className="text-[9px] truncate max-w-full font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  // -------------------------------------------------------------
  // Account Pop-up Handlers & Transactions Calculations
  // -------------------------------------------------------------
  const handleOpenAccountPopup = (acc: Account) => {
    setSelectedAccountForPopup(acc);
    setPopupAccountName(acc.name);
    setPopupAccountType(acc.type || 'BANK');
    const matchedCat = categoriesList.find(c => (c.id || c.type) === acc.categoryId)
      || categoriesList.find(c => (!c.parentId || c.parentId === 'MAIN') && c.type === acc.type)
      || categoriesList[0];
    setPopupAccountCategoryId(acc.categoryId || (matchedCat ? (matchedCat.id || matchedCat.type) : 'BANK'));
    setPopupAccountIcon(acc.icon || resolveBankLogoId(acc.icon, acc.name, acc.institution));
    setIsEditingAccountInPopup(false);
    setPopupTxnSearch('');
  };

  const handleCloseAccountPopup = () => {
    setSelectedAccountForPopup(null);
    setIsEditingAccountInPopup(false);
    setPopupTxnSearch('');
  };

  // Transactions involving the currently selected account for the popup
  const selectedAccountTxns = useMemo(() => {
    if (!selectedAccountForPopup) return [];
    const accId = selectedAccountForPopup.id;
    return (transactions || [])
      .filter((t) => t.fromAccountId === accId || t.toAccountId === accId)
      .sort((a, b) => {
        const timeA = a.timestamp || (a.date ? new Date(a.date).getTime() : 0);
        const timeB = b.timestamp || (b.date ? new Date(b.date).getTime() : 0);
        return timeB - timeA;
      });
  }, [selectedAccountForPopup, transactions]);

  // Check if at least one transaction entry exists
  const hasTransactions = selectedAccountTxns.length > 0;

  // Filtered popup transactions for embedded passbook search
  const filteredPopupTxns = useMemo(() => {
    if (!popupTxnSearch.trim()) return selectedAccountTxns;
    const query = popupTxnSearch.toLowerCase();
    return selectedAccountTxns.filter((t) => 
      t.description?.toLowerCase().includes(query) ||
      t.category?.toLowerCase().includes(query) ||
      t.date?.includes(query) ||
      String(t.amount).includes(query)
    );
  }, [selectedAccountTxns, popupTxnSearch]);

  const handleUpdateRecoDate = async (newDate: string) => {
    if (!selectedAccountForPopup) return;
    const updated: Account = {
      ...selectedAccountForPopup,
      reconciledDate: newDate,
      updatedAt: Date.now()
    };
    setSelectedAccountForPopup(updated);
    try {
      await onSaveAccount(updated);
    } catch (err) {
      console.error('Failed to update Date of reco:', err);
    }
  };

  const handleSaveAccountPopup = async () => {
    if (!selectedAccountForPopup || !popupAccountName.trim()) return;
    setIsSavingAccountPopup(true);
    try {
      const chosenCat = categoriesList.find(c => (c.id || c.type) === popupAccountCategoryId);
      const chosenType = chosenCat ? chosenCat.type : popupAccountType;

      await onSaveAccount({
        ...selectedAccountForPopup,
        name: popupAccountName.trim(),
        type: chosenType,
        categoryId: popupAccountCategoryId,
        icon: popupAccountIcon
      });
      setSelectedAccountForPopup(prev => prev ? {
        ...prev,
        name: popupAccountName.trim(),
        type: chosenType,
        categoryId: popupAccountCategoryId,
        icon: popupAccountIcon
      } : null);
      setIsEditingAccountInPopup(false);
    } catch (err) {
      console.error('Failed to update account:', err);
    } finally {
      setIsSavingAccountPopup(false);
    }
  };

  const handleDeleteAccountFromPopup = async () => {
    if (!selectedAccountForPopup || !onDeleteAccount) return;
    if (hasTransactions) {
      alert(`Cannot delete account: ${selectedAccountTxns.length} transaction entries exist in this account.`);
      return;
    }
    if (!window.confirm(`Delete account "${selectedAccountForPopup.name}"?`)) {
      return;
    }
    setIsDeletingAccountPopup(true);
    try {
      await onDeleteAccount(selectedAccountForPopup.id);
      handleCloseAccountPopup();
    } catch (err) {
      console.error('Failed to delete account:', err);
    } finally {
      setIsDeletingAccountPopup(false);
    }
  };

  // -------------------------------------------------------------
  // Category Heading Pop-up Handlers & Deletion
  // -------------------------------------------------------------
  const handleOpenCategoryPopup = (cat: CategoryDefinition) => {
    setSelectedCategoryForPopup(cat);
    setPopupCategoryName(getCategoryTitle(cat));
    setPopupCategoryParentId(cat.parentId || 'MAIN');
    setPopupCategoryType(cat.type);
    setPopupCategoryIconName(cat.iconName || getDefaultIconNameForType(cat.type));
    setPopupCategoryColor(cat.color || '#0284c7');
    setIsEditingCategoryInPopup(false);
  };

  const handleCloseCategoryPopup = () => {
    setSelectedCategoryForPopup(null);
    setIsEditingCategoryInPopup(false);
  };

  // Count accounts tagged to selected category (direct + under any subcategories)
  const popupCategoryAccountsCount = useMemo(() => {
    if (!selectedCategoryForPopup) return 0;
    const catKey = selectedCategoryForPopup.id || selectedCategoryForPopup.type;
    const directCount = (groupedAccounts.get(catKey) || []).length;
    const subCats = categoriesList.filter(c => c.parentId === catKey);
    const subCount = subCats.reduce((acc, sc) => acc + (groupedAccounts.get(sc.id || sc.type) || []).length, 0);
    return directCount + subCount;
  }, [selectedCategoryForPopup, groupedAccounts, categoriesList]);

  const hasCategoryAccounts = popupCategoryAccountsCount > 0;

  const handleSaveCategoryPopup = async () => {
    if (!selectedCategoryForPopup || !popupCategoryName.trim()) return;
    setIsSavingCategoryPopup(true);
    try {
      const origKey = selectedCategoryForPopup.id || selectedCategoryForPopup.type;
      const targetType = popupCategoryType;
      const finalParentId = popupCategoryParentId === 'MAIN' ? undefined : popupCategoryParentId;

      // 1. Update custom name in dictionary & localStorage
      const updatedNames = {
        ...customCategoryNames,
        [origKey]: popupCategoryName.trim()
      };
      setCustomCategoryNames(updatedNames);
      try {
        localStorage.setItem('chuvadi_custom_category_names', JSON.stringify(updatedNames));
      } catch (e) {
        console.warn('Failed to save to localStorage:', e);
      }

      // 2. Update category in categoriesList
      const updatedList = categoriesList.map(c => {
        if ((c.id || c.type) === origKey) {
          return {
            ...c,
            title: popupCategoryName.trim(),
            type: targetType,
            parentId: finalParentId,
            iconName: popupCategoryIconName,
            color: popupCategoryColor,
            icon: CATEGORY_ICON_MAP[popupCategoryIconName] || getCategoryIcon(targetType)
          };
        }
        return c;
      });
      setCategoriesList(updatedList);

      try {
        localStorage.setItem('chuvadi_custom_categories_list', JSON.stringify(updatedList.map(c => ({
          id: c.id,
          type: c.type,
          title: c.title,
          description: c.description,
          color: c.color,
          iconName: c.iconName,
          isCustom: c.isCustom,
          parentId: c.parentId
        }))));
      } catch (err) {
        console.warn('Failed to persist categories list:', err);
      }

      // 3. If category classification type changed, migrate tagged accounts
      if (selectedCategoryForPopup.type !== targetType) {
        const accountsToMove = groupedAccounts.get(origKey) || [];
        for (const a of accountsToMove) {
          await onSaveAccount({
            ...a,
            type: targetType
          });
        }
      }

      setIsEditingCategoryInPopup(false);
      setSelectedCategoryForPopup(prev => prev ? {
        ...prev,
        title: popupCategoryName.trim(),
        type: targetType,
        parentId: finalParentId,
        iconName: popupCategoryIconName,
        color: popupCategoryColor,
        icon: CATEGORY_ICON_MAP[popupCategoryIconName] || getCategoryIcon(targetType)
      } : null);
    } catch (err) {
      console.error('Failed to save category heading:', err);
    } finally {
      setIsSavingCategoryPopup(false);
    }
  };

  const handleDeleteCategoryFromPopup = () => {
    if (!selectedCategoryForPopup || hasCategoryAccounts) return;
    const catKey = selectedCategoryForPopup.id || selectedCategoryForPopup.type;
    const catName = getCategoryTitle(selectedCategoryForPopup);
    if (!window.confirm(`Delete category "${catName}"?`)) {
      return;
    }
    setIsDeletingCategoryPopup(true);
    try {
      const updatedList = categoriesList.filter(c => (c.id || c.type) !== catKey);
      setCategoriesList(updatedList);
      try {
        localStorage.setItem('chuvadi_custom_categories_list', JSON.stringify(updatedList.map(c => ({
          id: c.id,
          type: c.type,
          title: c.title,
          description: c.description,
          color: c.color,
          iconName: c.iconName,
          isCustom: c.isCustom,
          parentId: c.parentId
        }))));
      } catch (err) {
        console.warn('Failed to persist categories list:', err);
      }

      setCustomCategoryNames(prev => {
        const next = { ...prev };
        delete next[catKey];
        try {
          localStorage.setItem('chuvadi_custom_category_names', JSON.stringify(next));
        } catch {}
        return next;
      });

      setSelectedCategoryForPopup(null);
      setIsEditingCategoryInPopup(false);
    } finally {
      setIsDeletingCategoryPopup(false);
    }
  };

  // -------------------------------------------------------------
  // Add Category Modal Handler
  // -------------------------------------------------------------
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    let finalType = newCatType;
    let finalParentId: string | undefined = undefined;
    if (newCatParentId !== 'MAIN') {
      finalParentId = newCatParentId;
      const parent = categoriesList.find(c => (c.id || c.type) === newCatParentId);
      if (parent) {
        finalType = parent.type;
      }
    }

    const newCategory: CategoryDefinition = {
      id: `custom_${Date.now()}`,
      type: finalType,
      title: newCatName.trim(),
      description: newCatDesc.trim() || `Category under ${finalParentId ? 'parent' : finalType}`,
      icon: CATEGORY_ICON_MAP[newCatIconName] || getCategoryIcon(finalType),
      iconName: newCatIconName,
      color: newCatColor,
      isCustom: true,
      parentId: finalParentId
    };

    const updated = [...categoriesList, newCategory];
    setCategoriesList(updated);

    try {
      localStorage.setItem('chuvadi_custom_categories_list', JSON.stringify(updated.map(c => ({
        id: c.id,
        type: c.type,
        title: c.title,
        description: c.description,
        color: c.color,
        iconName: c.iconName,
        isCustom: c.isCustom,
        parentId: c.parentId
      }))));
    } catch (err) {
      console.warn('Failed to persist categories list:', err);
    }

    setNewCatName('');
    setNewCatDesc('');
    setNewCatParentId('MAIN');
    setNewCatIconName('Landmark');
    setIsAddCategoryModalOpen(false);
  };

  const showFilterInput = isFilterOpen || !!searchTerm;

  return (
    <div className="space-y-2 sm:space-y-2.5">
      {/* COA Top Header & Summary */}
      <div className="p-2.5 sm:p-3 bg-gradient-to-r from-[#121820] to-[#161f2b] rounded-2xl border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Layers className="text-amber-400 shrink-0" size={18} />
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">Chart of Accounts</h2>
          </div>

          {/* + New Button with Dropdown (in the same line as Chart of Accounts header) */}
          <div className="relative shrink-0">
            <button
              id="coa-new-menu-btn"
              onClick={() => setIsNewMenuOpen(prev => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition active:scale-95"
              aria-haspopup="true"
              aria-expanded={isNewMenuOpen}
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>New</span>
              <ChevronDown 
                size={13} 
                className={`transition-transform duration-200 ${isNewMenuOpen ? 'rotate-180' : ''}`} 
              />
            </button>

            {/* Dropdown Options */}
            {isNewMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-20"
                  onClick={() => setIsNewMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-52 bg-[#161d26] border border-slate-700/90 rounded-2xl shadow-2xl z-30 py-1.5 overflow-hidden animate-fadeIn backdrop-blur-md">
                  <button
                    id="coa-add-account-option"
                    onClick={() => {
                      setIsNewMenuOpen(false);
                      onOpenNewAccount();
                    }}
                    className="w-full px-3.5 py-2.5 flex items-center gap-3 text-xs text-slate-200 hover:text-amber-300 hover:bg-slate-800/90 transition text-left"
                  >
                    <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 shrink-0">
                      <Wallet size={15} />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-100">Add Account</div>
                      <div className="text-[10px] text-slate-400">Bank, card, cash or asset</div>
                    </div>
                  </button>

                  <div className="h-[1px] bg-slate-800 my-1 mx-2" />

                  <button
                    id="coa-add-category-option"
                    onClick={() => {
                      setIsNewMenuOpen(false);
                      setIsAddCategoryModalOpen(true);
                    }}
                    className="w-full px-3.5 py-2.5 flex items-center gap-3 text-xs text-slate-200 hover:text-amber-300 hover:bg-slate-800/90 transition text-left"
                  >
                    <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400 shrink-0">
                      <FolderPlus size={15} />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-100">Add Category</div>
                      <div className="text-[10px] text-slate-400">New ledger grouping</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Global Stats Bar */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-2 pt-2 border-t border-slate-800/80">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Accounts</div>
            <div className="text-base sm:text-lg font-bold text-white font-mono mt-0.5">
              {accounts.length} <span className="text-xs font-normal text-slate-400">active</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-amber-400">Cumulative Net Worth</div>
            <div className="text-base sm:text-lg font-bold text-amber-200 font-mono mt-0.5">
              {formatCurrency(totalBalance)}
            </div>
          </div>
        </div>
      </div>

      {/* 3 Views Selector Bar: Categorised View | Table View | Diagram View */}
      <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
        <div className="inline-flex p-1 bg-[#121820] rounded-2xl border border-slate-800 shadow-sm">
          <button
            type="button"
            id="coa-view-categorised-btn"
            onClick={() => handleViewChange('CATEGORISED')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeView === 'CATEGORISED'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers size={13} />
            <span>Categorised view</span>
          </button>
          <button
            type="button"
            id="coa-view-table-btn"
            onClick={() => handleViewChange('TABLE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeView === 'TABLE'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Table size={13} />
            <span>Table view</span>
          </button>
          <button
            type="button"
            id="coa-view-diagram-btn"
            onClick={() => handleViewChange('DIAGRAM')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeView === 'DIAGRAM'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <GitFork size={13} className="rotate-180" />
            <span>Diagram view</span>
          </button>
        </div>
      </div>

      {/* 1. Categorised View */}
      {activeView === 'CATEGORISED' && (
        <>
          {/* Control Row: Three Buttons (Filter, Expand All, Collapse All) or Active Filter Input */}
          {!showFilterInput ? (
        <div className="flex items-center gap-2">
          {/* Filter Button */}
          <button
            id="coa-filter-btn"
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121820] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition active:scale-95 shadow-sm"
          >
            <Filter size={13} className="text-amber-400" />
            <span>Filter</span>
          </button>

          {/* Expand All Button */}
          <button
            id="coa-expand-all-btn"
            type="button"
            onClick={expandAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121820] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition active:scale-95 shadow-sm"
          >
            <Plus size={13} className="text-slate-400" />
            <span>Expand All</span>
          </button>

          {/* Collapse All Button */}
          <button
            id="coa-collapse-all-btn"
            type="button"
            onClick={collapseAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121820] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition active:scale-95 shadow-sm"
          >
            <Minus size={13} className="text-slate-400" />
            <span>Collapse All</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 sm:gap-2 animate-fadeIn">
          {/* Filter Input Box */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter accounts by name, category, or institution..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              className="w-full bg-[#121820] border border-amber-500/80 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 shadow-inner"
            />
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setIsFilterOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close filter"
              aria-label="Close filter"
            >
              <X size={14} />
            </button>
          </div>

          {/* Expand All (+ sign alone) */}
          <button
            id="coa-expand-all-icon-btn"
            type="button"
            onClick={expandAll}
            className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-[#121820] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition active:scale-95 shadow-sm shrink-0 flex items-center justify-center"
            title="Expand All Categories"
            aria-label="Expand All"
          >
            <Plus size={15} strokeWidth={2.5} className="text-amber-400" />
          </button>

          {/* Collapse All (- sign alone) */}
          <button
            id="coa-collapse-all-icon-btn"
            type="button"
            onClick={collapseAll}
            className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-[#121820] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition active:scale-95 shadow-sm shrink-0 flex items-center justify-center"
            title="Collapse All Categories"
            aria-label="Collapse All"
          >
            <Minus size={15} strokeWidth={2.5} className="text-amber-400" />
          </button>
        </div>
      )}

      {/* Categories Tree (Main Categories & Nested Subcategories) */}
      <div className="space-y-3">
        {mainCategories.map((mainCat) => {
          const mainKey = mainCat.id || mainCat.type;
          const directAccounts = groupedAccounts.get(mainKey) || [];
          const subCats = subCategoriesByParent.get(mainKey) || [];
          const mainHeadingTitle = getCategoryTitle(mainCat);
          const MainIcon = resolveCategoryIcon(mainCat);

          // All accounts under this main category (direct + all subcategories)
          const allAccountsInMain = [...directAccounts];
          subCats.forEach(sc => {
            const scKey = sc.id || sc.type;
            allAccountsInMain.push(...(groupedAccounts.get(scKey) || []));
          });

          // Filter logic for search
          const filterAcc = (a: Account) => {
            if (!searchTerm) return true;
            const s = searchTerm.toLowerCase();
            return (
              a.name.toLowerCase().includes(s) ||
              (a.institution && a.institution.toLowerCase().includes(s)) ||
              (a.accountNumber && a.accountNumber.includes(s))
            );
          };

          const matchedDirectAccounts = directAccounts.filter(filterAcc);
          const matchedSubCats = subCats.map(sc => {
            const scKey = sc.id || sc.type;
            const scAccounts = groupedAccounts.get(scKey) || [];
            const filteredScAccs = scAccounts.filter(filterAcc);
            const scTitleMatches = searchTerm && getCategoryTitle(sc).toLowerCase().includes(searchTerm.toLowerCase());
            return {
              subCat: sc,
              accounts: searchTerm && !scTitleMatches ? filteredScAccs : (searchTerm ? scAccounts : scAccounts),
              hasMatch: !searchTerm || scTitleMatches || filteredScAccs.length > 0
            };
          }).filter(item => item.hasMatch);

          const mainTitleMatches = searchTerm && (
            mainHeadingTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mainCat.title.toLowerCase().includes(searchTerm.toLowerCase())
          );

          // If searching, skip if nothing matches
          if (searchTerm && !mainTitleMatches && matchedDirectAccounts.length === 0 && matchedSubCats.length === 0) {
            return null;
          }

          const isCollapsed = !searchTerm && (collapsedCategories[mainKey] ?? true);
          const mainTotal = allAccountsInMain.reduce((sum, a) => sum + (a.balance || 0), 0);

          return (
            <div
              key={mainKey}
              className="bg-[#131922] rounded-2xl sm:rounded-3xl border border-slate-800/90 overflow-hidden shadow-sm transition-all"
            >
              {/* Main Category Header Row */}
              <div
                onClick={() => toggleCategory(mainKey)}
                className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-[#18212c] cursor-pointer transition select-none"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    className="text-slate-400 hover:text-white transition p-0.5"
                    title={isCollapsed ? 'Expand' : 'Collapse'}
                  >
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                  </button>

                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${mainCat.color}20`, color: mainCat.color }}
                  >
                    <MainIcon size={16} />
                  </div>

                  {/* Main Category Heading (Clicking opens Category Details Popup; NO edit icon on hover) */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCategoryPopup(mainCat);
                    }}
                    className="min-w-0 group/head cursor-pointer"
                    title="Click category heading to view or edit details"
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-white group-hover/head:text-amber-300 transition truncate">
                        {mainHeadingTitle}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                        {allAccountsInMain.length}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 hidden sm:block truncate">
                      {mainCat.description}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-xs sm:text-sm font-bold text-amber-200 font-mono">
                      {formatCurrency(mainTotal)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contents under Main Category (Direct Accounts & Nested Subcategories) */}
              {!isCollapsed && (
                <div className="border-t border-slate-800/70 bg-[#0e131a]/60">
                  {/* 1. Direct Accounts under Main Category */}
                  {matchedDirectAccounts.length > 0 && (
                    <div className="divide-y divide-slate-800/40">
                      {matchedDirectAccounts.map((acc) => (
                        <div
                          key={acc.id}
                          onClick={() => handleOpenAccountPopup(acc)}
                          className="p-3 sm:px-4 sm:py-3 flex items-center justify-between gap-3 hover:bg-[#141b24] transition cursor-pointer group select-none"
                          title="Click account to view details, passbook, edit, or delete"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <BankLogo
                              iconId={acc.icon}
                              name={acc.name}
                              institution={acc.institution}
                              size={22}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs sm:text-sm font-semibold text-white group-hover:text-amber-300 transition truncate">
                                  {acc.name}
                                </span>
                              </div>
                              {(acc.institution || acc.accountNumber) && (
                                <div className="text-[10px] text-slate-400 truncate">
                                  {acc.institution || ''}{acc.institution && acc.accountNumber ? ' • ' : ''}{acc.accountNumber ? `•••• ${acc.accountNumber}` : ''}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right min-w-[90px]">
                              <div className="text-xs sm:text-sm font-bold text-amber-100 font-mono">
                                {formatCurrency(acc.balance)}
                              </div>
                            </div>
                            <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 2. Subcategories under this Main Category */}
                  {matchedSubCats.length > 0 && (
                    <div className="border-t border-slate-800/60 divide-y divide-slate-800/50 bg-[#0a0f16]/80">
                      {matchedSubCats.map(({ subCat, accounts: subAccounts }) => {
                        const subKey = subCat.id || subCat.type;
                        const subTitle = getCategoryTitle(subCat);
                        const SubIcon = resolveCategoryIcon(subCat);
                        const isSubCollapsed = !searchTerm && (collapsedCategories[subKey] ?? true);
                        const subTotal = subAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);

                        return (
                          <div key={subKey} className="transition-all">
                            {/* Subcategory Header */}
                            <div
                              onClick={() => toggleCategory(subKey)}
                              className="px-3 py-2.5 sm:px-4 sm:py-2.5 flex items-center justify-between hover:bg-[#121922] cursor-pointer transition select-none bg-[#0d121b]"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <button
                                  type="button"
                                  className="text-slate-400 hover:text-white transition p-0.5"
                                  title={isSubCollapsed ? 'Expand subcategory' : 'Collapse subcategory'}
                                >
                                  {isSubCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                                </button>

                                <div 
                                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: `${subCat.color}25`, color: subCat.color }}
                                >
                                  <SubIcon size={13} />
                                </div>

                                {/* Subcategory Title (Clicking opens Category Details Popup; NO edit icon on hover) */}
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenCategoryPopup(subCat);
                                  }}
                                  className="min-w-0 group/subhead cursor-pointer flex items-center gap-1.5"
                                  title="Click to view or edit subcategory details"
                                >
                                  <h4 className="text-xs font-bold text-slate-200 group-hover/subhead:text-amber-300 transition truncate">
                                    {subTitle}
                                  </h4>
                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                                    {subAccounts.length}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <div className="text-right">
                                  <div className="text-xs font-bold text-amber-200/90 font-mono">
                                    {formatCurrency(subTotal)}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Subcategory Accounts: Shown further one level down */}
                            {!isSubCollapsed && (
                              <div className="pl-6 sm:pl-9 pr-2 sm:pr-4 py-1 border-t border-slate-800/40 bg-[#070b10] divide-y divide-slate-800/30">
                                {subAccounts.length === 0 ? (
                                  <div className="py-2.5 text-center text-slate-500 text-[11px] italic">
                                    No accounts tagged under this subcategory yet.
                                  </div>
                                ) : (
                                  subAccounts.map((acc) => (
                                    <div
                                      key={acc.id}
                                      onClick={() => handleOpenAccountPopup(acc)}
                                      className="py-2 px-2 sm:px-3 flex items-center justify-between gap-3 hover:bg-[#101722] rounded-xl transition cursor-pointer group select-none"
                                      title="Click account to view details, passbook, edit, or delete"
                                    >
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <BankLogo
                                          iconId={acc.icon}
                                          name={acc.name}
                                          institution={acc.institution}
                                          size={19}
                                        />
                                        <div className="min-w-0">
                                          <div className="text-xs font-semibold text-white group-hover:text-amber-300 transition truncate">
                                            {acc.name}
                                          </div>
                                          {(acc.institution || acc.accountNumber) && (
                                            <div className="text-[10px] text-slate-500 truncate">
                                              {acc.institution || ''}{acc.institution && acc.accountNumber ? ' • ' : ''}{acc.accountNumber ? `•••• ${acc.accountNumber}` : ''}
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0">
                                        <div className="text-right min-w-[80px]">
                                          <div className="text-xs font-bold text-amber-100/90 font-mono">
                                            {formatCurrency(acc.balance)}
                                          </div>
                                        </div>
                                        <ChevronRight size={13} className="text-slate-600 group-hover:text-slate-400 transition" />
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* If no accounts and no subcategories */}
                  {matchedDirectAccounts.length === 0 && matchedSubCats.length === 0 && (
                    <div className="p-4 text-center text-slate-500 text-xs italic">
                      No accounts in this category yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
        </>
      )}

      {/* 2. Table View */}
      {activeView === 'TABLE' && (
        <CoaTableView
          accounts={accounts}
          categoriesList={categoriesList}
          getCategoryTitle={getCategoryTitle}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onOpenAccount={handleOpenAccountPopup}
          onOpenCategory={handleOpenCategoryPopup}
          onOpenNewAccount={() => onOpenNewAccount()}
        />
      )}

      {/* 3. Diagram View */}
      {activeView === 'DIAGRAM' && (
        <CoaDiagramView
          accounts={accounts}
          categoriesList={categoriesList}
          mainCategories={mainCategories}
          subCategoriesByParent={subCategoriesByParent}
          groupedAccounts={groupedAccounts}
          totalBalance={totalBalance}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          getCategoryTitle={getCategoryTitle}
          onOpenAccount={handleOpenAccountPopup}
          onOpenCategory={handleOpenCategoryPopup}
        />
      )}

      {/* ============================================================= */}
      {/* 1. Account Details & Combined Passbook Preview Pop-up Modal   */}
      {/* ============================================================= */}
      {selectedAccountForPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121820] w-full max-w-lg rounded-2xl sm:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
            {/* Modal Header */}
            <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-800 flex items-center justify-between bg-[#161d26] shrink-0 gap-3">
              {isEditingAccountInPopup ? (
                <div className="text-amber-300 font-bold text-sm sm:text-base flex items-center gap-2">
                  <Edit3 size={16} />
                  <span>Edit Account</span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 min-w-0">
                  <BankLogo
                    iconId={selectedAccountForPopup.icon}
                    name={selectedAccountForPopup.name}
                    institution={selectedAccountForPopup.institution}
                    size={24}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                        {selectedAccountForPopup.name}
                      </h3>
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: selectedAccountForPopup.color || '#0284c7' }} 
                        title={selectedAccountForPopup.type}
                      />
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-amber-400/90">
                        {getCategoryTitle(getCategoryDefinitionByType(selectedAccountForPopup.type))}
                      </span>
                      {selectedAccountForPopup.institution && (
                        <>
                          <span>•</span>
                          <span className="truncate">{selectedAccountForPopup.institution}</span>
                        </>
                      )}
                      {selectedAccountForPopup.accountNumber && (
                        <>
                          <span>•</span>
                          <span className="font-mono">•••• {selectedAccountForPopup.accountNumber.slice(-4)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Header Action Icons: Edit alone, Delete alone, Close alone */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {!isEditingAccountInPopup && (
                  <>
                    {/* Edit icon alone */}
                    <button
                      type="button"
                      onClick={() => setIsEditingAccountInPopup(true)}
                      className="p-1.5 sm:p-2 rounded-xl text-amber-400 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition active:scale-95"
                      title="Edit Account Name, Category & Logo"
                      aria-label="Edit Account"
                    >
                      <Edit3 size={15} />
                    </button>

                    {/* Delete icon alone - disabled if at least one transaction exists */}
                    {onDeleteAccount && (
                      hasTransactions ? (
                        <button
                          type="button"
                          disabled
                          className="p-1.5 sm:p-2 rounded-xl text-slate-600 bg-slate-800/40 border border-slate-800 cursor-not-allowed opacity-40 transition"
                          title={`Cannot delete account: ${selectedAccountTxns.length} transaction entr${selectedAccountTxns.length === 1 ? 'y' : 'ies'} exist`}
                          aria-label="Cannot delete account with existing transactions"
                        >
                          <Trash2 size={15} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleDeleteAccountFromPopup}
                          disabled={isDeletingAccountPopup}
                          className="p-1.5 sm:p-2 rounded-xl text-rose-400 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition active:scale-95"
                          title="Delete Account (0 transactions)"
                          aria-label="Delete Account"
                        >
                          <Trash2 size={15} />
                        </button>
                      )
                    )}
                  </>
                )}

                {/* Close icon alone */}
                <button 
                  type="button"
                  onClick={handleCloseAccountPopup} 
                  className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Close"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            {isEditingAccountInPopup ? (
              /* Edit Mode Form */
              <>
                <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                  {/* Field 1: Account Name */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Name of the Account
                    </label>
                    <input
                      type="text"
                      value={popupAccountName}
                      onChange={(e) => setPopupAccountName(e.target.value)}
                      placeholder="e.g. HDFC Salary Account"
                      autoFocus
                      className="w-full bg-[#0a0e14] border border-amber-500 rounded-xl px-3 py-2 text-sm text-white font-medium focus:outline-none shadow-inner"
                    />
                  </div>

                  {/* Field 2: Account Category */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Account Category
                    </label>
                    <select
                      value={popupAccountCategoryId}
                      onChange={(e) => {
                        const chosenId = e.target.value;
                        setPopupAccountCategoryId(chosenId);
                        const c = categoriesList.find(cat => (cat.id || cat.type) === chosenId);
                        if (c) {
                          setPopupAccountType(c.type);
                        }
                      }}
                      className="w-full bg-[#0a0e14] border border-amber-500 rounded-xl px-3 py-2 text-sm text-white font-medium focus:outline-none cursor-pointer"
                    >
                      {categoriesList.map((c) => {
                        const title = getCategoryTitle(c);
                        const isSub = !!c.parentId && c.parentId !== 'MAIN';
                        return (
                          <option key={c.id || c.type} value={c.id || c.type}>
                            {isSub ? `↳ ${title} (Subcategory)` : title} ({c.type})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Field 3: Bank Logo Selection */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Bank / Financial Institution Logo
                    </label>
                    <BankLogoPicker
                      selectedId={popupAccountIcon}
                      onSelect={setPopupAccountIcon}
                    />
                  </div>
                </div>

                {/* Edit Mode Footer */}
                <div className="px-4 py-3 bg-[#161d26] border-t border-slate-800 flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setPopupAccountName(selectedAccountForPopup.name);
                      setPopupAccountType(selectedAccountForPopup.type);
                      setPopupAccountCategoryId(selectedAccountForPopup.categoryId || selectedAccountForPopup.type);
                      setPopupAccountIcon(selectedAccountForPopup.icon || 'none');
                      setIsEditingAccountInPopup(false);
                    }}
                    disabled={isSavingAccountPopup}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAccountPopup}
                    disabled={isSavingAccountPopup || !popupAccountName.trim()}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition disabled:opacity-50"
                  >
                    <Check size={14} strokeWidth={2.5} />
                    <span>{isSavingAccountPopup ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </>
            ) : (
              /* View Mode: Compact Summary + Combined Passbook Preview */
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 p-3 sm:p-4 space-y-2.5">
                {/* 1. Compact Balance & Date of Reco (Label left, Value/Field right) */}
                <div className="p-2.5 sm:p-3 bg-[#0a0e14] rounded-xl sm:rounded-2xl border border-slate-800 space-y-2.5">
                  {/* Row 1: Current Balance */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-slate-400">Current Balance</span>
                    <span className="text-sm sm:text-base font-extrabold text-amber-200 font-mono">
                      {formatCurrency(selectedAccountForPopup.balance)}
                    </span>
                  </div>

                  <div className="h-[1px] bg-slate-800/80" />

                  {/* Row 2: Date of reco */}
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor="account-reco-date" className="text-xs font-semibold text-slate-400 cursor-pointer shrink-0">
                      Date of reco
                    </label>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        id="account-reco-date"
                        type="date"
                        value={selectedAccountForPopup.reconciledDate || ''}
                        onChange={(e) => handleUpdateRecoDate(e.target.value)}
                        className="bg-[#121820] hover:bg-[#161f2b] focus:bg-[#121820] border border-slate-700 hover:border-amber-500/80 focus:border-amber-500 rounded-xl px-2.5 py-1 text-xs text-white font-mono focus:outline-none transition cursor-pointer [color-scheme:dark] shadow-sm"
                        title="Change Date of reco"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateRecoDate(new Date().toISOString().split('T')[0])}
                        className="px-2 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-[10px] font-semibold transition active:scale-95 shrink-0"
                        title="Set Date of reco to today"
                      >
                        Today
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Combined Passbook Preview Section */}
                <div className="space-y-2">
                  {/* Passbook Section Header */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <div className="flex items-center gap-2">
                      <BookOpen size={14} className="text-amber-400" />
                      <span className="text-xs font-bold text-white">Passbook Entries</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-700">
                        {selectedAccountTxns.length}
                      </span>
                    </div>

                    {/* Quick Search if more than 2 entries */}
                    {selectedAccountTxns.length > 2 && (
                      <div className="relative w-36 sm:w-44">
                        <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="text"
                          value={popupTxnSearch}
                          onChange={(e) => setPopupTxnSearch(e.target.value)}
                          placeholder="Search entries..."
                          className="w-full bg-[#0a0e14] border border-slate-800 rounded-lg pl-6 pr-2 py-0.5 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                        />
                      </div>
                    )}
                  </div>

                  {/* Transaction Entries List */}
                  <div className="space-y-1.5 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 pr-0.5">
                    {filteredPopupTxns.length === 0 ? (
                      <div className="py-6 text-center bg-[#0a0e14]/60 rounded-xl border border-slate-800/80 px-4">
                        <BookOpen size={20} className="text-slate-600 mx-auto mb-1.5" />
                        <p className="text-xs font-medium text-slate-400">
                          {popupTxnSearch ? 'No matching entries found' : 'No transactions recorded yet'}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {hasTransactions 
                            ? 'Try changing your search keywords' 
                            : 'This account has 0 entries and can be deleted using the trash icon above.'}
                        </p>
                      </div>
                    ) : (
                      filteredPopupTxns.map((t) => {
                        const accId = selectedAccountForPopup.id;
                        const isCredit = (t.type === 'INCOME' && t.toAccountId === accId) || (t.type === 'TRANSFER' && t.toAccountId === accId);
                        const isTransfer = t.type === 'TRANSFER';

                        return (
                          <div
                            key={t.id}
                            onClick={() => {
                              if (onSelectTxn) {
                                onSelectTxn(t);
                              }
                            }}
                            className={`p-2 sm:p-2.5 rounded-xl bg-[#0a0e14] hover:bg-[#151c27] border border-slate-800/70 flex items-center justify-between gap-2 transition ${
                              onSelectTxn ? 'cursor-pointer' : ''
                            }`}
                            title={onSelectTxn ? "Click to view/edit transaction" : undefined}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                  isTransfer
                                    ? 'bg-blue-500/15 text-blue-400'
                                    : isCredit
                                    ? 'bg-emerald-500/15 text-emerald-400'
                                    : 'bg-rose-500/15 text-rose-400'
                                }`}
                              >
                                {isTransfer ? (
                                  <ArrowRightLeft size={12} />
                                ) : isCredit ? (
                                  <ArrowDownLeft size={12} />
                                ) : (
                                  <ArrowUpRight size={12} />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-medium text-slate-200 truncate">
                                  {t.description || 'Transaction'}
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-1.5 truncate">
                                  <span>{formatDate(t.date)}</span>
                                  <span>•</span>
                                  <span className="truncate">{t.category || t.type}</span>
                                </div>
                              </div>
                            </div>

                            <div
                              className={`text-xs font-bold font-mono shrink-0 ${
                                isCredit ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {isCredit ? '+' : '-'}{formatCurrency(t.amount)}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* 2. Category Heading Details & Editing Pop-up Modal             */}
      {/* ============================================================= */}
      {selectedCategoryForPopup && (() => {
        const popupCatKey = selectedCategoryForPopup.id || selectedCategoryForPopup.type;
        const PopupIcon = resolveCategoryIcon(selectedCategoryForPopup);
        const parentCategory = selectedCategoryForPopup.parentId && selectedCategoryForPopup.parentId !== 'MAIN'
          ? categoriesList.find(c => (c.id || c.type) === selectedCategoryForPopup.parentId)
          : null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[#121820] w-full max-w-md rounded-2xl sm:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-800 flex items-center justify-between gap-2 bg-[#161d26] shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ 
                      backgroundColor: `${(isEditingCategoryInPopup ? popupCategoryColor : selectedCategoryForPopup.color) || '#0284c7'}25`, 
                      color: (isEditingCategoryInPopup ? popupCategoryColor : selectedCategoryForPopup.color) || '#0284c7' 
                    }}
                  >
                    {isEditingCategoryInPopup ? (
                      (() => {
                        const CurIcon = CATEGORY_ICON_MAP[popupCategoryIconName] || PopupIcon;
                        return <CurIcon size={16} />;
                      })()
                    ) : (
                      <PopupIcon size={16} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm sm:text-base font-bold text-white truncate block">
                      {isEditingCategoryInPopup ? 'Edit Category Heading' : getCategoryTitle(selectedCategoryForPopup)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {parentCategory ? `Subcategory under ${getCategoryTitle(parentCategory)}` : 'Main Category'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {!isEditingCategoryInPopup && (
                    <>
                      {/* Edit icon */}
                      <button
                        type="button"
                        onClick={() => setIsEditingCategoryInPopup(true)}
                        className="p-1.5 sm:p-2 rounded-xl text-amber-400 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition active:scale-95"
                        title="Edit Category Details"
                        aria-label="Edit Category"
                      >
                        <Edit3 size={15} />
                      </button>

                      {/* Delete icon - disabled if accounts are tagged to it */}
                      {hasCategoryAccounts ? (
                        <button
                          type="button"
                          disabled
                          className="p-1.5 sm:p-2 rounded-xl text-slate-600 bg-slate-800/40 border border-slate-800 cursor-not-allowed opacity-40 transition"
                          title={`Cannot delete category: ${popupCategoryAccountsCount} account${popupCategoryAccountsCount === 1 ? '' : 's'} tagged to it`}
                          aria-label="Cannot delete category with tagged accounts"
                        >
                          <Trash2 size={15} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleDeleteCategoryFromPopup}
                          disabled={isDeletingCategoryPopup}
                          className="p-1.5 sm:p-2 rounded-xl text-rose-400 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition active:scale-95"
                          title="Delete Category (0 accounts tagged)"
                          aria-label="Delete Category"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </>
                  )}

                  {/* Close icon alone */}
                  <button 
                    type="button"
                    onClick={handleCloseCategoryPopup} 
                    className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Close"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 flex-1">
                {isEditingCategoryInPopup ? (
                  <>
                    {/* Field 1: Category Name */}
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Category Heading Name
                      </label>
                      <input
                        type="text"
                        value={popupCategoryName}
                        onChange={(e) => setPopupCategoryName(e.target.value)}
                        placeholder="e.g. Primary Bank Accounts"
                        autoFocus
                        className="w-full bg-[#0a0e14] border border-amber-500 rounded-xl px-3 py-2 text-sm text-white font-medium focus:outline-none shadow-inner"
                      />
                    </div>

                    {/* Field 2: Category Classification (Main category OR an existing category) */}
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Category Classification
                      </label>
                      <select
                        value={popupCategoryParentId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPopupCategoryParentId(val);
                          if (val !== 'MAIN') {
                            const parent = categoriesList.find(c => (c.id || c.type) === val);
                            if (parent) {
                              setPopupCategoryType(parent.type);
                            }
                          }
                        }}
                        className="w-full bg-[#0a0e14] border border-amber-500 rounded-xl px-3 py-2 text-sm text-white font-medium focus:outline-none cursor-pointer"
                      >
                        <option value="MAIN">Main category</option>
                        <optgroup label="Show under existing category">
                          {categoriesList
                            .filter(c => (c.id || c.type) !== popupCatKey)
                            .map((c) => {
                              const title = getCategoryTitle(c);
                              const isSub = !!c.parentId && c.parentId !== 'MAIN';
                              return (
                                <option key={c.id || c.type} value={c.id || c.type}>
                                  {isSub ? `↳ ${title} (Subcategory)` : title}
                                </option>
                              );
                            })}
                        </optgroup>
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {popupCategoryParentId === 'MAIN'
                          ? 'This category will appear at the root level as a main category.'
                          : 'This category and its accounts will be nested under the chosen category.'}
                      </p>
                    </div>

                    {/* Financial Classification (Only if Main category) */}
                    {popupCategoryParentId === 'MAIN' && (
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                          Account Type (Asset / Liability)
                        </label>
                        <select
                          value={popupCategoryType}
                          onChange={(e) => setPopupCategoryType(e.target.value as AccountType)}
                          className="w-full bg-[#0a0e14] border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none cursor-pointer"
                        >
                          <option value="BANK">Bank Accounts (Asset)</option>
                          <option value="CASH">Cash & Wallets (Asset)</option>
                          <option value="CREDIT_CARD">Credit Cards (Liability)</option>
                          <option value="INVESTMENT">Investments & Wealth (Asset)</option>
                          <option value="LOAN">Loans & Borrowings (Liability)</option>
                          <option value="OTHER">Other Accounts</option>
                        </select>
                      </div>
                    )}

                    {/* Field 3: Category Icon Selection */}
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Category Icon
                      </label>
                      {renderCategoryIconPicker(popupCategoryIconName, setPopupCategoryIconName)}
                    </div>

                    {/* Field 4: Color Tag */}
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Color Theme
                      </label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {['#0284c7', '#10b981', '#f43f5e', '#8b5cf6', '#ea580c', '#06b6d4', '#eab308', '#64748b'].map((clr) => (
                          <button
                            type="button"
                            key={clr}
                            onClick={() => setPopupCategoryColor(clr)}
                            className={`w-6 h-6 rounded-full border-2 transition ${
                              popupCategoryColor === clr ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                            }`}
                            style={{ backgroundColor: clr }}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Read-Only Category Details View */
                  <>
                    {/* Compact Details Grid */}
                    <div className="p-3 bg-[#0a0e14] rounded-2xl border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Classification:</span>
                        <span className="font-semibold text-white">
                          {parentCategory ? `Subcategory of ${getCategoryTitle(parentCategory)}` : 'Main Category'}
                        </span>
                      </div>
                      <div className="h-[1px] bg-slate-800/80" />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Financial Type:</span>
                        <span className="font-mono text-amber-300 font-semibold">{selectedCategoryForPopup.type}</span>
                      </div>
                      <div className="h-[1px] bg-slate-800/80" />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Tagged Accounts:</span>
                        <span className="font-mono font-bold text-white">
                          {popupCategoryAccountsCount} account{popupCategoryAccountsCount === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>

                    {selectedCategoryForPopup.description && (
                      <div className="text-xs text-slate-400 italic px-1">
                        "{selectedCategoryForPopup.description}"
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Modal Actions */}
              {isEditingCategoryInPopup && (
                <div className="px-4 py-3 bg-[#161d26] border-t border-slate-800 flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setPopupCategoryName(getCategoryTitle(selectedCategoryForPopup));
                      setPopupCategoryParentId(selectedCategoryForPopup.parentId || 'MAIN');
                      setPopupCategoryType(selectedCategoryForPopup.type);
                      setPopupCategoryIconName(selectedCategoryForPopup.iconName || getDefaultIconNameForType(selectedCategoryForPopup.type));
                      setPopupCategoryColor(selectedCategoryForPopup.color || '#0284c7');
                      setIsEditingCategoryInPopup(false);
                    }}
                    disabled={isSavingCategoryPopup}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCategoryPopup}
                    disabled={isSavingCategoryPopup || !popupCategoryName.trim()}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition disabled:opacity-50"
                  >
                    <Check size={14} strokeWidth={2.5} />
                    <span>{isSavingCategoryPopup ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ============================================================= */}
      {/* 3. Add Category Modal (from "+ New" -> "Add Category")         */}
      {/* ============================================================= */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121820] w-full max-w-md rounded-2xl sm:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-800 flex items-center justify-between bg-[#161d26] shrink-0">
              <div className="text-amber-300 font-bold text-sm sm:text-base flex items-center gap-2">
                <FolderPlus size={17} />
                <span>Create New Category</span>
              </div>
              <button 
                type="button"
                onClick={() => setIsAddCategoryModalOpen(false)} 
                className="p-1 rounded-full text-slate-400 hover:text-white"
                title="Close"
              >
                <X size={17} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateCategory} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 flex-1">
              {/* Category Name */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Mutual Funds & SIPs"
                  autoFocus
                  className="w-full bg-[#0a0e14] border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-white font-medium focus:outline-none"
                />
              </div>

              {/* Category Classification: Main category OR an existing category */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Category Classification *
                </label>
                <select
                  value={newCatParentId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewCatParentId(val);
                    if (val !== 'MAIN') {
                      const parent = categoriesList.find(c => (c.id || c.type) === val);
                      if (parent) {
                        setNewCatType(parent.type);
                      }
                    }
                  }}
                  className="w-full bg-[#0a0e14] border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-white font-medium focus:outline-none cursor-pointer"
                >
                  <option value="MAIN">Main category</option>
                  <optgroup label="Show under existing category">
                    {categoriesList.map((c) => {
                      const title = getCategoryTitle(c);
                      const isSub = !!c.parentId && c.parentId !== 'MAIN';
                      return (
                        <option key={c.id || c.type} value={c.id || c.type}>
                          {isSub ? `↳ ${title} (Subcategory)` : title}
                        </option>
                      );
                    })}
                  </optgroup>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  {newCatParentId === 'MAIN'
                    ? 'Shown as a top-level category on the main screen.'
                    : 'Shown under the chosen category; accounts inside will be one level further down.'}
                </p>
              </div>

              {/* Base Financial Classification (If Main category) */}
              {newCatParentId === 'MAIN' && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Financial Classification *
                  </label>
                  <select
                    value={newCatType}
                    onChange={(e) => setNewCatType(e.target.value as AccountType)}
                    className="w-full bg-[#0a0e14] border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="BANK">Bank Accounts (Asset)</option>
                    <option value="CASH">Cash & Wallets (Asset)</option>
                    <option value="CREDIT_CARD">Credit Cards (Liability)</option>
                    <option value="INVESTMENT">Investments & Wealth (Asset)</option>
                    <option value="LOAN">Loans & Borrowings (Liability)</option>
                    <option value="OTHER">Other Accounts</option>
                  </select>
                </div>
              )}

              {/* Icon Selection */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Select Icon
                </label>
                {renderCategoryIconPicker(newCatIconName, setNewCatIconName)}
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="e.g. Long-term equity and debt mutual funds"
                  className="w-full bg-[#0a0e14] border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Color Tag
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {['#0284c7', '#10b981', '#f43f5e', '#8b5cf6', '#ea580c', '#06b6d4', '#eab308', '#64748b'].map((clr) => (
                    <button
                      type="button"
                      key={clr}
                      onClick={() => setNewCatColor(clr)}
                      className={`w-6 h-6 rounded-full border-2 transition ${
                        newCatColor === clr ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: clr }}
                    />
                  ))}
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newCatName.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  <span>Create Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
