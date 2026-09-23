import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Fuel, ArrowRightLeft, TrendingDown, TrendingUp } from 'lucide-react';
import { DEFAULT_CATEGORIES, formatCurrency } from '../../utils/formatters';
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
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('Fuel');
  const [fromAccountId, setFromAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [vehicleId, setVehicleId] = useState<string>('');
  const [isFuel, setIsFuel] = useState<boolean>(false);
  const [fuelLiters, setFuelLiters] = useState<string>('');
  const [odometer, setOdometer] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmount(String(initialData.amount || ''));
      setDescription(initialData.description || '');
      setCategory(initialData.category || 'Other');
      setFromAccountId(initialData.fromAccountId || '');
      setToAccountId(initialData.toAccountId || '');
      setDate(initialData.date || new Date().toISOString().split('T')[0]);
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
      setDate(new Date().toISOString().split('T')[0]);
      setVehicleId('');
      setIsFuel(false);
      setFuelLiters('');
      setOdometer('');
      setNotes('');
    }
  }, [initialData, isOpen, accounts]);

  if (!isOpen) return null;

  const handleCategoryChange = (cat: string) => {
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
              {initialData ? 'Edit Entry' : 'New Transaction'}
            </span>
            <span className="text-xs text-slate-400">| Chuvadi Ledger</span>
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
              onClick={() => setType('EXPENSE')}
              className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition ${
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
              className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition ${
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
              className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition ${
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
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-amber-400">
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
                className="w-full bg-[#0e131a] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
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
                className="w-full bg-[#0e131a] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
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
                  className="w-full bg-[#0e131a] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
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
                  className="w-full bg-[#0e131a] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
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
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#0e131a] border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            {type !== 'TRANSFER' && (
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full bg-[#0e131a] border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  {DEFAULT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
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
                    onChange={(e) => {
                      const vId = e.target.value;
                      setVehicleId(vId);
                      const sel = vehicles.find(v => v.id === vId);
                      if (sel && sel.currentOdometer && !odometer) {
                        setOdometer(String(sel.currentOdometer));
                      }
                    }}
                    className="w-full bg-[#0e131a] border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
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
          <div className="flex items-center gap-3 pt-2">
            {initialData && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Trash2 size={15} />
                <span>Delete</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving || !amount}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Check size={16} strokeWidth={2.5} />
              <span>{isSaving ? 'Committing...' : 'Save Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
