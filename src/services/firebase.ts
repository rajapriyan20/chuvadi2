/**
 * Firebase Firestore & Authentication Service for Chuvadi
 * Features:
 * - Real-time subscriptions partitioned per user (Zero-leak user isolation)
 * - Automatic background reconciliation & local-to-cloud recovery (zero manual sync needed)
 * - Live Cloud Sync Status & per-collection diagnostics store
 * - Deep undefined-field sanitization + ignoreUndefinedProperties
 * - Atomic Multi-Document Transactions (runTransaction) with automatic pending queue fallback
 * - Offline LocalStorage Mirroring fallback per user
 * - Calendar Events, Recurring Transactions & Menstrual Tracker persistence
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDocFromServer,
  getDocsFromServer,
  onSnapshot,
  runTransaction,
  writeBatch,
  query,
  type Firestore,
  type Query
} from 'firebase/firestore';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  signInAnonymously,
  onAuthStateChanged,
  type User
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
  MenstrualCycleSettings,
  RecurringTransaction,
  CloudSyncStatus,
  CloudSyncPhase,
  SyncedCollectionKey,
  CollectionSyncStat,
  SyncLogEntry
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
  DEMO_MENSTRUAL_LOGS,
  DEMO_RECURRING_TRANSACTIONS
} from '../data/demoData';
import appletConfig from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: appletConfig.apiKey,
  authDomain: appletConfig.authDomain,
  projectId: appletConfig.projectId,
  storageBucket: appletConfig.storageBucket,
  messagingSenderId: appletConfig.messagingSenderId,
  appId: appletConfig.appId
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

function createFirestoreInstance(): Firestore {
  try {
    return initializeFirestore(app, {
      ignoreUndefinedProperties: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  } catch {
    try {
      return initializeFirestore(app, {
        ignoreUndefinedProperties: true
      });
    } catch {
      return getFirestore(app);
    }
  }
}

export const db = createFirestoreInstance();
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const PRIMARY_USER_EMAIL = 'rajapriyan20@gmail.com';

export function isPrimaryUser(u?: User | null): boolean {
  if (!u || !u.email) return false;
  return u.email.trim().toLowerCase() === PRIMARY_USER_EMAIL.toLowerCase();
}

// ==========================================
// DATA SANITIZATION (Prevents Firestore undefined errors)
// ==========================================

export function stripUndefinedDeep<T>(value: T): T {
  if (value === undefined) {
    return value;
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(value as Record<string, any>)) {
    if (val !== undefined) {
      result[key] = stripUndefinedDeep(val);
    }
  }
  return result as T;
}

export function parseFiniteNumber(val: unknown): number | null {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string' && val.trim() !== '') {
    const parsed = Number(val);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function normalizeAccountRecord(raw: any): Account {
  const parsedOp = parseFiniteNumber(raw?.openingBalance);
  const parsedBal = parseFiniteNumber(raw?.balance);
  return {
    ...raw,
    balance: parsedBal !== null ? parsedBal : 0,
    ...(parsedOp !== null ? { openingBalance: parsedOp } : {})
  } as Account;
}

// ==========================================
// STRUCTURED FIRESTORE ERROR DIAGNOSTICS
// ==========================================

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  code?: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function extractFirestoreErrorCode(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err && typeof (err as any).code === 'string') {
    return (err as any).code;
  }
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
    return 'permission-denied';
  }
  if (msg.includes('the client is offline') || msg.includes('unavailable')) {
    return 'unavailable';
  }
  if (msg.includes('unauthenticated')) {
    return 'unauthenticated';
  }
  return 'unknown';
}

function isOfflineOrTransientError(err: unknown): boolean {
  const code = extractFirestoreErrorCode(err);
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    !navigator.onLine ||
    code === 'unavailable' ||
    msg.includes('client is offline') ||
    msg.includes('network') ||
    msg.includes('failed to get document because the client is offline')
  );
}

// ==========================================
// LOCAL STORAGE CACHE & PENDING SYNC QUEUE
// ==========================================

const LS_PREFIX = 'chuvadi_cache_';
const PENDING_PREFIX = 'chuvadi_pending_sync_';
const KNOWN_IDS_PREFIX = 'chuvadi_known_cloud_ids_';

interface CollectionMeta {
  key: SyncedCollectionKey;
  label: string;
  cacheSuffix: string;
}

const SYNCED_COLLECTIONS: CollectionMeta[] = [
  { key: 'accounts', label: 'Accounts (Chart of Accounts)', cacheSuffix: 'accounts' },
  { key: 'transactions', label: 'Transactions Ledger', cacheSuffix: 'transactions' },
  { key: 'recurring_transactions', label: 'Recurring Rules', cacheSuffix: 'recurring_transactions' },
  { key: 'vehicles', label: 'Vehicles', cacheSuffix: 'vehicles' },
  { key: 'vehicle_logs', label: 'Vehicle Service & Fuel Logs', cacheSuffix: 'vehicle_logs' },
  { key: 'todos', label: 'Checklists & Reminders', cacheSuffix: 'todos' },
  { key: 'receivables_payables', label: 'Receivables & Payables', cacheSuffix: 'entities' },
  { key: 'exercise_logs', label: 'Exercise Logs', cacheSuffix: 'exercise_logs' },
  { key: 'calendar_events', label: 'Calendar & Birthdays', cacheSuffix: 'calendar_events' },
  { key: 'menstrual_logs', label: 'Wellness Daily Logs', cacheSuffix: 'menstrual_logs' },
  { key: 'menstrual_periods', label: 'Cycle Period Records', cacheSuffix: 'menstrual_periods' },
  { key: 'settings', label: 'Cycle & App Settings', cacheSuffix: 'menstrual_settings' }
];

const COLLECTION_LABEL_MAP = new Map<SyncedCollectionKey, CollectionMeta>(
  SYNCED_COLLECTIONS.map((c) => [c.key, c])
);

interface PendingSyncStore {
  upserts: Record<string, Record<string, any>>;
  deletes: Record<string, string[]>;
}

function getPendingSyncStore(uid: string | null): PendingSyncStore {
  if (!uid) return { upserts: {}, deletes: {} };
  try {
    const raw = localStorage.getItem(PENDING_PREFIX + uid);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        upserts: parsed?.upserts && typeof parsed.upserts === 'object' ? parsed.upserts : {},
        deletes: parsed?.deletes && typeof parsed.deletes === 'object' ? parsed.deletes : {}
      };
    }
  } catch {}
  return { upserts: {}, deletes: {} };
}

function savePendingSyncStore(uid: string | null, store: PendingSyncStore): void {
  if (!uid) return;
  try {
    localStorage.setItem(PENDING_PREFIX + uid, JSON.stringify(store));
  } catch (e) {
    console.warn('Unable to persist pending sync queue:', e);
  }
}

function queuePendingUpsert(uid: string | null, colKey: SyncedCollectionKey, docId: string, data: any): void {
  if (!uid) return;
  const store = getPendingSyncStore(uid);
  if (!store.upserts[colKey]) store.upserts[colKey] = {};
  store.upserts[colKey][docId] = stripUndefinedDeep(data);
  if (store.deletes[colKey]) {
    store.deletes[colKey] = store.deletes[colKey].filter((id) => id !== docId);
  }
  savePendingSyncStore(uid, store);
}

function clearPendingUpsert(uid: string | null, colKey: SyncedCollectionKey, docId: string): void {
  if (!uid) return;
  const store = getPendingSyncStore(uid);
  if (store.upserts[colKey] && docId in store.upserts[colKey]) {
    delete store.upserts[colKey][docId];
    savePendingSyncStore(uid, store);
  }
}

function queuePendingDelete(uid: string | null, colKey: SyncedCollectionKey, docId: string): void {
  if (!uid) return;
  const store = getPendingSyncStore(uid);
  if (!store.deletes[colKey]) store.deletes[colKey] = [];
  if (!store.deletes[colKey].includes(docId)) {
    store.deletes[colKey].push(docId);
  }
  if (store.upserts[colKey] && docId in store.upserts[colKey]) {
    delete store.upserts[colKey][docId];
  }
  savePendingSyncStore(uid, store);
}

function clearPendingDelete(uid: string | null, colKey: SyncedCollectionKey, docId: string): void {
  if (!uid) return;
  const store = getPendingSyncStore(uid);
  if (store.deletes[colKey]) {
    store.deletes[colKey] = store.deletes[colKey].filter((id) => id !== docId);
    savePendingSyncStore(uid, store);
  }
}

type KnownCloudIdsStore = Record<string, string[]>;

function getKnownCloudIds(uid: string | null): KnownCloudIdsStore {
  if (!uid) return {};
  try {
    const raw = localStorage.getItem(KNOWN_IDS_PREFIX + uid);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {}
  return {};
}

function setKnownCloudIdsForCollection(uid: string | null, colKey: SyncedCollectionKey, ids: string[]): void {
  if (!uid) return;
  const store = getKnownCloudIds(uid);
  store[colKey] = Array.from(new Set(ids));
  try {
    localStorage.setItem(KNOWN_IDS_PREFIX + uid, JSON.stringify(store));
  } catch {}
}

function addKnownCloudId(uid: string | null, colKey: SyncedCollectionKey, id: string): void {
  if (!uid) return;
  const store = getKnownCloudIds(uid);
  const list = store[colKey] || [];
  if (!list.includes(id)) {
    store[colKey] = [...list, id];
    try {
      localStorage.setItem(KNOWN_IDS_PREFIX + uid, JSON.stringify(store));
    } catch {}
  }
}

function removeKnownCloudId(uid: string | null, colKey: SyncedCollectionKey, id: string): void {
  if (!uid) return;
  const store = getKnownCloudIds(uid);
  if (store[colKey]) {
    store[colKey] = store[colKey].filter((x) => x !== id);
    try {
      localStorage.setItem(KNOWN_IDS_PREFIX + uid, JSON.stringify(store));
    } catch {}
  }
}

function countPendingForCollection(store: PendingSyncStore, colKey: SyncedCollectionKey): number {
  const upserts = store.upserts[colKey] ? Object.keys(store.upserts[colKey]).length : 0;
  const deletes = store.deletes[colKey] ? store.deletes[colKey].length : 0;
  return upserts + deletes;
}

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
  } catch {
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

// ==========================================
// REAL-TIME CLOUD SYNC STATUS & STATS STORE
// ==========================================

function createInitialCollectionsMap(): Record<SyncedCollectionKey, CollectionSyncStat> {
  const map = {} as Record<SyncedCollectionKey, CollectionSyncStat>;
  for (const col of SYNCED_COLLECTIONS) {
    map[col.key] = {
      key: col.key,
      label: col.label,
      cloudCount: null,
      localCount: 0,
      pendingCount: 0,
      fromCache: false,
      hasPendingWrites: false,
      status: 'idle',
      lastSyncedAt: null,
      error: null
    };
  }
  return map;
}

const syncListeners = new Set<(status: CloudSyncStatus) => void>();
const activeFirestoreListeners = new Set<SyncedCollectionKey>();
const activeCollectionSubscribers = new Map<
  SyncedCollectionKey,
  { onUpdate: (items: any[]) => void; sort?: (a: any, b: any) => number }
>();
const autoSyncCompletedByUid = new Set<string>();
const activeReconcilePromises = new Map<string, Promise<void>>();

let isGuestSession = false;
let isReconcilingNow = false;
let activeWriteOperations = 0;

let syncStatusState: CloudSyncStatus = {
  phase: 'signed-out',
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  serverReachable: null,
  userId: null,
  userEmail: null,
  projectId: appletConfig.projectId,
  lastSyncedAt: null,
  lastReconciledAt: null,
  pendingCount: 0,
  recoveredLocalCount: 0,
  connectedListeners: 0,
  totalListeners: SYNCED_COLLECTIONS.length,
  lastError: null,
  lastErrorCode: null,
  collections: createInitialCollectionsMap(),
  logs: []
};

function appendSyncLog(level: SyncLogEntry['level'], message: string, collectionKey?: string): void {
  const entry: SyncLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    level,
    message,
    collection: collectionKey
  };
  syncStatusState = {
    ...syncStatusState,
    logs: [entry, ...syncStatusState.logs].slice(0, 25)
  };
}

function getLocalCountForCollection(user: User | null, colMeta: CollectionMeta): number {
  if (!user) return 0;
  const cacheKey = getUserCacheKey(colMeta.cacheSuffix, user);
  if (colMeta.key === 'settings') {
    const raw = localStorage.getItem(LS_PREFIX + cacheKey);
    return raw ? 1 : 0;
  }
  const items = getCached<any[]>(cacheKey, []);
  return Array.isArray(items) ? items.length : 0;
}

function recomputeAndNotifySyncStatus(): void {
  const currentUser = auth.currentUser;
  const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const uid = currentUser?.uid || null;
  const pendingStore = getPendingSyncStore(uid);

  let totalPending = 0;
  let hasAnyError = false;
  let anyPendingWrites = false;
  let anyServerConfirmed = false;
  let anySyncingCollection = false;

  const updatedCollections = { ...syncStatusState.collections };

  for (const colMeta of SYNCED_COLLECTIONS) {
    const prev = updatedCollections[colMeta.key];
    const localCount = getLocalCountForCollection(currentUser, colMeta);
    const pendingCount = countPendingForCollection(pendingStore, colMeta.key);
    totalPending += pendingCount;

    let nextStatus = prev.status;
    if (prev.error) {
      nextStatus = 'error';
      hasAnyError = true;
    } else if (pendingCount > 0 || prev.hasPendingWrites) {
      nextStatus = 'pending';
      anyPendingWrites = true;
    } else if (prev.status === 'syncing') {
      anySyncingCollection = true;
    } else if (prev.cloudCount !== null && !prev.fromCache) {
      nextStatus = 'synced';
      anyServerConfirmed = true;
    } else if (prev.fromCache && activeFirestoreListeners.has(colMeta.key)) {
      nextStatus = 'cached';
    }

    updatedCollections[colMeta.key] = {
      ...prev,
      localCount,
      pendingCount,
      status: nextStatus
    };
  }

  let phase: CloudSyncPhase;
  if (isGuestSession && !currentUser) {
    phase = 'guest';
  } else if (!currentUser) {
    phase = 'signed-out';
  } else if (!online || syncStatusState.serverReachable === false) {
    phase = 'offline';
  } else if (hasAnyError || (syncStatusState.lastError && syncStatusState.lastErrorCode !== 'unavailable')) {
    phase = 'error';
  } else if (isReconcilingNow || activeWriteOperations > 0 || anySyncingCollection) {
    phase = 'syncing';
  } else if (totalPending > 0 || anyPendingWrites) {
    phase = 'pending';
  } else if (anyServerConfirmed || syncStatusState.serverReachable === true) {
    phase = 'synced';
  } else {
    phase = 'connecting';
  }

  syncStatusState = {
    ...syncStatusState,
    phase,
    isOnline: online,
    userId: currentUser?.uid || null,
    userEmail: currentUser?.email || null,
    pendingCount: totalPending,
    connectedListeners: activeFirestoreListeners.size,
    totalListeners: SYNCED_COLLECTIONS.length,
    collections: updatedCollections
  };

  const snapshot = getCloudSyncStatus();
  syncListeners.forEach((cb) => cb(snapshot));
}

export function getCloudSyncStatus(): CloudSyncStatus {
  return {
    ...syncStatusState,
    collections: { ...syncStatusState.collections },
    logs: [...syncStatusState.logs]
  };
}

export function subscribeSyncStatus(callback: (status: CloudSyncStatus) => void): () => void {
  syncListeners.add(callback);
  callback(getCloudSyncStatus());
  return () => {
    syncListeners.delete(callback);
  };
}

export function setSyncGuestMode(active: boolean): void {
  isGuestSession = active;
  recomputeAndNotifySyncStatus();
}

function updateCollectionStat(
  colKey: SyncedCollectionKey,
  patch: Partial<CollectionSyncStat>
): void {
  const prev = syncStatusState.collections[colKey];
  syncStatusState = {
    ...syncStatusState,
    collections: {
      ...syncStatusState.collections,
      [colKey]: {
        ...prev,
        ...patch
      }
    }
  };
}

function reportFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  colKey?: SyncedCollectionKey
): void {
  const code = extractFirestoreErrorCode(error);
  const message = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: message,
    code,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email
        })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));

  if (isOfflineOrTransientError(error)) {
    syncStatusState = {
      ...syncStatusState,
      serverReachable: navigator.onLine ? syncStatusState.serverReachable : false
    };
    if (colKey) {
      updateCollectionStat(colKey, {
        fromCache: true,
        status: 'pending'
      });
    }
    appendSyncLog('warn', `Offline or transient issue during ${operationType} (${path || 'unknown'}): queued locally.`, colKey);
  } else {
    syncStatusState = {
      ...syncStatusState,
      lastError: message,
      lastErrorCode: code
    };
    if (colKey) {
      updateCollectionStat(colKey, {
        status: 'error',
        error: `${code}: ${message}`
      });
    }
    appendSyncLog('error', `${operationType.toUpperCase()} failed on ${path || 'firestore'} [${code}]: ${message}`, colKey);
  }

  recomputeAndNotifySyncStatus();
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncStatusState = { ...syncStatusState, isOnline: true, serverReachable: null };
    appendSyncLog('info', 'Network connection restored. Running automatic cloud sync...');
    recomputeAndNotifySyncStatus();
    if (auth.currentUser) {
      autoSyncUserWorkspace(auth.currentUser);
    }
  });
  window.addEventListener('offline', () => {
    syncStatusState = { ...syncStatusState, isOnline: false, serverReachable: false };
    appendSyncLog('warn', 'Device went offline. Changes will be queued locally.');
    recomputeAndNotifySyncStatus();
  });
}

// ==========================================
// FIRESTORE CONNECTION TEST & AUTO-SYNC ENGINE
// ==========================================

export async function testFirestoreConnection(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    syncStatusState = { ...syncStatusState, isOnline: false, serverReachable: false };
    recomputeAndNotifySyncStatus();
    return false;
  }

  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    syncStatusState = {
      ...syncStatusState,
      serverReachable: true,
      lastError: syncStatusState.lastErrorCode === 'unavailable' ? null : syncStatusState.lastError,
      lastErrorCode: syncStatusState.lastErrorCode === 'unavailable' ? null : syncStatusState.lastErrorCode
    };
    recomputeAndNotifySyncStatus();
    return true;
  } catch (error) {
    const code = extractFirestoreErrorCode(error);
    if (isOfflineOrTransientError(error)) {
      syncStatusState = {
        ...syncStatusState,
        serverReachable: false
      };
      appendSyncLog('warn', 'Cloud server unreachable (client offline). Using cached data.');
      recomputeAndNotifySyncStatus();
      return false;
    }
    // Note: if test/connection rule fails with permission-denied, user-scoped docs might still work if auth.uid matches,
    // or all rules might be failing. Record warning and let user-scoped sync verify.
    if (code === 'permission-denied') {
      syncStatusState = {
        ...syncStatusState,
        serverReachable: true
      };
      recomputeAndNotifySyncStatus();
      return true;
    }
    reportFirestoreError(error, OperationType.GET, 'test/connection');
    return false;
  }
}

/**
 * Automatically reconciles local browser cache + pending offline writes with Cloud Firestore.
 * Runs automatically on login, reconnect, focus, and periodic retry when pending items exist.
 * Also safely recovers pre-existing local-only records (e.g. from earlier silent fallbacks) to Cloud.
 */
