import type { RecurringFrequency, RecurringTransaction, Transaction } from '../types';
import { formatDateToLocalYMD } from './formatters';

function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/**
 * Calculates the next due date based on frequency and interval
 * Avoids UTC timezone shifts by operating directly on calendar YYYY-MM-DD components
 */
export function calculateNextDueDate(
  currentDateStr: string,
  frequency: RecurringFrequency,
  interval: number = 1
): string {
  const safeInterval = Math.max(1, interval || 1);
  const parts = currentDateStr.split('-');
  if (parts.length !== 3) return currentDateStr;

  let year = parseInt(parts[0], 10);
  let month = parseInt(parts[1], 10) - 1; // 0-indexed
  let day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return currentDateStr;

  switch (frequency) {
    case 'DAILY': {
      const d = new Date(year, month, day + safeInterval);
      return formatDateToLocalYMD(d);
    }
    case 'WEEKLY': {
      const d = new Date(year, month, day + (safeInterval * 7));
      return formatDateToLocalYMD(d);
    }
    case 'MONTHLY': {
      // Calculate target month and year
      const totalMonths = month + safeInterval;
      const targetYear = year + Math.floor(totalMonths / 12);
      const targetMonth = ((totalMonths % 12) + 12) % 12;

      // Handle variable days per month (e.g. Jan 31 -> Feb 28)
      const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
      const targetDay = Math.min(day, daysInTargetMonth);

      const d = new Date(targetYear, targetMonth, targetDay);
      return formatDateToLocalYMD(d);
    }
    case 'YEARLY': {
      const targetYear = year + safeInterval;
      // Handle leap year Feb 29
      const daysInTargetMonth = new Date(targetYear, month + 1, 0).getDate();
      const targetDay = Math.min(day, daysInTargetMonth);
      const d = new Date(targetYear, month, targetDay);
      return formatDateToLocalYMD(d);
    }
    case 'CUSTOM_DAYS': {
      const d = new Date(year, month, day + safeInterval);
      return formatDateToLocalYMD(d);
    }
    default:
      return currentDateStr;
  }
}

/**
 * Friendly label for recurrence pattern
 */
export function formatRecurrenceLabel(
  frequency: RecurringFrequency,
  interval: number = 1,
  startDate?: string
): string {
  const safeInterval = Math.max(1, interval || 1);
  const dayOfMonth = startDate ? parseInt(startDate.split('-')[2], 10) : null;

  switch (frequency) {
    case 'DAILY':
      return safeInterval === 1 ? 'Repeats Daily' : `Repeats every ${safeInterval} days`;
    case 'WEEKLY': {
      let weekday = '';
      if (startDate) {
        try {
          const d = parseLocalDate(startDate);
          weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
        } catch {}
      }
      return safeInterval === 1 
        ? `Weekly${weekday ? ` on ${weekday}` : ''}` 
        : `Every ${safeInterval} weeks${weekday ? ` on ${weekday}` : ''}`;
    }
    case 'MONTHLY':
      return safeInterval === 1
        ? `Monthly${dayOfMonth ? ` on day ${dayOfMonth}` : ''}`
        : `Every ${safeInterval} months${dayOfMonth ? ` on day ${dayOfMonth}` : ''}`;
    case 'YEARLY':
      return safeInterval === 1 ? 'Repeats Yearly' : `Every ${safeInterval} years`;
    case 'CUSTOM_DAYS':
      return `Every ${safeInterval} days`;
    default:
      return 'Recurring';
  }
}

/**
 * Returns user-facing status tag and diff relative to today
 */
export function getDueStatus(nextDueDate: string, todayStr: string): {
  label: string;
  isDue: boolean;
  isOverdue: boolean;
  diffDays: number;
} {
  if (!nextDueDate) return { label: 'No date', isDue: false, isOverdue: false, diffDays: 0 };
  
  const target = new Date(`${nextDueDate}T00:00:00`);
  const current = new Date(`${todayStr}T00:00:00`);
  const diffTime = target.getTime() - current.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return {
      label: daysAgo === 1 ? 'Overdue by 1 day' : `Overdue by ${daysAgo} days`,
      isDue: true,
      isOverdue: true,
      diffDays
    };
  } else if (diffDays === 0) {
    return {
      label: 'Due today',
      isDue: true,
      isOverdue: false,
      diffDays: 0
    };
  } else if (diffDays === 1) {
    return {
      label: 'Due tomorrow',
      isDue: false,
      isOverdue: false,
      diffDays: 1
    };
  } else {
    return {
      label: `Due in ${diffDays} days`,
      isDue: false,
      isOverdue: false,
      diffDays
    };
  }
}

