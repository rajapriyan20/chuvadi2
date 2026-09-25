import React, { useState, useMemo } from 'react';
import { 
  Heart, 
  Calendar as CalendarIcon, 
  Plus, 
  Settings, 
  Info, 
  Sparkles, 
  Activity, 
  TrendingUp, 
  Droplet, 
  Smile, 
  Moon, 
  Coffee, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Trash2, 
  Check, 
  Download, 
  ShieldCheck, 
  Zap, 
  Flame, 
  Eye, 
  EyeOff, 
  AlertCircle 
} from 'lucide-react';
import type { 
  MenstrualLog, 
  MenstrualPeriodRecord, 
  MenstrualCycleSettings, 
  FlowIntensity, 
  CrampSeverity, 
  MoodType, 
  CervicalMucus, 
  CyclePhase 
} from '../../types';

interface MenstrualTrackerTabProps {
  logs: MenstrualLog[];
  periods: MenstrualPeriodRecord[];
  settings: MenstrualCycleSettings;
  onSaveLog: (log: Omit<MenstrualLog, 'id'> & { id?: string }) => Promise<void>;
  onDeleteLog: (id: string) => Promise<void>;
  onSavePeriod: (period: Omit<MenstrualPeriodRecord, 'id'> & { id?: string }) => Promise<void>;
  onDeletePeriod: (id: string) => Promise<void>;
  onSaveSettings: (settings: MenstrualCycleSettings) => Promise<void>;
}

const COMMON_SYMPTOMS = [
  'Bloating',
  'Fatigue',
  'Headache',
  'Acne',
  'Food Cravings',
  'Breast Tenderness',
  'Lower Backache',
  'Insomnia',
  'Nausea',
  'Digestive Changes',
  'Hot Flashes',
  'Dizziness'
];

const CRAMP_LOCATIONS = [
  'Lower Abdomen',
  'Lower Back',
  'Inner Thighs',
  'Head / Migraine',
  'Joints'
];

const MOOD_OPTIONS: { id: MoodType; label: string; icon: string }[] = [
  { id: 'HAPPY', label: 'Happy', icon: '😊' },
  { id: 'CALM', label: 'Calm', icon: '😌' },
  { id: 'ENERGETIC', label: 'High Energy', icon: '⚡' },
  { id: 'SENSITIVE', label: 'Sensitive', icon: '🥺' },
  { id: 'IRRITABLE', label: 'Irritable', icon: '😤' },
  { id: 'ANXIOUS', label: 'Anxious', icon: '😰' },
  { id: 'TIRED', label: 'Exhausted', icon: '😴' },
  { id: 'MOOD_SWINGS', label: 'Mood Swings', icon: '🎭' }
];