export async function autoSyncUserWorkspace(user?: User | null): Promise<void> {
  const activeUser = user || auth.currentUser;
  if (!activeUser || !activeUser.uid) return;

  const uid = activeUser.uid;
  const existingRun = activeReconcilePromises.get(uid);
  if (existingRun) return existingRun;

  const run = (async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      syncStatusState = { ...syncStatusState, isOnline: false, serverReachable: false };
      recomputeAndNotifySyncStatus();
      return;
    }

    isReconcilingNow = true;
    recomputeAndNotifySyncStatus();

    const reachable = await testFirestoreConnection();
    if (!reachable) {
      isReconcilingNow = false;
      recomputeAndNotifySyncStatus();
      return;
    }

    let recoveredThisRun = 0;
    let pushedPendingThisRun = 0;
    let encounteredError = false;
    const pendingStore = getPendingSyncStore(uid);
    const knownStore = getKnownCloudIds(uid);

    for (const colMeta of SYNCED_COLLECTIONS) {
      const colKey = colMeta.key;
      if (colKey === 'settings') {
        try {
          const settingsRef = doc(db, 'users', uid, 'settings', 'menstrual');
          const snap = await getDocFromServer(settingsRef);
          const pendingSettings = pendingStore.upserts[colKey]?.menstrual;
          const localSettingsRaw = localStorage.getItem(LS_PREFIX + getUserCacheKey(colMeta.cacheSuffix, activeUser));
          const localSettings = localSettingsRaw ? JSON.parse(localSettingsRaw) : null;

          if (pendingSettings) {
            await setDoc(settingsRef, stripUndefinedDeep(pendingSettings), { merge: true });
            clearPendingUpsert(uid, colKey, 'menstrual');
            pushedPendingThisRun++;
          } else if (!snap.exists() && localSettings) {
            await setDoc(settingsRef, stripUndefinedDeep(localSettings), { merge: true });
            recoveredThisRun++;
          }

          updateCollectionStat(colKey, {
            cloudCount: snap.exists() || pendingSettings || localSettings ? 1 : 0,
            fromCache: false,
            hasPendingWrites: false,
            status: 'synced',
            lastSyncedAt: Date.now(),
            error: null
          });
        } catch (err) {
          encounteredError = true;
          reportFirestoreError(err, OperationType.WRITE, `users/${uid}/settings/menstrual`, colKey);
        }
        continue;
      }

      try {
        updateCollectionStat(colKey, { status: 'syncing' });
        const colRef = collection(db, 'users', uid, colKey);
        const serverSnap = await getDocsFromServer(colRef);
        const serverMap = new Map<string, any>();
        serverSnap.forEach((d) => {
          const raw = { ...d.data(), id: d.id };
          serverMap.set(d.id, colKey === 'accounts' ? normalizeAccountRecord(raw) : raw);
        });

        const cacheKey = getUserCacheKey(colMeta.cacheSuffix, activeUser);
        const localItems = getCached<any[]>(cacheKey, []).map((item) =>
          colKey === 'accounts' ? normalizeAccountRecord(item) : item
        );
        const knownIds = new Set<string>(knownStore[colKey] || []);
        const pendingDeletes = new Set<string>(pendingStore.deletes[colKey] || []);
        const pendingUpserts = pendingStore.upserts[colKey] || {};

        // 1. Delete items queued for deletion while offline
        for (const delId of Array.from(pendingDeletes)) {
          if (serverMap.has(delId)) {
            await deleteDoc(doc(db, 'users', uid, colKey, delId));
            serverMap.delete(delId);
          }
          clearPendingDelete(uid, colKey, delId);
          removeKnownCloudId(uid, colKey, delId);
          pushedPendingThisRun++;
        }

        // 2. Determine items to push to Cloud:
        //    - Explicitly queued pending upserts
        //    - Local cached items that do NOT exist on server AND were never previously confirmed in knownIds
        //    - Local cached items whose local edit timestamp is newer than server (e.g. edited while rules expired)
        //    - Accounts whose openingBalance is present locally while missing on server, or edited more recently locally
        const itemsToPush = new Map<string, any>();
        for (const [id, data] of Object.entries(pendingUpserts)) {
          if (!pendingDeletes.has(id)) {
            itemsToPush.set(id, { ...data, id });
          }
        }
        for (const item of localItems) {
          if (!item || !item.id || pendingDeletes.has(item.id)) continue;

          const serverItem = serverMap.get(item.id);
          if (!serverItem) {
            if (!knownIds.has(item.id)) {
              itemsToPush.set(item.id, item);
            }
            continue;
          }

          const localUpdated = Number(item.updatedAt || item.timestamp || 0);
          const serverUpdated = Number(serverItem.updatedAt || serverItem.timestamp || 0);

          if (colKey === 'accounts') {
            const localOp = parseFiniteNumber(item.openingBalance);
            const serverOp = parseFiniteNumber(serverItem.openingBalance);
            const localOpUpdated = Number(item.openingBalanceUpdatedAt || item.updatedAt || 0);
            const serverOpUpdated = Number(serverItem.openingBalanceUpdatedAt || serverItem.updatedAt || 0);

            if (localOp !== null && serverOp === null) {
              // Cloud account is missing openingBalance while local has it -> restore openingBalance to Cloud
              itemsToPush.set(item.id, {
                ...serverItem,
                ...item,
                openingBalance: localOp,
                openingBalanceUpdatedAt: localOpUpdated || Date.now(),
                updatedAt: Math.max(localUpdated, serverUpdated, Date.now())
              });
            } else if (localOp !== null && serverOp !== null && localOp !== serverOp && localOpUpdated > serverOpUpdated) {
              itemsToPush.set(item.id, {
                ...serverItem,
                ...item,
                openingBalance: localOp,
                openingBalanceUpdatedAt: localOpUpdated,
                updatedAt: Math.max(localUpdated, serverUpdated, Date.now())
              });
            } else if (localUpdated > serverUpdated) {
              itemsToPush.set(item.id, item);
            }
          } else if (localUpdated > serverUpdated) {
            itemsToPush.set(item.id, item);
          }
        }

        if (itemsToPush.size > 0) {
          const entries = Array.from(itemsToPush.entries());
          for (let i = 0; i < entries.length; i += 400) {
            const chunk = entries.slice(i, i + 400);
            const batch = writeBatch(db);
            for (const [id, rawPayload] of chunk) {
              const sanitized = stripUndefinedDeep({ ...rawPayload, id });
              batch.set(doc(db, 'users', uid, colKey, id), sanitized, { merge: true });
              serverMap.set(id, sanitized);
              if (id in pendingUpserts) {
                pushedPendingThisRun++;
              } else {
                recoveredThisRun++;
              }
            }
            await batch.commit();
            for (const [id] of chunk) {
              clearPendingUpsert(uid, colKey, id);
            }
          }
        }

        const mergedList = Array.from(serverMap.values());
        const confirmedIds = Array.from(serverMap.keys());
        setKnownCloudIdsForCollection(uid, colKey, confirmedIds);
        setCached(cacheKey, mergedList);

        const activeSub = activeCollectionSubscribers.get(colKey);
        if (activeSub) {
          const sorted = activeSub.sort ? [...mergedList].sort(activeSub.sort) : mergedList;
          activeSub.onUpdate(sorted);
        }

        updateCollectionStat(colKey, {
          cloudCount: confirmedIds.length,
          localCount: mergedList.length,
          fromCache: false,
          hasPendingWrites: false,
          status: 'synced',
          lastSyncedAt: Date.now(),
          error: null
        });
      } catch (err) {
        encounteredError = true;
        reportFirestoreError(err, OperationType.WRITE, `users/${uid}/${colKey}`, colKey);
      }
    }

    autoSyncCompletedByUid.add(uid);

    if (!encounteredError) {
      syncStatusState = {
        ...syncStatusState,
        serverReachable: true,
        lastError: null,
        lastErrorCode: null,
        lastSyncedAt: Date.now(),
        lastReconciledAt: Date.now(),
        recoveredLocalCount: syncStatusState.recoveredLocalCount + recoveredThisRun
      };
      if (recoveredThisRun > 0 || pushedPendingThisRun > 0) {
        appendSyncLog(
          'success',
          `Auto-synced ${recoveredThisRun + pushedPendingThisRun} record(s) from local device cache to Cloud Firestore.`
        );
      } else {
        appendSyncLog('info', 'Cloud sync check completed. All collections are up to date.');
      }
    } else {
      syncStatusState = {
        ...syncStatusState,
        lastReconciledAt: Date.now()
      };
    }

    isReconcilingNow = false;
    recomputeAndNotifySyncStatus();
  })();

  activeReconcilePromises.set(uid, run);
  try {
    await run;
  } finally {
    activeReconcilePromises.delete(uid);
  }
}

