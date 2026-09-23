/**
 * Firebase Firestore & Authentication Service for Chuvadi
 * Features:
 * - Real-time subscriptions
 * - Atomic Multi-Document Transactions (runTransaction)
 * - Offline LocalStorage Mirroring fallback
 * - Per-user or Shared Collection access
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc,
  deleteDoc, 
  onSnapshot, 
  runTransaction,
  query, 
  orderBy,
  limit
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as fbSignOut, 
  signInAnonymously,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import type { Account, Transaction, Vehicle, VehicleLog, TodoNote, Entity, ExerciseLog } from '../types';
import appletConfig from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: appletConfig.apiKey,
  authDomain: appletConfig.authDomain,
  projectId: appletConfig.projectId, // gen-lang-client-0292204589
  storageBucket: appletConfig.storageBucket,
  messagingSenderId: appletConfig.messagingSenderId,
  appId: appletConfig.appId
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Local Storage Keys for offline persistence & cache
const LS_PREFIX = 'chuvadi_cache_';

export function getCached<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

export function setCached<T>(key: string, val: T): void {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(val));
  } catch (e) {
    console.warn('LocalStorage quota exceeded:', e);
  }
}

// Authentication Helpers
export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: any) {
    if (
      err?.code === 'auth/popup-closed-by-user' ||
      err?.code === 'auth/cancelled-popup-request' ||
      err?.code === 'auth/user-cancelled'
    ) {
      // User voluntarily closed the popup or cancelled sign-in
      return null;
    }
    throw err;
  }
}

export async function loginAnonymously(): Promise<User> {
  const result = await signInAnonymously(auth);
  return result.user;
}

export async function logoutUser(): Promise<void> {
  await fbSignOut(auth);
}

export function subscribeAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ==========================================
// ATOMIC TRANSACTION HANDLERS (runTransaction)
// ==========================================

/**
 * Atomically saves a transaction (Expense, Income, or Transfer)
 * and safely updates corresponding account balances in a single atomic commit.
 */
