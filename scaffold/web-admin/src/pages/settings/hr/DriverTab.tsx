import React from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Bike,
  Phone,
  Mail,
  QrCode,
  Lock,
  Route,
  Award
} from 'lucide-react';
import { Driver } from './types';

interface DriverTabProps {
  drivers: Driver[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onAddDriver: () => void;
  onEditDriver: (driver: Driver) => void;
  onDeleteDriver: (id: string) => void;
  onSetPin: (driver: Driver) => void;
  onOpenQr: (driver: Driver) => void;
  getStatusColor: (status: string) => string;
  loading: boolean;
}

const DriverTab: React.FC<DriverTabProps> = ({
  drivers,
  searchQuery,
  setSearchQuery,
  onAddDriver,
  onEditDriver,
  onDeleteDriver,
  onSetPin,
  onOpenQr,
  getStatusColor,
  loading
}) => {
  const filteredDrivers = drivers.filter(d =>
    (d.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search drivers by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            <Filter size={18} />
            Filter
          </button>
          <button 
            onClick={onAddDriver}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20"
          >
            <Plus size={18} />
            Add Driver
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Synchronizing delivery drivers...</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDrivers.map((driver) => (
            <div 
              key={driver.id} 
              className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shadow-sm">
                      {driver.vehicleType === 'Bike' ? <Bike size={24} /> : <Truck size={24} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors">{driver.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{driver.id}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${getStatusColor(driver.status)}`}>
                    {driver.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600">
                    <div className="flex items-center gap-2 mb-1 text-gray-400">
                      <Route size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Rate</span>
                    </div>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200">${Number(driver.perDeliveryRate || 0).toFixed(2)}/del</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600">
                    <div className="flex items-center gap-2 mb-1 text-gray-400">
                      <Award size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Rating</span>
                    </div>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{driver.rating || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Phone size={14} className="text-gray-400" />
                    <span>{driver.phone || 'No phone'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Mail size={14} className="text-gray-400" />
                    <span className="truncate">{driver.email || 'No email'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-50 dark:border-slate-700">
                  <button 
                    onClick={() => onOpenQr(driver)}
                    className="flex-1 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <QrCode size={14} />
                    Login QR
                  </button>
                  <button 
                    onClick={() => onSetPin(driver)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${driver.hasPin ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}
                  >
                    <Lock size={14} />
                    {driver.hasPin ? 'Update PIN' : 'Set PIN'}
                  </button>
                  <div className="relative group/menu">
                    <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical size={18} />
                    </button>
                    <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-1 hidden group-hover/menu:block z-10 animate-in fade-in slide-in-from-bottom-2">
                      <button 
                        onClick={() => onEditDriver(driver)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                        Edit Driver
                      </button>
                      <button 
                        onClick={() => onDeleteDriver(driver.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                        Delete Driver
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredDrivers.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <div className="w-16 h-16 bg-gray-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                <Truck size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">No drivers found</h3>
              <p className="text-gray-500 dark:text-gray-400">Check your filters or add a new delivery driver</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DriverTab;
