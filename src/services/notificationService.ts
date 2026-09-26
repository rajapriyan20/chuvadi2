import type { 
  Vehicle, 
  VehicleLog, 
  TodoNote, 
  CalendarEvent, 
  BodyProfileLog, 
  MenstrualLog, 
  MenstrualCycleSettings 
} from '../types';

export interface NotificationSettings {
  enabled: boolean;
  
  // 1. Vehicle Renewals (PUC, Insurance, Service)
  vehicleRenewals: boolean;
  vehicleAdvanceDays: number; // e.g. 15 or 30 days
  
  // 2. Daily Expense Reminder
  dailyExpenseReminder: boolean;
  dailyExpenseTime: string; // e.g. "20:00"
  
  // 3. Fitness & Body Metrics
  bodyProfileMonthlyReminder: boolean; // Monthly on the 1st
  
  // 4. Checklist & Task Reminders
  pendingTodosReminder: boolean;
  todosReminderTime: string; // e.g. "09:00"
  
  // 5. Calendar & Birthday Alerts
  calendarBirthdays: boolean;
  calendarAdvanceDays: number; // e.g. 1 (day before) or 0 (day of)
  
  // 6. Wellness & Cycle Predictions
  cycleReminders: boolean;
  cycleAdvanceDays: number; // e.g. 2 days before predicted period
  
  // Internal record to prevent repetitive duplicate alerts in a single day
  lastCheckedDate?: string;
  sentNotificationKeys?: string[];
}

const STORAGE_KEY = 'chuvadi_notification_settings_v1';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  vehicleRenewals: true,
  vehicleAdvanceDays: 15,
  dailyExpenseReminder: true,
  dailyExpenseTime: '20:30',
  bodyProfileMonthlyReminder: true,
  pendingTodosReminder: true,
  todosReminderTime: '09:00',
  calendarBirthdays: true,
  calendarAdvanceDays: 1,
  cycleReminders: true,
  cycleAdvanceDays: 2,
  sentNotificationKeys: []
};

export function getStoredNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save notification settings:', e);
  }
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    console.error('Error requesting notification permission:', e);
    return Notification.permission;
  }
}

/**
 * Dispatches a native browser notification via Service Worker or Web Notification API.
 */
