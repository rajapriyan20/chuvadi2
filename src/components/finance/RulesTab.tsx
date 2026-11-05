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
  Lightbulb,
  Pencil
} from 'lucide-react';
import type { Account, GmailFilterRule, FieldSuggestionRule, FieldSuggestionRuleType, DescriptionExtractMode } from '../../types';
import { getAllExpenseCategories } from '../../utils/formatters';
import { extractDynamicDescriptionFromText } from '../../services/gmail';

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
  const categories = getAllExpenseCategories();

  // New Filter Rule form state
  const [newFilterName, setNewFilterName] = useState('');
  const [newFilterQuery, setNewFilterQuery] = useState('');
  const [showAddFilter, setShowAddFilter] = useState(false);

  // Field Suggestion Rule form state
  const [newKeyword, setNewKeyword] = useState('');
  const [newTargetType, setNewTargetType] = useState<FieldSuggestionRuleType>('ACCOUNT');
  const [newTargetValue, setNewTargetValue] = useState(accounts[0]?.id || '');
  const [newAccountId, setNewAccountId] = useState('');
  const [newExtractMode, setNewExtractMode] = useState<DescriptionExtractMode>('BETWEEN');
  const [newStartMarker, setNewStartMarker] = useState('');
  const [newEndMarker, setNewEndMarker] = useState('');
  const [newRegexPattern, setNewRegexPattern] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [testSampleText, setTestSampleText] = useState('');
  const [showAddFieldRule, setShowAddFieldRule] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Live preview for dynamic description extraction in the test sandbox
  const liveExtractedPreview = React.useMemo(() => {
    if (newTargetType !== 'DESCRIPTION' || !testSampleText.trim()) return null;
    const dummyRule: FieldSuggestionRule = {
      id: 'test',
      keyword: newKeyword || '',
      targetType: 'DESCRIPTION',
      targetValue: 'DESCRIPTION',
      extractMode: newExtractMode,
      startMarker: newStartMarker,
      endMarker: newEndMarker,
      regexPattern: newRegexPattern,
      enabled: true,
      createdAt: Date.now()
    };
    return extractDynamicDescriptionFromText(testSampleText, dummyRule);
  }, [newTargetType, testSampleText, newKeyword, newExtractMode, newStartMarker, newEndMarker, newRegexPattern]);

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
    if (editingRuleId === id) {
      setEditingRuleId(null);
      setShowAddFieldRule(false);
    }
  };

  const handleOpenAddFieldRule = () => {
    setEditingRuleId(null);
    setNewKeyword('');
    setNewTargetType('ACCOUNT');
    setNewTargetValue(accounts[0]?.id || '');
    setNewAccountId('');
    setNewExtractMode('BETWEEN');
    setNewStartMarker('to ');
    setNewEndMarker(' on ');
    setNewRegexPattern('');
    setNewLabel('');
    setTestSampleText('');
    setShowAddFieldRule(true);
  };

  const handleStartEditFieldRule = (rule: FieldSuggestionRule) => {
    setEditingRuleId(rule.id);
    setNewKeyword(rule.keyword);
    setNewTargetType(rule.targetType);
    setNewTargetValue(rule.targetValue);
    setNewAccountId(rule.accountId || '');
    setNewExtractMode(rule.extractMode || 'BETWEEN');
    setNewStartMarker(rule.startMarker || '');
    setNewEndMarker(rule.endMarker || '');
    setNewRegexPattern(rule.regexPattern || '');
    setNewLabel(rule.label || '');
    setTestSampleText('');
    setShowAddFieldRule(true);
  };

  const handleSaveFieldRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;

    let targetVal = newTargetValue;
    let defaultLabel = '';

    if (newTargetType === 'ACCOUNT') {
      targetVal = newTargetValue || accounts[0]?.id || '';
      const accName = accounts.find(a => a.id === targetVal)?.name || 'Account';
      defaultLabel = `"${newKeyword.trim()}" -> ${accName}`;
    } else if (newTargetType === 'CATEGORY') {
      targetVal = newTargetValue || categories[0] || 'Food & Dining';
      defaultLabel = `"${newKeyword.trim()}" -> ${targetVal}`;
    } else if (newTargetType === 'DESCRIPTION') {
      targetVal = 'DESCRIPTION';
      if (newExtractMode === 'REGEX') {
        defaultLabel = `Extract via /${newRegexPattern.trim()}/`;
      } else {
        const parts = [];
        if (newStartMarker) parts.push(`after "${newStartMarker}"`);
        if (newEndMarker) parts.push(`before "${newEndMarker}"`);
        defaultLabel = parts.length > 0 ? `Extract ${parts.join(' ')}` : `Extract Description`;
      }
    }

    const ruleData: FieldSuggestionRule = {
      id: editingRuleId || `field_${Date.now()}`,
      keyword: newKeyword.trim(),
      targetType: newTargetType,
      targetValue: targetVal,
      accountId: newAccountId.trim() ? newAccountId.trim() : undefined,
      extractMode: newTargetType === 'DESCRIPTION' ? newExtractMode : undefined,
      startMarker: newTargetType === 'DESCRIPTION' && newExtractMode === 'BETWEEN' ? newStartMarker : undefined,
      endMarker: newTargetType === 'DESCRIPTION' && newExtractMode === 'BETWEEN' ? newEndMarker : undefined,
      regexPattern: newTargetType === 'DESCRIPTION' && newExtractMode === 'REGEX' ? newRegexPattern.trim() : undefined,
      label: newLabel.trim() || defaultLabel,
      enabled: true,
      createdAt: editingRuleId ? (fieldRules.find(r => r.id === editingRuleId)?.createdAt || Date.now()) : Date.now()
    };

    if (editingRuleId) {
      onSaveFieldRules(fieldRules.map(r => r.id === editingRuleId ? ruleData : r));
    } else {
      onSaveFieldRules([...fieldRules, ruleData]);
    }

    setEditingRuleId(null);
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
                <p className="text-[11px] text-slate-400">Auto-fill Account, Category, or dynamic Description from emails</p>
              </div>
            </div>
            <button
              onClick={handleOpenAddFieldRule}
              className="px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition shadow-sm cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Rule</span>
            </button>
          </div>

          {/* Add / Edit Field Rule Form */}
          {showAddFieldRule && (
            <form onSubmit={handleSaveFieldRule} className="p-4 bg-[#0d1218] rounded-2xl border border-emerald-500/40 space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-emerald-300">
                  {editingRuleId ? 'Edit Field Suggestion Rule' : 'Add Field Suggestion Rule'}
                </div>
                {editingRuleId && (
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-semibold border border-amber-500/20">
                    Editing Mode
                  </span>
                )}
              </div>
              
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  If email contains text (case-insensitive) *
                </label>
                <input
                  type="text"
                  required
                  placeholder='e.g. "debited for", "VPA", or "HDFC Bank Credit Card ending 5304"'
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  className="w-full bg-[#121820] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Bank Account Scoping */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] uppercase font-bold text-slate-400">
                    Applicable Bank Account (Optional)
                  </label>
                  <span className="text-[10px] text-slate-500">Specific account rules take priority</span>
                </div>
                <select
                  value={newAccountId}
                  onChange={(e) => setNewAccountId(e.target.value)}
                  className="w-full bg-[#121820] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Any Bank Account (Global Rule)</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Field Selector Tabs */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                  Target Field To Auto-Suggest *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewTargetType('ACCOUNT');
                      setNewTargetValue(accounts[0]?.id || '');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition text-center cursor-pointer ${
                      newTargetType === 'ACCOUNT'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-200'
                        : 'bg-[#121820] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Account
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewTargetType('CATEGORY');
                      setNewTargetValue(categories[0] || 'Food & Dining');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition text-center cursor-pointer ${
                      newTargetType === 'CATEGORY'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                        : 'bg-[#121820] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Category
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewTargetType('DESCRIPTION');
                      setNewTargetValue('DESCRIPTION');
                      if (!newStartMarker && !newRegexPattern) {
                        setNewStartMarker('to ');
                        setNewEndMarker(' on ');
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition text-center cursor-pointer ${
                      newTargetType === 'DESCRIPTION'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-200'
                        : 'bg-[#121820] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Description
                  </button>
                </div>
              </div>

              {/* Conditional Target Field Details */}
              {newTargetType === 'ACCOUNT' && (
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Select Existing Account
                  </label>
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
                </div>
              )}

              {newTargetType === 'CATEGORY' && (
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Select Expense Category
                  </label>
                  <select
                    value={newTargetValue}
                    onChange={(e) => setNewTargetValue(e.target.value)}
                    className="w-full bg-[#121820] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}

              {newTargetType === 'DESCRIPTION' && (
                <div className="space-y-3 pt-1">
                  {/* Extract Mode Toggle */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Extraction Method
                    </label>
                    <div className="inline-flex p-1 bg-[#121820] rounded-xl border border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => setNewExtractMode('BETWEEN')}
                        className={`px-3 py-1 rounded-lg transition font-medium cursor-pointer ${
                          newExtractMode === 'BETWEEN'
                            ? 'bg-purple-600 text-white font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Between Markers
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewExtractMode('REGEX')}
                        className={`px-3 py-1 rounded-lg transition font-medium cursor-pointer ${
                          newExtractMode === 'REGEX'
                            ? 'bg-purple-600 text-white font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Regex Pattern
                      </button>
                    </div>
                  </div>

                  {newExtractMode === 'BETWEEN' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                          Start Marker (Text before description) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder='e.g. "to " or "at " or "VPA "'
                          value={newStartMarker}
                          onChange={(e) => setNewStartMarker(e.target.value)}
                          className="w-full bg-[#121820] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">Exact text before merchant (include space if needed)</span>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                          End Marker (Text after description)
                        </label>
                        <input
                          type="text"
                          placeholder='e.g. " on " or " through " (optional)'
                          value={newEndMarker}
                          onChange={(e) => setNewEndMarker(e.target.value)}
                          className="w-full bg-[#121820] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">Leave empty to capture until line end</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Regular Expression Pattern *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder='e.g. to\s+([A-Za-z0-9\s]+?)\s+on or VPA\s+([^\s]+)'
                        value={newRegexPattern}
                        onChange={(e) => setNewRegexPattern(e.target.value)}
                        className="w-full bg-[#121820] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">Group 1 in parentheses <code>(...)</code> will be captured as description</span>
                    </div>
                  )}

                  {/* Interactive Test Pattern Sandbox */}
                  <div className="p-3 bg-[#111722] rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                      <span>Live Test Pattern Sandbox</span>
                      <span className="text-[10px] text-slate-500 font-normal">Test against sample email snippet</span>
                    </div>
                    <input
                      type="text"
                      placeholder='e.g. "Rs 450.00 debited from a/c **1234 to Swiggy on 12-Nov-2024"'
                      value={testSampleText}
                      onChange={(e) => setTestSampleText(e.target.value)}
                      className="w-full bg-[#0d1218] border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                    />
                    <div>
                      {liveExtractedPreview ? (
                        <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                          <Check size={13} className="shrink-0" />
                          <span>Extracted Description:</span>
                          <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-lg font-bold font-mono">
                            "{liveExtractedPreview}"
                          </span>
                        </div>
                      ) : testSampleText.trim() ? (
                        <div className="text-xs text-amber-400/80 italic">
                          No match with current extraction pattern. Check your markers or regex.
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500">
                          Paste a sample email snippet above to verify live extraction before saving.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Friendly Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC UPI -> Merchant Payee name"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full bg-[#121820] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditingRuleId(null);
                    setShowAddFieldRule(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition cursor-pointer"
                >
                  {editingRuleId ? 'Update Rule' : 'Save Suggestion Rule'}
                </button>
              </div>
            </form>
          )}

          {/* Field Rules List */}
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {fieldRules.map(rule => {
              const matchedAccount = accounts.find(a => a.id === rule.targetValue);
              const scopedAccount = accounts.find(a => a.id === rule.accountId);
              const isBeingEdited = editingRuleId === rule.id;

              let targetDisplayName = rule.targetValue;
              if (rule.targetType === 'ACCOUNT') {
                targetDisplayName = matchedAccount ? matchedAccount.name : 'Account not found';
              } else if (rule.targetType === 'DESCRIPTION') {
                if (rule.extractMode === 'REGEX') {
                  targetDisplayName = `Regex: /${rule.regexPattern || ''}/`;
                } else {
                  targetDisplayName = `Between "${rule.startMarker || ''}" and "${rule.endMarker || 'end of line'}"`;
                }
              }

              return (
                <div
                  key={rule.id}
                  className={`p-3 rounded-2xl border transition flex items-start justify-between gap-3 ${
                    isBeingEdited
                      ? 'bg-[#182230] border-emerald-500/60 ring-1 ring-emerald-500/40'
                      : rule.enabled 
                      ? 'bg-[#161c26] border-slate-800 hover:border-slate-700' 
                      : 'bg-[#0d1218] border-slate-800/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => handleToggleFieldRule(rule.id)}
                      className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0 cursor-pointer accent-emerald-500 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-white">contains "{rule.keyword}"</span>
                        
                        {/* Target Field Badge */}
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                          rule.targetType === 'ACCOUNT'
                            ? 'bg-sky-500/10 text-sky-300 border-sky-500/20'
                            : rule.targetType === 'CATEGORY'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                            : 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                        }`}>
                          {rule.targetType === 'ACCOUNT' ? 'Account' : rule.targetType === 'CATEGORY' ? 'Category' : 'Description'}
                        </span>

                        {/* Account Scope Badge */}
                        {scopedAccount ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-500/10 text-sky-300 border border-sky-500/20">
                            {scopedAccount.name}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                            Any Account
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 truncate">
                        <ChevronRight size={12} className="text-slate-500 shrink-0" />
                        <span className="text-slate-200 font-medium font-mono text-[11px] truncate">{targetDisplayName}</span>
                      </div>
                      
                      {rule.label && (
                        <div className="text-[10px] text-slate-400 italic mt-0.5 truncate">
                          {rule.label}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEditFieldRule(rule)}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        isBeingEdited
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10'
                      }`}
                      title="Edit rule"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFieldRule(rule.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                      title="Delete rule"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-[#0e141c] border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
            <Sparkles size={14} className="text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div><strong>Field Auto-Suggestion Hierarchy:</strong></div>
              <p className="text-[10px] text-slate-400">
                1. <strong>Bank Account</strong>: Custom rules first &rarr; Account matching last 4 digits &rarr; Card/Bank heuristics.
              </p>
              <p className="text-[10px] text-slate-400">
                2. <strong>Description</strong>: Bank-specific description rules &rarr; Global description rules &rarr; Smart merchant detector.
              </p>
              <p className="text-[10px] text-slate-400">
                3. <strong>Category</strong>: Custom category rules &rarr; Keyword pattern heuristics &rarr; 'Other'.
              </p>
            </div>
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
