import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Car, Bike } from 'lucide-react';
import type { Vehicle } from '../../types';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (veh: Omit<Vehicle, 'id'> & { id?: string }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  initialData?: Vehicle | null;
}

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData
}) => {
  const [name, setName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [type, setType] = useState<Vehicle['type']>('BIKE');
  const [fuelType, setFuelType] = useState<Vehicle['fuelType']>('PETROL');
  const [currentOdometer, setCurrentOdometer] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [pucExpiry, setPucExpiry] = useState('');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setVehicleNumber(initialData.vehicleNumber);
      setType(initialData.type);
      setFuelType(initialData.fuelType);
      setCurrentOdometer(String(initialData.currentOdometer || '0'));
      setInsuranceExpiry(initialData.insuranceExpiry || '');
      setPucExpiry(initialData.pucExpiry || '');
      setInsurancePolicyNumber(initialData.insurancePolicyNumber || '');
    } else {
      setName('');
      setVehicleNumber('');
      setType('BIKE');
      setFuelType('PETROL');
      setCurrentOdometer('');
      setInsuranceExpiry('');
      setPucExpiry('');
      setInsurancePolicyNumber('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        id: initialData?.id,
        name: name.trim(),
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        type,
        fuelType,
        currentOdometer: parseFloat(currentOdometer) || 0,
        insuranceExpiry: insuranceExpiry || undefined,
        pucExpiry: pucExpiry || undefined,
        insurancePolicyNumber: insurancePolicyNumber.trim() || undefined
      });
      onClose();
    } catch (err) {
      console.error('Error saving vehicle:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData || !onDelete) return;
    if (!window.confirm(`Delete vehicle "${initialData.name}"?`)) return;
    setIsSaving(true);
    try {
      await onDelete(initialData.id);
      onClose();
    } catch (err) {
      console.error('Error deleting vehicle:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121820] w-full max-w-md rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#161d26]">
          <div className="text-amber-300 font-bold text-base flex items-center gap-2">
            {type === 'BIKE' ? <Bike size={18} /> : <Car size={18} />}
            <span>{initialData ? 'Edit Vehicle' : 'Register New Vehicle'}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Vehicle Model / Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Royal Enfield Hunter 350, Hyundai Creta"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0e131a] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Registration No.
              </label>
              <input
                type="text"
                placeholder="e.g. TN 07 CA 4589"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                className="w-full bg-[#0e131a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Current Odometer (km)
              </label>
              <input
                type="number"
                placeholder="0"
                value={currentOdometer}
                onChange={(e) => setCurrentOdometer(e.target.value)}
                className="w-full bg-[#0e131a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Vehicle Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-[#0e131a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="BIKE">Motorcycle / Bike</option>
                <option value="CAR">Car / SUV</option>
                <option value="SCOOTER">Scooter</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Fuel Type
              </label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as any)}
                className="w-full bg-[#0e131a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="PETROL">Petrol</option>
                <option value="DIESEL">Diesel</option>
                <option value="ELECTRIC">Electric (EV)</option>
                <option value="CNG">CNG</option>
              </select>
            </div>
          </div>

          {/* Renewals Section */}
          <div className="p-3.5 bg-amber-950/20 border border-amber-900/40 rounded-2xl space-y-3">
            <div className="text-xs font-bold text-amber-300">
              Mandatory Expiry & Renewal Dates
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Insurance Expiry</label>
                <input
                  type="date"
                  value={insuranceExpiry}
                  onChange={(e) => setInsuranceExpiry(e.target.value)}
                  className="w-full bg-[#0e131a] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">PUC / Emission Expiry</label>
                <input
                  type="date"
                  value={pucExpiry}
                  onChange={(e) => setPucExpiry(e.target.value)}
                  className="w-full bg-[#0e131a] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Policy / Document Number</label>
              <input
                type="text"
                placeholder="e.g. POL-BAJAJ-88124"
                value={insurancePolicyNumber}
                onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                className="w-full bg-[#0e131a] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-3">
            {initialData && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-bold"
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
              {isSaving ? 'Saving...' : 'Save Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
