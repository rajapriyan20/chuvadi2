import React, { useState } from 'react';
import { 
  Mail, 
  Calendar, 
  CreditCard, 
  Tag, 
  Edit3, 
  Eye, 
  AlertCircle,
  Settings as SettingsIcon,
  Check,
  X
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Account, GmailExpenseEmail, FieldSuggestionRule } from '../../types';
import { applyFieldSuggestionRules } from '../../services/gmail';

interface ReviewTabProps {
  accounts: Account[];
  emails: GmailExpenseEmail[];
  fieldRules?: FieldSuggestionRule[];
  isLoading: boolean;
  error?: string;
  hasToken: boolean;
  userKey?: string | null;
  onRefreshEmails: () => Promise<void>;
  onConnectGmail?: () => Promise<void>;
  onAddTransactionFromEmail: (email: GmailExpenseEmail) => void;
  onIgnoreEmail: (emailId: string) => void;
  onOpenSettings?: () => void;
  isGuestMode?: boolean;
}

export const ReviewTab: React.FC<ReviewTabProps> = ({
  accounts,
  emails,
  fieldRules = [],
  isLoading,
  error,
  hasToken,
  userKey,
  onRefreshEmails,
  onConnectGmail,
  onAddTransactionFromEmail,
  onIgnoreEmail,
  onOpenSettings,
  isGuestMode = false
}) => {
  const [filterStatus, setFilterStatus] = useState<'PENDING' | 'ADDED' | 'IGNORED' | 'ALL'>('PENDING');
  const [selectedEmailForPreview, setSelectedEmailForPreview] = useState<GmailExpenseEmail | null>(null);

  const filteredEmails = emails.filter(e => {
    if (filterStatus === 'ALL') return true;
    return e.status === filterStatus;
  });

  const pendingCount = emails.filter(e => e.status === 'PENDING').length;
  const addedCount = emails.filter(e => e.status === 'ADDED').length;
  const ignoredCount = emails.filter(e => e.status === 'IGNORED').length;

  return (
    <div className="space-y-3">
      {/* Error / Alert notice (if any) */}
      {error && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 text-amber-200 text-xs animate-fadeIn">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle size={15} className="shrink-0 text-amber-400" />
            <span className="truncate">{error}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition"
              >
                <SettingsIcon size={12} />
                <span>OAuth Settings</span>
              </button>
            )}
            {!hasToken && onConnectGmail && (
              <button
                type="button"
                onClick={onConnectGmail}
                className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-bold text-[11px] hover:bg-amber-400 cursor-pointer transition"
              >
                Connect Gmail
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter Status Bar: Pending Review, Added, Ignored, All */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="inline-flex p-1 bg-[#121820] rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilterStatus('PENDING')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              filterStatus === 'PENDING'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Pending Review</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-bold">
              {pendingCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('ADDED')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              filterStatus === 'ADDED'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Added</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-bold">
              {addedCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('IGNORED')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              filterStatus === 'IGNORED'
                ? 'bg-slate-700 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Ignored</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-bold">
              {ignoredCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filterStatus === 'ALL'
                ? 'bg-slate-700 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>All ({emails.length})</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400 hidden sm:inline">
          Showing {filteredEmails.length} messages
        </span>
      </div>

      {/* Email Items List */}
      {filteredEmails.length === 0 ? (
        <div className="bg-[#131922] rounded-3xl border border-slate-800 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#161d26] text-slate-400 flex items-center justify-center mx-auto border border-slate-800">
            <Mail size={22} />
          </div>
          <h4 className="text-sm font-bold text-white">No Emails Found</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {emails.length === 0 
              ? 'Connect your Gmail account and click "Scan Inbox" to pull transaction alerts according to your rules.'
              : `There are no emails currently marked as ${filterStatus.toLowerCase()}.`}
          </p>
          {!hasToken && onConnectGmail && (
            <button
              type="button"
              onClick={onConnectGmail}
              className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition cursor-pointer"
            >
              Connect Gmail to Get Started
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredEmails.map((email) => {
            const liveSuggestions = applyFieldSuggestionRules(email, fieldRules, accounts);
            const resolvedAccountId = email.suggestedAccountId || liveSuggestions.suggestedAccountId;
            const matchedAccount = accounts.find(a => a.id === resolvedAccountId);
            const displayCategory = email.suggestedCategory || liveSuggestions.suggestedCategory || 'Other';
            const isAdded = email.status === 'ADDED';
            const isIgnored = email.status === 'IGNORED';

            return (
              <div
                key={email.id}
                className={`bg-[#131922] rounded-3xl border p-4 transition duration-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  isAdded
                    ? 'border-emerald-500/20 bg-[#101918]/60 opacity-80'
                    : isIgnored
                    ? 'border-slate-800 bg-[#0d1218]/80 opacity-60'
                    : 'border-slate-800 hover:border-slate-700 bg-[#131922]'
                }`}
              >
                {/* Email Info Left Column */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white truncate max-w-md">
                      {email.subject}
                    </span>
                    {isAdded && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <Check size={10} /> Added to Ledger
                      </span>
                    )}
                    {isIgnored && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        Ignored
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                    <span className="text-slate-300">{email.from}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Calendar size={11} />
                      {formatDate(email.date)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedEmailForPreview(email)}
                      className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px] ml-1 font-medium underline cursor-pointer"
                    >
                      <Eye size={12} />
                      <span>View snippet</span>
                    </button>
                  </div>

                  {/* Suggested Transaction Preview Card */}
                  <div className="mt-2 p-2.5 bg-[#0e131b] rounded-2xl border border-slate-800/80 flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                      <Tag size={12} className="text-amber-400" />
                      <span className="text-amber-300 font-bold">{displayCategory}</span>
                    </div>

                    <div className="text-slate-600">•</div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                      <CreditCard size={12} className="text-sky-400" />
                      <span>{matchedAccount ? matchedAccount.name : 'Choose Account'}</span>
                    </div>

                    <div className="text-slate-600">•</div>

                    <div className="text-xs text-slate-300 font-medium truncate max-w-xs">
                      Desc: <span className="text-white">{email.suggestedDescription || 'Expense'}</span>
                    </div>
                  </div>
                </div>

                {/* Amount & Actions Right Column */}
                <div className="flex md:flex-col items-end justify-between w-full md:w-auto gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/60">
                  <div className="text-left md:text-right">
                    <div className="text-sm font-black font-mono text-rose-400">
                      {email.suggestedAmount && email.suggestedAmount > 0 ? (
                        formatCurrency(email.suggestedAmount)
                      ) : (
                        <span className="text-slate-400 text-xs font-sans">Amount unparsed</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      Suggested Entry
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {email.status !== 'ADDED' && (
                      <button
                        type="button"
                        onClick={() => onAddTransactionFromEmail(email)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm cursor-pointer"
                        title="Open editable transaction dialog to record"
                      >
                        <Edit3 size={13} />
                        <span>Add Transaction</span>
                      </button>
                    )}

                    {email.status !== 'IGNORED' ? (
                      <button
                        type="button"
                        onClick={() => onIgnoreEmail(email.id)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                        title="Mark as Ignore"
                      >
                        <X size={15} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAddTransactionFromEmail(email)}
                        className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Email Body / Snippet Preview Modal */}
      {selectedEmailForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121820] w-full max-w-lg rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#161d26]">
              <div className="text-xs font-bold text-white truncate max-w-sm">
                {selectedEmailForPreview.subject}
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmailForPreview(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-3 overflow-y-auto max-h-[70vh] text-xs">
              <div className="text-[11px] text-slate-400 space-y-1">
                <div><strong>From:</strong> {selectedEmailForPreview.from}</div>
                <div><strong>Date:</strong> {selectedEmailForPreview.date}</div>
              </div>
              <div>
                <strong className="text-slate-300 block mb-1">Snippet:</strong>
                <div className="p-3 bg-[#0a0e14] rounded-xl border border-slate-800 text-slate-300 leading-relaxed font-mono text-[11px]">
                  {selectedEmailForPreview.snippet}
                </div>
              </div>
              {selectedEmailForPreview.bodyText && (
                <div>
                  <strong className="text-slate-300 block mb-1">Extracted Text Content:</strong>
                  <div className="p-3 bg-[#0a0e14] rounded-xl border border-slate-800 text-slate-300 leading-relaxed text-[11px] max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {selectedEmailForPreview.bodyText}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-[#161d26]">
              <button
                type="button"
                onClick={() => {
                  onIgnoreEmail(selectedEmailForPreview.id);
                  setSelectedEmailForPreview(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 text-xs font-semibold cursor-pointer"
              >
                Mark as Ignore
              </button>
              <button
                type="button"
                onClick={() => {
                  onAddTransactionFromEmail(selectedEmailForPreview);
                  setSelectedEmailForPreview(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 cursor-pointer"
              >
                Add Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
