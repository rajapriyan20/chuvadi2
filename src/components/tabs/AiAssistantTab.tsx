import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Upload, 
  Check, 
  Camera, 
  ArrowRight, 
  Bot, 
  User, 
  Loader2, 
  TrendingUp, 
  Car, 
  HelpCircle,
  FileText
} from 'lucide-react';
import { parseNaturalLanguageExpense, scanDocumentOrReceipt, chatWithFinancialAdvisor } from '../../services/gemini';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Account, Transaction, Vehicle, TodoNote } from '../../types';

interface AiAssistantTabProps {
  accounts: Account[];
  vehicles: Vehicle[];
  transactions: Transaction[];
  todos: TodoNote[];
  onSaveParsedTransaction: (txn: Omit<Transaction, 'id'>) => Promise<void>;
}

export const AiAssistantTab: React.FC<AiAssistantTabProps> = ({
  accounts,
  vehicles,
  transactions,
  todos,
  onSaveParsedTransaction
}) => {
  // Natural Language Input State
  const [nlPrompt, setNlPrompt] = useState('');
  const [isParsingNl, setIsParsingNl] = useState(false);
  const [parsedResult, setParsedResult] = useState<any>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Document Scan State
  const [isScanningDoc, setIsScanningDoc] = useState(false);
  const [scannedResult, setScannedResult] = useState<any>(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'Hello! I am your Chuvadi Intelligence Assistant. I can help you record expenses by voice/text, scan physical receipts, review your garage renewals, or analyze your monthly budget. How can I help you today?'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Quick NL parse submit
  const handleParseNL = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nlPrompt.trim()) return;

    setIsParsingNl(true);
    setParsedResult(null);
    setSaveSuccessMsg(null);

    try {
      const result = await parseNaturalLanguageExpense(nlPrompt, accounts, vehicles);
      setParsedResult(result);
    } catch (err) {
      console.error('NL Parse error:', err);
    } finally {
      setIsParsingNl(false);
    }
  };

  // Confirm parsed transaction and save into ledger
  const handleConfirmSave = async () => {
    if (!parsedResult) return;
    setIsParsingNl(true);
    try {
      const defaultAcc = accounts[0]?.id || null;
      await onSaveParsedTransaction({
        type: parsedResult.type || 'EXPENSE',
        amount: parsedResult.amount || 0,
        description: parsedResult.description || 'Quick AI Entry',
        category: parsedResult.category || 'Other',
        fromAccountId: parsedResult.fromAccountId || defaultAcc,
        toAccountId: parsedResult.toAccountId || null,
        date: parsedResult.date || new Date().toISOString().split('T')[0],
        timestamp: Date.now(),
        vehicleId: parsedResult.vehicleId || null,
        isFuel: !!parsedResult.isFuel,
        fuelLiters: parsedResult.fuelLiters || null,
        odometer: parsedResult.odometer || null,
        notes: `Logged via Chuvadi AI: "${nlPrompt}"`
      });

      setSaveSuccessMsg('Transaction successfully written to ledger!');
      setParsedResult(null);
      setNlPrompt('');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Error saving parsed txn:', err);
    } finally {
      setIsParsingNl(false);
    }
  };

  // Handle Receipt Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64 = evt.target?.result as string;
      setIsScanningDoc(true);
      setScannedResult(null);
      try {
        const result = await scanDocumentOrReceipt(base64, file.type);
        setScannedResult(result);
      } catch (err) {
        console.error('OCR Error:', err);
      } finally {
        setIsScanningDoc(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Advisor Chat
  const handleSendChat = async (promptToSend?: string) => {
    const text = promptToSend || chatInput;
    if (!text.trim() || isChatLoading) return;

    const updatedHistory = [...chatMessages, { role: 'user' as const, text }];
    setChatMessages(updatedHistory);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await chatWithFinancialAdvisor(text, {
        accounts,
        vehicles,
        transactions,
        todos
      });

      setChatMessages([...updatedHistory, { role: 'assistant', text: response }]);
    } catch (err: any) {
      setChatMessages([
        ...updatedHistory,
        { role: 'assistant', text: 'Apologies, I encountered a temporary connection error. Please try again.' }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-amber-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Sparkles size={20} />
        </div>
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Chuvadi Intelligence Hub</span>
            <span className="px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full font-mono">
              Gemini 3.8
            </span>
          </h2>
          <div className="text-xs text-slate-400">Natural language ledger, receipt OCR scanning & advisor</div>
        </div>
      </div>

      {/* Module 1: Natural Language / Voice Parser */}
      <div className="p-5 bg-[#131922] rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <Sparkles size={14} />
            <span>Smart Expense & Fuel Dictation</span>
          </h3>
          <span className="text-[10px] text-slate-400">Type or paste natural sentence</span>
        </div>

        <form onSubmit={handleParseNL} className="space-y-2">
          <div className="relative">
            <textarea
              rows={2}
              placeholder="e.g. 'Filled 15L petrol for 1650 on Hunter 350 using HDFC' or 'Paid 850 at DMart for groceries'"
              value={nlPrompt}
              onChange={(e) => setNlPrompt(e.target.value)}
              className="w-full bg-[#0d1217] border border-slate-700 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            {/* Quick prompts */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] text-slate-400">
              <button
                type="button"
                onClick={() => setNlPrompt("Paid ₹1,800 for fuel in car using SBI")}
                className="px-2 py-1 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-slate-300 whitespace-nowrap"
              >
                "Paid ₹1,800 fuel in car"
              </button>
              <button
                type="button"
                onClick={() => setNlPrompt("Received ₹50,000 monthly salary in HDFC")}
                className="px-2 py-1 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-slate-300 whitespace-nowrap"
              >
                "Received salary in HDFC"
              </button>
            </div>

            <button
              type="submit"
              disabled={isParsingNl || !nlPrompt.trim()}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
            >
              {isParsingNl ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              <span>{isParsingNl ? 'Parsing...' : 'Analyze'}</span>
            </button>
          </div>
        </form>

        {/* Parsed Result Preview Card */}
        {parsedResult && (
          <div className="p-4 bg-[#18212d] rounded-2xl border border-amber-500/30 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-bold text-amber-200">
              <span>Parsed Transaction Ready for Ledger</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-amber-500/20 rounded">
                {parsedResult.type}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 bg-[#121820] rounded-xl">
                <div className="text-[10px] text-slate-400">Amount</div>
                <div className="text-sm font-bold text-white font-mono">{formatCurrency(parsedResult.amount)}</div>
              </div>
              <div className="p-2 bg-[#121820] rounded-xl">
                <div className="text-[10px] text-slate-400">Category</div>
                <div className="font-bold text-white truncate">{parsedResult.category}</div>
              </div>
              <div className="p-2 bg-[#121820] rounded-xl">
                <div className="text-[10px] text-slate-400">Vehicle</div>
                <div className="font-bold text-white truncate">
                  {vehicles.find(v => v.id === parsedResult.vehicleId)?.name || 'None'}
                </div>
              </div>
              <div className="p-2 bg-[#121820] rounded-xl">
                <div className="text-[10px] text-slate-400">Fuel Liters</div>
                <div className="font-bold text-white">{parsedResult.fuelLiters ? `${parsedResult.fuelLiters} L` : 'N/A'}</div>
              </div>
            </div>

            <button
              onClick={handleConfirmSave}
              disabled={isParsingNl}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <Check size={16} strokeWidth={2.5} />
              <span>Confirm & Commit into Atomic Ledger</span>
            </button>
          </div>
        )}

        {saveSuccessMsg && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-600/40 rounded-xl text-xs text-emerald-300 font-semibold flex items-center gap-2">
            <Check size={16} />
            <span>{saveSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Module 2: Receipt OCR Scanner */}
      <div className="p-5 bg-[#131922] rounded-3xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Camera size={14} />
            <span>Document & Bill OCR Scanner</span>
          </h3>
          <span className="text-[10px] text-slate-400">Upload receipt, fuel invoice or insurance</span>
        </div>

        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl cursor-pointer bg-[#0d1217] transition group">
          <Upload size={24} className="text-slate-400 group-hover:text-emerald-400 transition" />
          <span className="text-xs font-semibold text-slate-300 mt-2">
            Click or drag bill / document photo
          </span>
          <span className="text-[10px] text-slate-500">Supports JPG, PNG, WEBP</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>

        {isScanningDoc && (
          <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin text-emerald-400" />
            <span>Gemini OCR is analyzing the document...</span>
          </div>
        )}

        {scannedResult && (
          <div className="p-4 bg-[#18212d] rounded-2xl border border-emerald-500/30 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
              <span>Extracted Bill Details</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/20 rounded">
                {scannedResult.category || 'Receipt'}
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Vendor / Workshop:</span>
                <span className="text-white font-bold">{scannedResult.merchant || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Amount:</span>
                <span className="text-amber-300 font-bold font-mono">{formatCurrency(scannedResult.amount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date:</span>
                <span className="text-white">{scannedResult.date || 'Today'}</span>
              </div>
              {scannedResult.notes && (
                <div className="pt-1 text-[11px] text-slate-300 border-t border-slate-700/60">
                  {scannedResult.notes}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setNlPrompt(`Paid ${scannedResult.amount} to ${scannedResult.merchant} for ${scannedResult.category}`);
                handleParseNL();
              }}
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
            >
              <span>Convert to Ledger Transaction</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Module 3: Interactive Financial & Garage Chatbot */}
      <div className="p-5 bg-[#131922] rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
            <Bot size={15} />
            <span>Chuvadi Life Advisor</span>
          </h3>
          <span className="text-[10px] text-slate-400">Trained on your real data</span>
        </div>

        {/* Preset query chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
          <button
            type="button"
            onClick={() => handleSendChat("Summarize my financial health and net worth")}
            className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 hover:text-white whitespace-nowrap"
          >
            📊 Financial health summary
          </button>
          <button
            type="button"
            onClick={() => handleSendChat("Are there any vehicle renewals due soon?")}
            className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 hover:text-white whitespace-nowrap"
          >
            🏍️ Vehicle renewals check
          </button>
          <button
            type="button"
            onClick={() => handleSendChat("How much have I spent on fuel and maintenance?")}
            className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 hover:text-white whitespace-nowrap"
          >
            ⛽ Fuel & service breakdown
          </button>
        </div>

        {/* Message Log */}
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={14} />
                </div>
              )}
              <div
                className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-amber-500 text-slate-950 font-medium'
                    : 'bg-[#0d1217] text-slate-200 border border-slate-800'
                }`}
              >
                {msg.text}
              </div>
              {msg.role === 'user' && (
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <User size={14} />
                </div>
              )}
            </div>
          ))}

          {isChatLoading && (
            <div className="flex gap-2.5 items-center text-xs text-slate-400">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Loader2 size={13} className="animate-spin" />
              </div>
              <span>Chuvadi is generating insights...</span>
            </div>
          )}
        </div>

        {/* Chat input form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendChat();
          }}
          className="flex items-center gap-2 pt-1"
        >
          <input
            type="text"
            placeholder="Ask anything about your expenses, vehicles, or todos..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 bg-[#0d1217] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
          />
          <button
            type="submit"
            disabled={isChatLoading || !chatInput.trim()}
            className="p-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 transition"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
