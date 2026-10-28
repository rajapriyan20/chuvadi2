import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  CheckCircle2, 
  Mail, 
  Settings as SettingsIcon,
  RefreshCw,
  X
} from 'lucide-react';
import type { 
  Account, 
  Transaction, 
  GmailFilterRule, 
  FieldSuggestionRule, 
  GmailExpenseEmail 
} from '../../types';
import type { User } from 'firebase/auth';
import { 
  loadGmailFilterRules, 
  saveGmailFilterRules, 
  loadFieldSuggestionRules, 
  saveFieldSuggestionRules, 
  loadCachedEmails, 
  saveCachedEmails, 
  fetchExpenseEmailsFromGmail, 
  getCachedGmailToken,
  setCachedGmailToken,
  authenticateGmail,
  applyFieldSuggestionRules 
} from '../../services/gmail';
import { ReviewTab } from './ReviewTab';
import { RulesTab } from './RulesTab';
import { OAuthSettingsModal } from './OAuthSettingsModal';

interface InboxReviewTabProps {
  accounts: Account[];
  onOpenNewTxnWithDefaults: (suggestedData: Partial<Transaction>, emailId?: string) => void;
  isGuestMode?: boolean;
  user?: User | null;
}

const DEMO_GMAIL_EXPENSES: GmailExpenseEmail[] = [
  {
    id: 'demo-mail-1',
    threadId: 'demo-thread-1',
    subject: 'Order Delivered: Swiggy #8921',
    from: 'no-reply@swiggy.in',
    date: new Date().toISOString().split('T')[0],
    snippet: 'Your order #8921 from Paradise Biryani was delivered. Paid ₹540 via UPI.',
    bodyText: 'Your order #8921 from Paradise Biryani was delivered. Paid ₹540 via UPI.',
    timestamp: Date.now(),
    suggestedAmount: 540,
    suggestedDate: new Date().toISOString().split('T')[0],
    suggestedDescription: 'Swiggy - Paradise Biryani #8921',
    suggestedCategory: 'Food & Dining',
    suggestedType: 'EXPENSE',
    status: 'PENDING'
  },
  {
    id: 'demo-mail-2',
    threadId: 'demo-thread-2',
    subject: 'Transaction Alert: Shell Fuel Station',
    from: 'alerts@hdfcbank.net',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    snippet: 'INR 1,650.00 spent on Card ending 4091 at SHELL VELACHERY CHENNAI.',
    bodyText: 'INR 1,650.00 spent on Card ending 4091 at SHELL VELACHERY CHENNAI.',
    timestamp: Date.now() - 86400000 * 2,
    suggestedAmount: 1650,
    suggestedDate: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    suggestedDescription: 'Shell Fuel Station Velachery',
    suggestedCategory: 'Fuel',
    suggestedType: 'EXPENSE',
    status: 'PENDING'
  },
  {
    id: 'demo-mail-3',
    threadId: 'demo-thread-3',
    subject: 'Amazon.in: Order Confirmation',
    from: 'auto-confirm@amazon.in',
    date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
    snippet: 'Your order of Motorcycle Chain Lube & Cleaner Kit has shipped. Total: ₹899.',
    bodyText: 'Your order of Motorcycle Chain Lube & Cleaner Kit has shipped. Total: ₹899.',
    timestamp: Date.now() - 86400000 * 4,
    suggestedAmount: 899,
    suggestedDate: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
    suggestedDescription: 'Amazon India - Motorcycle Chain Lube & Cleaner',
    suggestedCategory: 'Maintenance',
    suggestedType: 'EXPENSE',
    status: 'PENDING'
  }
];