// ==========================================
// AUTHENTICATION HELPERS
// ==========================================

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
  activeFirestoreListeners.clear();
  await fbSignOut(auth);
  syncStatusState = {
    ...syncStatusState,
    lastError: null,
    lastErrorCode: null,
    lastSyncedAt: null,
    lastReconciledAt: null,
    recoveredLocalCount: 0,
    collections: createInitialCollectionsMap(),
    logs: []
  };
  recomputeAndNotifySyncStatus();
}

export function subscribeAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, (currentUser) => {
    if (!currentUser) {
      activeFirestoreListeners.clear();
    }
    recomputeAndNotifySyncStatus();
    callback(currentUser);
  });
}

// ==========================================
// USER DATA MIGRATION & SEEDING
// ==========================================

/**
 * Ensures existing app data is preserved specifically for rajapriyan20@gmail.com.
 * Runs AFTER autoSyncUserWorkspace so any local-device data is uploaded before checking if empty.
 */
export async function syncOrMigratePrimaryUserData(user: User): Promise<void> {
  if (!isPrimaryUser(user)) return;

  const migrationKey = `chuvadi_migrated_${user.uid}`;
  if (localStorage.getItem(migrationKey)) {
    return;
  }

  try {
    // Ensure any local device data is reconciled to Cloud first so we never overwrite real data with starter demo data
    await autoSyncUserWorkspace(user);

    const userAccRef = collection(db, 'users', user.uid, 'accounts');
    const existingSnap = await getDocsFromServer(userAccRef);
    if (!existingSnap.empty) {
      localStorage.setItem(migrationKey, 'true');
      return;
    }

    // Double-check local user cache before ever seeding demo data
    const localUserAccs = getCached<Account[]>(getUserCacheKey('accounts', user), []);
    const localUserTxns = getCached<Transaction[]>(getUserCacheKey('transactions', user), []);
    if (localUserAccs.length > 0 || localUserTxns.length > 0) {
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
      rootAccs.forEach((d) => {
        batch.set(doc(db, 'users', user.uid, 'accounts', d.id), stripUndefinedDeep(d.data()));
        migratedAny = true;
      });
    }
    if (rootTxns && !rootTxns.empty) {
      rootTxns.forEach((d) => {
        batch.set(doc(db, 'users', user.uid, 'transactions', d.id), stripUndefinedDeep(d.data()));
        migratedAny = true;
      });
    }
    if (rootVehs && !rootVehs.empty) {
      rootVehs.forEach((d) => {
        batch.set(doc(db, 'users', user.uid, 'vehicles', d.id), stripUndefinedDeep(d.data()));
        migratedAny = true;
      });
    }
    if (rootLogs && !rootLogs.empty) {
      rootLogs.forEach((d) => {
        batch.set(doc(db, 'users', user.uid, 'vehicle_logs', d.id), stripUndefinedDeep(d.data()));
        migratedAny = true;
      });
    }
    if (rootTodos && !rootTodos.empty) {
      rootTodos.forEach((d) => {
        batch.set(doc(db, 'users', user.uid, 'todos', d.id), stripUndefinedDeep(d.data()));
        migratedAny = true;
      });
    }
    if (rootEntities && !rootEntities.empty) {
      rootEntities.forEach((d) => {
        batch.set(doc(db, 'users', user.uid, 'receivables_payables', d.id), stripUndefinedDeep(d.data()));
        migratedAny = true;
      });
    }
    if (rootEx && !rootEx.empty) {
      rootEx.forEach((d) => {
        batch.set(doc(db, 'users', user.uid, 'exercise_logs', d.id), stripUndefinedDeep(d.data()));
        migratedAny = true;
      });
    }

    if (migratedAny) {
      await batch.commit();
      appendSyncLog('success', 'Migrated legacy root collections into private user workspace.');
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
        for (const a of legacyAccs) await setDoc(doc(db, 'users', user.uid, 'accounts', a.id), stripUndefinedDeep(a));
        for (const t of legacyTxns) await setDoc(doc(db, 'users', user.uid, 'transactions', t.id), stripUndefinedDeep(t));
        for (const v of legacyVehs) await setDoc(doc(db, 'users', user.uid, 'vehicles', v.id), stripUndefinedDeep(v));
        for (const l of legacyLogs) await setDoc(doc(db, 'users', user.uid, 'vehicle_logs', l.id), stripUndefinedDeep(l));
        for (const td of legacyTodos) await setDoc(doc(db, 'users', user.uid, 'todos', td.id), stripUndefinedDeep(td));
        for (const e of legacyEntities) await setDoc(doc(db, 'users', user.uid, 'receivables_payables', e.id), stripUndefinedDeep(e));
        for (const ex of legacyEx) await setDoc(doc(db, 'users', user.uid, 'exercise_logs', ex.id), stripUndefinedDeep(ex));
        appendSyncLog('success', 'Migrated legacy un-scoped local cache to Cloud Firestore.');
      } else {
        // First run: seed standard sample starter accounts for Rajapriyan
        await seedSampleDataForUser(user);
      }
    }

    localStorage.setItem(migrationKey, 'true');
  } catch (err) {
    reportFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
  }
}

