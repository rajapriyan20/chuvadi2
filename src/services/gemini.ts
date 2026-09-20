/**
 * Client service calling the backend Express Gemini API proxy
 */
import type { Account, Vehicle } from '../types';

export interface ParsedExpenseResult {
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  amount: number;
  description: string;
  category: string;
  fromAccountId?: string | null;
  toAccountId?: string | null;
  vehicleId?: string | null;
  isFuel?: boolean;
  fuelLiters?: number | null;
  odometer?: number | null;
  notes?: string;
}

export interface ScanDocResult {
  docType: 'RECEIPT' | 'VEHICLE_INSURANCE' | 'VEHICLE_PUC' | 'SERVICE_BILL' | 'UNKNOWN';
  summary: string;
  date?: string | null;
  amount?: number | null;
  vendorOrMerchant?: string | null;
  category?: string | null;
  lineItems?: Array<{ name: string; amount: number }> | null;
  vehicleDetails?: {
    vehicleNumber?: string | null;
    policyOrCertNumber?: string | null;
    expiryDate?: string | null;
    premiumAmount?: number | null;
    issuerName?: string | null;
    odometerReading?: number | null;
  } | null;
}

export async function parseExpenseWithAI(
  text: string, 
  accounts: Account[], 
  vehicles: Vehicle[]
): Promise<{ result: ParsedExpenseResult; source: 'gemini' | 'heuristic' }> {
  const res = await fetch('/api/gemini/parse-expense', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, accounts, vehicles })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with ${res.status}`);
  }

  return res.json();
}

export async function scanDocumentWithAI(
  imageBase64: string, 
  mimeType: string = 'image/jpeg'
): Promise<{ result: ScanDocResult }> {
  const res = await fetch('/api/gemini/scan-doc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with ${res.status}`);
  }

  return res.json();
}

export async function chatWithAI(
  message: string, 
  context: Record<string, any>
): Promise<{ reply: string }> {
  const res = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, context })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with ${res.status}`);
  }

  return res.json();
}

/**
 * Convenient wrappers for AI Assistant UI components
 */
export async function parseNaturalLanguageExpense(
  text: string,
  accounts: Account[],
  vehicles: Vehicle[]
): Promise<ParsedExpenseResult> {
  const data = await parseExpenseWithAI(text, accounts, vehicles);
  return data.result;
}

export async function scanDocumentOrReceipt(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<any> {
  const data = await scanDocumentWithAI(imageBase64, mimeType);
  const r = data.result;
  return {
    category: r.category || 'Scanned Bill',
    merchant: r.vendorOrMerchant || r.summary || 'Merchant',
    amount: r.amount || (r.vehicleDetails?.premiumAmount) || 0,
    date: r.date || new Date().toISOString().split('T')[0],
    notes: r.summary || (r.lineItems ? r.lineItems.map(i => `${i.name}: ₹${i.amount}`).join(', ') : '')
  };
}

export async function chatWithFinancialAdvisor(
  message: string,
  context: Record<string, any>
): Promise<string> {
  const data = await chatWithAI(message, context);
  return data.reply;
}
