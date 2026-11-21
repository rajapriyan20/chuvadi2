import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  Sparkles, 
  RefreshCw, 
  Trash2, 
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  Download,
  LogIn,
  ArrowLeft,
  Eye,
  Check,
  Palette,
  LayoutGrid,
  EyeOff,
  Bell,
  Sliders,
  AlertTriangle,
  ChevronRight,
  Cloud,
  CloudOff,
  Activity
} from 'lucide-react';
import { ChuvadiLogo } from '../ChuvadiLogo';
import { InstallAppModal } from './InstallAppModal';
import { useTheme } from '../../context/ThemeContext';
import appletConfig from '../../../firebase-applet-config.json';
import { getStoredSettlementTolerance, saveStoredSettlementTolerance } from '../../utils/settlement';
import type { ActiveTab, TabVisibilityMap, CloudSyncStatus, CollectionSyncStat } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPage?: 'main' | 'cloud-sync';
  syncStatus?: CloudSyncStatus;
  onSeedData: () => Promise<void>;
  onClearCache: () => void;
  onClearUserData?: () => Promise<void>;
  user?: any;
  isGuestMode?: boolean;
  onLogin?: () => void;
  onExitGuestMode?: () => void;
  tabVisibility?: TabVisibilityMap;
  onToggleTabVisibility?: (tabId: ActiveTab) => void;
  onOpenNotificationSettings?: () => void;
}

