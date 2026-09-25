/**
 * Firebase Firestore & Authentication Service for Chuvadi
 * Features:
 * - Real-time subscriptions partitioned per user (Zero-leak user isolation)
 * - Specific persistence for primary user: rajapriyan20@gmail.com
 * - Atomic Multi-Document Transactions (runTransaction)
 * - Offline LocalStorage Mirroring fallback per user
 * - Calendar Events & Menstrual Tracker state persistence
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc,
  deleteDoc, 
  getDocs,
  onSnapshot, 
  runTransaction,
  writeBatch,
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
import type { 
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
} from '../types';
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
} from '../data/demoData';
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

export const PRIMARY_USER_EMAIL = 'rajapriyan20@gmail.com';

export function isPrimaryUser(u?: User | null): boolean {
  if (!u || !u.email) return false;
  return u.email.trim().toLowerCase() === PRIMARY_USER_EMAIL.toLowerCase();
}

// Local Storage Keys for offline persistence & cache (isolated per user)
const LS_PREFIX = 'chuvadi_cache_';

export function getUserCacheKey(key: string, user?: User | null): string {
  const activeUser = user || auth.currentUser;
  if (activeUser && activeUser.uid) {
    return `${activeUser.uid}_${key}`;
  }
  return `guest_${key}`;
}

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

function resolveUserUid(user?: User | null): string | null {
  if (user && user.uid) return user.uid;
  if (auth.currentUser && auth.currentUser.uid) return auth.currentUser.uid;
  return null;
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
// USER DATA MIGRATION & SEEDING
// ==========================================

/**
 * Ensures existing app data is preserved specifically for rajapriyan20@gmail.com
 * If rajapriyan20@gmail.com logs in and has no data under users/{uid},
 * this migrates the existing root collections or local cache into their private user space.
 */
export async function syncOrMigratePrimaryUserData(user: User): Promise<void> {
  if (!isPrimaryUser(user)) return;

  const migrationKey = `chuvadi_migrated_${user.uid}`;
  if (localStorage.getItem(migrationKey)) {
    return;
  }

  try {
    const userAccRef = collection(db, 'users', user.uid, 'accounts');
    const existingSnap = await getDocs(userAccRef);
    if (!existingSnap.empty) {
      localStorage.setItem(migrationKey, 'true');
      return;
    }

    // Try reading from root Firestore collections
    const [rootAccs, rootTxns, rootVehs, rootLogs, rootTodos, rootEntities, rootEx] = await Promise.all([
      getDocs(collection(db, 'accounts')).catch(() => null),
      getDocs(collection(db, 'transactions')).catch(() => null),
      getDocs(collection(db, 'vehicles')).catch(() => null),
      getDocs(collection(db, 'vehicle_logs')).catch(() => null),
      getDocs(collection(db, 'todos')).catch(() => null),
      getDocs(collection(db, 'receivables_payables')).catch(() => null),
      getDocs(collection(db, 'exercise_logs')).catch(() => null)
    ]);

    let migratedAny = false;
    const batch = writeBatch(db);

    if (rootAccs && !rootAccs.empty) {
      rootAccs.forEach(d => {
        batch.set(doc(db, 'users', user.uid, 'accounts', d.id), d.data());
        migratedAny = true;
      });
    }
    if (rootTxns && !rootTxns.empty) {
      rootTxns.forEach(d => {
        batch.set(doc(db, 'users', user.uid, 'transactions', d.id), d.data());
        migratedAny = true;
      });
    }
    if (rootVehs && !rootVehs.empty) {
      rootVehs.forEach(d => {
        batch.set(doc(db, 'users', user.uid, 'vehicles', d.id), d.data());
        migratedAny = true;
      });
    }
    if (rootLogs && !rootLogs.empty) {
      rootLogs.forEach(d => {
        batch.set(doc(db, 'users', user.uid, 'vehicle_logs', d.id), d.data());
        migratedAny = true;
      });
    }
    if (rootTodos && !rootTodos.empty) {
      rootTodos.forEach(d => {
        batch.set(doc(db, 'users', user.uid, 'todos', d.id), d.data());
        migratedAny = true;
      });
    }
    if (rootEntities && !rootEntities.empty) {
      rootEntities.forEach(d => {
        batch.set(doc(db, 'users', user.uid, 'receivables_payables', d.id), d.data());
        migratedAny = true;
      });
    }
    if (rootEx && !rootEx.empty) {
      rootEx.forEach(d => {
        batch.set(doc(db, 'users', user.uid, 'exercise_logs', d.id), d.data());
        migratedAny = true;
      });
    }

    if (migratedAny) {
      await batch.commit();
    } else {
      // Fallback: check legacy un-scoped localStorage cache
      const legacyAccs = getCached<Account[]>('accounts', []);
      const legacyTxns = getCached<Transaction[]>('transactions', []);
      const legacyVehs = getCached<Vehicle[]>('vehicles', []);
      const legacyLogs = getCached<VehicleLog[]>('vehicle_logs', []);
      const legacyTodos = getCached<TodoNote[]>('todos', []);
      const legacyEntities = getCached<Entity[]>('entities', []);
      const legacyEx = getCached<ExerciseLog[]>('exercise_logs', []);

      if (legacyAccs.length > 0 || legacyTxns.length > 0) {
        for (const a of legacyAccs) await setDoc(doc(db, 'users', user.uid, 'accounts', a.id), a);
        for (const t of legacyTxns) await setDoc(doc(db, 'users', user.uid, 'transactions', t.id), t);
        for (const v of legacyVehs) await setDoc(doc(db, 'users', user.uid, 'vehicles', v.id), v);
        for (const l of legacyLogs) await setDoc(doc(db, 'users', user.uid, 'vehicle_logs', l.id), l);
        for (const td of legacyTodos) await setDoc(doc(db, 'users', user.uid, 'todos', td.id), td);
        for (const e of legacyEntities) await setDoc(doc(db, 'users', user.uid, 'receivables_payables', e.id), e);
        for (const ex of legacyEx) await setDoc(doc(db, 'users', user.uid, 'exercise_logs', ex.id), ex);
      } else {
        // First run: seed standard sample starter accounts for Rajapriyan
        await seedSampleDataForUser(user);
      }
    }

    localStorage.setItem(migrationKey, 'true');
  } catch (err) {
    console.warn('Error during user data migration:', err);
  }
}

