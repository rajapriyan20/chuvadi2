import React, { useState, useEffect, useMemo } from 'react';
import { 
  subscribeToAccounts, 
  subscribeToTransactions, 
  subscribeToVehicles, 
  subscribeToVehicleLogs, 
  subscribeToTodos, 
  subscribeToEntities,
  subscribeToExerciseLogs,
  subscribeToCalendarEvents,
  subscribeToMenstrualLogs,
  subscribeToMenstrualPeriods,
  subscribeToMenstrualSettings,
  saveTransactionAtomic,
  deleteTransactionAtomic,
  saveAccount,
  deleteAccount,
  saveVehicle,
  deleteVehicle,
  saveVehicleLog,
  deleteVehicleLog,
  saveTodo,
  deleteTodo,
  saveEntity,
  deleteEntity,
  saveExerciseLog,
  deleteExerciseLog,
  saveCalendarEvent,
  deleteCalendarEvent,
  saveMenstrualLog,
  deleteMenstrualLog,
  saveMenstrualPeriod,
  deleteMenstrualPeriod,
  saveMenstrualSettings,
  seedUserStarterData,
  clearUserData,
  syncOrMigratePrimaryUserData,
  isPrimaryUser,
  seedStarterData,
  clearLocalCache,
  loginWithGoogle,
  logoutUser,
  subscribeAuth
} from './services/firebase';
import type { User } from 'firebase/auth';

import { Header } from './components/Header';
import { SideMenu } from './components/SideMenu';
import { AuthScreen } from './components/common/AuthScreen';
import { PWAInstallBanner } from './components/common/PWAInstallBanner';
import { GuestModeOverlay } from './components/common/GuestModeOverlay';
import { 
  markEmailAsAdded, 
  setCachedGmailToken, 
  clearGmailSession,
  sanitizeAndPurgeContaminatedCaches 
} from './services/gmail';
import {
  DEMO_ACCOUNTS,
  DEMO_TRANSACTIONS,
  DEMO_VEHICLES,
  DEMO_VEHICLE_LOGS,
  DEMO_TODOS,
  DEMO_ENTITIES,
  DEMO_EXERCISE_LOGS,
  DEMO_CALENDAR_EVENTS,
  DEMO_MENSTRUAL_SETTINGS,
  DEMO_MENSTRUAL_PERIODS,
  DEMO_MENSTRUAL_LOGS
} from './data/demoData';

// Modals
import { TransactionModal } from './components/modals/TransactionModal';
import { AccountModal } from './components/modals/AccountModal';
import { PassbookModal } from './components/modals/PassbookModal';
import { VehicleModal } from './components/modals/VehicleModal';
import { ServiceLogModal } from './components/modals/ServiceLogModal';
import { TodoModal } from './components/modals/TodoModal';
import { EntityModal } from './components/modals/EntityModal';
import { ExportModal } from './components/modals/ExportModal';
import { SettingsModal } from './components/modals/SettingsModal';

// Tabs
import { DashboardTab } from './components/tabs/DashboardTab';
import { FinanceTab } from './components/tabs/FinanceTab';
import { GarageTab } from './components/tabs/GarageTab';
import { TodosTab } from './components/tabs/TodosTab';
import { ReportsTab } from './components/tabs/ReportsTab';
import { AiAssistantTab } from './components/tabs/AiAssistantTab';
import { ExerciseLogView } from './components/exercise/ExerciseLogView';
import { CalendarTab } from './components/tabs/CalendarTab';
import { MenstrualTrackerTab } from './components/tabs/MenstrualTrackerTab';

import { getDaysRemaining } from './utils/formatters';
import type { 
  ActiveTab, 
  Account, 
  Transaction, 
  Vehicle, 
  VehicleLog, 
  TodoNote, 
  Entity, 
  ExerciseLog,
  CalendarEvent,
  MenstrualLog,
  MenstrualPeriodRecord,
  MenstrualCycleSettings
} from './types';

