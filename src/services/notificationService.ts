import type { 
  Vehicle, 
  VehicleLog, 
  TodoNote, 
  CalendarEvent, 
  BodyProfileLog, 
  MenstrualLog, 
  MenstrualCycleSettings,
  Transaction,
  ActiveTab
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

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: 'vehicle' | 'finance' | 'todos' | 'calendar' | 'fitness' | 'wellness' | 'system';
  targetTab?: ActiveTab;
  date: string;
  timestamp: number;
  read: boolean;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

const SETTINGS_STORAGE_KEY = 'chuvadi_notification_settings_v1';
const NOTIFICATIONS_STORAGE_KEY = 'chuvadi_app_notifications_v1';
const DISMISSED_NOTIFICATIONS_STORAGE_KEY = 'chuvadi_dismissed_notifications_v1';
const READ_NOTIFICATIONS_STORAGE_KEY = 'chuvadi_read_notifications_v1';

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
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save notification settings:', e);
  }
}

// In-App Notifications Storage
export function getStoredNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AppNotification[];
  } catch {
    return [];
  }
}

export function saveNotifications(notifications: AppNotification[]): void {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  } catch (e) {
    console.error('Failed to save notifications list:', e);
  }
}

// Dismissed / Deleted Notifications Tracking (Prevents deleted notifications from ever reappearing)
export function getDismissedNotificationIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function addDismissedNotificationId(id: string): void {
  try {
    const set = getDismissedNotificationIds();
    set.add(id);
    localStorage.setItem(DISMISSED_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.error('Failed to save dismissed notification ID:', e);
  }
}

export function addDismissedNotificationIds(ids: string[]): void {
  try {
    const set = getDismissedNotificationIds();
    ids.forEach(id => set.add(id));
    localStorage.setItem(DISMISSED_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.error('Failed to save dismissed notification IDs:', e);
  }
}

// Read Notifications Tracking (Prevents read notifications from reverting to unread)
export function getReadNotificationIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function addReadNotificationId(id: string): void {
  try {
    const set = getReadNotificationIds();
    set.add(id);
    localStorage.setItem(READ_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.error('Failed to save read notification ID:', e);
  }
}

export function addReadNotificationIds(ids: string[]): void {
  try {
    const set = getReadNotificationIds();
    ids.forEach(id => set.add(id));
    localStorage.setItem(READ_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.error('Failed to save read notification IDs:', e);
  }
}

export function markNotificationAsRead(id: string): AppNotification[] {
  addReadNotificationId(id);
  const current = getStoredNotifications();
  const updated = current.map(n => n.id === id ? { ...n, read: true } : n);
  saveNotifications(updated);
  return updated;
}

export function markAllNotificationsAsRead(): AppNotification[] {
  const current = getStoredNotifications();
  addReadNotificationIds(current.map(n => n.id));
  const updated = current.map(n => ({ ...n, read: true }));
  saveNotifications(updated);
  return updated;
}

export function deleteNotification(id: string): AppNotification[] {
  addDismissedNotificationId(id);
  const current = getStoredNotifications();
  const updated = current.filter(n => n.id !== id);
  saveNotifications(updated);
  return updated;
}

export function clearAllNotifications(): AppNotification[] {
  const current = getStoredNotifications();
  addDismissedNotificationIds(current.map(n => n.id));
  saveNotifications([]);
  return [];
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
 * Computes, synchronizes and stores in-app notifications according to user data and settings.
 * Preserves user's 'read' state for already-seen alerts.
 */
export function syncAndGenerateAppNotifications(params: {
  vehicles: Vehicle[];
  todos: TodoNote[];
  calendarEvents?: CalendarEvent[];
  bodyProfileLogs?: BodyProfileLog[];
  menstrualLogs?: MenstrualLog[];
  transactions?: Transaction[];
}): AppNotification[] {
  const settings = getStoredNotificationSettings();
  if (!settings.enabled) {
    return [];
  }

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dismissedIds = getDismissedNotificationIds();
  const readIds = getReadNotificationIds();
  const existingList = getStoredNotifications();
  const readStateMap = new Map<string, boolean>();
  for (const item of existingList) {
    readStateMap.set(item.id, item.read);
  }
  for (const id of readIds) {
    readStateMap.set(id, true);
  }

  const generated: AppNotification[] = [];

  const pushIfNotDismissed = (item: AppNotification) => {
    // If the user has deleted/dismissed this notification, never regenerate it!
    if (dismissedIds.has(item.id)) {
      return;
    }
    // If it was already marked as read, preserve the read state!
    if (readStateMap.get(item.id) || readIds.has(item.id)) {
      item.read = true;
    }
    generated.push(item);
  };

  // 1. Vehicle Insurance & PUC Expiring
  if (settings.vehicleRenewals && params.vehicles.length > 0) {
    const advanceDays = settings.vehicleAdvanceDays || 15;
    for (const v of params.vehicles) {
      if (v.insuranceExpiry) {
        const expDate = new Date(v.insuranceExpiry);
        const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= advanceDays) {
          const id = `veh-ins-${v.id}-${v.insuranceExpiry}`;
          const isOverdue = diffDays < 0;
          pushIfNotDismissed({
            id,
            title: `🚗 ${v.name} Insurance ${isOverdue ? 'Overdue' : 'Expiring'}`,
            message: isOverdue 
              ? `Insurance expired ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} ago (${v.insuranceExpiry}). Please renew.`
              : `Insurance expires in ${diffDays} day${diffDays === 1 ? '' : 's'} (${v.insuranceExpiry}).`,
            category: 'vehicle',
            targetTab: 'garage',
            date: v.insuranceExpiry,
            timestamp: Date.now(),
            read: readStateMap.get(id) || readIds.has(id) || false,
            priority: isOverdue ? 'critical' : diffDays <= 7 ? 'high' : 'normal'
          });
        }
      }

      if (v.pucExpiry) {
        const expDate = new Date(v.pucExpiry);
        const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= advanceDays) {
          const id = `veh-puc-${v.id}-${v.pucExpiry}`;
          const isOverdue = diffDays < 0;
          pushIfNotDismissed({
            id,
            title: `💨 ${v.name} PUC Certificate ${isOverdue ? 'Overdue' : 'Expiring'}`,
            message: isOverdue 
              ? `Pollution certificate expired ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} ago.`
              : `Pollution (PUC) certificate expires in ${diffDays} day${diffDays === 1 ? '' : 's'}.`,
            category: 'vehicle',
            targetTab: 'garage',
            date: v.pucExpiry,
            timestamp: Date.now(),
            read: readStateMap.get(id) || readIds.has(id) || false,
            priority: isOverdue ? 'critical' : 'normal'
          });
        }
      }
    }
  }

  // 2. Pending Checklists & Tasks
  if (settings.pendingTodosReminder && params.todos.length > 0) {
    const uncompletedNotes = params.todos.filter(t => t.items && t.items.some(i => !i.completed));
    if (uncompletedNotes.length > 0) {
      const id = `todos-summary-${todayStr}`;
      const totalPending = uncompletedNotes.reduce((acc, t) => acc + t.items.filter(i => !i.completed).length, 0);
      const topNote = uncompletedNotes[0];
      const pendingTaskText = topNote.items.find(i => !i.completed)?.text || topNote.title;

      pushIfNotDismissed({
        id,
        title: `📋 ${totalPending} Pending Tasks to Review`,
        message: `Next up: "${pendingTaskText}" across ${uncompletedNotes.length} active checklist${uncompletedNotes.length === 1 ? '' : 's'}.`,
        category: 'todos',
        targetTab: 'todos',
        date: todayStr,
        timestamp: Date.now(),
        read: readStateMap.get(id) || readIds.has(id) || false,
        priority: 'normal'
      });
    }
  }

  // 3. Calendar & Upcoming Birthdays
  if (settings.calendarBirthdays && params.calendarEvents && params.calendarEvents.length > 0) {
    const advDays = Math.max(settings.calendarAdvanceDays ?? 1, 7);
    for (const ev of params.calendarEvents) {
      if (!ev.date) continue;
      const evDate = new Date(ev.date);
      const diffDays = Math.ceil((evDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= advDays) {
        const id = `cal-${ev.id}-${ev.date}`;
        const isBday = ev.category === 'BIRTHDAY';
        const whenText = diffDays === 0 ? 'Today!' : diffDays === 1 ? 'Tomorrow' : `in ${diffDays} days (${ev.date})`;
        
        pushIfNotDismissed({
          id,
          title: isBday ? `🎂 Birthday: ${ev.title}` : `📅 Event: ${ev.title}`,
          message: `${whenText}. ${ev.notes ? `Notes: ${ev.notes}` : 'Check your schedule in Calendar.'}`,
          category: 'calendar',
          targetTab: 'calendar',
          date: ev.date,
          timestamp: Date.now(),
          read: readStateMap.get(id) || readIds.has(id) || false,
          priority: diffDays <= 1 ? 'high' : 'normal'
        });
      }
    }
  }

  // 4. Monthly Body Profile on 1st of the month
  if (settings.bodyProfileMonthlyReminder) {
    const isFirstOfMonth = today.getDate() === 1;
    if (isFirstOfMonth) {
      const id = `body-profile-${today.getFullYear()}-${today.getMonth() + 1}`;
      pushIfNotDismissed({
        id,
        title: '🏋️ Monthly Body Profile Check-in',
        message: 'Today is the 1st of the month! Log your body circumferences, weight, and fitness focus in Exercise.',
        category: 'fitness',
        targetTab: 'exercise',
        date: todayStr,
        timestamp: Date.now(),
        read: readStateMap.get(id) || readIds.has(id) || false,
        priority: 'normal'
      });
    }
  }

  // 5. Daily Evening Expense Prompt
  if (settings.dailyExpenseReminder) {
    const id = `expense-prompt-${todayStr}`;
    const [eHour, eMin] = (settings.dailyExpenseTime || '20:30').split(':').map(Number);
    const nowMinutes = today.getHours() * 60 + today.getMinutes();
    const targetMinutes = (eHour || 20) * 60 + (eMin || 30);

    if (nowMinutes >= targetMinutes) {
      pushIfNotDismissed({
        id,
        title: '💰 Evening Expense Check-in',
        message: 'Take 30 seconds to record today’s expenses or voice dictate your spending into Chuvadi.',
        category: 'finance',
        targetTab: 'finance',
        date: todayStr,
        timestamp: Date.now(),
        read: readStateMap.get(id) || readIds.has(id) || false,
        priority: 'normal'
      });
    }
  }

  // Preserve any system alerts or extra entries not generated above (unless dismissed by user)
  const genIds = new Set(generated.map(g => g.id));
  for (const old of existingList) {
    if (!genIds.has(old.id) && !dismissedIds.has(old.id)) {
      if (readIds.has(old.id)) {
        old.read = true;
      }
      generated.push(old);
    }
  }

  // Sort: unread first, then by priority, then by date/timestamp
  generated.sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return b.timestamp - a.timestamp;
  });

  saveNotifications(generated);
  return generated;
}

/**
 * Checks all user data against configured reminder rules and fires native alerts if due.
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
