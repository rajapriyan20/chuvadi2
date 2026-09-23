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

  // Domain State from Firebase & Local Mirror
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

  // Subscribe to real-time Cloud Firestore collections & Auth
  useEffect(() => {
    const unsubAuth = subscribeAuth((currentUser) => {
      setUser(currentUser);
      setAuthInitialized(true);
      if (currentUser) {
        setGuestMode(false);
        sessionStorage.removeItem('chuvadi_guest_mode');
      }
    });

    const unsubAccounts = subscribeToAccounts(setAccounts);
    const unsubTxns = subscribeToTransactions(setTransactions);
    const unsubVehicles = subscribeToVehicles(setVehicles);
    const unsubLogs = subscribeToVehicleLogs(setVehicleLogs);
    const unsubTodos = subscribeToTodos(setTodos);
    const unsubEntities = subscribeToEntities(setEntities);
    const unsubExercise = subscribeToExerciseLogs(setExerciseLogs);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubAuth();
      unsubAccounts();
      unsubTxns();
      unsubVehicles();
      unsubLogs();
      unsubTodos();
      unsubEntities();
      unsubExercise();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

  // Transaction Handlers (ATOMIC FIRESTORE TRANSACTIONS)
  const handleSaveTransaction = async (txn: Omit<Transaction, 'id'> & { id?: string }) => {
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
    await deleteTransactionAtomic(txn);
  };

  // Todo Note Toggle Item Handler
  const handleToggleTodoItem = async (noteId: string, itemId: string) => {
    const note = todos.find(t => t.id === noteId);
    if (!note) return;

    const updatedItems = note.items.map(it => 
      it.id === itemId ? { ...it, completed: !it.completed } : it
    );

    await saveTodo({
      ...note,
      items: updatedItems,
      updatedAt: Date.now()
    });
  };

  const handleTogglePin = async (todo: TodoNote) => {
    await saveTodo({
      ...todo,
      pinned: !todo.pinned,
      updatedAt: Date.now()
    });
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

  const handleLogout = async () => {
    try {
      setCachedGmailToken(null);
      await logoutUser();
      setUser(null);
      setGuestMode(false);
      sessionStorage.removeItem('chuvadi_guest_mode');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleContinueAsGuest = () => {
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

  // 3. Main Authenticated App Screen
  return (
    <div className="min-h-screen bg-[#0a0d12] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Application Header with Chuvadi Logo, Credit Bar and Net Worth */}
      <Header
        totalNetWorth={totalNetWorth}
        monthlyExpense={monthlyExpense}
        user={user}
        isOnline={isOnline}
        onOpenQuickAdd={() => {
          setEditingTxn(null);
          setIsTxnModalOpen(true);
        }}
        onOpenAi={() => setActiveTab('ai')}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onLogin={loginWithGoogle}
        onLogout={handleLogout}
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
            onSaveAccount={async (acc) => { await saveAccount(acc); }}
            onDeleteAccount={deleteAccount}
            onOpenPassbook={handleOpenPassbook}
            onSelectTxn={handleSelectTxn}
            onOpenNewTxn={() => {
              setEditingTxn(null);
              setIsTxnModalOpen(true);
            }}
            onOpenNewEntity={() => setIsEntityModalOpen(true)}
            onDeleteEntity={deleteEntity}
            onOpenNewTxnWithDefaults={(defaults, emailId) => {
              if (emailId) setPendingEmailImportId(emailId);
              setEditingTxn(defaults as any);
              setIsTxnModalOpen(true);
            }}
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
            onDeleteTodo={deleteTodo}
            onToggleTodoItem={handleToggleTodoItem}
            onTogglePin={handleTogglePin}
          />
        )}

        {activeTab === 'exercise' && (
          <ExerciseLogView
            logs={exerciseLogs}
            onSaveLog={async (log) => { await saveExerciseLog(log); }}
            onDeleteLog={deleteExerciseLog}
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
        onSave={async (acc) => { await saveAccount(acc); }}
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
        onSave={async (veh) => { await saveVehicle(veh); }}
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
        onSave={async (log) => {
          await saveVehicleLog(log);

          // Update vehicle current odometer if this log is higher
          const vehicle = vehicles.find(v => v.id === log.vehicleId);
          if (vehicle && log.odometer && log.odometer > vehicle.currentOdometer) {
            await saveVehicle({ ...vehicle, currentOdometer: log.odometer });
          }
        }}
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
        onSave={async (todo) => { await saveTodo(todo); }}
        onDelete={deleteTodo}
        initialData={editingTodo}
      />

      {/* 7. Entity (Receivables/Payables) Modal */}
      <EntityModal
        isOpen={isEntityModalOpen}
        onClose={() => setIsEntityModalOpen(false)}
        onSave={async (entity) => { await saveEntity(entity); }}
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
          if (data.accounts) for (const a of data.accounts) await saveAccount(a);
          if (data.transactions) for (const t of data.transactions) await saveTransactionAtomic(t);
          if (data.vehicles) for (const v of data.vehicles) await saveVehicle(v);
          if (data.vehicleLogs) for (const l of data.vehicleLogs) await saveVehicleLog(l);
          if (data.todos) for (const td of data.todos) await saveTodo(td);
          if (data.entities) for (const e of data.entities) await saveEntity(e);
        }}
      />

      {/* 9. Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSeedData={seedStarterData}
        onClearCache={clearLocalCache}
      />
    </div>
  );
}

export default App;