const ALL_TABS_CONFIG: Array<{ id: ActiveTab; label: string; desc: string }> = [
  { id: 'dashboard', label: 'Dashboard', desc: 'Net balance & account overview' },
  { id: 'finance', label: 'Finance & Passbook', desc: 'Ledger, bank accounts & transactions' },
  { id: 'garage', label: 'Garage & Vehicles', desc: 'Fuel logs, maintenance, insurance & PUC' },
  { id: 'todos', label: 'Checklists & Reminders', desc: 'Notes, task lists & to-dos' },
  { id: 'calendar', label: 'Calendar & Birthdays', desc: 'Life events, birthdays & anniversaries' },
  { id: 'exercise', label: 'Exercise & Body Profile', desc: 'Workouts & monthly body metrics' },
  { id: 'menstrual', label: 'Wellness Tracker', desc: 'Cycle, symptoms & health logging' },
  { id: 'ai', label: 'Chuvadi AI Advisor', desc: 'Intelligence hub, receipt OCR & voice' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialPage = 'main',
  syncStatus,
  onSeedData,
  onClearCache,
  onClearUserData,
  user,
  isGuestMode = false,
  onLogin,
  onExitGuestMode,
  tabVisibility = {
    dashboard: true,
    finance: true,
    garage: true,
    todos: true,
    calendar: true,
    exercise: true,
    menstrual: true,
    reports: true,
    ai: true,
  },
  onToggleTabVisibility = () => {},
  onOpenNotificationSettings
}) => {
  const { theme, setTheme, themes, currentThemeConfig } = useTheme();
  const [activePage, setActivePage] = useState<'main' | 'cloud-sync'>(initialPage);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [cacheReset, setCacheReset] = useState(false);
  const [clearingUser, setClearingUser] = useState(false);
  const [clearedSuccess, setClearedSuccess] = useState(false);
  const [toleranceInput, setToleranceInput] = useState<string>(() => String(getStoredSettlementTolerance()));
  const [toleranceSaved, setToleranceSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActivePage(initialPage);
    }
  }, [isOpen, initialPage]);

  if (!isOpen) return null;

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await onSeedData();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearUser = async () => {
    if (!onClearUserData) return;
    if (confirm('Clear all your records to start with a completely blank workspace?')) {
      setClearingUser(true);
      try {
        await onClearUserData();
        setClearedSuccess(true);
        setTimeout(() => setClearedSuccess(false), 3000);
      } finally {
        setClearingUser(false);
      }
    }
  };

  const handleResetCache = () => {
    onClearCache();
    setCacheReset(true);
    setTimeout(() => setCacheReset(false), 3000);
  };

  const collectionStatsList: CollectionSyncStat[] = syncStatus
    ? (Object.values(syncStatus.collections) as CollectionSyncStat[])
    : [];
  const totalCloudDocs = collectionStatsList.reduce((sum, c) => sum + (c.cloudCount ?? 0), 0);
  const totalLocalDocs = collectionStatsList.reduce((sum, c) => sum + (c.localCount ?? 0), 0);
  const anyCloudFetched = collectionStatsList.some((c) => c.cloudCount !== null);

  const formatSyncTime = (ts: number | null | undefined) => {
    if (!ts) return 'Not yet synced';
    try {
      return new Date(ts).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  const getPhaseBadge = () => {
    const phase = syncStatus?.phase || 'connecting';
    switch (phase) {
      case 'synced':
        return {
          label: 'Cloud Synced',
          desc: 'All collections are verified and synchronized with Cloud Firestore.',
          badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          borderClass: 'border-emerald-500/30',
          icon: <CheckCircle2 size={14} className="text-emerald-400" />
        };
      case 'syncing':
      case 'connecting':
        return {
          label: 'Syncing Automatically',
          desc: 'Reconciling local changes and listening to Cloud Firestore updates.',
          badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
          borderClass: 'border-sky-500/30',
          icon: <RefreshCw size={14} className="text-sky-400 animate-spin" />
        };
      case 'pending':
        return {
          label: `Pending (${syncStatus?.pendingCount || 0})`,
          desc: 'Local records are queued and will automatically push to Cloud Firestore.',
          badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          borderClass: 'border-amber-500/30',
          icon: <RefreshCw size={14} className="text-amber-400" />
        };
      case 'offline':
        return {
          label: 'Offline (Local Cache)',
          desc: 'Firestore server is unreachable. Changes stay queued locally and auto-sync when online.',
          badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          borderClass: 'border-rose-500/30',
          icon: <CloudOff size={14} className="text-rose-400" />
        };
      case 'error':
        return {
          label: 'Sync Error',
          desc: 'Cloud Firestore rejected one or more operations. See diagnostic details below.',
          badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          borderClass: 'border-rose-500/40',
          icon: <AlertTriangle size={14} className="text-rose-400" />
        };
      default:
        return {
          label: 'Not Signed In',
          desc: 'Sign in with Google to synchronize data with Cloud Firestore.',
          badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
          borderClass: 'border-slate-800',
          icon: <Cloud size={14} className="text-slate-400" />
        };
    }
  };

  const phaseMeta = getPhaseBadge();

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
        <div className="bg-[#121820] w-full max-w-md rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#161d26]">
            {activePage === 'cloud-sync' ? (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setActivePage('main')}
                  className="p-1.5 -ml-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Back to Settings"
                >
                  <ArrowLeft size={16} />
                </button>
                <div className="text-amber-300 font-bold text-base">Cloud Sync Status & Stats</div>
              </div>
            ) : (
              <div className="text-amber-300 font-bold text-base">Chuvadi Settings & App</div>
            )}
            <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white cursor-pointer">
              <X size={18} />
            </button>
          </div>

          {activePage === 'cloud-sync' ? (
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Live Sync Health Banner */}
              <div className={`p-4 bg-[#141b24] rounded-2xl border ${phaseMeta.borderClass} space-y-2.5`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Cloud size={16} className="text-amber-400" />
                    <span>Real-Time Cloud Status</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${phaseMeta.badgeClass}`}>
                    {phaseMeta.icon}
                    <span>{phaseMeta.label}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{phaseMeta.desc}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>Sync Mode:</span>
                  <span className="text-emerald-300 font-semibold">Automatic (Live & Auto-Retry)</span>
                </div>
              </div>

              {/* Error Diagnostics Alert (if any error occurred) */}
              {syncStatus?.lastError && (
                <div className="p-3.5 bg-rose-950/35 border border-rose-500/40 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>Firestore Error Detected ({syncStatus.lastErrorCode || 'error'})</span>
                  </div>
                  <p className="text-[11px] text-rose-200/90 font-mono break-all bg-black/30 p-2 rounded-xl border border-rose-500/20">
                    {syncStatus.lastError}
                  </p>
                  {syncStatus.lastErrorCode === 'permission-denied' && (
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Firestore Security Rules denied access. Deploy <code className="text-amber-300">firestore.rules</code> or verify rules in Firebase Console for project <code className="text-amber-300">{appletConfig.projectId}</code>.
                    </p>
                  )}
                </div>
              )}

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-[#141b24] rounded-2xl border border-slate-800">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Cloud Records</div>
                  <div className="text-lg font-extrabold text-emerald-400 mt-0.5 font-mono">
                    {anyCloudFetched ? totalCloudDocs : '—'}
                  </div>
                  <div className="text-[10px] text-slate-500">Confirmed on server</div>
                </div>
                <div className="p-3 bg-[#141b24] rounded-2xl border border-slate-800">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Local Cache</div>
                  <div className="text-lg font-extrabold text-amber-300 mt-0.5 font-mono">
                    {totalLocalDocs}
                  </div>
                  <div className="text-[10px] text-slate-500">Stored on this device</div>
                </div>
                <div className="p-3 bg-[#141b24] rounded-2xl border border-slate-800">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Pending Queue</div>
                  <div className={`text-lg font-extrabold mt-0.5 font-mono ${(syncStatus?.pendingCount || 0) > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
                    {syncStatus?.pendingCount || 0}
                  </div>
                  <div className="text-[10px] text-slate-500">Auto-pushes when online</div>
                </div>
                <div className="p-3 bg-[#141b24] rounded-2xl border border-slate-800">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Live Streams</div>
                  <div className="text-lg font-extrabold text-sky-400 mt-0.5 font-mono">
                    {syncStatus ? `${syncStatus.connectedListeners}/${syncStatus.totalListeners}` : '0/12'}
                  </div>
                  <div className="text-[10px] text-slate-500">Active Firestore listeners</div>
                </div>
              </div>

              {(syncStatus?.recoveredLocalCount || 0) > 0 && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-xs text-emerald-300 font-medium">
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                  <span>
                    Automatically recovered & uploaded {syncStatus?.recoveredLocalCount} local-only record(s) to Cloud Firestore this session.
                  </span>
                </div>
              )}

              {/* Identity & Connection Metadata */}
              <div className="p-3.5 bg-[#141b24] rounded-2xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <ShieldCheck size={15} className="text-emerald-400" />
                  <span>Account & Cloud Target</span>
                </div>
                <div className="text-[11px] text-slate-300 space-y-1.5 bg-[#0a0e14] p-3 rounded-xl border border-slate-800 font-mono">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400 shrink-0">Signed In As:</span>
                    <span className="text-amber-300 font-bold truncate">{user?.email || syncStatus?.userEmail || 'Guest'}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400 shrink-0">User UID:</span>
                    <span className="text-slate-300 truncate">{user?.uid || syncStatus?.userId || '—'}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400 shrink-0">Workspace:</span>
                    <span className={user?.email?.toLowerCase() === 'rajapriyan20@gmail.com' ? 'text-amber-400 font-bold' : 'text-sky-400'}>
                      {user?.email?.toLowerCase() === 'rajapriyan20@gmail.com' ? 'Primary Workspace' : 'Private Isolated Space'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400 shrink-0">Project ID:</span>
                    <span className="text-slate-300 font-bold truncate">{syncStatus?.projectId || appletConfig.projectId}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400 shrink-0">Server Reachable:</span>
                    <span className={syncStatus?.serverReachable === true ? 'text-emerald-400 font-bold' : syncStatus?.serverReachable === false ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                      {syncStatus?.serverReachable === true ? 'Yes (Verified)' : syncStatus?.serverReachable === false ? 'No (Offline)' : 'Checking...'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400 shrink-0">Last Cloud Sync:</span>
                    <span className="text-slate-200">{formatSyncTime(syncStatus?.lastSyncedAt)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400 shrink-0">Last Auto-Check:</span>
                    <span className="text-slate-200">{formatSyncTime(syncStatus?.lastReconciledAt)}</span>
                  </div>
                </div>
              </div>

              {/* Per-Collection Breakdown */}
              <div className="p-3.5 bg-[#141b24] rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Database size={15} className="text-amber-400" />
                    <span>Collection Sync Breakdown</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Cloud / Local</span>
                </div>
                <div className="space-y-1.5">
                  {collectionStatsList.map((col) => {
                    const badgeStyle =
                      col.status === 'synced'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : col.status === 'error'
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        : col.status === 'pending'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : col.status === 'cached'
                        ? 'bg-slate-800 text-amber-200 border-slate-700'
                        : col.status === 'syncing'
                        ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                        : 'bg-slate-900 text-slate-400 border-slate-800';

                    const statusText =
                      col.status === 'synced'
                        ? 'Synced'
                        : col.status === 'error'
                        ? 'Error'
                        : col.status === 'pending'
                        ? `Pending (${col.pendingCount})`
                        : col.status === 'cached'
                        ? 'Cached'
                        : col.status === 'syncing'
                        ? 'Syncing'
                        : 'Idle';

                    return (
                      <div
                        key={col.key}
                        className="p-2.5 rounded-xl bg-[#0e131a] border border-slate-800/90 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-200 truncate">{col.label}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] font-mono text-slate-300">
                              <span className="text-emerald-400 font-bold">{col.cloudCount ?? '—'}</span>
                              <span className="text-slate-600 mx-0.5">/</span>
                              <span className="text-amber-300">{col.localCount}</span>
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${badgeStyle}`}>
                              {statusText}
                            </span>
                          </div>
                        </div>
                        {col.error && (
                          <div className="text-[10px] text-rose-300 font-mono break-all">
                            {col.error}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Auto-Sync Activity Log */}
              <div className="p-3.5 bg-[#141b24] rounded-2xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Activity size={15} className="text-sky-400" />
                  <span>Recent Auto-Sync Activity</span>
                </div>
                {!syncStatus?.logs || syncStatus.logs.length === 0 ? (
                  <div className="text-[11px] text-slate-500 py-2">No sync events logged yet in this session.</div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {syncStatus.logs.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-2 rounded-xl bg-[#0a0e14] border border-slate-800/80 text-[11px] space-y-0.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider ${
                              entry.level === 'error'
                                ? 'text-rose-400'
                                : entry.level === 'warn'
                                ? 'text-amber-400'
                                : entry.level === 'success'
                                ? 'text-emerald-400'
                                : 'text-sky-400'
                            }`}
                          >
                            {entry.level}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-slate-300 leading-snug break-words">{entry.message}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
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

            {/* Colour Theme Selector (3 Choices with Default Classic Amber) */}
            <div className="p-4 bg-[#141b24] rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Palette size={16} className="text-amber-400" />
                  <span>Workspace Colour Theme</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {currentThemeConfig.name}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Choose an accent theme for buttons, icons, highlights, and workspace charts.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {themes.map((t) => {
                  const isSelected = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id)}
                      className={`flex flex-col p-3 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'border-amber-400 bg-amber-500/15 shadow-md ring-1 ring-amber-400/50'
                          : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      {/* Swatch & Indicator */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span 
                            className="w-4 h-4 rounded-full shadow-sm border border-white/20 shrink-0"
                            style={{ backgroundColor: t.accentColor }} 
                          />
                          <span 
                            className="w-2.5 h-2.5 rounded-full opacity-60 shrink-0" 
                            style={{ backgroundColor: t.accentColor }} 
                          />
                        </div>
                        {isSelected ? (
                          <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                            <Check size={11} strokeWidth={3} />
                          </span>
                        ) : null}
                      </div>

                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{t.name}</span>
                        {t.badgeLabel && (
                          <span className="px-1 py-0.2 rounded text-[9px] bg-slate-800 text-slate-400 border border-slate-700 font-medium">
                            {t.badgeLabel}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                        {t.subtitle}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Menu Tabs Visibility Toggle Section (Requirement 8) */}
            <div className="p-4 bg-[#141b24] rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <LayoutGrid size={16} className="text-emerald-400" />
                  <span>Customize Menu Tabs</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Toggle Show / Hide
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Show or hide specific tabs from the bottom navigation and side drawer menu. Default is to show all tabs.
              </p>

              <div className="space-y-1.5 pt-1">
                {ALL_TABS_CONFIG.map((tab) => {
                  const isVisible = tabVisibility[tab.id] !== false;

                  return (
                    <div
                      key={tab.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#0e131a] border border-slate-800/90 hover:border-slate-700/80 transition"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <span>{tab.label}</span>
                          {!isVisible && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-300 font-medium">
                              Hidden
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {tab.desc}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onToggleTabVisibility(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition active:scale-95 shrink-0 ${
                          isVisible
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
                        }`}
                        title={isVisible ? 'Click to hide this tab' : 'Click to show this tab'}
                      >
                        {isVisible ? (
                          <>
                            <Eye size={13} className="text-emerald-400" />
                            <span>Shown</span>
                          </>
                        ) : (
                          <>
                            <EyeOff size={13} className="text-slate-400" />
                            <span>Hidden</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notification Preferences Card (Exclusive dedicated notifications page) */}
            {onOpenNotificationSettings && (
              <div className="p-4 bg-[#141b24] rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Bell size={16} className="text-amber-400" />
                    <span>Notification Preferences</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenNotificationSettings();
                    }}
                    className="px-3 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition active:scale-95 cursor-pointer"
                  >
                    Configure Alerts
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Decide what alerts you receive, adjust frequencies, and set reminder times for vehicle renewals, daily expenses, monthly body tracking, and birthdays.
                </p>
              </div>
            )}

            {/* Settlement Mapping Disregard Threshold (Setting 1) */}
            <div className="p-4 bg-[#141b24] rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Sliders size={16} className="text-amber-400" />
                  <span>Settlement Disregard Threshold</span>
                </div>
                {toleranceSaved && (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 animate-fadeIn">
                    <Check size={12} /> Saved
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Disregard differences up to this amount (in ₹) when reconciling and settling mapped transactions. Amounts differing by this threshold or less will be considered fully settled.
              </p>
              <div className="flex items-center gap-3 pt-0.5">
                <div className="relative flex-1 max-w-[150px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={toleranceInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setToleranceInput(val);
                      const num = parseFloat(val);
                      if (!isNaN(num) && num >= 0) {
                        saveStoredSettlementTolerance(num);
                        setToleranceSaved(true);
                        setTimeout(() => setToleranceSaved(false), 2000);
                      }
                    }}
                    placeholder="10"
                    className="w-full bg-[#0a0e14] border border-slate-700/80 rounded-xl pl-7 pr-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <span className="text-[11px] text-slate-400">
                  Tolerance Amount (INR)
                </span>
              </div>
            </div>

            {/* Install to Phone / Desktop Button */}
            <div className="p-4 bg-gradient-to-r from-amber-500/10 via-[#151c26] to-emerald-500/10 rounded-2xl border border-amber-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Smartphone size={16} />
                  <span>Install as Phone App</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Native Experience
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Add Chuvadi to your phone's Home Screen to run full-screen without Chrome/Safari address bars, just like a native app.
              </p>
              <button
                onClick={() => setIsInstallModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-md shadow-amber-500/20 active:scale-95"
              >
                <Download size={14} strokeWidth={2.5} />
                <span>Install / Add to Home Screen</span>
              </button>
            </div>

            {/* Unified Project Database Info */}
            {isGuestMode ? (
              <div className="p-3.5 bg-[#141b24] rounded-2xl border border-amber-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <Eye size={15} />
                    <span>Guest Demo Session</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    In-Memory Sandbox
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 space-y-1 bg-[#0a0e14] p-2.5 rounded-xl border border-slate-800 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Environment:</span>
                    <span className="text-amber-300 font-bold">Offline / Preview</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Database:</span>
                    <span className="text-slate-400">Demo State</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cloud Sync:</span>
                    <span className="text-rose-400">Not Synced</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  You are currently exploring Chuvadi with sample records. Sign in with Google to enable permanent Firestore database sync.
                </p>

                <div className="flex items-center gap-2 pt-1">
                  {onLogin && (
                    <button
                      onClick={() => {
                        onClose();
                        onLogin();
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition active:scale-95 shadow-md shadow-amber-500/20"
                    >
                      <LogIn size={13} strokeWidth={2.5} />
                      <span>Sign In with Google</span>
                    </button>
                  )}
                  {onExitGuestMode && (
                    <button
                      onClick={() => {
                        onClose();
                        onExitGuestMode();
                      }}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition active:scale-95"
                    >
                      <ArrowLeft size={13} />
                      <span>Exit Demo</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className={`p-3.5 bg-[#141b24] rounded-2xl border ${phaseMeta.borderClass} space-y-2.5`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Database size={15} className="text-emerald-400" />
                    <span>Cloud Sync & Database</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${phaseMeta.badgeClass}`}>
                    {phaseMeta.icon}
                    <span>{phaseMeta.label}</span>
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 space-y-1 bg-[#0a0e14] p-2.5 rounded-xl border border-slate-800 font-mono">
                  {user?.email && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Signed In As:</span>
                      <span className="text-amber-300 font-bold truncate max-w-[200px]">{user.email}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Workspace:</span>
                    <span className={user?.email?.toLowerCase() === 'rajapriyan20@gmail.com' ? 'text-amber-400 font-bold' : 'text-sky-400'}>
                      {user?.email?.toLowerCase() === 'rajapriyan20@gmail.com' ? 'Primary Workspace' : 'Private Isolated Space'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cloud / Local:</span>
                    <span className="text-emerald-300 font-bold">
                      {anyCloudFetched ? `${totalCloudDocs} cloud` : 'Checking...'} • {totalLocalDocs} local
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Last Sync:</span>
                    <span className="text-slate-300">{formatSyncTime(syncStatus?.lastSyncedAt)}</span>
                  </div>
                </div>

                {syncStatus?.lastError && (
                  <div className="text-[11px] text-rose-300 bg-rose-950/30 border border-rose-500/30 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5">
                    <AlertTriangle size={12} className="shrink-0" />
                    <span className="truncate">{syncStatus.lastError}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setActivePage('cloud-sync')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#0e131a] hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/30 text-xs font-semibold text-amber-300 transition cursor-pointer active:scale-[0.99]"
                >
                  <span>View Cloud Sync Status & Stats</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            )}

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
                onClick={handleSeed}
                disabled={isSeeding}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                <RefreshCw size={14} className={isSeeding ? 'animate-spin' : ''} />
                <span>
                  {isSeeding
                    ? 'Populating starter records...'
                    : seedSuccess
                    ? 'Starter records populated!'
                    : 'Populate Starter / Demo Data'}
                </span>
                {seedSuccess && <Check size={14} className="text-emerald-400" />}
              </button>

              {onClearUserData && !isGuestMode && (
                <button
                  onClick={handleClearUser}
                  disabled={clearingUser}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer"
                >
                  <Trash2 size={14} className={clearingUser ? 'animate-spin' : ''} />
                  <span>
                    {clearingUser
                      ? 'Clearing workspace...'
                      : clearedSuccess
                      ? 'Workspace cleared to blank!'
                      : 'Reset Workspace to Blank'}
                  </span>
                  {clearedSuccess && <Check size={14} className="text-emerald-400" />}
                </button>
              )}

              <button
                onClick={handleResetCache}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                <Trash2 size={14} />
                <span>{cacheReset ? 'Local storage cache cleared!' : 'Reset Local Offline Storage Cache'}</span>
                {cacheReset && <Check size={14} className="text-emerald-400" />}
              </button>
            </div>
            </div>
          )}
        </div>
      </div>

      {/* Dedicated Install Modal */}
      <InstallAppModal 
        isOpen={isInstallModalOpen} 
        onClose={() => setIsInstallModalOpen(false)} 
      />
    </>
  );
};
