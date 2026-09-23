import React, { useState } from 'react';
import { 
  Mail, 
  RefreshCw, 
  Check, 
  X, 
  ChevronRight, 
  Calendar, 
  CreditCard, 
  Tag, 
  ArrowRight, 
  Edit3, 
  Eye, 
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Filter,
  Settings as SettingsIcon,
  Copy,
  Key,
  Globe
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Account, GmailExpenseEmail, Transaction } from '../../types';
import { 
  authenticateGmail, 
  getEffectiveOAuthClientId, 
  getCustomOAuthClientId, 
  setCustomOAuthClientId,
  setCachedGmailToken
} from '../../services/gmail';

interface ReviewTabProps {
  accounts: Account[];
  emails: GmailExpenseEmail[];
  isLoading: boolean;
  error?: string;
  hasToken: boolean;
  onRefreshEmails: () => Promise<void>;
  onAddTransactionFromEmail: (email: GmailExpenseEmail) => void;
  onIgnoreEmail: (emailId: string) => void;
  onSwitchToRules: () => void;
}

export const ReviewTab: React.FC<ReviewTabProps> = ({
  accounts,
  emails,
  isLoading,
  error,
  hasToken,
  onRefreshEmails,
  onAddTransactionFromEmail,
  onIgnoreEmail,
  onSwitchToRules
}) => {
  const [filterStatus, setFilterStatus] = useState<'PENDING' | 'ADDED' | 'IGNORED' | 'ALL'>('PENDING');
  const [selectedEmailForPreview, setSelectedEmailForPreview] = useState<GmailExpenseEmail | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Settings & troubleshooting modal
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [customClientIdInput, setCustomClientIdInput] = useState(getCustomOAuthClientId());
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [copiedOrigin, setCopiedOrigin] = useState(false);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleConnectGmail = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      await authenticateGmail();
      await onRefreshEmails();
    } catch (err: any) {
      console.error('Connect Gmail failed:', err);
      setAuthError(err?.message || 'Could not connect to Gmail. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = () => {
    setCachedGmailToken(null);
    window.location.reload();
  };

  const handleSaveCustomClientId = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomOAuthClientId(customClientIdInput.trim());
    setShowConfigModal(false);
    setAuthError(null);
  };

  const handleApplyManualToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTokenInput.trim()) return;
    setCachedGmailToken(manualTokenInput.trim());
    setShowConfigModal(false);
    setAuthError(null);
    onRefreshEmails();
  };

  const handleCopyOrigin = () => {
    navigator.clipboard.writeText(currentOrigin);
    setCopiedOrigin(true);
    setTimeout(() => setCopiedOrigin(false), 2000);
  };

  const filteredEmails = emails.filter(e => {
    if (filterStatus === 'ALL') return true;
    return e.status === filterStatus;
  });

  const pendingCount = emails.filter(e => e.status === 'PENDING').length;
  const addedCount = emails.filter(e => e.status === 'ADDED').length;
  const ignoredCount = emails.filter(e => e.status === 'IGNORED').length;

  return (
    <div className="space-y-4 pt-2">
      {/* Top Controls & Auth Banner */}
      <div className="p-4 bg-[#121820] rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Mail size={16} className="text-amber-400" />
              <span>Gmail Inbox Expenses (Last 30 Days)</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              {pendingCount} to review
            </span>
            {hasToken && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Check size={10} /> Connected
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Review parsed transactions from bank alerts and orders from the last 30 days. Edit any field and click <strong>Add Transaction</strong> or <strong>Mark as Ignore</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!hasToken ? (
            <button
              onClick={handleConnectGmail}
              disabled={isAuthenticating}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition active:scale-95 shadow-md"
            >
              <Mail size={15} />
              <span>{isAuthenticating ? 'Connecting...' : 'Connect Gmail Account'}</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => onRefreshEmails()}
                disabled={isLoading}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition active:scale-95 border border-slate-700"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin text-amber-400' : 'text-slate-400'} />
                <span>{isLoading ? 'Scanning Gmail...' : 'Scan 30 Days'}</span>
              </button>
              <button
                onClick={handleDisconnect}
                className="px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-300 text-xs transition border border-slate-800"
                title="Disconnect Gmail session"
              >
                Disconnect
              </button>
            </>
          )}

          <button
            onClick={() => setShowConfigModal(true)}
            className="p-2 rounded-xl bg-[#161c26] hover:bg-slate-800 text-slate-400 hover:text-white transition border border-slate-800"
            title="OAuth Settings & Domain Whitelisting Guide"
          >
            <SettingsIcon size={15} />
          </button>

          <button
            onClick={onSwitchToRules}
            className="px-3 py-2 rounded-xl bg-[#161c26] hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition border border-slate-800"
          >
            <Filter size={13} className="text-amber-400" />
            <span>Configure Rules</span>
          </button>
        </div>
      </div>

      {authError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-2 text-rose-300 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
            <div className="space-y-1">
              <div className="font-bold text-rose-200">Gmail Connection Issue</div>
              <p className="text-[11px] leading-relaxed text-rose-300/90">{authError}</p>
            </div>
          </div>
          <div className="pl-6 flex items-center gap-2 flex-wrap pt-1">
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-bold text-[11px] border border-rose-500/30 flex items-center gap-1.5"
            >
              <SettingsIcon size={12} />
              <span>Configure Domain & OAuth Settings</span>
            </button>
            <button
              onClick={handleConnectGmail}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px]"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {error && !authError && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between gap-2 text-amber-200 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-amber-400" />
            <span>{error}</span>
          </div>
          {!hasToken && (
            <button
              onClick={handleConnectGmail}
              className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px] shrink-0"
            >
              Sign In
            </button>
          )}
        </div>
      )}

      {/* Filter Tabs: Pending, Added, Ignored, All */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="inline-flex p-1 bg-[#121820] rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setFilterStatus('PENDING')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              filterStatus === 'PENDING'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Pending Review</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">{pendingCount}</span>
          </button>
          <button
            onClick={() => setFilterStatus('ADDED')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              filterStatus === 'ADDED'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Added</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">{addedCount}</span>
          </button>
          <button
            onClick={() => setFilterStatus('IGNORED')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              filterStatus === 'IGNORED'
                ? 'bg-slate-700 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Ignored</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">{ignoredCount}</span>
          </button>
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg transition ${
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
        <div className="bg-[#131922] rounded-3xl border border-slate-800 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#161d26] text-slate-400 flex items-center justify-center mx-auto border border-slate-800">
            <Mail size={22} />
          </div>
          <h4 className="text-sm font-bold text-white">No Emails Found</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {emails.length === 0 
              ? 'Connect your Gmail account and click "Scan 30 Days" to pull transaction alerts according to your rules.'
              : `There are no emails currently marked as ${filterStatus.toLowerCase()}.`}
          </p>
          {!hasToken && (
            <button
              onClick={handleConnectGmail}
              className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
            >
              Connect Gmail to Get Started
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEmails.map((email) => {
            const matchedAccount = accounts.find(a => a.id === email.suggestedAccountId);
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
                      onClick={() => setSelectedEmailForPreview(email)}
                      className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px] ml-1 font-medium underline"
                    >
                      <Eye size={12} />
                      <span>View snippet</span>
                    </button>
                  </div>

                  {/* Suggested Transaction Preview Card */}
                  <div className="mt-2 p-2.5 bg-[#0e131b] rounded-2xl border border-slate-800/80 flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                      <Tag size={12} className="text-amber-400" />
                      <span className="text-amber-300 font-bold">{email.suggestedCategory || 'Other'}</span>
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
                        onClick={() => onAddTransactionFromEmail(email)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                        title="Open editable transaction dialog to record"
                      >
                        <Edit3 size={13} />
                        <span>Add Transaction</span>
                      </button>
                    )}

                    {email.status !== 'IGNORED' ? (
                      <button
                        onClick={() => onIgnoreEmail(email.id)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-300 transition"
                        title="Mark as Ignore"
                      >
                        <X size={15} />
                      </button>
                    ) : (
                      <button
                        onClick={() => onAddTransactionFromEmail(email)}
                        className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
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
                onClick={() => setSelectedEmailForPreview(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                ✕
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
                onClick={() => {
                  onIgnoreEmail(selectedEmailForPreview.id);
                  setSelectedEmailForPreview(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 text-xs font-semibold"
              >
                Mark as Ignore
              </button>
              <button
                onClick={() => {
                  onAddTransactionFromEmail(selectedEmailForPreview);
                  setSelectedEmailForPreview(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400"
              >
                Add Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OAuth & Domain Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121820] w-full max-w-xl rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#161d26]">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Globe size={18} />
                <span>Google OAuth & Domain Whitelist Guide</span>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs text-slate-300">
              {/* Domain Whitelisting Box */}
              <div className="p-4 bg-[#0a0e14] rounded-2xl border border-slate-800 space-y-2">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>Your Current Hosting Origin / Domain</span>
                  <button
                    onClick={handleCopyOrigin}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-bold flex items-center gap-1 transition"
                  >
                    {copiedOrigin ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copiedOrigin ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <code className="text-amber-300 font-mono text-[11px] block p-2 bg-[#141b24] rounded-xl border border-slate-800 select-all">
                  {currentOrigin}
                </code>
                <p className="text-[11px] text-slate-400">
                  If hosting on GitHub Pages (<code>{currentHostname}</code>), add this origin to <strong>Authorized JavaScript Origins</strong> in your Google Cloud Console OAuth 2.0 Client credentials.
                </p>
              </div>

              {/* Option 1: Custom Google Cloud OAuth Client ID */}
              <form onSubmit={handleSaveCustomClientId} className="p-4 bg-[#141b24] rounded-2xl border border-slate-800 space-y-3">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Key size={14} className="text-amber-400" />
                  <span>Google Cloud OAuth Client ID</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  The client ID used for client-side Google Identity Services. Leave blank to use the default applet client.
                </p>
                <input
                  type="text"
                  placeholder="e.g. 123456789-abcdef.apps.googleusercontent.com"
                  value={customClientIdInput}
                  onChange={(e) => setCustomClientIdInput(e.target.value)}
                  className="w-full bg-[#0a0e14] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomClientIdInput('');
                      setCustomOAuthClientId('');
                    }}
                    className="text-[11px] text-slate-400 hover:text-white underline"
                  >
                    Reset to Default
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400"
                  >
                    Save Client ID
                  </button>
                </div>
              </form>

              {/* Option 2: Direct Bearer Token for Testing */}
              <form onSubmit={handleApplyManualToken} className="p-4 bg-[#141b24] rounded-2xl border border-slate-800 space-y-3">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>Direct OAuth Token (Quick Test / Bypass)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Paste a temporary Google OAuth access token (e.g. from Google OAuth Playground) to immediately test email scanning without popup authentication.
                </p>
                <input
                  type="password"
                  placeholder="Paste access token (ya29....)"
                  value={manualTokenInput}
                  onChange={(e) => setManualTokenInput(e.target.value)}
                  className="w-full bg-[#0a0e14] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400"
                  >
                    Apply Token
                  </button>
                </div>
              </form>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
