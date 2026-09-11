export interface Employee {
  id: string;
  userId: string;
  pin?: string;
  name: string;
  role: string;
  department: string;
  hourlyRate: number;
  salary: number | null;
  status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  joinDate: string;
  phone: string;
  email?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  vehicleType?: string;
  licensePlate?: string;
  status: string;
  perDeliveryRate?: number;
  rating?: number;
  totalDeliveries?: number;
  hasPin?: boolean;
}

export interface AttendanceRecord {
  id: string;
  employeeName: string;
  date: string;
  clockIn: string;
  clockOut: string;
  status: string;
  regularHours: number;
  overtime: number;
}

export interface PayrollRun {
  id: string;
  period: string;
  payDate: string;
  employees: number;
  totalGross: number;
  totalNet: number;
  status: string;
}

export interface W2Profile {
  id: string;
  employeeId: string;
  ssn: string; // Encrypted on backend
  taxFilingStatus: string;
  allowances: number;
  extraWithholding: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}
