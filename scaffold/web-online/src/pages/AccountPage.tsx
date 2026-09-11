import React from 'react';
import { ArrowRight } from 'lucide-react';

interface AccountPageProps {
  setView: (view: any) => void;
  customer: any;
  setCustomer: (customer: any) => void;
}

const AccountPage: React.FC<AccountPageProps> = ({
  setView,
  customer,
  setCustomer
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        {customer ? (
          <div className="bg-slate-900/60 border border-white/10 rounded-lg p-6">
            <h2 className="text-2xl font-bold">{customer.name}</h2>
            <p className="text-gray-400">{customer.email}</p>
            <div className="grid grid-cols-2 gap-4 my-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-gray-400 text-sm">Tier</p>
                <p className="font-bold">{customer.tier}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-gray-400 text-sm">Points</p>
                <p className="font-bold">{customer.loyaltyPoints}</p>
              </div>
            </div>
            <button
              onClick={() => setCustomer(null)}
              className="rounded-xl px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-300"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-white/10 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Sign In</h2>
            <p className="text-gray-400 mb-5">Use one click demo login to keep ordering history and rewards.</p>
            <button
              onClick={() => setCustomer({
                id: 'demo-customer',
                email: 'guest@futurepizza.com',
                name: 'Future Guest',
                loyaltyPoints: 240,
                tier: 'Silver',
                savedAddresses: [],
                orderHistory: [],
                preferences: { dietaryRestrictions: [], favoriteItems: [] },
              })}
              className="rounded-xl px-4 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 font-medium"
            >
              Sign In as Demo Customer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountPage;

