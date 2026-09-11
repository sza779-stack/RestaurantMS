import React from 'react';
import { ArrowRight } from 'lucide-react';

interface RewardsPageProps {
  setView: (view: any) => void;
  customer: any;
  REWARDS_TIERS: any[];
}

const RewardsPage: React.FC<RewardsPageProps> = ({
  setView,
  customer,
  REWARDS_TIERS
}) => {
  const customerPoints = customer?.loyaltyPoints || 0;
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 mb-6">
          <p className="text-gray-400">Your points</p>
          <p className="text-4xl font-black">{customerPoints}</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {REWARDS_TIERS.map((tier) => (
            <div key={tier.name} className="bg-slate-900/60 border border-white/10 rounded-2xl p-5">
              <p className="font-bold">{tier.name}</p>
              <p className="text-sm text-gray-400 mb-3">{tier.points}+ points</p>
              <ul className="text-sm text-gray-300 space-y-1">
                {tier.benefits.map((benefit: string) => (
                  <li key={benefit}>• {benefit}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RewardsPage;

