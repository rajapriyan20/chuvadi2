import React, { useState, useRef, useEffect } from 'react';
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
  FileText,
  Mic,
  MicOff,
  AlertTriangle,
  Heart,
  Dumbbell,
  CalendarDays
} from 'lucide-react';
import { 
  parseNaturalLanguageExpense, 
  scanDocumentOrReceipt, 
  chatWithFinancialAdvisor, 
  generateLocalFinancialAdvice 
} from '../../services/gemini';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { MarkdownMessage } from '../common/MarkdownMessage';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import type { 
  Account, 
  Transaction, 
  Vehicle, 
  TodoNote, 
  CalendarEvent, 
  ExerciseLog, 
  BodyProfileLog, 
  MenstrualLog, 
  MenstrualCycleSettings, 
  Entity 
} from '../../types';

interface AiAssistantTabProps {
  accounts: Account[];
  vehicles: Vehicle[];
  transactions: Transaction[];
  todos: TodoNote[];
  calendarEvents?: CalendarEvent[];
  exerciseLogs?: ExerciseLog[];
  bodyProfileLogs?: BodyProfileLog[];
  menstrualLogs?: MenstrualLog[];
  menstrualSettings?: MenstrualCycleSettings;
  entities?: Entity[];
  onSaveParsedTransaction: (txn: Omit<Transaction, 'id'>) => Promise<void>;
}