/**
 * Seeds demo data into a specific user account when they choose "Load Demo Data"
 */
export async function seedUserStarterData(user: User): Promise<void> {
  const batch = writeBatch(db);

  for (const acc of DEMO_ACCOUNTS) {
    batch.set(doc(db, 'users', user.uid, 'accounts', acc.id), stripUndefinedDeep(acc));
  }
  for (const veh of DEMO_VEHICLES) {
    batch.set(doc(db, 'users', user.uid, 'vehicles', veh.id), stripUndefinedDeep(veh));
  }
  for (const txn of DEMO_TRANSACTIONS) {
    batch.set(doc(db, 'users', user.uid, 'transactions', txn.id), stripUndefinedDeep(txn));
  }
  for (const log of DEMO_VEHICLE_LOGS) {
    batch.set(doc(db, 'users', user.uid, 'vehicle_logs', log.id), stripUndefinedDeep(log));
  }
  for (const todo of DEMO_TODOS) {
    batch.set(doc(db, 'users', user.uid, 'todos', todo.id), stripUndefinedDeep(todo));
  }
  for (const ent of DEMO_ENTITIES) {
    batch.set(doc(db, 'users', user.uid, 'receivables_payables', ent.id), stripUndefinedDeep(ent));
  }
  for (const ex of DEMO_EXERCISE_LOGS) {
    batch.set(doc(db, 'users', user.uid, 'exercise_logs', ex.id), stripUndefinedDeep(ex));
  }
  for (const evt of DEMO_CALENDAR_EVENTS) {
    batch.set(doc(db, 'users', user.uid, 'calendar_events', evt.id), stripUndefinedDeep(evt));
  }
  for (const period of DEMO_MENSTRUAL_PERIODS) {
    batch.set(doc(db, 'users', user.uid, 'menstrual_periods', period.id), stripUndefinedDeep(period));
  }
  for (const mlog of DEMO_MENSTRUAL_LOGS) {
    batch.set(doc(db, 'users', user.uid, 'menstrual_logs', mlog.id), stripUndefinedDeep(mlog));
  }
  batch.set(doc(db, 'users', user.uid, 'settings', 'menstrual'), stripUndefinedDeep(DEMO_MENSTRUAL_SETTINGS));

  for (const rec of DEMO_RECURRING_TRANSACTIONS) {
    batch.set(doc(db, 'users', user.uid, 'recurring_transactions', rec.id), stripUndefinedDeep(rec));
  }

  try {
    await batch.commit();
  } catch (err) {
    reportFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    throw err;
  }

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
  setCached(getUserCacheKey('recurring_transactions', user), DEMO_RECURRING_TRANSACTIONS);

  setKnownCloudIdsForCollection(user.uid, 'accounts', DEMO_ACCOUNTS.map((x) => x.id));
  setKnownCloudIdsForCollection(user.uid, 'transactions', DEMO_TRANSACTIONS.map((x) => x.id));
  setKnownCloudIdsForCollection(user.uid, 'vehicles', DEMO_VEHICLES.map((x) => x.id));
  setKnownCloudIdsForCollection(user.uid, 'vehicle_logs', DEMO_VEHICLE_LOGS.map((x) => x.id));
  setKnownCloudIdsForCollection(user.uid, 'todos', DEMO_TODOS.map((x) => x.id));
  setKnownCloudIdsForCollection(user.uid, 'receivables_payables', DEMO_ENTITIES.map((x) => x.id));
  setKnownCloudIdsForCollection(user.uid, 'exercise_logs', DEMO_EXERCISE_LOGS.map((x) => x.id));
  setKnownCloudIdsForCollection(user.uid, 'calendar_events', DEMO_CALENDAR_EVENTS.map((x) => x.id));
  setKnownCloudIdsForCollection(user.uid, 'menstrual_periods', DEMO_MENSTRUAL_PERIODS.map((x) => x.id));
  setKnownCloudIdsForCollection(user.uid, 'menstrual_logs', DEMO_MENSTRUAL_LOGS.map((x) => x.id));
  setKnownCloudIdsForCollection(user.uid, 'recurring_transactions', DEMO_RECURRING_TRANSACTIONS.map((x) => x.id));

  appendSyncLog('success', 'Starter workspace data seeded to Cloud Firestore.');
  recomputeAndNotifySyncStatus();
}

