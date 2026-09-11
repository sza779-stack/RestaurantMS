import React, { useState, useMemo, useCallback } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Edit2,
  Copy,
  Users,
  Sun,
  Moon,
  Sunrise,
  X,
  Check,
  Trash2,
  Save,
} from 'lucide-react';

interface Shift {
  id: string;
  employeeName: string;
  role: string;
  day: number; // 0=Mon, 6=Sun
  startTime: string;
  endTime: string;
  type: 'morning' | 'afternoon' | 'evening' | 'off';
}

interface ScheduleTabProps {
  employeeNames: string[];
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ROLES = ['Manager', 'Server', 'Cook', 'Cashier', 'Server'];

const shiftTypes: Record<string, { label: string; color: string; darkColor: string; icon: React.ReactNode }> = {
  morning:   { label: 'Morning',   color: 'bg-amber-100 text-amber-800 border-amber-200',       darkColor: 'dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/40',   icon: <Sunrise size={12} /> },
  afternoon: { label: 'Afternoon', color: 'bg-blue-100 text-blue-800 border-blue-200',           darkColor: 'dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/40',     icon: <Sun size={12} /> },
  evening:   { label: 'Evening',   color: 'bg-indigo-100 text-indigo-800 border-indigo-200',     darkColor: 'dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800/40', icon: <Moon size={12} /> },
  off:       { label: 'Off',       color: 'bg-gray-50 text-gray-400 border-gray-100',            darkColor: 'dark:bg-slate-800/30 dark:text-gray-600 dark:border-slate-700',       icon: null },
};

// Preset shift templates
const SHIFT_PRESETS = [
  { label: 'Morning (7am–3pm)', type: 'morning' as const, start: '07:00', end: '15:00' },
  { label: 'Afternoon (11am–7pm)', type: 'afternoon' as const, start: '11:00', end: '19:00' },
  { label: 'Evening (3pm–11pm)', type: 'evening' as const, start: '15:00', end: '23:00' },
  { label: 'Full Day (9am–5pm)', type: 'morning' as const, start: '09:00', end: '17:00' },
  { label: 'Split (10am–2pm)', type: 'morning' as const, start: '10:00', end: '14:00' },
  { label: 'Closer (5pm–12am)', type: 'evening' as const, start: '17:00', end: '00:00' },
];

// Determine shift type from start hour
const inferShiftType = (startTime: string): 'morning' | 'afternoon' | 'evening' => {
  const hour = parseInt(startTime.split(':')[0]);
  if (hour < 11) return 'morning';
  if (hour < 15) return 'afternoon';
  return 'evening';
};

// Generate initial schedule
const generateSchedule = (weekOffset: number, employeeNames: string[]): Shift[] => {
  const shifts: Shift[] = [];
  const shiftPatterns = [
    { start: '07:00', end: '15:00', type: 'morning' as const },
    { start: '11:00', end: '19:00', type: 'afternoon' as const },
    { start: '15:00', end: '23:00', type: 'evening' as const },
  ];

  employeeNames.forEach((name, idx) => {
    const role = ROLES[idx % ROLES.length];
    for (let day = 0; day < 7; day++) {
      const isOff = (day + idx) % 7 === 6 || ((day + idx) % 7 === 0 && idx % 2 === 0);

      if (isOff) {
        shifts.push({
          id: `shift-${idx}-${day}`,
          employeeName: name, role, day,
          startTime: '', endTime: '', type: 'off',
        });
      } else {
        const pattern = shiftPatterns[(idx + day + weekOffset) % shiftPatterns.length];
        shifts.push({
          id: `shift-${idx}-${day}`,
          employeeName: name, role, day,
          startTime: pattern.start, endTime: pattern.end, type: pattern.type,
        });
      }
    }
  });

  return shifts;
};

interface EditModalState {
  isOpen: boolean;
  shift: Shift | null;
  empName: string;
  empRole: string;
  dayIdx: number;
  dateLabel: string;
}

const ScheduleTab: React.FC<ScheduleTabProps> = ({ employeeNames }) => {
  const [weekOffset, setWeekOffset] = useState(0);
  // Store edits as a map keyed by `weekOffset:empIdx:day`
  const [shiftOverrides, setShiftOverrides] = useState<Record<string, Shift>>({});
  const [editModal, setEditModal] = useState<EditModalState>({
    isOpen: false, shift: null, empName: '', empRole: '', dayIdx: 0, dateLabel: '',
  });
  const [editForm, setEditForm] = useState({ startTime: '', endTime: '', type: 'morning' as Shift['type'] });
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  // Generate base schedule then apply overrides
  const shifts = useMemo(() => {
    const base = generateSchedule(weekOffset, employeeNames);
    return base.map(s => {
      const empIdx = employeeNames.indexOf(s.employeeName);
      const key = `${weekOffset}:${empIdx}:${s.day}`;
      return shiftOverrides[key] || s;
    });
  }, [weekOffset, employeeNames, shiftOverrides]);

  // Group by employee
  const employeeShifts = useMemo(() => {
    const grouped: Record<string, { name: string; role: string; shifts: Shift[] }> = {};
    shifts.forEach(s => {
      if (!grouped[s.employeeName]) {
        grouped[s.employeeName] = { name: s.employeeName, role: s.role, shifts: [] };
      }
      grouped[s.employeeName].shifts[s.day] = s;
    });
    return Object.values(grouped);
  }, [shifts]);

  // Week dates
  const weekDates = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() + 1 + weekOffset * 7);
    return DAYS.map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  const weekLabel = useMemo(() => {
    const start = weekDates[0];
    const end = weekDates[6];
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }, [weekDates]);

