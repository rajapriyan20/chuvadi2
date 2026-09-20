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

export type ActiveTab = 'dashboard' | 'finance' | 'garage' | 'todos' | 'reports' | 'ai';
