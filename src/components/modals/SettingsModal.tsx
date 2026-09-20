import React from 'react';
import { X, Database, Sparkles, RefreshCw, Trash2 } from 'lucide-react';
import { ChuvadiLogo } from '../ChuvadiLogo';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121820] w-full max-w-md rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#161d26]">
          <div className="text-amber-300 font-bold text-base">Chuvadi Settings</div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
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

          {/* Cloud Database Info */}
          <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Database size={15} className="text-amber-400" />
              <span>Firebase Cloud Database</span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1">
              <div>Project: <code className="text-amber-300 font-mono">chuvadi-d5fc1</code></div>
              <div>Mode: <span className="text-emerald-400 font-medium">Atomic Transactions + Offline Local Mirror</span></div>
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
