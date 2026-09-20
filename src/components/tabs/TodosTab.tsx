import React, { useState } from 'react';
import { Plus, Pin, Trash2, CheckSquare, Search, Edit3 } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import type { TodoNote } from '../../types';

interface TodosTabProps {
  todos: TodoNote[];
  onOpenNewTodo: () => void;
  onEditTodo: (todo: TodoNote) => void;
  onToggleTodoItem: (noteId: string, itemId: string) => void;
  onTogglePin: (todo: TodoNote) => void;
  onDeleteTodo: (id: string) => void;
}

export const TodosTab: React.FC<TodosTabProps> = ({
  todos,
  onOpenNewTodo,
  onEditTodo,
  onToggleTodoItem,
  onTogglePin,
  onDeleteTodo
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const colorClasses: Record<string, { bg: string; border: string; badge: string }> = {
    amber: { bg: 'bg-[#18150f]', border: 'border-amber-700/40', badge: 'text-amber-300' },
    emerald: { bg: 'bg-[#0f1712]', border: 'border-emerald-700/40', badge: 'text-emerald-300' },
    sky: { bg: 'bg-[#0f151c]', border: 'border-sky-700/40', badge: 'text-sky-300' },
    rose: { bg: 'bg-[#1a0f12]', border: 'border-rose-700/40', badge: 'text-rose-300' },
    indigo: { bg: 'bg-[#13101c]', border: 'border-indigo-700/40', badge: 'text-indigo-300' },
    zinc: { bg: 'bg-[#14171a]', border: 'border-slate-800', badge: 'text-slate-300' },
  };

  const filteredTodos = todos.filter(t => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      t.title.toLowerCase().includes(s) ||
      t.items.some(i => i.text.toLowerCase().includes(s))
    );
  });

  const pinnedNotes = filteredTodos.filter(t => t.pinned);
  const otherNotes = filteredTodos.filter(t => !t.pinned);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">Checklists & Notes</h2>
          <div className="text-xs text-slate-400">Keep tracks of tasks, vehicle checklists, and reminders</div>
        </div>

        <button
          onClick={onOpenNewTodo}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>New Checklist</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search checklists and tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#121820] border border-slate-800 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Pinned Notes Section */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
            <Pin size={13} />
            <span>Pinned Checklists</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pinnedNotes.map((note) => {
              const theme = colorClasses[note.color || 'amber'] || colorClasses.amber;
              const completedCount = note.items.filter(i => i.completed).length;

              return (
                <div
                  key={note.id}
                  className={`p-4 rounded-3xl border ${theme.bg} ${theme.border} shadow-sm flex flex-col justify-between space-y-3 transition`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <h3 className="text-xs font-bold text-white tracking-tight">{note.title}</h3>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onTogglePin(note)}
                          className="p-1 rounded-lg text-amber-400 hover:bg-slate-700/50"
                          title="Unpin"
                        >
                          <Pin size={14} />
                        </button>
                        <button
                          onClick={() => onEditTodo(note)}
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50"
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="mt-3 space-y-1.5">
                      {note.items.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => onToggleTodoItem(note.id, item.id)}
                          className="flex items-start gap-2 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={item.completed}
                            readOnly
                            className="mt-0.5 w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer pointer-events-none"
                          />
                          <span className={`text-xs ${item.completed ? 'line-through text-slate-500' : 'text-slate-200 group-hover:text-white'}`}>
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{completedCount}/{note.items.length} completed</span>
                    <span>{formatDate(note.updatedAt || note.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Other Notes Section */}
      <div className="space-y-3">
        {pinnedNotes.length > 0 && (
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Other Checklists
          </div>
        )}

        {otherNotes.length === 0 && pinnedNotes.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs bg-[#131922] rounded-3xl border border-slate-800">
            No checklists yet. Tap "+ New Checklist" to track your maintenance checkups, packing lists, or grocery runs.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {otherNotes.map((note) => {
              const theme = colorClasses[note.color || 'zinc'] || colorClasses.zinc;
              const completedCount = note.items.filter(i => i.completed).length;

              return (
                <div
                  key={note.id}
                  className={`p-4 rounded-3xl border ${theme.bg} ${theme.border} shadow-sm flex flex-col justify-between space-y-3 transition`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <h3 className="text-xs font-bold text-white tracking-tight">{note.title}</h3>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onTogglePin(note)}
                          className="p-1 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-700/50"
                          title="Pin note"
                        >
                          <Pin size={14} />
                        </button>
                        <button
                          onClick={() => onEditTodo(note)}
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete checklist "${note.title}"?`)) {
                              onDeleteTodo(note.id);
                            }
                          }}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-700/50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="mt-3 space-y-1.5">
                      {note.items.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => onToggleTodoItem(note.id, item.id)}
                          className="flex items-start gap-2 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={item.completed}
                            readOnly
                            className="mt-0.5 w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer pointer-events-none"
                          />
                          <span className={`text-xs ${item.completed ? 'line-through text-slate-500' : 'text-slate-200 group-hover:text-white'}`}>
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{completedCount}/{note.items.length} completed</span>
                    <span>{formatDate(note.updatedAt || note.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
