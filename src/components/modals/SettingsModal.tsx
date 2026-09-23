import React, { useState } from 'react';
import { 
  X, 
  Database, 
  Sparkles, 
  RefreshCw, 
  Trash2, 
  ArrowRightLeft, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Check
} from 'lucide-react';
import { ChuvadiLogo } from '../ChuvadiLogo';
import { 
  executeDirectMigration, 
  MigrationProgress, 
  CHUVADI_COLLECTIONS 
} from '../../services/migrateProjects';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSeedData: () => Promise<void>;
  onClearCache: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSeedData,
  onClearCache
}) => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress | null>(null);

  if (!isOpen) return null;

  const handleStartMigration = async () => {
    if (!window.confirm(
      'Start live migration of all collections from "chuvadi-d5fc1" into "gen-lang-client-0292204589"?\n\nExisting documents in chuvadi-d5fc1 will NOT be deleted.'
    )) {
      return;
    }

    setIsMigrating(true);
    setMigrationProgress({
      currentCollection: 'Connecting...',
      processedDocs: 0,
      totalDocsInCollection: 0,
      completedCollections: [],
      status: 'IN_PROGRESS'
    });

    const result = await executeDirectMigration((p) => {
      setMigrationProgress(p);
    });

    setIsMigrating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121820] w-full max-w-lg rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#161d26]">
          <div className="text-amber-300 font-bold text-base">Chuvadi Settings & Database</div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Logo & Version Badge */}
          <div className="flex items-center gap-3 p-3.5 bg-[#161c24] rounded-2xl border border-slate-800">
            <ChuvadiLogo size={44} />
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Chuvadi Life OS</span>
                <span className="px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                  v2.0.0
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Modular React 19 • Atomic Firestore • Server-side Gemini AI
              </div>
            </div>
          </div>

          {/* Migration Panel: chuvadi-d5fc1 -> gen-lang-client-0292204589 */}
          <div className="p-4 bg-[#141b24] rounded-2xl border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <ArrowRightLeft size={16} />
                <span>One-Click Firestore Project Migration</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-mono border border-amber-500/20">
                Method 3
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Copy all Firestore collections from <strong className="text-white">chuvadi-d5fc1</strong> (Source) directly into <strong className="text-white">gen-lang-client-0292204589</strong> (Target, where Auth & Gmail are hosted).
            </p>

            <div className="text-[11px] text-slate-400 bg-[#0a0e14] p-3 rounded-xl border border-slate-800 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Source:</span> <span className="text-amber-400">chuvadi-d5fc1</span>
              </div>
              <div className="flex justify-between">
                <span>Target:</span> <span className="text-emerald-400">gen-lang-client-0292204589</span>
              </div>
              <div className="pt-1 text-[10px] text-slate-500 font-sans">
                Collections: accounts, transactions, vehicles, vehicle_logs, todos, receivables_payables, exercise_logs
              </div>
            </div>

            {/* Migration progress or button */}
            {migrationProgress && (
              <div className="p-3 bg-[#0d131a] rounded-xl border border-slate-800 space-y-2 text-xs">
                {migrationProgress.status === 'IN_PROGRESS' && (
                  <div className="flex items-center gap-2 text-amber-300 font-semibold">
                    <Loader2 size={15} className="animate-spin text-amber-400" />
                    <span>Migrating collection: {migrationProgress.currentCollection}...</span>
                  </div>
                )}

                {migrationProgress.status === 'SUCCESS' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <CheckCircle2 size={16} />
                      <span>Migration Complete! All collections copied successfully.</span>
                    </div>
                    {migrationProgress.summary && (
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-slate-300 bg-[#121820] p-2 rounded-lg border border-slate-800">
                        {Object.entries(migrationProgress.summary).map(([col, count]) => (
                          <div key={col} className="flex justify-between">
                            <span className="text-slate-400">{col}:</span>
                            <span className="text-emerald-400 font-bold">{count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-[11px] text-slate-300">
                      You can now unify the app configuration to use <code className="text-emerald-300">gen-lang-client-0292204589</code> as your single project!
                    </p>
                  </div>
                )}

                {migrationProgress.status === 'ERROR' && (
                  <div className="flex items-start gap-2 text-rose-300">
                    <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Migration Failed</div>
                      <div className="text-[11px] text-rose-300/80">{migrationProgress.errorMessage}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleStartMigration}
              disabled={isMigrating}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
            >
              {isMigrating ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Migrating Collections Live...</span>
                </>
              ) : (
                <>
                  <ArrowRightLeft size={15} />
                  <span>Execute Direct Live Migration</span>
                </>
              )}
            </button>
          </div>

          {/* Cloud Database Info */}
          <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Database size={15} className="text-amber-400" />
              <span>Current Cloud Database</span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1">
              <div>Source Database: <code className="text-amber-300 font-mono">chuvadi-d5fc1</code></div>
              <div>Auth & Gmail Project: <code className="text-sky-300 font-mono">gen-lang-client-0292204589</code></div>
            </div>
          </div>

          {/* Gemini AI Status */}
          <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Sparkles size={15} className="text-emerald-400" />
              <span>Gemini 3.8 Intelligence</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Server-side voice expense logging, receipt OCR scanning, and personalized financial insights via <code className="text-emerald-300 font-mono">gemini-3.8-flash</code>.
            </p>
          </div>

          {/* Data Maintenance Actions */}
          <div className="space-y-2 pt-1">
            <button
              onClick={async () => {
                if (window.confirm('Populate starter accounts, vehicles, and sample checklists?')) {
                  await onSeedData();
                  onClose();
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition"
            >
              <RefreshCw size={14} />
              <span>Populate Starter / Demo Data</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Clear cached local state? Cloud data in Firestore will not be affected.')) {
                  onClearCache();
                  onClose();
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition"
            >
              <Trash2 size={14} />
              <span>Reset Local Offline Storage Cache</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
