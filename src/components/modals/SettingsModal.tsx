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
  Download
} from 'lucide-react';
import { ChuvadiLogo } from '../ChuvadiLogo';
import { InstallAppModal } from './InstallAppModal';
import appletConfig from '../../../firebase-applet-config.json';

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
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  if (!isOpen) return null;

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
                <div className="flex justify-between">
                  <span className="text-slate-400">Project ID:</span>
                  <span className="text-amber-300 font-bold">{appletConfig.projectId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Database:</span>
                  <span className="text-emerald-300">Firestore (Live)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Auth & Gmail:</span>
                  <span className="text-sky-300">Connected</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/90 pt-1">
                <ShieldCheck size={13} />
                <span>Database, Authentication, and Gmail OAuth are unified in one project.</span>
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

      {/* Dedicated Install Modal */}
      <InstallAppModal 
        isOpen={isInstallModalOpen} 
        onClose={() => setIsInstallModalOpen(false)} 
      />
    </>
  );
};
