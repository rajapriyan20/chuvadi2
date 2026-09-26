import React, { useState, useMemo } from 'react';
import { 
  Dumbbell, 
  Plus, 
  Calendar, 
  Search, 
  Trash2, 
  X, 
  Check, 
  Activity,
  Flame,
  Clock,
  ChevronRight,
  User,
  CheckCircle2
} from 'lucide-react';
import type { ExerciseLog, BodyProfileLog } from '../../types';
import { formatDate } from '../../utils/formatters';
import { BodyProfileView } from './BodyProfileView';

interface ExerciseLogViewProps {
  logs: ExerciseLog[];
  onSaveLog: (log: Omit<ExerciseLog, 'id'> & { id?: string }) => Promise<void>;
  onDeleteLog: (id: string) => Promise<void>;
  bodyProfileLogs?: BodyProfileLog[];
  onSaveBodyProfile?: (log: Omit<BodyProfileLog, 'id'> & { id?: string }) => Promise<void>;
  onDeleteBodyProfile?: (id: string) => Promise<void>;
}

export const ExerciseLogView: React.FC<ExerciseLogViewProps> = ({
  logs,
  onSaveLog,
  onDeleteLog,
  bodyProfileLogs = [],
  onSaveBodyProfile = async () => {},
  onDeleteBodyProfile = async () => {}
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'workouts' | 'body_profile'>('workouts');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<ExerciseLog | null>(null);

  // Form State: date & exercise description
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

  // Open modal for editing an existing log (triggered by clicking row)
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

  // Handle Deletion from within edit modal
  const handleDeleteFromModal = async () => {
    if (!editingLog) return;
    if (!confirm('Are you sure you want to delete this exercise log?')) return;

    setDeletingId(editingLog.id);
    try {
      await onDeleteLog(editingLog.id);
      setIsModalOpen(false);
      setEditingLog(null);
    } catch (err) {
      console.error('Failed to delete exercise log:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Filter logs by search term
  const filteredLogs = useMemo(() => {
    let result = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (l) => l.description.toLowerCase().includes(q) || l.date.includes(q)
      );
    }
    return result;
  }, [logs, searchTerm]);

  // Quick statistics
  const stats = useMemo(() => {
    const totalCount = logs.length;
    const now = new Date();
    const currentMonthPrefix = now.toISOString().slice(0, 7); // YYYY-MM
    const thisMonthCount = logs.filter((l) => l.date.startsWith(currentMonthPrefix)).length;
    const uniqueDays = new Set(logs.map((l) => l.date)).size;

    return { totalCount, thisMonthCount, uniqueDays };
  }, [logs]);

  // Format date helper
  const formatFriendlyDate = (dStr: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterdayDate = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (dStr === today) return 'Today';
    if (dStr === yesterdayDate) return 'Yesterday';
    return formatDate(dStr);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header and Sub-Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Dumbbell size={20} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Fitness & Physical Wellness</span>
            </h2>
            <div className="text-xs text-slate-400">
              Track daily workouts and monthly body recomposition
            </div>
          </div>
        </div>

        {/* Sub-Tabs Switcher */}
        <div className="flex items-center p-1 bg-[#121820] rounded-2xl border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('workouts')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'workouts'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity size={14} />
            <span>Workouts ({logs.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('body_profile')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition relative ${
              activeSubTab === 'body_profile'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User size={14} />
            <span>Body Profile</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono uppercase font-bold ${
              activeSubTab === 'body_profile' ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-500/20 text-amber-300'
            }`}>
              1st of Mo
            </span>
          </button>
        </div>
      </div>

      {/* RENDER BODY PROFILE VIEW */}
      {activeSubTab === 'body_profile' ? (
        <BodyProfileView
          logs={bodyProfileLogs}
          onSaveLog={onSaveBodyProfile}
          onDeleteLog={onDeleteBodyProfile}
        />
      ) : (
        /* RENDER COMPACT WORKOUT LOGS VIEW */
        <div className="space-y-5">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-2xl bg-[#121820] border border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300 shrink-0">
                <Activity size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">
                  Total Logs
                </div>
                <div className="text-base sm:text-xl font-bold text-slate-100 font-mono">
                  {stats.totalCount}
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-[#121820] border border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Flame size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">
                  Active Days
                </div>
                <div className="text-base sm:text-xl font-bold text-amber-300 font-mono">
                  {stats.uniqueDays}
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-[#121820] border border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                <Clock size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">
                  This Month
                </div>
                <div className="text-base sm:text-xl font-bold text-sky-300 font-mono">
                  {stats.thisMonthCount}
                </div>
              </div>
            </div>
          </div>

          {/* Search & Add Action Bar */}
          <div className="flex items-center justify-between gap-3 bg-[#121820] p-2.5 sm:p-3 rounded-2xl border border-slate-800">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search workouts..."
                className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-[#171f2a] border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition active:scale-95 shrink-0"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Log Workout</span>
            </button>
          </div>

          {/* COMPACT WORKOUT LOGS LIST */}
          {filteredLogs.length === 0 ? (
            <div className="bg-[#121820] rounded-2xl border border-slate-800 p-8 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
                <Dumbbell size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-200 mb-1">
                {searchTerm ? 'No matching workout logs found' : 'No workout logs recorded yet'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                Record your daily exercises, gym sessions, sports, or runs. Click to add a log!
              </p>
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>Add First Log</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
                <span>Showing {filteredLogs.length} logs</span>
                <span>Click any record to edit or delete</span>
              </div>

              {filteredLogs.map((log) => {
                const friendlyDate = formatFriendlyDate(log.date);

                return (
                  <div
                    key={log.id}
                    id={`exercise-log-item-${log.id}`}
                    onClick={() => handleOpenEdit(log)}
                    className="bg-[#121820] hover:bg-[#161d28] active:bg-[#1a2230] transition-all p-3 sm:p-3.5 rounded-xl border border-slate-800/80 hover:border-slate-700/90 shadow-sm cursor-pointer group flex items-center justify-between gap-3"
                  >
                    {/* Compact Date Badge */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-bold font-mono">
                        <Calendar size={11} className="text-amber-400" />
                        <span>{log.date}</span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
                        ({friendlyDate})
                      </span>
                    </div>

                    {/* Compact Description Preview */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-slate-200 font-medium truncate group-hover:text-white transition">
                        {log.description}
                      </p>
                    </div>

                    {/* Subtle Chevron indicator */}
                    <div className="shrink-0 flex items-center text-slate-500 group-hover:text-amber-400 transition-transform group-hover:translate-x-0.5">
                      <ChevronRight size={15} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT WORKOUT LOG (CARD WITH SAVE & DELETE)   */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121820] w-full max-w-lg rounded-2xl sm:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-[#161d26]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400">
                  <Dumbbell size={16} />
                </div>
                <h3 className="text-sm font-bold text-slate-100">
                  {editingLog ? 'Edit Workout Record' : 'Record Workout'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#171f2a] border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Exercise / Workout Description *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Chest & Triceps: 4x Bench press (60kg), 3x Incline dumbbell press, 3x Tricep pushdowns. 20 min cycling."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#171f2a] border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                />
              </div>

              {/* CARD ACTION BUTTONS: SAVE & DELETE (AS REQUESTED) */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800">
                {editingLog ? (
                  <button
                    type="button"
                    onClick={handleDeleteFromModal}
                    disabled={deletingId === editingLog.id || isSubmitting}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-bold transition disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    <span>Delete Log</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !description.trim()}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} />
                    <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
