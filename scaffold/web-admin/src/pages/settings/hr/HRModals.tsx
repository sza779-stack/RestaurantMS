import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle, 
  XCircle, 
  Info, 
  AlertCircle,
  UserX
} from 'lucide-react';
import { Toast, ToastType } from './types';

// Confirmation Modal Component
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'success' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  onConfirm, 
  onCancel, 
  type = 'info' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getColors = () => {
    switch (type) {
      case 'danger':
        return { bg: 'bg-red-600', hover: 'hover:bg-red-700', light: 'bg-red-100 text-red-600', icon: UserX };
      case 'success':
        return { bg: 'bg-green-600', hover: 'hover:bg-green-700', light: 'bg-green-100 text-green-600', icon: CheckCircle };
      default:
        return { bg: 'bg-blue-600', hover: 'hover:bg-blue-700', light: 'bg-blue-100 text-blue-600', icon: Info };
    }
  };

  const colors = getColors();
  const IconComponent = colors.icon;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className={`relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.light}`}>
              <IconComponent className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>
          <p className="text-gray-600 mb-6 text-lg">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-3 rounded-xl font-medium text-white ${colors.bg} ${colors.hover} transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg`}
            >
              {confirmText}
            </button>
          </div>
        </div>
        <div className={`h-1 w-full ${colors.bg} rounded-b-2xl`} />
      </div>
    </div>
  );
};

// Toast Item Component
interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

export const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200'
  };

  const textColors = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800'
  };

  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    info: 'text-blue-500'
  };

  const Icon = toast.type === 'success' ? CheckCircle : toast.type === 'error' ? XCircle : Info;

  return (
    <div className={`relative overflow-hidden rounded-lg border shadow-lg ${bgColors[toast.type]} transform transition-all duration-300 ease-out animate-in slide-in-from-right`}>
      <div className="flex items-center gap-3 p-4 pr-8">
        <Icon size={20} className={iconColors[toast.type]} />
        <span className="text-sm font-medium">{toast.message}</span>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className={`absolute top-2 right-2 p-1 rounded hover:bg-black/5 transition-colors ${textColors[toast.type]}`}
      >
        <X size={14} />
      </button>
    </div>
  );
};

// Toast Container Component
interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => (
  <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
    {toasts.map(toast => (
      <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
    ))}
  </div>
);

// Employee Modal Component
interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  employee: any;
  setEmployee: (emp: any) => void;
  isEditing: boolean;
  roleOptions: string[];
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  employee,
  setEmployee,
  isEditing,
  roleOptions
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Employee' : 'Add New Employee'}</h2>
            <p className="text-gray-500 text-sm">Fill in the professional profile details</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={24} className="text-gray-400" />
          </button>
        </div>
        
        <div className="p-8 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
              <input
                type="text"
                value={employee.name}
                onChange={(e) => setEmployee({ ...employee, name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                placeholder="e.g. John Smith"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Login User ID</label>
              <input
                type="text"
                value={employee.userId}
                disabled={isEditing}
                onChange={(e) => setEmployee({ ...employee, userId: e.target.value })}
                className={`w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="e.g. jsmith-01"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">System PIN (4+ digits)</label>
              <input
                type="password"
                value={employee.pin}
                onChange={(e) => setEmployee({ ...employee, pin: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                placeholder="••••"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Role</label>
              <select
                value={employee.role}
                onChange={(e) => setEmployee({ ...employee, role: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none appearance-none"
              >
                <option value="">Select Role</option>
                {roleOptions.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Department</label>
              <select
                value={employee.department}
                onChange={(e) => setEmployee({ ...employee, department: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none appearance-none"
              >
                <option value="Front of House">Front of House</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Management">Management</option>
                <option value="Delivery">Delivery</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Hourly Rate ($)</label>
              <input
                type="number"
                value={employee.hourlyRate}
                onChange={(e) => setEmployee({ ...employee, hourlyRate: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Status</label>
              <select
                value={employee.status}
                onChange={(e) => setEmployee({ ...employee, status: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none appearance-none"
              >
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Phone</label>
              <input
                type="text"
                value={employee.phone}
                onChange={(e) => setEmployee({ ...employee, phone: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                placeholder="(555) 000-0000"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email</label>
              <input
                type="email"
                value={employee.email}
                onChange={(e) => setEmployee({ ...employee, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                placeholder="email@example.com"
              />
            </div>
          </div>
        </div>
        
        <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="flex-1 py-4 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20"
          >
            {isEditing ? 'Update Employee' : 'Create Employee'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Driver Modal Component
interface DriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  driver: any;
  setDriver: (d: any) => void;
  isEditing: boolean;
}

export const DriverModal: React.FC<DriverModalProps> = ({
  isOpen,
  onClose,
  onSave,
  driver,
  setDriver,
  isEditing
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Driver' : 'Add New Driver'}</h2>
            <p className="text-gray-500 text-sm">Delivery system synchronization profile</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={24} className="text-gray-400" />
          </button>
        </div>
        
        <div className="p-8 space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Driver Name</label>
            <input
              type="text"
              value={driver.name}
              onChange={(e) => setDriver({ ...driver, name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
              placeholder="e.g. Mike Johnson"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Phone</label>
              <input
                type="text"
                value={driver.phone}
                onChange={(e) => setDriver({ ...driver, phone: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                placeholder="(555) 000-0000"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email</label>
              <input
                type="email"
                value={driver.email}
                onChange={(e) => setDriver({ ...driver, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                placeholder="mike@email.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Vehicle Type</label>
              <select
                value={driver.vehicleType}
                onChange={(e) => setDriver({ ...driver, vehicleType: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none appearance-none"
              >
                <option value="Car">Car</option>
                <option value="Bike">Bike</option>
                <option value="Scooter">Scooter</option>
                <option value="Van">Van</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Per Delivery Rate ($)</label>
              <input
                type="number"
                value={driver.perDeliveryRate}
                onChange={(e) => setDriver({ ...driver, perDeliveryRate: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                placeholder="5.00"
              />
            </div>
          </div>

          {!isEditing && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Custom Driver ID (Optional)</label>
              <input
                type="text"
                value={driver.id}
                onChange={(e) => setDriver({ ...driver, id: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                placeholder="e.g. mike-01"
              />
            </div>
          )}
        </div>
        
        <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="flex-1 py-4 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20"
          >
            {isEditing ? 'Update Driver' : 'Create Driver'}
          </button>
        </div>
      </div>
    </div>
  );
};
