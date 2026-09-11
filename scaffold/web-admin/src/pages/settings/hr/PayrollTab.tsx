import React, { useState, useMemo } from 'react';
import {
  DollarSign, Calendar, ChevronRight, CheckCircle, Clock, FileText,
  TrendingUp, AlertCircle, X, ShieldCheck, XCircle, Check,
} from 'lucide-react';
import { PayrollRun } from './types';

interface PayrollTabProps {
  employeeNames: string[];
  employeeRates: Record<string, number>;
}

const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

const generatePayrollRuns = (employeeNames: string[], rates: Record<string, number>): PayrollRun[] => {
  const runs: PayrollRun[] = [];
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const endDate = new Date(now); endDate.setDate(now.getDate() - i * 14);
    const startDate = new Date(endDate); startDate.setDate(endDate.getDate() - 13);
    const payDate = new Date(endDate); payDate.setDate(endDate.getDate() + 5);
    const period = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    const totalGross = employeeNames.reduce((sum, name, ni) => {
      return sum + (rates[name] || 15) * (70 + Math.floor(seededRandom(i * 100 + ni) * 20));
    }, 0);
    runs.push({
      id: `pr-${i}`, period, payDate: payDate.toISOString().split('T')[0],
      employees: employeeNames.length, totalGross: Math.round(totalGross),
      totalNet: Math.round(totalGross * 0.78),
      status: i === 0 ? 'PROCESSING' : i === 1 ? 'PENDING_APPROVAL' : 'COMPLETED',
    });
  }
  return runs;
};

interface PayStub {
  employeeName: string; role: string; hoursWorked: number; overtimeHours: number;
  hourlyRate: number; grossPay: number; federalTax: number; stateTax: number;
  socialSecurity: number; medicare: number; netPay: number;
}

const generatePayStubs = (employeeNames: string[], rates: Record<string, number>): PayStub[] => {
  const roles = ['Manager', 'Server', 'Cook', 'Cashier', 'Server'];
  return employeeNames.map((name, i) => {
    const rate = rates[name] || 15;
    const regular = 72 + Math.floor(seededRandom(i * 37 + 7) * 10);
    const ot = Math.floor(seededRandom(i * 53 + 11) * 8);
    const gross = rate * regular + rate * 1.5 * ot;
    const federal = Math.round(gross * 0.12), state = Math.round(gross * 0.05);
    const ss = Math.round(gross * 0.062), med = Math.round(gross * 0.0145);
    return { employeeName: name, role: roles[i % roles.length], hoursWorked: regular,
      overtimeHours: ot, hourlyRate: rate, grossPay: Math.round(gross),
      federalTax: federal, stateTax: state, socialSecurity: ss, medicare: med,
      netPay: Math.round(gross - federal - state - ss - med) };
  });
};

const statusStyle = (s: string) => {
  if (s === 'COMPLETED') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (s === 'PROCESSING') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  if (s === 'PENDING_APPROVAL') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  if (s === 'REJECTED') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
};
const statusIcon = (s: string) => {
  if (s === 'COMPLETED') return <CheckCircle size={14} />;
  if (s === 'PROCESSING') return <Clock size={14} />;
  if (s === 'PENDING_APPROVAL') return <AlertCircle size={14} />;
  if (s === 'REJECTED') return <XCircle size={14} />;
  return null;
};