export async function saveTransactionAtomic(
  txnData: Omit<Transaction, 'id'> & { id?: string },
  existingTxn?: Transaction | null
): Promise<string> {
  const txnId = txnData.id || doc(collection(db, 'transactions')).id;
  const txnRef = doc(db, 'transactions', txnId);

  try {
    await runTransaction(db, async (t) => {
      // 1. Read existing transaction balances if editing
      let oldFromAccDoc: any = null;
      let oldToAccDoc: any = null;
      let newFromAccDoc: any = null;
      let newToAccDoc: any = null;

      // Identify accounts to read
      const accountIdsToFetch = new Set<string>();
      if (existingTxn) {
        if (existingTxn.fromAccountId) accountIdsToFetch.add(existingTxn.fromAccountId);
        if (existingTxn.toAccountId) accountIdsToFetch.add(existingTxn.toAccountId);
      }
      if (txnData.fromAccountId) accountIdsToFetch.add(txnData.fromAccountId);
      if (txnData.toAccountId) accountIdsToFetch.add(txnData.toAccountId);

      // Read accounts inside the transaction
      const accountDocs = new Map<string, any>();
      for (const accId of accountIdsToFetch) {
        const ref = doc(db, 'accounts', accId);
        const snap = await t.get(ref);
        if (snap.exists()) {
          accountDocs.set(accId, { ref, data: snap.data() });
        }
      }

      // 2. Revert effects of the old transaction if editing
      if (existingTxn) {
        const oldAmt = Number(existingTxn.amount) || 0;
        if (existingTxn.type === 'EXPENSE' && existingTxn.fromAccountId) {
          const acc = accountDocs.get(existingTxn.fromAccountId);
          if (acc) acc.data.balance = (acc.data.balance || 0) + oldAmt;
        } else if (existingTxn.type === 'INCOME' && existingTxn.toAccountId) {
          const acc = accountDocs.get(existingTxn.toAccountId);
          if (acc) acc.data.balance = (acc.data.balance || 0) - oldAmt;
        } else if (existingTxn.type === 'TRANSFER') {
          if (existingTxn.fromAccountId) {
            const acc = accountDocs.get(existingTxn.fromAccountId);
            if (acc) acc.data.balance = (acc.data.balance || 0) + oldAmt;
          }
          if (existingTxn.toAccountId) {
            const acc = accountDocs.get(existingTxn.toAccountId);
            if (acc) acc.data.balance = (acc.data.balance || 0) - oldAmt;
          }
        }
      }

      // 3. Apply effects of the new transaction
      const newAmt = Number(txnData.amount) || 0;
      if (txnData.type === 'EXPENSE' && txnData.fromAccountId) {
        const acc = accountDocs.get(txnData.fromAccountId);
        if (acc) acc.data.balance = (acc.data.balance || 0) - newAmt;
      } else if (txnData.type === 'INCOME' && txnData.toAccountId) {
        const acc = accountDocs.get(txnData.toAccountId);
        if (acc) acc.data.balance = (acc.data.balance || 0) + newAmt;
      } else if (txnData.type === 'TRANSFER') {
        if (txnData.fromAccountId) {
          const acc = accountDocs.get(txnData.fromAccountId);
          if (acc) acc.data.balance = (acc.data.balance || 0) - newAmt;
        }
        if (txnData.toAccountId) {
          const acc = accountDocs.get(txnData.toAccountId);
          if (acc) acc.data.balance = (acc.data.balance || 0) + newAmt;
        }
      }

      // 4. If odometer update provided and vehicle linked, update vehicle
      if (txnData.vehicleId && txnData.odometer) {
        const vehRef = doc(db, 'vehicles', txnData.vehicleId);
        const vehSnap = await t.get(vehRef);
        if (vehSnap.exists()) {
          const vehData = vehSnap.data();
          if (!vehData.currentOdometer || txnData.odometer > vehData.currentOdometer) {
            t.update(vehRef, { currentOdometer: txnData.odometer });
          }
        }
      }

      // 5. Commit account balance updates
      for (const [_, item] of accountDocs) {
        t.update(item.ref, { 
          balance: item.data.balance,
          updatedAt: Date.now()
        });
      }

      // 6. Write transaction document
      const payload: Transaction = {
        ...txnData,
        id: txnId,
        timestamp: txnData.timestamp || Date.now(),
        amount: newAmt
      };
      t.set(txnRef, payload);
    });

    return txnId;
  } catch (err) {
    console.error('Atomic transaction failed on Firestore, writing to local cache fallback:', err);
    // Offline local mirror fallback
    const localTxns = getCached<Transaction[]>('transactions', []);
    const payload: Transaction = {
      ...txnData,
      id: txnId,
      timestamp: txnData.timestamp || Date.now(),
      amount: Number(txnData.amount) || 0
    };
    const updated = existingTxn 
      ? localTxns.map(t => t.id === txnId ? payload : t)
      : [payload, ...localTxns];
    setCached('transactions', updated);

    // Update local accounts
    const localAccounts = getCached<Account[]>('accounts', []);
    const newAmt = Number(txnData.amount) || 0;
    const oldAmt = existingTxn ? Number(existingTxn.amount) || 0 : 0;
    
    const updatedAccounts = localAccounts.map(acc => {
      let bal = acc.balance;
      if (existingTxn) {
        if (existingTxn.type === 'EXPENSE' && existingTxn.fromAccountId === acc.id) bal += oldAmt;
        if (existingTxn.type === 'INCOME' && existingTxn.toAccountId === acc.id) bal -= oldAmt;
        if (existingTxn.type === 'TRANSFER') {
          if (existingTxn.fromAccountId === acc.id) bal += oldAmt;
          if (existingTxn.toAccountId === acc.id) bal -= oldAmt;
        }
      }
      if (txnData.type === 'EXPENSE' && txnData.fromAccountId === acc.id) bal -= newAmt;
      if (txnData.type === 'INCOME' && txnData.toAccountId === acc.id) bal += newAmt;
      if (txnData.type === 'TRANSFER') {
        if (txnData.fromAccountId === acc.id) bal -= newAmt;
        if (txnData.toAccountId === acc.id) bal += newAmt;
      }
      return { ...acc, balance: bal, updatedAt: Date.now() };
    });
    setCached('accounts', updatedAccounts);

    return txnId;
  }
}

/**
 * Atomically deletes a transaction and restores account balances.
 */