export const MenstrualTrackerTab: React.FC<MenstrualTrackerTabProps> = ({
  logs,
  periods,
  settings,
  onSaveLog,
  onDeleteLog,
  onSavePeriod,
  onDeletePeriod,
  onSaveSettings
}) => {
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [calendarViewMonth, setCalendarViewMonth] = useState<Date>(new Date());
  
  // Modals
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDoctorReportModalOpen, setIsDoctorReportModalOpen] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  // Privacy Mode Toggle
  const [privacyMode, setPrivacyMode] = useState<boolean>(Boolean(settings.privacyMode));

  // Daily Log Form State
  const [logFormDate, setLogFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [logFormIsPeriod, setLogFormIsPeriod] = useState(false);
  const [logFormFlow, setLogFormFlow] = useState<FlowIntensity>('NONE');
  const [logFormCramps, setLogFormCramps] = useState<CrampSeverity>('NONE');
  const [logFormLocations, setLogFormLocations] = useState<string[]>([]);
  const [logFormMoods, setLogFormMoods] = useState<MoodType[]>([]);
  const [logFormSymptoms, setLogFormSymptoms] = useState<string[]>([]);
  const [logFormMucus, setLogFormMucus] = useState<CervicalMucus>('DRY');
  const [logFormTemp, setLogFormTemp] = useState<string>('');
  const [logFormWeight, setLogFormWeight] = useState<string>('');
  const [logFormWater, setLogFormWater] = useState<number>(8);
  const [logFormSleep, setLogFormSleep] = useState<number>(8);
  const [logFormNotes, setLogFormNotes] = useState<string>('');

  // Period Form State
  const [periodStartDate, setPeriodStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [periodEndDate, setPeriodEndDate] = useState('');
  const [periodNotes, setPeriodNotes] = useState('');
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);

  // Settings Form State
  const [cycleLengthVal, setCycleLengthVal] = useState<number>(settings.averageCycleLength || 28);
  const [periodDurationVal, setPeriodDurationVal] = useState<number>(settings.averagePeriodDuration || 5);
  const [lutealPhaseVal, setLutealPhaseVal] = useState<number>(settings.lutealPhaseLength || 14);

  // Sorted periods descending
  const sortedPeriods = useMemo(() => {
    return [...periods].sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [periods]);

  // Last Period Start Date
  const latestPeriod = sortedPeriods[0];
  const lastPeriodStart = latestPeriod?.startDate || settings.lastPeriodStartDate || new Date(Date.now() - 86400000 * 14).toISOString().split('T')[0];

  // Cycle Calculations
  const cycleMetrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(lastPeriodStart + 'T00:00:00');
    const diffMs = today.getTime() - startDate.getTime();
    const cycleDay = Math.floor(diffMs / 86400000) + 1;

    const avgCycle = settings.averageCycleLength || 28;
    const avgDuration = settings.averagePeriodDuration || 5;

    // Ovulation typically occurs 14 days before the next period
    const ovulationDay = Math.max(1, avgCycle - (settings.lutealPhaseLength || 14));
    const fertileStartDay = Math.max(1, ovulationDay - 5);
    const fertileEndDay = ovulationDay + 1;

    // Next period calculation
    const nextPeriodDate = new Date(startDate);
    nextPeriodDate.setDate(nextPeriodDate.getDate() + avgCycle);
    const daysUntilNext = Math.ceil((nextPeriodDate.getTime() - today.getTime()) / 86400000);

    // Current Phase identification
    let phase: CyclePhase = 'FOLLICULAR';
    if (cycleDay <= avgDuration) {
      phase = 'MENSTRUAL';
    } else if (cycleDay >= fertileStartDay && cycleDay <= fertileEndDay) {
      phase = 'OVULATORY';
    } else if (cycleDay > fertileEndDay && cycleDay <= avgCycle) {
      phase = 'LUTEAL';
    } else if (cycleDay > avgCycle) {
      phase = 'LUTEAL'; // Overdue / late cycle
    } else {
      phase = 'FOLLICULAR';
    }

    // Pregnancy chance
    let pregnancyChance: 'Low' | 'Medium' | 'Peak' = 'Low';
    if (cycleDay === ovulationDay) pregnancyChance = 'Peak';
    else if (cycleDay >= fertileStartDay && cycleDay <= fertileEndDay) pregnancyChance = 'Medium';

    return {
      cycleDay: Math.max(1, cycleDay),
      phase,
      ovulationDay,
      fertileStartDay,
      fertileEndDay,
      daysUntilNext,
      nextPeriodDateStr: nextPeriodDate.toISOString().split('T')[0],
      pregnancyChance
    };
  }, [lastPeriodStart, settings]);

  // Phase Descriptions and Wellness Guidance
  const phaseDetails = useMemo(() => {
    switch (cycleMetrics.phase) {
      case 'MENSTRUAL':
        return {
          title: 'Menstrual Phase',
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          desc: 'Your body is shedding the uterine lining. Progesterone and estrogen are low.',
          energy: 'Low to moderate. Prioritize sleep and gentle movement.',
          diet: 'Iron-rich foods, leafy greens, warm bone broths, magnesium.',
          exercise: 'Walking, gentle yin yoga, rest days.',
          icon: Droplet
        };
      case 'FOLLICULAR':
        return {
          title: 'Follicular Phase',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          desc: 'Estrogen rises as follicles mature. Brain chemistry sparks creativity and stamina.',
          energy: 'High & rising! Great mental focus and enthusiasm.',
          diet: 'Fresh veggies, lean protein, fermented foods, healthy fats.',
          exercise: 'Cardio, strength training, HIIT, hiking.',
          icon: Zap
        };
      case 'OVULATORY':
        return {
          title: 'Ovulatory Phase (Peak Fertility)',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          desc: 'Luteinizing hormone surge triggers egg release. Peak confidence & communication.',
          energy: 'Peak energy, high stamina and magnetic social vibe.',
          diet: 'Antioxidant berries, fiber, hydration, cruciferous vegetables.',
          exercise: 'Intense strength workouts, sprint intervals, dance.',
          icon: Sparkles
        };
      case 'LUTEAL':
        return {
          title: 'Luteal Phase',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          desc: 'Progesterone dominates to prepare your body. Energy slowly turns inward.',
          energy: 'Moderate to declining. Listen to cues of fatigue.',
          diet: 'Complex carbs (sweet potatoes), dark chocolate, chamomile tea.',
          exercise: 'Moderate pilates, steady-state cardio, stretching.',
          icon: Moon
        };
    }
  }, [cycleMetrics.phase]);

  // Map of logs by date
  const logsMap = useMemo(() => {
    const map = new Map<string, MenstrualLog>();
    for (const l of logs) {
      if (l.date) map.set(l.date, l);
    }
    return map;
  }, [logs]);

  // Open Log Modal for a specific date
  const handleOpenLogModal = (dateStr?: string) => {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const existing = logsMap.get(targetDate);

    setLogFormDate(targetDate);
    if (existing) {
      setLogFormIsPeriod(existing.isPeriodDay);
      setLogFormFlow(existing.flow || 'MEDIUM');
      setLogFormCramps(existing.cramps || 'NONE');
      setLogFormLocations(existing.crampLocations || []);
      setLogFormMoods(existing.moods || []);
      setLogFormSymptoms(existing.symptoms || []);
      setLogFormMucus(existing.mucus || 'DRY');
      setLogFormTemp(existing.temperature ? String(existing.temperature) : '');
      setLogFormWeight(existing.weight ? String(existing.weight) : '');
      setLogFormWater(existing.waterIntakeGlasses || 8);
      setLogFormSleep(existing.sleepHours || 8);
      setLogFormNotes(existing.notes || '');
    } else {
      setLogFormIsPeriod(cycleMetrics.phase === 'MENSTRUAL');
      setLogFormFlow(cycleMetrics.phase === 'MENSTRUAL' ? 'MEDIUM' : 'NONE');
      setLogFormCramps('NONE');
      setLogFormLocations([]);
      setLogFormMoods([]);
      setLogFormSymptoms([]);
      setLogFormMucus('DRY');
      setLogFormTemp('');
      setLogFormWeight('');
      setLogFormWater(8);
      setLogFormSleep(8);
      setLogFormNotes('');
    }

    setIsLogModalOpen(true);
  };

  const handleSaveLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const existing = logsMap.get(logFormDate);

    await onSaveLog({
      id: existing?.id,
      date: logFormDate,
      isPeriodDay: logFormIsPeriod,
      flow: logFormIsPeriod ? logFormFlow : 'NONE',
      cramps: logFormCramps,
      crampLocations: logFormLocations,
      moods: logFormMoods,
      symptoms: logFormSymptoms,
      mucus: logFormMucus,
      temperature: logFormTemp ? parseFloat(logFormTemp) : undefined,
      weight: logFormWeight ? parseFloat(logFormWeight) : undefined,
      waterIntakeGlasses: logFormWater,
      sleepHours: logFormSleep,
      notes: logFormNotes.trim() || undefined
    });

    setIsLogModalOpen(false);
  };

  const handleSavePeriodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodStartDate) return;

    let durationDays: number | undefined;
    if (periodEndDate) {
      const s = new Date(periodStartDate + 'T00:00:00').getTime();
      const end = new Date(periodEndDate + 'T00:00:00').getTime();
      if (end >= s) {
        durationDays = Math.round((end - s) / 86400000) + 1;
      }
    }

    await onSavePeriod({
      id: editingPeriodId || undefined,
      startDate: periodStartDate,
      endDate: periodEndDate || undefined,
      durationDays,
      notes: periodNotes.trim() || undefined
    });

    setIsPeriodModalOpen(false);
    setEditingPeriodId(null);
  };

  // Calendar Grid Days
  const calendarDays = useMemo(() => {
    const y = calendarViewMonth.getFullYear();
    const m = calendarViewMonth.getMonth();
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);

    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysCount = lastDay.getDate();
    const prevMonthDaysCount = new Date(y, m, 0).getDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean; isToday: boolean }[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dNum = prevMonthDaysCount - i;
      const str = new Date(y, m - 1, dNum).toISOString().split('T')[0];
      days.push({ dateStr: str, dayNum: dNum, isCurrentMonth: false, isToday: str === todayStr });
    }
    for (let i = 1; i <= daysCount; i++) {
      const str = `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ dateStr: str, dayNum: i, isCurrentMonth: true, isToday: str === todayStr });
    }
    const rem = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= rem; i++) {
      const str = new Date(y, m + 1, i).toISOString().split('T')[0];
      days.push({ dateStr: str, dayNum: i, isCurrentMonth: false, isToday: str === todayStr });
    }

    return days;
  }, [calendarViewMonth]);

  // Symptom Trends Analytics
  const symptomFrequency = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of logs) {
      if (l.symptoms) {
        for (const s of l.symptoms) {
          counts.set(s, (counts.get(s) || 0) + 1);
        }
      }
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [logs]);

  // Copy Doctor Consult Report
  const handleCopyDoctorReport = () => {
    const report = `CHUVADI MENSTRUAL HEALTH SUMMARY
Generated: ${new Date().toLocaleDateString()}
Average Cycle Length: ${settings.averageCycleLength} days
Average Period Duration: ${settings.averagePeriodDuration} days
Current Cycle Day: Day ${cycleMetrics.cycleDay} (${phaseDetails.title})
Estimated Next Period: ${cycleMetrics.nextPeriodDateStr}

PAST CYCLES RECORDED (${sortedPeriods.length}):
${sortedPeriods.map(p => `• Start: ${p.startDate}${p.endDate ? ` to ${p.endDate}` : ''} | Duration: ${p.durationDays || 'N/A'} days ${p.notes ? `(${p.notes})` : ''}`).join('\n')}

COMMON REPORTED SYMPTOMS:
${symptomFrequency.slice(0, 6).map(([s, c]) => `• ${s}: ${c} occurrences`).join('\n')}
`;
    navigator.clipboard.writeText(report);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Banner & Header */}
      <div className="bg-[#111722] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Heart size={20} className="fill-rose-500/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  {privacyMode ? 'Cycle & Wellness Tracker' : 'Menstrual Health Tracker'}
                </h1>
                <button
                  onClick={() => {
                    const next = !privacyMode;
                    setPrivacyMode(next);
                    onSaveSettings({ ...settings, privacyMode: next });
                  }}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-300 transition"
                  title={privacyMode ? 'Disable Privacy Mode' : 'Enable Privacy Masking'}
                >
                  {privacyMode ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Period predictions, cycle phases, daily flow, symptoms & fertile window
              </p>
            </div>
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenLogModal()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 active:bg-rose-600 text-slate-950 text-xs font-bold transition shadow-sm"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Log Today</span>
            </button>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Cycle Settings"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* HERO CYCLE STATUS CARD */}
        <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#1a1528] via-[#151c2a] to-[#121620] border border-rose-500/20 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            {/* Left: Cycle Day & Phase Badge */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${phaseDetails.badgeColor}`}>
                  {phaseDetails.title}
                </span>
                <span className="text-xs text-slate-400">
                  {cycleMetrics.pregnancyChance === 'Peak' ? '⭐ Peak Fertile Window' : `${cycleMetrics.pregnancyChance} chance of conception`}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Day {cycleMetrics.cycleDay}
                </span>
                <span className="text-xs text-slate-400">of {settings.averageCycleLength} day cycle</span>
              </div>

              <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
                {phaseDetails.desc}
              </p>
            </div>

            {/* Right: Next Period Countdown Chip */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-right sm:text-left md:text-right min-w-[180px]">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Next Period In</div>
                <div className="text-xl font-black text-rose-400 mt-0.5">
                  {cycleMetrics.daysUntilNext > 0 
                    ? `${cycleMetrics.daysUntilNext} Days` 
                    : cycleMetrics.daysUntilNext === 0 
                    ? 'Today' 
                    : `${Math.abs(cycleMetrics.daysUntilNext)} Days Late`}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Est. {new Date(cycleMetrics.nextPeriodDateStr + 'T00:00:00').toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                </div>
              </div>

              <button
                onClick={() => {
                  setEditingPeriodId(null);
                  setPeriodStartDate(new Date().toISOString().split('T')[0]);
                  setPeriodEndDate('');
                  setPeriodNotes('');
                  setIsPeriodModalOpen(true);
                }}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 transition text-center"
              >
                + Record Period Dates
              </button>
            </div>
          </div>

          {/* Phase Lifestyle Tips Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-slate-800/80">
            <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <div className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                <Zap size={12} />
                <span>ENERGY & FOCUS</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-snug">{phaseDetails.energy}</p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <Coffee size={12} />
                <span>RECOMMENDED DIET</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-snug">{phaseDetails.diet}</p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <div className="text-[10px] text-sky-400 font-bold flex items-center gap-1">
                <Activity size={12} />
                <span>WORKOUT STRENGTH</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-snug">{phaseDetails.exercise}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout: 2 Columns on desktop (Calendar & Daily Log, History & Insights) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT 2 COLS: Cycle Calendar & Daily Detail */}
        <div className="lg:col-span-2 space-y-5">
          {/* Monthly Cycle Calendar Card */}
          <div className="bg-[#111722] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const d = new Date(calendarViewMonth);
                    d.setMonth(d.getMonth() - 1);
                    setCalendarViewMonth(d);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => {
                    const d = new Date(calendarViewMonth);
                    d.setMonth(d.getMonth() + 1);
                    setCalendarViewMonth(d);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  <ChevronRight size={16} />
                </button>
                <h3 className="text-sm sm:text-base font-bold text-white ml-1">
                  {calendarViewMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-[10px] text-slate-400 overflow-x-auto">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Period</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                  <span>Fertile</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span>Ovulation</span>
                </div>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 py-1.5 border-b border-slate-800/60">
              <div>M</div>
              <div>T</div>
              <div>W</div>
              <div>T</div>
              <div>F</div>
              <div className="text-amber-400/80">S</div>
              <div className="text-rose-400/80">S</div>
            </div>

            <div className="grid grid-cols-7 gap-1 mt-2">
              {calendarDays.map((cell, idx) => {
                const log = logsMap.get(cell.dateStr);
                const isPeriod = log?.isPeriodDay;
                const isSelected = selectedCalendarDate === cell.dateStr;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedCalendarDate(cell.dateStr);
                      handleOpenLogModal(cell.dateStr);
                    }}
                    className={`min-h-[58px] sm:min-h-[66px] p-1 rounded-xl flex flex-col items-center justify-between text-left transition relative border ${
                      isSelected
                        ? 'border-rose-400 ring-1 ring-rose-400 bg-rose-500/10'
                        : cell.isCurrentMonth
                        ? 'bg-slate-900/50 hover:bg-slate-800/60 border-slate-800/80'
                        : 'bg-[#0d121a]/30 opacity-40 border-transparent'
                    }`}
                  >
                    <span
                      className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                        cell.isToday
                          ? 'bg-rose-500 text-white font-extrabold shadow-sm'
                          : cell.isCurrentMonth
                          ? 'text-slate-200'
                          : 'text-slate-600'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {/* Indicators */}
                    <div className="flex items-center gap-1 mt-1">
                      {isPeriod && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm" title="Period Day" />
                      )}
                      {log?.symptoms && log.symptoms.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Symptoms Logged" />
                      )}
                      {log?.moods && log.moods.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400" title="Mood Logged" />
                      )}
                    </div>

                    {/* Flow text if any */}
                    <div className="text-[9px] text-slate-400 truncate w-full text-center">
                      {isPeriod && log?.flow ? log.flow.toLowerCase() : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Past Period Cycles History */}
          <div className="bg-[#111722] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Cycle History ({sortedPeriods.length})</span>
              </h3>
              <button
                onClick={() => {
                  setEditingPeriodId(null);
                  setPeriodStartDate(new Date().toISOString().split('T')[0]);
                  setPeriodEndDate('');
                  setPeriodNotes('');
                  setIsPeriodModalOpen(true);
                }}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
              >
                + Add Period
              </button>
            </div>

            {sortedPeriods.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                No past cycles recorded yet. Click above to record your latest period dates!
              </div>
            ) : (
              <div className="space-y-2.5">
                {sortedPeriods.map((p, idx) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{p.startDate}</span>
                        {p.endDate && <span className="text-slate-400">→ {p.endDate}</span>}
                        {p.durationDays && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 font-mono text-[10px]">
                            {p.durationDays} days
                          </span>
                        )}
                      </div>
                      {p.notes && <div className="text-[11px] text-slate-400 mt-0.5">{p.notes}</div>}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          if (confirm('Delete this period record?')) {
                            await onDeletePeriod(p.id);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COL: Analytics, Frequent Symptoms & Doctor Report Export */}
        <div className="space-y-5">
          {/* Frequent Symptoms Card */}
          <div className="bg-[#111722] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Activity size={16} className="text-rose-400" />
              <span>Symptom Frequency</span>
            </h3>

            {symptomFrequency.length === 0 ? (
              <div className="text-center py-5 text-slate-500 text-xs">
                Log daily symptoms to visualize patterns and phase triggers.
              </div>
            ) : (
              <div className="space-y-2">
                {symptomFrequency.slice(0, 6).map(([symptom, count]) => {
                  const maxCount = symptomFrequency[0][1] || 1;
                  const pct = Math.round((count / maxCount) * 100);

                  return (
                    <div key={symptom} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300">{symptom}</span>
                        <span className="font-mono text-slate-400">{count}x</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Doctor Consultation Summary Card */}
          <div className="bg-[#111722] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Doctor / Gynaec Report</span>
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              One-click structured medical summary for visits or consultations.
            </p>

            <button
              onClick={handleCopyDoctorReport}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              {copiedReport ? <Check size={14} className="text-emerald-400" /> : <Download size={14} />}
              <span>{copiedReport ? 'Copied Summary!' : 'Copy Summary Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DAILY SYMPTOM & FLOW LOG MODAL                            */}
      {/* ========================================================= */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121824] border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#151c2a] rounded-t-2xl">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Heart size={18} className="text-rose-400 fill-rose-500/20" />
                  <span>Log Flow & Symptoms</span>
                </h3>
                <div className="text-xs text-slate-400">{logFormDate}</div>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveLogSubmit} className="p-4 overflow-y-auto space-y-4 flex-1">
              {/* Date Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={logFormDate}
                  onChange={(e) => setLogFormDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Period Flow Switch */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Droplet size={14} className="text-rose-400" />
                    <span>Is this a Period Day?</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setLogFormIsPeriod(!logFormIsPeriod)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                      logFormIsPeriod ? 'bg-rose-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                        logFormIsPeriod ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {logFormIsPeriod && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                      Flow Intensity
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {(['SPOTTING', 'LIGHT', 'MEDIUM', 'HEAVY', 'CLOTS'] as FlowIntensity[]).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setLogFormFlow(f)}
                          className={`py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                            logFormFlow === f
                              ? 'bg-rose-500 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {f.toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Cramps & Pain */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Cramps Severity
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['NONE', 'MILD', 'MODERATE', 'SEVERE'] as CrampSeverity[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setLogFormCramps(c)}
                      className={`py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                        logFormCramps === c
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {c.toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Moods */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mood</label>
                <div className="grid grid-cols-4 gap-2">
                  {MOOD_OPTIONS.map((m) => {
                    const isSelected = logFormMoods.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setLogFormMoods(logFormMoods.filter(x => x !== m.id));
                          } else {
                            setLogFormMoods([...logFormMoods, m.id]);
                          }
                        }}
                        className={`p-2 rounded-xl text-xs flex flex-col items-center gap-1 transition ${
                          isSelected
                            ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40'
                            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <span className="text-base">{m.icon}</span>
                        <span className="text-[10px] truncate">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Symptoms Multiselect */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Physical Symptoms
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_SYMPTOMS.map((sym) => {
                    const isSelected = logFormSymptoms.includes(sym);
                    return (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setLogFormSymptoms(logFormSymptoms.filter(x => x !== sym));
                          } else {
                            setLogFormSymptoms([...logFormSymptoms, sym]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                          isSelected
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {sym}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Vitals: Water, Sleep, BBT Temp */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Water (Glasses)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    value={logFormWater}
                    onChange={(e) => setLogFormWater(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Sleep (Hours)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={24}
                    step={0.5}
                    value={logFormSleep}
                    onChange={(e) => setLogFormSleep(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    BBT Temp (°C)
                  </label>
                  <input
                    type="number"
                    step={0.1}
                    placeholder="36.5"
                    value={logFormTemp}
                    onChange={(e) => setLogFormTemp(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Daily Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Private Journal / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="How you are feeling today, medications or observations..."
                  value={logFormNotes}
                  onChange={(e) => setLogFormNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition shadow-sm"
                >
                  Save Daily Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PERIOD DATES MODAL                                        */}
      {/* ========================================================= */}
      {isPeriodModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121824] border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Droplet size={18} className="text-rose-400" />
                <span>Record Period Dates</span>
              </h3>
              <button
                onClick={() => setIsPeriodModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePeriodSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Start Date (First day of flow) *
                </label>
                <input
                  type="date"
                  required
                  value={periodStartDate}
                  onChange={(e) => setPeriodStartDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  End Date (Leave blank if ongoing)
                </label>
                <input
                  type="date"
                  value={periodEndDate}
                  onChange={(e) => setPeriodEndDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Mild cramps, started morning"
                  value={periodNotes}
                  onChange={(e) => setPeriodNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPeriodModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition shadow-sm"
                >
                  Save Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CYCLE SETTINGS MODAL                                      */}
      {/* ========================================================= */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121824] border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings size={18} className="text-rose-400" />
                <span>Cycle Settings & Calculations</span>
              </h3>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Average Cycle Length: {cycleLengthVal} Days
                </label>
                <input
                  type="range"
                  min={21}
                  max={45}
                  value={cycleLengthVal}
                  onChange={(e) => setCycleLengthVal(parseInt(e.target.value))}
                  className="w-full accent-rose-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>21 days</span>
                  <span>Typical: 28 days</span>
                  <span>45 days</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Average Period Duration: {periodDurationVal} Days
                </label>
                <input
                  type="range"
                  min={2}
                  max={10}
                  value={periodDurationVal}
                  onChange={(e) => setPeriodDurationVal(parseInt(e.target.value))}
                  className="w-full accent-rose-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>2 days</span>
                  <span>Typical: 5 days</span>
                  <span>10 days</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Luteal Phase Duration: {lutealPhaseVal} Days
                </label>
                <input
                  type="range"
                  min={10}
                  max={16}
                  value={lutealPhaseVal}
                  onChange={(e) => setLutealPhaseVal(parseInt(e.target.value))}
                  className="w-full accent-rose-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>10 days</span>
                  <span>Standard: 14 days</span>
                  <span>16 days</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onSaveSettings({
                      averageCycleLength: cycleLengthVal,
                      averagePeriodDuration: periodDurationVal,
                      lutealPhaseLength: lutealPhaseVal,
                      privacyMode
                    });
                    setIsSettingsModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
