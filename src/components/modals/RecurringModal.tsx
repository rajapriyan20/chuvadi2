import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Trash2, 
  Repeat, 
  Calendar, 
  CreditCard, 
  ArrowRightLeft, 
  TrendingDown, 
  TrendingUp, 
  Zap, 
  HelpCircle,
  Tag,
  Clock,
  Car
} from 'lucide-react';
import type { Account, RecurringTransaction, TransactionType, RecurringFrequency, Vehicle } from '../../types';
import { 
  formatCurrency, 
  getTodayLocalDateString, 
  getAllExpenseCategories,
  addCustomExpenseCategory 
} from '../../utils/formatters';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { registerBackHandler } from '../../utils/backNavigation';

function computeNextDueDateFromDay(day: number): string {
  const today = new Date();
  const clampedDay = Math.min(31, Math.max(1, day));
  
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed
  const currentDay = today.getDate();
  
  // Find the target date in current month (clamping to max days in current month)
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const actualTargetDayThisMonth = Math.min(clampedDay, daysInCurrentMonth);
  
  let targetYear = currentYear;
  let targetMonth = currentMonth;
  let targetDay = actualTargetDayThisMonth;
  
  if (currentDay > actualTargetDayThisMonth) {
    // Current day has already passed this month's target day -> move to next month
    targetMonth += 1;
    if (targetMonth > 11) {
      targetMonth = 0;
      targetYear += 1;
    }
    const daysInNextMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    targetDay = Math.min(clampedDay, daysInNextMonth);
  }
  
  const yyyy = String(targetYear);
  const mm = String(targetMonth + 1).padStart(2, '0');
  const dd = String(targetDay).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getOrdinalSuffix(n: number): string {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return `${n}st`;
  if (j === 2 && k !== 12) return `${n}nd`;
  if (j === 3 && k !== 13) return `${n}rd`;
  return `${n}th`;
}

function formatDisplayDate(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  } catch {}
  return dateStr;
}

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<RecurringTransaction, 'id'> & { id?: string }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  initialData?: RecurringTransaction | null;
  prefillDefaults?: Partial<RecurringTransaction> | null;
  accounts: Account[];
  vehicles?: Vehicle[];
}

