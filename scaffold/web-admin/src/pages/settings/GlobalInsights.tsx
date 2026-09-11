import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  TrendingUp,
  Store,
  DollarSign,
  ShoppingCart,
  Users,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Download,
} from 'lucide-react';
import { useStore } from '../../hooks/useStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const GlobalInsights: React.FC = () => {
  const { user, token } = useStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchGlobalData();
  }, [dateRange]);

  const fetchGlobalData = async () => {
    if (!user?.companyId) return;
    setLoading(true);
    try {
      const query = `companyId=${user.companyId}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
      
      const [overviewRes, insightsRes] = await Promise.all([
        fetch(`${API_URL}/reports/multi-store?${query}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/reports/insights?${query}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (overviewRes.ok) {
        const overviewData = await overviewRes.json();
        setData(overviewData);
      }
      
      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        setInsights(insightsData);
      }
    } catch (error) {
      console.error('Error fetching global insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Company Revenue',
      value: `$${data?.totalSales?.toLocaleString() || '0'}`,
      change: '+12.5%',
      isPositive: true,
      icon: DollarSign,
      color: 'bg-emerald-500',
    },
    {
      label: 'Store Aggregated Orders',
      value: data?.totalOrders || '0',
      change: '+8.2%',
      isPositive: true,
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
    {
      label: 'Average Order Value',
      value: `$${data?.averageOrderValue?.toFixed(2) || '0.00'}`,
      change: '-2.1%',
      isPositive: false,
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
    {
      label: 'Active Stores',
      value: data?.storeStats?.length || '0',
      change: 'Stable',
      isPositive: true,
      icon: Store,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Global Business Insights</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Aggregated performance metrics across all restaurant locations
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <Calendar size={18} className="text-gray-400" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="bg-transparent text-sm font-medium focus:outline-none dark:text-white"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="bg-transparent text-sm font-medium focus:outline-none dark:text-white"
            />
          </div>
          <button className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Download size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className={`${stat.color} p-3 rounded-xl text-white shadow-lg`}>
                <stat.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-sm font-semibold ${stat.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stat.isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                {stat.change}
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{stat.label}</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Store Ranking */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 dark:bg-indigo-900/40 p-2 rounded-lg">
                <Trophy className="text-indigo-600 dark:text-indigo-400" size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Store Performance Ranking</h3>
            </div>
            <button className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold">View All Locations</button>
          </div>
          
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.storeStats || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="storeName" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BI Insights */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl text-white shadow-xl shadow-indigo-200 dark:shadow-none">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp size={24} />
              <h3 className="text-lg font-bold">Smart Insights</h3>
            </div>
            <div className="space-y-4">
              {insights.length > 0 ? insights.map((insight, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">{insight.title}</p>
                  <p className="text-xl font-bold mt-1">{insight.value}</p>
                  <p className="text-white/60 text-sm mt-2">{insight.description}</p>
                </div>
              )) : (
                <p className="text-white/60">Gathering insights from your data...</p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">AOV Distribution</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.storeStats || []}>
                  <XAxis dataKey="storeName" hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="aov" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Average Store AOV</span>
                <span className="font-bold text-gray-900 dark:text-white">${data?.averageOrderValue?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Store Performance Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Store Location</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Orders</th>
                <th className="px-6 py-4">Revenue</th>
                <th className="px-6 py-4">Avg Order Value</th>
                <th className="px-6 py-4">Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data?.storeStats?.map((store: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                        {store.storeName.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">{store.storeName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">Online</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-medium">{store.orders}</td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-bold">${store.revenue.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-medium">${store.aov.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <div className="w-24 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full" 
                        style={{ width: `${Math.min(100, (store.revenue / (data.totalSales / data.storeStats.length)) * 100)}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GlobalInsights;
