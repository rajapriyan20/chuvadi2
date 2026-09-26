import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bell, 
  BellOff, 
  Car, 
  Wallet, 
  Dumbbell, 
  CheckSquare, 
  CalendarDays, 
  Heart, 
  Check, 
  Clock, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  Smartphone,
  ShieldCheck
} from 'lucide-react';
import { 
  getStoredNotificationSettings, 
  saveNotificationSettings, 
  requestNotificationPermission, 
  getNotificationPermission, 
  sendTestNotification,
  isNotificationSupported,
  type NotificationSettings 
} from '../../services/notificationService';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsUpdated?: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsUpdated
}) => {
  const [settings, setSettings] = useState<NotificationSettings>(getStoredNotificationSettings);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(getStoredNotificationSettings());
      setPermission(getNotificationPermission());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setPermission(perm);
    if (perm === 'granted') {
      const updated = { ...settings, enabled: true };
      setSettings(updated);
      saveNotificationSettings(updated);
    }
  };

  const handleSendTest = async () => {
    setTestStatus('sending');
    try {
      const success = await sendTestNotification();
      setTestStatus(success ? 'sent' : 'failed');
      setTimeout(() => setTestStatus('idle'), 3500);
    } catch {
      setTestStatus('failed');
      setTimeout(() => setTestStatus('idle'), 3500);
    }
  };

  const handleSave = () => {
    saveNotificationSettings(settings);
    setSavedSuccess(true);
    if (onSettingsUpdated) onSettingsUpdated();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const toggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const supported = isNotificationSupported();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#101620] border border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-[#131b26]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Bell size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Notification Settings</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Local Device
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Choose alerts, customize frequencies & reminder times
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-300">
          
          {/* Permission Status Banner */}
          {!supported ? (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-2.5">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Notifications Not Supported</div>
                <div className="text-[11px] text-rose-300/80 mt-0.5">
                  This browser environment does not support web notifications. Try adding Chuvadi to your home screen or using Chrome/Edge/Firefox.
                </div>
              </div>
            </div>
          ) : permission === 'granted' ? (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold">Browser Permission Granted</span>
                  <div className="text-[11px] text-emerald-400/80">Local notifications are active on this device</div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendTest}
                disabled={testStatus === 'sending'}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 text-[11px] font-semibold transition active:scale-95 flex items-center gap-1.5 shrink-0"
              >
                <Send size={12} />
                <span>{testStatus === 'sent' ? 'Sent!' : testStatus === 'sending' ? 'Sending...' : 'Send Test'}</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-300">Permission Required</div>
                  <div className="text-[11px] text-amber-200/80 mt-0.5">
                    Allow Chuvadi to display alerts on your phone or desktop.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRequestPermission}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition active:scale-95 shadow-md shadow-amber-500/20 shrink-0"
              >
                Enable Notifications
              </button>
            </div>
          )}

          {/* Master Toggle */}
          <div className="p-4 rounded-2xl bg-[#141c27] border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-bold text-white flex items-center gap-2">
                <Bell size={15} className="text-amber-400" />
                <span>Enable Notifications System</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Master switch to turn on or off all scheduled local reminders
              </p>
            </div>

            <button
              type="button"
              onClick={() => toggle('enabled')}
              className={`w-12 h-6.5 rounded-full transition-colors relative p-0.5 ${
                settings.enabled ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5.5 h-5.5 rounded-full bg-white transition-transform ${
                  settings.enabled ? 'translate-x-5.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Individual Modules Configuration */}
          <div className={`space-y-3.5 transition-opacity ${settings.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
              Modules & Alert Frequency
            </h3>

            {/* 1. Vehicle Renewals */}
            <div className="p-4 rounded-2xl bg-[#141c27] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <Car size={15} />
                  </div>
                  <div>
                    <div className="font-bold text-white">Garage & Vehicle Renewals</div>
                    <div className="text-[11px] text-slate-400">Insurance & Pollution (PUC) expiry warnings</div>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={settings.vehicleRenewals}
                  onChange={() => toggle('vehicleRenewals')}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                />
              </div>

              {settings.vehicleRenewals && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Advance Warning Window:</span>
                  <select
                    value={settings.vehicleAdvanceDays}
                    onChange={(e) => setSettings(prev => ({ ...prev, vehicleAdvanceDays: Number(e.target.value) }))}
                    className="bg-[#0e141d] border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value={7}>7 Days before expiry</option>
                    <option value={15}>15 Days before expiry</option>
                    <option value={30}>30 Days before expiry</option>
                  </select>
                </div>
              )}
            </div>

            {/* 2. Daily Expense Prompt */}
            <div className="p-4 rounded-2xl bg-[#141c27] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Wallet size={15} />
                  </div>
                  <div>
                    <div className="font-bold text-white">Daily Expense Logging Prompt</div>
                    <div className="text-[11px] text-slate-400">Gentle evening reminder to record daily spending</div>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={settings.dailyExpenseReminder}
                  onChange={() => toggle('dailyExpenseReminder')}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                />
              </div>

              {settings.dailyExpenseReminder && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Daily Reminder Time:</span>
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-slate-500" />
                    <input
                      type="time"
                      value={settings.dailyExpenseTime}
                      onChange={(e) => setSettings(prev => ({ ...prev, dailyExpenseTime: e.target.value }))}
                      className="bg-[#0e141d] border border-slate-700 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. Monthly Body Profile Check-in */}
            <div className="p-4 rounded-2xl bg-[#141c27] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                    <Dumbbell size={15} />
                  </div>
                  <div>
                    <div className="font-bold text-white">Monthly Body Profile Check-in</div>
                    <div className="text-[11px] text-slate-400">Prompt on the 1st of every month to record measurements</div>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={settings.bodyProfileMonthlyReminder}
                  onChange={() => toggle('bodyProfileMonthlyReminder')}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* 4. Checklists & Pending Tasks */}
            <div className="p-4 rounded-2xl bg-[#141c27] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <CheckSquare size={15} />
                  </div>
                  <div>
                    <div className="font-bold text-white">Pending Checklists & Tasks</div>
                    <div className="text-[11px] text-slate-400">Review unresolved pinned tasks</div>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={settings.pendingTodosReminder}
                  onChange={() => toggle('pendingTodosReminder')}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                />
              </div>

              {settings.pendingTodosReminder && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Morning Review Time:</span>
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-slate-500" />
                    <input
                      type="time"
                      value={settings.todosReminderTime}
                      onChange={(e) => setSettings(prev => ({ ...prev, todosReminderTime: e.target.value }))}
                      className="bg-[#0e141d] border border-slate-700 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 5. Calendar & Birthdays */}
            <div className="p-4 rounded-2xl bg-[#141c27] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                    <CalendarDays size={15} />
                  </div>
                  <div>
                    <div className="font-bold text-white">Birthdays & Calendar Events</div>
                    <div className="text-[11px] text-slate-400">Upcoming anniversaries, birthdays and life events</div>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={settings.calendarBirthdays}
                  onChange={() => toggle('calendarBirthdays')}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                />
              </div>

              {settings.calendarBirthdays && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Advance Warning:</span>
                  <select
                    value={settings.calendarAdvanceDays}
                    onChange={(e) => setSettings(prev => ({ ...prev, calendarAdvanceDays: Number(e.target.value) }))}
                    className="bg-[#0e141d] border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value={0}>On the Day of Event</option>
                    <option value={1}>1 Day before</option>
                    <option value={2}>2 Days before</option>
                    <option value={3}>3 Days before</option>
                  </select>
                </div>
              )}
            </div>

            {/* 6. Wellness & Cycle Predictions */}
            <div className="p-4 rounded-2xl bg-[#141c27] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center">
                    <Heart size={15} />
                  </div>
                  <div>
                    <div className="font-bold text-white">Wellness & Cycle Forecast</div>
                    <div className="text-[11px] text-slate-400">Period prediction and fertility alerts</div>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={settings.cycleReminders}
                  onChange={() => toggle('cycleReminders')}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                />
              </div>

              {settings.cycleReminders && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Advance Warning:</span>
                  <select
                    value={settings.cycleAdvanceDays}
                    onChange={(e) => setSettings(prev => ({ ...prev, cycleAdvanceDays: Number(e.target.value) }))}
                    className="bg-[#0e141d] border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value={1}>1 Day before</option>
                    <option value={2}>2 Days before</option>
                    <option value={3}>3 Days before</option>
                  </select>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-[#131b26] flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Stored locally on this device
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-xs font-bold transition active:scale-95 shadow-md shadow-amber-500/20 flex items-center gap-1.5"
            >
              <Check size={14} strokeWidth={2.5} />
              <span>{savedSuccess ? 'Saved!' : 'Save Preferences'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
