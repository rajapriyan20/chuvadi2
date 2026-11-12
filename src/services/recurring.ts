import type { RecurringTransaction, Transaction, RecurringFrequency } from '../types';
import { formatDateToLocalYMD, getTodayLocalDateString } from '../utils/formatters';

/**
 * Computes the subsequent due date based on recurrence frequency and interval.
 * Uses local calendar date arithmetic to avoid UTC timezone offset shifts.
 */
export function computeNextDueDate(
  currentDateStr: string,
  frequency: RecurringFrequency,
  interval: number = 1
): string {
  if (!currentDateStr) return getTodayLocalDateString();
  const parts = currentDateStr.split('-').map(Number);
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return currentDateStr;
  }
  const [year, month, day] = parts;
  const d = new Date(year, month - 1, day);
  const safeInterval = Math.max(1, interval || 1);

  switch (frequency) {
    case 'DAILY':
      d.setDate(d.getDate() + safeInterval);
      break;

    case 'WEEKLY':
      d.setDate(d.getDate() + 7 * safeInterval);
      break;

    case 'BIWEEKLY':
      d.setDate(d.getDate() + 14 * safeInterval);
      break;

    case 'MONTHLY': {
      // Advance by months and clamp to max days of that target month (e.g. 31st -> 28th/30th)
      const targetMonth = d.getMonth() + safeInterval;
      d.setMonth(targetMonth, 1);
      const daysInTargetMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      d.setDate(Math.min(day, daysInTargetMonth));
      break;
    }

    case 'QUARTERLY': {
      const targetMonth = d.getMonth() + 3 * safeInterval;
      d.setMonth(targetMonth, 1);
      const daysInTargetMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      d.setDate(Math.min(day, daysInTargetMonth));
      break;
    }

    case 'YEARLY': {
      const targetYear = d.getFullYear() + safeInterval;
      const isLeap = (targetYear % 4 === 0 && targetYear % 100 !== 0) || targetYear % 400 === 0;
      const targetDay = month === 2 && day === 29 ? (isLeap ? 29 : 28) : day;
      d.setFullYear(targetYear, month - 1, targetDay);
      break;
    }

    default: {
      d.setMonth(d.getMonth() + 1);
      break;
    }
  }

  return formatDateToLocalYMD(d);
}

/**
 * Returns human-readable label for frequency and interval.
 */
export function getFrequencyLabel(frequency: RecurringFrequency, interval: number = 1): string {
  if (interval > 1) {
    switch (frequency) {
      case 'DAILY': return `Every ${interval} days`;
      case 'WEEKLY': return `Every ${interval} weeks`;
      case 'BIWEEKLY': return `Every ${interval * 2} weeks`;
      case 'MONTHLY': return `Every ${interval} months`;
      case 'QUARTERLY': return `Every ${interval * 3} months`;
      case 'YEARLY': return `Every ${interval} years`;
    }
  }

  switch (frequency) {
    case 'DAILY': return 'Daily';
    case 'WEEKLY': return 'Weekly';
    case 'BIWEEKLY': return 'Bi-weekly';
    case 'MONTHLY': return 'Monthly';
    case 'QUARTERLY': return 'Quarterly';
    case 'YEARLY': return 'Yearly';
    default: return frequency;
  }
}

/**
 * Calculates monthly equivalent amount for budget / commitment projection.
 */
export function calculateMonthlyEquivalent(amount: number, frequency: RecurringFrequency, interval: number = 1): number {
  const safeAmt = Number(amount) || 0;
  const safeInterval = Math.max(1, interval || 1);
  switch (frequency) {
    case 'DAILY': return (safeAmt * 30.41) / safeInterval;
    case 'WEEKLY': return (safeAmt * 4.33) / safeInterval;
    case 'BIWEEKLY': return (safeAmt * 2.17) / safeInterval;
    case 'MONTHLY': return safeAmt / safeInterval;
    case 'QUARTERLY': return (safeAmt / 3) / safeInterval;
    case 'YEARLY': return (safeAmt / 12) / safeInterval;
    default: return safeAmt;
  }
}

export interface RecurringStatusBadge {
  label: string;
  colorClass: string;
  isOverdue: boolean;
  isDueToday: boolean;
  diffDays: number;
}

/**
 * Generates due status label and visual styling based on today's date.
 */
export function getRecurringStatusBadge(
  recurring: RecurringTransaction,
  todayStr: string = getTodayLocalDateString()
): RecurringStatusBadge {
  if (!recurring.isActive) {
    return {
      label: 'Paused',
      colorClass: 'bg-slate-800 text-slate-400 border-slate-700',
      isOverdue: false,
      isDueToday: false,
      diffDays: 0
    };
  }

  const nextDue = recurring.nextDueDate || recurring.startDate;
  if (!nextDue) {
    return {
      label: 'Active',
      colorClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      isOverdue: false,
      isDueToday: false,
      diffDays: 0
    };
  }

  if (nextDue === todayStr) {
    return {
      label: 'Due Today',
      colorClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse',
      isOverdue: false,
      isDueToday: true,
      diffDays: 0
    };
  }

  if (nextDue < todayStr) {
    return {
      label: 'Overdue / Pending',
      colorClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      isOverdue: true,
      isDueToday: false,
      diffDays: -1
    };
  }

  // Future due date
  try {
    const todayDate = new Date(todayStr);
    const dueDate = new Date(nextDue);
    const diffTime = dueDate.getTime() - todayDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return {
        label: 'Due Tomorrow',
        colorClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
        isOverdue: false,
        isDueToday: false,
        diffDays: 1
      };
    }

    return {
      label: `In ${diffDays} days`,
      colorClass: 'bg-slate-800/80 text-slate-300 border-slate-700/80',
      isOverdue: false,
      isDueToday: false,
      diffDays
    };
  } catch {
    return {
      label: nextDue,
      colorClass: 'bg-slate-800 text-slate-300 border-slate-700',
      isOverdue: false,
      isDueToday: false,
      diffDays: 0
    };
  }
}