/**
 * Seeds demo data into a specific user account when they choose "Load Demo Data"
 */
export async function seedUserStarterData(user: User): Promise<void> {
  const batch = writeBatch(db);

  for (const acc of DEMO_ACCOUNTS) {
    batch.set(doc(db, 'users', user.uid, 'accounts', acc.id), acc);
  }
  for (const veh of DEMO_VEHICLES) {
    batch.set(doc(db, 'users', user.uid, 'vehicles', veh.id), veh);
  }
  for (const txn of DEMO_TRANSACTIONS) {
    batch.set(doc(db, 'users', user.uid, 'transactions', txn.id), txn);
  }
  for (const log of DEMO_VEHICLE_LOGS) {
    batch.set(doc(db, 'users', user.uid, 'vehicle_logs', log.id), log);
  }
  for (const todo of DEMO_TODOS) {
    batch.set(doc(db, 'users', user.uid, 'todos', todo.id), todo);
  }
  for (const ent of DEMO_ENTITIES) {
    batch.set(doc(db, 'users', user.uid, 'receivables_payables', ent.id), ent);
  }
  for (const ex of DEMO_EXERCISE_LOGS) {
    batch.set(doc(db, 'users', user.uid, 'exercise_logs', ex.id), ex);
  }
  for (const evt of DEMO_CALENDAR_EVENTS) {
    batch.set(doc(db, 'users', user.uid, 'calendar_events', evt.id), evt);
  }
  for (const period of DEMO_MENSTRUAL_PERIODS) {
    batch.set(doc(db, 'users', user.uid, 'menstrual_periods', period.id), period);
  }
  for (const mlog of DEMO_MENSTRUAL_LOGS) {
    batch.set(doc(db, 'users', user.uid, 'menstrual_logs', mlog.id), mlog);
  }
  batch.set(doc(db, 'users', user.uid, 'settings', 'menstrual'), DEMO_MENSTRUAL_SETTINGS);

  await batch.commit();

  // Also update local cache for instant UI refresh
  setCached(getUserCacheKey('accounts', user), DEMO_ACCOUNTS);
  setCached(getUserCacheKey('transactions', user), DEMO_TRANSACTIONS);
  setCached(getUserCacheKey('vehicles', user), DEMO_VEHICLES);
  setCached(getUserCacheKey('vehicle_logs', user), DEMO_VEHICLE_LOGS);
  setCached(getUserCacheKey('todos', user), DEMO_TODOS);
  setCached(getUserCacheKey('entities', user), DEMO_ENTITIES);
  setCached(getUserCacheKey('exercise_logs', user), DEMO_EXERCISE_LOGS);
  setCached(getUserCacheKey('calendar_events', user), DEMO_CALENDAR_EVENTS);
  setCached(getUserCacheKey('menstrual_periods', user), DEMO_MENSTRUAL_PERIODS);
  setCached(getUserCacheKey('menstrual_logs', user), DEMO_MENSTRUAL_LOGS);
  setCached(getUserCacheKey('menstrual_settings', user), DEMO_MENSTRUAL_SETTINGS);
}

/**
 * Clears all data for a specific user to reset to a blank workspace
 */
export async function clearUserData(user: User): Promise<void> {
  const collectionsToClear = [
    'accounts',
    'transactions',
    'vehicles',
    'vehicle_logs',
    'todos',
    'receivables_payables',
    'exercise_logs',
    'calendar_events',
    'menstrual_logs',
    'menstrual_periods'
  ];

  for (const colName of collectionsToClear) {
    try {
      const snap = await getDocs(collection(db, 'users', user.uid, colName));
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
      setCached(getUserCacheKey(colName === 'receivables_payables' ? 'entities' : colName, user), []);
    } catch (e) {
      console.warn(`Error clearing ${colName}:`, e);
    }
  }
}

