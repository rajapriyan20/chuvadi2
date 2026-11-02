import type { Transaction } from '../types';

export const DEFAULT_SETTLEMENT_TOLERANCE = 10; // Default ₹10 INR

/**
 * Retrieve user-configured settlement disregard threshold from localStorage
 */
export const getStoredSettlementTolerance = (): number => {
  try {
    const raw = localStorage.getItem('chuvadi_settlement_tolerance');
    if (raw !== null && !isNaN(Number(raw))) {
      const val = Number(raw);
      return val >= 0 ? val : DEFAULT_SETTLEMENT_TOLERANCE;
    }
  } catch {}
  return DEFAULT_SETTLEMENT_TOLERANCE;
};

/**
 * Save user-configured settlement disregard threshold to localStorage
 */
export const saveStoredSettlementTolerance = (val: number): void => {
  try {
    const safeVal = Math.max(0, isNaN(val) ? DEFAULT_SETTLEMENT_TOLERANCE : val);
    localStorage.setItem('chuvadi_settlement_tolerance', String(safeVal));
    window.dispatchEvent(new Event('settlement_tolerance_updated'));
  } catch {}
};

export interface SettlementStatusInfo {
  isSettled: boolean;
  remainingDifference: number;
  totalSettled: number;
  isChildSettlement: boolean;
  parentTxn?: Transaction;
  childTxns: Transaction[];
}

/**
 * Calculate settlement status for a transaction within an account
 */
export const getSettlementStatus = (
  txn: Transaction,
  allTxns: Transaction[],
  tolerance: number = getStoredSettlementTolerance()
): SettlementStatusInfo => {
  // Case 1: Transaction is a child mapped to a parent transaction
  if (txn.mappedTransactionId) {
    const parent = allTxns.find(t => t.id === txn.mappedTransactionId);
    if (parent) {
      // Calculate parent's overall settlement
      const siblingChildren = allTxns.filter(t => t.mappedTransactionId === parent.id);
      const totalSettledAgainstParent = siblingChildren.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
      const diff = Math.abs(parent.amount - totalSettledAgainstParent);
      const isParentSettled = totalSettledAgainstParent > 0 && diff <= tolerance;

      return {
        isSettled: isParentSettled,
        remainingDifference: diff,
        totalSettled: totalSettledAgainstParent,
        isChildSettlement: true,
        parentTxn: parent,
        childTxns: []
      };
    }

    // Orphan child mapping
    return {
      isSettled: true,
      remainingDifference: 0,
      totalSettled: txn.amount,
      isChildSettlement: true,
      childTxns: []
    };
  }

  // Case 2: Primary transaction (may have 0 or more child settling transactions mapped to it)
  const childTxns = allTxns.filter(t => t.mappedTransactionId === txn.id);
  const totalSettled = childTxns.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  if (childTxns.length > 0) {
    const diff = Math.abs(txn.amount - totalSettled);
    const isSettled = diff <= tolerance;
    return {
      isSettled,
      remainingDifference: diff,
      totalSettled,
      isChildSettlement: false,
      childTxns
    };
  }

  // No child mappings yet
  const diff = txn.amount;
  const isSettled = diff <= tolerance;

  return {
    isSettled,
    remainingDifference: diff,
    totalSettled: 0,
    isChildSettlement: false,
    childTxns: []
  };
};

export interface UnsettledTransactionItem extends Transaction {
  remainingDifference: number;
  totalSettled: number;
}

/**
 * Get list of unsettled transactions for an account whose difference exceeds the tolerance threshold
 */
export const getUnsettledTransactionsForAccount = (
  accountId: string,
  allTxns: Transaction[],
  tolerance: number = getStoredSettlementTolerance(),
  excludeTxnId?: string
): UnsettledTransactionItem[] => {
  if (!accountId) return [];

  // Find all transactions that touched this account
  const accountTxns = allTxns.filter(t => 
    (t.fromAccountId === accountId || t.toAccountId === accountId) &&
    t.id !== excludeTxnId &&
    !t.mappedTransactionId // Only primary transactions can be mapped to
  );

  const unsettledList: UnsettledTransactionItem[] = [];

  for (const t of accountTxns) {
    const status = getSettlementStatus(t, allTxns, tolerance);
    // If not settled and difference is greater than the disregard threshold
    if (!status.isSettled && status.remainingDifference > tolerance) {
      unsettledList.push({
        ...t,
        remainingDifference: status.remainingDifference,
        totalSettled: status.totalSettled
      });
    }
  }

  // Sort by date descending
  return unsettledList.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
};
