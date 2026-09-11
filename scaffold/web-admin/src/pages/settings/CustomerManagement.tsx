import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, User, MapPin, Save, Phone, Mail } from 'lucide-react';
import { api } from '../../services/api';

type Address = {
  id: string;
  label: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault?: boolean;
};

type Customer = {
  id: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  loyaltyPoints?: number;
  lifetimeSpend?: number;
  referralCode?: string;
  _count?: { referrals: number };
  addresses: Address[];
};

const emptyAddress = {
  label: 'Home',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  isDefault: false,
};

const CustomerManagement: React.FC = () => {
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [newAddress, setNewAddress] = useState(emptyAddress);
  const [createDraft, setCreateDraft] = useState({
    phone: '',
    firstName: '',
    lastName: '',
    email: '',
    appliedReferralCode: '',
  });

  const [loyaltyHistory, setLoyaltyHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (selectedCustomer?.id) {
      setLoadingHistory(true);
      api.customers.getLoyaltyHistory(selectedCustomer.id)
        .then(({ data }) => setLoyaltyHistory(data))
        .catch(console.error)
        .finally(() => setLoadingHistory(false));
    } else {
      setLoyaltyHistory([]);
    }
  }, [selectedCustomer?.id]);

  const runSearch = useCallback(async (q?: string) => {
    setIsLoading(true);
    try {
      const query = (q ?? search).trim();
      const { data } = await api.customers.getAll({ q: query || undefined, limit: 100 });
      setCustomers(Array.isArray(data) ? data : []);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    runSearch('');
  }, [runSearch]);

  const selectedName = useMemo(() => {
    if (!selectedCustomer) return '';
    return [selectedCustomer.firstName, selectedCustomer.lastName].filter(Boolean).join(' ') || 'Unnamed customer';
  }, [selectedCustomer]);

  const saveSelectedCustomer = async () => {
    if (!selectedCustomer) return;
    setIsSaving(true);
    setStatusMsg('');
    try {
      await api.customers.update(selectedCustomer.id, {
        firstName: selectedCustomer.firstName || null,
        lastName: selectedCustomer.lastName || null,
        email: selectedCustomer.email || null,
      });
      setStatusMsg('Customer details saved.');
      await runSearch(search);
    } catch (error: any) {
      setStatusMsg(error?.response?.data?.message || 'Failed to save customer details.');
    } finally {
      setIsSaving(false);
    }
  };

  const addAddressToSelected = async () => {
    if (!selectedCustomer) return;
    if (!newAddress.address.trim()) {
      setStatusMsg('Address line is required.');
      return;
    }

    setIsSaving(true);
    setStatusMsg('');
    try {
      const { data } = await api.customers.addAddress(selectedCustomer.id, newAddress);
      setSelectedCustomer((prev) => prev ? { ...prev, addresses: [...(prev.addresses || []), data] } : prev);
      setNewAddress(emptyAddress);
      setStatusMsg('Address added.');
      await runSearch(search);
    } catch (error: any) {
      setStatusMsg(error?.response?.data?.message || 'Failed to add address.');
    } finally {
      setIsSaving(false);
    }
  };

  const createCustomer = async () => {
    if (!createDraft.phone.trim()) {
      setStatusMsg('Phone is required to create a customer.');
      return;
    }

    setIsSaving(true);
    setStatusMsg('');
    try {
      const { data } = await api.customers.create({
        phone: createDraft.phone.trim(),
        firstName: createDraft.firstName.trim() || null,
        lastName: createDraft.lastName.trim() || null,
        email: createDraft.email.trim() || null,
        appliedReferralCode: createDraft.appliedReferralCode.trim() || undefined,
      });
      setCreateDraft({ phone: '', firstName: '', lastName: '', email: '', appliedReferralCode: '' });
      setSelectedCustomer(data);
      setStatusMsg('Customer created.');
      await runSearch(search);
    } catch (error: any) {
      setStatusMsg(error?.response?.data?.message || 'Failed to create customer.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Customer Management</h1>
          <p className="text-slate-400">Search, update, and create customer profiles with addresses.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-1 rounded-xl border border-slate-700 bg-slate-900/50 p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                placeholder="Search by phone/name/email"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-9 pr-3 py-2 text-slate-100"
              />
            </div>
            <button onClick={() => runSearch()} className="rounded-lg bg-blue-600 px-3 py-2 text-white">
              Search
            </button>
          </div>

          <div className="max-h-[520px] overflow-y-auto space-y-2">
            {isLoading && <p className="text-slate-400 text-sm">Loading customers...</p>}
            {!isLoading && customers.length === 0 && <p className="text-slate-500 text-sm">No customers found.</p>}
            {customers.map((c) => {
              const fullName = [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Unnamed customer';
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCustomer(c)}
                  className={`w-full text-left rounded-lg border p-3 transition ${
                    selectedCustomer?.id === c.id
                      ? 'border-blue-500 bg-blue-900/30'
                      : 'border-slate-700 bg-slate-800 hover:bg-slate-750'
                  }`}
                >
                  <p className="font-semibold text-slate-100">{fullName}</p>
                  <p className="text-slate-400 text-sm">{c.phone}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      ★ {c.loyaltyPoints || 0} pts
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                      ${Number(c.lifetimeSpend || 0).toFixed(2)} spent
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">
                      {c._count?.referrals || 0} refs
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="xl:col-span-2 rounded-xl border border-slate-700 bg-slate-900/50 p-4 space-y-4">
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 space-y-3">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Plus size={18} /> Create Customer
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={createDraft.phone}
                onChange={(e) => setCreateDraft((p) => ({ ...p, phone: e.target.value }))}
                placeholder="Phone *"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              />
              <input
                value={createDraft.email}
                onChange={(e) => setCreateDraft((p) => ({ ...p, email: e.target.value }))}
                placeholder="Email"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              />
              <input
                value={createDraft.firstName}
                onChange={(e) => setCreateDraft((p) => ({ ...p, firstName: e.target.value }))}
                placeholder="First name"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              />
              <input
                value={createDraft.lastName}
                onChange={(e) => setCreateDraft((p) => ({ ...p, lastName: e.target.value }))}
                placeholder="Last name"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              />
              <input
                value={createDraft.appliedReferralCode}
                onChange={(e) => setCreateDraft((p) => ({ ...p, appliedReferralCode: e.target.value }))}
                placeholder="Referral Code (Optional)"
                className="col-span-1 md:col-span-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              />
            </div>
            <button onClick={createCustomer} disabled={isSaving} className="rounded-lg bg-green-600 px-4 py-2 text-white">
              Create
            </button>
          </div>

          {selectedCustomer ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 space-y-3">
                <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <User size={18} /> {selectedName}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="text-sm text-slate-300">
                    <span className="block mb-1">Phone</span>
                    <input
                      disabled
                      value={selectedCustomer.phone || ''}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-400"
                    />
                  </label>
                  <label className="text-sm text-slate-300">
                    <span className="block mb-1">Email</span>
                    <input
                      value={selectedCustomer.email || ''}
                      onChange={(e) => setSelectedCustomer((p) => p ? ({ ...p, email: e.target.value }) : p)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                    />
                  </label>
                  <label className="text-sm text-slate-300">
                    <span className="block mb-1">First name</span>
                    <input
                      value={selectedCustomer.firstName || ''}
                      onChange={(e) => setSelectedCustomer((p) => p ? ({ ...p, firstName: e.target.value }) : p)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                    />
                  </label>
                  <label className="text-sm text-slate-300">
                    <span className="block mb-1">Last name</span>
                    <input
                      value={selectedCustomer.lastName || ''}
                      onChange={(e) => setSelectedCustomer((p) => p ? ({ ...p, lastName: e.target.value }) : p)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                    />
                  </label>
                  <label className="text-sm text-slate-300">
                    <span className="block mb-1">Referral Code</span>
                    <input
                      disabled
                      value={selectedCustomer.referralCode || 'N/A'}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-400 font-mono"
                    />
                  </label>
                  <label className="text-sm text-slate-300">
                    <span className="block mb-1">Successful Referrals</span>
                    <input
                      disabled
                      value={selectedCustomer._count?.referrals || 0}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-400"
                    />
                  </label>
                  <label className="text-sm text-slate-300 text-purple-400">
                    <span className="block mb-1 font-semibold">Loyalty Points</span>
                    <input
                      disabled
                      value={selectedCustomer.loyaltyPoints || 0}
                      className="w-full rounded-lg border border-purple-900 bg-slate-900 px-3 py-2 text-purple-300 font-bold"
                    />
                  </label>
                  <label className="text-sm text-slate-300 text-emerald-400">
                    <span className="block mb-1 font-semibold">Lifetime Spend</span>
                    <input
                      disabled
                      value={`$${Number(selectedCustomer.lifetimeSpend || 0).toFixed(2)}`}
                      className="w-full rounded-lg border border-emerald-900 bg-slate-900 px-3 py-2 text-emerald-300 font-bold"
                    />
                  </label>
                </div>
                <button onClick={saveSelectedCustomer} disabled={isSaving} className="rounded-lg bg-blue-600 px-4 py-2 text-white inline-flex items-center gap-2">
                  <Save size={16} /> Save Details
                </button>
              </div>

              {/* Loyalty History */}
              <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 space-y-3">
                <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <span className="text-yellow-500">★</span> Loyalty History
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {loadingHistory && <p className="text-slate-400 text-sm">Loading history...</p>}
                  {!loadingHistory && loyaltyHistory.length === 0 && (
                    <p className="text-slate-500 text-sm">No transaction history.</p>
                  )}
                  {loyaltyHistory.map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-700/50 text-sm">
                      <div>
                        <span className={`font-semibold mr-2 ${
                          tx.type === 'EARNED' || tx.type === 'SIGNUP' || tx.type === 'REFERRED' ? 'text-green-400' : 
                          tx.type === 'REDEEMED' ? 'text-red-400' : 'text-slate-300'
                        }`}>
                          {tx.type}
                        </span>
                        <span className="text-slate-400">{tx.description}</span>
                      </div>
                      <span className={`font-mono font-bold ${
                         ['EARNED', 'SIGNUP', 'REFERRED'].includes(tx.type) ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {['EARNED', 'SIGNUP', 'REFERRED'].includes(tx.type) ? '+' : '-'}{tx.points}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 space-y-3">
                <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <MapPin size={18} /> Addresses
                </h3>
                <div className="space-y-2">
                  {(selectedCustomer.addresses || []).map((addr) => (
                    <div key={addr.id} className="rounded-lg border border-slate-700 bg-slate-900 p-3">
                      <p className="text-slate-100 font-medium">
                        {addr.label} {addr.isDefault ? '(Default)' : ''}
                      </p>
                      <p className="text-slate-400 text-sm">
                        {addr.address}, {addr.city}, {addr.state} {addr.zipCode}
                      </p>
                    </div>
                  ))}
                  {(!selectedCustomer.addresses || selectedCustomer.addresses.length === 0) && (
                    <p className="text-slate-500 text-sm">No addresses saved.</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={newAddress.label}
                    onChange={(e) => setNewAddress((p) => ({ ...p, label: e.target.value }))}
                    placeholder="Label"
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                  />
                  <input
                    value={newAddress.address}
                    onChange={(e) => setNewAddress((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Address line"
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                  />
                  <input
                    value={newAddress.city}
                    onChange={(e) => setNewAddress((p) => ({ ...p, city: e.target.value }))}
                    placeholder="City"
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                  />
                  <input
                    value={newAddress.state}
                    onChange={(e) => setNewAddress((p) => ({ ...p, state: e.target.value }))}
                    placeholder="State"
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                  />
                  <input
                    value={newAddress.zipCode}
                    onChange={(e) => setNewAddress((p) => ({ ...p, zipCode: e.target.value }))}
                    placeholder="ZIP"
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                  />
                  <label className="flex items-center gap-2 text-slate-300 text-sm">
                    <input
                      type="checkbox"
                      checked={newAddress.isDefault}
                      onChange={(e) => setNewAddress((p) => ({ ...p, isDefault: e.target.checked }))}
                    />
                    Set default
                  </label>
                </div>
                <button onClick={addAddressToSelected} disabled={isSaving} className="rounded-lg bg-emerald-600 px-4 py-2 text-white">
                  Add Address
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 text-slate-400 text-center">
              Select a customer to edit details and addresses.
            </div>
          )}

          {statusMsg && (
            <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 flex items-center gap-2">
              <Phone size={14} />
              <Mail size={14} />
              <span>{statusMsg}</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CustomerManagement;

