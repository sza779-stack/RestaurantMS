import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  Download,
  Truck
} from 'lucide-react';

// New Modular Components
import { Employee, Driver, Toast, ToastType } from './hr/types';
import { ConfirmModal, ToastContainer, EmployeeModal, DriverModal } from './hr/HRModals';
import EmployeeTab from './hr/EmployeeTab';
import DriverTab from './hr/DriverTab';
import AttendanceTab from './hr/AttendanceTab';
import ScheduleTab from './hr/ScheduleTab';
import PayrollTab from './hr/PayrollTab';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const initialEmployees: Employee[] = [
  { id: '1', userId: 'johnsmith-01', pin: '1234', name: 'John Smith', role: 'Manager', department: 'Management', hourlyRate: 25, salary: null, status: 'ACTIVE', joinDate: '2022-03-15', phone: '(555) 123-4567', email: 'john@example.com' },
  { id: '2', userId: 'sarahjohnson-01', pin: '1234', name: 'Sarah Johnson', role: 'Server', department: 'Front of House', hourlyRate: 15, salary: null, status: 'ACTIVE', joinDate: '2023-01-10', phone: '(555) 234-5678', email: 'sarah@example.com' },
  { id: '3', userId: 'mikechen-01', pin: '1234', name: 'Mike Chen', role: 'Cook', department: 'Kitchen', hourlyRate: 18, salary: null, status: 'ACTIVE', joinDate: '2022-08-22', phone: '(555) 345-6789', email: 'mike@example.com' },
  { id: '4', userId: 'emilydavis-01', pin: '1234', name: 'Emily Davis', role: 'Cashier', department: 'Front of House', hourlyRate: 14, salary: null, status: 'ON_LEAVE', joinDate: '2023-05-05', phone: '(555) 456-7890', email: 'emily@example.com' },
  { id: '5', userId: 'lisawang-01', pin: '1234', name: 'Lisa Wang', role: 'Server', department: 'Front of House', hourlyRate: 15, salary: null, status: 'ACTIVE', joinDate: '2023-09-12', phone: '(555) 567-8901', email: 'lisa@example.com' },
];

const EMPLOYEE_ROLE_OPTIONS = [
  'Manager',
  'Assistant Manager',
  'Shift Lead',
  'Server',
  'Cashier',
  'Cook',
  'Prep Cook',
  'Kitchen Supervisor',
  'Host',
  'Dishwasher',
  'Delivery Coordinator',
  'Delivery Driver',
];

const DELIVERY_DRIVER_ROLE = 'delivery driver';

