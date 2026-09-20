import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import type { Entity } from '../../types';

interface EntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entity: Omit<Entity, 'id'>) => Promise<void>;
}

export const EntityModal: React.FC<EntityModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'RECEIVABLE' | 'PAYABLE'>('RECEIVABLE');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!name.trim() || !num) return;

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        type,
        amount: num,
        dueDate: dueDate || undefined,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined
      });
      onClose();
    } catch (err) {
      console.error('Error saving entity:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121820] w-full max-w-md rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#161d26]">
          <div className="text-amber-300 font-bold text-base">
            Track Debt / Receivable
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setType('RECEIVABLE')}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                type === 'RECEIVABLE'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400'
              }`}
            >
              They Owe Me (To Collect)
            </button>
            <button
              type="button"
              onClick={() => setType('PAYABLE')}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                type === 'PAYABLE'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400'
              }`}
            >
              I Owe Them (To Pay)
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Person or Organization Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul, Office Reimbursement, Landlord"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0e131a] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                required
                step="any"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#0e131a] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Expected Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[#0e131a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Contact / Phone
            </label>
            <input
              type="text"
              placeholder="Optional phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#0e131a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              placeholder="Why was this borrowed or lent?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#0e131a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
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
              {isSaving ? 'Saving...' : 'Track Debt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