async function seedSampleDataForUser(user: User): Promise<void> {
  await seedUserStarterData(user);
}

// ==========================================
// ATOMIC TRANSACTION HANDLERS (runTransaction)
// ==========================================

export async function saveTransactionAtomic(
  txnData: Omit<Transaction, 'id'> & { id?: string },
  existingTxn?: Transaction | null,
  user?: User | null
): Promise<string> {
  const uid = resolveUserUid(user);
  const cacheKey = getUserCacheKey('transactions', user);
  const accCacheKey = getUserCacheKey('accounts', user);

  if (!uid) {
    // Guest fallback
    const txnId = txnData.id || 'txn-' + Date.now();
    const localTxns = getCached<Transaction[]>(cacheKey, []);
    const payload: Transaction = {
      ...txnData,
      id: txnId,
      timestamp: txnData.timestamp || Date.now(),
      amount: Number(txnData.amount) || 0
    };
    const updated = existingTxn 
      ? localTxns.map(t => t.id === txnId ? payload : t)
      : [payload, ...localTxns];
    setCached(cacheKey, updated);
    return txnId;
  }

  const txnId = txnData.id || doc(collection(db, 'users', uid, 'transactions')).id;
  const txnRef = doc(db, 'users', uid, 'transactions', txnId);

  try {
    await runTransaction(db, async (t) => {
      const accountIdsToFetch = new Set<string>();
      if (existingTxn) {
        if (existingTxn.fromAccountId) accountIdsToFetch.add(existingTxn.fromAccountId);
        if (existingTxn.toAccountId) accountIdsToFetch.add(existingTxn.toAccountId);
      }
      if (txnData.fromAccountId) accountIdsToFetch.add(txnData.fromAccountId);
      if (txnData.toAccountId) accountIdsToFetch.add(txnData.toAccountId);

      const accountDocs = new Map<string, any>();
      for (const accId of accountIdsToFetch) {
        const ref = doc(db, 'users', uid, 'accounts', accId);
        const snap = await t.get(ref);
        if (snap.exists()) {
          accountDocs.set(accId, { ref, data: snap.data() });
        }
      }

      // Revert old transaction effects if editing
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

      // Apply new transaction effects
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

      // If odometer updated and vehicle linked, update vehicle
      if (txnData.vehicleId && txnData.odometer) {
        const vehRef = doc(db, 'users', uid, 'vehicles', txnData.vehicleId);
        const vehSnap = await t.get(vehRef);
        if (vehSnap.exists()) {
          const vehData = vehSnap.data();
          if (!vehData.currentOdometer || txnData.odometer > vehData.currentOdometer) {
            t.update(vehRef, { currentOdometer: txnData.odometer });
          }
        }
      }

      // Commit account balance updates
      for (const [_, item] of accountDocs) {
        t.update(item.ref, { 
          balance: item.data.balance,
          updatedAt: Date.now()
        });
      }

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
    console.error('Atomic transaction failed on Firestore, writing to user local cache fallback:', err);
    const localTxns = getCached<Transaction[]>(cacheKey, []);
    const payload: Transaction = {
      ...txnData,
      id: txnId,
      timestamp: txnData.timestamp || Date.now(),
      amount: Number(txnData.amount) || 0
    };
    const updated = existingTxn 
      ? localTxns.map(t => t.id === txnId ? payload : t)
      : [payload, ...localTxns];
    setCached(cacheKey, updated);
    return txnId;
  }
}

export async function deleteTransactionAtomic(txn: Transaction, user?: User | null): Promise<void> {
  const uid = resolveUserUid(user);
  const cacheKey = getUserCacheKey('transactions', user);
  const accCacheKey = getUserCacheKey('accounts', user);

  if (!uid) {
    const localTxns = getCached<Transaction[]>(cacheKey, []);
    setCached(cacheKey, localTxns.filter(x => x.id !== txn.id));
    return;
  }

  const txnRef = doc(db, 'users', uid, 'transactions', txn.id);

  try {
    await runTransaction(db, async (t) => {
      const amt = Number(txn.amount) || 0;
      
      if (txn.type === 'EXPENSE' && txn.fromAccountId) {
        const accRef = doc(db, 'users', uid, 'accounts', txn.fromAccountId);
        const snap = await t.get(accRef);
        if (snap.exists()) {
          t.update(accRef, { 
            balance: (snap.data().balance || 0) + amt,
            updatedAt: Date.now()
          });
        }
      } else if (txn.type === 'INCOME' && txn.toAccountId) {
        const accRef = doc(db, 'users', uid, 'accounts', txn.toAccountId);
        const snap = await t.get(accRef);
        if (snap.exists()) {
          t.update(accRef, { 
            balance: (snap.data().balance || 0) - amt,
            updatedAt: Date.now()
          });
        }
      } else if (txn.type === 'TRANSFER') {
        if (txn.fromAccountId) {
          const accRef = doc(db, 'users', uid, 'accounts', txn.fromAccountId);
          const snap = await t.get(accRef);
          if (snap.exists()) {
            t.update(accRef, { 
              balance: (snap.data().balance || 0) + amt,
              updatedAt: Date.now()
            });
          }
        }
        if (txn.toAccountId) {
          const accRef = doc(db, 'users', uid, 'accounts', txn.toAccountId);
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
    console.error('Delete transaction failed, updating local cache:', err);
    const localTxns = getCached<Transaction[]>(cacheKey, []);
    setCached(cacheKey, localTxns.filter(x => x.id !== txn.id));
  }
}

// ==========================================
// ACCOUNTS CRUD
// ==========================================

export async function saveAccount(acc: Omit<Account, 'id'> & { id?: string }, user?: User | null): Promise<string> {
  const uid = resolveUserUid(user);
  const cacheKey = getUserCacheKey('accounts', user);
  const id = acc.id || (uid ? doc(collection(db, 'users', uid, 'accounts')).id : 'acc-' + Date.now());
  const payload: Account = {
    ...acc,
    id,
    balance: Number(acc.balance) || 0,
    updatedAt: Date.now()
  };

  if (uid) {
    try {
      await setDoc(doc(db, 'users', uid, 'accounts', id), payload, { merge: true });
    } catch (err) {
      console.warn('Firestore write failed, saving to local cache:', err);
    }
  }

  const local = getCached<Account[]>(cacheKey, []);
  const index = local.findIndex(a => a.id === id);
  if (index >= 0) local[index] = payload;
  else local.push(payload);
  setCached(cacheKey, local);
  return id;
}

export async function deleteAccount(id: string, user?: User | null): Promise<void> {
  const uid = resolveUserUid(user);
  const cacheKey = getUserCacheKey('accounts', user);
  if (uid) {
    try {
      await deleteDoc(doc(db, 'users', uid, 'accounts', id));
    } catch (err) {
      console.warn('Firestore delete failed:', err);
    }
  }
  const local = getCached<Account[]>(cacheKey, []);
  setCached(cacheKey, local.filter(a => a.id !== id));
}

// ==========================================
// VEHICLES CRUD
// ==========================================

export async function saveVehicle(veh: Omit<Vehicle, 'id'> & { id?: string }, user?: User | null): Promise<string> {
  const uid = resolveUserUid(user);
  const cacheKey = getUserCacheKey('vehicles', user);
  const id = veh.id || (uid ? doc(collection(db, 'users', uid, 'vehicles')).id : 'veh-' + Date.now());
  const payload: Vehicle = {
    ...veh,
    id,
    currentOdometer: Number(veh.currentOdometer) || 0
  };

  if (uid) {
    try {
      await setDoc(doc(db, 'users', uid, 'vehicles', id), payload, { merge: true });
    } catch (err) {
      console.warn('Firestore vehicle write failed:', err);
    }
  }

  const local = getCached<Vehicle[]>(cacheKey, []);
  const idx = local.findIndex(v => v.id === id);
  if (idx >= 0) local[idx] = payload;
  else local.push(payload);
  setCached(cacheKey, local);
  return id;
}

export async function deleteVehicle(id: string, user?: User | null): Promise<void> {
  const uid = resolveUserUid(user);
  const cacheKey = getUserCacheKey('vehicles', user);
  if (uid) {
    try {
      await deleteDoc(doc(db, 'users', uid, 'vehicles', id));
    } catch (err) {
      console.warn('Firestore vehicle delete failed:', err);
    }
  }
  const local = getCached<Vehicle[]>(cacheKey, []);
  setCached(cacheKey, local.filter(v => v.id !== id));
}

export async function saveVehicleLog(log: Omit<VehicleLog, 'id'> & { id?: string }, user?: User | null): Promise<string> {
  const uid = resolveUserUid(user);
  const cacheKey = getUserCacheKey('vehicle_logs', user);
  const id = log.id || (uid ? doc(collection(db, 'users', uid, 'vehicle_logs')).id : 'log-' + Date.now());
  const payload: VehicleLog = {
    ...log,
    id,
    timestamp: log.timestamp || Date.now(),
    cost: Number(log.cost) || 0,
    odometer: Number(log.odometer) || 0
  };

  if (uid) {
    try {
      await runTransaction(db, async (t) => {
        if (payload.vehicleId && payload.odometer) {
          const vehRef = doc(db, 'users', uid, 'vehicles', payload.vehicleId);
          const vehSnap = await t.get(vehRef);
          if (vehSnap.exists()) {
            const vehData = vehSnap.data();
            if (!vehData.currentOdometer || payload.odometer > vehData.currentOdometer) {
              t.update(vehRef, { currentOdometer: payload.odometer });
            }
          }
        }
        t.set(doc(db, 'users', uid, 'vehicle_logs', id), payload);
      });
    } catch (err) {
      console.warn('Firestore log write failed, caching locally:', err);
    }
  }

  const local = getCached<VehicleLog[]>(cacheKey, []);
  const idx = local.findIndex(l => l.id === id);
  if (idx >= 0) local[idx] = payload;
  else local.unshift(payload);
  setCached(cacheKey, local);

  return id;
}

export async function deleteVehicleLog(id: string, user?: User | null): Promise<void> {
  const uid = resolveUserUid(user);
  const cacheKey = getUserCacheKey('vehicle_logs', user);
  if (uid) {
    try {
      await deleteDoc(doc(db, 'users', uid, 'vehicle_logs', id));
    } catch (err) {
      console.warn('Firestore log delete failed:', err);
    }
  }
  const local = getCached<VehicleLog[]>(cacheKey, []);
  setCached(cacheKey, local.filter(l => l.id !== id));
}

// ==========================================
// TODOS CRUD
// ==========================================

export async function saveTodoNote(note: Omit<TodoNote, 'id'> & { id?: string }, user?: User | null): Promise<string> {
  const uid = resolveUserUid(user);
  const cacheKey = getUserCacheKey('todos', user);
  const id = note.id || (uid ? doc(collection(db, 'users', uid, 'todos')).id : 'todo-' + Date.now());
  const payload: TodoNote = {
    ...note,
    id,
    createdAt: note.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  if (uid) {
    try {
      await setDoc(doc(db, 'users', uid, 'todos', id), payload, { merge: true });
    } catch (err) {
      console.warn('Firestore todo write failed:', err);
    }
  }

  const local = getCached<TodoNote[]>(cacheKey, []);
  const idx = local.findIndex(t => t.id === id);
  if (idx >= 0) local[idx] = payload;
  else local.unshift(payload);
  setCached(cacheKey, local);
  return id;
}

export async function deleteTodoNote(id: string, user?: User | null): Promise<void> {
  const uid = resolveUserUid(user);
  const cacheKey = getUserCacheKey('todos', user);
  if (uid) {
    try {
      await deleteDoc(doc(db, 'users', uid, 'todos', id));
    } catch (err) {
      console.warn('Firestore todo delete failed:', err);
    }
  }
  const local = getCached<TodoNote[]>(cacheKey, []);
  setCached(cacheKey, local.filter(t => t.id !== id));
}

// Aliases
export const saveTodo = saveTodoNote;
export const deleteTodo = deleteTodoNote;

// ==========================================
// RECEIVABLES / PAYABLES CRUD
// ==========================================

export async function saveEntity(entity: Omit<Entity, 'id'> & { id?: string }, user?: User | null): Promise<string> {
  const uid = resolveUserUid(user);
  const cacheKey = getUserCacheKey('entities', user);
  const id = entity.id || (uid ? doc(collection(db, 'users', uid, 'receivables_payables')).id : 'ent-' + Date.now());
  const payload: Entity = {
    ...entity,
    id,
    amount: Number(entity.amount) || 0
  };

  if (uid) {
    try {
      await setDoc(doc(db, 'users', uid, 'receivables_payables', id), payload, { merge: true });
    } catch (err) {
      console.warn('Firestore entity write failed:', err);
    }
  }

  const local = getCached<Entity[]>(cacheKey, []);
  const idx = local.findIndex(e => e.id === id);
  if (idx >= 0) local[idx] = payload;
  else local.push(payload);
  setCached(cacheKey, local);
  return id;
}

export async function deleteEntity(id: string, user?: User | null): Promise<void> {
  const uid = resolveUserUid(user);
  const cacheKey = getUserCacheKey('entities', user);
  if (uid) {
    try {
      await deleteDoc(doc(db, 'users', uid, 'receivables_payables', id));
    } catch (err) {
      console.warn('Firestore entity delete failed:', err);
    }
  }
  const local = getCached<Entity[]>(cacheKey, []);
  setCached(cacheKey, local.filter(e => e.id !== id));
}

// ==========================================
// EXERCISE LOGS CRUD
// ==========================================

export async function saveExerciseLog(log: Omit<ExerciseLog, 'id'> & { id?: string }, user?: User | null): Promise<string> {
  const uid = resolveUserUid(user);
  const cacheKey = getUserCacheKey('exercise_logs', user);
  const id = log.id || (uid ? doc(collection(db, 'users', uid, 'exercise_logs')).id : 'ex-' + Date.now());
  const payload: ExerciseLog = {
    ...log,
    id,
    createdAt: log.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  if (uid) {
    try {
      await setDoc(doc(db, 'users', uid, 'exercise_logs', id), payload, { merge: true });
    } catch (err) {
      console.warn('Firestore exercise_log write failed:', err);
    }
  }

  const local = getCached<ExerciseLog[]>(cacheKey, []);
  const idx = local.findIndex(e => e.id === id);
  if (idx >= 0) local[idx] = payload;
  else local.unshift(payload);
  local.sort((a, b) => b.date.localeCompare(a.date));
  setCached(cacheKey, local);
  return id;
}

export async function deleteExerciseLog(id: string, user?: User | null): Promise<void> {
  const uid = resolveUserUid(user);
  const cacheKey = getUserCacheKey('exercise_logs', user);
  if (uid) {
    try {
      await deleteDoc(doc(db, 'users', uid, 'exercise_logs', id));
    } catch (err) {
      console.warn('Firestore exercise_log delete failed:', err);
    }
  }
  const local = getCached<ExerciseLog[]>(cacheKey, []);
  setCached(cacheKey, local.filter(e => e.id !== id));
}

// ==========================================
// CALENDAR EVENTS CRUD
// ==========================================

export async function saveCalendarEvent(event: Omit<CalendarEvent, 'id'> & { id?: string }, user?: User | null): Promise<string> {
  const uid = resolveUserUid(user);
  const cacheKey = getUserCacheKey('calendar_events', user);
  const id = event.id || (uid ? doc(collection(db, 'users', uid, 'calendar_events')).id : 'cal-' + Date.now());
  const payload: CalendarEvent = {
    ...event,
    id,
    createdAt: event.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  if (uid) {
    try {
      await setDoc(doc(db, 'users', uid, 'calendar_events', id), payload, { merge: true });
    } catch (err) {
      console.warn('Firestore calendar event write failed:', err);
    }
  }

  const local = getCached<CalendarEvent[]>(cacheKey, []);
  const idx = local.findIndex(e => e.id === id);
  if (idx >= 0) local[idx] = payload;
  else local.push(payload);
  local.sort((a, b) => a.date.localeCompare(b.date));
  setCached(cacheKey, local);
  return id;
}

export async function deleteCalendarEvent(id: string, user?: User | null): Promise<void> {
  const uid = resolveUserUid(user);
  const cacheKey = getUserCacheKey('calendar_events', user);
  if (uid) {
    try {
      await deleteDoc(doc(db, 'users', uid, 'calendar_events', id));
    } catch (err) {
      console.warn('Firestore calendar delete failed:', err);
    }
  }
  const local = getCached<CalendarEvent[]>(cacheKey, []);
  setCached(cacheKey, local.filter(e => e.id !== id));
}

// ==========================================
// MENSTRUAL TRACKER CRUD
// ==========================================

export async function saveMenstrualLog(log: Omit<MenstrualLog, 'id'> & { id?: string }, user?: User | null): Promise<string> {
  const uid = resolveUserUid(user);
  const cacheKey = getUserCacheKey('menstrual_logs', user);
  const id = log.id || (uid ? doc(collection(db, 'users', uid, 'menstrual_logs')).id : 'mlog-' + Date.now());
  const payload: MenstrualLog = {
    ...log,
    id,
    createdAt: log.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  if (uid) {
    try {
      await setDoc(doc(db, 'users', uid, 'menstrual_logs', id), payload, { merge: true });
    } catch (err) {
      console.warn('Firestore menstrual log write failed:', err);
    }
  }

  const local = getCached<MenstrualLog[]>(cacheKey, []);
  const idx = local.findIndex(m => m.id === id);
  if (idx >= 0) local[idx] = payload;
  else local.push(payload);
  local.sort((a, b) => b.date.localeCompare(a.date));
  setCached(cacheKey, local);
  return id;
}

export async function deleteMenstrualLog(id: string, user?: User | null): Promise<void> {
  const uid = resolveUserUid(user);
  const cacheKey = getUserCacheKey('menstrual_logs', user);
  if (uid) {
    try {
      await deleteDoc(doc(db, 'users', uid, 'menstrual_logs', id));
    } catch (err) {
      console.warn('Firestore menstrual log delete failed:', err);
    }
  }
  const local = getCached<MenstrualLog[]>(cacheKey, []);
  setCached(cacheKey, local.filter(m => m.id !== id));
}

export async function saveMenstrualPeriod(period: Omit<MenstrualPeriodRecord, 'id'> & { id?: string }, user?: User | null): Promise<string> {
  const uid = resolveUserUid(user);
  const cacheKey = getUserCacheKey('menstrual_periods', user);
  const id = period.id || (uid ? doc(collection(db, 'users', uid, 'menstrual_periods')).id : 'period-' + Date.now());
  const payload: MenstrualPeriodRecord = {
    ...period,
    id
  };

  if (uid) {
    try {
      await setDoc(doc(db, 'users', uid, 'menstrual_periods', id), payload, { merge: true });
    } catch (err) {
      console.warn('Firestore menstrual period write failed:', err);
    }
  }

  const local = getCached<MenstrualPeriodRecord[]>(cacheKey, []);
  const idx = local.findIndex(p => p.id === id);
  if (idx >= 0) local[idx] = payload;
  else local.push(payload);
  local.sort((a, b) => b.startDate.localeCompare(a.startDate));
  setCached(cacheKey, local);
  return id;
}

export async function deleteMenstrualPeriod(id: string, user?: User | null): Promise<void> {
  const uid = resolveUserUid(user);
  const cacheKey = getUserCacheKey('menstrual_periods', user);
  if (uid) {
    try {
      await deleteDoc(doc(db, 'users', uid, 'menstrual_periods', id));
    } catch (err) {
      console.warn('Firestore menstrual period delete failed:', err);
    }
  }
  const local = getCached<MenstrualPeriodRecord[]>(cacheKey, []);
  setCached(cacheKey, local.filter(p => p.id !== id));
}

export async function saveMenstrualSettings(settings: MenstrualCycleSettings, user?: User | null): Promise<void> {
  const uid = resolveUserUid(user);
  const cacheKey = getUserCacheKey('menstrual_settings', user);

  if (uid) {
    try {
      await setDoc(doc(db, 'users', uid, 'settings', 'menstrual'), settings, { merge: true });
    } catch (err) {
      console.warn('Firestore menstrual settings write failed:', err);
    }
  }
  setCached(cacheKey, settings);
}

// ==========================================
// REAL-TIME FIRESTORE LISTENERS (USER SCOPED)
// ==========================================

export function subscribeToAccounts(user: User | null, onUpdate: (accounts: Account[]) => void) {
  const cacheKey = getUserCacheKey('accounts', user);
  const cached = getCached<Account[]>(cacheKey, []);
  if (cached.length > 0) onUpdate(cached);

  const uid = resolveUserUid(user);
  if (!uid) {
    onUpdate(cached);
    return () => {};
  }

  const q = query(collection(db, 'users', uid, 'accounts'), orderBy('name', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Account));
    setCached(cacheKey, data);
    onUpdate(data);
  }, (err) => {
    console.warn('Accounts snapshot error:', err);
    onUpdate(getCached<Account[]>(cacheKey, []));
  });
}

export function subscribeToTransactions(user: User | null, onUpdate: (txns: Transaction[]) => void) {
  const cacheKey = getUserCacheKey('transactions', user);
  const cached = getCached<Transaction[]>(cacheKey, []);
  if (cached.length > 0) onUpdate(cached);

  const uid = resolveUserUid(user);
  if (!uid) {
    onUpdate(cached);
    return () => {};
  }

  const q = query(collection(db, 'users', uid, 'transactions'), orderBy('date', 'desc'), limit(250));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Transaction));
    setCached(cacheKey, data);
    onUpdate(data);
  }, (err) => {
    console.warn('Transactions snapshot error:', err);
    onUpdate(getCached<Transaction[]>(cacheKey, []));
  });
}

export function subscribeToVehicles(user: User | null, onUpdate: (vehicles: Vehicle[]) => void) {
  const cacheKey = getUserCacheKey('vehicles', user);
  const cached = getCached<Vehicle[]>(cacheKey, []);
  if (cached.length > 0) onUpdate(cached);

  const uid = resolveUserUid(user);
  if (!uid) {
    onUpdate(cached);
    return () => {};
  }

  const q = query(collection(db, 'users', uid, 'vehicles'), orderBy('name', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Vehicle));
    setCached(cacheKey, data);
    onUpdate(data);
  }, (err) => {
    console.warn('Vehicles snapshot error:', err);
    onUpdate(getCached<Vehicle[]>(cacheKey, []));
  });
}

export function subscribeToVehicleLogs(user: User | null, onUpdate: (logs: VehicleLog[]) => void) {
  const cacheKey = getUserCacheKey('vehicle_logs', user);
  const cached = getCached<VehicleLog[]>(cacheKey, []);
  if (cached.length > 0) onUpdate(cached);

  const uid = resolveUserUid(user);
  if (!uid) {
    onUpdate(cached);
    return () => {};
  }

  const q = query(collection(db, 'users', uid, 'vehicle_logs'), orderBy('date', 'desc'), limit(150));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as VehicleLog));
    setCached(cacheKey, data);
    onUpdate(data);
  }, (err) => {
    console.warn('Vehicle logs snapshot error:', err);
    onUpdate(getCached<VehicleLog[]>(cacheKey, []));
  });
}

