/**
 * Formatting and Helper Utilities for Chuvadi
 */

export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
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
