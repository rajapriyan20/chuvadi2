import React, { useState, useEffect, useMemo } from 'react';
import { 
  subscribeToAccounts, 
  subscribeToTransactions, 
  subscribeToVehicles, 
  subscribeToVehicleLogs, 
  subscribeToTodos, 
  subscribeToEntities,
  subscribeToExerciseLogs,
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
import { markEmailAsAdded, setCachedGmailToken } from './services/gmail';
import {
  DEMO_ACCOUNTS,
  DEMO_TRANSACTIONS,
  DEMO_VEHICLES,
  DEMO_VEHICLE_LOGS,
  DEMO_TODOS,
  DEMO_ENTITIES,
  DEMO_EXERCISE_LOGS
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

import { getDaysRemaining } from './utils/formatters';
import type { 
  ActiveTab, 
  Account, 
  Transaction, 
  Vehicle, 
  VehicleLog, 
  TodoNote, 
  Entity, 
  ExerciseLog 
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

  // Domain State (Isolated: Demo data in Guest Mode, Firestore data in Auth Mode)
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleLogs, setVehicleLogs] = useState<VehicleLog[]>([]);
  const [todos, setTodos] = useState<TodoNote[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);

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

  // Sync with Firestore ONLY WHEN Authenticated (No Firestore connection or data leak in Guest Mode!)
  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubAccounts = subscribeToAccounts(setAccounts);
    const unsubTxns = subscribeToTransactions(setTransactions);
    const unsubVehicles = subscribeToVehicles(setVehicles);
    const unsubLogs = subscribeToVehicleLogs(setVehicleLogs);
    const unsubTodos = subscribeToTodos(setTodos);
    const unsubEntities = subscribeToEntities(setEntities);
    const unsubExercise = subscribeToExerciseLogs(setExerciseLogs);

    return () => {
      unsubAccounts();
      unsubTxns();
      unsubVehicles();
      unsubLogs();
      unsubTodos();
      unsubEntities();
      unsubExercise();
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
        markEmailAsAdded(pendingEmailImportId, id);
        setPendingEmailImportId(null);
      }
      return;
    }

    const savedId = await saveTransactionAtomic(txn);

    if (pendingEmailImportId) {
      markEmailAsAdded(pendingEmailImportId, savedId);
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
    await saveExerciseLog(log);
  };

  const handleDeleteExerciseLog = async (id: string) => {
    if (guestMode && !user) {
      setExerciseLogs(prev => prev.filter(e => e.id !== id));
      return;
    }
    await deleteExerciseLog(id);
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
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Exit from Guest Preview Mode
  const handleExitGuestMode = () => {
    setGuestMode(false);
    sessionStorage.removeItem('chuvadi_guest_mode');
    setUser(null);
    setAccounts([]);
    setTransactions([]);
    setVehicles([]);
    setVehicleLogs([]);
    setTodos([]);
    setEntities([]);
    setExerciseLogs([]);
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
      <AuthScreen 
        onLogin={async () => {
          await loginWithGoogle();
        }} 
        onContinueAsGuest={handleContinueAsGuest} 
      />
    );
  }

  const isCurrentGuest = Boolean(guestMode && !user);

  // 3. Main Authenticated / Guest App Screen
  return (
    <div className="min-h-screen bg-[#0a0d12] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
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
        isGuestMode={isCurrentGuest}
        onLogin={loginWithGoogle}
        onExitGuestMode={handleExitGuestMode}
        onSeedData={async () => {
          if (guestMode && !user) {
            // Reset to pure demo starter data
            setAccounts(JSON.parse(JSON.stringify(DEMO_ACCOUNTS)));
            setTransactions(JSON.parse(JSON.stringify(DEMO_TRANSACTIONS)));
            setVehicles(JSON.parse(JSON.stringify(DEMO_VEHICLES)));
            setVehicleLogs(JSON.parse(JSON.stringify(DEMO_VEHICLE_LOGS)));
            setTodos(JSON.parse(JSON.stringify(DEMO_TODOS)));
            setEntities(JSON.parse(JSON.stringify(DEMO_ENTITIES)));
            setExerciseLogs(JSON.parse(JSON.stringify(DEMO_EXERCISE_LOGS)));
          } else {
            await seedStarterData();
          }
        }}
        onClearCache={clearLocalCache}
      />
    </div>
  );
}

export default App;