export async function deleteTransactionAtomic(txn: Transaction): Promise<void> {
  const txnRef = doc(db, 'transactions', txn.id);

  try {
    await runTransaction(db, async (t) => {
      const amt = Number(txn.amount) || 0;
      
      if (txn.type === 'EXPENSE' && txn.fromAccountId) {
        const accRef = doc(db, 'accounts', txn.fromAccountId);
        const snap = await t.get(accRef);
        if (snap.exists()) {
          t.update(accRef, { 
            balance: (snap.data().balance || 0) + amt,
            updatedAt: Date.now()
          });
        }
      } else if (txn.type === 'INCOME' && txn.toAccountId) {
        const accRef = doc(db, 'accounts', txn.toAccountId);
        const snap = await t.get(accRef);
        if (snap.exists()) {
          t.update(accRef, { 
            balance: (snap.data().balance || 0) - amt,
            updatedAt: Date.now()
          });
        }
      } else if (txn.type === 'TRANSFER') {
        if (txn.fromAccountId) {
          const accRef = doc(db, 'accounts', txn.fromAccountId);
          const snap = await t.get(accRef);
          if (snap.exists()) {
            t.update(accRef, { 
              balance: (snap.data().balance || 0) + amt,
              updatedAt: Date.now()
            });
          }
        }
        if (txn.toAccountId) {
          const accRef = doc(db, 'accounts', txn.toAccountId);
          const snap = await t.get(accRef);
          if (snap.exists()) {
            t.update(accRef, { 
              balance: (snap.data().balance || 0) - amt,
              updatedAt: Date.now()
            });
          }
        }
      }

      t.delete(txnRef);
    });
  } catch (err) {
    console.error('Delete transaction failed on Firestore, updating local cache:', err);
    const localTxns = getCached<Transaction[]>('transactions', []);
    setCached('transactions', localTxns.filter(x => x.id !== txn.id));

    const localAccounts = getCached<Account[]>('accounts', []);
    const amt = Number(txn.amount) || 0;
    const updated = localAccounts.map(acc => {
      let bal = acc.balance;
      if (txn.type === 'EXPENSE' && txn.fromAccountId === acc.id) bal += amt;
      if (txn.type === 'INCOME' && txn.toAccountId === acc.id) bal -= amt;
      if (txn.type === 'TRANSFER') {
        if (txn.fromAccountId === acc.id) bal += amt;
        if (txn.toAccountId === acc.id) bal -= amt;
      }
      return { ...acc, balance: bal };
    });
    setCached('accounts', updated);
  }
}

/**
 * Account CRUD Operations
 */
export async function saveAccount(acc: Omit<Account, 'id'> & { id?: string }): Promise<string> {
  const id = acc.id || doc(collection(db, 'accounts')).id;
  const payload: Account = {
    ...acc,
    id,
    balance: Number(acc.balance) || 0,
    updatedAt: Date.now()
  };

  try {
    await setDoc(doc(db, 'accounts', id), payload, { merge: true });
  } catch (err) {
    console.warn('Firestore write failed, saving account to local cache:', err);
  }

  const local = getCached<Account[]>('accounts', []);
  const index = local.findIndex(a => a.id === id);
  if (index >= 0) {
    local[index] = payload;
  } else {
    local.push(payload);
  }
  setCached('accounts', local);
  return id;
}

export async function deleteAccount(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'accounts', id));
  } catch (err) {
    console.warn('Firestore delete failed:', err);
  }
  const local = getCached<Account[]>('accounts', []);
  setCached('accounts', local.filter(a => a.id !== id));
}

/**
 * Vehicle & Vehicle Log CRUD Operations
 */
export async function saveVehicle(veh: Omit<Vehicle, 'id'> & { id?: string }): Promise<string> {
  const id = veh.id || doc(collection(db, 'vehicles')).id;
  const payload: Vehicle = {
    ...veh,
    id,
    currentOdometer: Number(veh.currentOdometer) || 0
  };

  try {
    await setDoc(doc(db, 'vehicles', id), payload, { merge: true });
  } catch (err) {
    console.warn('Firestore vehicle write failed:', err);
  }

  const local = getCached<Vehicle[]>('vehicles', []);
  const idx = local.findIndex(v => v.id === id);
  if (idx >= 0) local[idx] = payload;
  else local.push(payload);
  setCached('vehicles', local);
  return id;
}

export async function deleteVehicle(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'vehicles', id));
  } catch (err) {
    console.warn('Firestore vehicle delete failed:', err);
  }
  const local = getCached<Vehicle[]>('vehicles', []);
  setCached('vehicles', local.filter(v => v.id !== id));
}

