import React, { useState, useMemo } from 'react';
import {
  Clock,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Coffee,
  Calendar,
  TrendingUp,
  Users,
} from 'lucide-react';
import { AttendanceRecord } from './types';

interface AttendanceTabProps {
  employeeNames: string[];
}

// Simple deterministic pseudo-random based on seed
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

// Generate sample attendance data for a given week
const generateWeekData = (weekOffset: number, employeeNames: string[]): AttendanceRecord[] => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1 + weekOffset * 7); // Monday

  const records: AttendanceRecord[] = [];
  const statuses = ['PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'LATE', 'ABSENT', 'ON_LEAVE'];

  for (let day = 0; day < 7; day++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + day);
    const dateStr = date.toISOString().split('T')[0];
    const isWeekend = day >= 5;

    employeeNames.forEach((name, idx) => {
      const weekendSeed = seededRandom(day * 100 + idx + weekOffset * 7);
      if (isWeekend && weekendSeed > 0.3) return; // Most don't work weekends

      const statusIdx = (idx + day) % statuses.length;
      const status = isWeekend ? 'PRESENT' : statuses[statusIdx];

      // Generate deterministic clock times
      const seed = day * 1000 + idx * 10 + weekOffset;
      const clockInHour = status === 'LATE' ? 9 + Math.floor(seededRandom(seed + 1) * 2) : 7 + Math.floor(seededRandom(seed + 2) * 2);
      const clockInMin = Math.floor(seededRandom(seed + 3) * 60);
      const shiftHours = 6 + Math.floor(seededRandom(seed + 4) * 4);
      const clockOutHour = clockInHour + shiftHours;
      const clockOutMin = Math.floor(seededRandom(seed + 5) * 60);

      const regularHours = Math.min(shiftHours, 8);
      const overtime = Math.max(0, shiftHours - 8);

      records.push({
        id: `att-${dateStr}-${idx}`,
        employeeName: name,
        date: dateStr,
        clockIn: status === 'ABSENT' || status === 'ON_LEAVE' ? '--:--' : `${String(clockInHour).padStart(2, '0')}:${String(clockInMin).padStart(2, '0')}`,
        clockOut: status === 'ABSENT' || status === 'ON_LEAVE' ? '--:--' : `${String(clockOutHour).padStart(2, '0')}:${String(clockOutMin).padStart(2, '0')}`,
        status,
        regularHours: status === 'ABSENT' || status === 'ON_LEAVE' ? 0 : regularHours,
        overtime: status === 'ABSENT' || status === 'ON_LEAVE' ? 0 : overtime,
      });
    });
  }

  return records;
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'PRESENT': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'LATE': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'ABSENT': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'ON_LEAVE': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'PRESENT': return <CheckCircle size={14} />;
    case 'LATE': return <AlertTriangle size={14} />;
    case 'ABSENT': return <XCircle size={14} />;
    case 'ON_LEAVE': return <Coffee size={14} />;
    default: return null;
  }
};

