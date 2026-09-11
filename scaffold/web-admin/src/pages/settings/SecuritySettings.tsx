import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Trash2,
  Check,
  X,
  Lock,
  ChevronRight,
  Key,
  Users,
  Crown,
  Store,
  Copy,
  AlertTriangle,
  Loader2,
  Save,
  Globe,
  Package,
  Utensils,
  BarChart3,
  Truck,
  User,
  Settings,
  Monitor,
} from 'lucide-react';
import { useStore } from '../../hooks/useStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Module icons for visual grouping
const MODULE_ICONS: Record<string, any> = {
  POS: Monitor,
  Orders: Package,
  Menu: Utensils,
  Inventory: Package,
  Reports: BarChart3,
  HR: Users,
  Delivery: Truck,
  Customers: User,
  Settings: Settings,
  Administration: Shield,
  Kitchen: Monitor,
};

const MODULE_COLORS: Record<string, string> = {
  POS: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  Orders: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
  Menu: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
  Inventory: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
  Reports: 'text-violet-500 bg-violet-50 dark:bg-violet-900/20',
  HR: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
  Delivery: 'text-red-500 bg-red-50 dark:bg-red-900/20',
  Customers: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20',
  Settings: 'text-gray-500 bg-gray-50 dark:bg-gray-900/20',
  Administration: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20',
  Kitchen: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20',
};

// Predefined role templates for quick creation
const ROLE_TEMPLATES = [
  {
    name: 'Shift Lead',
    description: 'Supervises cashiers, can void orders & manage daily operations',
    scope: 'Store',
    permCodes: [
      'pos.access', 'pos.void', 'pos.discount',
      'orders.view', 'orders.manage',
      'menu.view',
      'stock.view',
      'reports.store',
      'delivery.view',
      'customers.view',
      'kds.access', 'packing.access',
    ],
  },
  {
    name: 'Kitchen Staff',
    description: 'Kitchen display access & order view only',
    scope: 'Store',
    permCodes: ['orders.view', 'menu.view', 'kds.access', 'packing.access'],
  },
  {
    name: 'Delivery Driver',
    description: 'Can view and manage assigned deliveries',
    scope: 'Store',
    permCodes: ['orders.view', 'delivery.view', 'delivery.manage', 'customers.view'],
  },
  {
    name: 'Regional Manager',
    description: 'Oversees multiple stores with full store-level access & BI reports',
    scope: 'Global',
    permCodes: [
      'pos.access', 'pos.void', 'pos.discount', 'pos.refund',
      'orders.view', 'orders.manage',
      'menu.view', 'menu.manage',
      'stock.view', 'stock.manage',
      'reports.store', 'reports.global', 'reports.export',
      'hr.view', 'hr.manage',
      'delivery.view', 'delivery.manage',
      'customers.view', 'customers.manage',
      'settings.store',
      'kds.access', 'packing.access',
    ],
  },
  {
    name: 'Accountant',
    description: 'Financial reports and export access only',
    scope: 'Global',
    permCodes: ['reports.store', 'reports.global', 'reports.export', 'stock.view'],
  },
];