export async function saveVehicleLog(log: Omit<VehicleLog, 'id'> & { id?: string }): Promise<string> {
  const id = log.id || doc(collection(db, 'vehicle_logs')).id;
  const payload: VehicleLog = {
    ...log,
    id,
    timestamp: log.timestamp || Date.now(),
    cost: Number(log.cost) || 0,
    odometer: Number(log.odometer) || 0
  };

  try {
    await runTransaction(db, async (t) => {
      // Update vehicle odometer if this log is higher
      if (payload.vehicleId && payload.odometer) {
        const vehRef = doc(db, 'vehicles', payload.vehicleId);
        const vehSnap = await t.get(vehRef);
        if (vehSnap.exists()) {
          const vehData = vehSnap.data();
          if (!vehData.currentOdometer || payload.odometer > vehData.currentOdometer) {
            t.update(vehRef, { currentOdometer: payload.odometer });
          }
        }
      }
      t.set(doc(db, 'vehicle_logs', id), payload);
    });
  } catch (err) {
    console.warn('Firestore log write failed, caching locally:', err);
  }

  const local = getCached<VehicleLog[]>('vehicle_logs', []);
  const idx = local.findIndex(l => l.id === id);
  if (idx >= 0) local[idx] = payload;
  else local.unshift(payload);
  setCached('vehicle_logs', local);

  return id;
}

export async function deleteVehicleLog(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'vehicle_logs', id));
  } catch (err) {
    console.warn('Firestore log delete failed:', err);
  }
  const local = getCached<VehicleLog[]>('vehicle_logs', []);
  setCached('vehicle_logs', local.filter(l => l.id !== id));
}

/**
 * Todo Notes CRUD Operations
 */
export async function saveTodoNote(note: Omit<TodoNote, 'id'> & { id?: string }): Promise<string> {
  const id = note.id || doc(collection(db, 'todos')).id;
  const payload: TodoNote = {
    ...note,
    id,
    createdAt: note.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  try {
    await setDoc(doc(db, 'todos', id), payload, { merge: true });
  } catch (err) {
    console.warn('Firestore todo write failed:', err);
  }

  const local = getCached<TodoNote[]>('todos', []);
  const idx = local.findIndex(t => t.id === id);
  if (idx >= 0) local[idx] = payload;
  else local.unshift(payload);
  setCached('todos', local);
  return id;
}

export async function deleteTodoNote(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'todos', id));
  } catch (err) {
    console.warn('Firestore todo delete failed:', err);
  }
  const local = getCached<TodoNote[]>('todos', []);
  setCached('todos', local.filter(t => t.id !== id));
}

/**
 * Receivables / Payables (Entities) CRUD
 */
export async function saveEntity(entity: Omit<Entity, 'id'> & { id?: string }): Promise<string> {
  const id = entity.id || doc(collection(db, 'receivables_payables')).id;
  const payload: Entity = {
    ...entity,
    id,
    amount: Number(entity.amount) || 0
  };

  try {
    await setDoc(doc(db, 'receivables_payables', id), payload, { merge: true });
  } catch (err) {
    console.warn('Firestore entity write failed:', err);
  }

  const local = getCached<Entity[]>('entities', []);
  const idx = local.findIndex(e => e.id === id);
  if (idx >= 0) local[idx] = payload;
  else local.push(payload);
  setCached('entities', local);
  return id;
}

export async function deleteEntity(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'receivables_payables', id));
  } catch (err) {
    console.warn('Firestore entity delete failed:', err);
  }
  const local = getCached<Entity[]>('entities', []);
  setCached('entities', local.filter(e => e.id !== id));
}

/**
 * Exercise Logs CRUD Operations
 */
export async function saveExerciseLog(log: Omit<ExerciseLog, 'id'> & { id?: string }): Promise<string> {
  const id = log.id || doc(collection(db, 'exercise_logs')).id;
  const payload: ExerciseLog = {
    ...log,
    id,
    createdAt: log.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  try {
    await setDoc(doc(db, 'exercise_logs', id), payload, { merge: true });
  } catch (err) {
    console.warn('Firestore exercise_log write failed:', err);
  }

  const local = getCached<ExerciseLog[]>('exercise_logs', []);
  const idx = local.findIndex(e => e.id === id);
  if (idx >= 0) local[idx] = payload;
  else local.unshift(payload);
  // Keep sorted by date descending
  local.sort((a, b) => b.date.localeCompare(a.date));
  setCached('exercise_logs', local);
  return id;
}

export async function deleteExerciseLog(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'exercise_logs', id));
  } catch (err) {
    console.warn('Firestore exercise_log delete failed:', err);
  }
  const local = getCached<ExerciseLog[]>('exercise_logs', []);
  setCached('exercise_logs', local.filter(e => e.id !== id));
}

