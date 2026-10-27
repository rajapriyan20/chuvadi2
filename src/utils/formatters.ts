/**
 * Formatting and Helper Utilities for Chuvadi
 */

export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
  // Replace all spaces (including narrow spaces) with non-breaking spaces (\u00A0)
  // so negative currency like -₹ 500 never splits the minus sign onto a separate line
  return formatted.replace(/[\s\u2000-\u200B\u202F\u205F]/g, '\u00A0');
}

export function formatDate(dateStr: string | number | undefined | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return typeof dateStr === 'string' ? dateStr : '';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return typeof dateStr === 'string' ? dateStr : '';
  }
}

/**
 * Formats a Date object to 'YYYY-MM-DD' using local timezone (avoiding UTC timezone shift bugs).
 */
export function formatDateToLocalYMD(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns today's date in local device timezone formatted as 'YYYY-MM-DD'.
 */
export function getTodayLocalDateString(): string {
  return formatDateToLocalYMD(new Date());
}

export function formatDateTime(timestamp: string | number | undefined | null): string {
  if (!timestamp) return '';
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return '';
  }
}

export function getDaysRemaining(targetDateStr: string | undefined | null): { days: number; isOverdue: boolean; label: string } | null {
  if (!targetDateStr) return null;
  try {
    const target = new Date(targetDateStr);
    if (isNaN(target.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { days: Math.abs(diffDays), isOverdue: true, label: `Expired ${Math.abs(diffDays)}d ago` };
    } else if (diffDays === 0) {
      return { days: 0, isOverdue: false, label: 'Expires today' };
    } else if (diffDays === 1) {
      return { days: 1, isOverdue: false, label: 'Expires tomorrow' };
    } else {
      return { days: diffDays, isOverdue: false, label: `${diffDays} days left` };
    }
  } catch (e) {
    return null;
  }
}

export const CATEGORY_COLORS: Record<string, string> = {
  'Fuel': '#f59e0b',
  'Food & Dining': '#ef4444',
  'Groceries': '#10b981',
  'Shopping': '#8b5cf6',
  'Utilities': '#3b82f6',
  'Healthcare': '#06b6d4',
  'Entertainment': '#ec4899',
  'Travel': '#6366f1',
  'Vehicle Maintenance': '#d97706',
  'Salary': '#22c55e',
  'Investment': '#14b8a6',
  'Debt Settlement': '#64748b',
  'Other': '#71717a'
};

export const DEFAULT_CATEGORIES = [
  'Fuel',
  'Food & Dining',
  'Groceries',
  'Shopping',
  'Utilities',
  'Healthcare',
  'Entertainment',
  'Travel',
  'Vehicle Maintenance',
  'Salary',
  'Investment',
  'Debt Settlement',
  'Other'
];

export const CUSTOM_EXPENSE_CATEGORIES_KEY = 'chuvadi_custom_expense_categories_v1';

/**
 * Retrieves custom user-created expense categories stored locally.
 */
export function getCustomExpenseCategories(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_EXPENSE_CATEGORIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(c => typeof c === 'string' && c.trim()) : [];
  } catch {
    return [];
  }
}

/**
 * Saves custom expense categories list to persistent storage.
 */
export function saveCustomExpenseCategories(categories: string[]): void {
  try {
    const cleaned = Array.from(new Set(categories.map(c => c.trim()).filter(Boolean)));
    localStorage.setItem(CUSTOM_EXPENSE_CATEGORIES_KEY, JSON.stringify(cleaned));
  } catch (e) {
    console.error('Failed to save custom expense categories:', e);
  }
}

/**
 * Adds a new custom expense category (case-insensitive deduplication).
 */
export function addCustomExpenseCategory(newCategory: string): string[] {
  const trimmed = newCategory.trim();
  if (!trimmed) return getAllExpenseCategories();
  
  const allCurrent = getAllExpenseCategories();
  const alreadyExists = allCurrent.some(c => c.toLowerCase() === trimmed.toLowerCase());
  if (alreadyExists) {
    return allCurrent;
  }
  
  const currentCustom = getCustomExpenseCategories();
  const updated = [...currentCustom, trimmed];
  saveCustomExpenseCategories(updated);
  return getAllExpenseCategories();
}

/**
 * Returns all available expense categories (DEFAULT_CATEGORIES + custom categories + any dynamic categories).
 */
export function getAllExpenseCategories(extraCategories: string[] = []): string[] {
  const custom = getCustomExpenseCategories();
  const combined = [...DEFAULT_CATEGORIES];
  
  for (const c of custom) {
    if (!combined.some(item => item.toLowerCase() === c.toLowerCase())) {
      combined.push(c);
    }
  }

  for (const extra of extraCategories) {
    if (extra && typeof extra === 'string' && extra.trim()) {
      const trimmedExtra = extra.trim();
      if (!combined.some(item => item.toLowerCase() === trimmedExtra.toLowerCase())) {
        combined.push(trimmedExtra);
      }
    }
  }

  return combined;
}

/**
 * Resolves color for any category, automatically generating a consistent vibrant accent for custom categories.
 */
export function getCategoryColor(category: string): string {
  if (category && CATEGORY_COLORS[category]) {
    return CATEGORY_COLORS[category];
  }
  const customPalette = [
    '#06b6d4', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', 
    '#eab308', '#6366f1', '#10b981', '#f43f5e', '#a855f7'
  ];
  let hash = 0;
  for (let i = 0; i < (category || '').length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % customPalette.length;
  return customPalette[index];
}

