import React from 'react';
import { LogOut, User, ShieldCheck, X } from 'lucide-react';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLogout: () => Promise<void> | void;
  user: any;
  isLoggingOut?: boolean;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmLogout,
  user,
  isLoggingOut = false
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#111722] border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Top Icon */}
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <LogOut size={22} strokeWidth={2.2} />
          </div>

          <button
            onClick={onClose}
            disabled={isLoggingOut}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
            title="Cancel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Title and Confirmation text */}
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-white tracking-tight">
            Are you sure to logout?
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            You will be signed out of your account on this device. Your data will remain securely saved in Google Cloud.
          </p>
        </div>

        {/* User Card */}
        {user && (
          <div className="p-3 rounded-2xl bg-[#16202c] border border-slate-700/60 flex items-center gap-3">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="User" 
                className="w-10 h-10 rounded-full object-cover border border-amber-500/30"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <User size={18} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">
                {user.displayName || 'Google Account'}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {user.email || ''}
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoggingOut}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition active:scale-95 cursor-pointer text-center"
          >
            Stay Logged In
          </button>

          <button
            type="button"
            onClick={onConfirmLogout}
            disabled={isLoggingOut}
            className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold transition active:scale-95 shadow-md shadow-rose-600/25 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <LogOut size={13} strokeWidth={2.5} />
            <span>{isLoggingOut ? 'Logging out...' : 'Log Out'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
