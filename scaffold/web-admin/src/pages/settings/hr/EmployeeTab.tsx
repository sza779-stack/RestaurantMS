import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  FileText,
  User,
  Briefcase,
  Award,
  Phone,
  Mail,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Info,
  ChevronRight,
  Download,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Employee, ToastType } from './types';

interface EmployeeTabProps {
  employeeList: Employee[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onAddEmployee: () => void;
  onEditEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  getStatusColor: (status: string) => string;
}

const EmployeeTab: React.FC<EmployeeTabProps> = ({
  employeeList,
  searchQuery,
  setSearchQuery,
  onAddEmployee,
  onEditEmployee,
  onDeleteEmployee,
  getStatusColor
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeTab, setEmployeeTab] = useState<'details' | 'w2'>('details');

  const filteredEmployees = employeeList.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.userId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, role, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            <Filter size={18} />
            Filter
          </button>
          <button 
            onClick={onAddEmployee}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20"
          >
            <Plus size={18} />
            Add Employee
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Employee List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-600">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role & Dept</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pay Rate</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                {filteredEmployees.map((emp) => (
                  <tr 
                    key={emp.id} 
                    className={`hover:bg-gray-50/80 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${selectedEmployee?.id === emp.id ? 'bg-purple-50/50 dark:bg-purple-900/20' : ''}`}
                    onClick={() => setSelectedEmployee(emp)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center text-purple-600 font-bold shadow-sm">
                          {emp.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{emp.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono uppercase tracking-tight">{emp.userId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{emp.role}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{emp.department}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${getStatusColor(emp.status)}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">${emp.hourlyRate}/hr</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Hourly</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onEditEmployee(emp); }}
                          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDeleteEmployee(emp.id); }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredEmployees.length === 0 && (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
                  <Users size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">No employees found</h3>
                <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>

        {/* Selected Employee Details / W2 Profile */}
        <div className="lg:col-span-1">
          {selectedEmployee ? (
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden sticky top-24">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-purple-200">
                    {selectedEmployee.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedEmployee.name}</h3>
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium uppercase tracking-widest">{selectedEmployee.role}</p>
                  </div>
                </div>

                <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6">
                  <button 
                    onClick={() => setEmployeeTab('details')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${employeeTab === 'details' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Profile
                  </button>
                  <button 
                    onClick={() => setEmployeeTab('w2')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${employeeTab === 'w2' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    W2 / Tax
                  </button>
                </div>

                {employeeTab === 'details' ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-50 shadow-sm">
                      <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                        <Mail size={18} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Email Address</p>
                        <p className="text-sm text-gray-700 font-medium">{selectedEmployee.email || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-50 shadow-sm">
                      <div className="p-2 rounded-lg bg-green-50 text-green-600">
                        <Phone size={18} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Phone Number</p>
                        <p className="text-sm text-gray-700 font-medium">{selectedEmployee.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-50 shadow-sm">
                      <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                        <Calendar size={18} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Hire Date</p>
                        <p className="text-sm text-gray-700 font-medium">{new Date(selectedEmployee.joinDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-50 shadow-sm">
                      <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                        <DollarSign size={18} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Payroll Info</p>
                        <p className="text-sm text-gray-700 font-medium">${selectedEmployee.hourlyRate}/hr · Weekly</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <W2ProfileSection employeeId={selectedEmployee.id} />
                )}
              </div>
              <div className="p-4 bg-gray-50">
                <button 
                  onClick={() => onEditEmployee(selectedEmployee)}
                  className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  <Edit2 size={18} />
                  Edit Full Profile
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full bg-gray-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-600 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center shadow-sm mb-4 text-gray-300 dark:text-gray-500">
                <User size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">Select an employee</h3>
              <p className="text-gray-500 dark:text-gray-400">Choose from the list to view full details and tax information</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const W2ProfileSection: React.FC<{ employeeId: string }> = ({ employeeId }) => {
  const [loading, setLoading] = useState(false);
  const [w2Data, setW2Data] = useState<any>(null);
  const [showSSN, setShowSSN] = useState(false);

  // Mock data for now, real implementation would fetch from backend
  const mockW2Data = {
    ssn: '***-**-6789',
    filingStatus: 'Single',
    allowances: 1,
    extraWithholding: 0,
    address: '123 Cyber St, Neo City, NC 90210'
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <FileText size={16} className="text-purple-600" />
          Tax Configuration
        </h4>
        <button className="text-xs text-purple-600 font-bold hover:underline">Download W4</button>
      </div>

      <div className="space-y-3">
        <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-purple-700 uppercase font-bold tracking-wider">Social Security Number</p>
            <button 
              onClick={() => setShowSSN(!showSSN)}
              className="p-1 hover:bg-purple-100 rounded text-purple-600"
            >
              {showSSN ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <p className="text-sm font-mono text-gray-800">
            {showSSN ? '678-45-6789' : '***-**-6789'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Filing Status</p>
            <p className="text-sm font-medium text-gray-700">{mockW2Data.filingStatus}</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Allowances</p>
            <p className="text-sm font-medium text-gray-700">{mockW2Data.allowances}</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Home Address</p>
          <p className="text-sm font-medium text-gray-700 line-clamp-2">{mockW2Data.address}</p>
        </div>

        <div className="p-4 bg-purple-600/5 rounded-xl border border-purple-100 flex items-start gap-3 mt-4">
          <Info size={16} className="text-purple-600 mt-0.5 shrink-0" />
          <p className="text-[10px] text-purple-700 leading-relaxed">
            SSN and sensitive tax data are encrypted using AES-256-CBC at the application layer before being stored in the database.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeTab;
