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
  subscribeAuth,
  createDocId
} from './services/firebase';
import type { User } from 'firebase/auth';

import { Header } from './components/Header';
import { SideMenu } from './components/SideMenu';
import { AuthScreen } from './components/common/AuthScreen';
import { PWAInstallBanner } from './components/common/PWAInstallBanner';
import { GuestModeOverlay } from './components/common/GuestModeOverlay';
import { DailyInstallToast } from './components/common/DailyInstallToast';
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
  DEMO_MENSTRUAL_LOGS,
  DEMO_BODY_PROFILES
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
import { NotificationSettingsModal } from './components/modals/NotificationSettingsModal';
import { NotificationsModal } from './components/modals/NotificationsModal';
import { 
  checkAndTriggerDueNotifications,
  getStoredNotificationSettings,
  getStoredNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  syncAndGenerateAppNotifications,
  type NotificationSettings,
  type AppNotification
} from './services/notificationService';
import { ChuvadiLogo } from './components/ChuvadiLogo';

// Components & Tabs
import { Navigation } from './components/Navigation';
import { DashboardTab } from './components/tabs/DashboardTab';
import { FinanceTab } from './components/tabs/FinanceTab';
import { GarageTab } from './components/tabs/GarageTab';
import { TodosTab } from './components/tabs/TodosTab';
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
  MenstrualCycleSettings,
  BodyProfileLog,
  TabVisibilityMap
} from './types';

