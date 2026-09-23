import React, { useState, useMemo } from 'react';
import { 
  Dumbbell, 
  Plus, 
  Calendar, 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  Activity,
  Flame,
  Clock,
  ChevronRight,
  Filter
} from 'lucide-react';
import type { ExerciseLog } from '../../types';
import { formatDate } from '../../utils/formatters';

interface ExerciseLogViewProps {
  logs: ExerciseLog[];
  onSaveLog: (log: Omit<ExerciseLog, 'id'> & { id?: string }) => Promise<void>;
  onDeleteLog: (id: string) => Promise<void>;
}

export const ExerciseLogView: React.FC<ExerciseLogViewProps> = ({
  logs,
  onSaveLog,
  onDeleteLog
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<ExerciseLog | null>(null);

  // Form State: strictly 2 fields as requested: date & exercise desc
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Open modal for adding a new log
  const handleOpenAdd = () => {
    setEditingLog(null);
    setDate(new Date().toISOString().slice(0, 10));
    setDescription('');
    setIsModalOpen(true);
  };

  // Open modal for editing an existing log
  const handleOpenEdit = (log: ExerciseLog) => {
    setEditingLog(log);
    setDate(log.date);
    setDescription(log.description);
    setIsModalOpen(true);
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !date) return;

    setIsSubmitting(true);
    try {
      await onSaveLog({
        ...(editingLog ? { id: editingLog.id } : {}),
        date,
        description: description.trim()
      });
      setIsModalOpen(false);
      setEditingLog(null);
      setDescription('');
    } catch (err) {
      console.error('Failed to save exercise log:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Confirmation
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this exercise log?')) {
      setDeletingId(id);
      try {
        await onDeleteLog(id);
      } catch (err) {
        console.error('Failed to delete exercise log:', err);
      } finally {
        setDeletingId(null);
      }
    }
  };

  // Sorted and filtered logs
  const filteredLogs = useMemo(() => {
    let result = [...logs].sort((a, b) => b.date.localeCompare(a.date));
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(log => 
        log.description.toLowerCase().includes(term) ||
        log.date.includes(term)
      );
    }
    return result;
  }, [logs, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const totalCount = logs.length;
    const uniqueDays = new Set(logs.map(l => l.date)).size;
    const currentMonthPrefix = new Date().toISOString().slice(0, 7);
    const thisMonthCount = logs.filter(l => l.date.startsWith(currentMonthPrefix)).length;
    return { totalCount, uniqueDays, thisMonthCount };
  }, [logs]);

  // Helper for humanized relative date label
  const formatFriendlyDate = (dateStr: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
      }
    } catch (e) {
      // fallback
    }
    return formatDate(dateStr);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121820] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <Dumbbell size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                Exercise Log
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Record and track daily workouts, fitness routines, and activity notes
            </p>
          </div>
        </div>

        {/* Add Log Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="add-exercise-log-btn"
            onClick={handleOpenAdd}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition active:scale-95"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Add Log</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
        <div className="p-3 sm:p-4 rounded-2xl bg-[#121820] border border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Activity size={18} />
          </div>
          <div className="min-w-0 flex-1 flex sm:block items-center justify-between sm:justify-start">
            <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Logs
            </div>
            <div className="text-lg sm:text-xl font-bold text-slate-100 font-mono">
              {stats.totalCount}
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-[#121820] border border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Flame size={18} />
          </div>
          <div className="min-w-0 flex-1 flex sm:block items-center justify-between sm:justify-start">
            <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Days
            </div>
            <div className="text-lg sm:text-xl font-bold text-amber-300 font-mono">
              {stats.uniqueDays}
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-[#121820] border border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
            <Clock size={18} />
          </div>
          <div className="min-w-0 flex-1 flex sm:block items-center justify-between sm:justify-start">
            <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
              This Month
            </div>
            <div className="text-lg sm:text-xl font-bold text-sky-300 font-mono">
              {stats.thisMonthCount}
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#121820] p-3 sm:p-3.5 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search exercise descriptions or dates..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#171f2a] border border-slate-700/80 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="text-xs text-slate-400 font-medium px-2 shrink-0">
          Showing <span className="text-slate-200 font-bold">{filteredLogs.length}</span> of {logs.length} entries
        </div>
      </div>

      {/* Logs Timeline List */}
      {filteredLogs.length === 0 ? (
        <div className="bg-[#121820] rounded-2xl sm:rounded-3xl border border-slate-800 p-8 sm:p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
            <Dumbbell size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-200 mb-1">
            {searchTerm ? 'No matching exercise logs found' : 'No exercise logs recorded yet'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mb-6">
            {searchTerm 
              ? 'Try searching with another keyword or clear the search input.' 
              : 'Keep track of your physical activities, workouts, walks, or sports by adding your first daily log.'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 transition active:scale-95"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Add First Log</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const isDeleting = deletingId === log.id;
            const friendlyDate = formatFriendlyDate(log.date);

            return (
              <div
                key={log.id}
                id={`exercise-log-item-${log.id}`}
                className="bg-[#121820] hover:bg-[#151c26] transition-all p-4 sm:p-5 rounded-2xl border border-slate-800/90 shadow-md group relative flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4"
              >
                {/* Date Badge & Friendly Name */}
                <div className="flex items-center sm:flex-col sm:items-start gap-2.5 sm:gap-1 shrink-0 sm:w-40">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-bold font-mono">
                    <Calendar size={13} className="text-amber-400" />
                    <span>{log.date}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 sm:pl-0.5">
                    {friendlyDate}
                  </span>
                </div>

                {/* Exercise Description Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm sm:text-base text-slate-200 font-medium leading-relaxed whitespace-pre-wrap">
                    {log.description}
                  </div>
                </div>

                {/* Actions: Edit & Delete */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 opacity-90 sm:opacity-40 group-hover:opacity-100 transition pt-1 sm:pt-0">
                  <button
                    onClick={() => handleOpenEdit(log)}
                    className="p-2 rounded-xl bg-[#171f2a] hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition"
                    title="Edit exercise log"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(log.id)}
                    disabled={isDeleting}
                    className="p-2 rounded-xl bg-[#171f2a] hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:border-rose-900/50 transition disabled:opacity-50"
                    title="Delete exercise log"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT EXERCISE LOG                            */}
      {/* Contains strictly 2 fields as requested: date & desc     */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121820] w-full max-w-lg rounded-2xl sm:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-[#161d26]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Dumbbell size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base">
                    {editingLog ? 'Edit Exercise Log' : 'Add Exercise Log'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Record your workout for the day
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Form Body: 2 Fields: Date & Exercise Desc */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Field 1: Date */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Date <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    id="exercise-log-date-input"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#171f2a] border border-slate-700 text-slate-100 font-mono text-sm focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* Field 2: Exercise Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Exercise Description <span className="text-amber-400">*</span>
                </label>
                <textarea
                  id="exercise-log-desc-input"
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 5 km morning jog in 28 mins, 3 sets of 20 pushups, 50 squats and 10 mins core stretching."
                  className="w-full px-4 py-3 rounded-xl bg-[#171f2a] border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition resize-none placeholder-slate-500 leading-relaxed"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Describe what exercise, workout, reps, or physical activity you did.
                </p>
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  id="exercise-log-save-btn"
                  type="submit"
                  disabled={isSubmitting || !description.trim() || !date}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition active:scale-95 disabled:opacity-50"
                >
                  <Check size={16} strokeWidth={2.5} />
                  <span>{isSubmitting ? 'Saving...' : editingLog ? 'Update Log' : 'Save Log'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