export const InboxReviewTab: React.FC<InboxReviewTabProps> = ({
  accounts,
  onOpenNewTxnWithDefaults,
  isGuestMode = false,
  user
}) => {
  // Nested sub-tab state: 'review' (default) or 'rules'
  const [activeSubTab, setActiveSubTab] = useState<'review' | 'rules'>('review');

  // Compute active user identifier key
  const userKey = user?.email || user?.uid || (isGuestMode ? 'guest' : null);

  // Rules and emails state
  const [filterRules, setFilterRules] = useState<GmailFilterRule[]>([]);
  const [fieldRules, setFieldRules] = useState<FieldSuggestionRule[]>([]);
  const [emails, setEmails] = useState<GmailExpenseEmail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);

  const hasToken = isGuestMode ? true : !!getCachedGmailToken(userKey);

  // Initialize rules and cached emails for THIS specific user
  useEffect(() => {
    const loadedFilters = loadGmailFilterRules(userKey);
    const loadedFields = loadFieldSuggestionRules(accounts, userKey);
    const cachedMails = loadCachedEmails(userKey);

    setFilterRules(loadedFilters);
    setFieldRules(loadedFields);

    if (cachedMails.length > 0) {
      setEmails(cachedMails);
    } else if (isGuestMode) {
      setEmails(DEMO_GMAIL_EXPENSES);
      saveCachedEmails(DEMO_GMAIL_EXPENSES, userKey);
    } else {
      setEmails([]);
    }
  }, [accounts, isGuestMode, userKey]);

  // Handler for saving filter rules
  const handleSaveFilterRules = (updatedRules: GmailFilterRule[]) => {
    setFilterRules(updatedRules);
    saveGmailFilterRules(updatedRules, userKey);
  };

  // Handler for saving field rules
  const handleSaveFieldRules = (updatedRules: FieldSuggestionRule[]) => {
    setFieldRules(updatedRules);
    saveFieldSuggestionRules(updatedRules, userKey);
  };

  // Connect Gmail account
  const handleConnectGmail = async () => {
    setIsAuthenticating(true);
    setErrorMessage(undefined);
    try {
      await authenticateGmail(userKey);
      await handleScanGmail();
    } catch (err: any) {
      console.error('Connect Gmail failed:', err);
      setErrorMessage(err?.message || 'Could not connect to Gmail. Please check popup permissions.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Disconnect Gmail
  const handleDisconnect = () => {
    setCachedGmailToken(null, userKey);
    window.location.reload();
  };

  // Refresh / Scan emails from Gmail
  const handleScanGmail = async () => {
    if (isGuestMode) {
      setIsLoading(true);
      setTimeout(() => {
        setEmails(DEMO_GMAIL_EXPENSES);
        saveCachedEmails(DEMO_GMAIL_EXPENSES, userKey);
        setIsLoading(false);
      }, 500);
      return;
    }

    const token = getCachedGmailToken(userKey);
    if (!token) {
      setErrorMessage('Gmail is not connected. Please click "Connect Gmail" to authorize.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(undefined);

    try {
      const result = await fetchExpenseEmailsFromGmail(
        token,
        filterRules,
        fieldRules,
        accounts,
        emails,
        userKey
      );

      setEmails(result.emails);
      saveCachedEmails(result.emails, userKey);
      if (result.error) {
        setErrorMessage(result.error);
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMessage(err?.message || 'Failed to scan Gmail inbox.');
    } finally {
      setIsLoading(false);
    }
  };

  // Action: Add Transaction
  const handleAddTransactionFromEmail = (email: GmailExpenseEmail) => {
    const liveSuggestions = applyFieldSuggestionRules(email, fieldRules, accounts);
    const resolvedAccountId = liveSuggestions.suggestedAccountId || email.suggestedAccountId || (accounts[0]?.id || '');
    const resolvedCategory = liveSuggestions.suggestedCategory || email.suggestedCategory || 'Food & Dining';

    onOpenNewTxnWithDefaults({
      type: email.suggestedType || 'EXPENSE',
      amount: email.suggestedAmount || 0,
      description: email.suggestedDescription || email.subject,
      category: resolvedCategory,
      fromAccountId: resolvedAccountId,
      date: email.suggestedDate || email.date,
      notes: `Imported from Gmail email "${email.subject}" (${email.from})`
    }, email.id);
  };

  // Action: Mark as Ignore
  const handleIgnoreEmail = (emailId: string) => {
    const updated = emails.map(e => e.id === emailId ? { ...e, status: 'IGNORED' as const } : e);
    setEmails(updated);
    saveCachedEmails(updated, userKey);
  };

  const pendingCount = emails.filter(e => e.status === 'PENDING').length;

  return (
    <div className="space-y-3">
      {/* Top Header: Sub-tabs (Review | Rules) + Settings Icon + Relocated Action Buttons */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 gap-2 flex-wrap">
        {/* Left: Tab Switcher + Settings Icon directly next to Rules tab */}
        <div className="flex items-center gap-1.5">
          <div className="inline-flex p-1 bg-[#121820] rounded-2xl border border-slate-800">
            <button
              id="subtab-review-btn"
              type="button"
              onClick={() => setActiveSubTab('review')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'review'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <CheckCircle2 size={14} />
              <span>Review</span>
              {pendingCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeSubTab === 'review' ? 'bg-black/20 text-slate-950' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              id="subtab-rules-btn"
              type="button"
              onClick={() => setActiveSubTab('rules')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'rules'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Filter size={14} />
              <span>Rules</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
                {filterRules.filter(r => r.enabled).length + fieldRules.filter(r => r.enabled).length}
              </span>
            </button>
          </div>

          {/* Settings Button moved directly next to the Rules tab */}
          <button
            id="gmail-settings-btn"
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="p-2 rounded-xl bg-[#121820] hover:bg-slate-800 text-slate-400 hover:text-white transition border border-slate-800 cursor-pointer shadow-sm active:scale-95"
            title="Gmail OAuth & Domain Settings"
          >
            <SettingsIcon size={15} />
          </button>
        </div>

        {/* Right: Relocated Action Buttons (Clean & Compact) */}
        {activeSubTab === 'review' && (
          <div className="flex items-center gap-2 flex-wrap">
            {isGuestMode ? (
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Demo Mode
                </span>
                <button
                  type="button"
                  onClick={() => handleScanGmail()}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm cursor-pointer"
                >
                  <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                  <span>{isLoading ? 'Resetting...' : 'Reset Demo'}</span>
                </button>
              </div>
            ) : !hasToken ? (
              <button
                type="button"
                onClick={handleConnectGmail}
                disabled={isAuthenticating}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm cursor-pointer"
              >
                <Mail size={14} />
                <span>{isAuthenticating ? 'Connecting...' : 'Connect Gmail'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Connected
                </span>
                <button
                  type="button"
                  onClick={() => handleScanGmail()}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-xl bg-[#121820] hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 border border-slate-800 cursor-pointer"
                  title="Scan emails from the last 30 days"
                >
                  <RefreshCw size={13} className={isLoading ? 'animate-spin text-amber-400' : 'text-slate-400'} />
                  <span>{isLoading ? 'Scanning...' : 'Scan Inbox'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-2.5 py-1.5 rounded-xl bg-[#121820] hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 text-xs transition border border-slate-800 cursor-pointer"
                  title="Disconnect Gmail session"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* View: Review Email Items */}
      {activeSubTab === 'review' && (
        <ReviewTab
          accounts={accounts}
          emails={emails}
          fieldRules={fieldRules}
          isLoading={isLoading}
          error={errorMessage}
          hasToken={hasToken}
          userKey={userKey}
          onRefreshEmails={handleScanGmail}
          onConnectGmail={handleConnectGmail}
          onAddTransactionFromEmail={handleAddTransactionFromEmail}
          onIgnoreEmail={handleIgnoreEmail}
          onOpenSettings={() => setShowConfigModal(true)}
          isGuestMode={isGuestMode}
        />
      )}

      {/* View: Rules Tab */}
      {activeSubTab === 'rules' && (
        <RulesTab
          accounts={accounts}
          filterRules={filterRules}
          fieldRules={fieldRules}
          onSaveFilterRules={handleSaveFilterRules}
          onSaveFieldRules={handleSaveFieldRules}
        />
      )}

      {/* Global OAuth & Whitelist Settings Modal */}
      <OAuthSettingsModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        userKey={userKey}
        onTokenUpdated={handleScanGmail}
      />
    </div>
  );
};
