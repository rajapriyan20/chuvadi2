import React from 'react';
import { LogOut, X } from 'lucide-react';
import { ChuvadiLogo } from '../ChuvadiLogo';

interface ExitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExit: () => void;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmExit
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-[#121820] w-full max-w-sm rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end -mt-2 -mr-2">
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white transition cursor-pointer"
            aria-label="Cancel"
          >
            <X size={18} />
          </button>
        </div>

        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-lg">
          <ChuvadiLogo size={36} />
        </div>

        <h3 className="text-base font-bold text-white mb-1.5">
          Exit Chuvadi?
        </h3>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Are you sure you want to close and exit the application?
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirmExit}
            className="flex-1 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <LogOut size={14} />
            <span>Close App</span>
          </button>
        </div>
      </div>
    </div>
  );
};
