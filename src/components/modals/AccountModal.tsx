import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Landmark, Wallet, CreditCard, PiggyBank } from 'lucide-react';
import type { Account, AccountType } from '../../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (acc: Omit<Account, 'id'> & { id?: string }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  initialData?: Account | null;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('BANK');
  const [balance, setBalance] = useState('');
  const [institution, setInstitution] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [color, setColor] = useState('#0284c7');
  const [isSaving, setIsSaving] = useState(false);

  const colors = [
    '#0284c7', // Sky blue
    '#ea580c', // Orange
    '#10b981', // Emerald
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#f59e0b', // Amber
    '#64748b'  // Slate
  ];

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setBalance(String(initialData.balance));
      setInstitution(initialData.institution || '');
      setAccountNumber(initialData.accountNumber || '');
      setColor(initialData.color || '#0284c7');
    } else {
      setName('');
      setType('BANK');
      setBalance('0');
      setInstitution('');
      setAccountNumber('');
      setColor('#0284c7');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        id: initialData?.id,
        name: name.trim(),
        type,
        balance: parseFloat(balance) || 0,
        institution: institution.trim() || undefined,
        accountNumber: accountNumber.trim() || undefined,
        color
      });
      onClose();
    } catch (err) {
      console.error('Error saving account:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData || !onDelete) return;
    if (!window.confirm(`Delete account "${initialData.name}"? Transactions associated will remain.`)) return;
    setIsSaving(true);
    try {
      await onDelete(initialData.id);
      onClose();
    } catch (err) {
      console.error('Error deleting account:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121820] w-full max-w-md rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#161d26]">
          <div className="text-amber-300 font-bold text-base">
            {initialData ? 'Edit Account' : 'New Account'}
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Account Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. HDFC Salary, Cash in Hand"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0e131a] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Account Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
                className="w-full bg-[#0e131a] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="BANK">Bank Account</option>
                <option value="CASH">Cash & Wallet</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="INVESTMENT">Investment / Mutual Fund</option>
                <option value="LOAN">Loan</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Current Balance (₹)
              </label>
              <input
                type="number"
                step="any"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full bg-[#0e131a] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Bank / Provider
              </label>
              <input
                type="text"
                placeholder="e.g. HDFC, SBI"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full bg-[#0e131a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Last 4 Digits
              </label>
              <input
                type="text"
                placeholder="e.g. 4589"
                maxLength={4}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full bg-[#0e131a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          {/* Color Tag */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Card Color Accent
            </label>
            <div className="flex items-center gap-2">
              {colors.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-3">
            {initialData && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-bold"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400"
            >
              {isSaving ? 'Saving...' : 'Save Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
