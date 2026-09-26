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
  try {
    const res = await fetch('/api/gemini/parse-expense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, accounts, vehicles })
    });

    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Backend unavailable (e.g. running on GitHub Pages static host or offline)
  }

  // Graceful client-side fallback
  const fallback = parseExpenseHeuristicClient(text, accounts, vehicles);
  return { result: fallback, source: 'heuristic' };
}

export async function scanDocumentWithAI(
  imageBase64: string, 
  mimeType: string = 'image/jpeg'
): Promise<{ result: ScanDocResult }> {
  try {
    const res = await fetch('/api/gemini/scan-doc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mimeType })
    });

    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with ${res.status}`);
  } catch (err: any) {
    throw new Error(
      err.message || 
      'Document OCR requires the active Chuvadi server backend with Gemini API enabled.'
    );
  }
}

export async function chatWithAI(
  message: string, 
  context: Record<string, any>
): Promise<{ reply: string; isFallback?: boolean }> {
  try {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.reply) {
        return {
          reply: data.reply,
          isFallback: data.source === 'offline-advisory'
        };
      }
    }
  } catch {
    // Network / backend unavailable (e.g. static GitHub Pages host or offline)
  }

  // Generate intelligent on-device Chuvadi financial intelligence response
  const offlineReply = generateLocalFinancialAdvice(message, context);
  return { reply: offlineReply, isFallback: true };
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
): Promise<{ reply: string; isFallback?: boolean }> {
  return await chatWithAI(message, context);
}

// Client-side rule-based expense parser fallback
export function parseExpenseHeuristicClient(
  text: string, 
  accounts: Account[], 
  vehicles: Vehicle[]
): ParsedExpenseResult {
  const lower = text.toLowerCase();

  // Extract amount
  const amtMatch = text.match(/(?:rs\.?|inr|₹)?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)/i);
  let amount = 0;
  if (amtMatch) {
    amount = parseFloat(amtMatch[1].replace(/,/g, ''));
  }

  let type: 'EXPENSE' | 'INCOME' | 'TRANSFER' = 'EXPENSE';
  if (lower.includes('received') || lower.includes('salary') || lower.includes('income') || lower.includes('credit') || lower.includes('cashback')) {
    type = 'INCOME';
  } else if (lower.includes('transfer') || lower.includes('sent to my') || lower.includes('moved to')) {
    type = 'TRANSFER';
  }

  // Detect category
  let category = 'Other';
  let isFuel = false;
  let fuelLiters: number | null = null;

  if (lower.includes('petrol') || lower.includes('diesel') || lower.includes('fuel') || lower.includes('gas') || lower.includes('cng')) {
    category = 'Fuel';
    isFuel = true;
    const ltrMatch = text.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:l|ltr|liter|litres)/i);
    if (ltrMatch) fuelLiters = parseFloat(ltrMatch[1]);
  } else if (lower.includes('food') || lower.includes('dinner') || lower.includes('lunch') || lower.includes('breakfast') || lower.includes('hotel') || lower.includes('restaurant') || lower.includes('coffee') || lower.includes('tea') || lower.includes('biryani')) {
    category = 'Food & Dining';
  } else if (lower.includes('grocery') || lower.includes('groceries') || lower.includes('milk') || lower.includes('vegetable') || lower.includes('supermarket')) {
    category = 'Groceries';
  } else if (lower.includes('service') || lower.includes('mechanic') || lower.includes('oil change') || lower.includes('puncture') || lower.includes('tyre') || lower.includes('wash')) {
    category = 'Vehicle Maintenance';
  } else if (lower.includes('recharge') || lower.includes('electricity') || lower.includes('eb bill') || lower.includes('water') || lower.includes('wifi') || lower.includes('broadband')) {
    category = 'Utilities';
  } else if (lower.includes('amazon') || lower.includes('flipkart') || lower.includes('myntra') || lower.includes('shopping') || lower.includes('cloth') || lower.includes('shirt')) {
    category = 'Shopping';
  } else if (lower.includes('medicine') || lower.includes('hospital') || lower.includes('doctor') || lower.includes('pharmacy') || lower.includes('clinic')) {
    category = 'Healthcare';
  }

  // Find matched account
  let fromAccountId: string | null = null;
  let toAccountId: string | null = null;
  for (const acc of accounts) {
    if (acc.name && lower.includes(acc.name.toLowerCase())) {
      if (type === 'INCOME') {
        toAccountId = acc.id;
      } else {
        fromAccountId = acc.id;
      }
      break;
    }
  }

  if (!fromAccountId && accounts.length > 0 && type !== 'INCOME') {
    fromAccountId = accounts[0].id;
  }
  if (!toAccountId && accounts.length > 0 && type === 'INCOME') {
    toAccountId = accounts[0].id;
  }

  // Find matched vehicle
  let vehicleId: string | null = null;
  for (const veh of vehicles) {
    if (veh.name && lower.includes(veh.name.toLowerCase())) {
      vehicleId = veh.id;
      break;
    }
  }
  if (!vehicleId && vehicles.length > 0 && (isFuel || category === 'Vehicle Maintenance')) {
    vehicleId = vehicles[0].id;
  }

  return {
    type,
    amount,
    description: text.trim().slice(0, 100),
    category,
    fromAccountId,
    toAccountId,
    vehicleId,
    isFuel,
    fuelLiters,
    odometer: null,
    notes: 'Parsed via Chuvadi local engine'
  };
}

// Client-side local financial advisor intelligence
export function generateLocalFinancialAdvice(
  message: string, 
  context: Record<string, any>
): string {
  const lower = message.toLowerCase().trim();
  const accounts: Account[] = context.accounts || [];
  const vehicles: Vehicle[] = context.vehicles || [];
  const transactions: any[] = context.transactions || context.recentTransactions || [];
  const todos: any[] = context.todos || context.pendingTodos || [];
  const exerciseLogs: any[] = context.exerciseLogs || [];
  const bodyProfileLogs: any[] = context.bodyProfileLogs || [];
  const menstrualLogs: any[] = context.menstrualLogs || [];
  const menstrualSettings: any = context.menstrualSettings || {};
  const calendarEvents: any[] = context.calendarEvents || [];
  const entities: any[] = context.entities || [];

  const totalBalance = accounts.reduce((acc, a) => acc + (Number(a.balance) || 0), 0);
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM

  const currentMonthTxns = transactions.filter(t => (t.date || '').startsWith(currentMonth));
  const totalExpense = currentMonthTxns
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalIncome = currentMonthTxns
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // 1. Fitness, Workouts & Body Profile
  if (lower.includes('exercise') || lower.includes('workout') || lower.includes('fitness') || lower.includes('body') || lower.includes('biceps') || lower.includes('jawline') || lower.includes('waist') || lower.includes('weight')) {
    const latestBody = bodyProfileLogs[0];
    let bodyText = '';
    if (latestBody) {
      bodyText = `\n\n### 📐 Latest Body Profile Snapshot (${latestBody.date}):\n* **Weight:** ${latestBody.weightKg ? `${latestBody.weightKg} kg` : '—'} *(Goal: ${latestBody.weightGoal || 'Maintain'})*\n* **Waist / Stomach:** ${latestBody.stomachCircumferenceCm ? `${latestBody.stomachCircumferenceCm} cm` : '—'}\n* **Biceps:** ${latestBody.bicepsCircumferenceCm ? `${latestBody.bicepsCircumferenceCm} cm` : '—'}\n* **Jawline Visibility:** **${latestBody.jawlineVisibility || '—'}/10**\n* **Focus Priorities:** ${latestBody.focusItems ? latestBody.focusItems.join(', ') : 'None specified'}`;
    }

    return `🏋️ **Fitness & Physical Health Overview:**\n\n* **Logged Workouts:** **${exerciseLogs.length}** total sessions\n* **Recent Exercise Activity:** ${exerciseLogs[0]?.description || 'No recent workouts logged.'}${bodyText}\n\n💡 *Note: Add your monthly body measurements on the 1st of every month to track aesthetic recomposition!*`;
  }

  // 2. Wellness & Menstrual Cycle
  if (lower.includes('period') || lower.includes('menstrual') || lower.includes('cycle') || lower.includes('cramp') || lower.includes('ovulat') || lower.includes('wellness')) {
    return `🌸 **Wellness & Cycle Tracker Insights:**\n\n* **Average Cycle Length:** **${menstrualSettings.averageCycleLength || 28} days**\n* **Average Period Duration:** **${menstrualSettings.averagePeriodDuration || 5} days**\n* **Last Logged Period:** ${menstrualSettings.lastPeriodStartDate || 'Not recorded yet'}\n* **Total Wellness Logs:** **${menstrualLogs.length}** daily entries\n\n💡 *Tip: Head to the Wellness Tracker tab to view your current phase, fertility window, and symptom logs.*`;
  }

  // 3. Calendar, Events & Birthdays
  if (lower.includes('birthday') || lower.includes('anniversary') || lower.includes('calendar') || lower.includes('event')) {
    if (calendarEvents.length === 0) {
      return `📅 **Calendar & Birthdays:** No events currently scheduled.\n\nOpen the **Calendar** tab to register upcoming birthdays, wedding anniversaries, or bill payment reminders!`;
    }

    const items = calendarEvents.slice(0, 5).map(e => `* **${e.title}** (${e.date}) ${e.category ? `[${e.category}]` : ''}`);
    return `📅 **Upcoming Events & Important Dates:**\n\n${items.join('\n')}\n\n${calendarEvents.length > 5 ? `*...and ${calendarEvents.length - 5} more in the Calendar tab.*` : ''}`;
  }

  // 4. Receivables & Payables (Debts / Loans)
  if (lower.includes('debt') || lower.includes('lend') || lower.includes('borrow') || lower.includes('receivable') || lower.includes('payable') || lower.includes('owe')) {
    const receivables = entities.filter(e => e.type === 'RECEIVABLE');
    const payables = entities.filter(e => e.type === 'PAYABLE');
    const totalRecv = receivables.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalPay = payables.reduce((s, e) => s + (Number(e.amount) || 0), 0);

    return `🤝 **Debts & Cash Flow Positions:**\n\n* 📥 **Money Owed to You (Receivables):** ₹${totalRecv.toLocaleString('en-IN')} across ${receivables.length} people\n* 📤 **Money You Owe (Payables):** ₹${totalPay.toLocaleString('en-IN')} across ${payables.length} people\n* ⚖️ **Net Position:** ₹${(totalRecv - totalPay).toLocaleString('en-IN')}`;
  }

  // 1. Vehicle Renewals Check
  if (lower.includes('renewal') || lower.includes('vehicle') || lower.includes('insurance') || lower.includes('puc')) {
    if (vehicles.length === 0) {
      return `🚗 **Garage Status:** You haven't added any vehicles yet.\n\nHead over to the **Vehicles** tab to register your car or two-wheeler. Once added, I will track your insurance expiries, PUC validity, and service intervals automatically!`;
    }

    const reportLines = vehicles.map(v => {
      const insExpiry = v.insuranceExpiry ? new Date(v.insuranceExpiry) : null;
      const pucExpiry = v.pucExpiry ? new Date(v.pucExpiry) : null;

      let insStatus = 'Not set';
      if (insExpiry) {
        const daysLeft = Math.ceil((insExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) insStatus = `⚠️ EXPIRED (${Math.abs(daysLeft)} days ago)`;
        else if (daysLeft <= 30) insStatus = `⚡ Expiring soon (${daysLeft} days left)`;
        else insStatus = `✅ Valid until ${v.insuranceExpiry} (${daysLeft} days left)`;
      }

      let pucStatus = 'Not set';
      if (pucExpiry) {
        const daysLeft = Math.ceil((pucExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) pucStatus = `⚠️ EXPIRED (${Math.abs(daysLeft)} days ago)`;
        else if (daysLeft <= 15) pucStatus = `⚡ Expiring soon (${daysLeft} days left)`;
        else pucStatus = `✅ Valid until ${v.pucExpiry}`;
      }

      return `• **${v.name}** (${v.vehicleNumber || 'No plate'})\n  - **Insurance:** ${insStatus}\n  - **PUC:** ${pucStatus}\n  - **Odometer:** ${v.currentOdometer ? `${v.currentOdometer.toLocaleString('en-IN')} km` : 'Not recorded'}`;
    });

    return `🚗 **Vehicle Compliance & Renewal Report:**\n\n${reportLines.join('\n\n')}\n\n💡 *Tip: Keep your PUC renewed every 6 or 12 months to avoid high fines.*`;
  }

  // 2. Fuel & Service Breakdown
  if (lower.includes('fuel') || lower.includes('petrol') || lower.includes('diesel') || lower.includes('service')) {
    const fuelTxns = transactions.filter(t => t.isFuel || (t.category || '').toLowerCase() === 'fuel');
    const serviceTxns = transactions.filter(t => (t.category || '').toLowerCase().includes('maintenance') || (t.category || '').toLowerCase().includes('service'));

    const totalFuelSpend = fuelTxns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalFuelLiters = fuelTxns.reduce((sum, t) => sum + (Number(t.fuelLiters) || 0), 0);
    const totalServiceSpend = serviceTxns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    return `⛽ **Fuel & Garage Expense Breakdown:**\n\n• **Total Fuel Expenses:** ₹${totalFuelSpend.toLocaleString('en-IN')}\n• **Total Fuel Logged:** ${totalFuelLiters.toFixed(1)} Litres across ${fuelTxns.length} fill-ups\n• **Maintenance & Repairs:** ₹${totalServiceSpend.toLocaleString('en-IN')} across ${serviceTxns.length} service logs\n\n📊 *Total Vehicle Investment:* ₹${(totalFuelSpend + totalServiceSpend).toLocaleString('en-IN')}`;
  }

  // 3. Summary / Net Worth / Financial Health
  if (lower.includes('summary') || lower.includes('balance') || lower.includes('net worth') || lower.includes('ledger') || lower.includes('account')) {
    const accountsList = accounts.length > 0
      ? accounts.map(a => `• **${a.name}** (${a.type}): ₹${(Number(a.balance) || 0).toLocaleString('en-IN')}`).join('\n')
      : '• No accounts added yet';

    return `📊 **Chuvadi Financial Ledger Snapshot:**\n\n💰 **Total Net Balance:** ₹${totalBalance.toLocaleString('en-IN')}\n\n**Account Balances:**\n${accountsList}\n\n**This Month (${currentMonth}):**\n• 📥 **Income:** ₹${totalIncome.toLocaleString('en-IN')}\n• 📤 **Expenses:** ₹${totalExpense.toLocaleString('en-IN')}\n• 📈 **Net Cashflow:** ₹${(totalIncome - totalExpense).toLocaleString('en-IN')}`;
  }

  // 4. Checklists & To-dos
  if (lower.includes('todo') || lower.includes('checklist') || lower.includes('pending') || lower.includes('task')) {
    const pending = todos.filter(t => !t.completed);
    if (pending.length === 0) {
      return `✅ **Checklists All Clear!**\n\nYou have no pending tasks or reminders. All items in your checklists have been completed. Great job staying organized!`;
    }

    const items = pending.slice(0, 5).map(t => `• ${t.title || t.text} ${t.dueDate ? `*(Due: ${t.dueDate})*` : ''}`).join('\n');
    return `📝 **Pending Checklist Reminders (${pending.length} remaining):**\n\n${items}\n\n${pending.length > 5 ? `*...and ${pending.length - 5} more in the Checklists tab.*` : ''}`;
  }

  // 5. Greeting / Intro
  if (lower === 'hi' || lower === 'hello' || lower === 'hey' || lower.includes('namaste') || lower.includes('vanakkam')) {
    const activeAccCount = accounts.length;
    const activeVehCount = vehicles.length;

    return `Namaste! 🙏 I am your **Chuvadi Intelligence Advisor**.\n\nHere is your current life OS summary at a glance:\n• 💰 **Total Net Balance:** ₹${totalBalance.toLocaleString('en-IN')} across ${activeAccCount} account${activeAccCount === 1 ? '' : 's'}\n• 🚗 **Garage:** ${activeVehCount} vehicle${activeVehCount === 1 ? '' : 's'} monitored\n• 📤 **This Month Expenses:** ₹${totalExpense.toLocaleString('en-IN')}\n\nYou can ask me:\n1. *"Summary"* — for an in-depth financial breakdown\n2. *"Vehicle renewals check"* — to audit insurance & PUC deadlines\n3. *"Fuel breakdown"* — to see mileage and fuel costs\n4. Or record any expense in plain English!`;
  }

  // 6. General / Fallback Financial Advice
  const savingsRate = totalIncome > 0 ? (((totalIncome - totalExpense) / totalIncome) * 100).toFixed(0) : '0';
  return `💡 **Chuvadi Advisor Insights:**\n\n• **Current Net Worth:** ₹${totalBalance.toLocaleString('en-IN')}\n• **Monthly Spending:** ₹${totalExpense.toLocaleString('en-IN')} vs Income: ₹${totalIncome.toLocaleString('en-IN')}\n• **Estimated Savings Rate:** ${savingsRate}%\n\n**Financial Tip:** Maintain an emergency reserve equal to at least 3-6 months of expenses in your high-liquidity bank or savings accounts.\n\nFeel free to tap any of the quick buttons above or ask about specific accounts, fuel expenses, or vehicle renewals!`;
}