export interface PostDueRecurringResult {
  postedCount: number;
  postedTransactions: Transaction[];
  updatedRecurringRules: RecurringTransaction[];
}

/**
 * Automatic Recurring Transaction Handler.
 * Scans active recurring rules and automatically posts the static ledger entry
 * when the user opens the app on or after the expected date of the transaction.
 * 
 * Includes duplicate prevention and safeguards against infinite loops.
 */
export async function processDueRecurringTransactions(params: {
  recurringRules: RecurringTransaction[];
  existingTransactions: Transaction[];
  onPostTransaction: (txn: Omit<Transaction, 'id'> & { id?: string }) => Promise<void>;
  onUpdateRecurring: (recurring: RecurringTransaction) => Promise<void>;
  todayStr?: string;
}): Promise<PostDueRecurringResult> {
  const {
    recurringRules,
    existingTransactions,
    onPostTransaction,
    onUpdateRecurring,
    todayStr = getTodayLocalDateString()
  } = params;

  const postedTransactions: Transaction[] = [];
  const updatedRecurringRules: RecurringTransaction[] = [];

  for (const rule of recurringRules) {
    // Only process active rules with autoPost enabled (or defaulted to true)
    if (!rule.isActive || rule.autoPost === false) {
      continue;
    }

    let cursorDate = rule.nextDueDate || rule.startDate;
    if (!cursorDate) continue;

    let iterations = 0;
    const maxIterations = 24; // Safety limit (max 24 catch-up cycles per rule)
    let postedForThisRule = 0;
    let lastPostedDate = rule.lastPostedDate || null;

    // While expected date is on or before today
    while (cursorDate <= todayStr && iterations < maxIterations) {
      // Check if past rule's endDate
      if (rule.endDate && cursorDate > rule.endDate) {
        break;
      }

      // Idempotency: verify this specific occurrence was not already posted
      const alreadyExists = existingTransactions.some(t => 
        t.recurringTransactionId === rule.id && t.date === cursorDate
      ) || postedTransactions.some(t => 
        t.recurringTransactionId === rule.id && t.date === cursorDate
      );

      if (!alreadyExists) {
        const timeStr = '09:00';
        let timestamp = Date.now();
        try {
          const parsed = new Date(`${cursorDate}T${timeStr}:00`);
          if (!isNaN(parsed.getTime())) {
            timestamp = parsed.getTime();
          }
        } catch {}

        const newTxn: Omit<Transaction, 'id'> = {
          type: rule.type,
          amount: Number(rule.amount) || 0,
          description: rule.description,
          category: rule.category,
          fromAccountId: (rule.type === 'EXPENSE' || rule.type === 'TRANSFER') ? (rule.fromAccountId || null) : null,
          toAccountId: (rule.type === 'INCOME' || rule.type === 'TRANSFER') ? (rule.toAccountId || null) : null,
          date: cursorDate,
          time: timeStr,
          timestamp,
          notes: rule.notes 
            ? `${rule.notes} (Recurring: ${getFrequencyLabel(rule.frequency, rule.interval)})` 
            : `Auto-posted recurring (${getFrequencyLabel(rule.frequency, rule.interval)})`,
          vehicleId: rule.vehicleId || null,
          isFuel: !!rule.isFuel,
          recurringTransactionId: rule.id,
          isRecurringGenerated: true
        };

        try {
          await onPostTransaction(newTxn);
          postedTransactions.push(newTxn as Transaction);
          postedForThisRule++;
          lastPostedDate = cursorDate;
        } catch (err) {
          console.error(`Failed to post recurring transaction for ${rule.description} on ${cursorDate}:`, err);
          break; // Stop loop on save failure
        }
      }

      // Advance to next period
      cursorDate = computeNextDueDate(cursorDate, rule.frequency, rule.interval || 1);
      iterations++;
    }

    // If any occurrences were processed or cursor date advanced past today
    if (cursorDate !== (rule.nextDueDate || rule.startDate)) {
      const updatedRule: RecurringTransaction = {
        ...rule,
        nextDueDate: cursorDate,
        lastPostedDate: lastPostedDate || rule.lastPostedDate,
        updatedAt: Date.now()
      };

      try {
        await onUpdateRecurring(updatedRule);
        updatedRecurringRules.push(updatedRule);
      } catch (err) {
        console.error(`Failed to advance nextDueDate for recurring rule ${rule.id}:`, err);
      }
    }
  }

  return {
    postedCount: postedTransactions.length,
    postedTransactions,
    updatedRecurringRules
  };
}