  // Stats
  const morningShifts = shifts.filter(s => s.type === 'morning').length;
  const afternoonShifts = shifts.filter(s => s.type === 'afternoon').length;
  const eveningShifts = shifts.filter(s => s.type === 'evening').length;
  const totalHours = shifts.filter(s => s.type !== 'off').reduce((sum, s) => {
    if (!s.startTime || !s.endTime) return sum;
    const start = parseInt(s.startTime.split(':')[0]);
    let end = parseInt(s.endTime.split(':')[0]);
    if (end === 0) end = 24;
    return sum + Math.max(0, end - start);
  }, 0);

  // Open edit modal when clicking a cell
  const handleCellClick = useCallback((shift: Shift, dayIdx: number) => {
    const d = weekDates[dayIdx];
    const dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    setEditForm({
      startTime: shift.type === 'off' ? '07:00' : shift.startTime,
      endTime: shift.type === 'off' ? '15:00' : shift.endTime,
      type: shift.type === 'off' ? 'morning' : shift.type,
    });
    setEditModal({
      isOpen: true,
      shift,
      empName: shift.employeeName,
      empRole: shift.role,
      dayIdx,
      dateLabel,
    });
  }, [weekDates]);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3000);
  };

  // Save shift edit
  const handleSaveShift = () => {
    if (!editModal.shift) return;
    const empIdx = employeeNames.indexOf(editModal.empName);
    const key = `${weekOffset}:${empIdx}:${editModal.dayIdx}`;
    const updatedShift: Shift = {
      ...editModal.shift,
      startTime: editForm.startTime,
      endTime: editForm.endTime,
      type: inferShiftType(editForm.startTime),
    };
    setShiftOverrides(prev => ({ ...prev, [key]: updatedShift }));
    setEditModal(prev => ({ ...prev, isOpen: false }));
    showToast(`✅ Shift updated for ${editModal.empName} on ${editModal.dateLabel}`);
  };

  // Set as day off
  const handleSetOff = () => {
    if (!editModal.shift) return;
    const empIdx = employeeNames.indexOf(editModal.empName);
    const key = `${weekOffset}:${empIdx}:${editModal.dayIdx}`;
    const offShift: Shift = {
      ...editModal.shift,
      startTime: '', endTime: '', type: 'off',
    };
    setShiftOverrides(prev => ({ ...prev, [key]: offShift }));
    setEditModal(prev => ({ ...prev, isOpen: false }));
    showToast(`🔴 ${editModal.empName} set as OFF on ${editModal.dateLabel}`);
  };

  // Apply preset
  const handlePreset = (preset: typeof SHIFT_PRESETS[0]) => {
    setEditForm({ startTime: preset.start, endTime: preset.end, type: preset.type });
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl shadow-2xl text-sm font-bold animate-[slideIn_0.3s_ease-out]">
          {toast.message}
        </div>
      )}

      {/* Header Row */}
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
            onClick={() => setWeekOffset(w => w + 1)}
            className="p-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors text-gray-600 dark:text-gray-300"
          >
            <ChevronRight size={18} />
          </button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline">
              This Week
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mr-4">
            <span className="flex items-center gap-1"><Sunrise size={12} className="text-amber-500" /> {morningShifts}</span>
            <span className="flex items-center gap-1"><Sun size={12} className="text-blue-500" /> {afternoonShifts}</span>
            <span className="flex items-center gap-1"><Moon size={12} className="text-indigo-500" /> {eveningShifts}</span>
            <span className="font-bold text-gray-900 dark:text-white">{totalHours}h total</span>
          </div>
        </div>
      </div>

      {/* Instruction hint */}
      <div className="mb-4 px-3 py-2 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30 rounded-lg">
        <p className="text-xs text-purple-700 dark:text-purple-300 flex items-center gap-2">
          <Edit2 size={12} />
          <span><strong>Click any shift cell</strong> to edit the schedule. You can change shift times, apply presets, or set a day off.</span>
        </p>
      </div>

      {/* Schedule Grid */}
      <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-600">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-48 sticky left-0 bg-gray-50 dark:bg-slate-700/50 z-10">
                  Employee
                </th>
                {DAYS.map((day, i) => {
                  const d = weekDates[i];
                  const isToday = d.toDateString() === new Date().toDateString();
                  return (
                    <th
                      key={day}
                      className={`px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[120px] ${
                        isToday
                          ? 'text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/10'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <div>{day}</div>
                      <div className={`text-sm font-black ${isToday ? 'text-purple-700 dark:text-purple-300' : 'text-gray-900 dark:text-white'}`}>
                        {d.getDate()}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
              {employeeShifts.map((emp) => (
                <tr key={emp.name} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 sticky left-0 bg-white dark:bg-slate-800/80 z-10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-800/20 flex items-center justify-center text-purple-600 dark:text-purple-400 text-xs font-bold">
                        {emp.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[120px]">{emp.name}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{emp.role}</p>
                      </div>
                    </div>
                  </td>
                  {DAYS.map((_, dayIdx) => {
                    const shift = emp.shifts[dayIdx];
                    if (!shift) return <td key={dayIdx} className="px-2 py-3" />;
                    const style = shiftTypes[shift.type];
                    const isToday = weekDates[dayIdx].toDateString() === new Date().toDateString();

                    return (
                      <td key={dayIdx} className={`px-2 py-3 ${isToday ? 'bg-purple-50/30 dark:bg-purple-900/5' : ''}`}>
                        <button
                          onClick={() => handleCellClick(shift, dayIdx)}
                          className="w-full text-left group"
                        >
                          {shift.type === 'off' ? (
                            <div className={`text-center py-2 px-2 rounded-lg border ${style.color} ${style.darkColor} text-[10px] font-bold group-hover:ring-2 group-hover:ring-purple-400/40 transition-all`}>
                              OFF
                            </div>
                          ) : (
                            <div className={`py-2 px-2.5 rounded-lg border ${style.color} ${style.darkColor} group-hover:ring-2 group-hover:ring-purple-400/40 group-hover:shadow-sm transition-all`}>
                              <div className="flex items-center gap-1 mb-0.5">
                                {style.icon}
                                <span className="text-[10px] font-bold uppercase tracking-wider">{style.label}</span>
                                <Edit2 size={10} className="ml-auto opacity-0 group-hover:opacity-60 transition-opacity" />
                              </div>
                              <div className="text-xs font-mono font-bold">
                                {shift.startTime} – {shift.endTime}
                              </div>
                            </div>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-600 flex items-center gap-4">
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Legend:</span>
          {Object.entries(shiftTypes).filter(([k]) => k !== 'off').map(([key, val]) => (
            <span key={key} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${val.color} ${val.darkColor} border`}>
              {val.icon} {val.label}
            </span>
          ))}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${shiftTypes.off.color} ${shiftTypes.off.darkColor} border`}>
            Day Off
          </span>
        </div>
      </div>

      {/* ── Edit Shift Modal ── */}
      {editModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditModal(prev => ({ ...prev, isOpen: false }))}>
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 w-full max-w-lg"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar size={18} className="text-purple-600 dark:text-purple-400" />
                  Edit Shift
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {editModal.empName} · {editModal.dateLabel}
                </p>
              </div>
              <button
                onClick={() => setEditModal(prev => ({ ...prev, isOpen: false }))}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="px-6 py-4 border-b border-gray-50 dark:border-slate-700/50">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Quick Presets</p>
              <div className="grid grid-cols-3 gap-2">
                {SHIFT_PRESETS.map((preset, i) => {
                  const presetStyle = shiftTypes[preset.type];
                  const isActive = editForm.startTime === preset.start && editForm.endTime === preset.end;
                  return (
                    <button
                      key={i}
                      onClick={() => handlePreset(preset)}
                      className={`px-3 py-2 rounded-lg border text-xs font-bold text-left transition-all ${
                        isActive
                          ? `${presetStyle.color} ${presetStyle.darkColor} ring-2 ring-purple-500/30 shadow-sm`
                          : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600'
                      }`}
                    >
                      <span className="block text-[10px] font-bold uppercase tracking-wider opacity-60">{preset.label.split('(')[0].trim()}</span>
                      <span className="font-mono">{preset.start} – {preset.end}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Time */}
            <div className="px-6 py-4 border-b border-gray-50 dark:border-slate-700/50">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Custom Time</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Start Time</label>
                  <input
                    type="time"
                    value={editForm.startTime}
                    onChange={e => setEditForm(prev => ({ ...prev, startTime: e.target.value, type: inferShiftType(e.target.value) }))}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">End Time</label>
                  <input
                    type="time"
                    value={editForm.endTime}
                    onChange={e => setEditForm(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                </div>
              </div>
              {/* Preview */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Preview:</span>
                {(() => {
                  const style = shiftTypes[inferShiftType(editForm.startTime)];
                  return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${style.color} ${style.darkColor} border`}>
                      {style.icon} {style.label} · {editForm.startTime} – {editForm.endTime}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 flex items-center justify-between">
              <button
                onClick={handleSetOff}
                className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                Set Day Off
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveShift}
                  className="px-5 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Save size={14} />
                  Save Shift
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleTab;