const PayrollTab: React.FC<PayrollTabProps> = ({ employeeNames, employeeRates }) => {
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; runId: string; action: 'approve' | 'reject'; period: string }>({ open: false, runId: '', action: 'approve', period: '' });
  const [toast, setToast] = useState<{ msg: string; visible: boolean }>({ msg: '', visible: false });

  const baseRuns = useMemo(() => generatePayrollRuns(employeeNames, employeeRates), [employeeNames, employeeRates]);
  const runs = useMemo(() => baseRuns.map(r => ({ ...r, status: statusOverrides[r.id] || r.status })), [baseRuns, statusOverrides]);
  const payStubs = useMemo(() => generatePayStubs(employeeNames, employeeRates), [employeeNames, employeeRates]);

  const currentRun = runs[0];
  const ytdGross = runs.filter(r => r.status === 'COMPLETED').reduce((s, r) => s + r.totalGross, 0);

  const showToast = (msg: string) => { setToast({ msg, visible: true }); setTimeout(() => setToast({ msg: '', visible: false }), 3500); };

  const handleConfirm = () => {
    const { runId, action, period } = confirmModal;
    setStatusOverrides(prev => ({ ...prev, [runId]: action === 'approve' ? 'COMPLETED' : 'REJECTED' }));
    setConfirmModal({ open: false, runId: '', action: 'approve', period: '' });
    showToast(action === 'approve' ? `✅ Payroll "${period}" approved and finalized` : `🔴 Payroll "${period}" has been rejected`);
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Toast */}
      {toast.visible && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl shadow-2xl text-sm font-bold animate-pulse">
          {toast.msg}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Current Period Gross', value: `$${currentRun.totalGross.toLocaleString()}`, sub: `${currentRun.employees} employees`, icon: DollarSign, from: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10', border: 'border-green-100 dark:border-green-800/30', tc: 'text-green-600 dark:text-green-400', vc: 'text-green-800 dark:text-green-300', sc: 'text-green-600 dark:text-green-500' },
          { label: 'Current Net', value: `$${currentRun.totalNet.toLocaleString()}`, sub: 'After withholdings', icon: DollarSign, from: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/10', border: 'border-blue-100 dark:border-blue-800/30', tc: 'text-blue-600 dark:text-blue-400', vc: 'text-blue-800 dark:text-blue-300', sc: 'text-blue-600 dark:text-blue-500' },
          { label: 'YTD Gross', value: `$${ytdGross.toLocaleString()}`, sub: `${runs.filter(r => r.status === 'COMPLETED').length} runs completed`, icon: TrendingUp, from: 'from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/10', border: 'border-purple-100 dark:border-purple-800/30', tc: 'text-purple-600 dark:text-purple-400', vc: 'text-purple-800 dark:text-purple-300', sc: 'text-purple-600 dark:text-purple-500' },
          { label: 'Next Pay Date', value: new Date(currentRun.payDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), sub: currentRun.status === 'PROCESSING' ? 'Processing' : 'Pending', icon: Calendar, from: 'from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/10', border: 'border-orange-100 dark:border-orange-800/30', tc: 'text-orange-600 dark:text-orange-400', vc: 'text-orange-800 dark:text-orange-300', sc: 'text-orange-600 dark:text-orange-500' },
        ].map((c, i) => (
          <div key={i} className={`p-4 rounded-xl bg-gradient-to-br ${c.from} border ${c.border}`}>
            <div className="flex items-center gap-2 mb-2">
              <c.icon size={16} className={c.tc} />
              <span className={`text-[10px] font-bold ${c.tc} uppercase tracking-wider`}>{c.label}</span>
            </div>
            <p className={`text-2xl font-black ${c.vc}`}>{c.value}</p>
            <p className={`text-xs ${c.sc} mt-1`}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Payroll Runs */}
      <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-600 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText size={16} className="text-purple-600 dark:text-purple-400" />
            Payroll Run History
          </h3>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">Click a row to view pay stubs</p>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-slate-700">
          {runs.map((run) => (
            <div key={run.id}>
              {/* Row */}
              <div className="flex items-center w-full">
                <button
                  onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                  className="flex-1 px-6 py-4 flex items-center gap-4 hover:bg-gray-50/80 dark:hover:bg-slate-700/30 transition-colors text-left"
                >
                  <div className={`p-1.5 rounded-lg transition-transform duration-200 ${expandedRun === run.id ? 'rotate-90' : ''}`}>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{run.period}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Pay date: {new Date(run.payDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${statusStyle(run.status)}`}>
                    {statusIcon(run.status)}
                    {run.status.replace(/_/g, ' ')}
                  </span>
                  <div className="text-right min-w-[100px]">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">${run.totalGross.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">Gross</p>
                  </div>
                  <div className="text-right min-w-[100px]">
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">${run.totalNet.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">Net</p>
                  </div>
                </button>

                {/* Action buttons for actionable statuses */}
                {(run.status === 'PENDING_APPROVAL' || run.status === 'PROCESSING') && (
                  <div className="flex items-center gap-2 pr-6">
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmModal({ open: true, runId: run.id, action: 'approve', period: run.period }); }}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmModal({ open: true, runId: run.id, action: 'reject', period: run.period }); }}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>

              {/* Expanded Pay Stubs */}
              {expandedRun === run.id && (
                <div className="px-6 pb-4 bg-gray-50/50 dark:bg-slate-800/50">
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-600 overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-600">
                        <tr>
                          {['Employee','Hrs','OT','Rate','Gross','Fed Tax','State','SS','Med','Net Pay'].map(h => (
                            <th key={h} className="px-4 py-2.5 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                        {payStubs.map((s) => (
                          <tr key={s.employeeName} className="hover:bg-gray-50/80 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 text-[10px] font-bold">
                                  {s.employeeName.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{s.employeeName}</p>
                                  <p className="text-[10px] text-gray-400 dark:text-gray-500">{s.role}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-xs font-mono text-gray-700 dark:text-gray-300">{s.hoursWorked}</td>
                            <td className="px-4 py-2.5 text-xs font-mono text-orange-600 dark:text-orange-400">{s.overtimeHours > 0 ? s.overtimeHours : '—'}</td>
                            <td className="px-4 py-2.5 text-xs font-mono text-gray-700 dark:text-gray-300">${s.hourlyRate}</td>
                            <td className="px-4 py-2.5 text-xs font-bold text-gray-900 dark:text-white">${s.grossPay.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-xs font-mono text-red-500 dark:text-red-400">-${s.federalTax}</td>
                            <td className="px-4 py-2.5 text-xs font-mono text-red-500 dark:text-red-400">-${s.stateTax}</td>
                            <td className="px-4 py-2.5 text-xs font-mono text-red-500 dark:text-red-400">-${s.socialSecurity}</td>
                            <td className="px-4 py-2.5 text-xs font-mono text-red-500 dark:text-red-400">-${s.medicare}</td>
                            <td className="px-4 py-2.5 text-xs font-black text-green-600 dark:text-green-400">${s.netPay.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Confirm Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              {confirmModal.action === 'approve' ? (
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <ShieldCheck size={24} className="text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <XCircle size={24} className="text-red-600 dark:text-red-400" />
                </div>
              )}
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {confirmModal.action === 'approve' ? 'Approve Payroll?' : 'Reject Payroll?'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{confirmModal.period}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              {confirmModal.action === 'approve'
                ? 'This will finalize the payroll run and mark it as completed. Payments will be processed on the scheduled pay date.'
                : 'This will reject the payroll run and send it back for corrections. No payments will be processed.'}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))} className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                Cancel
              </button>
              <button onClick={handleConfirm} className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-colors shadow-sm flex items-center gap-1.5 ${confirmModal.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {confirmModal.action === 'approve' ? <><Check size={14} /> Approve &amp; Finalize</> : <><XCircle size={14} /> Reject Payroll</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollTab;