export function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSideMenuOpen, setIsSideMenuOpen] = useState<boolean>(false);

  // Auth & Network State
  const [user, setUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);
  const [guestMode, setGuestMode] = useState<boolean>(() => {
    return sessionStorage.getItem('chuvadi_guest_mode') === 'true';
  });
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Domain State (Isolated: Demo data in Guest Mode, User-scoped Firestore in Auth Mode)
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleLogs, setVehicleLogs] = useState<VehicleLog[]>([]);
  const [todos, setTodos] = useState<TodoNote[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [menstrualLogs, setMenstrualLogs] = useState<MenstrualLog[]>([]);
  const [menstrualPeriods, setMenstrualPeriods] = useState<MenstrualPeriodRecord[]>([]);
  const [menstrualSettings, setMenstrualSettings] = useState<MenstrualCycleSettings>({
    averageCycleLength: 28,
    averagePeriodDuration: 5,
    lutealPhaseLength: 14,
    privacyMode: false
  });
  const [nonPrimaryBannerDismissed, setNonPrimaryBannerDismissed] = useState<boolean>(false);

  // Modals Visibility & Editing State
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [pendingEmailImportId, setPendingEmailImportId] = useState<string | null>(null);

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [isPassbookOpen, setIsPassbookOpen] = useState(false);
  const [passbookAccount, setPassbookAccount] = useState<Account | null>(null);

  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [isServiceLogModalOpen, setIsServiceLogModalOpen] = useState(false);
  const [editingServiceLog, setEditingServiceLog] = useState<VehicleLog | null>(null);
  const [logInitialVehicleId, setLogInitialVehicleId] = useState<string | undefined>(undefined);

  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoNote | null>(null);

  const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Listen to Auth State
  useEffect(() => {
    const unsubAuth = subscribeAuth((currentUser) => {
      setUser(currentUser);
      setAuthInitialized(true);
      if (currentUser) {
        // Authenticated! Disable guest mode
        setGuestMode(false);
        sessionStorage.removeItem('chuvadi_guest_mode');
      }
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubAuth();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync with Firestore ONLY WHEN Authenticated (Scoped per user!)
  useEffect(() => {
    if (!user) {
      return;
    }

    // If primary user rajapriyan20@gmail.com, migrate legacy root collections if not yet migrated
    if (isPrimaryUser(user)) {
      syncOrMigratePrimaryUserData(user);
    }

    const unsubAccounts = subscribeToAccounts(user, setAccounts);
    const unsubTxns = subscribeToTransactions(user, setTransactions);
    const unsubVehicles = subscribeToVehicles(user, setVehicles);
    const unsubLogs = subscribeToVehicleLogs(user, setVehicleLogs);
    const unsubTodos = subscribeToTodos(user, setTodos);
    const unsubEntities = subscribeToEntities(user, setEntities);
    const unsubExercise = subscribeToExerciseLogs(user, setExerciseLogs);
    const unsubCalendar = subscribeToCalendarEvents(user, setCalendarEvents);
    const unsubMenstrualLogs = subscribeToMenstrualLogs(user, setMenstrualLogs);
    const unsubMenstrualPeriods = subscribeToMenstrualPeriods(user, setMenstrualPeriods);
    const unsubMenstrualSettings = subscribeToMenstrualSettings(user, setMenstrualSettings);

    return () => {
      unsubAccounts();
      unsubTxns();
      unsubVehicles();
      unsubLogs();
      unsubTodos();
      unsubEntities();
      unsubExercise();
      unsubCalendar();
      unsubMenstrualLogs();
      unsubMenstrualPeriods();
      unsubMenstrualSettings();
    };
  }, [user]);

  // Populate Demo data ONLY WHEN in Guest Mode
  useEffect(() => {
    if (guestMode && !user) {
      setAccounts(JSON.parse(JSON.stringify(DEMO_ACCOUNTS)));
      setTransactions(JSON.parse(JSON.stringify(DEMO_TRANSACTIONS)));
      setVehicles(JSON.parse(JSON.stringify(DEMO_VEHICLES)));
      setVehicleLogs(JSON.parse(JSON.stringify(DEMO_VEHICLE_LOGS)));
      setTodos(JSON.parse(JSON.stringify(DEMO_TODOS)));
      setEntities(JSON.parse(JSON.stringify(DEMO_ENTITIES)));
      setExerciseLogs(JSON.parse(JSON.stringify(DEMO_EXERCISE_LOGS)));
      setCalendarEvents(JSON.parse(JSON.stringify(DEMO_CALENDAR_EVENTS)));
      setMenstrualLogs(JSON.parse(JSON.stringify(DEMO_MENSTRUAL_LOGS)));
      setMenstrualPeriods(JSON.parse(JSON.stringify(DEMO_MENSTRUAL_PERIODS)));
      setMenstrualSettings(JSON.parse(JSON.stringify(DEMO_MENSTRUAL_SETTINGS)));
    }
  }, [guestMode, user]);

  // Compute Net Worth
  const totalNetWorth = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  }, [accounts]);

  // Compute Current Month Inflow & Outflow
  const { monthlyIncome, monthlyExpense } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
    let income = 0;
    let expense = 0;

    for (const t of transactions) {
      if (t.date && t.date.startsWith(currentMonth)) {
        if (t.type === 'INCOME') income += t.amount;
        if (t.type === 'EXPENSE') expense += t.amount;
      }
    }
    return { monthlyIncome: income, monthlyExpense: expense };
  }, [transactions]);

  // Count expiring vehicle renewals (< 30 days)
  const renewalsCount = useMemo(() => {
    let count = 0;
    for (const v of vehicles) {
      if (v.insuranceExpiry) {
        const s = getDaysRemaining(v.insuranceExpiry);
        if (s && (s.days <= 30 || s.isOverdue)) count++;
      }
      if (v.pucExpiry) {
        const s = getDaysRemaining(v.pucExpiry);
        if (s && (s.days <= 30 || s.isOverdue)) count++;
      }
    }
    return count;
  }, [vehicles]);

  // Count pending todos
  const pendingTodosCount = useMemo(() => {
    return todos.reduce((acc, note) => {
      return acc + note.items.filter(i => !i.completed).length;
    }, 0);
  }, [todos]);

  // Transaction Handlers (ATOMIC FIRESTORE TRANSACTIONS when logged in, local-state when Guest)
  const handleSaveTransaction = async (txn: Omit<Transaction, 'id'> & { id?: string }) => {
    if (guestMode && !user) {
      const id = txn.id || 'demo-txn-' + Date.now();
      const newAmt = Number(txn.amount) || 0;
      const existing = transactions.find(t => t.id === id);
      const oldAmt = existing ? Number(existing.amount) || 0 : 0;

      const payload: Transaction = {
        ...txn,
        id,
        timestamp: txn.timestamp || Date.now(),
        amount: newAmt
      };

      setTransactions(prev => {
        const idx = prev.findIndex(t => t.id === id);
        return idx >= 0 ? prev.map(t => t.id === id ? payload : t) : [payload, ...prev];
      });

      // Update account balances locally in Guest Mode
      setAccounts(prev => prev.map(acc => {
        let bal = acc.balance;
        if (existing) {
          if (existing.type === 'EXPENSE' && existing.fromAccountId === acc.id) bal += oldAmt;
          if (existing.type === 'INCOME' && existing.toAccountId === acc.id) bal -= oldAmt;
          if (existing.type === 'TRANSFER') {
            if (existing.fromAccountId === acc.id) bal += oldAmt;
            if (existing.toAccountId === acc.id) bal -= oldAmt;
          }
        }
        if (txn.type === 'EXPENSE' && txn.fromAccountId === acc.id) bal -= newAmt;
        if (txn.type === 'INCOME' && txn.toAccountId === acc.id) bal += newAmt;
        if (txn.type === 'TRANSFER') {
          if (txn.fromAccountId === acc.id) bal -= newAmt;
          if (txn.toAccountId === acc.id) bal += newAmt;
        }
        return { ...acc, balance: bal, updatedAt: Date.now() };
      }));

      // Update vehicle odometer if higher
      if (txn.vehicleId && txn.odometer) {
        setVehicles(prev => prev.map(v => 
          v.id === txn.vehicleId && txn.odometer! > v.currentOdometer
            ? { ...v, currentOdometer: txn.odometer! }
            : v
        ));
      }

      if (pendingEmailImportId) {
        markEmailAsAdded(pendingEmailImportId, id, 'guest');
        setPendingEmailImportId(null);
      }
      return;
    }

    const savedId = await saveTransactionAtomic(txn);

    if (pendingEmailImportId) {
      markEmailAsAdded(pendingEmailImportId, savedId, user?.email || user?.uid || (guestMode ? 'guest' : null));
      setPendingEmailImportId(null);
    }

    // If transaction had a vehicle link & odometer update, sync vehicle's current odometer
    if (txn.vehicleId && txn.odometer) {
      const veh = vehicles.find(v => v.id === txn.vehicleId);
      if (veh && txn.odometer > veh.currentOdometer) {
        await saveVehicle({ ...veh, currentOdometer: txn.odometer });
      }
    }
  };

  const handleDeleteTransaction = async (txn: Transaction) => {
    if (guestMode && !user) {
      setTransactions(prev => prev.filter(t => t.id !== txn.id));
      const amt = Number(txn.amount) || 0;
      setAccounts(prev => prev.map(acc => {
        let bal = acc.balance;
        if (txn.type === 'EXPENSE' && txn.fromAccountId === acc.id) bal += amt;
        if (txn.type === 'INCOME' && txn.toAccountId === acc.id) bal -= amt;
        if (txn.type === 'TRANSFER') {
          if (txn.fromAccountId === acc.id) bal += amt;
          if (txn.toAccountId === acc.id) bal += amt;
        }
        return { ...acc, balance: bal, updatedAt: Date.now() };
      }));
      return;
    }

    await deleteTransactionAtomic(txn);
  };

  // Account Operations
  const handleSaveAccount = async (acc: Omit<Account, 'id'> & { id?: string }) => {
    if (guestMode && !user) {
      const id = acc.id || 'demo-acc-' + Date.now();
      const payload: Account = { ...acc, id, updatedAt: Date.now() };
      setAccounts(prev => {
        const idx = prev.findIndex(a => a.id === id);
        return idx >= 0 ? prev.map(a => a.id === id ? payload : a) : [...prev, payload];
      });
      return;
    }
    await saveAccount(acc);
  };

  const handleDeleteAccount = async (id: string) => {
    if (guestMode && !user) {
      setAccounts(prev => prev.filter(a => a.id !== id));
      return;
    }
    await deleteAccount(id);
  };

  // Vehicle Operations
  const handleSaveVehicle = async (veh: Omit<Vehicle, 'id'> & { id?: string }) => {
    if (guestMode && !user) {
      const id = veh.id || 'demo-veh-' + Date.now();
      const payload: Vehicle = { ...veh, id, currentOdometer: Number(veh.currentOdometer) || 0 };
      setVehicles(prev => {
        const idx = prev.findIndex(v => v.id === id);
        return idx >= 0 ? prev.map(v => v.id === id ? payload : v) : [...prev, payload];
      });
      return;
    }
    await saveVehicle(veh);
  };

  const handleDeleteVehicle = async (id: string) => {
    if (guestMode && !user) {
      setVehicles(prev => prev.filter(v => v.id !== id));
      return;
    }
    await deleteVehicle(id);
  };

  // Vehicle Logs
  const handleSaveVehicleLog = async (log: Omit<VehicleLog, 'id'> & { id?: string }) => {
    if (guestMode && !user) {
      const id = log.id || 'demo-log-' + Date.now();
      const payload: VehicleLog = {
        ...log,
        id,
        timestamp: log.timestamp || Date.now(),
        cost: Number(log.cost) || 0,
        odometer: Number(log.odometer) || 0
      };
      setVehicleLogs(prev => {
        const idx = prev.findIndex(l => l.id === id);
        return idx >= 0 ? prev.map(l => l.id === id ? payload : l) : [payload, ...prev];
      });
      if (payload.vehicleId && payload.odometer) {
        setVehicles(prev => prev.map(v => 
          v.id === payload.vehicleId && payload.odometer > v.currentOdometer 
            ? { ...v, currentOdometer: payload.odometer } 
            : v
        ));
      }
      return;
    }
    await saveVehicleLog(log);
    const vehicle = vehicles.find(v => v.id === log.vehicleId);
    if (vehicle && log.odometer && log.odometer > vehicle.currentOdometer) {
      await saveVehicle({ ...vehicle, currentOdometer: log.odometer });
    }
  };

  // Todo Note Handlers
  const handleSaveTodo = async (todo: Omit<TodoNote, 'id'> & { id?: string }) => {
    if (guestMode && !user) {
      const id = todo.id || 'demo-todo-' + Date.now();
      const payload: TodoNote = { ...todo, id, updatedAt: Date.now() };
      setTodos(prev => {
        const idx = prev.findIndex(t => t.id === id);
        return idx >= 0 ? prev.map(t => t.id === id ? payload : t) : [payload, ...prev];
      });
      return;
    }
    await saveTodo(todo);
  };

  const handleDeleteTodo = async (id: string) => {
    if (guestMode && !user) {
      setTodos(prev => prev.filter(t => t.id !== id));
      return;
    }
    await deleteTodo(id);
  };

  const handleToggleTodoItem = async (noteId: string, itemId: string) => {
    const note = todos.find(t => t.id === noteId);
    if (!note) return;

    const updatedItems = note.items.map(it => 
      it.id === itemId ? { ...it, completed: !it.completed } : it
    );

    if (guestMode && !user) {
      setTodos(prev => prev.map(t => t.id === noteId ? { ...t, items: updatedItems, updatedAt: Date.now() } : t));
      return;
    }

    await saveTodo({
      ...note,
      items: updatedItems,
      updatedAt: Date.now()
    });
  };

  const handleTogglePin = async (todo: TodoNote) => {
    if (guestMode && !user) {
      setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, pinned: !t.pinned, updatedAt: Date.now() } : t));
      return;
    }
    await saveTodo({
      ...todo,
      pinned: !todo.pinned,
      updatedAt: Date.now()
    });
  };

  // Entity Handlers
  const handleSaveEntity = async (entity: Omit<Entity, 'id'> & { id?: string }) => {
    if (guestMode && !user) {
      const id = entity.id || 'demo-ent-' + Date.now();
      const payload: Entity = { ...entity, id, amount: Number(entity.amount) || 0 };
      setEntities(prev => {
        const idx = prev.findIndex(e => e.id === id);
        return idx >= 0 ? prev.map(e => e.id === id ? payload : e) : [payload, ...prev];
      });
      return;
    }
    await saveEntity(entity);
  };

  const handleDeleteEntity = async (id: string) => {
    if (guestMode && !user) {
      setEntities(prev => prev.filter(e => e.id !== id));
      return;
    }
    await deleteEntity(id);
  };

  // Exercise Log Handlers
  const handleSaveExerciseLog = async (log: Omit<ExerciseLog, 'id'> & { id?: string }) => {
    if (guestMode && !user) {
      const id = log.id || 'demo-ex-' + Date.now();
      const payload: ExerciseLog = { ...log, id, updatedAt: Date.now() };
      setExerciseLogs(prev => {
        const idx = prev.findIndex(e => e.id === id);
        return idx >= 0 ? prev.map(e => e.id === id ? payload : e) : [payload, ...prev];
      });
      return;
    }
    await saveExerciseLog(log, user);
  };

  const handleDeleteExerciseLog = async (id: string) => {
    if (guestMode && !user) {
      setExerciseLogs(prev => prev.filter(e => e.id !== id));
      return;
    }
    await deleteExerciseLog(id, user);
  };

  // Calendar Event Handlers
  const handleSaveCalendarEvent = async (event: Omit<CalendarEvent, 'id'> & { id?: string }) => {
    if (guestMode && !user) {
      const id = event.id || 'demo-cal-' + Date.now();
      const payload: CalendarEvent = { ...event, id, updatedAt: Date.now() };
      setCalendarEvents(prev => {
        const idx = prev.findIndex(c => c.id === id);
        return idx >= 0 ? prev.map(c => c.id === id ? payload : c) : [...prev, payload];
      });
      return;
    }
    await saveCalendarEvent(event, user);
  };

  const handleDeleteCalendarEvent = async (id: string) => {
    if (guestMode && !user) {
      setCalendarEvents(prev => prev.filter(c => c.id !== id));
      return;
    }
    await deleteCalendarEvent(id, user);
  };

  // Menstrual Tracker Handlers
  const handleSaveMenstrualLog = async (log: Omit<MenstrualLog, 'id'> & { id?: string }) => {
    if (guestMode && !user) {
      const id = log.id || 'demo-mlog-' + Date.now();
      const payload: MenstrualLog = { ...log, id, updatedAt: Date.now() };
      setMenstrualLogs(prev => {
        const idx = prev.findIndex(m => m.id === id);
        return idx >= 0 ? prev.map(m => m.id === id ? payload : m) : [payload, ...prev];
      });
      return;
    }
    await saveMenstrualLog(log, user);
  };

  const handleDeleteMenstrualLog = async (id: string) => {
    if (guestMode && !user) {
      setMenstrualLogs(prev => prev.filter(m => m.id !== id));
      return;
    }
    await deleteMenstrualLog(id, user);
  };

  const handleSaveMenstrualPeriod = async (period: Omit<MenstrualPeriodRecord, 'id'> & { id?: string }) => {
    if (guestMode && !user) {
      const id = period.id || 'demo-period-' + Date.now();
      const payload: MenstrualPeriodRecord = { ...period, id };
      setMenstrualPeriods(prev => {
        const idx = prev.findIndex(p => p.id === id);
        return idx >= 0 ? prev.map(p => p.id === id ? payload : p) : [payload, ...prev];
      });
      return;
    }
    await saveMenstrualPeriod(period, user);
  };

  const handleDeleteMenstrualPeriod = async (id: string) => {
    if (guestMode && !user) {
      setMenstrualPeriods(prev => prev.filter(p => p.id !== id));
      return;
    }
    await deleteMenstrualPeriod(id, user);
  };

  const handleSaveMenstrualSettings = async (newSettings: MenstrualCycleSettings) => {
    setMenstrualSettings(newSettings);
    if (guestMode && !user) return;
    await saveMenstrualSettings(newSettings, user);
  };

  // Seed or Clear for Active User
  const handleSeedForActiveUser = async () => {
    if (guestMode && !user) {
      setAccounts(JSON.parse(JSON.stringify(DEMO_ACCOUNTS)));
      setTransactions(JSON.parse(JSON.stringify(DEMO_TRANSACTIONS)));
      setVehicles(JSON.parse(JSON.stringify(DEMO_VEHICLES)));
      setVehicleLogs(JSON.parse(JSON.stringify(DEMO_VEHICLE_LOGS)));
      setTodos(JSON.parse(JSON.stringify(DEMO_TODOS)));
      setEntities(JSON.parse(JSON.stringify(DEMO_ENTITIES)));
      setExerciseLogs(JSON.parse(JSON.stringify(DEMO_EXERCISE_LOGS)));
      setCalendarEvents(JSON.parse(JSON.stringify(DEMO_CALENDAR_EVENTS)));
      setMenstrualLogs(JSON.parse(JSON.stringify(DEMO_MENSTRUAL_LOGS)));
      setMenstrualPeriods(JSON.parse(JSON.stringify(DEMO_MENSTRUAL_PERIODS)));
      setMenstrualSettings(JSON.parse(JSON.stringify(DEMO_MENSTRUAL_SETTINGS)));
    } else if (user) {
      await seedUserStarterData(user);
    }
  };

  const handleClearActiveUser = async () => {
    if (user) {
      await clearUserData(user);
      setAccounts([]);
      setTransactions([]);
      setVehicles([]);
      setVehicleLogs([]);
      setTodos([]);
      setEntities([]);
      setExerciseLogs([]);
      setCalendarEvents([]);
      setMenstrualLogs([]);
      setMenstrualPeriods([]);
    }
  };

  // Open Passbook for specific account
  const handleOpenPassbook = (acc: Account) => {
    setPassbookAccount(acc);
    setIsPassbookOpen(true);
  };

  // Edit existing transaction
  const handleSelectTxn = (txn: Transaction) => {
    setEditingTxn(txn);
    setIsTxnModalOpen(true);
  };

  // Quick action from Garage to log fuel/service
  const handleOpenNewLog = (vehicleId?: string, defaultType: 'FUEL' | 'SERVICE' = 'FUEL') => {
    setEditingServiceLog(null);
    setLogInitialVehicleId(vehicleId);
    setIsServiceLogModalOpen(true);
  };

  // Logout from Authenticated Account
  const handleLogout = async () => {
    try {
      setCachedGmailToken(null);
      await logoutUser();
      clearLocalCache();
      sanitizeAndPurgeContaminatedCaches();
      setUser(null);
      setGuestMode(false);
      sessionStorage.removeItem('chuvadi_guest_mode');
      setAccounts([]);
      setTransactions([]);
      setVehicles([]);
      setVehicleLogs([]);
      setTodos([]);
      setEntities([]);
      setExerciseLogs([]);
      setCalendarEvents([]);
      setMenstrualLogs([]);
      setMenstrualPeriods([]);
      clearGmailSession();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Exit from Guest Preview Mode
  const handleExitGuestMode = () => {
    setGuestMode(false);
    sessionStorage.removeItem('chuvadi_guest_mode');
    clearGmailSession();
    sanitizeAndPurgeContaminatedCaches();
    setUser(null);
    setAccounts([]);
    setTransactions([]);
    setVehicles([]);
    setVehicleLogs([]);
    setTodos([]);
    setEntities([]);
    setExerciseLogs([]);
    setCalendarEvents([]);
    setMenstrualLogs([]);
    setMenstrualPeriods([]);
  };

  // Continue to Guest Mode from Login Screen
  const handleContinueAsGuest = async () => {
    if (user) {
      try {
        await logoutUser();
      } catch (e) {}
      setUser(null);
    }
    setGuestMode(true);
    sessionStorage.setItem('chuvadi_guest_mode', 'true');
  };

  // 1. Loading screen while Firebase Auth initializes
  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-[#0a0d12] flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs text-slate-400 font-medium tracking-wide">Loading Chuvadi Life OS...</span>
      </div>
    );
  }

  // 2. If user is NOT logged in and has not entered Guest Mode, show the dedicated Welcome & Sign-In Screen!
  if (!user && !guestMode) {
    return (
      <>
        <AuthScreen 
          onLogin={async () => {
            await loginWithGoogle();
          }} 
          onContinueAsGuest={handleContinueAsGuest} 
        />
        <PWAInstallBanner />
      </>
    );
  }

  const isCurrentGuest = Boolean(guestMode && !user);

  // 3. Main Authenticated / Guest App Screen
  return (
    <div className="min-h-screen bg-[var(--theme-bg,#0a0d12)] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 transition-colors duration-200">
      {/* Top Application Header */}
      <Header
        totalNetWorth={totalNetWorth}
        monthlyExpense={monthlyExpense}
        user={user}
        isOnline={isOnline}
        isGuestMode={isCurrentGuest}
        onOpenQuickAdd={() => {
          setEditingTxn(null);
          setIsTxnModalOpen(true);
        }}
        onOpenAi={() => setActiveTab('ai')}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onLogin={loginWithGoogle}
        onLogout={handleLogout}
        onExitGuestMode={handleExitGuestMode}
        onToggleSideMenu={() => setIsSideMenuOpen(prev => !prev)}
        unreadNotificationsCount={renewalsCount + pendingTodosCount}
      />

      {/* Open-Closable Side Navigation Menu */}
      <SideMenu
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        renewalsCount={renewalsCount}
        pendingTodosCount={pendingTodosCount}
        isGuestMode={isCurrentGuest}
        onExitGuestMode={handleExitGuestMode}
        onLogin={loginWithGoogle}
        onOpenQuickAdd={() => {
          setEditingTxn(null);
          setIsTxnModalOpen(true);
        }}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        {/* Isolated User Workspace Notice for Non-Primary Users with Empty Data */}
        {user && !isPrimaryUser(user) && !nonPrimaryBannerDismissed && accounts.length === 0 && transactions.length === 0 && (
          <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-sky-950/40 via-[#131b26] to-slate-900 border border-sky-500/30 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                <span>Private Workspace • {user.email}</span>
              </div>
              <p className="text-[11px] text-slate-300">
                You are in your own private, isolated workspace. All data is blank by default. You can start recording fresh or load demo data to explore the features.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  handleSeedForActiveUser();
                  setNonPrimaryBannerDismissed(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm"
              >
                Load Demo Data
              </button>
              <button
                onClick={() => setNonPrimaryBannerDismissed(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
              >
                Start Blank
              </button>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <DashboardTab
            totalNetWorth={totalNetWorth}
            monthlyExpense={monthlyExpense}
            monthlyIncome={monthlyIncome}
            accounts={accounts}
            transactions={transactions}
            vehicles={vehicles}
            todos={todos}
            onOpenQuickAdd={() => {
              setEditingTxn(null);
              setIsTxnModalOpen(true);
            }}
            onOpenPassbook={handleOpenPassbook}
            onSelectTxn={handleSelectTxn}
            onSelectTab={setActiveTab}
            onToggleTodoItem={handleToggleTodoItem}
            isGuestMode={isCurrentGuest}
            onLogin={loginWithGoogle}
            onExitGuestMode={handleExitGuestMode}
          />
        )}

        {activeTab === 'finance' && (
          <FinanceTab
            accounts={accounts}
            transactions={transactions}
            entities={entities}
            onOpenNewAccount={(defaultType) => {
              setEditingAccount(defaultType ? ({ id: '', name: '', type: defaultType, balance: 0 } as any) : null);
              setIsAccountModalOpen(true);
            }}
            onEditAccount={(acc) => {
              setEditingAccount(acc);
              setIsAccountModalOpen(true);
            }}
            onSaveAccount={handleSaveAccount}
            onDeleteAccount={handleDeleteAccount}
            onOpenPassbook={handleOpenPassbook}
            onSelectTxn={handleSelectTxn}
            onOpenNewTxn={() => {
              setEditingTxn(null);
              setIsTxnModalOpen(true);
            }}
            onOpenNewEntity={() => setIsEntityModalOpen(true)}
            onDeleteEntity={handleDeleteEntity}
            onOpenNewTxnWithDefaults={(defaults, emailId) => {
              if (emailId) setPendingEmailImportId(emailId);
              setEditingTxn(defaults as any);
              setIsTxnModalOpen(true);
            }}
            isGuestMode={isCurrentGuest}
            user={user}
          />
        )}

        {activeTab === 'garage' && (
          <GarageTab
            vehicles={vehicles}
            vehicleLogs={vehicleLogs}
            onOpenNewVehicle={() => {
              setEditingVehicle(null);
              setIsVehicleModalOpen(true);
            }}
            onEditVehicle={(veh) => {
              setEditingVehicle(veh);
              setIsVehicleModalOpen(true);
            }}
            onOpenNewLog={handleOpenNewLog}
            onEditLog={(log) => {
              setEditingServiceLog(log);
              setIsServiceLogModalOpen(true);
            }}
          />
        )}

        {activeTab === 'todos' && (
          <TodosTab
            todos={todos}
            onOpenNewTodo={() => {
              setEditingTodo(null);
              setIsTodoModalOpen(true);
            }}
            onEditTodo={(todo) => {
              setEditingTodo(todo);
              setIsTodoModalOpen(true);
            }}
            onDeleteTodo={handleDeleteTodo}
            onToggleTodoItem={handleToggleTodoItem}
            onTogglePin={handleTogglePin}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarTab
            transactions={transactions}
            vehicles={vehicles}
            vehicleLogs={vehicleLogs}
            exerciseLogs={exerciseLogs}
            calendarEvents={calendarEvents}
            menstrualLogs={menstrualLogs}
            menstrualPeriods={menstrualPeriods}
            entities={entities}
            onSaveCalendarEvent={handleSaveCalendarEvent}
            onDeleteCalendarEvent={handleDeleteCalendarEvent}
            onOpenQuickAddTxn={(defaultDate) => {
              setEditingTxn(defaultDate ? ({ date: defaultDate } as any) : null);
              setIsTxnModalOpen(true);
            }}
          />
        )}

        {activeTab === 'menstrual' && (
          <MenstrualTrackerTab
            logs={menstrualLogs}
            periods={menstrualPeriods}
            settings={menstrualSettings}
            onSaveLog={handleSaveMenstrualLog}
            onDeleteLog={handleDeleteMenstrualLog}
            onSavePeriod={handleSaveMenstrualPeriod}
            onDeletePeriod={handleDeleteMenstrualPeriod}
            onSaveSettings={handleSaveMenstrualSettings}
          />
        )}

        {activeTab === 'exercise' && (
          <ExerciseLogView
            logs={exerciseLogs}
            onSaveLog={handleSaveExerciseLog}
            onDeleteLog={handleDeleteExerciseLog}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsTab
            accounts={accounts}
            transactions={transactions}
            vehicles={vehicles}
          />
        )}

        {activeTab === 'ai' && (
          <AiAssistantTab
            accounts={accounts}
            vehicles={vehicles}
            transactions={transactions}
            todos={todos}
            onSaveParsedTransaction={async (t) => { await handleSaveTransaction(t); }}
          />
        )}
      </main>

      {/* ========================================================= */}
      {/* GLOBAL MODALS                                             */}
      {/* ========================================================= */}

      {/* 1. Transaction Create / Edit Modal */}
      <TransactionModal
        isOpen={isTxnModalOpen}
        onClose={() => {
          setIsTxnModalOpen(false);
          setEditingTxn(null);
          setPendingEmailImportId(null);
        }}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
        accounts={accounts}
        vehicles={vehicles}
        initialData={editingTxn}
      />

      {/* 2. Account Create / Edit Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
          setEditingAccount(null);
        }}
        onSave={handleSaveAccount}
        initialData={editingAccount}
      />

      {/* 3. Account Passbook Modal */}
      <PassbookModal
        isOpen={isPassbookOpen}
        onClose={() => {
          setIsPassbookOpen(false);
          setPassbookAccount(null);
        }}
        account={passbookAccount}
        transactions={transactions}
        onSelectTxn={handleSelectTxn}
      />

      {/* 4. Vehicle Create / Edit Modal */}
      <VehicleModal
        isOpen={isVehicleModalOpen}
        onClose={() => {
          setIsVehicleModalOpen(false);
          setEditingVehicle(null);
        }}
        onSave={handleSaveVehicle}
        initialData={editingVehicle}
      />

      {/* 5. Service / Fuel Log Modal */}
      <ServiceLogModal
        isOpen={isServiceLogModalOpen}
        onClose={() => {
          setIsServiceLogModalOpen(false);
          setEditingServiceLog(null);
          setLogInitialVehicleId(undefined);
        }}
        onSave={handleSaveVehicleLog}
        vehicles={vehicles}
        initialData={editingServiceLog}
        initialVehicleId={logInitialVehicleId}
      />

      {/* 6. Todo Note Modal */}
      <TodoModal
        isOpen={isTodoModalOpen}
        onClose={() => {
          setIsTodoModalOpen(false);
          setEditingTodo(null);
        }}
        onSave={handleSaveTodo}
        onDelete={handleDeleteTodo}
        initialData={editingTodo}
      />

      {/* 7. Entity (Receivables/Payables) Modal */}
      <EntityModal
        isOpen={isEntityModalOpen}
        onClose={() => setIsEntityModalOpen(false)}
        onSave={handleSaveEntity}
      />

      {/* 8. Export & Backup Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        accounts={accounts}
        transactions={transactions}
        vehicles={vehicles}
        vehicleLogs={vehicleLogs}
        todos={todos}
        entities={entities}
        onImportData={async (data) => {
          if (data.accounts) for (const a of data.accounts) await handleSaveAccount(a);
          if (data.transactions) for (const t of data.transactions) await handleSaveTransaction(t);
          if (data.vehicles) for (const v of data.vehicles) await handleSaveVehicle(v);
          if (data.vehicleLogs) for (const l of data.vehicleLogs) await handleSaveVehicleLog(l);
          if (data.todos) for (const td of data.todos) await handleSaveTodo(td);
          if (data.entities) for (const e of data.entities) await handleSaveEntity(e);
        }}
      />

      {/* 9. Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        user={user}
        isGuestMode={isCurrentGuest}
        onLogin={loginWithGoogle}
        onExitGuestMode={handleExitGuestMode}
        onSeedData={handleSeedForActiveUser}
        onClearUserData={handleClearActiveUser}
        onClearCache={clearLocalCache}
      />

      {/* 10. Native PWA Install Banner (Triggered only when beforeinstallprompt is detected) */}
      <PWAInstallBanner />

      {/* 11. Guest Mode Floating Overlay Action Pill */}
      {isCurrentGuest && (
        <GuestModeOverlay 
          onExitGuestMode={handleExitGuestMode}
          onLogin={loginWithGoogle}
        />
      )}
    </div>
  );
}

export default App;