export function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [financeSubTab, setFinanceSubTab] = useState<'coa' | 'transactions' | 'reports' | 'inbox'>('coa');
  const [isSideMenuOpen, setIsSideMenuOpen] = useState<boolean>(false);

  const handleSelectTab = (tab: ActiveTab) => {
    if (tab === 'reports') {
      setActiveTab('finance');
      setFinanceSubTab('reports');
    } else {
      setActiveTab(tab);
    }
    try {
      window.history.pushState({ tab, modal: null }, '', window.location.href);
    } catch {}
  };

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
  const [bodyProfileLogs, setBodyProfileLogs] = useState<BodyProfileLog[]>(() => {
    const saved = sessionStorage.getItem('chuvadi_body_profiles');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEMO_BODY_PROFILES;
  });
  const [tabVisibility, setTabVisibility] = useState<TabVisibilityMap>(() => {
    const saved = localStorage.getItem('chuvadi_tab_visibility');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      dashboard: true,
      finance: true,
      garage: true,
      todos: true,
      calendar: true,
      exercise: true,
      menstrual: true,
      reports: true,
      ai: true
    };
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
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);
  const [isNotificationsListOpen, setIsNotificationsListOpen] = useState(false);

  // Notifications State & Settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => getStoredNotificationSettings());
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>(() => getStoredNotifications());

  // Back Button Navigation & Exit State
  const [showExitToast, setShowExitToast] = useState(false);
  const [isAppClosed, setIsAppClosed] = useState(false);

  const activeTabRef = React.useRef<ActiveTab>(activeTab);
  activeTabRef.current = activeTab;

  const lastBackPressTimeRef = React.useRef<number>(0);
  const exitToastTimerRef = React.useRef<any>(null);

  // Helper to close whichever modal/drawer is open
  const closeOpenModalOrDrawer = () => {
    if (isSideMenuOpen) {
      setIsSideMenuOpen(false);
      return true;
    }
    if (isNotificationsListOpen) {
      setIsNotificationsListOpen(false);
      return true;
    }
    if (isNotificationSettingsOpen) {
      setIsNotificationSettingsOpen(false);
      return true;
    }
    if (isSettingsModalOpen) {
      setIsSettingsModalOpen(false);
      return true;
    }
    if (isExportModalOpen) {
      setIsExportModalOpen(false);
      return true;
    }
    if (isEntityModalOpen) {
      setIsEntityModalOpen(false);
      return true;
    }
    if (isTodoModalOpen) {
      setIsTodoModalOpen(false);
      setEditingTodo(null);
      return true;
    }
    if (isServiceLogModalOpen) {
      setIsServiceLogModalOpen(false);
      setEditingServiceLog(null);
      return true;
    }
    if (isVehicleModalOpen) {
      setIsVehicleModalOpen(false);
      setEditingVehicle(null);
      return true;
    }
    if (isPassbookOpen) {
      setIsPassbookOpen(false);
      setPassbookAccount(null);
      return true;
    }
    if (isAccountModalOpen) {
      setIsAccountModalOpen(false);
      setEditingAccount(null);
      return true;
    }
    if (isTxnModalOpen) {
      setIsTxnModalOpen(false);
      setEditingTxn(null);
      return true;
    }
    return false;
  };
  const closeOpenModalOrDrawerRef = React.useRef(closeOpenModalOrDrawer);
  closeOpenModalOrDrawerRef.current = closeOpenModalOrDrawer;

  const handleCloseApp = () => {
    try {
      window.close();
    } catch {}
    setIsAppClosed(true);
  };
  const handleCloseAppRef = React.useRef(handleCloseApp);
  handleCloseAppRef.current = handleCloseApp;

  const handleCloseAppClick = () => {
    const now = Date.now();
    if (now - lastBackPressTimeRef.current < 2500) {
      handleCloseApp();
    } else {
      lastBackPressTimeRef.current = now;
      setShowExitToast(true);
      if (exitToastTimerRef.current) clearTimeout(exitToastTimerRef.current);
      exitToastTimerRef.current = setTimeout(() => {
        setShowExitToast(false);
      }, 2500);
    }
  };

  // Intercept Device / Browser Back Button (popstate)
  useEffect(() => {
    try {
      window.history.replaceState({ tab: 'dashboard', modal: null }, '', window.location.href);
    } catch {}

    const handlePopState = () => {
      // 1. If any modal or drawer is open, close it!
      if (closeOpenModalOrDrawerRef.current()) {
        try {
          window.history.pushState({ tab: activeTabRef.current, modal: null }, '', window.location.href);
        } catch {}
        return;
      }

      // 2. If not on dashboard, navigate to dashboard!
      if (activeTabRef.current !== 'dashboard') {
        setActiveTab('dashboard');
        try {
          window.history.pushState({ tab: 'dashboard', modal: null }, '', window.location.href);
        } catch {}
        return;
      }

      // 3. User is already on Dashboard and no modal is open -> Double back to exit!
      const now = Date.now();
      if (now - lastBackPressTimeRef.current < 2500) {
        handleCloseAppRef.current();
      } else {
        lastBackPressTimeRef.current = now;
        setShowExitToast(true);
        if (exitToastTimerRef.current) clearTimeout(exitToastTimerRef.current);
        exitToastTimerRef.current = setTimeout(() => {
          setShowExitToast(false);
        }, 2500);
        try {
          window.history.pushState({ tab: 'dashboard', modal: null }, '', window.location.href);
        } catch {}
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (exitToastTimerRef.current) clearTimeout(exitToastTimerRef.current);
    };
  }, []);

  // Synchronize In-App Notifications with user data
  useEffect(() => {
    if (notificationSettings.enabled) {
      const generated = syncAndGenerateAppNotifications({
        vehicles,
        todos,
        calendarEvents,
        bodyProfileLogs,
        menstrualLogs,
        transactions
      });
      setAppNotifications(generated);
    }
  }, [vehicles, todos, calendarEvents, bodyProfileLogs, menstrualLogs, transactions, notificationSettings.enabled]);

  const unreadNotificationsCount = useMemo(() => {
    if (!notificationSettings.enabled) return 0;
    return appNotifications.filter(n => !n.read).length;
  }, [notificationSettings.enabled, appNotifications]);

  const handleMarkNotificationAsRead = (id: string) => {
    const updated = markNotificationAsRead(id);
    setAppNotifications(updated);
  };

  const handleMarkAllNotificationsAsRead = () => {
    const updated = markAllNotificationsAsRead();
    setAppNotifications(updated);
  };

  const handleDeleteNotification = (id: string) => {
    const updated = deleteNotification(id);
    setAppNotifications(updated);
  };

  const handleClearAllNotifications = () => {
    const updated = clearAllNotifications();
    setAppNotifications(updated);
  };

  const handleNotificationSettingsUpdated = () => {
    const fresh = getStoredNotificationSettings();
    setNotificationSettings(fresh);
    if (fresh.enabled) {
      const generated = syncAndGenerateAppNotifications({
        vehicles,
        todos,
        calendarEvents,
        bodyProfileLogs,
        menstrualLogs,
        transactions
      });
      setAppNotifications(generated);
    }
    checkAndTriggerDueNotifications({
      vehicles,
      vehicleLogs,
      todos,
      calendarEvents,
      bodyProfileLogs,
      menstrualLogs,
      menstrualSettings
    });
  };

  // Check and trigger due local notifications based on user's configured frequency & alert rules
  useEffect(() => {
    checkAndTriggerDueNotifications({
      vehicles,
      vehicleLogs,
      todos,
      calendarEvents,
      bodyProfileLogs,
      menstrualLogs,
      menstrualSettings
    });
  }, [vehicles, todos, calendarEvents, bodyProfileLogs]);

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
      setBodyProfileLogs(JSON.parse(JSON.stringify(DEMO_BODY_PROFILES)));
    }
  }, [guestMode, user]);

  // Computed Accounts: Current balance is dynamically calculated as Opening Balance + all transactions in the account
  const computedAccounts = useMemo(() => {
    return accounts.map(acc => {
      const opening = typeof acc.openingBalance === 'number'
        ? acc.openingBalance
        : (typeof acc.balance === 'number' ? acc.balance : 0);
      let credits = 0;
      let debits = 0;
      for (const t of transactions) {
        if ((t.type === 'INCOME' && t.toAccountId === acc.id) || (t.type === 'TRANSFER' && t.toAccountId === acc.id)) {
          credits += Number(t.amount) || 0;
        } else if ((t.type === 'EXPENSE' && t.fromAccountId === acc.id) || (t.type === 'TRANSFER' && t.fromAccountId === acc.id)) {
          debits += Number(t.amount) || 0;
        }
      }
      return {
        ...acc,
        openingBalance: opening,
        balance: opening + credits - debits
      };
    });
  }, [accounts, transactions]);

  // Compute Net Worth
  const totalNetWorth = useMemo(() => {
    return computedAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  }, [computedAccounts]);

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
    const id = txn.id || createDocId('transactions', user);
    const newAmt = Number(txn.amount) || 0;
    const existing = transactions.find(t => t.id === id);
    const oldAmt = existing ? Number(existing.amount) || 0 : 0;

    const payload: Transaction = {
      ...txn,
      id,
      timestamp: txn.timestamp || Date.now(),
      amount: newAmt
    };

    // Immediate optimistic update of transactions
    setTransactions(prev => {
      const idx = prev.findIndex(t => t.id === id);
      return idx >= 0 ? prev.map(t => t.id === id ? payload : t) : [payload, ...prev];
    });

    // Immediate optimistic update of account balances
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
      markEmailAsAdded(pendingEmailImportId, id, user?.email || user?.uid || (guestMode ? 'guest' : null));
      setPendingEmailImportId(null);
    }

    if (guestMode && !user) {
      return;
    }

    try {
      await saveTransactionAtomic(payload, existing, user);
      if (txn.vehicleId && txn.odometer) {
        const veh = vehicles.find(v => v.id === txn.vehicleId);
        if (veh && txn.odometer > veh.currentOdometer) {
          await saveVehicle({ ...veh, currentOdometer: txn.odometer }, user);
        }
      }
    } catch (err) {
      console.error('Error committing atomic transaction:', err);
    }
  };

  const handleDeleteTransaction = async (txn: Transaction) => {
    // Immediate optimistic update
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

    if (guestMode && !user) {
      return;
    }

    try {
      await deleteTransactionAtomic(txn, user);
    } catch (err) {
      console.error('Error deleting transaction atomically:', err);
    }
  };

  // Account Operations
  const handleSaveAccount = async (acc: Omit<Account, 'id'> & { id?: string }) => {
    const id = acc.id || createDocId('accounts', user);
    let credits = 0;
    let debits = 0;
    for (const t of transactions) {
      if ((t.type === 'INCOME' && t.toAccountId === id) || (t.type === 'TRANSFER' && t.toAccountId === id)) {
        credits += Number(t.amount) || 0;
      } else if ((t.type === 'EXPENSE' && t.fromAccountId === id) || (t.type === 'TRANSFER' && t.fromAccountId === id)) {
        debits += Number(t.amount) || 0;
      }
    }
    const op = typeof acc.openingBalance === 'number'
      ? acc.openingBalance
      : (typeof acc.balance === 'number' ? acc.balance : 0);
    const calculatedBalance = op + credits - debits;

    const payload: Account = { 
      ...acc, 
      id, 
      openingBalance: op,
      balance: calculatedBalance, 
      updatedAt: Date.now() 
    };
    setAccounts(prev => {
      const idx = prev.findIndex(a => a.id === id);
      return idx >= 0 ? prev.map(a => a.id === id ? payload : a) : [...prev, payload];
    });

    if (guestMode && !user) return;
    try {
      await saveAccount(payload, user);
    } catch (err) {
      console.error('Error saving account:', err);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
    if (guestMode && !user) return;
    try {
      await deleteAccount(id, user);
    } catch (err) {
      console.error('Error deleting account:', err);
    }
  };

  // Vehicle Operations
  const handleSaveVehicle = async (veh: Omit<Vehicle, 'id'> & { id?: string }) => {
    const id = veh.id || createDocId('vehicles', user);
    const payload: Vehicle = { ...veh, id, currentOdometer: Number(veh.currentOdometer) || 0 };
    setVehicles(prev => {
      const idx = prev.findIndex(v => v.id === id);
      return idx >= 0 ? prev.map(v => v.id === id ? payload : v) : [...prev, payload];
    });

    if (guestMode && !user) return;
    try {
      await saveVehicle(payload, user);
    } catch (err) {
      console.error('Error saving vehicle:', err);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
    if (guestMode && !user) return;
    try {
      await deleteVehicle(id, user);
    } catch (err) {
      console.error('Error deleting vehicle:', err);
    }
  };

  // Vehicle Logs
  const handleSaveVehicleLog = async (log: Omit<VehicleLog, 'id'> & { id?: string }) => {
    const id = log.id || createDocId('vehicle_logs', user);
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

    if (guestMode && !user) return;
    try {
      await saveVehicleLog(payload, user);
      const vehicle = vehicles.find(v => v.id === log.vehicleId);
      if (vehicle && log.odometer && log.odometer > vehicle.currentOdometer) {
        await saveVehicle({ ...vehicle, currentOdometer: log.odometer }, user);
      }
    } catch (err) {
      console.error('Error saving vehicle log:', err);
    }
  };

  // Todo Note Handlers
  const handleSaveTodo = async (todo: Omit<TodoNote, 'id'> & { id?: string }) => {
    const id = todo.id || createDocId('todos', user);
    const payload: TodoNote = {
      ...todo,
      id,
      createdAt: todo.createdAt || Date.now(),
      updatedAt: Date.now()
    };
    setTodos(prev => {
      const idx = prev.findIndex(t => t.id === id);
      return idx >= 0 ? prev.map(t => t.id === id ? payload : t) : [payload, ...prev];
    });

    if (guestMode && !user) return;
    try {
      await saveTodo(payload, user);
    } catch (err) {
      console.error('Error saving todo note:', err);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    if (guestMode && !user) return;
    try {
      await deleteTodo(id, user);
    } catch (err) {
      console.error('Error deleting todo note:', err);
    }
  };

  const handleToggleTodoItem = async (noteId: string, itemId: string) => {
    const note = todos.find(t => t.id === noteId);
    if (!note) return;

    const updatedItems = note.items.map(it => 
      it.id === itemId ? { ...it, completed: !it.completed } : it
    );
    const updatedNote: TodoNote = {
      ...note,
      items: updatedItems,
      updatedAt: Date.now()
    };

    setTodos(prev => prev.map(t => t.id === noteId ? updatedNote : t));

    if (guestMode && !user) return;
    try {
      await saveTodo(updatedNote, user);
    } catch (err) {
      console.error('Error updating todo checklist item:', err);
    }
  };

  const handleUpdateTodoItemDate = async (noteId: string, itemId: string, date: string) => {
    const note = todos.find(t => t.id === noteId);
    if (!note) return;

    const updatedItems = note.items.map(it => 
      it.id === itemId ? { ...it, date: date ? date : undefined } : it
    );
    const updatedNote: TodoNote = {
      ...note,
      items: updatedItems,
      updatedAt: Date.now()
    };

    setTodos(prev => prev.map(t => t.id === noteId ? updatedNote : t));

    if (guestMode && !user) return;
    try {
      await saveTodo(updatedNote, user);
    } catch (err) {
      console.error('Error updating todo item date:', err);
    }
  };

  const handleTogglePin = async (todo: TodoNote) => {
    const updatedNote: TodoNote = {
      ...todo,
      pinned: !todo.pinned,
      updatedAt: Date.now()
    };

    setTodos(prev => prev.map(t => t.id === todo.id ? updatedNote : t));

    if (guestMode && !user) return;
    try {
      await saveTodo(updatedNote, user);
    } catch (err) {
      console.error('Error toggling pin:', err);
    }
  };

  // Entity Handlers
  const handleSaveEntity = async (entity: Omit<Entity, 'id'> & { id?: string }) => {
    const id = entity.id || createDocId('receivables_payables', user);
    const payload: Entity = { ...entity, id, amount: Number(entity.amount) || 0 };
    setEntities(prev => {
      const idx = prev.findIndex(e => e.id === id);
      return idx >= 0 ? prev.map(e => e.id === id ? payload : e) : [payload, ...prev];
    });

    if (guestMode && !user) return;
    try {
      await saveEntity(payload, user);
    } catch (err) {
      console.error('Error saving entity:', err);
    }
  };

  const handleDeleteEntity = async (id: string) => {
    setEntities(prev => prev.filter(e => e.id !== id));
    if (guestMode && !user) return;
    try {
      await deleteEntity(id, user);
    } catch (err) {
      console.error('Error deleting entity:', err);
    }
  };

  // Exercise Log Handlers
  const handleSaveExerciseLog = async (log: Omit<ExerciseLog, 'id'> & { id?: string }) => {
    const id = log.id || createDocId('exercise_logs', user);
    const payload: ExerciseLog = { ...log, id, updatedAt: Date.now() };
    setExerciseLogs(prev => {
      const idx = prev.findIndex(e => e.id === id);
      return idx >= 0 ? prev.map(e => e.id === id ? payload : e) : [payload, ...prev];
    });

    if (guestMode && !user) return;
    try {
      await saveExerciseLog(payload, user);
    } catch (err) {
      console.error('Error saving exercise log:', err);
    }
  };

  const handleDeleteExerciseLog = async (id: string) => {
    setExerciseLogs(prev => prev.filter(e => e.id !== id));
    if (guestMode && !user) return;
    try {
      await deleteExerciseLog(id, user);
    } catch (err) {
      console.error('Error deleting exercise log:', err);
    }
  };

  // Monthly Body Profile Handlers (Requirement 6)
  const handleSaveBodyProfile = async (log: Omit<BodyProfileLog, 'id'> & { id?: string }) => {
    const id = log.id || 'body-profile-' + Date.now();
    const payload: BodyProfileLog = {
      ...log,
      id,
      createdAt: log.createdAt || Date.now(),
      updatedAt: Date.now()
    };
    setBodyProfileLogs(prev => {
      const exists = prev.some(p => p.id === id);
      const updated = exists ? prev.map(p => (p.id === id ? payload : p)) : [payload, ...prev];
      sessionStorage.setItem('chuvadi_body_profiles', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteBodyProfile = async (id: string) => {
    setBodyProfileLogs(prev => {
      const updated = prev.filter(p => p.id !== id);
      sessionStorage.setItem('chuvadi_body_profiles', JSON.stringify(updated));
      return updated;
    });
  };

  // Menu Tab Visibility Customization Handler (Requirement 8)
  const handleToggleTabVisibility = (tabId: ActiveTab) => {
    setTabVisibility(prev => {
      const currentlyVisibleCount = Object.values(prev).filter(Boolean).length;
      if (prev[tabId] && currentlyVisibleCount <= 1) {
        return prev; // Never allow hiding all tabs
      }
      const next = { ...prev, [tabId]: !prev[tabId] };
      localStorage.setItem('chuvadi_tab_visibility', JSON.stringify(next));
      if (!next[activeTab]) {
        const firstVisible = (Object.keys(next) as ActiveTab[]).find(k => next[k]);
        if (firstVisible) setActiveTab(firstVisible);
      }
      return next;
    });
  };

  // Calendar Event Handlers
  const handleSaveCalendarEvent = async (event: Omit<CalendarEvent, 'id'> & { id?: string }) => {
    const id = event.id || createDocId('calendar_events', user);
    const payload: CalendarEvent = { ...event, id, updatedAt: Date.now() };
    setCalendarEvents(prev => {
      const idx = prev.findIndex(c => c.id === id);
      return idx >= 0 ? prev.map(c => c.id === id ? payload : c) : [...prev, payload];
    });

    if (guestMode && !user) return;
    try {
      await saveCalendarEvent(payload, user);
    } catch (err) {
      console.error('Error saving calendar event:', err);
    }
  };

  const handleDeleteCalendarEvent = async (id: string) => {
    setCalendarEvents(prev => prev.filter(c => c.id !== id));
    if (guestMode && !user) return;
    try {
      await deleteCalendarEvent(id, user);
    } catch (err) {
      console.error('Error deleting calendar event:', err);
    }
  };

  // Menstrual Tracker Handlers
  const handleSaveMenstrualLog = async (log: Omit<MenstrualLog, 'id'> & { id?: string }) => {
    const id = log.id || createDocId('menstrual_logs', user);
    const payload: MenstrualLog = { ...log, id, updatedAt: Date.now() };
    setMenstrualLogs(prev => {
      const idx = prev.findIndex(m => m.id === id);
      return idx >= 0 ? prev.map(m => m.id === id ? payload : m) : [payload, ...prev];
    });

    if (guestMode && !user) return;
    try {
      await saveMenstrualLog(payload, user);
    } catch (err) {
      console.error('Error saving menstrual log:', err);
    }
  };

  const handleDeleteMenstrualLog = async (id: string) => {
    setMenstrualLogs(prev => prev.filter(m => m.id !== id));
    if (guestMode && !user) return;
    try {
      await deleteMenstrualLog(id, user);
    } catch (err) {
      console.error('Error deleting menstrual log:', err);
    }
  };

  const handleSaveMenstrualPeriod = async (period: Omit<MenstrualPeriodRecord, 'id'> & { id?: string }) => {
    const id = period.id || createDocId('menstrual_periods', user);
    const payload: MenstrualPeriodRecord = { ...period, id };
    setMenstrualPeriods(prev => {
      const idx = prev.findIndex(p => p.id === id);
      return idx >= 0 ? prev.map(p => p.id === id ? payload : p) : [payload, ...prev];
    });

    if (guestMode && !user) return;
    try {
      await saveMenstrualPeriod(payload, user);
    } catch (err) {
      console.error('Error saving menstrual period:', err);
    }
  };

  const handleDeleteMenstrualPeriod = async (id: string) => {
    setMenstrualPeriods(prev => prev.filter(p => p.id !== id));
    if (guestMode && !user) return;
    try {
      await deleteMenstrualPeriod(id, user);
    } catch (err) {
      console.error('Error deleting menstrual period:', err);
    }
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

  // If app was closed by user
  if (isAppClosed) {
    return (
      <div className="min-h-screen bg-[#0a0d12] flex flex-col items-center justify-center p-6 text-center animate-fadeIn selection:bg-amber-500 selection:text-slate-950">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4 shadow-xl">
          <ChuvadiLogo size={42} />
        </div>
        <h1 className="text-xl font-bold text-white mb-2 tracking-tight">Chuvadi Closed</h1>
        <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
          You have exited the application. You can safely close this browser tab, or tap below to reopen your Life OS.
        </p>
        <button
          onClick={() => {
            setIsAppClosed(false);
            setActiveTab('dashboard');
          }}
          className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-xs font-bold transition active:scale-95 shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          Reopen Chuvadi
        </button>
      </div>
    );
  }

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
        activeTab={activeTab}
        onBackToDashboard={() => handleSelectTab('dashboard')}
        onCloseApp={handleCloseAppClick}
        onOpenQuickAdd={() => {
          setEditingTxn(null);
          setIsTxnModalOpen(true);
        }}
        onOpenAi={() => handleSelectTab('ai')}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenNotificationSettings={() => setIsNotificationSettingsOpen(true)}
        onOpenNotifications={() => setIsNotificationsListOpen(true)}
        notificationsEnabled={notificationSettings.enabled}
        onLogin={loginWithGoogle}
        onLogout={handleLogout}
        onExitGuestMode={handleExitGuestMode}
        onToggleSideMenu={() => setIsSideMenuOpen(prev => !prev)}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {/* Open-Closable Side Navigation Menu */}
      <SideMenu
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
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
        onOpenNotificationSettings={() => setIsNotificationSettingsOpen(true)}
        onOpenNotifications={() => setIsNotificationsListOpen(true)}
        notificationsEnabled={notificationSettings.enabled}
        unreadNotificationsCount={unreadNotificationsCount}
        tabVisibility={tabVisibility}
      />

      {/* Primary Desktop and Mobile Bottom Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        renewalsCount={renewalsCount}
        pendingTodosCount={pendingTodosCount}
        tabVisibility={tabVisibility}
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
            accounts={computedAccounts}
            transactions={transactions}
            vehicles={vehicles}
            todos={todos}
            calendarEvents={calendarEvents}
            exerciseLogs={exerciseLogs}
            bodyProfileLogs={bodyProfileLogs}
            menstrualLogs={menstrualLogs}
            menstrualSettings={menstrualSettings}
            onOpenPassbook={handleOpenPassbook}
            onSelectTxn={handleSelectTxn}
            onSelectTab={handleSelectTab}
            onSelectFinanceSubTab={(st) => setFinanceSubTab(st)}
            onToggleTodoItem={handleToggleTodoItem}
            onUpdateTodoItemDate={handleUpdateTodoItemDate}
            isGuestMode={isCurrentGuest}
            onLogin={loginWithGoogle}
            onExitGuestMode={handleExitGuestMode}
          />
        )}

        {activeTab === 'finance' && (
          <FinanceTab
            accounts={computedAccounts}
            transactions={transactions}
            vehicles={vehicles}
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
            activeSubTab={financeSubTab}
            onSubTabChange={setFinanceSubTab}
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
            onUpdateTodoItemDate={handleUpdateTodoItemDate}
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
            bodyProfileLogs={bodyProfileLogs}
            onSaveBodyProfile={handleSaveBodyProfile}
            onDeleteBodyProfile={handleDeleteBodyProfile}
          />
        )}

        {activeTab === 'reports' && (
          <FinanceTab
            accounts={computedAccounts}
            transactions={transactions}
            vehicles={vehicles}
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
            activeSubTab="reports"
            onSubTabChange={setFinanceSubTab}
          />
        )}

        {activeTab === 'ai' && (
          <AiAssistantTab
            accounts={computedAccounts}
            vehicles={vehicles}
            transactions={transactions}
            todos={todos}
            calendarEvents={calendarEvents}
            exerciseLogs={exerciseLogs}
            bodyProfileLogs={bodyProfileLogs}
            menstrualLogs={menstrualLogs}
            menstrualSettings={menstrualSettings}
            entities={entities}
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
        accounts={computedAccounts}
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
        initialData={editingAccount ? (computedAccounts.find(a => a.id === editingAccount.id) || editingAccount) : null}
        transactions={transactions}
      />

      {/* 3. Account Passbook Modal */}
      <PassbookModal
        isOpen={isPassbookOpen}
        onClose={() => {
          setIsPassbookOpen(false);
          setPassbookAccount(null);
        }}
        account={passbookAccount ? (computedAccounts.find(a => a.id === passbookAccount.id) || passbookAccount) : null}
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
        tabVisibility={tabVisibility}
        onToggleTabVisibility={handleToggleTabVisibility}
        onOpenNotificationSettings={() => setIsNotificationSettingsOpen(true)}
      />

      {/* 10. Dedicated Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={isNotificationSettingsOpen}
        onClose={() => setIsNotificationSettingsOpen(false)}
        onSettingsUpdated={handleNotificationSettingsUpdated}
      />

      {/* 11. In-App Notifications Tray Modal with Mark as Read */}
      <NotificationsModal
        isOpen={isNotificationsListOpen}
        onClose={() => setIsNotificationsListOpen(false)}
        notifications={appNotifications}
        onMarkAsRead={handleMarkNotificationAsRead}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onDeleteNotification={handleDeleteNotification}
        onClearAll={handleClearAllNotifications}
        onOpenSettings={() => {
          setIsNotificationsListOpen(false);
          setIsNotificationSettingsOpen(true);
        }}
        onSelectTab={handleSelectTab}
      />

      {/* 12. Floating Double-Back / Close App Toast */}
      {showExitToast && (
        <div className="fixed bottom-16 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200 pointer-events-none">
          <div className="px-4 py-2.5 rounded-2xl bg-slate-900/95 border border-amber-500/40 text-amber-200 text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Press back or close again to exit Chuvadi</span>
          </div>
        </div>
      )}

      {/* 13. Native PWA Install Banner (Triggered only when beforeinstallprompt is detected) */}
      <PWAInstallBanner />

      {/* 14. Daily Floating 5-Second Install Toast (Only in browser mode, once a day) */}
      <DailyInstallToast />

      {/* 15. Guest Mode Floating Overlay Action Pill */}
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
