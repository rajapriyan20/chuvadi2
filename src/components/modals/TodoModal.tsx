import React, { useState, useEffect } from 'react';
import { X, Check, Plus, Trash2, Pin } from 'lucide-react';
import type { TodoNote, TodoItem } from '../../types';

interface TodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Omit<TodoNote, 'id'> & { id?: string }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  initialData?: TodoNote | null;
}

export const TodoModal: React.FC<TodoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData
}) => {
  const [title, setTitle] = useState('');
  const [items, setItems] = useState<TodoItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [color, setColor] = useState('amber');
  const [pinned, setPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const colors = [
    { id: 'amber', bg: 'bg-amber-950/40', border: 'border-amber-700/50', dot: 'bg-amber-500' },
    { id: 'emerald', bg: 'bg-emerald-950/40', border: 'border-emerald-700/50', dot: 'bg-emerald-500' },
    { id: 'sky', bg: 'bg-sky-950/40', border: 'border-sky-700/50', dot: 'bg-sky-500' },
    { id: 'rose', bg: 'bg-rose-950/40', border: 'border-rose-700/50', dot: 'bg-rose-500' },
    { id: 'indigo', bg: 'bg-indigo-950/40', border: 'border-indigo-700/50', dot: 'bg-indigo-500' },
    { id: 'zinc', bg: 'bg-zinc-900/60', border: 'border-zinc-700/50', dot: 'bg-zinc-500' },
  ];

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setItems(initialData.items || []);
      setColor(initialData.color || 'amber');
      setPinned(!!initialData.pinned);
    } else {
      setTitle('');
      setItems([{ id: '1', text: '', completed: false }]);
      setColor('amber');
      setPinned(false);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    setItems([...items, { id: String(Date.now()), text: newItemText.trim(), completed: false }]);
    setNewItemText('');
  };

  const handleToggleItem = (id: string) => {
    setItems(items.map(it => it.id === id ? { ...it, completed: !it.completed } : it));
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(it => it.id !== id));
  };

  const handleItemTextChange = (id: string, text: string) => {
    setItems(items.map(it => it.id === id ? { ...it, text } : it));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && items.length === 0) return;

    // Filter out empty items
    const validItems = items.filter(it => it.text.trim().length > 0);

    setIsSaving(true);
    try {
      await onSave({
        id: initialData?.id,
        title: title.trim() || 'Untitled Checklist',
        items: validItems,
        color,
        pinned,
        createdAt: initialData?.createdAt || Date.now(),
        updatedAt: Date.now()
      });
      onClose();
    } catch (err) {
      console.error('Error saving todo note:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121820] w-full max-w-md rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#161d26]">
          <div className="flex items-center gap-2">
            <span className="text-amber-300 font-bold text-base">
              {initialData ? 'Edit Checklist' : 'New Checklist'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPinned(!pinned)}
              className={`p-1.5 rounded-lg transition ${pinned ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white'}`}
              title={pinned ? 'Unpin note' : 'Pin to top'}
            >
              <Pin size={16} />
            </button>
            <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white">
              <X size={18} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <input
              type="text"
              required
              placeholder="Note Title (e.g. Weekly Car Inspection)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0e131a] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-base font-bold text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Checklist Items */}
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Tasks / Checkbox Items
            </label>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {items.map((it) => (
                <div key={it.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={it.completed}
                    onChange={() => handleToggleItem(it.id)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={it.text}
                    placeholder="List item..."
                    onChange={(e) => handleItemTextChange(it.id, e.target.value)}
                    className={`flex-1 bg-[#0a0e14] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white ${it.completed ? 'line-through text-slate-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(it.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new item field */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="+ Add another checklist item..."
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddItem();
                  }
                }}
                className="flex-1 bg-[#0e131a] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <button
                type="button"
                onClick={handleAddItem}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>

          {/* Color Palettes */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Note Card Color
            </label>
            <div className="flex items-center gap-2">
              {colors.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setColor(c.id)}
                  className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${color === c.id ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'}`}
                >
                  <span className={`w-5 h-5 rounded-full ${c.dot}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3">
            {initialData && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(initialData.id)}
                className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
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
              {isSaving ? 'Saving...' : 'Save Checklist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