/**
 * Clears all data for a specific user to reset to a blank workspace
 */
export async function clearUserData(user: User): Promise<void> {
  const collectionsToClear: SyncedCollectionKey[] = [
    'accounts',
    'transactions',
    'vehicles',
    'vehicle_logs',
    'todos',
    'receivables_payables',
    'exercise_logs',
    'calendar_events',
    'menstrual_logs',
    'menstrual_periods',
    'recurring_transactions'
  ];

  savePendingSyncStore(user.uid, { upserts: {}, deletes: {} });

  for (const colName of collectionsToClear) {
    try {
      const snap = await getDocs(collection(db, 'users', user.uid, colName));
      if (!snap.empty) {
        const docs = snap.docs;
        for (let i = 0; i < docs.length; i += 400) {
          const batch = writeBatch(db);
          docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
          await batch.commit();
        }
      }
      const meta = COLLECTION_LABEL_MAP.get(colName);
      setCached(getUserCacheKey(meta?.cacheSuffix || colName, user), []);
      setKnownCloudIdsForCollection(user.uid, colName, []);
      updateCollectionStat(colName, { cloudCount: 0, status: 'synced', error: null });
    } catch (e) {
      reportFirestoreError(e, OperationType.DELETE, `users/${user.uid}/${colName}`, colName);
    }
  }
  appendSyncLog('info', 'Workspace data cleared across Cloud Firestore & local cache.');
  recomputeAndNotifySyncStatus();
}

async function seedSampleDataForUser(user: User): Promise<void> {
  await seedUserStarterData(user);
}