const SecuritySettings: React.FC = () => {
  const { token } = useStore();
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });

  useEffect(() => { fetchData(); }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const [rolesRes, permsRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/roles`, { headers }),
        fetch(`${API_URL}/api/v1/roles/permissions`, { headers }),
      ]);
      if (rolesRes.ok) {
        const r = await rolesRes.json();
        setRoles(r);
        // Auto-select first role
        if (r.length > 0 && !selectedRole) setSelectedRole(r[0]);
      }
      if (permsRes.ok) setPermissions(await permsRes.json());
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group permissions by module
  const permissionsByModule = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    permissions.forEach(p => {
      const mod = p.module || 'Other';
      if (!grouped[mod]) grouped[mod] = [];
      grouped[mod].push(p);
    });
    return grouped;
  }, [permissions]);

  const openEditor = (role?: any) => {
    if (role) {
      setEditingRole(role);
      setRoleForm({
        name: role.name,
        description: role.description || '',
        permissions: role.permissions?.map((p: any) => p.permissionId || p.permission?.id) || [],
      });
    } else {
      setEditingRole(null);
      setRoleForm({ name: '', description: '', permissions: [] });
    }
    setShowEditor(true);
  };

  const applyTemplate = (template: typeof ROLE_TEMPLATES[0]) => {
    // Map template permission codes → actual permission IDs
    const permIds = permissions
      .filter(p => template.permCodes.includes(p.code))
      .map(p => p.id);

    setEditingRole(null);
    setRoleForm({
      name: template.name,
      description: template.description,
      permissions: permIds,
    });
    setShowTemplates(false);
    setShowEditor(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingRole ? `${API_URL}/api/v1/roles/${editingRole.id}` : `${API_URL}/api/v1/roles`;
      const method = editingRole ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(roleForm),
      });
      if (res.ok) {
        setToast({ message: editingRole ? 'Role updated successfully' : 'Role created successfully', type: 'success' });
        setShowEditor(false);
        await fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        setToast({ message: err.message || 'Failed to save role', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Network error', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/roles/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setToast({ message: 'Role deleted', type: 'success' });
        setDeleteConfirm(null);
        if (selectedRole?.id === id) setSelectedRole(null);
        if (editingRole?.id === id) { setShowEditor(false); setEditingRole(null); }
        await fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        setToast({ message: err.message || 'Cannot delete role', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Network error', type: 'error' });
    }
  };

  const togglePermission = (permId: string) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(id => id !== permId)
        : [...prev.permissions, permId],
    }));
  };

  const toggleModuleAll = (module: string) => {
    const modulePermIds = permissionsByModule[module]?.map(p => p.id) || [];
    const allSelected = modulePermIds.every(id => roleForm.permissions.includes(id));
    setRoleForm(prev => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter(id => !modulePermIds.includes(id))
        : [...new Set([...prev.permissions, ...modulePermIds])],
    }));
  };

  if (loading && roles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading security configurations…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl font-semibold text-sm flex items-center gap-2 animate-in slide-in-from-top-2 duration-300 ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Security & RBAC</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {roles.length} roles · {permissions.length} permissions configured
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold text-sm"
          >
            <Copy size={18} />
            Use Template
          </button>
          <button
            onClick={() => openEditor()}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none font-semibold text-sm"
          >
            <Plus size={18} />
            Custom Role
          </button>
        </div>
      </div>

      {/* Templates Drawer */}
      {showTemplates && (
        <div className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 p-6 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Role Templates</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Click a template to create a new role with predefined permissions</p>
            </div>
            <button onClick={() => setShowTemplates(false)} className="p-1.5 hover:bg-white/60 rounded-lg">
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ROLE_TEMPLATES.map((t) => (
              <button
                key={t.name}
                onClick={() => applyTemplate(t)}
                className="text-left p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-indigo-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg ${t.scope === 'Global' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {t.scope === 'Global' ? <Globe size={16} /> : <Store size={16} />}
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    t.scope === 'Global' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {t.scope}
                  </span>
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">{t.name}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{t.description}</p>
                <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
                  <Key size={12} /> {t.permCodes.length} permissions
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={18} className="text-emerald-500" />
            <h3 className="font-bold text-gray-900 dark:text-white uppercase text-xs tracking-wider">Access Roles</h3>
          </div>

          {/* System Roles */}
          {roles.filter(r => r.isSystem).length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">System Roles</p>
              {roles.filter(r => r.isSystem).map(role => (
                <RoleCard
                  key={role.id}
                  role={role}
                  isSelected={selectedRole?.id === role.id}
                  onSelect={() => { setSelectedRole(role); setShowEditor(false); }}
                  onEdit={() => openEditor(role)}
                  onDelete={null}
                />
              ))}
            </div>
          )}

          {/* Custom Roles */}
          {roles.filter(r => !r.isSystem).length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Custom Roles</p>
              {roles.filter(r => !r.isSystem).map(role => (
                <RoleCard
                  key={role.id}
                  role={role}
                  isSelected={selectedRole?.id === role.id}
                  onSelect={() => { setSelectedRole(role); setShowEditor(false); }}
                  onEdit={() => openEditor(role)}
                  onDelete={() => setDeleteConfirm(role.id)}
                />
              ))}
            </div>
          )}

          {roles.filter(r => !r.isSystem).length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              <Shield size={28} className="mx-auto mb-2 text-gray-300" />
              No custom roles yet
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2">
          {showEditor ? (
            /* ── Role Editor ── */
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{editingRole ? `Edit: ${editingRole.name}` : 'Create New Role'}</h3>
                    <p className="text-indigo-100 text-sm mt-1">
                      {editingRole?.isSystem ? 'Modify permissions (name cannot be changed for system roles)' : 'Define name, description & granular permissions'}
                    </p>
                  </div>
                  <button onClick={() => setShowEditor(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-6 border-b border-gray-100 dark:border-gray-700">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Role Name</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g., Shift Lead"
                      value={roleForm.name}
                      onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                      disabled={editingRole?.isSystem}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</label>
                    <input
                      type="text"
                      placeholder="What is the purpose of this role?"
                      value={roleForm.description}
                      onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    />
                  </div>
                </div>

                {/* Permissions by Module */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">Permissions</h4>
                      <p className="text-xs text-gray-500">{roleForm.permissions.length} of {permissions.length} selected</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-lg">
                      <Lock size={14} /> RBAC
                    </div>
                  </div>

                  <div className="max-h-[500px] overflow-y-auto pr-1 space-y-5 custom-scrollbar">
                    {Object.entries(permissionsByModule).map(([module, perms]) => {
                      const Icon = MODULE_ICONS[module] || Key;
                      const colorClass = MODULE_COLORS[module] || 'text-gray-500 bg-gray-50';
                      const modulePermIds = perms.map((p: any) => p.id);
                      const selectedCount = modulePermIds.filter((id: string) => roleForm.permissions.includes(id)).length;
                      const allSelected = selectedCount === modulePermIds.length;

                      return (
                        <div key={module} className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => toggleModuleAll(module)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50/50 dark:bg-gray-700/30 hover:bg-gray-100/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-lg ${colorClass}`}>
                                <Icon size={16} />
                              </div>
                              <span className="font-bold text-sm text-gray-900 dark:text-white">{module}</span>
                              <span className="text-xs text-gray-400">{selectedCount}/{perms.length}</span>
                            </div>
                            <div className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold transition-colors ${
                              allSelected ? 'bg-indigo-600 text-white' : selectedCount > 0 ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-200 text-gray-400'
                            }`}>
                              {allSelected ? <Check size={12} /> : selectedCount > 0 ? '—' : ''}
                            </div>
                          </button>
                          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 divide-gray-50 dark:divide-gray-700/50">
                            {perms.map((perm: any) => {
                              const isOn = roleForm.permissions.includes(perm.id);
                              return (
                                <div
                                  key={perm.id}
                                  onClick={() => togglePermission(perm.id)}
                                  className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                                    isOn ? 'bg-indigo-50/40 dark:bg-indigo-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/20'
                                  }`}
                                >
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{perm.name}</p>
                                    {perm.description && <p className="text-[11px] text-gray-400 mt-0.5">{perm.description}</p>}
                                  </div>
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                                    isOn ? 'bg-indigo-600 text-white shadow' : 'bg-gray-200 dark:bg-gray-600'
                                  }`}>
                                    {isOn && <Check size={12} />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowEditor(false)}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? 'Saving…' : 'Save Role'}
                  </button>
                </div>
              </form>
            </div>
          ) : selectedRole ? (
            /* ── Role Viewer ── */
            <SelectedRoleView
              role={selectedRole}
              permissionsByModule={permissionsByModule}
              onEdit={() => openEditor(selectedRole)}
            />
          ) : (
            /* ── Empty State ── */
            <div className="bg-gray-50 dark:bg-gray-800/30 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-12 text-center">
              <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center mx-auto mb-6">
                <ShieldAlert size={32} className="text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Role Configurator</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
                Select a role from the list to view its permissions, or create a new custom role.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Delete Role?</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// ── Sub-components ──────────────────────────────────────────────

const RoleCard: React.FC<{
  role: any;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: (() => void) | null;
}> = ({ role, isSelected, onSelect, onEdit, onDelete }) => (
  <div
    className={`group p-4 rounded-xl border transition-all cursor-pointer mb-2 ${
      isSelected
        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 shadow'
        : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-200'
    }`}
    onClick={onSelect}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`p-2 rounded-lg flex-shrink-0 ${role.isSystem ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
          {role.isSystem ? <Crown size={18} /> : <Shield size={18} />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{role.name}</h4>
            {role.isSystem && (
              <span className="text-[9px] bg-amber-600 text-white px-1.5 py-0.5 rounded uppercase font-bold flex-shrink-0">System</span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{role.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-all"
          >
            <Trash2 size={14} />
          </button>
        )}
        <ChevronRight size={16} className="text-gray-300 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
    <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
      <span className="flex items-center gap-1"><Key size={12} /> {role.permissions?.length || 0} perms</span>
      <span className="flex items-center gap-1"><Users size={12} /> {role._count?.users || 0} users</span>
    </div>
  </div>
);


const SelectedRoleView: React.FC<{
  role: any;
  permissionsByModule: Record<string, any[]>;
  onEdit: () => void;
}> = ({ role, permissionsByModule, onEdit }) => {
  const rolePermIds = new Set(role.permissions?.map((rp: any) => rp.permissionId || rp.permission?.id) || []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${role.isSystem ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
            {role.isSystem ? <Crown size={22} /> : <Shield size={22} />}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{role.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{role.description || 'No description'}</p>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold text-sm"
        >
          Edit Permissions
        </button>
      </div>

      <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
        {Object.entries(permissionsByModule).map(([module, perms]) => {
          const Icon = MODULE_ICONS[module] || Key;
          const colorClass = MODULE_COLORS[module] || 'text-gray-500 bg-gray-50';
          const modulePermIds = perms.map((p: any) => p.id);
          const activeCount = modulePermIds.filter((id: string) => rolePermIds.has(id)).length;

          return (
            <div key={module} className="rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50 dark:bg-gray-700/30">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${colorClass}`}>
                    <Icon size={16} />
                  </div>
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{module}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  activeCount === perms.length ? 'bg-emerald-100 text-emerald-700' :
                  activeCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {activeCount}/{perms.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2">
                {perms.map((perm: any) => {
                  const isActive = rolePermIds.has(perm.id);
                  return (
                    <div key={perm.id} className="flex items-center gap-3 px-4 py-2.5 border-t border-gray-50 dark:border-gray-700/50">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isActive ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-600'
                      }`}>
                        {isActive && <Check size={10} />}
                      </div>
                      <span className={`text-sm ${isActive ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-400 line-through'}`}>
                        {perm.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SecuritySettings;
