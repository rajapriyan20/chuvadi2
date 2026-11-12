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
  openingBalance?: number;
  accountNumber?: string;
  color?: string;
  icon?: string;
  institution?: string;
  reconciledDate?: string;
  categoryId?: string;
  enableMapping?: boolean;
  updatedAt?: number;
}

export type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO format YYYY-MM-DD
  time?: string; // Format "HH:mm" (e.g. "00:00" or "14:30")
  timestamp: number;
  description: string;
  category: string;
  fromAccountId?: string | null;
  toAccountId?: string | null;
  mappedTransactionId?: string | null;
  vehicleId?: string | null;
  isFuel?: boolean;
  fuelLiters?: number | null;
  odometer?: number | null;
  notes?: string;
  tags?: string[];
  receiptUrl?: string;
  disabled?: boolean;
  recurringTransactionId?: string | null;
  isRecurringGenerated?: boolean;
}

export type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  fromAccountId?: string | null;
  toAccountId?: string | null;
  frequency: RecurringFrequency;
  interval?: number; // e.g., 1 for every month, 2 for every 2 months
  startDate: string; // ISO YYYY-MM-DD
  nextDueDate: string; // ISO YYYY-MM-DD
  lastPostedDate?: string | null; // ISO YYYY-MM-DD
  endDate?: string | null; // Optional end date
  isActive: boolean;
  autoPost?: boolean; // Defaults to true
  notes?: string;
  vehicleId?: string | null;
  isFuel?: boolean;
  createdAt?: number;
  updatedAt?: number;
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
  date?: string; // YYYY-MM-DD
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

export type FieldSuggestionRuleType = 'ACCOUNT' | 'CATEGORY' | 'DESCRIPTION';

export type DescriptionExtractMode = 'BETWEEN' | 'REGEX';

export interface FieldSuggestionRule {
  id: string;
  keyword: string; // Substring to match in email subject or body (e.g. "HDFC Bank", "VPA", "debited")
  targetType: FieldSuggestionRuleType; // 'ACCOUNT' | 'CATEGORY' | 'DESCRIPTION'
  targetValue: string; // accountId if 'ACCOUNT', category name if 'CATEGORY', or descriptive template if 'DESCRIPTION'
  
  // Bank Account Scoping: null/undefined = All Accounts; or specific account.id
  accountId?: string | null;

  // Dynamic Extraction Configuration (when targetType === 'DESCRIPTION')
  extractMode?: DescriptionExtractMode;
  startMarker?: string; // Substring preceding payee/merchant (e.g. "to ", "at ", "towards ", "VPA ")
  endMarker?: string;   // Substring succeeding payee/merchant (e.g. " on ", " via ", " using ", "\n", ",")
  regexPattern?: string; // Regex pattern with capture group 1

  label?: string; // Friendly description e.g. "HDFC: Extract payee between 'to' and 'on'"
  enabled: boolean;
  createdAt: number;
}

export interface GmailExpenseEmail {
  id: string; // Gmail message ID
  threadId: string;
  subject: string;
  from: string;
  date: string; // ISO or YYYY-MM-DD
  time?: string; // HH:mm
  snippet: string;
  bodyText: string;
  timestamp: number;
  // Suggested extracted expense entry
  suggestedAmount?: number;
  suggestedDate?: string;
  suggestedTime?: string;
  suggestedDescription?: string;
  suggestedCategory?: string;
  suggestedAccountId?: string;
  suggestedType?: TransactionType;
  matchedDescriptionRuleLabel?: string;
  // Status
  status: 'PENDING' | 'ADDED' | 'IGNORED';
  addedTxnId?: string;
}

// Calendar Types
export type CalendarEventType = 'FINANCE' | 'VEHICLE' | 'EXERCISE' | 'MENSTRUAL' | 'CUSTOM' | 'REMINDER' | 'BIRTHDAY';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD or annual recurring date
  endDate?: string;
  time?: string; // HH:mm
  type: CalendarEventType;
  category?: string; // e.g. 'Personal', 'Bill', 'Workout', 'Period', 'Car Service', 'Birthday'
  color?: string; // e.g. 'amber', 'rose', 'emerald', 'sky', 'indigo', 'violet', 'pink'
  notes?: string;
  isAllDay?: boolean;
  completed?: boolean;
  linkedId?: string;
  // Birthday specific fields (year is optional as requested)
  personName?: string;
  birthMonth?: number; // 1-12
  birthDay?: number; // 1-31
  birthYear?: number; // Optional! (e.g. 1995 or left undefined)
  relationship?: string; // e.g. 'Family', 'Friend', 'Colleague', 'Loved One'
  createdAt?: number;
  updatedAt?: number;
}

// Menstrual Tracker Types
export type FlowIntensity = 'NONE' | 'SPOTTING' | 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'CLOTS';
export type CrampSeverity = 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';
export type MoodType = 'HAPPY' | 'CALM' | 'ENERGETIC' | 'SENSITIVE' | 'IRRITABLE' | 'ANXIOUS' | 'TIRED' | 'MOOD_SWINGS';
export type CervicalMucus = 'DRY' | 'STICKY' | 'CREAMY' | 'EGGWHITE' | 'WATERY';
export type CyclePhase = 'MENSTRUAL' | 'FOLLICULAR' | 'OVULATORY' | 'LUTEAL';

export interface MenstrualCycleSettings {
  averageCycleLength: number; // default 28
  averagePeriodDuration: number; // default 5
  lutealPhaseLength: number; // default 14
  lastPeriodStartDate?: string; // YYYY-MM-DD
  privacyMode?: boolean;
}

export interface MenstrualLog {
  id: string;
  date: string; // YYYY-MM-DD
  isPeriodDay: boolean;
  flow?: FlowIntensity;
  cramps?: CrampSeverity;
  crampLocations?: string[];
  moods?: MoodType[];
  symptoms?: string[];
  mucus?: CervicalMucus;
  temperature?: number; // BBT in °C
  weight?: number; // kg
  waterIntakeGlasses?: number;
  sleepHours?: number;
  sexualActivity?: 'PROTECTED' | 'UNPROTECTED' | 'NONE';
  notes?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface MenstrualPeriodRecord {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  cycleLength?: number; // Days from previous period start
  durationDays?: number;
  notes?: string;
}

export type ActiveTab = 'dashboard' | 'finance' | 'garage' | 'todos' | 'calendar' | 'menstrual' | 'exercise' | 'reports' | 'ai';

export type MeasurementGoal = 'INCREASE' | 'DECREASE' | 'MAINTAIN' | 'NONE';

export interface BodyProfileLog {
  id: string;
  date: string; // YYYY-MM-DD (Recommended: 1st of every month)
  age?: number | null;
  gender?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  weightGoal?: MeasurementGoal;
  stomachCircumferenceCm?: number | null;
  stomachGoal?: MeasurementGoal;
  thighCircumferenceCm?: number | null;
  thighGoal?: MeasurementGoal;
  bicepsCircumferenceCm?: number | null;
  bicepsGoal?: MeasurementGoal;
  jawlineVisibility?: number | null; // Scale 1 to 10
  jawlineGoal?: 'IMPROVE' | 'MAINTAIN' | 'NONE';
  focusItems?: string[]; // Top 3 items to focus on
  notes?: string;
  createdAt?: number;
  updatedAt?: number;
}

export type TabVisibilityMap = Record<ActiveTab, boolean>;