export function subscribeToExerciseLogs(onUpdate: (logs: ExerciseLog[]) => void) {
  const cached = getCached<ExerciseLog[]>('exercise_logs', []);
  if (cached.length > 0) onUpdate(cached);

  const q = query(collection(db, 'exercise_logs'), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as ExerciseLog));
    setCached('exercise_logs', data);
    onUpdate(data);
  }, (err) => {
    console.warn('Exercise logs snapshot error:', err);
    onUpdate(getCached<ExerciseLog[]>('exercise_logs', []));
  });
}


// ==========================================
// REAL-TIME FIRESTORE LISTENERS
// ==========================================

export function subscribeToAccounts(onUpdate: (accounts: Account[]) => void) {
  // Fire initial cached data immediately for instant responsive rendering
  const cached = getCached<Account[]>('accounts', []);
  if (cached.length > 0) onUpdate(cached);

  const q = query(collection(db, 'accounts'), orderBy('name', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Account));
    setCached('accounts', data);
    onUpdate(data);
  }, (err) => {
    console.warn('Accounts snapshot error (using offline cache):', err);
    onUpdate(getCached<Account[]>('accounts', []));
  });
}

export function subscribeToTransactions(onUpdate: (txns: Transaction[]) => void) {
  const cached = getCached<Transaction[]>('transactions', []);
  if (cached.length > 0) onUpdate(cached);

  // Bound query to latest 200 items for optimal speed
  const q = query(collection(db, 'transactions'), orderBy('date', 'desc'), limit(200));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Transaction));
    setCached('transactions', data);
    onUpdate(data);
  }, (err) => {
    console.warn('Transactions snapshot error (using offline cache):', err);
    onUpdate(getCached<Transaction[]>('transactions', []));
  });
}

export function subscribeToVehicles(onUpdate: (vehicles: Vehicle[]) => void) {
  const cached = getCached<Vehicle[]>('vehicles', []);
  if (cached.length > 0) onUpdate(cached);

  const q = query(collection(db, 'vehicles'), orderBy('name', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Vehicle));
    setCached('vehicles', data);
    onUpdate(data);
  }, (err) => {
    console.warn('Vehicles snapshot error:', err);
    onUpdate(getCached<Vehicle[]>('vehicles', []));
  });
}

export function subscribeToVehicleLogs(onUpdate: (logs: VehicleLog[]) => void) {
  const cached = getCached<VehicleLog[]>('vehicle_logs', []);
  if (cached.length > 0) onUpdate(cached);

  const q = query(collection(db, 'vehicle_logs'), orderBy('date', 'desc'), limit(150));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as VehicleLog));
    setCached('vehicle_logs', data);
    onUpdate(data);
  }, (err) => {
    console.warn('Vehicle logs snapshot error:', err);
    onUpdate(getCached<VehicleLog[]>('vehicle_logs', []));
  });
}

export function subscribeToTodos(onUpdate: (todos: TodoNote[]) => void) {
  const cached = getCached<TodoNote[]>('todos', []);
  if (cached.length > 0) onUpdate(cached);

  const q = query(collection(db, 'todos'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as TodoNote));
    setCached('todos', data);
    onUpdate(data);
  }, (err) => {
    console.warn('Todos snapshot error:', err);
    onUpdate(getCached<TodoNote[]>('todos', []));
  });
}

export function subscribeToEntities(onUpdate: (entities: Entity[]) => void) {
  const cached = getCached<Entity[]>('entities', []);
  if (cached.length > 0) onUpdate(cached);

  const q = query(collection(db, 'receivables_payables'), orderBy('name', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Entity));
    setCached('entities', data);
    onUpdate(data);
  }, (err) => {
    console.warn('Entities snapshot error:', err);
    onUpdate(getCached<Entity[]>('entities', []));
  });
}

