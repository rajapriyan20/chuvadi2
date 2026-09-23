/**
 * Domain Types for Chuvadi - Personal Life OS & Ledger
 */

export type AccountType = 
  | 'BANK' 
  | 'CASH' 
  | 'CREDIT_CARD' 
  | 'INVESTMENT' 
  | 'LOAN' 
  | 'RECEIVABLE' 
  | 'PAYABLE' 
  | 'OTHER';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  accountNumber?: string;
  color?: string;
  icon?: string;
  institution?: string;
  reconciledDate?: string;
  categoryId?: string;
  updatedAt?: number;
}

export type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO format YYYY-MM-DD
  timestamp: number;
  description: string;
  category: string;
  fromAccountId?: string | null;
  toAccountId?: string | null;
  vehicleId?: string | null;
  isFuel?: boolean;
  fuelLiters?: number | null;
  odometer?: number | null;
  notes?: string;
  tags?: string[];
  receiptUrl?: string;
}

export interface Vehicle {
  id: string;
  name: string; // e.g. "Royal Enfield Classic 350", "Honda City"
  vehicleNumber: string; // e.g. "TN 01 AB 1234"
  type: 'BIKE' | 'CAR' | 'SCOOTER' | 'OTHER';
  currentOdometer: number;
  fuelType: 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'CNG';
  insuranceExpiry?: string; // YYYY-MM-DD
  pucExpiry?: string; // YYYY-MM-DD
  lastServiceDate?: string;
  insurancePolicyNumber?: string;
  color?: string;
}

export type VehicleLogType = 'FUEL' | 'SERVICE' | 'REPAIR' | 'INSURANCE' | 'PUC' | 'OTHER';

export interface VehicleLog {
  id: string;
  vehicleId: string;
  date: string;
  timestamp: number;
  type: VehicleLogType;
  title: string;
  odometer: number;
  cost: number;
  fuelLiters?: number;
  notes?: string;
  workshop?: string;
  transactionId?: string;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TodoNote {
  id: string;
  title: string;
  items: TodoItem[];
  color: string; // e.g. 'amber', 'emerald', 'sky', 'rose', 'indigo', 'zinc'
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Entity {
  id: string;
  name: string;
  type: 'RECEIVABLE' | 'PAYABLE';
  amount: number;
  phone?: string;
  notes?: string;
  dueDate?: string;
}

export interface ExerciseLog {
  id: string;
  date: string; // YYYY-MM-DD
  description: string; // exercise desc
  createdAt?: number;
  updatedAt?: number;
}

// Gmail Expense Inbox & Parser Rules
export interface GmailFilterRule {
  id: string;
  name: string;
  query: string; // e.g. from:alerts@hdfcbank.net OR from:alerts@hdfcbank.bank.in
  enabled: boolean;
  createdAt: number;
}

export type FieldSuggestionRuleType = 'ACCOUNT' | 'CATEGORY';

export interface FieldSuggestionRule {
  id: string;
  keyword: string; // Substring to match in email subject or body (e.g. "HDFC Bank Credit Card ending 5304", "biryani", "swiggy", "uber")
  targetType: FieldSuggestionRuleType; // 'ACCOUNT' or 'CATEGORY'
  targetValue: string; // accountId if 'ACCOUNT', or category title/name if 'CATEGORY'
  label?: string; // friendly description e.g. "Match ending 5304 -> HDFC Millennia Card"
  enabled: boolean;
  createdAt: number;
}

export interface GmailExpenseEmail {
  id: string; // Gmail message ID
  threadId: string;
  subject: string;
  from: string;
  date: string; // ISO or YYYY-MM-DD
  snippet: string;
  bodyText: string;
  timestamp: number;
  // Suggested extracted expense entry
  suggestedAmount?: number;
  suggestedDate?: string;
  suggestedDescription?: string;
  suggestedCategory?: string;
  suggestedAccountId?: string;
  suggestedType?: TransactionType;
  // Status
  status: 'PENDING' | 'ADDED' | 'IGNORED';
  addedTxnId?: string;
}

export type ActiveTab = 'dashboard' | 'finance' | 'garage' | 'todos' | 'reports' | 'ai' | 'exercise';