/**
 * Generates the clean static Transaction payload for a recurring rule on a given due date
 */
export function createStaticTransactionFromRule(
  rule: RecurringTransaction,
  dueDate: string
): Omit<Transaction, 'id'> {
  const chosenTime = rule.time || '09:00';
  let timestamp = Date.now();
  try {
    const parsed = new Date(`${dueDate}T${chosenTime}:00`);
    if (!isNaN(parsed.getTime())) {
      timestamp = parsed.getTime();
    }
  } catch {}

  const ruleNotes = rule.notes?.trim() || '';
  const recurrenceSuffix = `[Auto-Recurring: ${rule.frequency}]`;
  const combinedNotes = ruleNotes 
    ? `${ruleNotes} · ${recurrenceSuffix}` 
    : recurrenceSuffix;

  const tags = Array.from(new Set([...(rule.tags || []), 'Recurring', rule.frequency]));

  return {
    type: rule.type,
    amount: Number(rule.amount) || 0,
    description: rule.description.trim() || `${rule.category} Recurring`,
    category: rule.category,
    fromAccountId: (rule.type === 'EXPENSE' || rule.type === 'TRANSFER') ? (rule.fromAccountId || null) : null,
    toAccountId: (rule.type === 'INCOME' || rule.type === 'TRANSFER') ? (rule.toAccountId || null) : null,
    date: dueDate,
    time: chosenTime,
    timestamp,
    vehicleId: rule.vehicleId || null,
    notes: combinedNotes,
    tags,
    recurringId: rule.id
  };
}

export interface AutoPostResult {
  rule: RecurringTransaction;
  generatedTransactions: Omit<Transaction, 'id'>[];
  updatedRule: RecurringTransaction;
}

/**
 * Evaluates an active recurring rule against today's date.
 * Posts all occurrences up to today without skipping missed cycles.
 * Safeguarded with max 24 cycles per evaluation to prevent runaway execution.
 */
export function evaluateAndAdvanceRecurringRule(
  rule: RecurringTransaction,
  todayStr: string,
  existingTransactions: Transaction[]
): AutoPostResult | null {
  if (rule.isActive === false) return null;
  if (!rule.nextDueDate) return null;

  // If next due date is in the future, nothing to post
  if (rule.nextDueDate > todayStr) return null;

  const generatedTransactions: Omit<Transaction, 'id'>[] = [];
  let currentDue = rule.nextDueDate;
  let cycles = 0;
  const MAX_CYCLES = 24;

  while (currentDue <= todayStr && cycles < MAX_CYCLES) {
    // If end date specified and we passed it, stop
    if (rule.endDate && currentDue > rule.endDate) {
      break;
    }

    // Duplicate guard: check if a transaction for this rule on currentDue was already posted
    const alreadyExists = existingTransactions.some(
      t => t.recurringId === rule.id && t.date === currentDue
    );

    if (!alreadyExists) {
      const txn = createStaticTransactionFromRule(rule, currentDue);
      generatedTransactions.push(txn);
    }

    currentDue = calculateNextDueDate(currentDue, rule.frequency, rule.interval || 1);
    cycles++;
  }

  const isExpired = rule.endDate ? currentDue > rule.endDate : false;

  const updatedRule: RecurringTransaction = {
    ...rule,
    nextDueDate: currentDue,
    lastPostedDate: generatedTransactions.length > 0 ? todayStr : (rule.lastPostedDate || todayStr),
    isActive: isExpired ? false : rule.isActive,
    updatedAt: Date.now()
  };

  return {
    rule,
    generatedTransactions,
    updatedRule
  };
}
