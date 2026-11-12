import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Check, 
  Trash2, 
  Fuel, 
  ArrowRightLeft, 
  TrendingDown, 
  TrendingUp, 
  Plus, 
  Pencil, 
  Copy, 
  Link2, 
  Calendar, 
  CreditCard, 
  Tag, 
  Clock, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Gauge, 
  Droplet,
  FileText,
  CheckCheck,
  ChevronRight,
  Layers,
  Landmark,
  Ban,
  CheckCircle,
  Repeat
} from 'lucide-react';
import { 
  DEFAULT_CATEGORIES, 
  getAllExpenseCategories, 
  addCustomExpenseCategory, 
  formatCurrency, 
  formatDate,
  formatDateTime,
  formatDateToLocalYMD,
  getTodayLocalDateString 
} from '../../utils/formatters';
import type { Account, Transaction, TransactionType, Vehicle } from '../../types';
import { getUnsettledTransactionsForAccount, getStoredSettlementTolerance, type UnsettledTransactionItem } from '../../utils/settlement';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { registerBackHandler } from '../../utils/backNavigation';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (txn: Omit<Transaction, 'id'> & { id?: string }) => Promise<void>;
  onDelete?: (txn: Transaction) => Promise<void>;
  initialData?: Transaction | null;
  accounts: Account[];
  vehicles: Vehicle[];
  allTransactions?: Transaction[];
  onConvertToRecurring?: (txn: Transaction) => void;
}

