import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Fuel, ArrowRightLeft, TrendingDown, TrendingUp, Plus, Pencil } from 'lucide-react';
import { 
  DEFAULT_CATEGORIES, 
  getAllExpenseCategories, 
  addCustomExpenseCategory, 
  formatCurrency, 
  getTodayLocalDateString 
} from '../../utils/formatters';
import type { Account, Transaction, TransactionType, Vehicle } from '../../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (txn: Omit<Transaction, 'id'> & { id?: string }) => Promise<void>;
  onDelete?: (txn: Transaction) => Promise<void>;
  initialData?: Transaction | null;
  accounts: Account[];
  vehicles: Vehicle[];
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  accounts,
  vehicles
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(!initialData);
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
  const [date, setDate] = useState<string>(getTodayLocalDateString());
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
      return;
    }

    const isNewlyOpening = !prevIsOpenRef.current;
    const isDifferentTxn = initialData?.id !== prevTxnIdRef.current;

    if (isNewlyOpening || isDifferentTxn) {
      prevIsOpenRef.current = true;
      prevTxnIdRef.current = initialData?.id;

      const cats = getAllExpenseCategories(initialData?.category ? [initialData.category] : []);
      setAvailableCategories(cats);
      setIsAddingNewCategory(false);
      setNewCategoryInput('');
      setCategoryError('');
      setIsEditing(!initialData);

      if (initialData) {
        setType(initialData.type);
        setAmount(String(initialData.amount || ''));
        setDescription(initialData.description || '');
        setCategory(initialData.category || 'Other');
        setFromAccountId(initialData.fromAccountId || '');
        setToAccountId(initialData.toAccountId || '');
        setDate(initialData.date || getTodayLocalDateString());
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
        setDate(getTodayLocalDateString());
        setVehicleId('');
        setIsFuel(false);
        setFuelLiters('');
        setOdometer('');
        setNotes('');
      }
    }
  }, [isOpen, initialData?.id]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Guard: ignore if not in editing mode or if the edit button was tapped less than 400ms ago
    if (!isEditing) return;
    if (Date.now() - justSwitchedToEditRef.current < 400) {
      return;
    }

    const numAmt = parseFloat(amount);
    if (!numAmt || numAmt <= 0) return;

    const isFuelRecord = type === 'EXPENSE' && category === 'Fuel';

    setIsSaving(true);
    try {
      await onSave({
        id: initialData?.id ? initialData.id : undefined,
        type,
        amount: numAmt,
        description: description.trim() || `${category} Record`,
        category: type === 'TRANSFER' ? 'Transfer' : category,
        fromAccountId: (type === 'EXPENSE' || type === 'TRANSFER') ? fromAccountId : null,
        toAccountId: (type === 'INCOME' || type === 'TRANSFER') ? toAccountId : null,
        date,
        timestamp: initialData?.timestamp || Date.now(),
        vehicleId: isFuelRecord ? (vehicleId || null) : null,
        isFuel: isFuelRecord,
        fuelLiters: isFuelRecord && fuelLiters ? parseFloat(fuelLiters) : null,
        odometer: isFuelRecord && odometer ? parseFloat(odometer) : null,
        notes: notes.trim()
      });
      onClose();
    } catch (err) {
      console.error('Error saving transaction:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData || !onDelete) return;
    setIsSaving(true);
    try {
      await onDelete(initialData);
      onClose();
    } catch (err) {
      console.error('Error deleting transaction:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121820] w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#161d26]">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold text-base">
              {!initialData ? 'New Transaction' : isEditing ? 'Edit Transaction' : 'Transaction Details'}
            </span>
            {initialData && !isEditing && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700/80">
                View Mode
              </span>
            )}
            <span className="text-xs text-slate-400 hidden sm:inline">| Chuvadi Ledger</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Type Toggle */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 rounded-2xl border border-slate-800">
            <button
              type="button"
              disabled={!isEditing}
              onClick={() => setType('EXPENSE')}
              className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition ${
                type === 'EXPENSE'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : isEditing
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 opacity-40 cursor-default'
              }`}
            >
              <TrendingDown size={14} />
              <span>Expense</span>
            </button>
            <button
              type="button"
              disabled={!isEditing}
              onClick={() => setType('INCOME')}
              className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition ${
                type === 'INCOME'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : isEditing
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 opacity-40 cursor-default'
              }`}
            >
              <TrendingUp size={14} />
              <span>Income</span>
            </button>
            <button
              type="button"
              disabled={!isEditing}
              onClick={() => setType('TRANSFER')}
              className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition ${
                type === 'TRANSFER'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : isEditing
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 opacity-40 cursor-default'
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
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-amber-400">
                ₹
              </span>
              <input
                id="txn-modal-amount"
                type="number"
                step="any"
                required
                disabled={!isEditing}
                readOnly={!isEditing}
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#0e131a] disabled:bg-[#090d12] border border-slate-700/80 disabled:border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-2xl font-bold text-white font-mono focus:outline-none focus:border-amber-500 transition disabled:cursor-default"
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
              disabled={!isEditing}
              readOnly={!isEditing}
              placeholder="e.g. Petrol Shell, Supermarket, Monthly Rent"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0e131a] disabled:bg-[#090d12] border border-slate-700/80 disabled:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition disabled:cursor-default"
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
                disabled={!isEditing}
                className="w-full bg-[#0e131a] disabled:bg-[#090d12] border border-slate-700/80 disabled:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition disabled:cursor-default"
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
                disabled={!isEditing}
                className="w-full bg-[#0e131a] disabled:bg-[#090d12] border border-slate-700/80 disabled:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition disabled:cursor-default"
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
                  disabled={!isEditing}
                  className="w-full bg-[#0e131a] disabled:bg-[#090d12] border border-slate-700/80 disabled:border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 disabled:cursor-default"
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
                  disabled={!isEditing}
                  className="w-full bg-[#0e131a] disabled:bg-[#090d12] border border-slate-700/80 disabled:border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 disabled:cursor-default"
                >
                  <option value="">Destination</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Date & Category Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={date}
                disabled={!isEditing}
                readOnly={!isEditing}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#0e131a] disabled:bg-[#090d12] border border-slate-700/80 disabled:border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 disabled:cursor-default"
              />
            </div>
            {type !== 'TRANSFER' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Category
                  </label>
                  {isEditing && !isAddingNewCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNewCategory(true);
                        setNewCategoryInput('');
                        setCategoryError('');
                      }}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors"
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
                        className="p-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors shrink-0"
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
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors shrink-0"
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
                    disabled={!isEditing}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full bg-[#0e131a] disabled:bg-[#090d12] border border-slate-700/80 disabled:border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 disabled:cursor-default"
                  >
                    {availableCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    {isEditing && (
                      <option value="__NEW_CATEGORY__">+ Add New Category...</option>
                    )}
                  </select>
                )}
              </div>
            )}
          </div>

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
                    disabled={!isEditing}
                    onChange={(e) => {
                      const vId = e.target.value;
                      setVehicleId(vId);
                      const sel = vehicles.find(v => v.id === vId);
                      if (sel && sel.currentOdometer && !odometer) {
                        setOdometer(String(sel.currentOdometer));
                      }
                    }}
                    className="w-full bg-[#0e131a] disabled:bg-[#090d12] border border-slate-700/80 disabled:border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 disabled:cursor-default"
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
                    disabled={!isEditing}
                    readOnly={!isEditing}
                    placeholder="e.g. 15400"
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                    className="w-full bg-[#0e131a] disabled:bg-[#090d12] border border-slate-700/80 disabled:border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500 disabled:cursor-default"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Fuel (Liters)
                  </label>
                  <input
                    type="number"
                    step="any"
                    disabled={!isEditing}
                    readOnly={!isEditing}
                    placeholder="e.g. 15.5"
                    value={fuelLiters}
                    onChange={(e) => setFuelLiters(e.target.value)}
                    className="w-full bg-[#0e131a] disabled:bg-[#090d12] border border-slate-700/80 disabled:border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500 disabled:cursor-default"
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
              disabled={!isEditing}
              readOnly={!isEditing}
              placeholder="Additional remarks..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#0e131a] disabled:bg-[#090d12] border border-slate-700/80 disabled:border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition resize-none disabled:cursor-default"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            {initialData && onDelete && (
              <button
                key="delete-txn-btn"
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={15} />
                <span>Delete</span>
              </button>
            )}

            {!isEditing && initialData ? (
              <button
                key="close-view-btn"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            ) : (
              <button
                key="cancel-edit-btn"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (initialData) {
                    setIsEditing(false);
                  } else {
                    onClose();
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                {initialData ? 'Cancel' : 'Close'}
              </button>
            )}

            {!isEditing ? (
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
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Pencil size={15} strokeWidth={2.5} />
                <span>Edit</span>
              </button>
            ) : (
              <button
                key="save-changes-submit-btn"
                id="save-transaction-btn"
                type="submit"
                disabled={isSaving || !amount}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Check size={16} strokeWidth={2.5} />
                <span>{isSaving ? 'Committing...' : initialData ? 'Save Changes' : 'Save Record'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
