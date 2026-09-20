import React from 'react';
import { 
  Plus, 
  Sparkles, 
  Download, 
  Settings as SettingsIcon, 
  Wifi, 
  WifiOff, 
  LogIn, 
  LogOut, 
  User as UserIcon 
} from 'lucide-react';
import { ChuvadiLogo } from './ChuvadiLogo';
import { formatCurrency } from '../utils/formatters';
import type { User } from 'firebase/auth';

interface HeaderProps {
  totalNetWorth: number;
  monthlyExpense: number;
  user: User | null;
  isOnline: boolean;
  onOpenQuickAdd: () => void;
  onOpenAi: () => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
  onLogin: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalNetWorth,
  monthlyExpense,
  user,
  isOnline,
  onOpenQuickAdd,
  onOpenAi,
  onOpenExport,
  onOpenSettings,
  onLogin,
  onLogout
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0d1218]/95 backdrop-blur-md border-b border-amber-950/20 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo & Brand Identity */}
        <div className="flex items-center gap-3">
          <ChuvadiLogo size={42} showText={true} />
        </div>

        {/* Quick Net Worth Display (Desktop & Tablet) */}
        <div className="hidden md:flex items-center gap-6 px-4 py-1.5 bg-[#161c24]/90 rounded-2xl border border-slate-800/80 shadow-inner">
          <div>
            <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
              Net Balance
            </div>
            <div className="text-base font-bold text-amber-200 font-mono leading-tight">
              {formatCurrency(totalNetWorth)}
            </div>
          </div>
          <div className="h-7 w-[1px] bg-slate-700/60" />
          <div>
            <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
              This Month Exp.
            </div>
            <div className="text-base font-bold text-rose-400 font-mono leading-tight">
              {formatCurrency(monthlyExpense)}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* AI Voice / Smart Assistant Trigger */}
          <button
            id="header-ai-trigger-btn"
            onClick={onOpenAi}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600/20 to-amber-600/20 hover:from-emerald-600/30 hover:to-amber-600/30 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-xs font-semibold transition shadow-sm active:scale-95"
            title="Chuvadi AI: Voice Logger & Receipt Scanner"
          >
            <Sparkles size={16} className="text-amber-400 animate-pulse" />
            <span className="hidden sm:inline">AI Dictate</span>
          </button>

          {/* Quick Record Button */}
          <button
            id="header-quick-add-btn"
            onClick={onOpenQuickAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition active:scale-95"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span className="hidden xs:inline">Record</span>
          </button>

          {/* Export Data */}
          <button
            id="header-export-btn"
            onClick={onOpenExport}
            className="p-2 rounded-xl bg-[#161c24] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
            title="Export CSV / JSON Backup"
          >
            <Download size={16} />
          </button>

          {/* Settings */}
          <button
            id="header-settings-btn"
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-[#161c24] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
            title="Application Settings"
          >
            <SettingsIcon size={16} />
          </button>

          {/* Auth State Button */}
          {user ? (
            <div className="flex items-center gap-2 pl-1">
              <button
                onClick={onLogout}
                className="flex items-center gap-1 p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700/60"
                title={`Signed in as ${user.email || 'User'}. Click to sign out.`}
              >
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="User" 
                    className="w-5 h-5 rounded-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserIcon size={14} />
                )}
                <LogOut size={13} className="text-slate-400" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition font-medium"
              title="Sign In with Google for Cloud Sync"
            >
              <LogIn size={14} className="text-amber-400" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          {/* Online/Offline Status Indicator */}
          <div 
            className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-500/50' : 'bg-rose-500 animate-ping'}`} 
            title={isOnline ? 'Online - Live Cloud Sync' : 'Offline - Running on Local Storage Cache'}
          />
        </div>
      </div>
    </header>
  );
};