// Seed starter data if database is empty
export async function seedSampleData(): Promise<void> {
  const sampleAccounts: Omit<Account, 'id'>[] = [
    { name: 'HDFC Salary Bank', type: 'BANK', balance: 78500, institution: 'HDFC Bank', color: '#0284c7' },
    { name: 'ICICI Savings', type: 'BANK', balance: 34200, institution: 'ICICI Bank', color: '#ea580c' },
    { name: 'Wallet & Cash', type: 'CASH', balance: 4500, color: '#10b981' },
    { name: 'HDFC Millennia Card', type: 'CREDIT_CARD', balance: -8200, institution: 'HDFC Bank', color: '#6366f1' },
    { name: 'Emergency Liquid Fund', type: 'INVESTMENT', balance: 120000, institution: 'Mutual Funds', color: '#14b8a6' }
  ];

  const createdAccIds: string[] = [];
  for (const acc of sampleAccounts) {
    const id = await saveAccount(acc);
    createdAccIds.push(id);
  }

  const sampleVehicles: Omit<Vehicle, 'id'>[] = [
    {
      name: 'Royal Enfield Hunter 350',
      vehicleNumber: 'TN 07 CA 4589',
      type: 'BIKE',
      currentOdometer: 14820,
      fuelType: 'PETROL',
      insuranceExpiry: '2026-11-20',
      pucExpiry: '2026-10-15',
      insurancePolicyNumber: 'POL-HUNT-9921',
      color: '#d97706'
    },
    {
      name: 'Tata Nexon EV',
      vehicleNumber: 'TN 09 DX 7812',
      type: 'CAR',
      currentOdometer: 28400,
      fuelType: 'ELECTRIC',
      insuranceExpiry: '2027-02-10',
      pucExpiry: '2026-12-05',
      insurancePolicyNumber: 'POL-NEXON-4410',
      color: '#06b6d4'
    }
  ];

  const createdVehIds: string[] = [];
  for (const veh of sampleVehicles) {
    const id = await saveVehicle(veh);
    createdVehIds.push(id);
  }

  // Sample transactions
  const sampleTxns: (Omit<Transaction, 'id'>)[] = [
    {
      type: 'EXPENSE',
      amount: 1400,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now() - 3600000 * 4,
      description: 'Petrol 13.5L - Shell Velachery',
      category: 'Fuel',
      fromAccountId: createdAccIds[0],
      vehicleId: createdVehIds[0],
      isFuel: true,
      fuelLiters: 13.5,
      odometer: 14820
    },
    {
      type: 'EXPENSE',
      amount: 680,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now() - 3600000 * 12,
      description: 'Organic Groceries & Fruits',
      category: 'Groceries',
      fromAccountId: createdAccIds[0]
    },
    {
      type: 'EXPENSE',
      amount: 320,
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      timestamp: Date.now() - 86400000 * 1.2,
      description: 'Filter Coffee & Dosa - Saravana Bhavan',
      category: 'Food & Dining',
      fromAccountId: createdAccIds[2]
    },
    {
      type: 'INCOME',
      amount: 85000,
      date: new Date(Date.now() - 86400000 * 15).toISOString().split('T')[0],
      timestamp: Date.now() - 86400000 * 15,
      description: 'Monthly Salary Credit',
      category: 'Salary',
      toAccountId: createdAccIds[0]
    }
  ];

  for (const t of sampleTxns) {
    await saveTransactionAtomic(t);
  }

  // Sample Todos
  const sampleTodos: Omit<TodoNote, 'id'>[] = [
    {
      title: 'Bike Maintenance & Renewals',
      items: [
        { id: '1', text: 'Check tyre pressure (32 psi front / 36 rear)', completed: true },
        { id: '2', text: 'Renew Hunter 350 PUC emission test before Oct 15', completed: false },
        { id: '3', text: 'Lube drive chain with Motul chain cleaner', completed: false }
      ],
      color: 'amber',
      pinned: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      title: 'Monthly Ledger Checklist',
      items: [
        { id: '1', text: 'Verify credit card auto-debit on HDFC', completed: true },
        { id: '2', text: 'Review mutual fund SIP debits', completed: true },
        { id: '3', text: 'Export CSV passbook backup for Q3', completed: false }
      ],
      color: 'emerald',
      pinned: true,
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now()
    }
  ];

  for (const todo of sampleTodos) {
    await saveTodoNote(todo);
  }
}

// Aliases for seamless imports across components
export const saveTodo = saveTodoNote;
export const deleteTodo = deleteTodoNote;
export const seedStarterData = seedSampleData;

export function clearLocalCache(reload: boolean = false): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LS_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    if (reload) {
      window.location.reload();
    }
  } catch (e) {
    console.error('Error clearing cache:', e);
  }
}
