import React, { useState } from 'react';
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
  Palette
} from 'lucide-react';
import { ChuvadiLogo } from '../ChuvadiLogo';
import { InstallAppModal } from './InstallAppModal';
import { useTheme } from '../../context/ThemeContext';
import type { ActiveTab, TabVisibilityMap } from '../../types';
import { 
  LayoutGrid, 
  EyeOff,
  Bell
} from 'lucide-react';
import appletConfig from '../../../firebase-applet-config.json';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  { id: 'reports', label: 'Reports & Analytics', desc: 'Spending breakdown and visual charts' },
  { id: 'ai', label: 'Chuvadi AI Advisor', desc: 'Intelligence hub, receipt OCR & voice' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
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
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [cacheReset, setCacheReset] = useState(false);
  const [clearingUser, setClearingUser] = useState(false);
  const [clearedSuccess, setClearedSuccess] = useState(false);

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

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
        <div className="bg-[#121820] w-full max-w-md rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#161d26]">
            <div className="text-amber-300 font-bold text-base">Chuvadi Settings & App</div>
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
              <div className="p-3.5 bg-[#141b24] rounded-2xl border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <Database size={15} />
                    <span>Unified Cloud Project</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 size={10} /> Active
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
                    <span className="text-slate-400">Project ID:</span>
                    <span className="text-slate-300 font-bold">{appletConfig.projectId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Database:</span>
                    <span className="text-emerald-300">Firestore (Live)</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/90 pt-1">
                  <ShieldCheck size={13} />
                  <span>Database, Authentication, and Gmail OAuth are unified in one project.</span>
                </div>
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
