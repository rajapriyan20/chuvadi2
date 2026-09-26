import React from 'react';
import { X } from 'lucide-react';
import { ChuvadiLogo } from '../ChuvadiLogo';

interface LogoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogoModal: React.FC<LogoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md p-3 sm:p-6 flex flex-col items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Chuvadi Logo View"
    >
      <div 
        className="w-full max-w-sm sm:max-w-md bg-[#111722] border border-amber-500/25 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Lightbox Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-[#141b26] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">Chuvadi</h3>
              <p className="text-[10px] text-amber-300/80 leading-tight">A manuscript to track life!</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-95 cursor-pointer"
            title="Close"
            aria-label="Close Logo View"
          >
            <X size={18} />
          </button>
        </div>

        {/* High-Resolution SVG Logo Display (WhatsApp DP Style) */}
        <div className="p-6 sm:p-8 flex flex-col items-center justify-center bg-gradient-to-b from-[#151c27] via-[#0f141d] to-[#0c1017] relative select-none">
          <div className="absolute inset-0 bg-radial-gradient from-amber-500/10 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative p-3 rounded-2xl bg-black/40 border border-amber-500/25 shadow-2xl flex items-center justify-center">
            <ChuvadiLogo size={280} />
          </div>

          {/* Sub-label description (Removed the sentence "Inscribed with Tamil letters...") */}
          <div className="mt-5 text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <span>சுவடி • Palm-Leaf Ledger</span>
            </div>
            <p className="text-[11px] text-slate-300 max-w-xs mx-auto leading-relaxed">
              Inspired by ancient palm-leaf manuscripts crafted across eras to inscribe wisdom, deeds, accounts, and milestones.
            </p>
          </div>
        </div>

        {/* Bottom Dismiss Button */}
        <div className="p-3 border-t border-slate-800/80 bg-[#111722] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition active:scale-95 cursor-pointer"
          >
            Close View
          </button>
        </div>
      </div>
    </div>
  );
};
