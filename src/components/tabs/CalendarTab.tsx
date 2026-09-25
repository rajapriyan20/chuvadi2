import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  Filter, 
  Clock, 
  CheckCircle2, 
  Car, 
  Dumbbell, 
  Heart, 
  AlertTriangle, 
  X, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownLeft,
  CalendarDays,
  Sparkles,
  Tag,
  AlignLeft,
  Cake,
  Gift,
  PartyPopper
} from 'lucide-react';
import type { 
  Transaction, 
  Vehicle, 
  VehicleLog, 
  ExerciseLog, 
  CalendarEvent, 
  MenstrualLog, 
  MenstrualPeriodRecord,
  Entity 
} from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface CalendarTabProps {
  transactions: Transaction[];
  vehicles: Vehicle[];
  vehicleLogs: VehicleLog[];
  exerciseLogs: ExerciseLog[];
  calendarEvents: CalendarEvent[];
  menstrualLogs: MenstrualLog[];
  menstrualPeriods: MenstrualPeriodRecord[];
  entities: Entity[];
  onSaveCalendarEvent: (event: Omit<CalendarEvent, 'id'> & { id?: string }) => Promise<void>;
  onDeleteCalendarEvent: (id: string) => Promise<void>;
  onOpenQuickAddTxn?: (defaultDate?: string) => void;
}

type CalendarViewMode = 'month' | 'week' | 'agenda';
type EventFilterType = 'ALL' | 'FINANCE' | 'VEHICLE' | 'EXERCISE' | 'MENSTRUAL' | 'BIRTHDAY' | 'CUSTOM';

