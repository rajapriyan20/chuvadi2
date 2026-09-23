import React, { useState, useEffect } from 'react';
import { 
  Inbox, 
  Filter, 
  CheckCircle2, 
  Mail, 
  Layers, 
  AlertCircle 
} from 'lucide-react';
import type { 
  Account, 
  Transaction, 
  GmailFilterRule, 
  FieldSuggestionRule, 
  GmailExpenseEmail 
} from '../../types';
import { 
  loadGmailFilterRules, 
  saveGmailFilterRules, 
  loadFieldSuggestionRules, 
  saveFieldSuggestionRules, 
  loadCachedEmails, 
  saveCachedEmails, 
  fetchExpenseEmailsFromGmail, 
  getCachedGmailToken 
} from '../../services/gmail';
import { ReviewTab } from './ReviewTab';
import { RulesTab } from './RulesTab';

interface InboxReviewTabProps {
  accounts: Account[];
  onOpenNewTxnWithDefaults: (suggestedData: Partial<Transaction>, emailId?: string) => void;
}

export const InboxReviewTab: React.FC<InboxReviewTabProps> = ({
  accounts,
  onOpenNewTxnWithDefaults
}) => {
  // Nested sub-tab state: 'review' (default) or 'rules'
  const [activeSubTab, setActiveSubTab] = useState<'review' | 'rules'>('review');

  // Rules and emails state
  const [filterRules, setFilterRules] = useState<GmailFilterRule[]>([]);
  const [fieldRules, setFieldRules] = useState<FieldSuggestionRule[]>([]);
  const [emails, setEmails] = useState<GmailExpenseEmail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  // Initialize rules and cached emails
  useEffect(() => {
    const loadedFilters = loadGmailFilterRules();
    const loadedFields = loadFieldSuggestionRules(accounts);
    const cachedMails = loadCachedEmails();

    setFilterRules(loadedFilters);
    setFieldRules(loadedFields);
    setEmails(cachedMails);
  }, [accounts]);

  // Handler for saving filter rules
  const handleSaveFilterRules = (updatedRules: GmailFilterRule[]) => {
    setFilterRules(updatedRules);
    saveGmailFilterRules(updatedRules);
  };

  // Handler for saving field rules
  const handleSaveFieldRules = (updatedRules: FieldSuggestionRule[]) => {
    setFieldRules(updatedRules);
    saveFieldSuggestionRules(updatedRules);
  };

  // Refresh / Scan emails from Gmail
  const handleScanGmail = async () => {
    const token = getCachedGmailToken();
    if (!token) {
      setErrorMessage('Gmail is not connected. Please click "Connect Gmail Account" to authorize.');
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
        emails
      );

      setEmails(result.emails);
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
    // Open the new transaction modal with populated defaults
    onOpenNewTxnWithDefaults({
      type: email.suggestedType || 'EXPENSE',
      amount: email.suggestedAmount || 0,
      description: email.suggestedDescription || email.subject,
      category: email.suggestedCategory || 'Food & Dining',
      fromAccountId: email.suggestedAccountId || (accounts[0]?.id || ''),
      date: email.suggestedDate || email.date,
      notes: `Imported from Gmail email "${email.subject}" (${email.from})`
    }, email.id);
  };

  // Action: Mark as Ignore
  const handleIgnoreEmail = (emailId: string) => {
    const updated = emails.map(e => e.id === emailId ? { ...e, status: 'IGNORED' as const } : e);
    setEmails(updated);
    saveCachedEmails(updated);
  };

  const pendingCount = emails.filter(e => e.status === 'PENDING').length;

  return (
    <div className="space-y-4">
      {/* 2 Tabs: "Review" and "Rules" */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
        <div className="inline-flex p-1 bg-[#121820] rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('review')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'review'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <CheckCircle2 size={15} />
            <span>Review</span>
            {pendingCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeSubTab === 'review' ? 'bg-black/20 text-slate-950' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('rules')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'rules'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Filter size={15} />
            <span>Rules</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
              {filterRules.filter(r => r.enabled).length + fieldRules.filter(r => r.enabled).length}
            </span>
          </button>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          {activeSubTab === 'review' ? (
            <span>Review suggested expenses & add directly to ledger</span>
          ) : (
            <span>Manage Gmail query filters & field suggestion rules</span>
          )}
        </div>
      </div>

      {/* Tab 1: Review */}
      {activeSubTab === 'review' && (
        <ReviewTab
          accounts={accounts}
          emails={emails}
          isLoading={isLoading}
          error={errorMessage}
          hasToken={!!getCachedGmailToken()}
          onRefreshEmails={handleScanGmail}
          onAddTransactionFromEmail={handleAddTransactionFromEmail}
          onIgnoreEmail={handleIgnoreEmail}
          onSwitchToRules={() => setActiveSubTab('rules')}
        />
      )}

      {/* Tab 2: Rules */}
      {activeSubTab === 'rules' && (
        <RulesTab
          accounts={accounts}
          filterRules={filterRules}
          fieldRules={fieldRules}
          onSaveFilterRules={handleSaveFilterRules}
          onSaveFieldRules={handleSaveFieldRules}
        />
      )}
    </div>
  );
};