const HRManagement: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'employees' | 'drivers' | 'attendance' | 'schedule' | 'payroll'>('employees');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Employee state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeList, setEmployeeList] = useState<Employee[]>(initialEmployees);
  const [employeeForm, setEmployeeForm] = useState({
    userId: '',
    pin: '',
    name: '',
    role: '',
    department: 'Front of House',
    hourlyRate: '',
    phone: '',
    email: '',
    status: 'ACTIVE',
  });

  // Driver state
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [selectedDriverForPin, setSelectedDriverForPin] = useState<Driver | null>(null);
  const [selectedDriverForQr, setSelectedDriverForQr] = useState<Driver | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [newPin, setNewPin] = useState('');
  
  const [driverForm, setDriverForm] = useState({
    id: '',
    name: '',
    phone: '',
    email: '',
    vehicleType: 'Car',
    licensePlate: '',
    perDeliveryRate: '5.00',
  });

  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; type?: 'employee' | 'driver'; id?: string }>({ isOpen: false });

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const getActiveStoreId = useCallback(() => {
    for (const key of ['interface-sync-store-id', 'pos-store-id', 'kds-store-id', 'packing-store-id', 'online-store-id']) {
      const value = localStorage.getItem(key);
      if (value) return value;
    }
    return '';
  }, []);

  const fetchDrivers = async () => {
    setLoadingDrivers(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/drivers`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setDrivers(data);
        } else {
          setDrivers([
            { id: 'demo-driver-001', name: 'Demo Driver', phone: '(555) 999-0000', email: 'demo@driver.com', vehicleType: 'Car', licensePlate: 'DEMO-01', status: 'ONLINE', perDeliveryRate: 5.00, hasPin: true },
            { id: 'drv-001', name: 'Mike Johnson', phone: '(555) 123-4567', email: 'mike@email.com', vehicleType: 'Car', licensePlate: 'ABC123', status: 'ONLINE', perDeliveryRate: 5.50, hasPin: false },
          ]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
    } finally {
      setLoadingDrivers(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  // Employee Handlers
  const handleSaveEmployee = async () => {
    if (!employeeForm.name || !employeeForm.role || !employeeForm.hourlyRate || !employeeForm.userId || !employeeForm.pin) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (editingEmployee) {
      setEmployeeList(employeeList.map(emp => emp.id === editingEmployee.id ? { ...emp, ...employeeForm, hourlyRate: parseFloat(employeeForm.hourlyRate), status: (employeeForm.status as Employee['status']) || emp.status } : emp));
      showToast('Employee updated successfully', 'success');
      setShowEditModal(false);
    } else {
      const newEmp: Employee = {
        ...employeeForm,
        id: String(employeeList.length + 1),
        hourlyRate: parseFloat(employeeForm.hourlyRate),
        joinDate: new Date().toISOString().split('T')[0],
        status: 'ACTIVE',
        salary: null
      };
      setEmployeeList([...employeeList, newEmp]);
      showToast('Employee created successfully', 'success');
      setShowAddModal(false);
    }
    setEditingEmployee(null);
  };

  const handleEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
    setEmployeeForm({
      ...emp,
      hourlyRate: emp.hourlyRate.toString(),
      pin: emp.pin || '',
    } as any);
    setShowEditModal(true);
  };

  // Driver Handlers
  const handleSaveDriver = async () => {
    try {
      const url = editingDriver ? `${API_URL}/api/v1/drivers/${editingDriver.id}` : `${API_URL}/api/v1/drivers`;
      const method = editingDriver ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...driverForm, perDeliveryRate: parseFloat(driverForm.perDeliveryRate) }),
      });

      if (response.ok) {
        showToast(`Driver ${editingDriver ? 'updated' : 'created'} successfully`, 'success');
        fetchDrivers();
        setShowDriverModal(false);
      }
    } catch (error) {
      showToast('Failed to save driver', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'ONLINE':
      case 'PRESENT': return 'bg-green-100 text-green-700 border border-green-200';
      case 'ON_LEAVE':
      case 'ON_BREAK': return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      case 'TERMINATED':
      case 'ABSENT': return 'bg-red-100 text-red-700 border border-red-200';
      case 'OFFLINE': return 'bg-gray-100 text-gray-700 border border-gray-200';
      default: return 'bg-blue-100 text-blue-700 border border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-transparent p-6">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.type === 'employee' ? 'Delete Employee?' : 'Delete Driver?'}
        message="This action cannot be undone. All associated records will be preserved for history."
        confirmText="Delete"
        type="danger"
        onConfirm={() => {
          if (confirmModal.type === 'employee') {
            setEmployeeList(employeeList.filter(e => e.id !== confirmModal.id));
          }
          setConfirmModal({ isOpen: false });
          showToast('Record deleted successfully', 'success');
        }}
        onCancel={() => setConfirmModal({ isOpen: false })}
      />

      <EmployeeModal
        isOpen={showAddModal || showEditModal}
        onClose={() => { setShowAddModal(false); setShowEditModal(false); setEditingEmployee(null); }}
        onSave={handleSaveEmployee}
        employee={employeeForm}
        setEmployee={setEmployeeForm}
        isEditing={!!editingEmployee}
        roleOptions={EMPLOYEE_ROLE_OPTIONS}
      />

      <DriverModal
        isOpen={showDriverModal}
        onClose={() => setShowDriverModal(false)}
        onSave={handleSaveDriver}
        driver={driverForm}
        setDriver={setDriverForm}
        isEditing={!!editingDriver}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <Users className="text-purple-600 dark:text-purple-400" size={32} />
            HR Core
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Enterprise Resource & Workforce Management</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end mr-4">
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">System Status</span>
            <span className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Operational
            </span>
          </div>
          <button className="p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shadow-sm">
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Staff', value: employeeList.length, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Active Drivers', value: drivers.filter(d => d.status === 'ONLINE').length, icon: Truck, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Today Attendance', value: '94%', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Payroll Status', value: 'Ready', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-800/80 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shadow-inner`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-slate-800/60 rounded-[2.5rem] border border-gray-100 dark:border-slate-700 shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto border-b border-gray-50 dark:border-slate-700 bg-gray-50/30 dark:bg-slate-800/40">
          {[
            { id: 'employees', label: 'Employees', icon: Users },
            { id: 'drivers', label: 'Drivers', icon: Truck },
            { id: 'attendance', label: 'Attendance', icon: Clock },
            { id: 'schedule', label: 'Schedule', icon: Calendar },
            { id: 'payroll', label: 'Payroll', icon: DollarSign }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2.5 px-8 py-5 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-800/80 shadow-[0_4px_20px_-10px_rgba(147,51,234,0.3)]' 
                  : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-8">
          {activeTab === 'employees' && (
            <EmployeeTab
              employeeList={employeeList}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onAddEmployee={() => setShowAddModal(true)}
              onEditEmployee={handleEditEmployee}
              onDeleteEmployee={(id) => setConfirmModal({ isOpen: true, type: 'employee', id })}
              getStatusColor={getStatusColor}
            />
          )}
          {activeTab === 'drivers' && (
            <DriverTab
              drivers={drivers}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onAddDriver={() => { setEditingDriver(null); setShowDriverModal(true); }}
              onEditDriver={(d) => { setEditingDriver(d); setDriverForm(d as any); setShowDriverModal(true); }}
              onDeleteDriver={(id) => setConfirmModal({ isOpen: true, type: 'driver', id })}
              onSetPin={(d) => { setSelectedDriverForPin(d); setShowPinModal(true); }}
              onOpenQr={(d) => { setSelectedDriverForQr(d); setQrImageUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=DRVLOGIN:${d.id}`); setShowQrModal(true); }}
              getStatusColor={getStatusColor}
              loading={loadingDrivers}
            />
          )}
          {activeTab === 'attendance' && (
            <AttendanceTab employeeNames={employeeList.map(e => e.name)} />
          )}
          {activeTab === 'schedule' && (
            <ScheduleTab employeeNames={employeeList.map(e => e.name)} />
          )}
          {activeTab === 'payroll' && (
            <PayrollTab
              employeeNames={employeeList.map(e => e.name)}
              employeeRates={Object.fromEntries(employeeList.map(e => [e.name, e.hourlyRate]))}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default HRManagement;
