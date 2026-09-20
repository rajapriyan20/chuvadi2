import React, { useState, useMemo } from 'react';
import { 
  Car, 
  Bike, 
  Plus, 
  Fuel, 
  Wrench, 
  ShieldCheck, 
  FileCheck, 
  Edit3, 
  Gauge, 
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { formatCurrency, formatDate, getDaysRemaining } from '../../utils/formatters';
import type { Vehicle, VehicleLog } from '../../types';

interface GarageTabProps {
  vehicles: Vehicle[];
  vehicleLogs: VehicleLog[];
  onOpenNewVehicle: () => void;
  onEditVehicle: (veh: Vehicle) => void;
  onOpenNewLog: (vehicleId?: string, defaultType?: 'FUEL' | 'SERVICE') => void;
  onEditLog: (log: VehicleLog) => void;
}

export const GarageTab: React.FC<GarageTabProps> = ({
  vehicles,
  vehicleLogs,
  onOpenNewVehicle,
  onEditVehicle,
  onOpenNewLog,
  onEditLog
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('ALL');

  const filteredLogs = useMemo(() => {
    if (selectedVehicleId === 'ALL') return vehicleLogs;
    return vehicleLogs.filter(l => l.vehicleId === selectedVehicleId);
  }, [vehicleLogs, selectedVehicleId]);

  // Overall stats
  const totalFuelCost = filteredLogs.filter(l => l.type === 'FUEL').reduce((sum, l) => sum + l.cost, 0);
  const totalFuelLiters = filteredLogs.filter(l => l.type === 'FUEL').reduce((sum, l) => sum + (l.fuelLiters || 0), 0);
  const totalServiceCost = filteredLogs.filter(l => l.type === 'SERVICE' || l.type === 'REPAIR').reduce((sum, l) => sum + l.cost, 0);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header & Vehicles Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Garage & Fleet</h2>
            <div className="text-xs text-slate-400">Manage vehicle odometer, fuel logs, service history, and renewals</div>
          </div>
          <button
            onClick={onOpenNewVehicle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161c24] hover:bg-slate-800 text-amber-300 border border-slate-700 text-xs font-semibold transition"
          >
            <Plus size={15} />
            <span>Add Vehicle</span>
          </button>
        </div>

        {/* Vehicles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {vehicles.map((v) => {
            const insStatus = getDaysRemaining(v.insuranceExpiry);
            const pucStatus = getDaysRemaining(v.pucExpiry);

            return (
              <div
                key={v.id}
                className="p-5 bg-[#141b24] rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        {v.type === 'BIKE' ? <Bike size={22} /> : <Car size={22} />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{v.name}</div>
                        <div className="text-xs font-mono text-slate-400 uppercase">
                          {v.vehicleNumber || 'Unregistered'} • {v.fuelType}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onEditVehicle(v)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition"
                      title="Edit vehicle details"
                    >
                      <Edit3 size={15} />
                    </button>
                  </div>

                  {/* Odometer Display */}
                  <div className="mt-4 p-3 bg-[#0f141c] rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                      <Gauge size={15} className="text-amber-400" />
                      <span>Odometer</span>
                    </div>
                    <div className="text-base font-extrabold text-amber-200 font-mono">
                      {(v.currentOdometer || 0).toLocaleString('en-IN')} km
                    </div>
                  </div>

                  {/* Expiry / Renewal Badges */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {/* Insurance */}
                    <div className="p-2.5 bg-[#0f141c] rounded-xl border border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold uppercase">
                          <ShieldCheck size={12} className="text-emerald-400" />
                          <span>Insurance</span>
                        </span>
                        {insStatus && (
                          <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${
                            insStatus.isOverdue
                              ? 'bg-rose-500/20 text-rose-300'
                              : insStatus.days <= 30
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'text-slate-400'
                          }`}>
                            {insStatus.label}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-white mt-1">
                        {v.insuranceExpiry ? formatDate(v.insuranceExpiry) : 'Not recorded'}
                      </div>
                    </div>

                    {/* PUC */}
                    <div className="p-2.5 bg-[#0f141c] rounded-xl border border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold uppercase">
                          <FileCheck size={12} className="text-blue-400" />
                          <span>PUC Test</span>
                        </span>
                        {pucStatus && (
                          <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${
                            pucStatus.isOverdue
                              ? 'bg-rose-500/20 text-rose-300'
                              : pucStatus.days <= 30
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'text-slate-400'
                          }`}>
                            {pucStatus.label}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-white mt-1">
                        {v.pucExpiry ? formatDate(v.pucExpiry) : 'Not recorded'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fast Action Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => onOpenNewLog(v.id, 'FUEL')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-xs font-bold transition"
                  >
                    <Fuel size={14} />
                    <span>Log Fuel</span>
                  </button>
                  <button
                    onClick={() => onOpenNewLog(v.id, 'SERVICE')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition"
                  >
                    <Wrench size={14} />
                    <span>Log Service</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 p-4 bg-[#131922] rounded-3xl border border-slate-800">
        <div className="p-3 bg-[#161c24] rounded-2xl border border-slate-800">
          <div className="text-[10px] uppercase font-bold text-amber-400">Total Fuel Spent</div>
          <div className="text-base font-bold text-amber-200 font-mono mt-0.5">
            {formatCurrency(totalFuelCost)}
          </div>
        </div>
        <div className="p-3 bg-[#161c24] rounded-2xl border border-slate-800">
          <div className="text-[10px] uppercase font-bold text-emerald-400">Fuel Liters</div>
          <div className="text-base font-bold text-emerald-300 font-mono mt-0.5">
            {totalFuelLiters.toFixed(1)} L
          </div>
        </div>
        <div className="p-3 bg-[#161c24] rounded-2xl border border-slate-800">
          <div className="text-[10px] uppercase font-bold text-blue-400">Service & Repair</div>
          <div className="text-base font-bold text-blue-300 font-mono mt-0.5">
            {formatCurrency(totalServiceCost)}
          </div>
        </div>
      </div>

      {/* Service & Fuel Logs History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight">Maintenance & Fuel Timeline</h2>
          <button
            onClick={() => onOpenNewLog()}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>New Log</span>
          </button>
        </div>

        {/* Vehicle Filter Selector */}
        {vehicles.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedVehicleId('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedVehicleId === 'ALL'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-[#141b24] text-slate-400 hover:text-white'
              }`}
            >
              All Vehicles
            </button>
            {vehicles.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVehicleId(v.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedVehicleId === v.id
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-[#141b24] text-slate-400 hover:text-white'
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
        )}

        {/* Logs Timeline */}
        <div className="bg-[#131922] rounded-3xl border border-slate-800 divide-y divide-slate-800/60 overflow-hidden">
          {filteredLogs.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-xs">
              No fuel or service logs logged yet.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const matchedVeh = vehicles.find(v => v.id === log.vehicleId);

              return (
                <div
                  key={log.id}
                  onClick={() => onEditLog(log)}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-800/40 cursor-pointer transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                        log.type === 'FUEL'
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-blue-500/15 text-blue-400'
                      }`}
                    >
                      {log.type === 'FUEL' ? <Fuel size={17} /> : <Wrench size={17} />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{log.title}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{formatDate(log.date)}</span>
                        <span>•</span>
                        <span className="text-amber-300/80">{matchedVeh?.name || 'Vehicle'}</span>
                        {log.fuelLiters && <span>({log.fuelLiters}L)</span>}
                        {log.odometer && <span>• {log.odometer} km</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-amber-300 font-mono">
                      {formatCurrency(log.cost)}
                    </div>
                    <div className="text-[10px] text-slate-500">{log.workshop || log.type}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
