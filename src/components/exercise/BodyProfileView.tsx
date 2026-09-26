import React, { useState } from 'react';
import { 
  User, 
  Calendar, 
  Plus, 
  Scale, 
  TrendingDown, 
  TrendingUp, 
  Minus, 
  Sparkles, 
  Target, 
  ChevronRight, 
  X, 
  Trash2, 
  Info,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import type { BodyProfileLog, MeasurementGoal } from '../../types';
import { formatDate } from '../../utils/formatters';

interface BodyProfileViewProps {
  logs: BodyProfileLog[];
  onSaveLog: (log: Omit<BodyProfileLog, 'id'> & { id?: string }) => Promise<void>;
  onDeleteLog: (id: string) => Promise<void>;
}

export const BodyProfileView: React.FC<BodyProfileViewProps> = ({
  logs,
  onSaveLog,
  onDeleteLog
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<BodyProfileLog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    // Default to the 1st of current month if near start, or today
    return d.toISOString().slice(0, 10);
  });
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('MALE');
  const [heightCm, setHeightCm] = useState<string>('');
  const [weightKg, setWeightKg] = useState<string>('');
  const [weightGoal, setWeightGoal] = useState<MeasurementGoal>('DECREASE');
  
  const [stomachCircumferenceCm, setStomachCircumferenceCm] = useState<string>('');
  const [stomachGoal, setStomachGoal] = useState<MeasurementGoal>('DECREASE');
  
  const [thighCircumferenceCm, setThighCircumferenceCm] = useState<string>('');
  const [thighGoal, setThighGoal] = useState<MeasurementGoal>('MAINTAIN');
  
  const [bicepsCircumferenceCm, setBicepsCircumferenceCm] = useState<string>('');
  const [bicepsGoal, setBicepsGoal] = useState<MeasurementGoal>('INCREASE');
  
  const [jawlineVisibility, setJawlineVisibility] = useState<number>(7);
  const [jawlineGoal, setJawlineGoal] = useState<'IMPROVE' | 'MAINTAIN' | 'NONE'>('IMPROVE');
  
  const [focusItem1, setFocusItem1] = useState<string>('Stomach reduction');
  const [focusItem2, setFocusItem2] = useState<string>('Biceps growth');
  const [focusItem3, setFocusItem3] = useState<string>('Jawline definition');
  
  const [notes, setNotes] = useState<string>('');

  // Sorted logs (newest first)
  const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestLog = sortedLogs[0];
  const previousLog = sortedLogs[1];

  const handleOpenAdd = () => {
    setEditingLog(null);
    const d = new Date();
    // Auto-suggest the 1st of current month
    const defaultDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    setDate(defaultDate);
    
    // Prefill from latest log if available for convenience
    if (latestLog) {
      setAge(latestLog.age ? String(latestLog.age) : '');
      setGender(latestLog.gender || 'MALE');
      setHeightCm(latestLog.heightCm ? String(latestLog.heightCm) : '');
      setWeightKg(latestLog.weightKg ? String(latestLog.weightKg) : '');
      setWeightGoal(latestLog.weightGoal || 'DECREASE');
      setStomachCircumferenceCm(latestLog.stomachCircumferenceCm ? String(latestLog.stomachCircumferenceCm) : '');
      setStomachGoal(latestLog.stomachGoal || 'DECREASE');
      setThighCircumferenceCm(latestLog.thighCircumferenceCm ? String(latestLog.thighCircumferenceCm) : '');
      setThighGoal(latestLog.thighGoal || 'MAINTAIN');
      setBicepsCircumferenceCm(latestLog.bicepsCircumferenceCm ? String(latestLog.bicepsCircumferenceCm) : '');
      setBicepsGoal(latestLog.bicepsGoal || 'INCREASE');
      setJawlineVisibility(latestLog.jawlineVisibility || 7);
      setJawlineGoal(latestLog.jawlineGoal || 'IMPROVE');
      setFocusItem1(latestLog.focusItems?.[0] || 'Stomach reduction');
      setFocusItem2(latestLog.focusItems?.[1] || 'Biceps growth');
      setFocusItem3(latestLog.focusItems?.[2] || 'Jawline definition');
    } else {
      setAge('28');
      setGender('MALE');
      setHeightCm('175');
      setWeightKg('');
      setWeightGoal('DECREASE');
      setStomachCircumferenceCm('');
      setStomachGoal('DECREASE');
      setThighCircumferenceCm('');
      setThighGoal('MAINTAIN');
      setBicepsCircumferenceCm('');
      setBicepsGoal('INCREASE');
      setJawlineVisibility(7);
      setJawlineGoal('IMPROVE');
      setFocusItem1('Stomach reduction');
      setFocusItem2('Biceps growth');
      setFocusItem3('Jawline definition');
    }
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (log: BodyProfileLog) => {
    setEditingLog(log);
    setDate(log.date);
    setAge(log.age ? String(log.age) : '');
    setGender(log.gender || 'MALE');
    setHeightCm(log.heightCm ? String(log.heightCm) : '');
    setWeightKg(log.weightKg ? String(log.weightKg) : '');
    setWeightGoal(log.weightGoal || 'DECREASE');
    setStomachCircumferenceCm(log.stomachCircumferenceCm ? String(log.stomachCircumferenceCm) : '');
    setStomachGoal(log.stomachGoal || 'DECREASE');
    setThighCircumferenceCm(log.thighCircumferenceCm ? String(log.thighCircumferenceCm) : '');
    setThighGoal(log.thighGoal || 'MAINTAIN');
    setBicepsCircumferenceCm(log.bicepsCircumferenceCm ? String(log.bicepsCircumferenceCm) : '');
    setBicepsGoal(log.bicepsGoal || 'INCREASE');
    setJawlineVisibility(log.jawlineVisibility || 7);
    setJawlineGoal(log.jawlineGoal || 'IMPROVE');
    setFocusItem1(log.focusItems?.[0] || '');
    setFocusItem2(log.focusItems?.[1] || '');
    setFocusItem3(log.focusItems?.[2] || '');
    setNotes(log.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    setIsSubmitting(true);

    try {
      const focusItems = [focusItem1, focusItem2, focusItem3].map(s => s.trim()).filter(Boolean);

      await onSaveLog({
        id: editingLog?.id,
        date,
        age: age ? parseInt(age) : null,
        gender: gender || null,
        heightCm: heightCm ? parseFloat(heightCm) : null,
        weightKg: weightKg ? parseFloat(weightKg) : null,
        weightGoal,
        stomachCircumferenceCm: stomachCircumferenceCm ? parseFloat(stomachCircumferenceCm) : null,
        stomachGoal,
        thighCircumferenceCm: thighCircumferenceCm ? parseFloat(thighCircumferenceCm) : null,
        thighGoal,
        bicepsCircumferenceCm: bicepsCircumferenceCm ? parseFloat(bicepsCircumferenceCm) : null,
        bicepsGoal,
        jawlineVisibility: jawlineVisibility ? Number(jawlineVisibility) : null,
        jawlineGoal,
        focusItems: focusItems.length > 0 ? focusItems : undefined,
        notes: notes.trim() || undefined
      });

      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save body profile log:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this monthly body profile log?')) return;
    setDeletingId(id);
    try {
      await onDeleteLog(id);
      setIsModalOpen(false);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Reminder Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#161f2c] to-emerald-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <Info size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Monthly Body Recomposition Tracker</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                1st of Month
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Track your physique evolution, waistline, arms, and jawline definition. Add a new log every month on the <strong>1st</strong> for consistent comparisons!
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition active:scale-95 shrink-0 self-stretch sm:self-auto justify-center"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Log Monthly Profile</span>
        </button>
      </div>

      {/* Latest Snapshot & Progress Cards */}
      {latestLog && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Weight Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#121820] border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <Scale size={14} className="text-amber-400" />
                Weight
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Goal: {latestLog.weightGoal || 'DECREASE'}
              </span>
            </div>
            <div className="my-2">
              <span className="text-xl sm:text-2xl font-bold font-mono text-slate-100">
                {latestLog.weightKg ? `${latestLog.weightKg} kg` : '—'}
              </span>
            </div>
            {previousLog?.weightKg && latestLog.weightKg && (
              <div className="text-[11px] font-medium flex items-center gap-1 text-slate-400">
                {latestLog.weightKg < previousLog.weightKg ? (
                  <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
                    <TrendingDown size={13} />
                    {(previousLog.weightKg - latestLog.weightKg).toFixed(1)} kg down
                  </span>
                ) : latestLog.weightKg > previousLog.weightKg ? (
                  <span className="text-amber-400 flex items-center gap-0.5 font-bold">
                    <TrendingUp size={13} />
                    +{(latestLog.weightKg - previousLog.weightKg).toFixed(1)} kg
                  </span>
                ) : (
                  <span className="text-slate-400 flex items-center gap-0.5">
                    <Minus size={13} /> Unchanged
                  </span>
                )}
                <span className="text-[10px] text-slate-400">vs prev</span>
              </div>
            )}
          </div>

          {/* Stomach Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#121820] border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <Sliders size={14} className="text-emerald-400" />
                Waist
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Goal: {latestLog.stomachGoal || 'DECREASE'}
              </span>
            </div>
            <div className="my-2">
              <span className="text-xl sm:text-2xl font-bold font-mono text-slate-100">
                {latestLog.stomachCircumferenceCm ? `${latestLog.stomachCircumferenceCm} cm` : '—'}
              </span>
            </div>
            {previousLog?.stomachCircumferenceCm && latestLog.stomachCircumferenceCm && (
              <div className="text-[11px] font-medium flex items-center gap-1 text-slate-400">
                {latestLog.stomachCircumferenceCm < previousLog.stomachCircumferenceCm ? (
                  <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
                    <TrendingDown size={13} />
                    -{(previousLog.stomachCircumferenceCm - latestLog.stomachCircumferenceCm).toFixed(1)} cm
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-0.5 font-bold">
                    <TrendingUp size={13} />
                    +{(latestLog.stomachCircumferenceCm - previousLog.stomachCircumferenceCm).toFixed(1)} cm
                  </span>
                )}
                <span className="text-[10px] text-slate-400">vs prev</span>
              </div>
            )}
          </div>

          {/* Biceps Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#121820] border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-sky-400" />
                Biceps
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Goal: {latestLog.bicepsGoal || 'INCREASE'}
              </span>
            </div>
            <div className="my-2">
              <span className="text-xl sm:text-2xl font-bold font-mono text-slate-100">
                {latestLog.bicepsCircumferenceCm ? `${latestLog.bicepsCircumferenceCm} cm` : '—'}
              </span>
            </div>
            {previousLog?.bicepsCircumferenceCm && latestLog.bicepsCircumferenceCm && (
              <div className="text-[11px] font-medium flex items-center gap-1 text-slate-400">
                {latestLog.bicepsCircumferenceCm > previousLog.bicepsCircumferenceCm ? (
                  <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
                    <TrendingUp size={13} />
                    +{(latestLog.bicepsCircumferenceCm - previousLog.bicepsCircumferenceCm).toFixed(1)} cm
                  </span>
                ) : (
                  <span className="text-slate-400 flex items-center gap-0.5">
                    <Minus size={13} /> Maintained
                  </span>
                )}
                <span className="text-[10px] text-slate-400">vs prev</span>
              </div>
            )}
          </div>

          {/* Jawline Score Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#121820] border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <Target size={14} className="text-rose-400" />
                Jawline
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Scale 1-10
              </span>
            </div>
            <div className="my-2 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-bold font-mono text-rose-300">
                {latestLog.jawlineVisibility || '—'}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ 10</span>
            </div>
            {latestLog.focusItems && latestLog.focusItems.length > 0 && (
              <div className="text-[10px] text-slate-400 truncate">
                Focus: {latestLog.focusItems[0]}
              </div>
            )}
          </div>
        </div>
      )}

      {/* History List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Monthly Log History ({logs.length})
          </h3>
          <span className="text-[11px] text-slate-400">Click any card to edit details</span>
        </div>

        {sortedLogs.length === 0 ? (
          <div className="bg-[#121820] rounded-2xl border border-slate-800 p-8 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
              <User size={24} />
            </div>
            <h4 className="text-sm font-bold text-slate-200 mb-1">No monthly body profiles logged yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              Add your first body measurements baseline. All fields are optional!
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400"
            >
              Start Baseline Log
            </button>
          </div>
        ) : (
          sortedLogs.map((log) => {
            return (
              <div
                key={log.id}
                onClick={() => handleOpenEdit(log)}
                className="bg-[#121820] hover:bg-[#161d28] border border-slate-800/90 rounded-2xl p-4 cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono shrink-0">
                    <span className="text-[10px] uppercase font-bold text-amber-400">
                      {new Date(log.date).toLocaleString('default', { month: 'short' })}
                    </span>
                    <span className="text-sm font-bold">
                      {new Date(log.date).getDate()}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-200">
                        {formatDate(log.date)}
                      </span>
                      {log.age && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {log.age} yrs • {log.gender || 'M'}
                        </span>
                      )}
                    </div>
                    
                    {/* Measurements Pill Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-slate-300">
                      {log.weightKg && (
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700/60 font-mono">
                          ⚖️ {log.weightKg} kg
                        </span>
                      )}
                      {log.stomachCircumferenceCm && (
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700/60 font-mono">
                          Waist: {log.stomachCircumferenceCm} cm
                        </span>
                      )}
                      {log.bicepsCircumferenceCm && (
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700/60 font-mono">
                          Biceps: {log.bicepsCircumferenceCm} cm
                        </span>
                      )}
                      {log.jawlineVisibility && (
                        <span className="px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono">
                          Jawline: {log.jawlineVisibility}/10
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  {log.focusItems && log.focusItems.length > 0 && (
                    <div className="hidden md:flex items-center gap-1">
                      {log.focusItems.slice(0, 2).map((item, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                  <ChevronRight size={16} className="text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT BODY PROFILE LOG                        */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121820] w-full max-w-xl rounded-2xl sm:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-[#161d26]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400">
                  <User size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    {editingLog ? 'Edit Monthly Body Profile' : 'New Monthly Body Profile'}
                  </h3>
                  <p className="text-[11px] text-amber-400/90 font-medium">
                    📌 Recommended: Log on the 1st of every month
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Row 1: Date, Age, Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Log Date *
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
                    Age (years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    placeholder="e.g. 28"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#171f2a] border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#171f2a] border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Height & Weight with Goal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Approx Height (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 175"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#171f2a] border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Approx Weight (kg)
                    </label>
                    <select
                      value={weightGoal}
                      onChange={(e) => setWeightGoal(e.target.value as MeasurementGoal)}
                      className="text-[10px] bg-slate-800 text-amber-300 border border-slate-700 rounded px-1.5 py-0.5 focus:outline-none"
                    >
                      <option value="DECREASE">Goal: Decrease</option>
                      <option value="MAINTAIN">Goal: Maintain</option>
                      <option value="INCREASE">Goal: Increase</option>
                    </select>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 75.5"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#171f2a] border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Row 3: Circumferences (Stomach, Thighs, Biceps) */}
              <div className="p-3.5 rounded-2xl bg-[#161c24] border border-slate-800 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Body Circumference Measurements (cm)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Stomach */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-slate-300">Stomach / Waist</label>
                      <select
                        value={stomachGoal}
                        onChange={(e) => setStomachGoal(e.target.value as MeasurementGoal)}
                        className="text-[10px] bg-slate-800 text-amber-300 border border-slate-700 rounded px-1"
                      >
                        <option value="DECREASE">↓ Reduce</option>
                        <option value="MAINTAIN">= Keep</option>
                      </select>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 88"
                      value={stomachCircumferenceCm}
                      onChange={(e) => setStomachCircumferenceCm(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#171f2a] border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Thighs */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-slate-300">Thighs</label>
                      <select
                        value={thighGoal}
                        onChange={(e) => setThighGoal(e.target.value as MeasurementGoal)}
                        className="text-[10px] bg-slate-800 text-amber-300 border border-slate-700 rounded px-1"
                      >
                        <option value="MAINTAIN">= Keep</option>
                        <option value="INCREASE">↑ Grow</option>
                        <option value="DECREASE">↓ Reduce</option>
                      </select>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 56"
                      value={thighCircumferenceCm}
                      onChange={(e) => setThighCircumferenceCm(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#171f2a] border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Biceps */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-slate-300">Biceps / Arms</label>
                      <select
                        value={bicepsGoal}
                        onChange={(e) => setBicepsGoal(e.target.value as MeasurementGoal)}
                        className="text-[10px] bg-slate-800 text-amber-300 border border-slate-700 rounded px-1"
                      >
                        <option value="INCREASE">↑ Grow</option>
                        <option value="MAINTAIN">= Keep</option>
                      </select>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 35.5"
                      value={bicepsCircumferenceCm}
                      onChange={(e) => setBicepsCircumferenceCm(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#171f2a] border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Jawline Visibility (Scale 1 to 10) */}
              <div className="p-3.5 rounded-2xl bg-[#161c24] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <span>Jawline Visibility Score (1 - 10)</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono text-xs font-bold">
                      {jawlineVisibility} / 10
                    </span>
                  </label>
                  <select
                    value={jawlineGoal}
                    onChange={(e) => setJawlineGoal(e.target.value as any)}
                    className="text-[10px] bg-slate-800 text-rose-300 border border-slate-700 rounded px-1.5 py-0.5"
                  >
                    <option value="IMPROVE">Goal: Improve Definition</option>
                    <option value="MAINTAIN">Goal: Maintain</option>
                  </select>
                </div>

                <input
                  type="range"
                  min="1"
                  max="10"
                  value={jawlineVisibility}
                  onChange={(e) => setJawlineVisibility(parseInt(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>1 (Soft / Hidden)</span>
                  <span>5 (Moderate)</span>
                  <span>10 (Chiseled / Sharp)</span>
                </div>
              </div>

              {/* Row 5: Top 3 Focus Items */}
              <div className="p-3.5 rounded-2xl bg-[#161c24] border border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-slate-200">
                  Top 3 Focus Areas for Next Month
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Focus 1 (e.g. Stomach reduction)"
                    value={focusItem1}
                    onChange={(e) => setFocusItem1(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-[#171f2a] border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    placeholder="Focus 2 (e.g. Biceps growth)"
                    value={focusItem2}
                    onChange={(e) => setFocusItem2(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-[#171f2a] border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    placeholder="Focus 3 (e.g. Jawline definition)"
                    value={focusItem3}
                    onChange={(e) => setFocusItem3(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-[#171f2a] border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notes & Observations
                </label>
                <textarea
                  rows={2}
                  placeholder="Dietary changes, cardio routine, sleep quality, energy levels..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#171f2a] border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Action Buttons: Save & Delete */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800">
                {editingLog ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingLog.id)}
                    disabled={deletingId === editingLog.id || isSubmitting}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-bold transition disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    <span>Delete Record</span>
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
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} />
                    <span>{isSubmitting ? 'Saving...' : 'Save Profile'}</span>
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