export async function dispatchLocalNotification(
  title: string, 
  options: NotificationOptions & { tag?: string } = {}
): Promise<boolean> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const defaultIcon = '/pwa-192x192.png';
  const defaultBadge = '/favicon.png';

  const notificationOptions: any = {
    icon: defaultIcon,
    badge: defaultBadge,
    vibrate: [200, 100, 200],
    ...options
  };

  try {
    // Prefer service worker registration if available for best mobile background compatibility
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, notificationOptions);
        return true;
      }
    }

    // Fallback to standard Window Notification
    new Notification(title, notificationOptions);
    return true;
  } catch (err) {
    console.warn('Notification dispatch fallback error:', err);
    try {
      new Notification(title, notificationOptions);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Sends an immediate test notification to verify device sound/vibration/visual banner.
 */
export async function sendTestNotification(): Promise<boolean> {
  const perm = await requestNotificationPermission();
  if (perm !== 'granted') return false;

  return dispatchLocalNotification('Chuvadi Notifications Active 🔔', {
    body: 'Your custom notification preferences are configured and working smoothly!',
    tag: 'test-notification-' + Date.now()
  });
}

/**
 * Checks all user data against configured reminder rules and fires alerts if due.
 */
export async function checkAndTriggerDueNotifications(params: {
  vehicles: Vehicle[];
  vehicleLogs?: VehicleLog[];
  todos: TodoNote[];
  calendarEvents?: CalendarEvent[];
  bodyProfileLogs?: BodyProfileLog[];
  menstrualLogs?: MenstrualLog[];
  menstrualSettings?: MenstrualCycleSettings;
}): Promise<number> {
  const settings = getStoredNotificationSettings();
  if (!settings.enabled || getNotificationPermission() !== 'granted') {
    return 0;
  }

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
  const sentKeys = new Set(settings.sentNotificationKeys || []);
  let alertsCount = 0;

  const markSent = (key: string) => {
    sentKeys.add(key);
    alertsCount++;
  };

  // 1. Vehicle Renewals (Insurance & PUC)
  if (settings.vehicleRenewals && params.vehicles.length > 0) {
    const advanceDays = settings.vehicleAdvanceDays || 15;
    for (const v of params.vehicles) {
      // Check Insurance
      if (v.insuranceExpiry) {
        const expDate = new Date(v.insuranceExpiry);
        const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const key = `veh-ins-${v.id}-${todayStr}`;
        if (diffDays >= 0 && diffDays <= advanceDays && !sentKeys.has(key)) {
          await dispatchLocalNotification(`🚗 Vehicle Insurance Due: ${v.name}`, {
            body: `Insurance expires in ${diffDays} day${diffDays === 1 ? '' : 's'} (${v.insuranceExpiry}). Tap to view garage.`,
            tag: key
          });
          markSent(key);
        }
      }

      // Check PUC / Pollution
      if (v.pucExpiry) {
        const expDate = new Date(v.pucExpiry);
        const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const key = `veh-puc-${v.id}-${todayStr}`;
        if (diffDays >= 0 && diffDays <= advanceDays && !sentKeys.has(key)) {
          await dispatchLocalNotification(`💨 PUC Renewal Due: ${v.name}`, {
            body: `PUC certificate expires in ${diffDays} day${diffDays === 1 ? '' : 's'} (${v.pucExpiry}).`,
            tag: key
          });
          markSent(key);
        }
      }
    }
  }

  // 2. Body Profile Tracking (Reminder on 1st of every month)
  if (settings.bodyProfileMonthlyReminder) {
    const isFirstOfMonth = today.getDate() === 1;
    const key = `body-profile-${today.getFullYear()}-${today.getMonth() + 1}`;
    if (isFirstOfMonth && !sentKeys.has(key)) {
      await dispatchLocalNotification('🏋️ Monthly Body Profile Check-in', {
        body: 'Today is the 1st of the month! Log your body circumferences, weight, and fitness focus in Exercise.',
        tag: key
      });
      markSent(key);
    }
  }

  // 3. Pending Checklists & Tasks
  if (settings.pendingTodosReminder && params.todos.length > 0) {
    const key = `todos-summary-${todayStr}`;
    const uncompletedNotes = params.todos.filter(t => t.items && t.items.some(i => !i.completed));
    if (uncompletedNotes.length > 0 && !sentKeys.has(key)) {
      // Check if current time is past the reminder time
      const [rHour, rMin] = (settings.todosReminderTime || '09:00').split(':').map(Number);
      const nowMinutes = today.getHours() * 60 + today.getMinutes();
      const targetMinutes = rHour * 60 + rMin;

      if (nowMinutes >= targetMinutes) {
        const topTask = uncompletedNotes[0];
        const pendingItem = topTask.items.find(i => !i.completed)?.text || topTask.title;
        await dispatchLocalNotification(`📋 ${uncompletedNotes.length} Pending Checklist${uncompletedNotes.length === 1 ? '' : 's'}`, {
          body: `Don't forget: "${pendingItem}". Keep your checklists moving forward!`,
          tag: key
        });
        markSent(key);
      }
    }
  }

  // 4. Daily Expense Logging Reminder
  if (settings.dailyExpenseReminder) {
    const key = `expense-prompt-${todayStr}`;
    const [eHour, eMin] = (settings.dailyExpenseTime || '20:30').split(':').map(Number);
    const nowMinutes = today.getHours() * 60 + today.getMinutes();
    const targetMinutes = eHour * 60 + eMin;

    if (nowMinutes >= targetMinutes && !sentKeys.has(key)) {
      await dispatchLocalNotification('💰 Evening Expense Check-in', {
        body: 'Take 30 seconds to record today’s expenses or voice dictate your spending into Chuvadi.',
        tag: key
      });
      markSent(key);
    }
  }

  // 5. Calendar & Birthday Alerts
  if (settings.calendarBirthdays && params.calendarEvents && params.calendarEvents.length > 0) {
    const advDays = settings.calendarAdvanceDays ?? 1;
    for (const ev of params.calendarEvents) {
      if (!ev.date) continue;
      const evDate = new Date(ev.date);
      const diffDays = Math.ceil((evDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const key = `calev-${ev.id}-${todayStr}`;

      if (diffDays >= 0 && diffDays <= advDays && !sentKeys.has(key)) {
        const isBday = ev.category === 'BIRTHDAY';
        const prefix = isBday ? '🎂 Upcoming Birthday: ' : '📅 Upcoming Event: ';
        const whenText = diffDays === 0 ? 'Today!' : diffDays === 1 ? 'Tomorrow' : `in ${diffDays} days`;
        await dispatchLocalNotification(`${prefix}${ev.title}`, {
          body: `${whenText} — ${ev.notes || 'Check your calendar in Chuvadi.'}`,
          tag: key
        });
        markSent(key);
      }
    }
  }

  // Save updated sent keys (keeping only last 50 to avoid unlimited growth)
  const trimmedKeys = Array.from(sentKeys).slice(-50);
  saveNotificationSettings({
    ...settings,
    lastCheckedDate: todayStr,
    sentNotificationKeys: trimmedKeys
  });

  return alertsCount;
}
