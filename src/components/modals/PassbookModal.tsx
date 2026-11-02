import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft, 
  ArrowRight,
  Download, 
  Search, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Link2,
  Filter
} from 'lucide-react';
import { formatCurrency, formatDate, getTransferFlowStyle } from '../../utils/formatters';
import type { Account, Transaction } from '../../types';
import { getSettlementStatus, getStoredSettlementTolerance } from '../../utils/settlement';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PassbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
  transactions: Transaction[];
  accounts?: Account[];
  onSelectTxn: (txn: Transaction) => void;
}

type DatePreset = 'all' | 'this_month' | 'last_month' | 'last_30_days' | 'this_year' | 'custom';

export const PassbookModal: React.FC<PassbookModalProps> = ({
  isOpen,
  onClose,
  account,
  transactions,
  accounts = [],
  onSelectTxn
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tolerance, setTolerance] = useState<number>(() => getStoredSettlementTolerance());
  const [passbookViewMode, setPassbookViewMode] = useState<'chronological' | 'mapped'>('chronological');
  
  // Date filter dialog state for PDF Export
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfPreset, setPdfPreset] = useState<DatePreset>('all');
  const [pdfStartDate, setPdfStartDate] = useState('');
  const [pdfEndDate, setPdfEndDate] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Listen for settlement tolerance changes from Settings
  useEffect(() => {
    const handleToleranceChange = () => {
      setTolerance(getStoredSettlementTolerance());
    };
    window.addEventListener('settlement_tolerance_updated', handleToleranceChange);
    return () => {
      window.removeEventListener('settlement_tolerance_updated', handleToleranceChange);
    };
  }, []);

  // Set default dates when opening PDF modal
  useEffect(() => {
    if (showPdfModal) {
      applyDatePreset('all');
    }
  }, [showPdfModal]);

  const applyDatePreset = (preset: DatePreset) => {
    setPdfPreset(preset);
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    if (preset === 'all') {
      const allAccountDates = transactions
        .filter(t => account && (t.fromAccountId === account.id || t.toAccountId === account.id))
        .map(t => t.date)
        .filter(Boolean)
        .sort();
      setPdfStartDate(allAccountDates[0] || `${yyyy}-01-01`);
      setPdfEndDate(todayStr);
    } else if (preset === 'this_month') {
      setPdfStartDate(`${yyyy}-${mm}-01`);
      setPdfEndDate(todayStr);
    } else if (preset === 'last_month') {
      const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      const pY = prevMonth.getFullYear();
      const pM = String(prevMonth.getMonth() + 1).padStart(2, '0');
      const lastDay = String(prevMonthEnd.getDate()).padStart(2, '0');
      setPdfStartDate(`${pY}-${pM}-01`);
      setPdfEndDate(`${pY}-${pM}-${lastDay}`);
    } else if (preset === 'last_30_days') {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 30);
      const pY = past30.getFullYear();
      const pM = String(past30.getMonth() + 1).padStart(2, '0');
      const pD = String(past30.getDate()).padStart(2, '0');
      setPdfStartDate(`${pY}-${pM}-${pD}`);
      setPdfEndDate(todayStr);
    } else if (preset === 'this_year') {
      setPdfStartDate(`${yyyy}-01-01`);
      setPdfEndDate(todayStr);
    }
  };

  // Base opening balance
  const openingBalance = useMemo(() => {
    if (!account) return 0;
    return typeof account.openingBalance === 'number' 
      ? account.openingBalance 
      : (typeof account.balance === 'number' ? account.balance : 0);
  }, [account]);

  // Running balance calculated strictly chronologically based on transaction date
  const runningBalancesMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!account) return map;

    // All transactions for this account sorted chronologically (oldest to newest by date)
    const chronologicalTxns = transactions
      .filter((t) => t.fromAccountId === account.id || t.toAccountId === account.id)
      .sort((a, b) => {
        const dateComp = (a.date || '').localeCompare(b.date || '');
        if (dateComp !== 0) return dateComp;
        return (a.timestamp || 0) - (b.timestamp || 0);
      });

    let current = openingBalance;
    for (const t of chronologicalTxns) {
      const isCredit = (t.type === 'INCOME' && t.toAccountId === account.id) || (t.type === 'TRANSFER' && t.toAccountId === account.id);
      const isDebit = (t.type === 'EXPENSE' && t.fromAccountId === account.id) || (t.type === 'TRANSFER' && t.fromAccountId === account.id);
      const amt = Number(t.amount) || 0;
      if (isCredit) {
        current += amt;
      } else if (isDebit) {
        current -= amt;
      }
      map.set(t.id, current);
    }
    return map;
  }, [account, transactions, openingBalance]);

  // Filter transactions involving this account, sorted strictly by transaction date (newest first)
  const accountTxns = useMemo(() => {
    if (!account) return [];
    return transactions
      .filter((t) => t.fromAccountId === account.id || t.toAccountId === account.id)
      .sort((a, b) => {
        // Strict sort based on transaction date
        const dateComp = (b.date || '').localeCompare(a.date || '');
        if (dateComp !== 0) return dateComp;
        return (b.timestamp || 0) - (a.timestamp || 0);
      })
      .filter((t) => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return (
          t.description?.toLowerCase().includes(s) ||
          t.category?.toLowerCase().includes(s) ||
          t.date?.includes(s) ||
          String(t.amount).includes(s)
        );
      });
  }, [account, transactions, searchTerm]);

  // Compute stats
  const { totalCredits, totalDebits } = useMemo(() => {
    if (!account) return { totalCredits: 0, totalDebits: 0 };
    let credits = 0;
    let debits = 0;
    const allForAccount = transactions.filter(t => t.fromAccountId === account.id || t.toAccountId === account.id);
    for (const t of allForAccount) {
      if ((t.type === 'INCOME' && t.toAccountId === account.id) || (t.type === 'TRANSFER' && t.toAccountId === account.id)) {
        credits += Number(t.amount) || 0;
      } else if ((t.type === 'EXPENSE' && t.fromAccountId === account.id) || (t.type === 'TRANSFER' && t.fromAccountId === account.id)) {
        debits += Number(t.amount) || 0;
      }
    }
    return { totalCredits: credits, totalDebits: debits };
  }, [account, transactions]);

  const currentBalance = useMemo(() => {
    return openingBalance + totalCredits - totalDebits;
  }, [openingBalance, totalCredits, totalDebits]);

  // Settlement stats for mapping-enabled account
  const settlementStats = useMemo(() => {
    if (!account || !account.enableMapping) return null;
    let settled = 0;
    let unsettled = 0;
    let totalUnsettledDiff = 0;

    for (const txn of accountTxns) {
      const status = getSettlementStatus(txn, transactions, tolerance);
      if (status.isSettled) {
        settled++;
      } else {
        unsettled++;
        totalUnsettledDiff += status.remainingDifference;
      }
    }

    return { settled, unsettled, totalUnsettledDiff };
  }, [account, accountTxns, transactions, tolerance]);

  // Grouped transactions based on settlement mapping for toggle view
  const mappedGroupsData = useMemo(() => {
    if (!account || !account.enableMapping) return { groups: [], unmapped: [] };

    const processedIds = new Set<string>();
    const groups: {
      parent: Transaction;
      settlements: Transaction[];
      status: ReturnType<typeof getSettlementStatus>;
    }[] = [];
    const unmapped: Transaction[] = [];

    // Pass 1: Identify all parent transactions (transactions that have child transactions mapped to them)
    for (const t of accountTxns) {
      if (processedIds.has(t.id)) continue;

      const children = transactions.filter(c => c.mappedTransactionId === t.id);
      if (children.length > 0) {
        processedIds.add(t.id);
        children.forEach(c => processedIds.add(c.id));
        groups.push({
          parent: t,
          settlements: children.sort((a, b) => (a.date || '').localeCompare(b.date || '')),
          status: getSettlementStatus(t, transactions, tolerance)
        });
      }
    }

    // Pass 2: If a transaction is a child settlement whose parent wasn't added yet
    for (const t of accountTxns) {
      if (processedIds.has(t.id)) continue;

      if (t.mappedTransactionId) {
        const parent = transactions.find(p => p.id === t.mappedTransactionId);
        if (parent) {
          processedIds.add(t.id);
          processedIds.add(parent.id);
          const allSiblings = transactions.filter(c => c.mappedTransactionId === parent.id);
          allSiblings.forEach(c => processedIds.add(c.id));
          groups.push({
            parent,
            settlements: allSiblings.sort((a, b) => (a.date || '').localeCompare(b.date || '')),
            status: getSettlementStatus(parent, transactions, tolerance)
          });
        } else {
          unmapped.push(t);
        }
      } else {
        unmapped.push(t);
      }
    }

    return { groups, unmapped };
  }, [account, accountTxns, transactions, tolerance]);

  // Preview count for PDF export
  const previewTxnCount = useMemo(() => {
    if (!account || !pdfStartDate || !pdfEndDate) return 0;
    return transactions.filter(t => {
      if (t.fromAccountId !== account.id && t.toAccountId !== account.id) return false;
      return t.date >= pdfStartDate && t.date <= pdfEndDate;
    }).length;
  }, [account, transactions, pdfStartDate, pdfEndDate]);

  if (!isOpen || !account) return null;

  const exportCSV = () => {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Debit (₹)', 'Credit (₹)'];
    if (account.enableMapping) {
      headers.push('Settlement Status', 'Settled (₹)', 'Remaining Diff (₹)');
    }

    const rows = accountTxns.map((t) => {
      const isDebit = t.fromAccountId === account.id;
      const baseRow = [
        t.date,
        `"${t.description.replace(/"/g, '""')}"`,
        t.category,
        t.type,
        isDebit ? t.amount : '',
        !isDebit ? t.amount : ''
      ];

      if (account.enableMapping) {
        const s = getSettlementStatus(t, transactions, tolerance);
        baseRow.push(
          s.isSettled ? 'Settled' : 'Unsettled',
          String(s.totalSettled),
          String(s.remainingDifference)
        );
      }
      return baseRow;
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${account.name.replace(/\s+/g, '_')}_passbook.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Generate PDF statement filtered by selected date range
   */
  const handleGeneratePdf = () => {
    if (!account) return;
    setIsExportingPdf(true);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      const sDate = pdfStartDate || '2000-01-01';
      const eDate = pdfEndDate || '2099-12-31';

      // 1. Calculate Period Opening Balance (Base opening balance + credits before sDate - debits before sDate)
      let periodOpening = openingBalance;
      const priorTxns = transactions.filter(t => 
        (t.fromAccountId === account.id || t.toAccountId === account.id) && 
        t.date < sDate
      );
      for (const t of priorTxns) {
        if ((t.type === 'INCOME' && t.toAccountId === account.id) || (t.type === 'TRANSFER' && t.toAccountId === account.id)) {
          periodOpening += Number(t.amount) || 0;
        } else if ((t.type === 'EXPENSE' && t.fromAccountId === account.id) || (t.type === 'TRANSFER' && t.fromAccountId === account.id)) {
          periodOpening -= Number(t.amount) || 0;
        }
      }

      // 2. Filter transactions in the date range and sort chronologically (oldest to newest)
      const rangeTxns = transactions
        .filter(t => (t.fromAccountId === account.id || t.toAccountId === account.id) && t.date >= sDate && t.date <= eDate)
        .sort((a, b) => a.date.localeCompare(b.date));

      let periodCredits = 0;
      let periodDebits = 0;
      let runningBalance = periodOpening;

      // Table columns & rows
      const tableHeaders = [
        ['Date', 'Description', 'Category', 'Debit (INR)', 'Credit (INR)', 'Balance (INR)']
      ];

      if (account.enableMapping) {
        tableHeaders[0].push('Settlement');
      }

      const tableRows: (string | number)[][] = [];

      // Initial opening balance row
      const initialRow = [
        formatDate(sDate),
        'PERIOD OPENING BALANCE',
        '-',
        '-',
        '-',
        formatCurrency(periodOpening)
      ];
      if (account.enableMapping) {
        initialRow.push('-');
      }
      tableRows.push(initialRow);

      for (const t of rangeTxns) {
        const isDebit = (t.type === 'EXPENSE' && t.fromAccountId === account.id) || (t.type === 'TRANSFER' && t.fromAccountId === account.id);
        const isCredit = (t.type === 'INCOME' && t.toAccountId === account.id) || (t.type === 'TRANSFER' && t.toAccountId === account.id);
        const amt = Number(t.amount) || 0;

        if (isDebit) {
          periodDebits += amt;
          runningBalance -= amt;
        } else if (isCredit) {
          periodCredits += amt;
          runningBalance += amt;
        }

        const row = [
          formatDate(t.date),
          t.description || 'Transaction',
          t.category || '-',
          isDebit ? formatCurrency(amt) : '-',
          isCredit ? formatCurrency(amt) : '-',
          formatCurrency(runningBalance)
        ];

        if (account.enableMapping) {
          const s = getSettlementStatus(t, transactions, tolerance);
          const statusText = s.isSettled 
            ? 'SETTLED' 
            : `UNSETTLED (Diff: ${formatCurrency(s.remainingDifference)})`;
          row.push(statusText);
        }

        tableRows.push(row);
      }

      const periodClosing = runningBalance;

      // PDF styling and header
      // Primary banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 595, 75, 'F');

      // Title
      doc.setTextColor(248, 250, 252);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('ACCOUNT PASSBOOK STATEMENT', 36, 32);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(203, 213, 225);
      doc.text(`Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, 36, 48);

      // Account detail cards
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(36, 88, 523, 64, 4, 4, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(36, 88, 523, 64, 4, 4, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(account.name, 48, 106);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const accDetails = [
        account.institution || account.type,
        account.accountNumber ? `A/C: •••• ${account.accountNumber}` : null,
        account.enableMapping ? `Settlement Mapping: Enabled (Disregard: ${formatCurrency(tolerance)})` : null
      ].filter(Boolean).join(' | ');
      doc.text(accDetails, 48, 120);

      doc.text(`Statement Period: ${formatDate(sDate)} to ${formatDate(eDate)}`, 48, 134);

      // Metric Summary Boxes
      const boxY = 162;
      const boxWidth = 124;
      const boxHeight = 44;
      const boxes = [
        { label: 'OPENING BALANCE', value: formatCurrency(periodOpening), color: [15, 23, 42] },
        { label: 'TOTAL INFLOW', value: `+${formatCurrency(periodCredits)}`, color: [16, 185, 129] },
        { label: 'TOTAL OUTFLOW', value: `-${formatCurrency(periodDebits)}`, color: [239, 68, 68] },
        { label: 'CLOSING BALANCE', value: formatCurrency(periodClosing), color: [217, 119, 6] }
      ];

      boxes.forEach((box, idx) => {
        const x = 36 + idx * (boxWidth + 9);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, boxY, boxWidth, boxHeight, 4, 4, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(box.label, x + 8, boxY + 14);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(box.color[0], box.color[1], box.color[2]);
        doc.text(box.value, x + 8, boxY + 32);
      });

      // Ledger Table
      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 218,
        theme: 'striped',
        styles: {
          font: 'helvetica',
          fontSize: 8,
          cellPadding: 5,
          overflow: 'linebreak'
        },
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'left'
        },
        columnStyles: {
          0: { cellWidth: 62 }, // Date
          1: { cellWidth: account.enableMapping ? 120 : 160 }, // Description
          2: { cellWidth: 70 }, // Category
          3: { halign: 'right', cellWidth: 65, textColor: [220, 38, 38] }, // Debit
          4: { halign: 'right', cellWidth: 65, textColor: [22, 163, 74] }, // Credit
          5: { halign: 'right', cellWidth: 70, fontStyle: 'bold', textColor: [15, 23, 42] }, // Balance
          ...(account.enableMapping ? { 6: { cellWidth: 70, fontSize: 7, halign: 'center' } } : {})
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        didDrawPage: (data) => {
          // Footer
          const pageCount = (doc as any).internal?.getNumberOfPages ? (doc as any).internal.getNumberOfPages() : 1;
          const currentPage = (data as any).pageNumber || 1;
          doc.setFontSize(7.5);
          doc.setTextColor(148, 163, 184);
          doc.text(`Chuvadi Passbook • Page ${currentPage} of ${pageCount}`, 36, 825);
          doc.text(`Account ID: ${account.id}`, 460, 825);
        }
      });

      // Save PDF
      const sanitizedName = account.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${sanitizedName}_Passbook_${sDate}_to_${eDate}.pdf`;
      doc.save(filename);

      setShowPdfModal(false);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0d1217] flex flex-col overflow-hidden animate-fadeIn">
      <div className="bg-[#121820] w-full h-full flex flex-col overflow-hidden">
        {/* Full-Screen Header */}
        <div className="px-4 sm:px-8 py-3.5 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-[#161e28] shrink-0">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: account.color || '#0284c7' }} />
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">{account.name}</h2>
            </div>
            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span>{account.institution || account.type}</span>
              {account.accountNumber && (
                <>
                  <span>•</span>
                  <span className="font-mono">•••• {account.accountNumber}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* PDF Export Button (Opens Date Filter Modal) */}
            <button
              onClick={() => setShowPdfModal(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
              title="Export Passbook to PDF"
            >
              <FileText size={14} className="stroke-[2.5]" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={exportCSV}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 border border-slate-700 transition cursor-pointer"
              title="Export Passbook CSV"
            >
              <Download size={14} />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/80 transition cursor-pointer ml-1"
              title="Close Full Screen View"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Metric Card: Show only the current balance */}
        <div className="px-4 sm:px-8 py-3 bg-[#0d1217] border-b border-slate-800/80 shrink-0">
          <div className="p-2.5 sm:p-3 bg-[#161c24] rounded-2xl border border-amber-500/30 bg-amber-500/5 max-w-xs">
            <div className="text-[10px] uppercase font-bold text-amber-400">Current Balance</div>
            <div className="text-base sm:text-lg font-extrabold text-amber-200 font-mono mt-0.5">
              {formatCurrency(currentBalance)}
            </div>
          </div>
        </div>

        {/* Mapping Summary Bar (if account has enableMapping enabled) */}
        {account.enableMapping && settlementStats && (
          <div className="px-4 sm:px-8 py-2 bg-amber-500/5 border-b border-amber-500/15 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-slate-300 font-medium">
                Mapping Active <span className="text-slate-500 font-mono text-[11px]">(Disregard ≤ {formatCurrency(tolerance)})</span>
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 size={13} /> {settlementStats.settled} Settled
              </span>
              <span className="flex items-center gap-1 text-amber-300 font-medium">
                <Clock size={13} /> {settlementStats.unsettled} Unsettled
              </span>
            </div>
          </div>
        )}

        {/* Toolbar: Search & Mapped Group Toggle */}
        <div className="px-4 sm:px-8 py-2.5 border-b border-slate-800/80 bg-[#121820] flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by description, payee, or amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0a0e14] border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {account.enableMapping && (
            <div className="flex items-center gap-1 bg-[#0a0e14] p-1 rounded-xl border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setPassbookViewMode('chronological')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  passbookViewMode === 'chronological'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock size={13} />
                <span>Chronological</span>
              </button>
              <button
                type="button"
                onClick={() => setPassbookViewMode('mapped')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  passbookViewMode === 'mapped'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Link2 size={13} />
                <span>Grouped by Mapping</span>
              </button>
            </div>
          )}
        </div>

        {/* Transaction Ledger List */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 space-y-3">
          {accountTxns.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              No transactions recorded for this account.
            </div>
          ) : passbookViewMode === 'mapped' && account.enableMapping ? (
            /* GROUPED BY MAPPING VIEW */
            <div className="space-y-4">
              {mappedGroupsData.groups.map((group) => {
                const parent = group.parent;
                const isParentTransfer = parent.type === 'TRANSFER';
                const isParentDebit = parent.fromAccountId === account.id;
                const parentTransferStyle = isParentTransfer ? getTransferFlowStyle(parent, accounts, account.id) : null;
                const parentFromAcc = accounts?.find(a => a.id === parent.fromAccountId)?.name || 'Source Account';
                const parentToAcc = accounts?.find(a => a.id === parent.toAccountId)?.name || 'Destination Account';
                const runningBal = runningBalancesMap.get(parent.id);

                return (
                  <div key={parent.id} className="bg-[#121820] rounded-2xl border border-slate-800/90 overflow-hidden shadow-sm">
                    {/* Mapped Group Header: Status & Total Settled */}
                    <div className="px-4 py-2.5 bg-[#161d28] border-b border-slate-800/80 flex items-center justify-between text-xs flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Link2 size={13} className="text-amber-400" />
                        <span className="font-bold text-slate-200">Mapped Group</span>
                        {group.status.isSettled ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={11} /> Settled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                            <Clock size={11} /> Unsettled (Diff: {formatCurrency(group.status.remainingDifference)})
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Settled: <span className="text-emerald-400 font-semibold">{formatCurrency(group.status.totalSettled)}</span> / {formatCurrency(parent.amount)}
                      </div>
                    </div>

                    {/* First Instance: Primary / Parent Transaction */}
                    <div
                      onClick={() => onSelectTxn(parent)}
                      className="p-3.5 bg-[#0e141c] hover:bg-slate-800/50 cursor-pointer transition flex items-center justify-between gap-3 border-b border-slate-800/50"
                      title="Click to view primary transaction"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
                            isParentTransfer
                              ? parentTransferStyle?.badgeBgClass
                              : isParentDebit
                              ? 'bg-rose-500/15 text-rose-400'
                              : 'bg-emerald-500/15 text-emerald-400'
                          }`}
                        >
                          {isParentTransfer ? (
                            <ArrowRightLeft size={15} />
                          ) : isParentDebit ? (
                            <ArrowUpRight size={15} />
                          ) : (
                            <ArrowDownLeft size={15} />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              First Instance
                            </span>
                            {isParentTransfer ? (
                              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                <span className="text-slate-200">{parentFromAcc}</span>
                                <ArrowRight size={12} className="text-blue-400 shrink-0" />
                                <span className="text-slate-200">{parentToAcc}</span>
                              </div>
                            ) : (
                              <div className="text-xs font-semibold text-white tracking-tight truncate">
                                {parent.description}
                              </div>
                            )}
                          </div>

                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="font-mono">{formatDate(parent.date)}</span>
                            {(() => {
                              const cat = (parent.category || '').trim();
                              if (!cat || ['EXPENSE', 'INCOME', 'TRANSFER', 'GENERAL'].includes(cat.toUpperCase())) return null;
                              return (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-300/80 truncate max-w-[150px]">{cat}</span>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Parent Amount & Running Balance */}
                      <div className="text-right shrink-0">
                        <div
                          className={`text-sm font-bold font-mono tabular-nums ${
                            isParentTransfer
                              ? parentTransferStyle?.colorClass
                              : isParentDebit
                              ? 'text-rose-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {isParentTransfer 
                            ? `${parentTransferStyle?.sign}${formatCurrency(parent.amount)}` 
                            : isParentDebit 
                            ? `-${formatCurrency(parent.amount)}` 
                            : `+${formatCurrency(parent.amount)}`}
                        </div>
                        {runningBal !== undefined && (
                          <div className="text-[11px] font-mono text-slate-400 font-medium tabular-nums mt-0.5">
                            Bal: {formatCurrency(runningBal)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Settlement Entries Down Below */}
                    {group.settlements.length > 0 ? (
                      <div className="p-3 pl-6 sm:pl-8 space-y-2 bg-[#121820]">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1.5">
                          <ArrowDownLeft size={12} className="text-emerald-400" />
                          <span>Settlement Entries ({group.settlements.length})</span>
                        </div>
                        {group.settlements.map((child) => {
                          const isChildTransfer = child.type === 'TRANSFER';
                          const isChildDebit = child.fromAccountId === account.id;
                          const childTransferStyle = isChildTransfer ? getTransferFlowStyle(child, accounts, account.id) : null;
                          const childRunningBal = runningBalancesMap.get(child.id);
                          const childFromAcc = accounts?.find(a => a.id === child.fromAccountId)?.name || 'Source Account';
                          const childToAcc = accounts?.find(a => a.id === child.toAccountId)?.name || 'Destination Account';

                          return (
                            <div
                              key={child.id}
                              onClick={() => onSelectTxn(child)}
                              className="p-2.5 rounded-xl bg-[#0a0e14] hover:bg-slate-800/60 border border-slate-800/80 flex items-center justify-between gap-3 cursor-pointer transition group"
                              title="Click to view settlement entry"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                <div className="min-w-0">
                                  {isChildTransfer ? (
                                    <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                                      <span className="text-slate-200">{childFromAcc}</span>
                                      <ArrowRight size={10} className="text-blue-400 shrink-0" />
                                      <span className="text-slate-200">{childToAcc}</span>
                                    </div>
                                  ) : (
                                    <div className="text-xs font-medium text-slate-200 truncate">
                                      {child.description}
                                    </div>
                                  )}
                                  <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                                    <span>{formatDate(child.date)}</span>
                                    {(() => {
                                      const cat = (child.category || '').trim();
                                      if (!cat || ['EXPENSE', 'INCOME', 'TRANSFER', 'GENERAL'].includes(cat.toUpperCase())) return null;
                                      return (
                                        <>
                                          <span>•</span>
                                          <span className="text-slate-400 truncate max-w-[120px]">{cat}</span>
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <div
                                  className={`text-xs font-bold font-mono tabular-nums ${
                                    isChildTransfer
                                      ? childTransferStyle?.colorClass
                                      : isChildDebit
                                      ? 'text-rose-400'
                                      : 'text-emerald-400'
                                  }`}
                                >
                                  {isChildTransfer 
                                    ? `${childTransferStyle?.sign}${formatCurrency(child.amount)}` 
                                    : isChildDebit 
                                    ? `-${formatCurrency(child.amount)}` 
                                    : `+${formatCurrency(child.amount)}`}
                                </div>
                                {childRunningBal !== undefined && (
                                  <div className="text-[10px] font-mono text-slate-500 font-medium tabular-nums mt-0.5">
                                    Bal: {formatCurrency(childRunningBal)}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-3 bg-[#121820] text-[11px] text-slate-500 italic pl-6">
                        No settling entries linked yet.
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Unmapped / Independent Entries */}
              {mappedGroupsData.unmapped.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                    Other / Direct Entries ({mappedGroupsData.unmapped.length})
                  </div>
                  <div className="bg-[#121820] rounded-2xl border border-slate-800/80 divide-y divide-slate-800/60 overflow-hidden">
                    {mappedGroupsData.unmapped.map((txn) => {
                      const isTransfer = txn.type === 'TRANSFER';
                      const isDebit = txn.fromAccountId === account.id;
                      const transferStyle = isTransfer ? getTransferFlowStyle(txn, accounts, account.id) : null;
                      const runningBal = runningBalancesMap.get(txn.id);
                      const fromAcc = accounts?.find(a => a.id === txn.fromAccountId)?.name || 'Source Account';
                      const toAcc = accounts?.find(a => a.id === txn.toAccountId)?.name || 'Destination Account';

                      return (
                        <div
                          key={txn.id}
                          onClick={() => onSelectTxn(txn)}
                          className="py-3 px-3.5 flex items-center justify-between hover:bg-slate-800/40 cursor-pointer transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
                                isTransfer
                                  ? transferStyle?.badgeBgClass
                                  : isDebit
                                  ? 'bg-rose-500/15 text-rose-400'
                                  : 'bg-emerald-500/15 text-emerald-400'
                              }`}
                            >
                              {isTransfer ? (
                                <ArrowRightLeft size={15} />
                              ) : isDebit ? (
                                <ArrowUpRight size={15} />
                              ) : (
                                <ArrowDownLeft size={15} />
                              )}
                            </div>
                            <div className="min-w-0">
                              {isTransfer ? (
                                <div className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                                  <span className="text-slate-200">{fromAcc}</span>
                                  <ArrowRight size={12} className="text-blue-400 shrink-0" />
                                  <span className="text-slate-200">{toAcc}</span>
                                </div>
                              ) : (
                                <div className="text-xs font-semibold text-white tracking-tight truncate">
                                  {txn.description}
                                </div>
                              )}
                              <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="font-mono">{formatDate(txn.date)}</span>
                                {(() => {
                                  const cat = (txn.category || '').trim();
                                  if (!cat || ['EXPENSE', 'INCOME', 'TRANSFER', 'GENERAL'].includes(cat.toUpperCase())) return null;
                                  return (
                                    <>
                                      <span>•</span>
                                      <span className="text-amber-300/80 truncate max-w-[150px]">{cat}</span>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 ml-3">
                            <div
                              className={`text-xs font-bold font-mono tabular-nums ${
                                isTransfer
                                  ? transferStyle?.colorClass
                                  : isDebit
                                  ? 'text-rose-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {isTransfer 
                                ? `${transferStyle?.sign}${formatCurrency(txn.amount)}` 
                                : isDebit 
                                ? `-${formatCurrency(txn.amount)}` 
                                : `+${formatCurrency(txn.amount)}`}
                            </div>
                            {runningBal !== undefined && (
                              <div className="text-[11px] font-mono text-slate-400 font-medium tabular-nums mt-0.5">
                                Bal: {formatCurrency(runningBal)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* CHRONOLOGICAL VIEW (Sorted strictly by transaction date) */
            <div className="bg-[#121820] rounded-2xl border border-slate-800/80 divide-y divide-slate-800/60 overflow-hidden shadow-sm">
              {accountTxns.map((txn) => {
                const isTransfer = txn.type === 'TRANSFER';
                const isDebit = txn.fromAccountId === account.id;
                const isSettlementMapped = Boolean(txn.mappedTransactionId);
                const transferStyle = isTransfer ? getTransferFlowStyle(txn, accounts, account.id) : null;
                const settlementInfo = account.enableMapping 
                  ? getSettlementStatus(txn, transactions, tolerance) 
                  : null;
                const runningBal = runningBalancesMap.get(txn.id);

                const fromAccountName = accounts?.find(a => a.id === txn.fromAccountId)?.name || 'Source Account';
                const toAccountName = accounts?.find(a => a.id === txn.toAccountId)?.name || 'Destination Account';

                return (
                  <div
                    key={txn.id}
                    onClick={() => onSelectTxn(txn)}
                    className="py-3 px-3.5 flex items-center justify-between hover:bg-slate-800/40 cursor-pointer transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
                          isTransfer
                            ? transferStyle?.badgeBgClass
                            : isDebit
                            ? 'bg-rose-500/15 text-rose-400'
                            : 'bg-emerald-500/15 text-emerald-400'
                        }`}
                      >
                        {isTransfer ? (
                          <ArrowRightLeft size={16} />
                        ) : isDebit ? (
                          <ArrowUpRight size={16} />
                        ) : (
                          <ArrowDownLeft size={16} />
                        )}
                      </div>
                      <div className="min-w-0">
                        {isTransfer ? (
                          <div className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-200">{fromAccountName}</span>
                            <ArrowRight size={12} className="text-blue-400 shrink-0" />
                            <span className="text-slate-200">{toAccountName}</span>
                            {isSettlementMapped && (
                              <span title="Linked Settlement Transaction" className="text-blue-400 shrink-0">
                                <Link2 size={12} />
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs font-semibold text-white tracking-tight truncate flex items-center gap-1.5">
                            <span>{txn.description}</span>
                            {isSettlementMapped && (
                              <span title="Linked Settlement Transaction" className="text-blue-400 shrink-0">
                                <Link2 size={12} />
                              </span>
                            )}
                          </div>
                        )}

                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="font-mono">{formatDate(txn.date)}</span>
                          {(() => {
                            const cat = (txn.category || '').trim();
                            if (!cat || ['EXPENSE', 'INCOME', 'TRANSFER', 'GENERAL'].includes(cat.toUpperCase())) return null;
                            return (
                              <>
                                <span>•</span>
                                <span className="text-amber-300/80 truncate max-w-[150px]">{cat}</span>
                              </>
                            );
                          })()}
                          {isTransfer && txn.description && txn.description !== 'Transfer' && !txn.description.toLowerCase().includes('transfer record') && (
                            <>
                              <span>•</span>
                              <span className="text-slate-400 truncate max-w-[150px] sm:max-w-xs">{txn.description}</span>
                            </>
                          )}

                          {/* Settlement Status Badge for mapping-enabled account */}
                          {account.enableMapping && settlementInfo && (
                            <>
                              <span>•</span>
                              {settlementInfo.isSettled ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                                  <CheckCircle2 size={11} />
                                  <span>Settled</span>
                                  {settlementInfo.isChildSettlement && (
                                    <span className="text-[9px] text-emerald-500/80">(Linked)</span>
                                  )}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded">
                                  <Clock size={11} />
                                  <span>Unsettled</span>
                                  <span className="text-[9px] text-amber-400/90 font-mono">
                                    (Diff: {formatCurrency(settlementInfo.remainingDifference)})
                                  </span>
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-3">
                      <div
                        className={`text-xs font-bold font-mono tabular-nums ${
                          isTransfer
                            ? transferStyle?.colorClass
                            : isDebit
                            ? 'text-rose-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {isTransfer 
                          ? `${transferStyle?.sign}${formatCurrency(txn.amount)}` 
                          : isDebit 
                          ? `-${formatCurrency(txn.amount)}` 
                          : `+${formatCurrency(txn.amount)}`}
                      </div>
                      {runningBal !== undefined && (
                        <div className="text-[11px] font-mono text-slate-400 font-medium tabular-nums mt-0.5">
                          Bal: {formatCurrency(runningBal)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Date Filter Modal for PDF Export */}
      {showPdfModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#151c26] w-full max-w-md rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col p-5 sm:p-6 animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Export Passbook PDF</h3>
                  <p className="text-[11px] text-slate-400">Select statement date period for {account.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPdfModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Presets */}
            <div className="my-4">
              <label className="text-[11px] font-semibold text-slate-300 block mb-2 flex items-center gap-1.5">
                <Filter size={12} className="text-amber-400" />
                <span>Quick Date Presets</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'all', label: 'All Time' },
                    { id: 'this_month', label: 'This Month' },
                    { id: 'last_month', label: 'Last Month' },
                    { id: 'last_30_days', label: 'Last 30 Days' },
                    { id: 'this_year', label: 'This Year' },
                    { id: 'custom', label: 'Custom' }
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      if (p.id === 'custom') {
                        setPdfPreset('custom');
                      } else {
                        applyDatePreset(p.id);
                      }
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition text-center ${
                      pdfPreset === p.id
                        ? 'bg-amber-500 text-slate-950 border-amber-500 font-semibold shadow-sm'
                        : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Pickers */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">From Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={pdfStartDate}
                    onChange={(e) => {
                      setPdfStartDate(e.target.value);
                      setPdfPreset('custom');
                    }}
                    className="w-full bg-[#0e141c] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">To Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={pdfEndDate}
                    onChange={(e) => {
                      setPdfEndDate(e.target.value);
                      setPdfPreset('custom');
                    }}
                    className="w-full bg-[#0e141c] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Summary preview bar */}
            <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 mb-5 flex items-center justify-between text-xs">
              <span className="text-slate-400">Statement Content:</span>
              <span className="font-semibold text-amber-300">
                {previewTxnCount} {previewTxnCount === 1 ? 'transaction' : 'transactions'} included
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowPdfModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGeneratePdf}
                disabled={isExportingPdf || !pdfStartDate || !pdfEndDate}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExportingPdf ? (
                  <>
                    <span className="w-3 h-3 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <FileText size={14} className="stroke-[2.5]" />
                    <span>Download PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
