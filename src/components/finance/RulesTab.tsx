import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Filter, 
  Sparkles, 
  Check, 
  HelpCircle, 
  FileCode, 
  Copy, 
  ExternalLink,
  ChevronRight,
  Lightbulb
} from 'lucide-react';
import type { Account, GmailFilterRule, FieldSuggestionRule } from '../../types';
import { DEFAULT_CATEGORIES } from '../../utils/formatters';

interface RulesTabProps {
  accounts: Account[];
  filterRules: GmailFilterRule[];
  fieldRules: FieldSuggestionRule[];
  onSaveFilterRules: (rules: GmailFilterRule[]) => void;
  onSaveFieldRules: (rules: FieldSuggestionRule[]) => void;
}

export const RulesTab: React.FC<RulesTabProps> = ({
  accounts,
  filterRules,
  fieldRules,
  onSaveFilterRules,
  onSaveFieldRules
}) => {
  // New Filter Rule form state
  const [newFilterName, setNewFilterName] = useState('');
  const [newFilterQuery, setNewFilterQuery] = useState('');
  const [showAddFilter, setShowAddFilter] = useState(false);

  // New Field Suggestion Rule form state
  const [newKeyword, setNewKeyword] = useState('');
  const [newTargetType, setNewTargetType] = useState<'ACCOUNT' | 'CATEGORY'>('ACCOUNT');
  const [newTargetValue, setNewTargetValue] = useState(accounts[0]?.id || '');
  const [newLabel, setNewLabel] = useState('');
  const [showAddFieldRule, setShowAddFieldRule] = useState(false);

  // Apps Script code copy state
  const [copiedScript, setCopiedScript] = useState(false);
  const [showAppsScriptModal, setShowAppsScriptModal] = useState(false);

  // Handlers for Filter Rules
  const handleToggleFilterRule = (id: string) => {
    const updated = filterRules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
    onSaveFilterRules(updated);
  };

  const handleDeleteFilterRule = (id: string) => {
    const updated = filterRules.filter(r => r.id !== id);
    onSaveFilterRules(updated);
  };

  const handleAddFilterRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilterQuery.trim()) return;

    const newRule: GmailFilterRule = {
      id: `rule_${Date.now()}`,
      name: newFilterName.trim() || newFilterQuery.trim(),
      query: newFilterQuery.trim(),
      enabled: true,
      createdAt: Date.now()
    };

    onSaveFilterRules([...filterRules, newRule]);
    setNewFilterName('');
    setNewFilterQuery('');
    setShowAddFilter(false);
  };

  // Handlers for Field Rules
  const handleToggleFieldRule = (id: string) => {
    const updated = fieldRules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
    onSaveFieldRules(updated);
  };

  const handleDeleteFieldRule = (id: string) => {
    const updated = fieldRules.filter(r => r.id !== id);
    onSaveFieldRules(updated);
  };

  const handleAddFieldRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;

    const targetVal = newTargetType === 'ACCOUNT' 
      ? (newTargetValue || accounts[0]?.id || '')
      : (newTargetValue || DEFAULT_CATEGORIES[0]);

    const targetName = newTargetType === 'ACCOUNT' 
      ? accounts.find(a => a.id === targetVal)?.name || 'Selected Account'
      : targetVal;

    const newRule: FieldSuggestionRule = {
      id: `field_${Date.now()}`,
      keyword: newKeyword.trim(),
      targetType: newTargetType,
      targetValue: targetVal,
      label: newLabel.trim() || `"${newKeyword.trim()}" -> ${targetName}`,
      enabled: true,
      createdAt: Date.now()
    };

    onSaveFieldRules([...fieldRules, newRule]);
    setNewKeyword('');
    setNewLabel('');
    setShowAddFieldRule(false);
  };

  // Pre-formatted Apps Script snippet for users wishing to automate or forward Gmail notifications
  const appsScriptCode = `/**
 * Google Apps Script - Chuvadi Auto-Labeler & Expense Webhook
 * Set this up at script.google.com to auto-tag banking emails with label "Chuvadi"
 */
function processChuvadiBankingEmails() {
  const query = 'newer_than:1d (from:alerts@hdfcbank.net OR from:alerts@hdfcbank.bank.in OR from:bankingalerts@icicibank.com OR from:alerts@axisbank.com OR from:orders@swiggy.in OR from:noreply@zomato.com)';
  const threads = GmailApp.search(query);
  
  let label = GmailApp.getUserLabelByName("Chuvadi-Expenses");
  if (!label) {
    label = GmailApp.createLabel("Chuvadi-Expenses");
  }

  for (let i = 0; i < threads.length; i++) {
    const thread = threads[i];
    thread.addLabel(label);
    Logger.log("Processed thread: " + thread.getFirstMessageSubject());
  }
}

// Trigger this function hourly under Triggers -> Add Trigger -> Time-driven -> Every hour.
`;

  const copyAppsScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="space-y-6 pt-2">
      {/* Overview Banner */}
      <div className="p-4 bg-[#121820] rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Filter size={16} className="text-amber-400" />
            <span>Gmail Expense Rules & Suggestion Engine</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Configure two levels of rules: <strong>Fetch Filters</strong> determine which emails to pull from your Gmail inbox (e.g. bank or delivery alerts from the last 30 days). <strong>Field Suggestion Rules</strong> automatically map keywords like card numbers or merchants to your accounts and expense categories.
          </p>
        </div>
        <button
          onClick={() => setShowAppsScriptModal(true)}
          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 shrink-0 border border-slate-700 transition"
        >
          <FileCode size={14} className="text-amber-400" />
          <span>Gmail / AppsScript Guide</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Main Gmail Fetch Filters */}
        <div className="bg-[#131922] rounded-3xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-mono text-xs font-bold">1</span>
              <div>
                <h4 className="text-xs font-bold text-white">Main Gmail Fetch Filters</h4>
                <p className="text-[11px] text-slate-400">Search queries sent to Gmail API (scoped to last 30 days)</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddFilter(true)}
              className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition shadow-sm"
            >
              <Plus size={14} />
              <span>Add Query</span>
            </button>
          </div>

          {/* Add Filter Form Modal/Inline */}
          {showAddFilter && (
            <form onSubmit={handleAddFilterRule} className="p-4 bg-[#0d1218] rounded-2xl border border-amber-500/30 space-y-3">
              <div className="text-xs font-bold text-amber-300">Add Gmail Fetch Rule</div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Friendly Label</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank Alerts"
                  value={newFilterName}
                  onChange={(e) => setNewFilterName(e.target.value)}
                  className="w-full bg-[#121820] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Gmail Search Query *</label>
                <input
                  type="text"
                  required
                  placeholder='e.g. from:"alerts@hdfcbank.bank.in" OR from:"alerts@hdfcbank.net"'
                  value={newFilterQuery}
                  onChange={(e) => setNewFilterQuery(e.target.value)}
                  className="w-full bg-[#121820] border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Supports standard Gmail operators (from:, subject:, "exact phrase")</span>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddFilter(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400"
                >
                  Save Query
                </button>
              </div>
            </form>
          )}

          {/* Filter Rules List */}
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {filterRules.map(rule => (
              <div
                key={rule.id}
                className={`p-3 rounded-2xl border transition flex items-start justify-between gap-3 ${
                  rule.enabled ? 'bg-[#161c26] border-slate-800' : 'bg-[#0d1218] border-slate-800/50 opacity-60'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={() => handleToggleFilterRule(rule.id)}
                    className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 cursor-pointer accent-amber-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">{rule.name}</div>
                    <code className="text-[11px] font-mono text-amber-300/90 break-all block mt-0.5">
                      {rule.query}
                    </code>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteFilterRule(rule.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                  title="Delete query"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-[#0e141c] border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
            <Lightbulb size={14} className="text-amber-400 shrink-0" />
            <span>Example: <code>from:"alerts@hdfcbank.bank.in"</code> fetches all HDFC transaction alerts.</span>
          </div>
        </div>

        {/* Section 2: Field Suggestion Rules */}
        <div className="bg-[#131922] rounded-3xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono text-xs font-bold">2</span>
              <div>
                <h4 className="text-xs font-bold text-white">Field Suggestion Rules</h4>
                <p className="text-[11px] text-slate-400">Match text in email to auto-fill Account or Category</p>
              </div>
            </div>
            <button
              onClick={() => {
                setNewTargetType('ACCOUNT');
                setNewTargetValue(accounts[0]?.id || '');
                setShowAddFieldRule(true);
              }}
              className="px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition shadow-sm"
            >
              <Plus size={14} />
              <span>Add Rule</span>
            </button>
          </div>

          {/* Add Field Rule Form */}
          {showAddFieldRule && (
            <form onSubmit={handleAddFieldRule} className="p-4 bg-[#0d1218] rounded-2xl border border-emerald-500/30 space-y-3">
              <div className="text-xs font-bold text-emerald-300">Add Field Suggestion Rule</div>
              
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  If email contains text (case-insensitive) *
                </label>
                <input
                  type="text"
                  required
                  placeholder='e.g. "HDFC Bank Credit Card ending 5304" or "biryani"'
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  className="w-full bg-[#121820] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Then Auto-Suggest</label>
                  <select
                    value={newTargetType}
                    onChange={(e) => {
                      const type = e.target.value as 'ACCOUNT' | 'CATEGORY';
                      setNewTargetType(type);
                      setNewTargetValue(type === 'ACCOUNT' ? (accounts[0]?.id || '') : DEFAULT_CATEGORIES[0]);
                    }}
                    className="w-full bg-[#121820] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ACCOUNT">Bank / Card Account</option>
                    <option value="CATEGORY">Expense Category</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    {newTargetType === 'ACCOUNT' ? 'Select Existing Account' : 'Select Category'}
                  </label>
                  {newTargetType === 'ACCOUNT' ? (
                    <select
                      value={newTargetValue}
                      onChange={(e) => setNewTargetValue(e.target.value)}
                      className="w-full bg-[#121820] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.type})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={newTargetValue}
                      onChange={(e) => setNewTargetValue(e.target.value)}
                      className="w-full bg-[#121820] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      {DEFAULT_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Friendly Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Card 5304 -> HDFC Millennia"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full bg-[#121820] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddFieldRule(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400"
                >
                  Save Suggestion Rule
                </button>
              </div>
            </form>
          )}

          {/* Field Rules List */}
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {fieldRules.map(rule => {
              const matchedAccount = accounts.find(a => a.id === rule.targetValue);
              const targetDisplayName = rule.targetType === 'ACCOUNT'
                ? (matchedAccount ? matchedAccount.name : 'Account not found')
                : rule.targetValue;

              return (
                <div
                  key={rule.id}
                  className={`p-3 rounded-2xl border transition flex items-start justify-between gap-3 ${
                    rule.enabled ? 'bg-[#161c26] border-slate-800' : 'bg-[#0d1218] border-slate-800/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => handleToggleFieldRule(rule.id)}
                      className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0 cursor-pointer accent-emerald-500"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">contains "{rule.keyword}"</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                          rule.targetType === 'ACCOUNT'
                            ? 'bg-sky-500/10 text-sky-300 border-sky-500/20'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                        }`}>
                          {rule.targetType === 'ACCOUNT' ? 'Account' : 'Category'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <ChevronRight size={12} className="text-slate-500" />
                        <span className="text-slate-200 font-semibold">{targetDisplayName}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteFieldRule(rule.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                    title="Delete rule"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-[#0e141c] border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
            <Sparkles size={14} className="text-emerald-400 shrink-0" />
            <span>Example: <code>biryani</code> automatically selects <strong>Food & Dining</strong>.</span>
          </div>
        </div>
      </div>

      {/* Modal: Google Apps Script & External Automation Guide */}
      {showAppsScriptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121820] w-full max-w-2xl rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#161d26]">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <FileCode size={18} />
                <span>External Automation: Gmail & Google Apps Script Setup</span>
              </div>
              <button
                onClick={() => setShowAppsScriptModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs text-slate-300">
              <p>
                <strong>No external code is strictly required!</strong> Chuvadi fetches and parses emails directly using the official Gmail API right within this tab.
              </p>
              <p>
                However, if you want an automated background Google Apps Script to label, organize, or forward expense alerts automatically in Gmail, follow these 3 steps:
              </p>

              <div className="space-y-3 bg-[#0a0e14] p-4 rounded-2xl border border-slate-800">
                <div className="font-semibold text-white">Step 1: Open Google Apps Script</div>
                <p className="text-slate-400">
                  Go to <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline inline-flex items-center gap-1">script.google.com <ExternalLink size={11} /></a> and click <strong>New Project</strong>.
                </p>

                <div className="font-semibold text-white">Step 2: Paste this Code</div>
                <div className="relative">
                  <pre className="p-3 bg-[#161d26] rounded-xl border border-slate-800 text-[11px] font-mono text-amber-200 overflow-x-auto max-h-48">
                    {appsScriptCode}
                  </pre>
                  <button
                    onClick={copyAppsScript}
                    className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center gap-1 hover:bg-amber-400 transition"
                  >
                    {copiedScript ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedScript ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>

                <div className="font-semibold text-white">Step 3: Set an Hourly Trigger</div>
                <p className="text-slate-400">
                  Click the <strong>Triggers</strong> (clock icon) in the left bar &gt; click <strong>Add Trigger</strong> &gt; Select function <code>processChuvadiBankingEmails</code> &gt; Event source: <strong>Time-driven</strong> &gt; Select type: <strong>Hour timer</strong> &gt; Save.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowAppsScriptModal(false)}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
