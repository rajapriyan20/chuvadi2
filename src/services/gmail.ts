/**
 * Gmail Expense Parser & API Service
 * Interacts with Gmail REST API (users/me/messages) to fetch expense / bank alert emails
 * from the last 30 days, parses amounts and descriptions, and runs user-defined rules.
 */

import { auth } from './firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import type { 
  Account, 
  GmailFilterRule, 
  FieldSuggestionRule, 
  GmailExpenseEmail, 
  TransactionType 
} from '../types';

// Scopes required for Gmail readonly access
export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly'
];

// In-memory token cache as required by workspace guidelines
let cachedGmailAccessToken: string | null = null;

export function getCachedGmailToken(): string | null {
  return cachedGmailAccessToken;
}

export function setCachedGmailToken(token: string | null): void {
  cachedGmailAccessToken = token;
}

/**
 * Prompt user to connect Google Account with Gmail.readonly scope and retrieve OAuth Access Token
 */
export async function authenticateGmail(): Promise<string> {
  const provider = new GoogleAuthProvider();
  GMAIL_SCOPES.forEach(scope => provider.addScope(scope));
  // Prompt user for consent to ensure refresh/scope granting
  provider.setCustomParameters({
    prompt: 'consent',
    access_type: 'offline'
  });

  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (!credential?.accessToken) {
    throw new Error('Could not retrieve access token for Gmail API.');
  }

  cachedGmailAccessToken = credential.accessToken;
  return credential.accessToken;
}

// Default filter rules (main Gmail query)
export const DEFAULT_GMAIL_FILTER_RULES: GmailFilterRule[] = [
  {
    id: 'rule_hdfc_bank',
    name: 'HDFC Bank Alerts',
    query: 'from:(alerts@hdfcbank.net OR alerts@hdfcbank.bank.in)',
    enabled: true,
    createdAt: Date.now() - 86400000 * 5
  },
  {
    id: 'rule_icici_bank',
    name: 'ICICI Bank Alerts',
    query: 'from:(bankingalerts@icicibank.com OR alerts@icicibank.com)',
    enabled: true,
    createdAt: Date.now() - 86400000 * 4
  },
  {
    id: 'rule_sbi_axis',
    name: 'SBI & Axis Bank Alerts',
    query: 'from:(alerts@axisbank.com OR donotreply@sbi.co.in)',
    enabled: true,
    createdAt: Date.now() - 86400000 * 3
  },
  {
    id: 'rule_orders_food',
    name: 'Swiggy & Zomato Orders',
    query: 'from:(orders@swiggy.in OR noreply@zomato.com)',
    enabled: true,
    createdAt: Date.now() - 86400000 * 2
  }
];

// Local storage keys
const LS_GMAIL_FILTER_RULES = 'chuvadi_gmail_filter_rules_v1';
const LS_FIELD_SUGGESTION_RULES = 'chuvadi_field_suggestion_rules_v1';
const LS_GMAIL_EMAILS_CACHE = 'chuvadi_gmail_emails_cache_v1';