const AttendanceTab: React.FC<AttendanceTabProps> = ({ employeeNames }) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const records = useMemo(() => generateWeekData(weekOffset, employeeNames), [weekOffset, employeeNames]);

  // Get unique dates
  const dates = useMemo(() => {
    const unique = [...new Set(records.map(r => r.date))].sort();
    return unique;
  }, [records]);

  const currentDate = selectedDate || dates[Math.min(dates.length - 1, new Date().getDay() - 1)] || dates[0];

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (r.date !== currentDate) return false;
      if (searchQuery && !r.employeeName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      return true;
    });
  }, [records, currentDate, searchQuery, statusFilter]);

  // Stats for the selected day
  const dayStats = useMemo(() => {
    const dayRecords = records.filter(r => r.date === currentDate);
    return {
      total: dayRecords.length,
      present: dayRecords.filter(r => r.status === 'PRESENT').length,
      late: dayRecords.filter(r => r.status === 'LATE').length,
      absent: dayRecords.filter(r => r.status === 'ABSENT').length,
      onLeave: dayRecords.filter(r => r.status === 'ON_LEAVE').length,
      totalHours: dayRecords.reduce((sum, r) => sum + r.regularHours + r.overtime, 0),
      totalOT: dayRecords.reduce((sum, r) => sum + r.overtime, 0),
    };
  }, [records, currentDate]);

  const weekLabel = useMemo(() => {
    if (dates.length === 0) return '';
    const start = new Date(dates[0]);
    const end = new Date(dates[dates.length - 1]);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }, [dates]);

  const attendanceRate = dayStats.total > 0 ? Math.round(((dayStats.present + dayStats.late) / dayStats.total) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="p-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors text-gray-600 dark:text-gray-300"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl">
            <Calendar size={16} className="text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-bold text-gray-900 dark:text-white">{weekLabel}</span>
          </div>
          <button
            onClick={() => setWeekOffset(w => Math.min(0, w + 1))}
            disabled={weekOffset >= 0}
            className="p-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors text-gray-600 dark:text-gray-300 disabled:opacity-40"
          >
            <ChevronRight size={18} />
          </button>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
            >
              This Week
            </button>
          )}
        </div>
      </div>

      {/* Day Pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {dates.map(date => {
          const d = new Date(date);
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
          const dayNum = d.getDate();
          const isSelected = date === currentDate;
          const isToday = date === new Date().toISOString().split('T')[0];

          return (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`flex flex-col items-center px-4 py-3 rounded-xl border-2 transition-all min-w-[72px] ${
                isSelected
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 shadow-sm'
                  : 'border-transparent bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider">{dayName}</span>
              <span className={`text-lg font-black ${isSelected ? '' : 'text-gray-900 dark:text-white'}`}>{dayNum}</span>
              {isToday && <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-0.5" />}
            </button>
          );
        })}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Present', value: dayStats.present, icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Late', value: dayStats.late, icon: AlertTriangle, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
          { label: 'Absent', value: dayStats.absent, icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
          { label: 'Attendance', value: `${attendanceRate}%`, icon: TrendingUp, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        ].map((stat, i) => (
          <div key={i} className={`p-4 rounded-xl ${stat.bg} flex items-center gap-3`}>
            <stat.icon size={20} className={stat.color} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{stat.label}</p>
              <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search employee..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all text-sm"
          />
        </div>
        <div className="flex gap-2">
          {['ALL', 'PRESENT', 'LATE', 'ABSENT', 'ON_LEAVE'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                statusFilter === s
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
              }`}
            >
              {s === 'ALL' ? 'All' : s === 'ON_LEAVE' ? 'Leave' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-600">
            <tr>
              <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Clock In</th>
              <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Clock Out</th>
              <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Regular</th>
              <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Overtime</th>
              <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
            {filteredRecords.map(record => (
              <tr key={record.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-700/50 transition-colors">
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-800/20 flex items-center justify-center text-purple-600 dark:text-purple-400 text-xs font-bold">
                      {record.employeeName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white text-sm">{record.employeeName}</span>
                  </div>
                </td>
                <td className="px-6 py-3.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${getStatusStyle(record.status)}`}>
                    {getStatusIcon(record.status)}
                    {record.status === 'ON_LEAVE' ? 'Leave' : record.status}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  <span className={`text-sm font-mono ${record.clockIn === '--:--' ? 'text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}`}>
                    {record.clockIn}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  <span className={`text-sm font-mono ${record.clockOut === '--:--' ? 'text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}`}>
                    {record.clockOut}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {record.regularHours > 0 ? `${record.regularHours}h` : '—'}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  <span className={`text-sm font-semibold ${record.overtime > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-300 dark:text-gray-600'}`}>
                    {record.overtime > 0 ? `${record.overtime}h` : '—'}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {(record.regularHours + record.overtime) > 0 ? `${record.regularHours + record.overtime}h` : '—'}
                  </span>
                </td>
              </tr>
            ))}
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <Clock size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400">No attendance records for this day</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {/* Footer Summary */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-600 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">
            {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span>Total: <strong className="text-gray-900 dark:text-white">{dayStats.totalHours}h</strong></span>
            <span>OT: <strong className="text-orange-600 dark:text-orange-400">{dayStats.totalOT}h</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceTab;