export function createDocId(colName: string, user?: User | null): string {
  const uid = resolveUserUid(user);
  if (uid) {
    return doc(collection(db, 'users', uid, colName)).id;
  }
  return `${colName}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ==========================================
// ATOMIC TRANSACTION HANDLERS (runTransaction + Auto Queue Fallback)
// ==========================================

export async function saveTransactionAtomic(
  txnData: Omit<Transaction, 'id'> & { id?: string },
  existingTxn?: Transaction | null,
  user?: User | null
): Promise<string> {
  const uid = resolveUserUid(user);
  const cacheKey = getUserCacheKey('transactions', user);
  const accCacheKey = getUserCacheKey('accounts', user);

  let resolvedExisting = existingTxn;
  if (!resolvedExisting && txnData.id) {
    const cachedTxns = getCached<Transaction[]>(cacheKey, []);
    resolvedExisting = cachedTxns.find((t) => t.id === txnData.id) || null;
  }

  const txnId = txnData.id || (uid ? doc(collection(db, 'users', uid, 'transactions')).id : 'txn-' + Date.now());
  const sanitizedPayload: Transaction = stripUndefinedDeep({
    ...txnData,
    id: txnId,
    timestamp: txnData.timestamp || Date.now(),
    amount: Number(txnData.amount) || 0
  });

  // Always update local cache immediately for responsive UI
  const localTxns = getCached<Transaction[]>(cacheKey, []);
  const updatedLocalTxns = localTxns.some((t) => t.id === txnId)
    ? localTxns.map((t) => (t.id === txnId ? sanitizedPayload : t))
    : [sanitizedPayload, ...localTxns];
  setCached(cacheKey, updatedLocalTxns);

  if (!uid) {
    return txnId;
  }

  const txnRef = doc(db, 'users', uid, 'transactions', txnId);
  activeWriteOperations++;
  recomputeAndNotifySyncStatus();

  try {
    await runTransaction(db, async (t) => {
      const accountIdsToFetch = new Set<string>();
      if (resolvedExisting) {
        if (resolvedExisting.fromAccountId) accountIdsToFetch.add(resolvedExisting.fromAccountId);
        if (resolvedExisting.toAccountId) accountIdsToFetch.add(resolvedExisting.toAccountId);
      }
      if (sanitizedPayload.fromAccountId) accountIdsToFetch.add(sanitizedPayload.fromAccountId);
      if (sanitizedPayload.toAccountId) accountIdsToFetch.add(sanitizedPayload.toAccountId);

      const accountDocs = new Map<string, any>();
      for (const accId of accountIdsToFetch) {
        const ref = doc(db, 'users', uid, 'accounts', accId);
        const snap = await t.get(ref);
        if (snap.exists()) {
          accountDocs.set(accId, { ref, data: snap.data() });
        }
      }

      if (resolvedExisting && !resolvedExisting.disabled) {
        const oldAmt = Number(resolvedExisting.amount) || 0;
        if (resolvedExisting.type === 'EXPENSE' && resolvedExisting.fromAccountId) {
          const acc = accountDocs.get(resolvedExisting.fromAccountId);
          if (acc) acc.data.balance = (acc.data.balance || 0) + oldAmt;
        } else if (resolvedExisting.type === 'INCOME' && resolvedExisting.toAccountId) {
          const acc = accountDocs.get(resolvedExisting.toAccountId);
          if (acc) acc.data.balance = (acc.data.balance || 0) - oldAmt;
        } else if (resolvedExisting.type === 'TRANSFER') {
          if (resolvedExisting.fromAccountId) {
            const acc = accountDocs.get(resolvedExisting.fromAccountId);
            if (acc) acc.data.balance = (acc.data.balance || 0) + oldAmt;
          }
          if (resolvedExisting.toAccountId) {
            const acc = accountDocs.get(resolvedExisting.toAccountId);
            if (acc) acc.data.balance = (acc.data.balance || 0) - oldAmt;
          }
        }
      }

      const newAmt = Number(sanitizedPayload.amount) || 0;
      if (!sanitizedPayload.disabled) {
        if (sanitizedPayload.type === 'EXPENSE' && sanitizedPayload.fromAccountId) {
          const acc = accountDocs.get(sanitizedPayload.fromAccountId);
          if (acc) acc.data.balance = (acc.data.balance || 0) - newAmt;
        } else if (sanitizedPayload.type === 'INCOME' && sanitizedPayload.toAccountId) {
          const acc = accountDocs.get(sanitizedPayload.toAccountId);
          if (acc) acc.data.balance = (acc.data.balance || 0) + newAmt;
        } else if (sanitizedPayload.type === 'TRANSFER') {
          if (sanitizedPayload.fromAccountId) {
            const acc = accountDocs.get(sanitizedPayload.fromAccountId);
            if (acc) acc.data.balance = (acc.data.balance || 0) - newAmt;
          }
          if (sanitizedPayload.toAccountId) {
            const acc = accountDocs.get(sanitizedPayload.toAccountId);
            if (acc) acc.data.balance = (acc.data.balance || 0) + newAmt;
          }
        }
      }

      if (sanitizedPayload.vehicleId && sanitizedPayload.odometer) {
        const vehRef = doc(db, 'users', uid, 'vehicles', sanitizedPayload.vehicleId);
        const vehSnap = await t.get(vehRef);
        if (vehSnap.exists()) {
          const vehData = vehSnap.data();
          if (!vehData.currentOdometer || sanitizedPayload.odometer > vehData.currentOdometer) {
            t.update(vehRef, { currentOdometer: sanitizedPayload.odometer });
          }
        }
      }

      for (const [, item] of accountDocs) {
        t.update(item.ref, {
          balance: item.data.balance,
          updatedAt: Date.now()
        });
      }

      t.set(txnRef, sanitizedPayload);
    });

    clearPendingUpsert(uid, 'transactions', txnId);
    addKnownCloudId(uid, 'transactions', txnId);
    syncStatusState = {
      ...syncStatusState,
      lastSyncedAt: Date.now(),
      lastError: null,
      lastErrorCode: null
    };
    updateCollectionStat('transactions', { error: null, lastSyncedAt: Date.now() });
    return txnId;
  } catch (err) {
    // Queue pending upsert so automatic sync pushes it when online/ready
    queuePendingUpsert(uid, 'transactions', txnId, sanitizedPayload);

    // Also update local cached account balances for offline consistency
    const localAccs = getCached<Account[]>(accCacheKey, []);
    if (localAccs.length > 0) {
      const updatedAccs = localAccs.map((acc) => {
        let bal = Number(acc.balance) || 0;
        if (resolvedExisting && !resolvedExisting.disabled) {
          const oldAmt = Number(resolvedExisting.amount) || 0;
          if (resolvedExisting.type === 'EXPENSE' && resolvedExisting.fromAccountId === acc.id) bal += oldAmt;
          if (resolvedExisting.type === 'INCOME' && resolvedExisting.toAccountId === acc.id) bal -= oldAmt;
          if (resolvedExisting.type === 'TRANSFER') {
            if (resolvedExisting.fromAccountId === acc.id) bal += oldAmt;
            if (resolvedExisting.toAccountId === acc.id) bal -= oldAmt;
          }
        }
        if (!sanitizedPayload.disabled) {
          const newAmt = Number(sanitizedPayload.amount) || 0;
          if (sanitizedPayload.type === 'EXPENSE' && sanitizedPayload.fromAccountId === acc.id) bal -= newAmt;
          if (sanitizedPayload.type === 'INCOME' && sanitizedPayload.toAccountId === acc.id) bal += newAmt;
          if (sanitizedPayload.type === 'TRANSFER') {
            if (sanitizedPayload.fromAccountId === acc.id) bal -= newAmt;
            if (sanitizedPayload.toAccountId === acc.id) bal += newAmt;
          }
        }
        return { ...acc, balance: bal, updatedAt: Date.now() };
      });
      setCached(accCacheKey, updatedAccs);
    }

    reportFirestoreError(err, OperationType.WRITE, `users/${uid}/transactions/${txnId}`, 'transactions');
    return txnId;
  } finally {
    activeWriteOperations = Math.max(0, activeWriteOperations - 1);
    recomputeAndNotifySyncStatus();
  }
}

export async function deleteTransactionAtomic(txn: Transaction, user?: User | null): Promise<void> {
  const uid = resolveUserUid(user);
  const cacheKey = getUserCacheKey('transactions', user);

  const localTxns = getCached<Transaction[]>(cacheKey, []);
  setCached(cacheKey, localTxns.filter((x) => x.id !== txn.id));

  if (!uid) return;

  const txnRef = doc(db, 'users', uid, 'transactions', txn.id);
  activeWriteOperations++;
  recomputeAndNotifySyncStatus();

  try {
    await runTransaction(db, async (t) => {
      const amt = Number(txn.amount) || 0;

      if (!txn.disabled) {
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
      }

      t.delete(txnRef);
    });

    clearPendingDelete(uid, 'transactions', txn.id);
    removeKnownCloudId(uid, 'transactions', txn.id);
    syncStatusState = { ...syncStatusState, lastSyncedAt: Date.now() };
  } catch (err) {
    queuePendingDelete(uid, 'transactions', txn.id);
    reportFirestoreError(err, OperationType.DELETE, `users/${uid}/transactions/${txn.id}`, 'transactions');
  } finally {
    activeWriteOperations = Math.max(0, activeWriteOperations - 1);
    recomputeAndNotifySyncStatus();
  }
}

// ==========================================
// GENERIC SAFE COLLECTION UPSERT / DELETE HELPERS
// ==========================================

async function upsertDocWithAutoQueue<T extends { id: string }>(
  colKey: SyncedCollectionKey,
  cacheSuffix: string,
  payload: T,
  user?: User | null,
  sortOrPrepend: 'push' | 'unshift' | 'sort-date-desc' | 'sort-date-asc' = 'push'
): Promise<void> {
  const uid = resolveUserUid(user);
  const cacheKey = getUserCacheKey(cacheSuffix, user);
  const sanitized = stripUndefinedDeep(payload);

  const local = getCached<T[]>(cacheKey, []);
  const idx = local.findIndex((item) => item.id === sanitized.id);
  if (idx >= 0) {
    local[idx] = sanitized;
  } else if (sortOrPrepend === 'unshift') {
    local.unshift(sanitized);
  } else {
    local.push(sanitized);
  }

  if (sortOrPrepend === 'sort-date-desc') {
    local.sort((a: any, b: any) => String(b.date || b.startDate || '').localeCompare(String(a.date || a.startDate || '')));
  } else if (sortOrPrepend === 'sort-date-asc') {
    local.sort((a: any, b: any) => String(a.date || '').localeCompare(String(b.date || '')));
  }
  setCached(cacheKey, local);

  if (!uid) return;

  activeWriteOperations++;
  recomputeAndNotifySyncStatus();
  try {
    await setDoc(doc(db, 'users', uid, colKey, sanitized.id), sanitized, { merge: true });
    clearPendingUpsert(uid, colKey, sanitized.id);
    addKnownCloudId(uid, colKey, sanitized.id);
    syncStatusState = {
      ...syncStatusState,
      lastSyncedAt: Date.now(),
      lastError: null,
      lastErrorCode: null
    };
    updateCollectionStat(colKey, { error: null, lastSyncedAt: Date.now() });
  } catch (err) {
    queuePendingUpsert(uid, colKey, sanitized.id, sanitized);
    reportFirestoreError(err, OperationType.WRITE, `users/${uid}/${colKey}/${sanitized.id}`, colKey);
  } finally {
    activeWriteOperations = Math.max(0, activeWriteOperations - 1);
    recomputeAndNotifySyncStatus();
  }
}

async function deleteDocWithAutoQueue(
  colKey: SyncedCollectionKey,
  cacheSuffix: string,
  id: string,
  user?: User | null
): Promise<void> {
  const uid = resolveUserUid(user);
  const cacheKey = getUserCacheKey(cacheSuffix, user);
  const local = getCached<any[]>(cacheKey, []);
  setCached(cacheKey, local.filter((item) => item.id !== id));

  if (!uid) return;

  activeWriteOperations++;
  recomputeAndNotifySyncStatus();
  try {
    await deleteDoc(doc(db, 'users', uid, colKey, id));
    clearPendingDelete(uid, colKey, id);
    removeKnownCloudId(uid, colKey, id);
    syncStatusState = { ...syncStatusState, lastSyncedAt: Date.now() };
  } catch (err) {
    queuePendingDelete(uid, colKey, id);
    reportFirestoreError(err, OperationType.DELETE, `users/${uid}/${colKey}/${id}`, colKey);
  } finally {
    activeWriteOperations = Math.max(0, activeWriteOperations - 1);
    recomputeAndNotifySyncStatus();
  }
}

// ==========================================
// ACCOUNTS CRUD
// ==========================================

export async function saveAccount(acc: Omit<Account, 'id'> & { id?: string }, user?: User | null): Promise<string> {
  const uid = resolveUserUid(user);
  const id = acc.id || (uid ? doc(collection(db, 'users', uid, 'accounts')).id : 'acc-' + Date.now());
  const parsedOp = parseFiniteNumber(acc.openingBalance);
  const parsedBal = parseFiniteNumber(acc.balance) ?? 0;
  const resolvedOpening = parsedOp !== null ? parsedOp : parsedBal;
  const now = Date.now();
  const payload: Account = stripUndefinedDeep({
    ...acc,
    id,
    balance: parsedBal,
    openingBalance: resolvedOpening,
    openingBalanceUpdatedAt: acc.openingBalanceUpdatedAt || now,
    updatedAt: now
  });

  await upsertDocWithAutoQueue('accounts', 'accounts', payload, user, 'push');
  return id;
}

export async function deleteAccount(id: string, user?: User | null): Promise<void> {
  await deleteDocWithAutoQueue('accounts', 'accounts', id, user);
}

// ==========================================
// VEHICLES CRUD
// ==========================================

export async function saveVehicle(veh: Omit<Vehicle, 'id'> & { id?: string }, user?: User | null): Promise<string> {
  const uid = resolveUserUid(user);
  const id = veh.id || (uid ? doc(collection(db, 'users', uid, 'vehicles')).id : 'veh-' + Date.now());
  const payload: Vehicle = stripUndefinedDeep({
    ...veh,
    id,
    currentOdometer: Number(veh.currentOdometer) || 0
  });

  await upsertDocWithAutoQueue('vehicles', 'vehicles', payload, user, 'push');
  return id;
}

export async function deleteVehicle(id: string, user?: User | null): Promise<void> {
  await deleteDocWithAutoQueue('vehicles', 'vehicles', id, user);
}

export async function saveVehicleLog(log: Omit<VehicleLog, 'id'> & { id?: string }, user?: User | null): Promise<string> {
  const uid = resolveUserUid(user);
  const cacheKey = getUserCacheKey('vehicle_logs', user);
  const id = log.id || (uid ? doc(collection(db, 'users', uid, 'vehicle_logs')).id : 'log-' + Date.now());
  const payload: VehicleLog = stripUndefinedDeep({
    ...log,
    id,
    timestamp: log.timestamp || Date.now(),
    cost: Number(log.cost) || 0,
    odometer: Number(log.odometer) || 0
  });

  const local = getCached<VehicleLog[]>(cacheKey, []);
  const idx = local.findIndex((l) => l.id === id);
  if (idx >= 0) local[idx] = payload;
  else local.unshift(payload);
  setCached(cacheKey, local);

  if (!uid) return id;

  activeWriteOperations++;
  recomputeAndNotifySyncStatus();
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
    clearPendingUpsert(uid, 'vehicle_logs', id);
    addKnownCloudId(uid, 'vehicle_logs', id);
    syncStatusState = { ...syncStatusState, lastSyncedAt: Date.now() };
    updateCollectionStat('vehicle_logs', { error: null, lastSyncedAt: Date.now() });
  } catch (err) {
    queuePendingUpsert(uid, 'vehicle_logs', id, payload);
    reportFirestoreError(err, OperationType.WRITE, `users/${uid}/vehicle_logs/${id}`, 'vehicle_logs');
  } finally {
    activeWriteOperations = Math.max(0, activeWriteOperations - 1);
    recomputeAndNotifySyncStatus();
  }

  return id;
}

export async function deleteVehicleLog(id: string, user?: User | null): Promise<void> {
  await deleteDocWithAutoQueue('vehicle_logs', 'vehicle_logs', id, user);
}

// ==========================================
// TODOS CRUD
// ==========================================

export async function saveTodoNote(note: Omit<TodoNote, 'id'> & { id?: string }, user?: User | null): Promise<string> {
  const uid = resolveUserUid(user);
  const id = note.id || (uid ? doc(collection(db, 'users', uid, 'todos')).id : 'todo-' + Date.now());
  const payload: TodoNote = stripUndefinedDeep({
    ...note,
    id,
    createdAt: note.createdAt || Date.now(),
    updatedAt: Date.now()
  });

  await upsertDocWithAutoQueue('todos', 'todos', payload, user, 'unshift');
  return id;
}

export async function deleteTodoNote(id: string, user?: User | null): Promise<void> {
  await deleteDocWithAutoQueue('todos', 'todos', id, user);
}

export const saveTodo = saveTodoNote;
export const deleteTodo = deleteTodoNote;

// ==========================================
// RECEIVABLES / PAYABLES CRUD
// ==========================================

export async function saveEntity(entity: Omit<Entity, 'id'> & { id?: string }, user?: User | null): Promise<string> {
  const uid = resolveUserUid(user);
  const id = entity.id || (uid ? doc(collection(db, 'users', uid, 'receivables_payables')).id : 'ent-' + Date.now());
  const payload: Entity = stripUndefinedDeep({
    ...entity,
    id,
    amount: Number(entity.amount) || 0
  });

  await upsertDocWithAutoQueue('receivables_payables', 'entities', payload, user, 'push');
  return id;
}

export async function deleteEntity(id: string, user?: User | null): Promise<void> {
  await deleteDocWithAutoQueue('receivables_payables', 'entities', id, user);
}

// ==========================================
// EXERCISE LOGS CRUD
// ==========================================

export async function saveExerciseLog(log: Omit<ExerciseLog, 'id'> & { id?: string }, user?: User | null): Promise<string> {
  const uid = resolveUserUid(user);
  const id = log.id || (uid ? doc(collection(db, 'users', uid, 'exercise_logs')).id : 'ex-' + Date.now());
  const payload: ExerciseLog = stripUndefinedDeep({
    ...log,
    id,
    createdAt: log.createdAt || Date.now(),
    updatedAt: Date.now()
  });

  await upsertDocWithAutoQueue('exercise_logs', 'exercise_logs', payload, user, 'sort-date-desc');
  return id;
}

export async function deleteExerciseLog(id: string, user?: User | null): Promise<void> {
  await deleteDocWithAutoQueue('exercise_logs', 'exercise_logs', id, user);
}

// ==========================================
// CALENDAR EVENTS CRUD
// ==========================================

export async function saveCalendarEvent(event: Omit<CalendarEvent, 'id'> & { id?: string }, user?: User | null): Promise<string> {
  const uid = resolveUserUid(user);
  const id = event.id || (uid ? doc(collection(db, 'users', uid, 'calendar_events')).id : 'cal-' + Date.now());
  const payload: CalendarEvent = stripUndefinedDeep({
    ...event,
    id,
    createdAt: event.createdAt || Date.now(),
    updatedAt: Date.now()
  });

  await upsertDocWithAutoQueue('calendar_events', 'calendar_events', payload, user, 'sort-date-asc');
  return id;
}

export async function deleteCalendarEvent(id: string, user?: User | null): Promise<void> {
  await deleteDocWithAutoQueue('calendar_events', 'calendar_events', id, user);
}

// ==========================================
// MENSTRUAL TRACKER CRUD
// ==========================================

export async function saveMenstrualLog(log: Omit<MenstrualLog, 'id'> & { id?: string }, user?: User | null): Promise<string> {
  const uid = resolveUserUid(user);
  const id = log.id || (uid ? doc(collection(db, 'users', uid, 'menstrual_logs')).id : 'mlog-' + Date.now());
  const payload: MenstrualLog = stripUndefinedDeep({
    ...log,
    id,
    createdAt: log.createdAt || Date.now(),
    updatedAt: Date.now()
  });

  await upsertDocWithAutoQueue('menstrual_logs', 'menstrual_logs', payload, user, 'sort-date-desc');
  return id;
}

export async function deleteMenstrualLog(id: string, user?: User | null): Promise<void> {
  await deleteDocWithAutoQueue('menstrual_logs', 'menstrual_logs', id, user);
}

export async function saveMenstrualPeriod(period: Omit<MenstrualPeriodRecord, 'id'> & { id?: string }, user?: User | null): Promise<string> {
  const uid = resolveUserUid(user);
  const id = period.id || (uid ? doc(collection(db, 'users', uid, 'menstrual_periods')).id : 'period-' + Date.now());
  const payload: MenstrualPeriodRecord = stripUndefinedDeep({
    ...period,
    id
  });

  await upsertDocWithAutoQueue('menstrual_periods', 'menstrual_periods', payload, user, 'sort-date-desc');
  return id;
}

export async function deleteMenstrualPeriod(id: string, user?: User | null): Promise<void> {
  await deleteDocWithAutoQueue('menstrual_periods', 'menstrual_periods', id, user);
}

export async function saveMenstrualSettings(settings: MenstrualCycleSettings, user?: User | null): Promise<void> {
  const uid = resolveUserUid(user);
  const cacheKey = getUserCacheKey('menstrual_settings', user);
  const sanitized = stripUndefinedDeep(settings);
  setCached(cacheKey, sanitized);

  if (!uid) return;

  activeWriteOperations++;
  recomputeAndNotifySyncStatus();
  try {
    await setDoc(doc(db, 'users', uid, 'settings', 'menstrual'), sanitized, { merge: true });
    clearPendingUpsert(uid, 'settings', 'menstrual');
    syncStatusState = { ...syncStatusState, lastSyncedAt: Date.now() };
    updateCollectionStat('settings', { cloudCount: 1, error: null, lastSyncedAt: Date.now() });
  } catch (err) {
    queuePendingUpsert(uid, 'settings', 'menstrual', sanitized);
    reportFirestoreError(err, OperationType.WRITE, `users/${uid}/settings/menstrual`, 'settings');
  } finally {
    activeWriteOperations = Math.max(0, activeWriteOperations - 1);
    recomputeAndNotifySyncStatus();
  }
}

export async function saveRecurringTransaction(
  item: Omit<RecurringTransaction, 'id'> & { id?: string },
  user?: User | null
): Promise<string> {
  const uid = resolveUserUid(user);
  const id =
    item.id ||
    (uid ? doc(collection(db, 'users', uid, 'recurring_transactions')).id : `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  const payload: RecurringTransaction = stripUndefinedDeep({
    ...item,
    id,
    amount: Number(item.amount) || 0,
    interval: Math.max(1, item.interval || 1),
    isActive: item.isActive !== false,
    autoPost: item.autoPost !== false,
    createdAt: item.createdAt || Date.now(),
    updatedAt: Date.now()
  });

  await upsertDocWithAutoQueue('recurring_transactions', 'recurring_transactions', payload, user, 'push');
  return id;
}