export function loadGmailFilterRules(): GmailFilterRule[] {
  try {
    const raw = localStorage.getItem(LS_GMAIL_FILTER_RULES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading Gmail filter rules:', e);
  }
  return DEFAULT_GMAIL_FILTER_RULES;
}

export function saveGmailFilterRules(rules: GmailFilterRule[]): void {
  try {
    localStorage.setItem(LS_GMAIL_FILTER_RULES, JSON.stringify(rules));
  } catch (e) {
    console.error('Error saving Gmail filter rules:', e);
  }
}

export function loadFieldSuggestionRules(accounts: Account[] = []): FieldSuggestionRule[] {
  try {
    const raw = localStorage.getItem(LS_FIELD_SUGGESTION_RULES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading field suggestion rules:', e);
  }

  // Seed helpful default field rules
  const hdfcCard = accounts.find(a => a.type === 'CREDIT_CARD' || a.name.toLowerCase().includes('card') || a.name.toLowerCase().includes('hdfc'));
  const bankAcc = accounts.find(a => a.type === 'BANK');

  const defaults: FieldSuggestionRule[] = [
    {
      id: 'field_rule_1',
      keyword: 'Credit Card ending',
      targetType: 'ACCOUNT',
      targetValue: hdfcCard ? hdfcCard.id : (accounts[0]?.id || ''),
      label: 'Credit Card alerts -> Credit Card account',
      enabled: true,
      createdAt: Date.now()
    },
    {
      id: 'field_rule_2',
      keyword: 'biryani',
      targetType: 'CATEGORY',
      targetValue: 'Food & Dining',
      label: 'Contains "biryani" -> Food & Dining',
      enabled: true,
      createdAt: Date.now()
    },
    {
      id: 'field_rule_3',
      keyword: 'swiggy',
      targetType: 'CATEGORY',
      targetValue: 'Food & Dining',
      label: 'Contains "swiggy" -> Food & Dining',
      enabled: true,
      createdAt: Date.now()
    },
    {
      id: 'field_rule_4',
      keyword: 'petrol',
      targetType: 'CATEGORY',
      targetValue: 'Fuel',
      label: 'Contains "petrol" -> Fuel',
      enabled: true,
      createdAt: Date.now()
    },
    {
      id: 'field_rule_5',
      keyword: 'uber',
      targetType: 'CATEGORY',
      targetValue: 'Transportation',
      label: 'Contains "uber" -> Transportation',
      enabled: true,
      createdAt: Date.now()
    }
  ];

  if (bankAcc) {
    defaults.push({
      id: 'field_rule_6',
      keyword: 'debited from A/C',
      targetType: 'ACCOUNT',
      targetValue: bankAcc.id,
      label: 'Debited from A/C -> Bank Account',
      enabled: true,
      createdAt: Date.now()
    });
  }

  return defaults;
}

export function saveFieldSuggestionRules(rules: FieldSuggestionRule[]): void {
  try {
    localStorage.setItem(LS_FIELD_SUGGESTION_RULES, JSON.stringify(rules));
  } catch (e) {
    console.error('Error saving field suggestion rules:', e);
  }
}

export function loadCachedEmails(): GmailExpenseEmail[] {
  try {
    const raw = localStorage.getItem(LS_GMAIL_EMAILS_CACHE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading cached emails:', e);
  }
  return [];
}

export function saveCachedEmails(emails: GmailExpenseEmail[]): void {
  try {
    localStorage.setItem(LS_GMAIL_EMAILS_CACHE, JSON.stringify(emails));
  } catch (e) {
    console.error('Error caching emails:', e);
  }
}

export function markEmailAsAdded(emailId: string, txnId?: string): void {
  const cached = loadCachedEmails();
  const updated = cached.map(e => e.id === emailId ? { ...e, status: 'ADDED' as const, addedTxnId: txnId } : e);
  saveCachedEmails(updated);
}

/**
 * Text extraction helpers for amounts, merchants and dates
 */
function extractAmountFromText(text: string): number | undefined {
  // Common patterns in Indian & Global bank/expense emails:
  // "INR 450.00", "Rs. 1,250", "Rs 500", "debited by 1,400.00", "spent Rs. 350", "amount of Rs 2,500.50", "USD 45.00"
  const regexes = [
    /(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:debited(?:\s+by|\s+for)?|spent|withdrawn|charged|paid)\s*(?:INR|Rs\.?|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:total|amount)\s*(?:of|is|:)?\s*(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /VPA\s+.*?INR\s*([\d,]+(?:\.\d{1,2})?)/i,
    /\b([\d,]+\.\d{2})\b/
  ];

  for (const regex of regexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      const clean = match[1].replace(/,/g, '');
      const parsed = parseFloat(clean);
      if (!isNaN(parsed) && parsed > 0 && parsed < 10000000) {
        return parsed;
      }
    }
  }

  return undefined;
}

function extractMerchantFromText(subject: string, body: string): string {
  // Look for "at <Merchant>", "to <Merchant>", "VPA <merchant>", "Info: <Merchant>"
  const fullText = `${subject} ${body}`;
  const patterns = [
    /(?:at|to|info:?|towards)\s+([A-Za-z0-9\s&'-]{3,35})(?:\s+on|\s+using|\s+via|\.|\,|$)/i,
    /VPA\s+([A-Za-z0-9._-]+@[A-Za-z0-9]+)/i,
    /(?:Swiggy|Zomato|Uber|Ola|Amazon|Flipkart|Blinkit|Zepto|BigBasket|Airtel|Jio|Netflix|Spotify|BookMyShow)/i
  ];

  for (const p of patterns) {
    const m = fullText.match(p);
    if (m) {
      const captured = m[1] || m[0];
      const cleaned = captured.replace(/[\n\r]+/g, ' ').trim();
      if (cleaned.length > 2 && !/^(the|your|a|an|account|card|bank)$/i.test(cleaned)) {
        return cleaned;
      }
    }
  }

  // Fallback to subject line trimmed
  const cleanSubject = subject
    .replace(/^Re:\s*/i, '')
    .replace(/^Fwd:\s*/i, '')
    .replace(/Alert:\s*/i, '')
    .slice(0, 45)
    .trim();

  return cleanSubject || 'Expense';
}

function detectTransactionType(text: string): TransactionType {
  const lower = text.toLowerCase();
  if (lower.includes('credited') || lower.includes('deposited') || lower.includes('received money') || lower.includes('refund received')) {
    return 'INCOME';
  }
  return 'EXPENSE';
}

/**
 * Apply field suggestion rules to parsed email
 */
export function applyFieldSuggestionRules(
  email: { subject: string; bodyText: string; snippet: string },
  rules: FieldSuggestionRule[],
  accounts: Account[]
): { suggestedAccountId?: string; suggestedCategory?: string } {
  const text = `${email.subject} ${email.snippet} ${email.bodyText}`.toLowerCase();
  let suggestedAccountId: string | undefined = undefined;
  let suggestedCategory: string | undefined = undefined;

  for (const rule of rules) {
    if (!rule.enabled || !rule.keyword) continue;
    const kw = rule.keyword.toLowerCase().trim();
    if (!kw) continue;

    if (text.includes(kw)) {
      if (rule.targetType === 'ACCOUNT' && !suggestedAccountId) {
        // Check if account exists
        const exists = accounts.some(a => a.id === rule.targetValue);
        if (exists) {
          suggestedAccountId = rule.targetValue;
        }
      } else if (rule.targetType === 'CATEGORY' && !suggestedCategory) {
        suggestedCategory = rule.targetValue;
      }
    }
  }

  // If no category detected, run general keyword matching
  if (!suggestedCategory) {
    if (/swiggy|zomato|restaurant|cafe|coffee|biryani|dining|burger|pizza|kitchen|food/i.test(text)) {
      suggestedCategory = 'Food & Dining';
    } else if (/petrol|fuel|shell|hpcl|bpcl|ioc|diesel|gas station/i.test(text)) {
      suggestedCategory = 'Fuel';
    } else if (/uber|ola|rapido|metro|irctc|flight|indigo|air india|railway|cab|fastag|toll/i.test(text)) {
      suggestedCategory = 'Transportation';
    } else if (/blinkit|zepto|bigbasket|dmart|grocery|supermarket|vegetable/i.test(text)) {
      suggestedCategory = 'Groceries';
    } else if (/amazon|flipkart|myntra|shopping|apparel|zara|h&m/i.test(text)) {
      suggestedCategory = 'Shopping';
    } else if (/airtel|jio|vi|vodafone|electricity|bescom|tneb|water|broadband|wifi|bill/i.test(text)) {
      suggestedCategory = 'Utilities';
    } else if (/pharmacy|hospital|apollo|medplus|doctor|health|clinic/i.test(text)) {
      suggestedCategory = 'Healthcare';
    } else {
      suggestedCategory = 'Other';
    }
  }

  // Fallback account if still undefined
  if (!suggestedAccountId && accounts.length > 0) {
    if (text.includes('credit card') || text.includes('creditcard')) {
      const card = accounts.find(a => a.type === 'CREDIT_CARD');
      if (card) suggestedAccountId = card.id;
    }
    if (!suggestedAccountId) {
      const bank = accounts.find(a => a.type === 'BANK');
      suggestedAccountId = bank ? bank.id : accounts[0].id;
    }
  }

  return { suggestedAccountId, suggestedCategory };
}

/**
 * Decode base64url encoded Gmail message bodies
 */
function decodeBase64Url(base64Url: string): string {
  try {
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch (e) {
    return '';
  }
}

/**
 * Extract plain text body from a Gmail payload structure
 */
function extractBodyFromPayload(payload: any): string {
  if (!payload) return '';
  if (payload.body && payload.body.data) {
    const raw = decodeBase64Url(payload.body.data);
    // Strip HTML tags if HTML
    return raw.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  }

  if (payload.parts && Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64Url(part.body.data).replace(/\s+/g, ' ').trim();
      }
    }
    // Fallback to text/html
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        const raw = decodeBase64Url(part.body.data);
        return raw.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
      }
      if (part.parts) {
        const sub = extractBodyFromPayload(part);
        if (sub) return sub;
      }
    }
  }

  return '';
}

/**
 * Fetch emails matching active filter rules from the last 30 days
 */
export async function fetchExpenseEmailsFromGmail(
  token: string,
  filterRules: GmailFilterRule[],
  fieldRules: FieldSuggestionRule[],
  accounts: Account[],
  existingCached: GmailExpenseEmail[] = []
): Promise<{ emails: GmailExpenseEmail[]; error?: string }> {
  try {
    const activeRules = filterRules.filter(r => r.enabled && r.query.trim());
    if (activeRules.length === 0) {
      return { emails: existingCached, error: 'No active Gmail filter rules found. Please enable or add at least one filter query in the Rules tab.' };
    }

    // Build combined Gmail search query with 30 day constraint
    // Gmail supports 'newer_than:30d' or 'after:YYYY/MM/DD'
    const combinedFilterQueries = activeRules.map(r => `(${r.query.trim()})`).join(' OR ');
    const fullQuery = `newer_than:30d (${combinedFilterQueries})`;

    const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=${encodeURIComponent(fullQuery)}`;

    const listRes = await fetch(listUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });

    if (!listRes.ok) {
      if (listRes.status === 401) {
        cachedGmailAccessToken = null;
        return { emails: existingCached, error: 'Gmail authentication expired. Please click "Connect Gmail" to sign in again.' };
      }
      const errText = await listRes.text();
      return { emails: existingCached, error: `Failed to fetch messages from Gmail: ${listRes.status} ${errText}` };
    }

    const listData = await listRes.json();
    const messages = listData.messages || [];

    if (messages.length === 0) {
      return { emails: existingCached, error: 'No matching emails found in your Gmail inbox for the last 30 days with the active filter rules.' };
    }

    // Create a lookup of previously handled items to preserve status (ADDED or IGNORED)
    const existingStatusMap = new Map<string, { status: 'PENDING' | 'ADDED' | 'IGNORED'; addedTxnId?: string }>();
    for (const e of existingCached) {
      existingStatusMap.set(e.id, { status: e.status, addedTxnId: e.addedTxnId });
    }

    // Fetch details for up to 30 recent messages
    const messagePromises = messages.slice(0, 30).map(async (msg: { id: string; threadId: string }) => {
      try {
        const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!msgRes.ok) return null;
        return await msgRes.json();
      } catch (err) {
        console.warn(`Error fetching message ${msg.id}:`, err);
        return null;
      }
    });

    const rawMsgs = await Promise.all(messagePromises);
    const parsedEmails: GmailExpenseEmail[] = [];

    for (const raw of rawMsgs) {
      if (!raw || !raw.id) continue;

      const headers: Array<{ name: string; value: string }> = raw.payload?.headers || [];
      const getHeader = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      const subject = getHeader('Subject') || '(No Subject)';
      const from = getHeader('From') || '(Unknown Sender)';
      const rawDate = getHeader('Date');
      
      let dateIso = new Date().toISOString().split('T')[0];
      let timestamp = Number(raw.internalDate) || Date.now();
      if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          dateIso = d.toISOString().split('T')[0];
          timestamp = d.getTime();
        }
      }

      const snippet = raw.snippet || '';
      const bodyText = extractBodyFromPayload(raw.payload);
      const combinedText = `${subject} ${snippet} ${bodyText}`;

      const amount = extractAmountFromText(combinedText);
      const merchant = extractMerchantFromText(subject, bodyText);
      const detectedType = detectTransactionType(combinedText);

      const { suggestedAccountId, suggestedCategory } = applyFieldSuggestionRules(
        { subject, bodyText, snippet },
        fieldRules,
        accounts
      );

      const prevStatus = existingStatusMap.get(raw.id);

      parsedEmails.push({
        id: raw.id,
        threadId: raw.threadId || raw.id,
        subject,
        from,
        date: dateIso,
        snippet,
        bodyText: bodyText.slice(0, 500),
        timestamp,
        suggestedAmount: amount || 0,
        suggestedDate: dateIso,
        suggestedDescription: merchant,
        suggestedCategory: suggestedCategory || 'Other',
        suggestedAccountId: suggestedAccountId || accounts[0]?.id || '',
        suggestedType: detectedType,
        status: prevStatus?.status || 'PENDING',
        addedTxnId: prevStatus?.addedTxnId
      });
    }

    // Sort by date descending
    parsedEmails.sort((a, b) => b.timestamp - a.timestamp);

    // Merge with any cached emails that weren't in the newest batch
    const newIds = new Set(parsedEmails.map(e => e.id));
    for (const old of existingCached) {
      if (!newIds.has(old.id)) {
        parsedEmails.push(old);
      }
    }

    saveCachedEmails(parsedEmails);
    return { emails: parsedEmails };

  } catch (err: any) {
    console.error('fetchExpenseEmailsFromGmail exception:', err);
    return { 
      emails: existingCached, 
      error: err?.message || 'Unexpected error communicating with Gmail API.' 
    };
  }
}