export function subscribeToTodos(user: User | null, onUpdate: (todos: TodoNote[]) => void) {
  const cacheKey = getUserCacheKey('todos', user);
  const cached = getCached<TodoNote[]>(cacheKey, []);
  if (cached.length > 0) onUpdate(cached);

  const uid = resolveUserUid(user);
  if (!uid) {
    onUpdate(cached);
    return () => {};
  }

  const q = query(collection(db, 'users', uid, 'todos'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as TodoNote));
    setCached(cacheKey, data);
    onUpdate(data);
  }, (err) => {
    console.warn('Todos snapshot error:', err);
    onUpdate(getCached<TodoNote[]>(cacheKey, []));
  });
}

export function subscribeToEntities(user: User | null, onUpdate: (entities: Entity[]) => void) {
  const cacheKey = getUserCacheKey('entities', user);
  const cached = getCached<Entity[]>(cacheKey, []);
  if (cached.length > 0) onUpdate(cached);

  const uid = resolveUserUid(user);
  if (!uid) {
    onUpdate(cached);
    return () => {};
  }

  const q = query(collection(db, 'users', uid, 'receivables_payables'), orderBy('name', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Entity));
    setCached(cacheKey, data);
    onUpdate(data);
  }, (err) => {
    console.warn('Entities snapshot error:', err);
    onUpdate(getCached<Entity[]>(cacheKey, []));
  });
}