function getRelativeDateLabel(dateStr: string): string {
  if (!dateStr) return '';
  const today = getTodayLocalDateString();
  if (dateStr === today) return 'Today';
  
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const yesterdayStr = formatDateToLocalYMD(now);
  if (dateStr === yesterdayStr) return 'Yesterday';
  
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  } catch {
    return dateStr;
  }
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  accounts,
  vehicles,
  allTransactions = [],
  onConvertToRecurring
}) => {
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    return registerBackHandler('transaction-modal', 45, () => {
      onClose();
      return true;
    });
  }, [isOpen, onClose]);

  const [isEditing, setIsEditing] = useState<boolean>(!initialData?.id);
  const [isDuplicateNewRecord, setIsDuplicateNewRecord] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // Form State
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('Fuel');
  const [availableCategories, setAvailableCategories] = useState<string[]>(() => 
    getAllExpenseCategories(initialData?.category ? [initialData.category] : [])
  );
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [fromAccountId, setFromAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [mappedTransactionId, setMappedTransactionId] = useState<string | null>(null);
  const [date, setDate] = useState<string>(getTodayLocalDateString());
  const [time, setTime] = useState<string>('00:00');
  const [vehicleId, setVehicleId] = useState<string>('');
  const [isFuel, setIsFuel] = useState<boolean>(false);
  const [fuelLiters, setFuelLiters] = useState<string>('');
  const [odometer, setOdometer] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const prevIsOpenRef = React.useRef(false);
  const prevTxnIdRef = React.useRef<string | undefined>(undefined);
  const justSwitchedToEditRef = React.useRef(0);

  useEffect(() => {
    if (!isOpen) {
      prevIsOpenRef.current = false;
      setIsDuplicateNewRecord(false);
      setShowDeleteConfirm(false);
      setCopiedId(false);
      return;
    }

    const isNewlyOpening = !prevIsOpenRef.current;
    const isDifferentTxn = initialData?.id !== prevTxnIdRef.current;

    if (isNewlyOpening || isDifferentTxn) {
      prevIsOpenRef.current = true;
      prevTxnIdRef.current = initialData?.id;
      setIsDuplicateNewRecord(false);
      setShowDeleteConfirm(false);
      setCopiedId(false);

      const cats = getAllExpenseCategories(initialData?.category ? [initialData.category] : []);
      setAvailableCategories(cats);
      setIsAddingNewCategory(false);
      setNewCategoryInput('');
      setCategoryError('');
      setIsEditing(!initialData?.id);

      if (initialData) {
        setType(initialData.type);
        setAmount(String(initialData.amount || ''));
        setDescription(initialData.description || '');
        setCategory(initialData.category || 'Other');
        setFromAccountId(initialData.fromAccountId || '');
        setToAccountId(initialData.toAccountId || '');
        setMappedTransactionId(initialData.mappedTransactionId || null);
        setDate(initialData.date || getTodayLocalDateString());
        let initialTime = initialData.time;
        if (!initialTime && initialData.timestamp) {
          const d = new Date(initialData.timestamp);
          if (!isNaN(d.getTime())) {
            initialTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          }
        }
        setTime(initialTime || '00:00');
        setVehicleId(initialData.vehicleId || '');
        setIsFuel(!!initialData.isFuel);
        setFuelLiters(initialData.fuelLiters ? String(initialData.fuelLiters) : '');
        setOdometer(initialData.odometer ? String(initialData.odometer) : '');
        setNotes(initialData.notes || '');
      } else {
        setType('EXPENSE');
        setAmount('');
        setDescription('');
        setCategory('Food & Dining');
        setFromAccountId(accounts[0]?.id || '');
        setToAccountId(accounts[1]?.id || '');
        setMappedTransactionId(null);
        setDate(getTodayLocalDateString());
        setTime('00:00');
        setVehicleId('');
        setIsFuel(false);
        setFuelLiters('');
        setOdometer('');
        setNotes('');
      }
    }
  }, [isOpen, initialData?.id]);

  // Determine accounts involved in this transaction that have mapping enabled
  const mappingAccounts = useMemo(() => {
    const list: Account[] = [];
    if (type === 'EXPENSE') {
      const acc = accounts.find(a => a.id === fromAccountId);
      if (acc?.enableMapping) list.push(acc);
    } else if (type === 'INCOME') {
      const acc = accounts.find(a => a.id === toAccountId);
      if (acc?.enableMapping) list.push(acc);
    } else if (type === 'TRANSFER') {
      const toAcc = accounts.find(a => a.id === toAccountId);
      const fromAcc = accounts.find(a => a.id === fromAccountId);
      if (toAcc?.enableMapping) list.push(toAcc);
      if (fromAcc?.enableMapping && fromAcc.id !== toAcc?.id) list.push(fromAcc);
    }
    return list;
  }, [type, fromAccountId, toAccountId, accounts]);

  const isMappingEnabled = mappingAccounts.length > 0 || !!initialData?.mappedTransactionId;

  // Retrieve unsettled transactions across all mapping-enabled accounts involved
  const unsettledTransactions = useMemo(() => {
    if (!isMappingEnabled) return [];
    const tolerance = getStoredSettlementTolerance();

    const accountsToQuery = mappingAccounts.length > 0
      ? mappingAccounts
      : accounts.filter(a => a.enableMapping);

    const seen = new Set<string>();
    const result: (UnsettledTransactionItem & { accountName?: string })[] = [];

    if (initialData?.mappedTransactionId) {
      const existingParent = allTransactions.find(t => t.id === initialData.mappedTransactionId);
      if (existingParent) {
        seen.add(existingParent.id);
        const parentAcc = accounts.find(a => a.id === existingParent.fromAccountId || a.id === existingParent.toAccountId);
        result.push({
          ...existingParent,
          remainingDifference: 0,
          totalSettled: existingParent.amount,
          accountName: parentAcc?.name
        });
      }
    }

    for (const acc of accountsToQuery) {
      const txns = getUnsettledTransactionsForAccount(
        acc.id,
        allTransactions,
        tolerance,
        initialData?.id
      );
      for (const t of txns) {
        if (!seen.has(t.id)) {
          seen.add(t.id);
          result.push({
            ...t,
            accountName: acc.name
          });
        }
      }
    }

    return result.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [isMappingEnabled, mappingAccounts, accounts, allTransactions, initialData?.id, initialData?.mappedTransactionId]);

  // Categorize available categories: already used in transactions vs unused, sorted alphabetically
  const { usedCategories, unusedCategories } = useMemo(() => {
    // 1. Identify used categories from existing transactions (excluding Transfer)
    const usedSet = new Set<string>();
    for (const t of allTransactions) {
      if (t.category && typeof t.category === 'string') {
        const trimmed = t.category.trim();
        if (trimmed && trimmed.toLowerCase() !== 'transfer') {
          usedSet.add(trimmed);
        }
      }
    }

    // 2. Collect all unique known categories
    const allSet = new Set<string>();
    for (const c of availableCategories) {
      if (c && typeof c === 'string') {
        const trimmed = c.trim();
        if (trimmed && trimmed.toLowerCase() !== 'transfer') {
          allSet.add(trimmed);
        }
      }
    }
    for (const t of allTransactions) {
      if (t.category && typeof t.category === 'string') {
        const trimmed = t.category.trim();
        if (trimmed && trimmed.toLowerCase() !== 'transfer') {
          allSet.add(trimmed);
        }
      }
    }
    if (category && typeof category === 'string') {
      const trimmed = category.trim();
      if (trimmed && trimmed.toLowerCase() !== 'transfer') {
        allSet.add(trimmed);
      }
    }

    const used: string[] = [];
    const unused: string[] = [];

    for (const catName of allSet) {
      if (usedSet.has(catName)) {
        used.push(catName);
      } else {
        unused.push(catName);
      }
    }

    // Sort each set alphabetically
    used.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    unused.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    return { usedCategories: used, unusedCategories: unused };
  }, [availableCategories, allTransactions, category]);

  if (!isOpen) return null;

  const handleConfirmNewCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) {
      setCategoryError('Category name cannot be empty');
      return;
    }
    const updated = addCustomExpenseCategory(trimmed);
    setAvailableCategories(updated);
    setCategory(trimmed);
    setIsAddingNewCategory(false);
    setNewCategoryInput('');
    setCategoryError('');
  };

  const handleCategoryChange = (cat: string) => {
    if (cat === '__NEW_CATEGORY__') {
      setIsAddingNewCategory(true);
      setNewCategoryInput('');
      setCategoryError('');
      return;
    }
    setCategory(cat);
    if (cat === 'Fuel') {
      setIsFuel(true);
      if (!vehicleId && vehicles.length > 0) {
        setVehicleId(vehicles[0].id);
        if (vehicles[0].currentOdometer) {
          setOdometer(String(vehicles[0].currentOdometer));
        }
      }
    } else {
      setIsFuel(false);
      setVehicleId('');
      setFuelLiters('');
      setOdometer('');
    }
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDuplicateNewRecord(true);
    setIsEditing(true);
    justSwitchedToEditRef.current = Date.now();
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleToggleDisabled = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!initialData || isSaving) return;

    setIsSaving(true);
    try {
      await onSave({
        ...initialData,
        disabled: !initialData.disabled
      });
      onClose();
    } catch (err) {
      console.error('Error toggling transaction disabled state:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isEditing) return;
    if (Date.now() - justSwitchedToEditRef.current < 400) {
      return;
    }

    const numAmt = parseFloat(amount);
    if (!numAmt || numAmt <= 0) return;

    const isFuelRecord = type === 'EXPENSE' && category === 'Fuel';

    setIsSaving(true);
    try {
      const chosenTime = time?.trim() || '00:00';
      let computedTimestamp = Date.now();
      try {
        const parsed = new Date(`${date}T${chosenTime}:00`);
        if (!isNaN(parsed.getTime())) {
          computedTimestamp = parsed.getTime();
        }
      } catch {}

      await onSave({
        id: isDuplicateNewRecord ? undefined : (initialData?.id ? initialData.id : undefined),
        type,
        amount: numAmt,
        description: description.trim() || `${category} Record`,
        category: type === 'TRANSFER' ? 'Transfer' : category,
        fromAccountId: (type === 'EXPENSE' || type === 'TRANSFER') ? fromAccountId : null,
        toAccountId: (type === 'INCOME' || type === 'TRANSFER') ? toAccountId : null,
        mappedTransactionId: isMappingEnabled ? (mappedTransactionId || null) : (initialData?.mappedTransactionId || null),
        date,
        time: chosenTime,
        timestamp: isDuplicateNewRecord ? computedTimestamp : (initialData?.timestamp ? computedTimestamp : Date.now()),
        vehicleId: isFuelRecord ? (vehicleId || null) : null,
        isFuel: isFuelRecord,
        fuelLiters: isFuelRecord && fuelLiters ? parseFloat(fuelLiters) : null,
        odometer: isFuelRecord && odometer ? parseFloat(odometer) : null,
        notes: notes.trim(),
        disabled: isDuplicateNewRecord ? false : (initialData?.disabled ?? false)
      });
      onClose();
    } catch (err) {
      console.error('Error saving transaction:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!initialData || !onDelete) return;
    setIsSaving(true);
    try {
      await onDelete(initialData);
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      console.error('Error deleting transaction:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Check if viewing an existing saved transaction in View Mode
  const isViewingMode = !isEditing && Boolean(initialData && initialData.id) && !isDuplicateNewRecord;

  // Resolved accounts for view mode
  const fromAccount = accounts.find(a => a.id === (initialData?.fromAccountId || fromAccountId));
  const toAccount = accounts.find(a => a.id === (initialData?.toAccountId || toAccountId));
  const linkedVehicle = vehicles.find(v => v.id === (initialData?.vehicleId || vehicleId));
  const mappedTxn = initialData?.mappedTransactionId 
    ? allTransactions.find(t => t.id === initialData.mappedTransactionId)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overscroll-contain">
      <div className="bg-[#121820] w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col relative overscroll-contain">
        
        {/* ================================================================= */}
        {/* VIEW MODE: Redesigned Transaction Details & Ledger Dossier        */}
        {/* ================================================================= */}
        {isViewingMode && initialData ? (
          <div className="flex flex-col h-full max-h-[92vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#161d26]">
              <div className="flex items-center gap-2.5">
                <span className="text-amber-400 font-bold text-base tracking-tight">
                  Transaction Details
                </span>
                {initialData.disabled && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                    Disabled
                  </span>
                )}
                <span className="text-slate-500 text-xs font-mono">
                  #{initialData.id ? initialData.id.slice(-6) : ''}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDuplicate}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-amber-300 transition cursor-pointer"
                  title="Duplicate Transaction"
                >
                  <Copy size={16} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable View Content */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Focal Hero Card */}
              <div className="bg-[#0b0f15] border border-slate-800/90 rounded-2xl p-5 text-center relative overflow-hidden">
                {/* Outflow / Inflow / Transfer Indicator */}
                <div className="flex items-center justify-center gap-1.5 mb-2.5">
                  {initialData.type === 'EXPENSE' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                      <ArrowUpRight size={14} className="stroke-[2.5]" />
                      <span>Outflow · Expense</span>
                    </span>
                  ) : initialData.type === 'INCOME' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                      <ArrowDownLeft size={14} className="stroke-[2.5]" />
                      <span>Inflow · Income</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400">
                      <ArrowRightLeft size={14} className="stroke-[2.5]" />
                      <span>Internal Transfer</span>
                    </span>
                  )}
                </div>

                {/* Prominent Formatted Amount (strikethrough when disabled) */}
                <div 
                  className={`text-3xl sm:text-4xl font-extrabold font-mono tabular-nums tracking-tight ${
                    initialData.disabled
                      ? 'line-through text-slate-500 opacity-60'
                      : initialData.type === 'EXPENSE'
                      ? 'text-rose-400'
                      : initialData.type === 'INCOME'
                      ? 'text-emerald-400'
                      : 'text-blue-300'
                  }`}
                >
                  {initialData.type === 'EXPENSE' && '-'}
                  {initialData.type === 'INCOME' && '+'}
                  {formatCurrency(initialData.amount)}
                </div>

                {initialData.disabled && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    <Ban size={12} />
                    <span>Disabled · Excluded from all balance calculations</span>
                  </div>
                )}

                {Boolean(initialData.recurringTransactionId || initialData.isRecurringGenerated) && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    <Repeat size={12} className="text-amber-400" />
                    <span>Auto-Posted from Recurring Rule</span>
                  </div>
                )}

                {/* Primary Description / Payee */}
                <h3 className="text-base sm:text-lg font-bold text-white mt-2 break-words">
                  {initialData.description || 'Transaction Record'}
                </h3>

                {/* Unboxed Metadata: Date, Time, Day, Relative */}
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-2 font-medium flex-wrap">
                  <span>{formatDate(initialData.date)}</span>
                  {initialData.time && initialData.time !== '00:00' && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-amber-300/80">{initialData.time}</span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span>{getRelativeDateLabel(initialData.date)}</span>
                  {initialData.type !== 'TRANSFER' && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-amber-300/90">{initialData.category}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Account Path & Direction Card */}
              <div className="bg-[#0e141d] border border-slate-800/80 rounded-2xl p-4 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Account & Settlement Flow</span>
                  <span className="text-[10px] text-slate-500 font-normal">Double Entry Ledger</span>
                </div>

                {initialData.type === 'TRANSFER' ? (
                  <div className="flex items-center justify-between gap-3 bg-[#0a0d13] p-3 rounded-xl border border-slate-800/60">
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">From Source</div>
                      <div className="text-sm font-bold text-white truncate mt-0.5">
                        {fromAccount?.name || 'Unknown Account'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {fromAccount ? formatCurrency(fromAccount.balance) : ''}
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                      <ChevronRight size={16} />
                    </div>

                    <div className="min-w-0 flex-1 text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">To Destination</div>
                      <div className="text-sm font-bold text-white truncate mt-0.5">
                        {toAccount?.name || 'Unknown Account'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {toAccount ? formatCurrency(toAccount.balance) : ''}
                      </div>
                    </div>
                  </div>
                ) : initialData.type === 'EXPENSE' ? (
                  <div className="flex items-center justify-between bg-[#0a0d13] p-3 rounded-xl border border-slate-800/60">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                        <CreditCard size={16} />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Debited Account</div>
                        <div className="text-sm font-bold text-white mt-0.5">
                          {fromAccount?.name || 'Unassigned'}
                        </div>
                      </div>
                    </div>
                    {fromAccount && (
                      <div className="text-right font-mono">
                        <div className="text-[10px] text-slate-500">Current Balance</div>
                        <div className="text-xs font-bold text-slate-300 mt-0.5">
                          {formatCurrency(fromAccount.balance)}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-[#0a0d13] p-3 rounded-xl border border-slate-800/60">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                        <Landmark size={16} />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Credited Account</div>
                        <div className="text-sm font-bold text-white mt-0.5">
                          {toAccount?.name || 'Unassigned'}
                        </div>
                      </div>
                    </div>
                    {toAccount && (
                      <div className="text-right font-mono">
                        <div className="text-[10px] text-slate-500">Current Balance</div>
                        <div className="text-xs font-bold text-slate-300 mt-0.5">
                          {formatCurrency(toAccount.balance)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Vehicle & Fuel Telemetry (if applicable) */}
              {(initialData.isFuel || initialData.fuelLiters || initialData.vehicleId) && (
                <div className="bg-[#0e141d] border border-amber-500/25 rounded-2xl p-4 space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                    <Fuel size={14} />
                    <span>Fuel & Vehicle Telemetry</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-0.5">
                    <div className="bg-[#0a0d13] p-2.5 rounded-xl border border-slate-800/60">
                      <div className="text-[10px] text-slate-400 uppercase font-medium">Vehicle</div>
                      <div className="text-xs font-bold text-white truncate mt-1">
                        {linkedVehicle?.name || 'Linked Vehicle'}
                      </div>
                      {linkedVehicle?.vehicleNumber && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {linkedVehicle.vehicleNumber}
                        </div>
                      )}
                    </div>

                    {initialData.fuelLiters ? (
                      <div className="bg-[#0a0d13] p-2.5 rounded-xl border border-slate-800/60">
                        <div className="text-[10px] text-slate-400 uppercase font-medium">Volume</div>
                        <div className="text-xs font-bold text-amber-300 font-mono mt-1">
                          {initialData.fuelLiters} Liters
                        </div>
                        {initialData.amount && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            ₹{(initialData.amount / initialData.fuelLiters).toFixed(2)}/L
                          </div>
                        )}
                      </div>
                    ) : null}

                    {initialData.odometer ? (
                      <div className="bg-[#0a0d13] p-2.5 rounded-xl border border-slate-800/60">
                        <div className="text-[10px] text-slate-400 uppercase font-medium">Odometer</div>
                        <div className="text-xs font-bold text-white font-mono mt-1">
                          {initialData.odometer.toLocaleString()} km
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Settlement Mapping Link (if mapped) */}
              {mappedTxn && (
                <div className="bg-[#0e141d] border border-blue-500/30 rounded-2xl p-4 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                    <Link2 size={14} />
                    <span>Settlement Linkage</span>
                  </div>
                  <div className="bg-[#0a0d13] p-3 rounded-xl border border-slate-800/60 text-xs flex items-center justify-between">
                    <div>
                      <div className="text-white font-bold">{mappedTxn.description}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {formatDate(mappedTxn.date)} · {mappedTxn.category}
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-slate-200">
                      {formatCurrency(mappedTxn.amount)}
                    </div>
                  </div>
                </div>
              )}

              {/* Notes / Remarks */}
              {initialData.notes && (
                <div className="bg-[#0e141d] border border-slate-800/80 rounded-2xl p-4 space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileText size={13} />
                    <span>Notes & Remarks</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-[#0a0d13] p-3 rounded-xl border border-slate-800/60">
                    {initialData.notes}
                  </p>
                </div>
              )}

              {/* Audit & Record Details */}
              <div className="border-t border-slate-800/80 pt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 font-mono">
                  <span>ID: {initialData.id || 'New'}</span>
                  {initialData.id && (
                    <button
                      type="button"
                      onClick={() => handleCopyId(initialData.id)}
                      className="p-1 hover:text-white transition cursor-pointer text-slate-400"
                      title="Copy full transaction ID"
                    >
                      {copiedId ? <CheckCheck size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                  )}
                  {copiedId && <span className="text-[10px] text-emerald-400 font-semibold">Copied!</span>}
                </div>
                {initialData.timestamp && (
                  <div className="flex items-center gap-1">
                    <Clock size={11} />
                    <span>Added {formatDateTime(initialData.timestamp)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions Bar: 2-tier structured layout */}
            <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-[#161d26] space-y-2.5">
              {/* Row 1: Contextual Utility Actions (wrapping cleanly on small screens) */}
              <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                {onDelete ? (
                  <button
                    key="delete-txn-btn"
                    id="delete-txn-btn"
                    type="button"
                    onClick={handleDeleteClick}
                    disabled={isSaving}
                    className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                    title="Delete this transaction"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
                  <button
                    key="toggle-disable-txn-btn"
                    id="toggle-disable-txn-btn"
                    type="button"
                    onClick={handleToggleDisabled}
                    disabled={isSaving}
                    className={`py-2 px-2.5 sm:px-3 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border ${
                      initialData.disabled
                        ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40 shadow-sm'
                        : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700/80'
                    }`}
                    title={initialData.disabled ? "Enable transaction to re-include in balance calculations" : "Disable transaction to exclude from balance calculations"}
                  >
                    {initialData.disabled ? <CheckCircle size={13} className="text-emerald-400" /> : <Ban size={13} />}
                    <span>{initialData.disabled ? 'Enable' : 'Disable'}</span>
                  </button>

                  {onConvertToRecurring && (
                    <button
                      key="make-recurring-txn-btn"
                      id="make-recurring-txn-btn"
                      type="button"
                      onClick={() => {
                        onClose();
                        onConvertToRecurring(initialData);
                      }}
                      className="py-2 px-2.5 sm:px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                      title="Create recurring rule based on this transaction"
                    >
                      <Repeat size={13} className="text-amber-400" />
                      <span>Set Recurring</span>
                    </button>
                  )}

                  <button
                    key="duplicate-txn-btn"
                    id="duplicate-transaction-btn"
                    type="button"
                    onClick={handleDuplicate}
                    className="py-2 px-2.5 sm:px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                    title="Create a new transaction pre-filled with these details"
                  >
                    <Copy size={13} />
                    <span>Duplicate</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Primary Dialog Actions */}
              <div className="flex items-center gap-2.5 pt-0.5">
                <button
                  key="close-view-btn"
                  id="close-view-btn"
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 sm:px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
                >
                  Close
                </button>

                <button
                  key="enter-edit-mode-btn"
                  id="edit-transaction-btn"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    justSwitchedToEditRef.current = Date.now();
                    setIsEditing(true);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <Pencil size={15} strokeWidth={2.5} />
                  <span>Edit Transaction</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ================================================================= */
          /* EDIT / CREATE MODE: Form                                         */
          /* ================================================================= */
          <div className="flex flex-col h-full max-h-[92vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#161d26]">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold text-base">
                  {isDuplicateNewRecord
                    ? 'New Transaction (Duplicate)'
                    : !initialData?.id
                    ? 'New Transaction'
                    : 'Edit Transaction'}
                </span>
                {isDuplicateNewRecord && (
                  <span className="text-xs text-amber-300/80 flex items-center gap-1">
                    <Copy size={11} /> Copied from original
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Type Toggle */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setType('EXPENSE')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                    type === 'EXPENSE'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <TrendingDown size={14} />
                  <span>Expense</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('INCOME')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                    type === 'INCOME'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <TrendingUp size={14} />
                  <span>Income</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('TRANSFER')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                    type === 'TRANSFER'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ArrowRightLeft size={14} />
                  <span>Transfer</span>
                </button>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Amount (₹ INR) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-amber-400 font-mono">
                    ₹
                  </span>
                  <input
                    id="txn-modal-amount"
                    type="number"
                    step="any"
                    required
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[#0e131a] border border-slate-700/80 rounded-2xl py-3 pl-10 pr-4 text-2xl font-bold text-white font-mono focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Description / Payee *
                </label>
                <input
                  id="txn-modal-desc"
                  type="text"
                  required
                  placeholder="e.g. Petrol Shell, Supermarket, Monthly Rent"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#0e131a] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              {/* Accounts Selector */}
              {type === 'EXPENSE' && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Paid From Account *
                  </label>
                  <select
                    id="txn-modal-from-account"
                    value={fromAccountId}
                    onChange={(e) => setFromAccountId(e.target.value)}
                    required
                    className="w-full bg-[#0e131a] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition cursor-pointer"
                  >
                    <option value="">Select Account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatCurrency(a.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {type === 'INCOME' && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Deposited Into Account *
                  </label>
                  <select
                    id="txn-modal-to-account"
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    required
                    className="w-full bg-[#0e131a] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                  >
                    <option value="">Select Account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatCurrency(a.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {type === 'TRANSFER' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Transfer From
                    </label>
                    <select
                      value={fromAccountId}
                      onChange={(e) => setFromAccountId(e.target.value)}
                      required
                      className="w-full bg-[#0e131a] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="">Source</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Transfer To
                    </label>
                    <select
                      value={toAccountId}
                      onChange={(e) => setToAccountId(e.target.value)}
                      required
                      className="w-full bg-[#0e131a] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="">Destination</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Mapping & Settlement Section */}
              {isMappingEnabled && (
                <div className="p-3.5 bg-[#0a0e14] rounded-2xl border border-amber-500/30 space-y-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                      <Link2 size={14} />
                      <span>Map / Settle Against Unsettled Transaction</span>
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono font-semibold">
                      {mappingAccounts.map(a => a.name).join(' / ') || 'Mapping Active'}
                    </span>
                  </label>

                  <select
                    id="txn-modal-mapped-transaction-select"
                    value={mappedTransactionId || ''}
                    onChange={(e) => setMappedTransactionId(e.target.value || null)}
                    className="w-full bg-[#121820] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="">None / New Transaction (Do not link)</option>
                    {unsettledTransactions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {type === 'TRANSFER' && opt.accountName ? `[${opt.accountName}] ` : ''}
                        {formatDate(opt.date)} • {opt.description} — ₹{opt.amount} (Unsettled: ₹{opt.remainingDifference})
                      </option>
                    ))}
                  </select>

                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {mappedTransactionId ? (
                      <span className="text-amber-300 font-medium">
                        This transaction will settle against the chosen entry. Differences within tolerance will be considered fully settled.
                      </span>
                    ) : (
                      <span>
                        Select an earlier unsettled entry to settle against, or leave as "None" if this is a new independent record.
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Date & Time Row - Always side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#0e131a] border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                    <Clock size={11} className="text-slate-400" />
                    <span>Time</span>
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-[#0e131a] border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Category (if not transfer) */}
              {type !== 'TRANSFER' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Category *
                    </label>
                    {!isAddingNewCategory && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNewCategory(true);
                          setNewCategoryInput('');
                          setCategoryError('');
                        }}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Plus size={11} />
                        <span>Add New</span>
                      </button>
                    )}
                  </div>

                  {isAddingNewCategory ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          autoFocus
                          placeholder="e.g. Subscriptions"
                          value={newCategoryInput}
                          onChange={(e) => {
                            setNewCategoryInput(e.target.value);
                            if (categoryError) setCategoryError('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleConfirmNewCategory();
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              setIsAddingNewCategory(false);
                              setCategoryError('');
                            }
                          }}
                          className="flex-1 min-w-0 bg-[#0e131a] border border-amber-500/80 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleConfirmNewCategory}
                          title="Add Category"
                          className="p-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors shrink-0 cursor-pointer"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingNewCategory(false);
                            setCategoryError('');
                          }}
                          title="Cancel"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors shrink-0 cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      {categoryError && (
                        <p className="text-[10px] text-rose-400 font-medium">{categoryError}</p>
                      )}
                    </div>
                  ) : (
                    <select
                      value={category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full bg-[#0e131a] border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {usedCategories.length > 0 && (
                        <optgroup label="Used Categories">
                          {usedCategories.map((c) => (
                            <option key={`used-${c}`} value={c}>{c}</option>
                          ))}
                        </optgroup>
                      )}
                      {unusedCategories.length > 0 && (
                        <optgroup label={usedCategories.length > 0 ? "Unused Categories" : "Categories"}>
                          {unusedCategories.map((c) => (
                            <option key={`unused-${c}`} value={c}>{c}</option>
                          ))}
                        </optgroup>
                      )}
                      <option value="__NEW_CATEGORY__">+ Add New Category...</option>
                    </select>
                  )}
                </div>
              )}

              {/* Vehicle Link & Odometer Reading: ONLY shown when EXPENSE and category is Fuel */}
              {type === 'EXPENSE' && category === 'Fuel' && (
                <div className="p-3.5 bg-amber-950/20 border border-amber-900/40 rounded-2xl space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                      <Fuel size={15} />
                      <span>Fuel & Vehicle Odometer</span>
                    </div>
                    {vehicleId && (
                      <span className="text-[10px] text-amber-400/80 font-medium">
                        Updates vehicle odometer
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Vehicle
                      </label>
                      <select
                        value={vehicleId}
                        onChange={(e) => {
                          const vId = e.target.value;
                          setVehicleId(vId);
                          const sel = vehicles.find(v => v.id === vId);
                          if (sel && sel.currentOdometer && !odometer) {
                            setOdometer(String(sel.currentOdometer));
                          }
                        }}
                        className="w-full bg-[#0e131a] border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="">Select Vehicle (Optional)</option>
                        {vehicles.map((v) => (
                          <option key={v.id} value={v.id}>{v.name} ({v.vehicleNumber || v.type})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Odometer (km)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 15400"
                        value={odometer}
                        onChange={(e) => setOdometer(e.target.value)}
                        className="w-full bg-[#0e131a] border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Fuel (Liters)
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 15.5"
                        value={fuelLiters}
                        onChange={(e) => setFuelLiters(e.target.value)}
                        className="w-full bg-[#0e131a] border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Notes / Tags
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional remarks..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#0e131a] border border-slate-700/80 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 sm:gap-3 pt-2">
                <button
                  key="cancel-edit-btn"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isDuplicateNewRecord || !initialData?.id) {
                      onClose();
                    } else {
                      setIsEditing(false);
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  key="save-changes-submit-btn"
                  id="save-transaction-btn"
                  type="submit"
                  disabled={isSaving || !amount}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <Check size={16} strokeWidth={2.5} />
                  <span>
                    {isSaving 
                      ? 'Committing...' 
                      : (initialData && !isDuplicateNewRecord) 
                      ? 'Save Changes' 
                      : 'Save Record'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Delete Confirmation Popup */}
        {showDeleteConfirm && (
          <div 
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div 
              className="bg-[#121820] w-full max-w-sm rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col p-6 text-center animate-scaleUp"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-rose-500/10">
                <Trash2 size={26} />
              </div>

              <h3 className="text-base font-bold text-white mb-1.5">
                Delete Transaction?
              </h3>
              
              <div className="bg-[#0a0e14] rounded-2xl border border-slate-800/80 p-3 my-3 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate max-w-[170px]">
                    {description || initialData?.description || 'Transaction'}
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-400">
                    {formatCurrency(Number(amount) || initialData?.amount || 0)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                  <span>{date || initialData?.date}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-300/80">{category || initialData?.category}</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Are you sure you want to delete this record? This action cannot be undone and will update your account balances immediately.
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="confirm-delete-txn-btn"
                  onClick={handleConfirmDelete}
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/30 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  <span>{isSaving ? 'Deleting...' : 'Delete Record'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
