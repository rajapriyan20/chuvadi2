import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Wrench, Fuel, ShieldCheck, FileCheck } from 'lucide-react';
import type { Vehicle, VehicleLog, VehicleLogType } from '../../types';

interface ServiceLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (log: Omit<VehicleLog, 'id'> & { id?: string }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  vehicles: Vehicle[];
  initialVehicleId?: string;
  initialData?: VehicleLog | null;
}

export const ServiceLogModal: React.FC<ServiceLogModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  vehicles,
  initialVehicleId,
  initialData
}) => {
  const [vehicleId, setVehicleId] = useState(initialVehicleId || vehicles[0]?.id || '');
  const [type, setType] = useState<VehicleLogType>('FUEL');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [odometer, setOdometer] = useState('');
  const [cost, setCost] = useState('');
  const [fuelLiters, setFuelLiters] = useState('');
  const [workshop, setWorkshop] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setVehicleId(initialData.vehicleId);
      setType(initialData.type);
      setTitle(initialData.title);
      setDate(initialData.date);
      setOdometer(String(initialData.odometer || ''));
      setCost(String(initialData.cost || ''));
      setFuelLiters(initialData.fuelLiters ? String(initialData.fuelLiters) : '');
      setWorkshop(initialData.workshop || '');
      setNotes(initialData.notes || '');
    } else {
      const vid = initialVehicleId || vehicles[0]?.id || '';
      setVehicleId(vid);
      setType('FUEL');
      setTitle('Petrol Refuel');
      setDate(new Date().toISOString().split('T')[0]);
      const selVeh = vehicles.find(v => v.id === vid);
      setOdometer(selVeh?.currentOdometer ? String(selVeh.currentOdometer) : '');
      setCost('');
      setFuelLiters('');
      setWorkshop('');
      setNotes('');
    }
  }, [initialData, initialVehicleId, isOpen, vehicles]);

  if (!isOpen) return null;

  const handleTypeChange = (t: VehicleLogType) => {
    setType(t);
    if (t === 'FUEL') setTitle('Petrol Refuel');
    else if (t === 'SERVICE') setTitle('Periodic Service & Oil Change');
    else if (t === 'INSURANCE') setTitle('Insurance Premium Renewal');
    else if (t === 'PUC') setTitle('PUC Emission Test Passed');
    else if (t === 'REPAIR') setTitle('Tyre / Brake Repair');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !title.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        id: initialData?.id,
        vehicleId,
        type,
        title: title.trim(),
        date,
        timestamp: initialData?.timestamp || Date.now(),
        odometer: parseFloat(odometer) || 0,
        cost: parseFloat(cost) || 0,
        fuelLiters: fuelLiters ? parseFloat(fuelLiters) : undefined,
        workshop: workshop.trim() || undefined,
        notes: notes.trim() || undefined
      });
      onClose();
    } catch (err) {
      console.error('Error saving vehicle log:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121820] w-full max-w-md rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#161d26]">
          <div className="text-amber-300 font-bold text-base flex items-center gap-2">
            {type === 'FUEL' ? <Fuel size={18} /> : <Wrench size={18} />}
            <span>{initialData ? 'Edit Garage Log' : 'New Garage Entry'}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Vehicle Selector */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Select Vehicle *
            </label>
            <select
              value={vehicleId}
              onChange={(e) => {
                setVehicleId(e.target.value);
                const veh = vehicles.find(v => v.id === e.target.value);
                if (veh?.currentOdometer && !odometer) {
                  setOdometer(String(veh.currentOdometer));
                }
              }}
              required
              className="w-full bg-[#0e131a] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.vehicleNumber || 'No reg'})
                </option>
              ))}
            </select>
          </div>

          {/* Log Type Selection */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-center">
            {(['FUEL', 'SERVICE', 'INSURANCE', 'PUC'] as VehicleLogType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTypeChange(t)}
                className={`py-1.5 text-[11px] font-bold rounded-lg transition ${
                  type === t
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Title / Activity *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0e131a] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Cost (₹)
              </label>
              <input
                type="number"
                step="any"
                placeholder="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full bg-[#0e131a] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Odometer (km)
              </label>
              <input
                type="number"
                placeholder="Current km"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                className="w-full bg-[#0e131a] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
              />
            </div>
          </div>

          {type === 'FUEL' && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Fuel Volume (Liters)
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 14.2"
                value={fuelLiters}
                onChange={(e) => setFuelLiters(e.target.value)}
                className="w-full bg-[#0e131a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#0e131a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Station / Workshop
              </label>
              <input
                type="text"
                placeholder="e.g. Shell, Bosch Care"
                value={workshop}
                onChange={(e) => setWorkshop(e.target.value)}
                className="w-full bg-[#0e131a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#0e131a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-3">
            {initialData && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(initialData.id)}
                className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400"
            >
              {isSaving ? 'Logging...' : 'Save Garage Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