export function subscribeToExerciseLogs(user: User | null, onUpdate: (logs: ExerciseLog[]) => void) {
  const cacheKey = getUserCacheKey('exercise_logs', user);
  const cached = getCached<ExerciseLog[]>(cacheKey, []);
  if (cached.length > 0) onUpdate(cached);

  const uid = resolveUserUid(user);
  if (!uid) {
    onUpdate(cached);
    return () => {};
  }

  const q = query(collection(db, 'users', uid, 'exercise_logs'), orderBy('date', 'desc'), limit(150));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as ExerciseLog));
    setCached(cacheKey, data);
    onUpdate(data);
  }, (err) => {
    console.warn('Exercise logs snapshot error:', err);
    onUpdate(getCached<ExerciseLog[]>(cacheKey, []));
  });
}

export function subscribeToCalendarEvents(user: User | null, onUpdate: (events: CalendarEvent[]) => void) {
  const cacheKey = getUserCacheKey('calendar_events', user);
  const cached = getCached<CalendarEvent[]>(cacheKey, []);
  if (cached.length > 0) onUpdate(cached);

  const uid = resolveUserUid(user);
  if (!uid) {
    onUpdate(cached);
    return () => {};
  }

  const q = query(collection(db, 'users', uid, 'calendar_events'), orderBy('date', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as CalendarEvent));
    setCached(cacheKey, data);
    onUpdate(data);
  }, (err) => {
    console.warn('Calendar events snapshot error:', err);
    onUpdate(getCached<CalendarEvent[]>(cacheKey, []));
  });
}