export const RecurringModal: React.FC<RecurringModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  prefillDefaults,
  accounts,
  vehicles = []
}) => {
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    return registerBackHandler('recurring-modal', 46, () => {
      onClose();
      return true;
    });
  }, [isOpen, onClose]);

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('Housing');
  const [availableCategories, setAvailableCategories] = useState<string[]>(() =>
    getAllExpenseCategories(initialData?.category ? [initialData.category] : [])
  );
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [categoryError, setCategoryError] = useState('');
  
  const [fromAccountId, setFromAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('MONTHLY');
  const [interval, setInterval] = useState<number>(1);
  const [dayOfMonth, setDayOfMonth] = useState<number | string>(1);
  const [hasEndDate, setHasEndDate] = useState<boolean>(false);
  const [endDate, setEndDate] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [autoPost, setAutoPost] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');
  const [vehicleId, setVehicleId] = useState<string>('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowDeleteConfirm(false);
      return;
    }

    if (initialData) {
      setType(initialData.type);
      setAmount(String(initialData.amount || ''));
      setDescription(initialData.description || '');
      setCategory(initialData.category || 'Other');
      setFromAccountId(initialData.fromAccountId || '');
      setToAccountId(initialData.toAccountId || '');
      setFrequency(initialData.frequency || 'MONTHLY');
      setInterval(initialData.interval || 1);
      const parsedDay = initialData.nextDueDate
        ? parseInt(initialData.nextDueDate.split('-')[2], 10)
        : (initialData.startDate ? parseInt(initialData.startDate.split('-')[2], 10) : 1);
      setDayOfMonth(parsedDay || 1);
      setHasEndDate(Boolean(initialData.endDate));
      setEndDate(initialData.endDate || '');
      setIsActive(initialData.isActive !== false);
      setAutoPost(initialData.autoPost !== false);
      setNotes(initialData.notes || '');
      setVehicleId(initialData.vehicleId || '');
    } else if (prefillDefaults) {
      setType(prefillDefaults.type || 'EXPENSE');
      setAmount(prefillDefaults.amount ? String(prefillDefaults.amount) : '');
      setDescription(prefillDefaults.description || '');
      setCategory(prefillDefaults.category || 'Other');
      setFromAccountId(prefillDefaults.fromAccountId || accounts[0]?.id || '');
      setToAccountId(prefillDefaults.toAccountId || accounts[1]?.id || accounts[0]?.id || '');
      setFrequency(prefillDefaults.frequency || 'MONTHLY');
      setInterval(prefillDefaults.interval || 1);
      const parsedDay = prefillDefaults.nextDueDate
        ? parseInt(prefillDefaults.nextDueDate.split('-')[2], 10)
        : (prefillDefaults.startDate ? parseInt(prefillDefaults.startDate.split('-')[2], 10) : 1);
      setDayOfMonth(parsedDay || 1);
      setHasEndDate(Boolean(prefillDefaults.endDate));
      setEndDate(prefillDefaults.endDate || '');
      setIsActive(prefillDefaults.isActive !== false);
      setAutoPost(prefillDefaults.autoPost !== false);
      setNotes(prefillDefaults.notes || '');
      setVehicleId(prefillDefaults.vehicleId || '');
    } else {
      setType('EXPENSE');
      setAmount('');
      setDescription('');
      setCategory('Housing');
      setFromAccountId(accounts[0]?.id || '');
      setToAccountId(accounts[1]?.id || accounts[0]?.id || '');
      setFrequency('MONTHLY');
      setInterval(1);
      setDayOfMonth(1);
      setHasEndDate(false);
      setEndDate('');
      setIsActive(true);
      setAutoPost(true);
      setNotes('');
      setVehicleId('');
    }
  }, [isOpen, initialData, prefillDefaults, accounts]);

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

  const numDay = Math.min(31, Math.max(1, Number(dayOfMonth) || 1));
  const computedNextDueDate = computeNextDueDateFromDay(numDay);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt === 0) return;
    if (type !== 'EXPENSE' && numAmt < 0) return;
    if (!description.trim()) return;

    const resolvedStartDate = initialData?.startDate || computedNextDueDate;

    setIsSaving(true);
    try {
      await onSave({
        id: initialData?.id,
        type,
        amount: numAmt,
        description: description.trim(),
        category: type === 'TRANSFER' ? 'Transfer' : category,
        fromAccountId: (type === 'EXPENSE' || type === 'TRANSFER') ? fromAccountId : null,
        toAccountId: (type === 'INCOME' || type === 'TRANSFER') ? toAccountId : null,
        frequency,
        interval: Math.max(1, interval || 1),
        startDate: resolvedStartDate,
        nextDueDate: computedNextDueDate,
        endDate: hasEndDate && endDate ? endDate : null,
        isActive,
        autoPost,
        notes: notes.trim(),
        vehicleId: vehicleId || null,
        isFuel: category === 'Fuel' && Boolean(vehicleId)
      });
      onClose();
    } catch (err) {
      console.error('Error saving recurring rule:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!initialData?.id || !onDelete) return;
    setIsSaving(true);
    try {
      await onDelete(initialData.id);
      onClose();
    } catch (err) {
      console.error('Error deleting recurring rule:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121820] w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden h-[90dvh] sm:h-auto sm:max-h-[88vh] flex flex-col min-h-0 relative">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#161d26] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Repeat size={17} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                {initialData ? 'Edit Recurring Rule' : 'New Recurring Transaction'}
              </h2>
              <div className="text-[11px] text-slate-400">
                Automated recurring ledger commitments
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form */}
        <form 
          onSubmit={handleSubmit} 
          className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 min-h-0 pb-32 sm:pb-8"
          style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
        >
          {/* Type Selector */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-[#0b0f15] rounded-2xl border border-slate-800/80">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                type === 'EXPENSE'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <TrendingDown size={14} />
              <span>Expense</span>
            </button>
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                type === 'INCOME'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <TrendingUp size={14} />
              <span>Income</span>
            </button>
            <button
              type="button"
              onClick={() => setType('TRANSFER')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                type === 'TRANSFER'
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <ArrowRightLeft size={14} />
              <span>Transfer</span>
            </button>
          </div>

          {/* Amount & Description */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Amount (INR) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-lg">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#0b0f15] border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-lg font-mono font-bold text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Description / Payee *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. House Rent, Netflix 4K, Tech Salary, Mutual Fund SIP"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#0b0f15] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          {/* Frequency & Cadence */}
          <div className="p-3.5 bg-[#0e141d] rounded-2xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Repeat size={13} />
                <span>Cadence & Recurrence Schedule</span>
              </span>
              <span className="text-[10px] text-slate-500">Auto-calculated</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'] as RecurringFrequency[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer text-center capitalize ${
                    frequency === f
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                      : 'bg-[#0b0f15] text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {f === 'BIWEEKLY' ? 'Bi-weekly' : f.toLowerCase()}
                </button>
              ))}
            </div>

            {/* Day of the Month (1 – 31) */}
            <div className="pt-1 space-y-2">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-amber-400" />
                  <span>Day of the Month (1 – 31) *</span>
                </span>
                <span className="text-[10px] font-mono text-amber-300 normal-case">
                  Day {numDay} ({getOrdinalSuffix(numDay)})
                </span>
              </label>

              <div className="flex items-center gap-3">
                <div className="relative w-24 shrink-0">
                  <input
                    type="number"
                    min={1}
                    max={31}
                    required
                    placeholder="2"
                    value={dayOfMonth}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setDayOfMonth('');
                        return;
                      }
                      const num = parseInt(val, 10);
                      if (!isNaN(num)) {
                        setDayOfMonth(Math.min(31, Math.max(1, num)));
                      }
                    }}
                    className="w-full bg-[#0b0f15] border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-center text-base font-bold font-mono text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
                  />
                </div>

                <div className="flex-1 text-[11px] text-slate-400 leading-snug">
                  Collects just the recurring day (e.g. choose <span className="text-amber-300 font-semibold">2</span> for 2nd day of the month).
                </div>
              </div>

              {/* Quick Select Day Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-500 font-semibold mr-1">Quick pick:</span>
                {[1, 2, 5, 7, 10, 15, 20, 25, 31].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDayOfMonth(d)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      numDay === d
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                        : 'bg-[#0b0f15] text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {d === 31 ? 'Last Day' : `${d}${d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'}`}
                  </button>
                ))}
              </div>

              {/* Live Scheduled Due Date Calculation Badge */}
              <div className="p-2.5 rounded-xl bg-[#0b0f15]/90 border border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock size={13} className="text-amber-400 shrink-0" />
                  <span>Next automatic post:</span>
                </div>
                <div className="font-mono font-bold text-amber-300 flex items-center gap-1.5">
                  <span>{formatDisplayDate(computedNextDueDate)}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400/90 border border-amber-500/20 font-sans font-medium">
                    Auto
                  </span>
                </div>
              </div>
            </div>

            {/* Optional End Date */}
            <div className="pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={hasEndDate}
                  onChange={(e) => setHasEndDate(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span>Set expiration / end date</span>
              </label>

              {hasEndDate && (
                <div className="mt-2">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[#0b0f15] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Account & Flow */}
          <div className="p-3.5 bg-[#0e141d] rounded-2xl border border-slate-800/80 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CreditCard size={13} />
              <span>Accounts & Routing</span>
            </span>

            {type === 'TRANSFER' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    From Source Account
                  </label>
                  <select
                    value={fromAccountId}
                    onChange={(e) => setFromAccountId(e.target.value)}
                    className="w-full bg-[#0b0f15] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition cursor-pointer"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatCurrency(a.balance)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    To Destination Account
                  </label>
                  <select
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    className="w-full bg-[#0b0f15] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition cursor-pointer"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatCurrency(a.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : type === 'EXPENSE' ? (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Debited Account
                </label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full bg-[#0b0f15] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition cursor-pointer"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.balance)})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Credited Account
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full bg-[#0b0f15] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition cursor-pointer"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.balance)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Category (if not transfer) */}
            {type !== 'TRANSFER' && (
              <div className="pt-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Category</span>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCategory(!isAddingNewCategory)}
                    className="text-amber-400 hover:text-amber-300 text-[10px] lowercase transition cursor-pointer"
                  >
                    {isAddingNewCategory ? 'select existing' : '+ add new category'}
                  </button>
                </label>

                {isAddingNewCategory ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter new category name..."
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      className="flex-1 bg-[#0b0f15] border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                    />
                    <button
                      type="button"
                      onClick={handleConfirmNewCategory}
                      className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#0b0f15] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition cursor-pointer"
                  >
                    {availableCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
                {categoryError && <p className="text-rose-400 text-[10px] mt-1">{categoryError}</p>}
              </div>
            )}
          </div>

          {/* Automation & Active Controls */}
          <div className="p-3.5 bg-[#0e141d] rounded-2xl border border-slate-800/80 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Zap size={13} className="text-amber-400" />
              <span>Automated Execution Rules</span>
            </span>

            <div className="space-y-2.5">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPost}
                  onChange={(e) => setAutoPost(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <div className="text-xs">
                  <div className="text-white font-semibold flex items-center gap-1.5">
                    <span>Automatically post static entry</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                      Recommended
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    When you open the app on or after the expected due date, this transaction is automatically recorded into your ledger and account balances update automatically.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer pt-1 border-t border-slate-800/60">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <div className="text-xs">
                  <div className="text-white font-semibold">Active rule</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Uncheck to temporarily pause this recurrence without deleting it.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Notes & Metadata (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. UPI ID, landlord bank account, subscription renewal plan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#0b0f15] border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition resize-none"
            />
          </div>

          {/* Delete confirmation section */}
          {showDeleteConfirm && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-2 text-xs">
              <p className="text-rose-200 font-medium">
                Are you sure you want to delete this recurring rule? Previously recorded static transactions in your ledger will not be deleted.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isSaving}
                  className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold transition text-xs cursor-pointer"
                >
                  Yes, Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Bottom Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3">
            {initialData && onDelete ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSaving}
                className="py-2.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Trash2 size={15} />
                <span>Delete</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Check size={15} strokeWidth={2.5} />
                <span>{initialData ? 'Update Rule' : 'Save Recurring Rule'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