export async function deleteRecurringTransaction(id: string, user?: User | null): Promise<void> {
  await deleteDocWithAutoQueue('recurring_transactions', 'recurring_transactions', id, user);
}

// ==========================================
// REAL-TIME FIRESTORE LISTENERS (USER SCOPED + METADATA AWARE)
// ==========================================

function subscribeToUserCollection<T extends { id: string }>(
  user: User | null,
  colKey: SyncedCollectionKey,
  cacheSuffix: string,
  buildQuery: (uid: string) => Query,
  onUpdate: (items: T[]) => void,
  sortItems?: (a: T, b: T) => number
): () => void {
  const normalizeItem = (item: any): T =>
    (colKey === 'accounts' ? normalizeAccountRecord(item) : item) as T;

  const sortList = (list: T[]): T[] => (sortItems ? [...list].sort(sortItems) : list);

  const cacheKey = getUserCacheKey(cacheSuffix, user);
  const cached = sortList(getCached<T[]>(cacheKey, []).map(normalizeItem));
  if (cached.length > 0) onUpdate(cached);

  const uid = resolveUserUid(user);
  if (!uid) {
    onUpdate(cached);
    return () => {};
  }

  activeFirestoreListeners.add(colKey);
  activeCollectionSubscribers.set(colKey, {
    onUpdate: onUpdate as (items: any[]) => void,
    sort: sortItems as ((a: any, b: any) => number) | undefined
  });
  updateCollectionStat(colKey, { status: 'syncing', localCount: cached.length });
  recomputeAndNotifySyncStatus();

  const q = buildQuery(uid);
  const unsub = onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      const fromCache = snapshot.metadata.fromCache;
      const hasPendingWrites = snapshot.metadata.hasPendingWrites;
      const pendingStore = getPendingSyncStore(uid);
      const pendingDeletes = new Set(pendingStore.deletes[colKey] || []);
      const pendingUpserts = pendingStore.upserts[colKey] || {};

      const latestCached = sortList(getCached<T[]>(cacheKey, []).map(normalizeItem));

      // Protect local-only records from being wiped by an empty cached/initial snapshot before autoSync finishes
      if (snapshot.docs.length === 0 && latestCached.length > 0 && (fromCache || !autoSyncCompletedByUid.has(uid))) {
        updateCollectionStat(colKey, {
          fromCache: true,
          hasPendingWrites: true,
          status: 'pending'
        });
        onUpdate(latestCached);
        recomputeAndNotifySyncStatus();
        return;
      }

      const mergedMap = new Map<string, T>();
      for (const d of snapshot.docs) {
        if (!pendingDeletes.has(d.id)) {
          mergedMap.set(d.id, normalizeItem({ ...d.data(), id: d.id }));
        }
      }
      for (const [id, pendingItem] of Object.entries(pendingUpserts)) {
        if (!pendingDeletes.has(id)) {
          mergedMap.set(id, normalizeItem({ ...pendingItem, id }));
        }
      }

      const data = sortList(Array.from(mergedMap.values()));
      setCached(cacheKey, data);

      if (!fromCache) {
        setKnownCloudIdsForCollection(
          uid,
          colKey,
          snapshot.docs.map((d) => d.id)
        );
        syncStatusState = {
          ...syncStatusState,
          serverReachable: true,
          lastSyncedAt: Date.now()
        };
      }

      updateCollectionStat(colKey, {
        cloudCount: fromCache ? syncStatusState.collections[colKey].cloudCount : snapshot.docs.length,
        localCount: data.length,
        fromCache,
        hasPendingWrites,
        status: hasPendingWrites ? 'pending' : fromCache ? 'cached' : 'synced',
        lastSyncedAt: !fromCache ? Date.now() : syncStatusState.collections[colKey].lastSyncedAt,
        error: null
      });

      onUpdate(data);
      recomputeAndNotifySyncStatus();
    },
    (err) => {
      reportFirestoreError(err, OperationType.LIST, `users/${uid}/${colKey}`, colKey);
      onUpdate(sortList(getCached<T[]>(cacheKey, []).map(normalizeItem)));
    }
  );

  return () => {
    activeFirestoreListeners.delete(colKey);
    activeCollectionSubscribers.delete(colKey);
    unsub();
    recomputeAndNotifySyncStatus();
  };
}