export function subscribeToMenstrualLogs(user: User | null, onUpdate: (logs: MenstrualLog[]) => void) {
  const cacheKey = getUserCacheKey('menstrual_logs', user);
  const cached = getCached<MenstrualLog[]>(cacheKey, []);
  if (cached.length > 0) onUpdate(cached);

  const uid = resolveUserUid(user);
  if (!uid) {
    onUpdate(cached);
    return () => {};
  }

  const q = query(collection(db, 'users', uid, 'menstrual_logs'), orderBy('date', 'desc'), limit(200));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as MenstrualLog));
    setCached(cacheKey, data);
    onUpdate(data);
  }, (err) => {
    console.warn('Menstrual logs snapshot error:', err);
    onUpdate(getCached<MenstrualLog[]>(cacheKey, []));
  });
}

export function subscribeToMenstrualPeriods(user: User | null, onUpdate: (periods: MenstrualPeriodRecord[]) => void) {
  const cacheKey = getUserCacheKey('menstrual_periods', user);
  const cached = getCached<MenstrualPeriodRecord[]>(cacheKey, []);
  if (cached.length > 0) onUpdate(cached);

  const uid = resolveUserUid(user);
  if (!uid) {
    onUpdate(cached);
    return () => {};
  }

  const q = query(collection(db, 'users', uid, 'menstrual_periods'), orderBy('startDate', 'desc'), limit(50));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as MenstrualPeriodRecord));
    setCached(cacheKey, data);
    onUpdate(data);
  }, (err) => {
    console.warn('Menstrual periods snapshot error:', err);
    onUpdate(getCached<MenstrualPeriodRecord[]>(cacheKey, []));
  });
}

export function subscribeToMenstrualSettings(user: User | null, onUpdate: (settings: MenstrualCycleSettings) => void) {
  const cacheKey = getUserCacheKey('menstrual_settings', user);
  const defaultSettings: MenstrualCycleSettings = {
    averageCycleLength: 28,
    averagePeriodDuration: 5,
    lutealPhaseLength: 14,
    privacyMode: false
  };
  const cached = getCached<MenstrualCycleSettings>(cacheKey, defaultSettings);
  onUpdate(cached);

  const uid = resolveUserUid(user);
  if (!uid) return () => {};

  const docRef = doc(db, 'users', uid, 'settings', 'menstrual');
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data() as MenstrualCycleSettings;
      setCached(cacheKey, data);
      onUpdate(data);
    }
  }, (err) => {
    console.warn('Menstrual settings snapshot error:', err);
  });
}

// Global seed alias
export async function seedSampleData(): Promise<void> {
  if (auth.currentUser) {
    await seedUserStarterData(auth.currentUser);
  }
}
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
