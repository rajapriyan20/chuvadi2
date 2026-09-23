import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc,
  writeBatch
} from 'firebase/firestore';
import appletConfig from '../../firebase-applet-config.json';

// Source Firebase configuration (current Firestore database)
export const SOURCE_FIREBASE_CONFIG = {
  apiKey: "AIzaSyB75TCDYTXViVv8b8JUy0ioZO_-e-CONFA",
  authDomain: "chuvadi-d5fc1.firebaseapp.com",
  projectId: "chuvadi-d5fc1",
  storageBucket: "chuvadi-d5fc1.firebasestorage.app",
  messagingSenderId: "673744947945",
  appId: "1:673744947945:web:f38fb01b77bf34c55a7e78"
};

// Target Firebase configuration (where Auth & Gmail are configured)
export const TARGET_FIREBASE_CONFIG = {
  apiKey: appletConfig.apiKey,
  authDomain: appletConfig.authDomain,
  projectId: appletConfig.projectId, // gen-lang-client-0292204589
  storageBucket: appletConfig.storageBucket,
  messagingSenderId: appletConfig.messagingSenderId,
  appId: appletConfig.appId
};

// List of all Firestore collections in Chuvadi
export const CHUVADI_COLLECTIONS = [
  'accounts',
  'transactions',
  'vehicles',
  'vehicle_logs',
  'todos',
  'receivables_payables',
  'exercise_logs'
];

export interface MigrationProgress {
  currentCollection: string;
  processedDocs: number;
  totalDocsInCollection: number;
  completedCollections: string[];
  status: 'IDLE' | 'IN_PROGRESS' | 'SUCCESS' | 'ERROR';
  errorMessage?: string;
  summary?: Record<string, number>;
}

/**
 * Execute automated direct migration from source Firestore (chuvadi-d5fc1)
 * to target Firestore (gen-lang-client-0292204589).
 */
export async function executeDirectMigration(
  onProgress?: (progress: MigrationProgress) => void
): Promise<{ success: boolean; summary: Record<string, number>; error?: string }> {
  const summary: Record<string, number> = {};

  try {
    // 1. Initialize Source Instance
    const existingSource = getApps().find(a => a.name === 'migrationSource');
    const sourceApp = existingSource || initializeApp(SOURCE_FIREBASE_CONFIG, 'migrationSource');
    const sourceDb = getFirestore(sourceApp);

    // 2. Initialize Target Instance
    const existingTarget = getApps().find(a => a.name === 'migrationTarget');
    const targetApp = existingTarget || initializeApp(TARGET_FIREBASE_CONFIG, 'migrationTarget');
    const targetDb = getFirestore(targetApp);

    const completed: string[] = [];

    for (const colName of CHUVADI_COLLECTIONS) {
      if (onProgress) {
        onProgress({
          currentCollection: colName,
          processedDocs: 0,
          totalDocsInCollection: 0,
          completedCollections: completed,
          status: 'IN_PROGRESS'
        });
      }

      const sourceColRef = collection(sourceDb, colName);
      const snapshot = await getDocs(sourceColRef);
      const totalDocs = snapshot.docs.length;
      summary[colName] = totalDocs;

      if (totalDocs === 0) {
        completed.push(colName);
        continue;
      }

      // Write in batches of up to 400 (Firestore max is 500)
      const batchSize = 400;
      for (let i = 0; i < snapshot.docs.length; i += batchSize) {
        const batch = writeBatch(targetDb);
        const chunk = snapshot.docs.slice(i, i + batchSize);

        for (const docSnap of chunk) {
          const targetDocRef = doc(targetDb, colName, docSnap.id);
          batch.set(targetDocRef, docSnap.data());
        }

        await batch.commit();

        if (onProgress) {
          onProgress({
            currentCollection: colName,
            processedDocs: Math.min(i + batchSize, totalDocs),
            totalDocsInCollection: totalDocs,
            completedCollections: completed,
            status: 'IN_PROGRESS'
          });
        }
      }

      completed.push(colName);
    }

    if (onProgress) {
      onProgress({
        currentCollection: 'Done',
        processedDocs: 0,
        totalDocsInCollection: 0,
        completedCollections: completed,
        status: 'SUCCESS',
        summary
      });
    }

    return { success: true, summary };
  } catch (err: any) {
    console.error('Migration error:', err);
    if (onProgress) {
      onProgress({
        currentCollection: '',
        processedDocs: 0,
        totalDocsInCollection: 0,
        completedCollections: [],
        status: 'ERROR',
        errorMessage: err?.message || 'Migration failed.'
      });
    }
    return { success: false, summary, error: err?.message || 'Failed to migrate collections.' };
  }
}
