import React, { useState } from 'react';
import { X, FileSpreadsheet, FileJson, Upload, CheckCircle2 } from 'lucide-react';
import type { Account, Transaction, Vehicle, VehicleLog, TodoNote, Entity } from '../../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  transactions: Transaction[];
  vehicles: Vehicle[];
  vehicleLogs: VehicleLog[];
  todos: TodoNote[];
  entities: Entity[];
  onImportData: (imported: {
    accounts?: Account[];
    transactions?: Transaction[];
    vehicles?: Vehicle[];
    vehicleLogs?: VehicleLog[];
    todos?: TodoNote[];
    entities?: Entity[];
  }) => Promise<void>;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  accounts,
  transactions,
  vehicles,
  vehicleLogs,
  todos,
  entities,
  onImportData
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const exportTransactionsCSV = () => {
    const headers = ['ID', 'Date', 'Type', 'Amount (INR)', 'Description', 'Category', 'From Account', 'To Account', 'Vehicle', 'Fuel Liters', 'Odometer (km)', 'Notes'];
    
    const accountMap = new Map(accounts.map(a => [a.id, a.name]));
    const vehicleMap = new Map(vehicles.map(v => [v.id, v.name]));

    const rows = transactions.map((t) => [
      t.id,
      t.date,
      t.type,
      t.amount,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.category,
      t.fromAccountId ? `"${(accountMap.get(t.fromAccountId) || '').replace(/"/g, '""')}"` : '',
      t.toAccountId ? `"${(accountMap.get(t.toAccountId) || '').replace(/"/g, '""')}"` : '',
      t.vehicleId ? `"${(vehicleMap.get(t.vehicleId) || '').replace(/"/g, '""')}"` : '',
      t.fuelLiters || '',
      t.odometer || '',
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);

    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `chuvadi_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportFullJSON = () => {
    const fullBackup = {
      app: 'Chuvadi - A Way of Life',
      exportDate: new Date().toISOString(),
      version: 'v2.0.0',
      accounts,
      transactions,
      vehicles,
      vehicleLogs,
      todos,
      entities
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = `chuvadi_complete_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const json = JSON.parse(text);
        await onImportData(json);
        setImportStatus('Backup restored successfully!');
        setTimeout(() => {
          onClose();
        }, 1500);
      } catch (err: any) {
        setImportStatus(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121820] w-full max-w-md rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#161d26]">
          <div className="text-amber-300 font-bold text-base">Export & Backup Data</div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-400">
            Export your financial records, garage logs, and checklists for tax filing, spreadsheet analysis, or local cold storage.
          </p>

          <div className="grid grid-cols-1 gap-3">
            {/* CSV Export */}
            <button
              onClick={exportTransactionsCSV}
              className="flex items-center justify-between p-4 bg-[#161c24] hover:bg-slate-800/80 rounded-2xl border border-slate-800 transition group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <div className="text-sm font-bold text-white group-hover:text-amber-300">
                    Export Transactions CSV
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {transactions.length} records • Compatible with Excel & Sheets
                  </div>
                </div>
              </div>
            </button>

            {/* JSON Export */}
            <button
              onClick={exportFullJSON}
              className="flex items-center justify-between p-4 bg-[#161c24] hover:bg-slate-800/80 rounded-2xl border border-slate-800 transition group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <FileJson size={22} />
                </div>
                <div>
                  <div className="text-sm font-bold text-white group-hover:text-amber-300">
                    Complete App Backup (JSON)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Accounts, Vehicles, Todos & Logs
                  </div>
                </div>
              </div>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Restore from Backup (JSON)
            </label>
            <label className="flex items-center justify-center gap-2 p-3 bg-slate-900/60 hover:bg-slate-800 border border-dashed border-slate-700 rounded-xl cursor-pointer transition text-xs font-semibold text-slate-300">
              <Upload size={16} />
              <span>Select .json backup file</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {importStatus && (
            <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{importStatus}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