export function subscribeToAccounts(user: User | null, onUpdate: (accounts: Account[]) => void) {
  return subscribeToUserCollection<Account>(
    user,
    'accounts',
    'accounts',
    (uid) => query(collection(db, 'users', uid, 'accounts')),
    onUpdate,
    (a, b) => (a.name || '').localeCompare(b.name || '')
  );
}

export function subscribeToTransactions(user: User | null, onUpdate: (txns: Transaction[]) => void) {
  return subscribeToUserCollection<Transaction>(
    user,
    'transactions',
    'transactions',
    (uid) => query(collection(db, 'users', uid, 'transactions')),
    onUpdate,
    (a, b) => {
      const dateCmp = (b.date || '').localeCompare(a.date || '');
      if (dateCmp !== 0) return dateCmp;
      const timeCmp = (b.time || '00:00').localeCompare(a.time || '00:00');
      if (timeCmp !== 0) return timeCmp;
      return (b.timestamp || 0) - (a.timestamp || 0);
    }
  );
}

export function subscribeToVehicles(user: User | null, onUpdate: (vehicles: Vehicle[]) => void) {
  return subscribeToUserCollection<Vehicle>(
    user,
    'vehicles',
    'vehicles',
    (uid) => query(collection(db, 'users', uid, 'vehicles')),
    onUpdate,
    (a, b) => (a.name || '').localeCompare(b.name || '')
  );
}

export function subscribeToVehicleLogs(user: User | null, onUpdate: (logs: VehicleLog[]) => void) {
  return subscribeToUserCollection<VehicleLog>(
    user,
    'vehicle_logs',
    'vehicle_logs',
    (uid) => query(collection(db, 'users', uid, 'vehicle_logs')),
    onUpdate,
    (a, b) => (b.date || '').localeCompare(a.date || '')
  );
}

export function subscribeToTodos(user: User | null, onUpdate: (todos: TodoNote[]) => void) {
  return subscribeToUserCollection<TodoNote>(
    user,
    'todos',
    'todos',
    (uid) => query(collection(db, 'users', uid, 'todos')),
    onUpdate,
    (a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0)
  );
}

export function subscribeToEntities(user: User | null, onUpdate: (entities: Entity[]) => void) {
  return subscribeToUserCollection<Entity>(
    user,
    'receivables_payables',
    'entities',
    (uid) => query(collection(db, 'users', uid, 'receivables_payables')),
    onUpdate,
    (a, b) => (a.name || '').localeCompare(b.name || '')
  );
}

export function subscribeToExerciseLogs(user: User | null, onUpdate: (logs: ExerciseLog[]) => void) {
  return subscribeToUserCollection<ExerciseLog>(
    user,
    'exercise_logs',
    'exercise_logs',
    (uid) => query(collection(db, 'users', uid, 'exercise_logs')),
    onUpdate,
    (a, b) => (b.date || '').localeCompare(a.date || '')
  );
}

export function subscribeToCalendarEvents(user: User | null, onUpdate: (events: CalendarEvent[]) => void) {
  return subscribeToUserCollection<CalendarEvent>(
    user,
    'calendar_events',
    'calendar_events',
    (uid) => query(collection(db, 'users', uid, 'calendar_events')),
    onUpdate,
    (a, b) => (a.date || '').localeCompare(b.date || '')
  );
}

export function subscribeToMenstrualLogs(user: User | null, onUpdate: (logs: MenstrualLog[]) => void) {
  return subscribeToUserCollection<MenstrualLog>(
    user,
    'menstrual_logs',
    'menstrual_logs',
    (uid) => query(collection(db, 'users', uid, 'menstrual_logs')),
    onUpdate,
    (a, b) => (b.date || '').localeCompare(a.date || '')
  );
}

export function subscribeToMenstrualPeriods(user: User | null, onUpdate: (periods: MenstrualPeriodRecord[]) => void) {
  return subscribeToUserCollection<MenstrualPeriodRecord>(
    user,
    'menstrual_periods',
    'menstrual_periods',
    (uid) => query(collection(db, 'users', uid, 'menstrual_periods')),
    onUpdate,
    (a, b) => (b.startDate || '').localeCompare(a.startDate || '')
  );
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

  activeFirestoreListeners.add('settings');
  updateCollectionStat('settings', { status: 'syncing' });
  recomputeAndNotifySyncStatus();

  const docRef = doc(db, 'users', uid, 'settings', 'menstrual');
  const unsub = onSnapshot(
    docRef,
    { includeMetadataChanges: true },
    (snapshot) => {
      const fromCache = snapshot.metadata.fromCache;
      const hasPendingWrites = snapshot.metadata.hasPendingWrites;
      if (snapshot.exists()) {
        const data = snapshot.data() as MenstrualCycleSettings;
        setCached(cacheKey, data);
        onUpdate(data);
      }
      updateCollectionStat('settings', {
        cloudCount: fromCache ? syncStatusState.collections.settings.cloudCount : snapshot.exists() ? 1 : 0,
        localCount: 1,
        fromCache,
        hasPendingWrites,
        status: hasPendingWrites ? 'pending' : fromCache ? 'cached' : 'synced',
        lastSyncedAt: !fromCache ? Date.now() : syncStatusState.collections.settings.lastSyncedAt,
        error: null
      });
      recomputeAndNotifySyncStatus();
    },
    (err) => {
      reportFirestoreError(err, OperationType.GET, `users/${uid}/settings/menstrual`, 'settings');
    }
  );

  return () => {
    activeFirestoreListeners.delete('settings');
    unsub();
    recomputeAndNotifySyncStatus();
  };
}

export function subscribeToRecurringTransactions(user: User | null, onUpdate: (items: RecurringTransaction[]) => void) {
  return subscribeToUserCollection<RecurringTransaction>(
    user,
    'recurring_transactions',
    'recurring_transactions',
    (uid) => query(collection(db, 'users', uid, 'recurring_transactions')),
    onUpdate,
    (a, b) => (a.nextDueDate || '').localeCompare(b.nextDueDate || '')
  );
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
      if (
        key &&
        (key.startsWith(LS_PREFIX) || key.startsWith(PENDING_PREFIX) || key.startsWith(KNOWN_IDS_PREFIX))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    recomputeAndNotifySyncStatus();
    if (reload) {
      window.location.reload();
    }
  } catch (e) {
    console.error('Error clearing cache:', e);
  }
}