export const CalendarTab: React.FC<CalendarTabProps> = ({
  transactions,
  vehicles,
  vehicleLogs,
  exerciseLogs,
  calendarEvents,
  menstrualLogs,
  menstrualPeriods,
  entities,
  onSaveCalendarEvent,
  onDeleteCalendarEvent,
  onOpenQuickAddTxn
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [activeFilter, setActiveFilter] = useState<EventFilterType>('ALL');
  
  // Selected Day Modal
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  
  // Custom Event / Birthday Add/Edit Modal
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'event' | 'birthday'>('event');
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Standard Event form fields
  const [eventFormTitle, setEventFormTitle] = useState('');
  const [eventFormDate, setEventFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventFormTime, setEventFormTime] = useState('');
  const [eventFormCategory, setEventFormCategory] = useState('Personal');
  const [eventFormColor, setEventFormColor] = useState('amber');
  const [eventFormNotes, setEventFormNotes] = useState('');

  // Birthday form fields (year is optional)
  const [birthdayPersonName, setBirthdayPersonName] = useState('');
  const [birthdayMonth, setBirthdayMonth] = useState<number>(new Date().getMonth() + 1);
  const [birthdayDay, setBirthdayDay] = useState<number>(new Date().getDate());
  const [birthdayYear, setBirthdayYear] = useState<string>(''); // Optional
  const [birthdayRelationship, setBirthdayRelationship] = useState('Friend');
  const [birthdayNotes, setBirthdayNotes] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      setCurrentDate(new Date(year, month - 1, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      setCurrentDate(new Date(year, month + 1, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Build Map of events by Date string YYYY-MM-DD
  const dateEventsMap = useMemo(() => {
    const map = new Map<string, {
      transactions: Transaction[];
      vehicleEvents: { title: string; type: string; cost?: number; icon: 'renewal' | 'log' }[];
      exercises: ExerciseLog[];
      menstrual: { isPeriod: boolean; flow?: string; cramps?: string }[];
      customEvents: CalendarEvent[];
      birthdays: (CalendarEvent & { age?: number })[];
      receivables: Entity[];
    }>();

    const getBucket = (dateStr: string) => {
      if (!map.has(dateStr)) {
        map.set(dateStr, {
          transactions: [],
          vehicleEvents: [],
          exercises: [],
          menstrual: [],
          customEvents: [],
          birthdays: [],
          receivables: []
        });
      }
      return map.get(dateStr)!;
    };

    // 1. Transactions
    for (const t of transactions) {
      if (t.date) {
        getBucket(t.date).transactions.push(t);
      }
    }

    // 2. Vehicle Renewals & Logs
    for (const v of vehicles) {
      if (v.insuranceExpiry) {
        getBucket(v.insuranceExpiry).vehicleEvents.push({
          title: `${v.name} Insurance Expiry`,
          type: 'Insurance Due',
          icon: 'renewal'
        });
      }
      if (v.pucExpiry) {
        getBucket(v.pucExpiry).vehicleEvents.push({
          title: `${v.name} PUC Emission Expiry`,
          type: 'PUC Due',
          icon: 'renewal'
        });
      }
    }
    for (const l of vehicleLogs) {
      if (l.date) {
        getBucket(l.date).vehicleEvents.push({
          title: l.title || 'Vehicle Service/Fuel',
          type: l.type,
          cost: l.cost,
          icon: 'log'
        });
      }
    }

    // 3. Exercises
    for (const ex of exerciseLogs) {
      if (ex.date) {
        getBucket(ex.date).exercises.push(ex);
      }
    }

    // 4. Menstrual Logs
    for (const m of menstrualLogs) {
      if (m.date) {
        getBucket(m.date).menstrual.push({
          isPeriod: m.isPeriodDay,
          flow: m.flow,
          cramps: m.cramps
        });
      }
    }

    // 5. Custom Events & Annual Recurring Birthdays
    for (const ce of calendarEvents) {
      if (ce.type === 'BIRTHDAY' || ce.personName || ce.category === 'Birthday') {
        let bMonth = ce.birthMonth;
        let bDay = ce.birthDay;
        if (!bMonth || !bDay) {
          const parts = (ce.date || '').split('-');
          if (parts.length >= 3) {
            bMonth = parseInt(parts[1], 10);
            bDay = parseInt(parts[2], 10);
          }
        }

        if (bMonth && bDay && !isNaN(bMonth) && !isNaN(bDay)) {
          // Annual recurring on the current viewed calendar year:
          const recurDateStr = `${year}-${String(bMonth).padStart(2, '0')}-${String(bDay).padStart(2, '0')}`;
          const age = ce.birthYear ? (year - ce.birthYear) : undefined;
          getBucket(recurDateStr).birthdays.push({
            ...ce,
            age: age !== undefined && age >= 0 ? age : undefined
          });
        } else if (ce.date) {
          getBucket(ce.date).birthdays.push(ce);
        }
      } else if (ce.date) {
        getBucket(ce.date).customEvents.push(ce);
      }
    }

    // 6. Receivables / Payables with Due Dates
    for (const ent of entities) {
      if (ent.dueDate) {
        getBucket(ent.dueDate).receivables.push(ent);
      }
    }

    return map;
  }, [transactions, vehicles, vehicleLogs, exerciseLogs, calendarEvents, menstrualLogs, entities, year]);

  // Compute month stats
  const monthStats = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    let exp = 0;
    let inc = 0;
    let workouts = 0;
    let periodDays = 0;
    let birthdaysCount = 0;

    for (const t of transactions) {
      if (t.date && t.date.startsWith(prefix)) {
        if (t.type === 'EXPENSE') exp += t.amount;
        if (t.type === 'INCOME') inc += t.amount;
      }
    }
    for (const ex of exerciseLogs) {
      if (ex.date && ex.date.startsWith(prefix)) workouts++;
    }
    for (const m of menstrualLogs) {
      if (m.date && m.date.startsWith(prefix) && m.isPeriodDay) periodDays++;
    }

    const currentMonthNum = month + 1;
    for (const ce of calendarEvents) {
      if (ce.type === 'BIRTHDAY' || ce.personName || ce.category === 'Birthday') {
        const bMonth = ce.birthMonth || (ce.date ? parseInt(ce.date.split('-')[1], 10) : null);
        if (bMonth === currentMonthNum) {
          birthdaysCount++;
        }
      }
    }

    return { totalExpense: exp, totalIncome: inc, workoutDays: workouts, periodDays, birthdaysCount };
  }, [transactions, exerciseLogs, menstrualLogs, calendarEvents, year, month]);

  // Month grid days calculation
  const calendarGridDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Monday as 0, Sunday as 6
    let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean; isToday: boolean }[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    // Previous month padding
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, dNum);
      const str = prevDate.toISOString().split('T')[0];
      days.push({
        dateStr: str,
        dayNum: dNum,
        isCurrentMonth: false,
        isToday: str === todayStr
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const str = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dateStr: str,
        dayNum: i,
        isCurrentMonth: true,
        isToday: str === todayStr
      });
    }

    // Next month padding to fill grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const str = nextDate.toISOString().split('T')[0];
      days.push({
        dateStr: str,
        dayNum: i,
        isCurrentMonth: false,
        isToday: str === todayStr
      });
    }

    return days;
  }, [year, month]);

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Open add event modal
  const handleOpenAddEvent = (presetDate?: string) => {
    setEditingEvent(null);
    setModalTab('event');
    setEventFormTitle('');
    setEventFormDate(presetDate || new Date().toISOString().split('T')[0]);
    setEventFormTime('');
    setEventFormCategory('Personal');
    setEventFormColor('amber');
    setEventFormNotes('');
    setIsEventModalOpen(true);
  };

  // Open add birthday modal
  const handleOpenAddBirthday = (presetDate?: string) => {
    setEditingEvent(null);
    setModalTab('birthday');
    let m = month + 1;
    let d = 1;
    if (presetDate) {
      const parts = presetDate.split('-');
      if (parts.length >= 3) {
        m = parseInt(parts[1], 10);
        d = parseInt(parts[2], 10);
      }
    } else {
      const now = new Date();
      m = now.getMonth() + 1;
      d = now.getDate();
    }
    setBirthdayPersonName('');
    setBirthdayMonth(m);
    setBirthdayDay(d);
    setBirthdayYear(''); // Optional!
    setBirthdayRelationship('Friend');
    setBirthdayNotes('');
    setEventFormColor('rose');
    setIsEventModalOpen(true);
  };

  const handleOpenEditEvent = (evt: CalendarEvent) => {
    setEditingEvent(evt);
    if (evt.type === 'BIRTHDAY' || evt.personName || evt.category === 'Birthday') {
      setModalTab('birthday');
      setBirthdayPersonName(evt.personName || evt.title.replace(/'s Birthday/i, '').trim());
      const bMonth = evt.birthMonth || (evt.date ? parseInt(evt.date.split('-')[1], 10) : month + 1);
      const bDay = evt.birthDay || (evt.date ? parseInt(evt.date.split('-')[2], 10) : 1);
      setBirthdayMonth(bMonth);
      setBirthdayDay(bDay);
      setBirthdayYear(evt.birthYear ? String(evt.birthYear) : '');
      setBirthdayRelationship(evt.relationship || 'Friend');
      setBirthdayNotes(evt.notes || '');
      setEventFormColor(evt.color || 'rose');
    } else {
      setModalTab('event');
      setEventFormTitle(evt.title);
      setEventFormDate(evt.date);
      setEventFormTime(evt.time || '');
      setEventFormCategory(evt.category || 'Personal');
      setEventFormColor(evt.color || 'amber');
      setEventFormNotes(evt.notes || '');
    }
    setIsEventModalOpen(true);
  };

  const handleSaveEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (modalTab === 'birthday') {
      if (!birthdayPersonName.trim()) return;
      const yr = birthdayYear.trim() ? parseInt(birthdayYear.trim(), 10) : undefined;
      const validYr = yr && !isNaN(yr) && yr > 1900 && yr <= new Date().getFullYear() + 1 ? yr : undefined;
      const dateStr = `${validYr || year}-${String(birthdayMonth).padStart(2, '0')}-${String(birthdayDay).padStart(2, '0')}`;

      await onSaveCalendarEvent({
        id: editingEvent?.id,
        title: `${birthdayPersonName.trim()}'s Birthday`,
        date: dateStr,
        type: 'BIRTHDAY',
        category: 'Birthday',
        color: eventFormColor || 'rose',
        personName: birthdayPersonName.trim(),
        birthMonth: birthdayMonth,
        birthDay: birthdayDay,
        birthYear: validYr,
        relationship: birthdayRelationship,
        notes: birthdayNotes.trim() || undefined
      });
    } else {
      if (!eventFormTitle.trim() || !eventFormDate) return;

      await onSaveCalendarEvent({
        id: editingEvent?.id,
        title: eventFormTitle.trim(),
        date: eventFormDate,
        time: eventFormTime.trim() || undefined,
        type: 'CUSTOM',
        category: eventFormCategory,
        color: eventFormColor,
        notes: eventFormNotes.trim() || undefined
      });
    }

    setIsEventModalOpen(false);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header Card */}
      <div className="bg-[#111722] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <CalendarDays size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Unified Life Calendar
              </h1>
              <p className="text-xs text-slate-400">
                Ledger, vehicle milestones, workouts, cycle predictions & personal reminders
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenAddBirthday()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 text-xs font-bold transition shadow-sm"
              title="Add Person's Birthday (Year is optional)"
            >
              <Cake size={15} />
              <span>Add Birthday</span>
            </button>
            <button
              onClick={() => handleOpenAddEvent()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-xs font-bold transition shadow-sm"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Add Event / Note</span>
            </button>
          </div>
        </div>

        {/* Monthly Summary Stat Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-4 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Month Spent</div>
            <div className="text-sm sm:text-base font-extrabold text-rose-400 mt-0.5">
              {formatCurrency(monthStats.totalExpense)}
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Month Inflow</div>
            <div className="text-sm sm:text-base font-extrabold text-emerald-400 mt-0.5">
              {formatCurrency(monthStats.totalIncome)}
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Workouts Logged</div>
            <div className="text-sm sm:text-base font-extrabold text-sky-400 mt-0.5 flex items-center gap-1.5">
              <Dumbbell size={14} />
              <span>{monthStats.workoutDays} Days</span>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Cycle Flow Days</div>
            <div className="text-sm sm:text-base font-extrabold text-rose-300 mt-0.5 flex items-center gap-1.5">
              <Heart size={14} className="fill-rose-500/20" />
              <span>{monthStats.periodDays} Days</span>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Birthdays</div>
            <div className="text-sm sm:text-base font-extrabold text-pink-300 mt-0.5 flex items-center gap-1.5">
              <Cake size={14} className="text-pink-400" />
              <span>{monthStats.birthdaysCount} Celebrations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Controls & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Navigation & Title */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700/60"
            title="Previous"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700/60"
            title="Next"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/60 transition"
          >
            Today
          </button>
          <h2 className="text-base sm:text-lg font-bold text-white ml-2">
            {monthName}
          </h2>
        </div>

        {/* View Mode & Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
            {(['month', 'agenda'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                  viewMode === mode
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-slate-800" />

          {/* Type Filters */}
          {(
            [
              { id: 'ALL', label: 'All' },
              { id: 'FINANCE', label: 'Finance' },
              { id: 'VEHICLE', label: 'Vehicles' },
              { id: 'EXERCISE', label: 'Fitness' },
              { id: 'MENSTRUAL', label: 'Cycle' },
              { id: 'BIRTHDAY', label: '🎂 Birthdays' },
              { id: 'CUSTOM', label: 'Events' }
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeFilter === f.id
                  ? 'bg-slate-800 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* MONTH VIEW GRID */}
      {viewMode === 'month' && (
        <div className="bg-[#10151f] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-slate-800 bg-[#0d121a] text-center text-xs font-bold text-slate-400 py-2.5">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div className="text-amber-400/80">Sat</div>
            <div className="text-rose-400/80">Sun</div>
          </div>

          {/* Grid Days */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-800/60">
            {calendarGridDays.map((cell, idx) => {
              const events = dateEventsMap.get(cell.dateStr);
              const txns = events?.transactions || [];
              const vehEvents = events?.vehicleEvents || [];
              const exercises = events?.exercises || [];
              const menstrual = events?.menstrual || [];
              const customEvts = events?.customEvents || [];
              const bdays = events?.birthdays || [];
              const receivables = events?.receivables || [];

              const hasItems = 
                txns.length > 0 || 
                vehEvents.length > 0 || 
                exercises.length > 0 || 
                menstrual.length > 0 || 
                customEvts.length > 0 ||
                bdays.length > 0 ||
                receivables.length > 0;

              // Filter check
              const showFinance = activeFilter === 'ALL' || activeFilter === 'FINANCE';
              const showVehicle = activeFilter === 'ALL' || activeFilter === 'VEHICLE';
              const showExercise = activeFilter === 'ALL' || activeFilter === 'EXERCISE';
              const showMenstrual = activeFilter === 'ALL' || activeFilter === 'MENSTRUAL';
              const showBirthday = activeFilter === 'ALL' || activeFilter === 'BIRTHDAY';
              const showCustom = activeFilter === 'ALL' || activeFilter === 'CUSTOM';

              const dayExpenses = txns.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
              const dayIncomes = txns.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);

              const isPeriodDay = menstrual.some(m => m.isPeriod);

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`min-h-[92px] sm:min-h-[110px] p-1.5 sm:p-2 flex flex-col justify-between transition cursor-pointer hover:bg-slate-800/30 ${
                    cell.isCurrentMonth ? 'bg-[#10151f]' : 'bg-[#0b0e14]/50 opacity-60'
                  } ${cell.isToday ? 'ring-1 ring-inset ring-amber-500/50 bg-amber-500/[0.03]' : ''}`}
                >
                  {/* Day Header Row */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        cell.isToday
                          ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                          : cell.isCurrentMonth
                          ? 'text-slate-300'
                          : 'text-slate-600'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {/* Indicators */}
                    <div className="flex items-center gap-1">
                      {bdays.length > 0 && (
                        <span title="Birthday Today!">
                          <Cake size={11} className="text-pink-400" />
                        </span>
                      )}
                      {showMenstrual && isPeriodDay && (
                        <span className="w-2 h-2 rounded-full bg-rose-500" title="Period Day" />
                      )}
                      {showExercise && exercises.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" title="Workout Logged" />
                      )}
                      {showVehicle && vehEvents.some(v => v.icon === 'renewal') && (
                        <span className="w-2 h-2 rounded-full bg-amber-400" title="Vehicle Renewal Due" />
                      )}
                    </div>
                  </div>

                  {/* Badges / Events stack */}
                  <div className="mt-1 space-y-1 flex-1 overflow-hidden">
                    {/* Birthdays (Highest celebratory priority) */}
                    {showBirthday && bdays.map((b) => (
                      <div
                        key={b.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditEvent(b);
                        }}
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 truncate flex items-center gap-1 cursor-pointer hover:border-pink-400"
                        title={`${b.personName || b.title}${b.age ? ` (Turns ${b.age})` : ''}${b.relationship ? ` • ${b.relationship}` : ''}`}
                      >
                        <Cake size={10} className="shrink-0 text-pink-400" />
                        <span className="truncate">{b.personName || b.title} {b.age ? `(${b.age})` : ''}</span>
                      </div>
                    ))}

                    {/* Finance Badges */}
                    {showFinance && dayExpenses > 0 && (
                      <div className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-300 truncate">
                        -₹{dayExpenses > 9999 ? Math.round(dayExpenses / 1000) + 'k' : dayExpenses}
                      </div>
                    )}
                    {showFinance && dayIncomes > 0 && (
                      <div className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 truncate">
                        +₹{dayIncomes > 9999 ? Math.round(dayIncomes / 1000) + 'k' : dayIncomes}
                      </div>
                    )}

                    {/* Custom Events */}
                    {showCustom && customEvts.slice(0, 2).map((ce) => (
                      <div
                        key={ce.id}
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-200 border border-amber-500/20 truncate"
                      >
                        {ce.time ? `${ce.time} ` : ''}{ce.title}
                      </div>
                    ))}

                    {/* Vehicle Badges */}
                    {showVehicle && vehEvents.slice(0, 1).map((ve, vIdx) => (
                      <div
                        key={vIdx}
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-500/15 text-sky-200 truncate flex items-center gap-1"
                      >
                        <Car size={10} className="shrink-0" />
                        <span className="truncate">{ve.title}</span>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Counter if many items */}
                  {hasItems && (
                    <div className="text-[9px] text-slate-500 text-right mt-1 font-mono">
                      {txns.length + customEvts.length + bdays.length + vehEvents.length + exercises.length} item{txns.length + customEvts.length + bdays.length + vehEvents.length + exercises.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AGENDA VIEW (List of dates with items) */}
      {viewMode === 'agenda' && (
        <div className="space-y-3">
          {Array.from(dateEventsMap.entries())
            .filter(([_, data]) => {
              return (
                data.birthdays.length > 0 ||
                data.transactions.length > 0 ||
                data.vehicleEvents.length > 0 ||
                data.exercises.length > 0 ||
                data.customEvents.length > 0 ||
                data.menstrual.length > 0 ||
                data.receivables.length > 0
              );
            })
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 30)
            .map(([dateStr, data]) => (
              <div
                key={dateStr}
                className="bg-[#111722] border border-slate-800 rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={16} className="text-amber-400" />
                    <span className="text-sm font-bold text-white">
                      {new Date(dateStr + 'T00:00:00').toLocaleDateString('default', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenAddBirthday(dateStr)}
                      className="text-xs text-pink-400 hover:text-pink-300 font-semibold flex items-center gap-1"
                    >
                      <Cake size={13} />
                      <span>+ Birthday</span>
                    </button>
                    <button
                      onClick={() => handleOpenAddEvent(dateStr)}
                      className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
                    >
                      + Event
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {/* Birthdays */}
                  {data.birthdays.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => handleOpenEditEvent(b)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/25 text-xs cursor-pointer hover:bg-pink-500/20 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1 rounded-lg bg-pink-500/20 text-pink-300">
                          <Cake size={16} />
                        </div>
                        <div>
                          <div className="font-extrabold text-pink-200 flex items-center gap-2">
                            <span>{b.personName || b.title}'s Birthday 🎂</span>
                            {b.age !== undefined && (
                              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-pink-500/20 text-pink-300 font-bold border border-pink-500/30">
                                Turns {b.age}
                              </span>
                            )}
                            {b.relationship && (
                              <span className="text-[10px] text-slate-400 font-normal">
                                • {b.relationship}
                              </span>
                            )}
                          </div>
                          {b.notes && <div className="text-[11px] text-slate-400 mt-0.5">{b.notes}</div>}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-pink-300 bg-pink-500/20 px-2 py-0.5 rounded-md">Celebration</span>
                    </div>
                  ))}
                  {/* Custom Events */}
                  {data.customEvents.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={() => handleOpenEditEvent(evt)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs cursor-pointer hover:bg-amber-500/15"
                    >
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-amber-400" />
                        <div>
                          <div className="font-bold text-amber-200">{evt.title}</div>
                          {evt.notes && <div className="text-[11px] text-slate-400">{evt.notes}</div>}
                        </div>
                      </div>
                      {evt.time && <span className="font-mono text-amber-300 font-semibold">{evt.time}</span>}
                    </div>
                  ))}

                  {/* Transactions */}
                  {data.transactions.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {t.type === 'INCOME' ? (
                          <ArrowDownLeft size={14} className="text-emerald-400" />
                        ) : (
                          <ArrowUpRight size={14} className="text-rose-400" />
                        )}
                        <div>
                          <div className="font-semibold text-slate-200">{t.description}</div>
                          <div className="text-[10px] text-slate-400">{t.category}</div>
                        </div>
                      </div>
                      <div className={`font-mono font-bold ${t.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                      </div>
                    </div>
                  ))}

                  {/* Vehicle Events */}
                  {data.vehicleEvents.map((ve, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-sky-950/20 border border-sky-500/20 text-xs text-sky-200"
                    >
                      <div className="flex items-center gap-2">
                        <Car size={14} className="text-sky-400" />
                        <span>{ve.title}</span>
                      </div>
                      {ve.cost ? (
                        <span className="font-mono font-bold">{formatCurrency(ve.cost)}</span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Due</span>
                      )}
                    </div>
                  ))}

                  {/* Exercise */}
                  {data.exercises.map((ex) => (
                    <div
                      key={ex.id}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-200"
                    >
                      <Dumbbell size={14} className="text-emerald-400" />
                      <span>{ex.description}</span>
                    </div>
                  ))}

                  {/* Menstrual */}
                  {data.menstrual.map((m, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/20 text-xs text-rose-200"
                    >
                      <Heart size={14} className="text-rose-400 fill-rose-500/20" />
                      <span>Period Day ({m.flow || 'Normal'} Flow, {m.cramps || 'No'} Cramps)</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* DAY INSPECTOR MODAL                                       */}
      {/* ========================================================= */}
      {selectedDateStr && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121824] border border-slate-800 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#151c2a] rounded-t-2xl">
              <div className="flex items-center gap-2">
                <CalendarIcon size={18} className="text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('default', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDateStr(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {/* Quick Actions for this Day */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <button
                  onClick={() => {
                    const d = selectedDateStr;
                    setSelectedDateStr(null);
                    handleOpenAddBirthday(d);
                  }}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 font-bold text-xs border border-pink-500/30 transition shadow-sm"
                >
                  <Cake size={14} className="text-pink-400" />
                  <span>Add Birthday</span>
                </button>
                <button
                  onClick={() => {
                    const d = selectedDateStr;
                    setSelectedDateStr(null);
                    handleOpenAddEvent(d);
                  }}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm"
                >
                  <Plus size={14} />
                  <span>Add Event</span>
                </button>
                {onOpenQuickAddTxn && (
                  <button
                    onClick={() => {
                      const d = selectedDateStr;
                      setSelectedDateStr(null);
                      onOpenQuickAddTxn(d);
                    }}
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                  >
                    <Plus size={14} />
                    <span>Expense</span>
                  </button>
                )}
              </div>

              {/* Day Contents */}
              {(() => {
                const dayData = dateEventsMap.get(selectedDateStr);
                const hasAny = 
                  (dayData?.transactions.length || 0) > 0 ||
                  (dayData?.vehicleEvents.length || 0) > 0 ||
                  (dayData?.exercises.length || 0) > 0 ||
                  (dayData?.menstrual.length || 0) > 0 ||
                  (dayData?.customEvents.length || 0) > 0 ||
                  (dayData?.birthdays.length || 0) > 0;

                if (!hasAny) {
                  return (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      No records or reminders on this date. Click above to add!
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {/* Birthdays (Highest Priority Celebration) */}
                    {dayData?.birthdays.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => {
                          setSelectedDateStr(null);
                          handleOpenEditEvent(b);
                        }}
                        className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-500/20 via-rose-500/15 to-purple-500/10 border border-pink-500/30 flex items-center justify-between text-xs cursor-pointer hover:border-pink-400 transition shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-300 shrink-0">
                            <Cake size={18} />
                          </div>
                          <div>
                            <div className="font-extrabold text-sm text-pink-200 flex items-center gap-2">
                              <span>{b.personName || b.title}'s Birthday 🎂</span>
                              {b.age !== undefined && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/30 text-pink-200 border border-pink-500/40">
                                  Turns {b.age}!
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                              {b.relationship && (
                                <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-slate-300 font-medium">
                                  {b.relationship}
                                </span>
                              )}
                              {b.birthYear && (
                                <span>Born in {b.birthYear}</span>
                              )}
                            </div>
                            {b.notes && (
                              <div className="text-[11px] text-slate-300 mt-1.5 italic bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                                Gift / Notes: {b.notes}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-pink-400 font-semibold px-2 py-1 rounded-lg bg-pink-500/10 shrink-0">
                          Edit
                        </span>
                      </div>
                    ))}

                    {/* Custom Events */}
                    {dayData?.customEvents.map((evt) => (
                      <div
                        key={evt.id}
                        onClick={() => {
                          setSelectedDateStr(null);
                          handleOpenEditEvent(evt);
                        }}
                        className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs cursor-pointer hover:bg-amber-500/15"
                      >
                        <div>
                          <div className="font-bold text-amber-200">{evt.title}</div>
                          {evt.notes && <div className="text-slate-400 mt-0.5">{evt.notes}</div>}
                        </div>
                        {evt.time && <div className="font-mono text-amber-300 font-bold">{evt.time}</div>}
                      </div>
                    ))}

                    {/* Transactions */}
                    {dayData?.transactions.map((t) => (
                      <div
                        key={t.id}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {t.type === 'INCOME' ? (
                            <ArrowDownLeft size={16} className="text-emerald-400" />
                          ) : (
                            <ArrowUpRight size={16} className="text-rose-400" />
                          )}
                          <div>
                            <div className="font-bold text-white">{t.description}</div>
                            <div className="text-[10px] text-slate-400">{t.category}</div>
                          </div>
                        </div>
                        <div className={`font-mono font-bold ${t.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                        </div>
                      </div>
                    ))}

                    {/* Vehicle */}
                    {dayData?.vehicleEvents.map((v, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-sky-950/20 border border-sky-500/20 flex items-center justify-between text-xs text-sky-200"
                      >
                        <div className="flex items-center gap-2">
                          <Car size={16} className="text-sky-400" />
                          <span>{v.title}</span>
                        </div>
                        {v.cost && <span className="font-mono font-bold">{formatCurrency(v.cost)}</span>}
                      </div>
                    ))}

                    {/* Exercises */}
                    {dayData?.exercises.map((ex) => (
                      <div
                        key={ex.id}
                        className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-200"
                      >
                        <Dumbbell size={16} className="text-emerald-400" />
                        <span>{ex.description}</span>
                      </div>
                    ))}

                    {/* Menstrual */}
                    {dayData?.menstrual.map((m, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 flex items-center gap-2 text-xs text-rose-200"
                      >
                        <Heart size={16} className="text-rose-400 fill-rose-500/20" />
                        <span>Period Day: {m.flow || 'Normal'} Flow</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CUSTOM CALENDAR EVENT & BIRTHDAY ADD/EDIT MODAL          */}
      {/* ========================================================= */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121824] border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {modalTab === 'birthday' ? (
                  <>
                    <Cake size={18} className="text-pink-400" />
                    <span>{editingEvent ? 'Edit Birthday' : 'Add Birthday 🎂'}</span>
                  </>
                ) : (
                  <>
                    <CalendarIcon size={18} className="text-amber-400" />
                    <span>{editingEvent ? 'Edit Calendar Event' : 'Add Calendar Event'}</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setIsEventModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Toggle between Event and Birthday when creating new */}
            {!editingEvent && (
              <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 mb-4">
                <button
                  type="button"
                  onClick={() => setModalTab('event')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    modalTab === 'event'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CalendarIcon size={14} />
                  <span>Event / Reminder</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('birthday')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    modalTab === 'birthday'
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Cake size={14} />
                  <span>Birthday 🎂</span>
                </button>
              </div>
            )}

            <form onSubmit={handleSaveEventSubmit} className="space-y-4">
              {modalTab === 'birthday' ? (
                /* Birthday Form Fields */
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Name of the person *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priyan, Mom, Alexander, Rahul"
                      value={birthdayPersonName}
                      onChange={(e) => setBirthdayPersonName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Birth Month *
                      </label>
                      <select
                        value={birthdayMonth}
                        onChange={(e) => setBirthdayMonth(parseInt(e.target.value, 10))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                      >
                        {[
                          'January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'
                        ].map((mName, i) => (
                          <option key={i + 1} value={i + 1}>
                            {mName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Birth Day *
                      </label>
                      <select
                        value={birthdayDay}
                        onChange={(e) => setBirthdayDay(parseInt(e.target.value, 10))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Birth Year <span className="text-pink-400 font-normal">(Optional)</span>
                      </label>
                      <span className="text-[10px] text-slate-500">Leave blank if unknown</span>
                    </div>
                    <input
                      type="number"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      placeholder="e.g. 1995 (Optional)"
                      value={birthdayYear}
                      onChange={(e) => setBirthdayYear(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Year is optional. If provided, the calendar displays milestone age each year (e.g. "30th Birthday")!
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Relationship
                      </label>
                      <select
                        value={birthdayRelationship}
                        onChange={(e) => setBirthdayRelationship(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                      >
                        <option value="Family">Family</option>
                        <option value="Friend">Friend</option>
                        <option value="Partner">Partner / Spouse</option>
                        <option value="Parent">Parent</option>
                        <option value="Child">Child</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Colleague">Colleague</option>
                        <option value="Loved One">Loved One</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Badge Color
                      </label>
                      <select
                        value={eventFormColor}
                        onChange={(e) => setEventFormColor(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                      >
                        <option value="rose">Rose Pink</option>
                        <option value="amber">Warm Amber</option>
                        <option value="indigo">Violet / Purple</option>
                        <option value="sky">Sky Blue</option>
                        <option value="emerald">Emerald Green</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Gift Ideas & Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Gift ideas, favorite cake flavor, surprise plan..."
                      value={birthdayNotes}
                      onChange={(e) => setBirthdayNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </>
              ) : (
                /* Standard Calendar Event Form Fields */
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Event Title / Reminder *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Credit Card Due, Dentist Appointment, Car Wash"
                      value={eventFormTitle}
                      onChange={(e) => setEventFormTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={eventFormDate}
                        onChange={(e) => setEventFormDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Time (Optional)
                      </label>
                      <input
                        type="time"
                        value={eventFormTime}
                        onChange={(e) => setEventFormTime(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Category
                      </label>
                      <select
                        value={eventFormCategory}
                        onChange={(e) => setEventFormCategory(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="Personal">Personal</option>
                        <option value="Bill">Bill / Due</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Health">Health</option>
                        <option value="Work">Work</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Badge Color
                      </label>
                      <select
                        value={eventFormColor}
                        onChange={(e) => setEventFormColor(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="amber">Amber Gold</option>
                        <option value="sky">Sky Blue</option>
                        <option value="emerald">Emerald Green</option>
                        <option value="rose">Rose Red</option>
                        <option value="indigo">Indigo</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Notes & Details (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Additional notes, location or reminders..."
                      value={eventFormNotes}
                      onChange={(e) => setEventFormNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-between pt-2">
                {editingEvent ? (
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm('Delete this event?')) {
                        await onDeleteCalendarEvent(editingEvent.id);
                        setIsEventModalOpen(false);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30 transition"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEventModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                      modalTab === 'birthday'
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white'
                        : 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950'
                    }`}
                  >
                    {modalTab === 'birthday'
                      ? (editingEvent ? 'Update Birthday' : 'Save Birthday 🎂')
                      : (editingEvent ? 'Update Event' : 'Save Event')}
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