export const AiAssistantTab: React.FC<AiAssistantTabProps> = ({
  accounts,
  vehicles,
  transactions,
  todos,
  calendarEvents = [],
  exerciseLogs = [],
  bodyProfileLogs = [],
  menstrualLogs = [],
  menstrualSettings = { averageCycleLength: 28, averagePeriodDuration: 5, lutealPhaseLength: 14, privacyMode: false },
  entities = [],
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
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; isFallback?: boolean }>>([
    {
      role: 'assistant',
      text: 'Hello! I am your **Chuvadi Intelligence Advisor**.\n\nI have complete visibility across your finances, vehicles, fitness workouts, monthly body metrics, wellness cycle, and calendar reminders. How can I help you today?'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  // Speech Recognition for Expense Dictation
  const {
    isListening: isListeningExpense,
    isSupported: isSpeechSupported,
    toggleListening: toggleListeningExpense
  } = useSpeechRecognition({
    onResult: (text) => setNlPrompt((prev) => (prev ? `${prev} ${text}` : text))
  });

  // Speech Recognition for Advisor Chat
  const {
    isListening: isListeningChat,
    toggleListening: toggleListeningChat
  } = useSpeechRecognition({
    onResult: (text) => setChatInput((prev) => (prev ? `${prev} ${text}` : text))
  });

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

  // Handle Advisor Chat with Complete App Knowledge (Requirement 4)
  const handleSendChat = async (promptToSend?: string) => {
    const text = promptToSend || chatInput;
    if (!text.trim() || isChatLoading) return;

    const updatedHistory = [...chatMessages, { role: 'user' as const, text }];
    setChatMessages(updatedHistory);
    setChatInput('');
    setIsChatLoading(true);

    const fullAppContext = {
      accounts,
      vehicles,
      transactions,
      todos,
      calendarEvents,
      exerciseLogs,
      bodyProfileLogs,
      menstrualLogs,
      menstrualSettings,
      entities
    };

    try {
      const res = await chatWithFinancialAdvisor(text, fullAppContext);

      setChatMessages([
        ...updatedHistory, 
        { 
          role: 'assistant', 
          text: res.reply, 
          isFallback: res.isFallback 
        }
      ]);
    } catch (err: any) {
      const fallbackReply = generateLocalFinancialAdvice(text, fullAppContext);
      setChatMessages([
        ...updatedHistory,
        { 
          role: 'assistant', 
          text: fallbackReply, 
          isFallback: true 
        }
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
              Life OS AI
            </span>
          </h2>
          <div className="text-xs text-slate-400">
            Voice expense dictation, receipt OCR scanner, and full-app life advisor
          </div>
        </div>
      </div>

      {/* Module 1: Natural Language / Voice Parser */}
      <div className="p-5 bg-[#131922] rounded-3xl border border-slate-800 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <Sparkles size={14} />
            <span>Smart Expense & Fuel Dictation</span>
          </h3>
          <span className="text-[10px] text-slate-400">Type or speak your transaction</span>
        </div>

        <form onSubmit={handleParseNL} className="space-y-2">
          <div className="relative">
            <textarea
              rows={2}
              placeholder="e.g. 'Filled 15L petrol for 1650 on Hunter 350 using HDFC' or 'Paid 850 at DMart for groceries'"
              value={nlPrompt}
              onChange={(e) => setNlPrompt(e.target.value)}
              className="w-full bg-[#0d1217] border border-slate-700/80 rounded-2xl p-3.5 pr-12 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition resize-none leading-relaxed"
            />

            {/* Mic Dictation Button for Expense Parsing (Requirement 5) */}
            {isSpeechSupported && (
              <button
                type="button"
                onClick={toggleListeningExpense}
                title={isListeningExpense ? "Listening... Click to stop" : "Speak hands-free with microphone"}
                className={`absolute right-3 top-3 p-2 rounded-xl border transition ${
                  isListeningExpense
                    ? 'bg-rose-500/20 border-rose-500/60 text-rose-400 animate-pulse'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-amber-300'
                }`}
              >
                {isListeningExpense ? <MicOff size={15} /> : <Mic size={15} />}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            {/* Quick prompts */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] text-slate-400 scrollbar-none">
              <button
                type="button"
                onClick={() => setNlPrompt("Paid ₹1,800 for fuel in car using SBI")}
                className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-slate-300 whitespace-nowrap"
              >
                "Paid ₹1,800 fuel in car"
              </button>
              <button
                type="button"
                onClick={() => setNlPrompt("Received ₹50,000 monthly salary in HDFC")}
                className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-slate-300 whitespace-nowrap"
              >
                "Received salary in HDFC"
              </button>
            </div>

            <button
              type="submit"
              disabled={isParsingNl || !nlPrompt.trim()}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shrink-0 shadow-md shadow-amber-500/20 active:scale-95"
            >
              {isParsingNl ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              <span>{isParsingNl ? 'Parsing...' : 'Analyze'}</span>
            </button>
          </div>
        </form>

        {/* Parsed Result Preview Card */}
        {parsedResult && (
          <div className="p-4 bg-[#18212d] rounded-2xl border border-amber-500/30 space-y-3 animate-fadeIn shadow-md">
            <div className="flex items-center justify-between text-xs font-bold text-amber-200">
              <span>Parsed Transaction Ready for Ledger</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-amber-500/20 rounded">
                {parsedResult.type}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 bg-[#121820] rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">Amount</div>
                <div className="text-sm font-bold text-white font-mono">{formatCurrency(parsedResult.amount)}</div>
              </div>
              <div className="p-2 bg-[#121820] rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">Category</div>
                <div className="font-bold text-white truncate">{parsedResult.category}</div>
              </div>
              <div className="p-2 bg-[#121820] rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">Vehicle</div>
                <div className="font-bold text-white truncate">
                  {vehicles.find(v => v.id === parsedResult.vehicleId)?.name || 'None'}
                </div>
              </div>
              <div className="p-2 bg-[#121820] rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">Fuel Liters</div>
                <div className="font-bold text-white font-mono">{parsedResult.fuelLiters ? `${parsedResult.fuelLiters} L` : '—'}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                Account: {accounts.find(a => a.id === parsedResult.fromAccountId)?.name || 'Default Account'}
              </div>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isParsingNl}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition shadow-md shadow-emerald-500/20"
              >
                <Check size={14} />
                <span>Save into Ledger</span>
              </button>
            </div>
          </div>
        )}

        {saveSuccessMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <Check size={14} />
            <span>{saveSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Module 2: Document & Bill OCR Scanner */}
      <div className="p-5 bg-[#131922] rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Camera size={15} />
            <span>Document & Bill OCR Scanner</span>
          </h3>
          <span className="text-[10px] text-slate-400">Upload receipt, fuel invoice or insurance</span>
        </div>

        <div className="relative border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl p-6 text-center transition cursor-pointer group">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isScanningDoc}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
              {isScanningDoc ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
            </div>
            <div className="text-xs font-semibold text-slate-200">
              {isScanningDoc ? 'Analyzing document image with AI...' : 'Click or drag bill / document photo'}
            </div>
            <div className="text-[10px] text-slate-500">Supports JPG, PNG, WEBP</div>
          </div>
        </div>

        {/* Scanned Result Card */}
        {scannedResult && (
          <div className="p-4 bg-[#18212d] rounded-2xl border border-emerald-500/30 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
              <span>Scanned Receipt Data</span>
              <span className="text-sm font-bold text-white font-mono">{formatCurrency(scannedResult.amount)}</span>
            </div>

            <div className="space-y-1 text-xs text-slate-300">
              <div><strong>Merchant / Vendor:</strong> {scannedResult.merchant}</div>
              <div><strong>Category:</strong> {scannedResult.category}</div>
              <div><strong>Date:</strong> {scannedResult.date}</div>
              {scannedResult.notes && <div className="text-slate-400 text-[11px]">{scannedResult.notes}</div>}
            </div>

            <button
              type="button"
              onClick={async () => {
                const defaultAcc = accounts[0]?.id || null;
                await onSaveParsedTransaction({
                  type: 'EXPENSE',
                  amount: scannedResult.amount || 0,
                  description: scannedResult.merchant || 'Scanned Receipt',
                  category: scannedResult.category || 'Other',
                  fromAccountId: defaultAcc,
                  toAccountId: null,
                  date: scannedResult.date || new Date().toISOString().split('T')[0],
                  timestamp: Date.now(),
                  notes: `Scanned with AI OCR: ${scannedResult.notes || ''}`
                });
                setScannedResult(null);
                setSaveSuccessMsg('Receipt transaction saved into passbook!');
                setTimeout(() => setSaveSuccessMsg(null), 3000);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition shadow-md shadow-emerald-500/20"
            >
              <span>Convert to Ledger Transaction</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Module 3: Interactive Life Advisor (Redesigned Bubble UI - Requirement 1, 2, 3, 4, 5) */}
      <div className="p-5 bg-[#131922] rounded-3xl border border-slate-800 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Bot size={14} />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-300">
              Chuvadi Life Advisor
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Connected to all modules
          </span>
        </div>

        {/* Quick query chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
          <button
            type="button"
            onClick={() => handleSendChat("Summarize my financial health and net worth")}
            className="px-2.5 py-1 rounded-xl bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700/60 whitespace-nowrap active:scale-95 transition"
          >
            📊 Financial health summary
          </button>
          <button
            type="button"
            onClick={() => handleSendChat("Are there any vehicle renewals due soon?")}
            className="px-2.5 py-1 rounded-xl bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700/60 whitespace-nowrap active:scale-95 transition"
          >
            🏍️ Vehicle renewals check
          </button>
          <button
            type="button"
            onClick={() => handleSendChat("How is my fitness and monthly body profile tracking?")}
            className="px-2.5 py-1 rounded-xl bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700/60 whitespace-nowrap active:scale-95 transition"
          >
            🏋️ Body profile & workouts
          </button>
          <button
            type="button"
            onClick={() => handleSendChat("What upcoming birthdays or reminders do I have?")}
            className="px-2.5 py-1 rounded-xl bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700/60 whitespace-nowrap active:scale-95 transition"
          >
            📅 Upcoming birthdays & events
          </button>
        </div>

        {/* Message Log */}
        <div className="space-y-3.5 max-h-[26rem] sm:max-h-[30rem] overflow-y-auto overflow-x-hidden pr-1 scroll-smooth">
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 min-w-0 max-w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-sky-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={15} />
                </div>
              )}

              {/* DISTINCTIVE AI MESSAGE BUBBLE - Constrained to prevent horizontal screen overflow */}
              <div
                className={`min-w-0 flex-1 max-w-[88%] sm:max-w-[85%] text-xs leading-relaxed shadow-sm transition-all overflow-hidden break-words [overflow-wrap:anywhere] ${
                  msg.role === 'user'
                    ? 'p-3 rounded-2xl rounded-tr-sm bg-amber-500 text-slate-950 font-medium ml-auto flex-initial max-w-[85%]'
                    : 'p-3.5 sm:p-4 rounded-2xl rounded-tl-sm bg-gradient-to-br from-[#16222f] via-[#121922] to-[#0e141c] text-slate-200 border border-slate-700/60 border-l-[3px] border-l-emerald-400'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="space-y-2 min-w-0 max-w-full">
                    {/* Fallback indicator when Cloud AI quota is busy / resting (Requirement 3) */}
                    {msg.isFallback && (
                      <div className="flex flex-wrap items-center gap-1.5 pb-1.5 mb-1.5 border-b border-amber-500/20 text-[10px] text-amber-300 font-mono">
                        <Sparkles size={11} className="text-amber-400 shrink-0" />
                        <span>Cloud AI quota resting • Live local ledger analysis</span>
                      </div>
                    )}

                    {/* Rich Markdown Parser */}
                    <MarkdownMessage content={msg.text} />
                  </div>
                ) : (
                  <div className="font-semibold text-slate-950 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                    {msg.text}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <User size={15} />
                </div>
              )}
            </div>
          ))}

          {isChatLoading && (
            <div className="flex gap-2.5 items-center text-xs text-slate-400 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <Loader2 size={14} className="animate-spin" />
              </div>
              <span className="italic truncate">Chuvadi Advisor is analyzing your records...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Chat input form with Voice Option (Requirement 5) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendChat();
          }}
          className="flex items-center gap-2 pt-1"
        >
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Ask anything about expenses, garage, body profile, wellness, or events..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="w-full bg-[#0d1217] border border-slate-700/80 rounded-xl px-3.5 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
            />

            {/* Mic Dictation Button for Chat (Requirement 5) */}
            {isSpeechSupported && (
              <button
                type="button"
                onClick={toggleListeningChat}
                title={isListeningChat ? "Listening... Click to stop" : "Speak question hands-free"}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg border transition ${
                  isListeningChat
                    ? 'bg-rose-500/20 border-rose-500/60 text-rose-400 animate-pulse'
                    : 'text-slate-400 hover:text-sky-300 border-transparent'
                }`}
              >
                {isListeningChat ? <MicOff size={14} /> : <Mic size={14} />}
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isChatLoading || !chatInput.trim()}
            className="p-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold transition shadow-md shadow-sky-500/20 active:scale-95"
            title="Send Message"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
};
