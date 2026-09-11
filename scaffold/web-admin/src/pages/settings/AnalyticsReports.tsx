import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingBag,
  Calendar,
  Download,
  Filter,
  ChevronDown,
  PieChart,
  Activity,
  Clock,
  Target,
  Award,
  Package,
  Truck,
  ChefHat,
  UserCheck,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Box,
  ShoppingCart,
  UtensilsCrossed,
  ChefHat as ChefIcon,
  Bike,
  ClipboardList,
  FileText,
  Printer,
  RefreshCw,
  ArrowRight
} from 'lucide-react';

const AnalyticsReports: React.FC = () => {
  const [dateRange, setDateRange] = useState('7d');
  const [activeReport, setActiveReport] = useState<'overview' | 'sales' | 'products' | 'customers' | 'staff' | 'inventory' | 'staffing'>('overview');

  const stats = [
    { label: 'Total Revenue', value: '$24,560', change: '+12.5%', trend: 'up', icon: DollarSign, color: 'green' },
    { label: 'Total Orders', value: '1,247', change: '+8.2%', trend: 'up', icon: ShoppingBag, color: 'blue' },
    { label: 'Average Order', value: '$19.68', change: '-2.1%', trend: 'down', icon: Target, color: 'orange' },
    { label: 'Customers', value: '856', change: '+15.3%', trend: 'up', icon: Users, color: 'purple' },
  ];

  const topProducts = [
    { name: 'Margherita Pizza', quantity: 234, revenue: 3516.66, growth: 12 },
    { name: 'Pepperoni Pizza', quantity: 198, revenue: 3364.02, growth: 8 },
    { name: 'Buffalo Wings', quantity: 156, revenue: 2182.44, growth: -5 },
    { name: 'Italian Sub', quantity: 142, revenue: 1418.58, growth: 15 },
    { name: 'Garlic Fries', quantity: 128, revenue: 510.72, growth: 3 },
  ];

  const hourlyData = [
    { hour: '8AM', orders: 12, revenue: 240 },
    { hour: '10AM', orders: 28, revenue: 560 },
    { hour: '12PM', orders: 85, revenue: 1700 },
    { hour: '2PM', orders: 62, revenue: 1240 },
    { hour: '4PM', orders: 45, revenue: 900 },
    { hour: '6PM', orders: 98, revenue: 1960 },
    { hour: '8PM', orders: 112, revenue: 2240 },
    { hour: '10PM', orders: 45, revenue: 900 },
  ];

  const categoryBreakdown = [
    { name: 'Pizza', percentage: 45, revenue: 11052, color: '#ef4444' },
    { name: 'Pasta', percentage: 18, revenue: 4421, color: '#eab308' },
    { name: 'Wings', percentage: 15, revenue: 3684, color: '#f97316' },
    { name: 'Subs', percentage: 12, revenue: 2947, color: '#22c55e' },
    { name: 'Drinks', percentage: 10, revenue: 2456, color: '#3b82f6' },
  ];

  const staffPerformance = [
    { name: 'John Smith', role: 'Cashier', orders: 156, upsell: '$234', rating: 4.8 },
    { name: 'Sarah Johnson', role: 'Server', orders: 142, upsell: '$189', rating: 4.9 },
    { name: 'Mike Davis', role: 'Cashier', orders: 138, upsell: '$167', rating: 4.7 },
    { name: 'Emily Wilson', role: 'Server', orders: 134, upsell: '$198', rating: 4.8 },
  ];

  // Inventory Suggestions Data
  const inventorySuggestions = {
    groceries: [
      { item: 'Flour (50lb bags)', currentStock: 2, suggestedOrder: 5, reason: 'High pizza sales trend', weeklyUsage: 8, urgency: 'medium' },
      { item: 'Mozzarella Cheese (blocks)', currentStock: 15, suggestedOrder: 25, reason: 'Weekend rush expected', weeklyUsage: 35, urgency: 'high' },
      { item: 'Pepperoni (sliced)', currentStock: 8, suggestedOrder: 12, reason: 'Popular topping', weeklyUsage: 15, urgency: 'medium' },
      { item: 'Tomato Sauce (cans)', currentStock: 20, suggestedOrder: 10, reason: 'Sufficient stock', weeklyUsage: 12, urgency: 'low' },
      { item: 'Chicken Wings (cases)', currentStock: 3, suggestedOrder: 8, reason: 'Game day this weekend', weeklyUsage: 10, urgency: 'high' },
      { item: 'Lettuce (cases)', currentStock: 2, suggestedOrder: 4, reason: 'Salad orders increasing', weeklyUsage: 5, urgency: 'medium' },
      { item: 'Onions (bags)', currentStock: 1, suggestedOrder: 3, reason: 'Low stock alert', weeklyUsage: 4, urgency: 'high' },
    ],
    packingMaterials: [
      { item: 'Pizza Boxes (14")', currentStock: 150, suggestedOrder: 300, reason: 'High volume weekends', weeklyUsage: 400, urgency: 'high' },
      { item: 'Pizza Boxes (12")', currentStock: 200, suggestedOrder: 250, reason: 'Standard stock', weeklyUsage: 350, urgency: 'medium' },
      { item: 'Wing Boxes', currentStock: 80, suggestedOrder: 200, reason: 'Game day demand', weeklyUsage: 180, urgency: 'high' },
      { item: 'Paper Bags (large)', currentStock: 300, suggestedOrder: 200, reason: 'Adequate stock', weeklyUsage: 250, urgency: 'low' },
      { item: 'Napkins (packs)', currentStock: 50, suggestedOrder: 100, reason: 'Regular replenishment', weeklyUsage: 80, urgency: 'medium' },
      { item: 'Plastic Utensils', currentStock: 500, suggestedOrder: 0, reason: 'Sufficient inventory', weeklyUsage: 300, urgency: 'low' },
      { item: 'Aluminum Foil', currentStock: 5, suggestedOrder: 10, reason: 'Sub & pasta wrapping', weeklyUsage: 12, urgency: 'medium' },
    ],
    beverages: [
      { item: 'Coca-Cola (2L)', currentStock: 24, suggestedOrder: 36, reason: 'Weekend demand', weeklyUsage: 45, urgency: 'medium' },
      { item: 'Diet Coke (cans)', currentStock: 48, suggestedOrder: 24, reason: 'Sufficient stock', weeklyUsage: 40, urgency: 'low' },
      { item: 'Bottled Water', currentStock: 12, suggestedOrder: 48, reason: 'Low stock alert', weeklyUsage: 60, urgency: 'high' },
    ],
  };

  // Staffing Forecast Data
  const staffingForecast = {
    dailyBreakdown: [
      { day: 'Monday', date: 'Jan 27', busyHours: '11AM-2PM', forecastedOrders: 85, suggestedStaff: { kitchen: 3, counter: 2, drivers: 2 }, confidence: 92 },
      { day: 'Tuesday', date: 'Jan 28', busyHours: '11AM-2PM, 5PM-8PM', forecastedOrders: 110, suggestedStaff: { kitchen: 4, counter: 2, drivers: 2 }, confidence: 88 },
      { day: 'Wednesday', date: 'Jan 29', busyHours: '11AM-2PM, 5PM-9PM', forecastedOrders: 125, suggestedStaff: { kitchen: 4, counter: 3, drivers: 3 }, confidence: 90 },
      { day: 'Thursday', date: 'Jan 30', busyHours: '11AM-2PM, 5PM-9PM', forecastedOrders: 140, suggestedStaff: { kitchen: 4, counter: 3, drivers: 3 }, confidence: 89 },
      { day: 'Friday', date: 'Jan 31', busyHours: '11AM-10PM', forecastedOrders: 220, suggestedStaff: { kitchen: 6, counter: 4, drivers: 5 }, confidence: 94 },
      { day: 'Saturday', date: 'Feb 1', busyHours: '11AM-10PM', forecastedOrders: 280, suggestedStaff: { kitchen: 7, counter: 5, drivers: 6 }, confidence: 96 },
      { day: 'Sunday', date: 'Feb 2', busyHours: '12PM-9PM', forecastedOrders: 195, suggestedStaff: { kitchen: 5, counter: 4, drivers: 4 }, confidence: 93 },
    ],
    hourlyPatterns: [
      { hour: '8AM - 11AM', avgOrders: 15, staffingNeed: 'Minimal', suggested: '1 Kitchen, 1 Counter' },
      { hour: '11AM - 2PM', avgOrders: 65, staffingNeed: 'High', suggested: '3 Kitchen, 2 Counter, 2 Drivers' },
      { hour: '2PM - 5PM', avgOrders: 30, staffingNeed: 'Medium', suggested: '2 Kitchen, 1 Counter, 1 Driver' },
      { hour: '5PM - 8PM', avgOrders: 85, staffingNeed: 'High', suggested: '4 Kitchen, 3 Counter, 3 Drivers' },
      { hour: '8PM - 10PM', avgOrders: 45, staffingNeed: 'Medium', suggested: '2 Kitchen, 2 Counter, 2 Drivers' },
      { hour: '10PM - Close', avgOrders: 10, staffingNeed: 'Minimal', suggested: '1 Kitchen, 1 Counter' },
    ],
    insights: [
      { type: 'warning', message: 'Friday & Saturday show 40% higher demand - consider scheduling extra staff' },
      { type: 'info', message: 'Lunch rush (11AM-2PM) requires 60% of daily kitchen capacity' },
      { type: 'success', message: 'Current staffing matches predicted demand with 91% accuracy' },
      { type: 'warning', message: 'Driver shortage predicted for Super Bowl Sunday - schedule additional drivers' },
    ],
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high': return <AlertCircle size={14} className="text-red-600" />;
      case 'medium': return <Clock size={14} className="text-yellow-600" />;
      case 'low': return <CheckCircle size={14} className="text-green-600" />;
      default: return null;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="text-gray-500 mt-1">Track performance and gain insights</p>
          </div>
          <div className="flex gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="custom">Custom Range</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              <Download size={18} />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'sales', label: 'Sales Report', icon: DollarSign },
          { id: 'products', label: 'Products', icon: ShoppingBag },
          { id: 'customers', label: 'Customers', icon: Users },
          { id: 'staff', label: 'Staff Performance', icon: Award },
          { id: 'inventory', label: 'Inventory AI Suggestions', icon: Lightbulb },
          { id: 'staffing', label: 'Staffing Forecast', icon: UserCheck },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium whitespace-nowrap transition-all ${
              activeReport === tab.id
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeReport === 'overview' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white p-5 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-3 rounded-xl bg-${stat.color}-50`}>
                    <stat.icon className={`text-${stat.color}-600`} size={24} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {stat.change}
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Chart */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Sales by Hour</h3>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Filter size={18} className="text-gray-400" />
                </button>
              </div>
              
              <div className="h-64 flex items-end gap-3">
                {hourlyData.map((data, index) => (
                  <div key={data.hour} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex gap-1">
                      <div 
                        className="flex-1 bg-green-500 rounded-t-lg transition-all hover:bg-green-600"
                        style={{ height: `${(data.orders / 120) * 200}px` }}
                        title={`${data.orders} orders`}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{data.hour}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded" />
                  <span className="text-sm text-gray-600">Orders</span>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Sales by Category</h3>
              
              <div className="space-y-4">
                {categoryBreakdown.map((cat) => (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                      <span className="text-sm text-gray-500">{cat.percentage}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">${cat.revenue.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Top Performing Products</h3>
              <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                View All
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Product</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Quantity Sold</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Revenue</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Growth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topProducts.map((product, index) => (
                    <tr key={product.name} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-green-100 text-green-700 rounded-lg flex items-center justify-center font-bold text-sm">
                            #{index + 1}
                          </span>
                          <span className="font-medium text-gray-900">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-gray-600">{product.quantity}</td>
                      <td className="px-4 py-4 text-right font-medium text-gray-900">${product.revenue.toFixed(2)}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                          product.growth >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {product.growth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {Math.abs(product.growth)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeReport === 'sales' && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BarChart3 size={64} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Detailed Sales Report</h3>
          <p className="text-gray-500 mb-6">View comprehensive sales analytics with breakdowns by day, week, and month</p>
          <div className="flex justify-center gap-3">
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Generate Report
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Schedule Reports
            </button>
          </div>
        </div>
      )}

      {activeReport === 'products' && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ShoppingBag size={64} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Product Performance</h3>
          <p className="text-gray-500 mb-6">Analyze product sales trends, profitability, and popularity</p>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            View Product Analytics
          </button>
        </div>
      )}

      {activeReport === 'customers' && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users size={64} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Customer Insights</h3>
          <p className="text-gray-500 mb-6">Understand customer behavior, loyalty, and ordering patterns</p>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            View Customer Report
          </button>
        </div>
      )}

      {activeReport === 'staff' && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Staff Performance</h3>
            <div className="flex gap-2">
              <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>All Roles</option>
                <option>Cashier</option>
                <option>Server</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Employee</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Role</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Orders</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Upsell Amount</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {staffPerformance.map((staff) => (
                  <tr key={staff.name} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-bold">{staff.name.charAt(0)}</span>
                        </div>
                        <span className="font-medium text-gray-900">{staff.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-gray-500">{staff.role}</td>
                    <td className="px-4 py-4 text-center font-medium text-gray-900">{staff.orders}</td>
                    <td className="px-4 py-4 text-right text-green-600 font-medium">{staff.upsell}</td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Award size={16} className="text-yellow-500" />
                        <span className="font-medium text-gray-900">{staff.rating}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inventory AI Suggestions Report */}
      {activeReport === 'inventory' && (
        <div className="space-y-6">
          {/* Header Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-xl text-white">
              <div className="flex items-center gap-3 mb-2">
                <ShoppingCart size={24} />
                <span className="text-blue-100">Total Items to Order</span>
              </div>
              <p className="text-3xl font-bold">24</p>
              <p className="text-sm text-blue-200 mt-1">Across all categories</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-5 rounded-xl text-white">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle size={24} />
                <span className="text-orange-100">High Priority</span>
              </div>
              <p className="text-3xl font-bold">7</p>
              <p className="text-sm text-orange-200 mt-1">Need immediate attention</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-5 rounded-xl text-white">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp size={24} />
                <span className="text-green-100">Est. Weekly Usage</span>
              </div>
              <p className="text-3xl font-bold">1,847</p>
              <p className="text-sm text-green-200 mt-1">Units across all items</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-5 rounded-xl text-white">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign size={24} />
                <span className="text-purple-100">Est. Order Cost</span>
              </div>
              <p className="text-3xl font-bold">$3,240</p>
              <p className="text-sm text-purple-200 mt-1">Based on current prices</p>
            </div>
          </div>

          {/* Groceries Section */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ChefIcon size={20} className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Groceries & Ingredients</h3>
                  <p className="text-sm text-gray-500">AI-suggested orders based on sales trends</p>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <Download size={18} />
                Export List
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Item</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Current Stock</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Weekly Usage</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Suggested Order</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">AI Reason</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {inventorySuggestions.groceries.map((item) => (
                    <tr key={item.item} className="hover:bg-gray-50">
                      <td className="px-4 py-4 font-medium text-gray-900">{item.item}</td>
                      <td className="px-4 py-4 text-center text-gray-600">{item.currentStock}</td>
                      <td className="px-4 py-4 text-center text-gray-600">{item.weeklyUsage}</td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                          +{item.suggestedOrder}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Lightbulb size={14} className="text-yellow-500" />
                          {item.reason}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(item.urgency)}`}>
                          {getUrgencyIcon(item.urgency)}
                          {item.urgency.charAt(0).toUpperCase() + item.urgency.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Packing Materials Section */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Box size={20} className="text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Packing Materials</h3>
                  <p className="text-sm text-gray-500">Boxes, bags, and supplies for delivery & takeout</p>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                <Download size={18} />
                Export List
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Item</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Current Stock</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Weekly Usage</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Suggested Order</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">AI Reason</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {inventorySuggestions.packingMaterials.map((item) => (
                    <tr key={item.item} className="hover:bg-gray-50">
                      <td className="px-4 py-4 font-medium text-gray-900">{item.item}</td>
                      <td className="px-4 py-4 text-center text-gray-600">{item.currentStock}</td>
                      <td className="px-4 py-4 text-center text-gray-600">{item.weeklyUsage}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-medium ${
                          item.suggestedOrder === 0 ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {item.suggestedOrder === 0 ? 'None' : `+${item.suggestedOrder}`}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Lightbulb size={14} className="text-yellow-500" />
                          {item.reason}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(item.urgency)}`}>
                          {getUrgencyIcon(item.urgency)}
                          {item.urgency.charAt(0).toUpperCase() + item.urgency.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Beverages Section */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Beverages</h3>
                  <p className="text-sm text-gray-500">Drinks and beverages inventory</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Item</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Current Stock</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Weekly Usage</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Suggested Order</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">AI Reason</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {inventorySuggestions.beverages.map((item) => (
                    <tr key={item.item} className="hover:bg-gray-50">
                      <td className="px-4 py-4 font-medium text-gray-900">{item.item}</td>
                      <td className="px-4 py-4 text-center text-gray-600">{item.currentStock}</td>
                      <td className="px-4 py-4 text-center text-gray-600">{item.weeklyUsage}</td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                          +{item.suggestedOrder}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Lightbulb size={14} className="text-yellow-500" />
                          {item.reason}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(item.urgency)}`}>
                          {getUrgencyIcon(item.urgency)}
                          {item.urgency.charAt(0).toUpperCase() + item.urgency.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 shadow-lg shadow-green-500/25">
              <ShoppingCart size={20} />
              Generate Purchase Orders
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50">
              <Printer size={20} />
              Print All Lists
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50">
              <RefreshCw size={20} />
              Refresh Analysis
            </button>
          </div>
        </div>
      )}

      {/* Staffing Forecast Report */}
      {activeReport === 'staffing' && (
        <div className="space-y-6">
          {/* AI Insights Banner */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Lightbulb size={28} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">AI-Powered Staffing Forecast</h3>
                <p className="text-purple-100 mb-4">
                  Based on historical data from the past 90 days, we've analyzed your busy hours, order patterns, 
                  and staffing efficiency to generate optimal schedules for the upcoming week.
                </p>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-300" />
                    <span>91% prediction accuracy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-blue-300" />
                    <span>Analyzed 12,450 orders</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-yellow-300" />
                    <span>Next 7 days forecast</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staffingForecast.insights.map((insight, idx) => (
              <div key={idx} className={`p-4 rounded-xl border ${
                insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                insight.type === 'success' ? 'bg-green-50 border-green-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-start gap-3">
                  {insight.type === 'warning' && <AlertCircle size={20} className="text-yellow-600 shrink-0" />}
                  {insight.type === 'success' && <CheckCircle size={20} className="text-green-600 shrink-0" />}
                  {insight.type === 'info' && <Lightbulb size={20} className="text-blue-600 shrink-0" />}
                  <p className={`text-sm font-medium ${
                    insight.type === 'warning' ? 'text-yellow-800' :
                    insight.type === 'success' ? 'text-green-800' :
                    'text-blue-800'
                  }`}>
                    {insight.message}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Weekly Forecast Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Calendar size={20} className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">7-Day Staffing Forecast</h3>
                  <p className="text-sm text-gray-500">Optimal staffing levels based on predicted demand</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  <FileText size={18} />
                  Export Schedule
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  <ClipboardList size={18} />
                  Create Schedules
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Day</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Predicted Busy Hours</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Est. Orders</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      <div className="flex items-center justify-center gap-1">
                        <ChefHat size={16} />
                        Kitchen
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      <div className="flex items-center justify-center gap-1">
                        <Users size={16} />
                        Counter
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      <div className="flex items-center justify-center gap-1">
                        <Bike size={16} />
                        Drivers
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {staffingForecast.dailyBreakdown.map((day) => (
                    <tr key={day.day} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-bold text-gray-900">{day.day}</p>
                          <p className="text-sm text-gray-500">{day.date}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                          <Clock size={14} />
                          {day.busyHours}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-bold text-gray-900">{day.forecastedOrders}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-red-100 text-red-700 rounded-full font-bold">
                          {day.suggestedStaff.kitchen}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-700 rounded-full font-bold">
                          {day.suggestedStaff.counter}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-green-100 text-green-700 rounded-full font-bold">
                          {day.suggestedStaff.drivers}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${day.confidence}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{day.confidence}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Hourly Patterns */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Hourly Staffing Patterns</h3>
                  <p className="text-sm text-gray-500">Typical staffing needs throughout the day</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staffingForecast.hourlyPatterns.map((pattern) => (
                <div key={pattern.hour} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-gray-900">{pattern.hour}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      pattern.staffingNeed === 'High' ? 'bg-red-100 text-red-700' :
                      pattern.staffingNeed === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {pattern.staffingNeed}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <ShoppingBag size={16} className="text-gray-400" />
                    <span className="text-2xl font-bold text-gray-900">{pattern.avgOrders}</span>
                    <span className="text-sm text-gray-500">avg orders</span>
                  </div>
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-gray-900">Suggested:</span> {pattern.suggested}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <ChefHat size={20} className="text-red-600" />
                </div>
                <span className="text-sm text-gray-500">Kitchen Hours Needed</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">284 hrs</p>
              <p className="text-sm text-green-600 mt-1">+12% vs last week</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users size={20} className="text-blue-600" />
                </div>
                <span className="text-sm text-gray-500">Counter Hours Needed</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">196 hrs</p>
              <p className="text-sm text-green-600 mt-1">+8% vs last week</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Bike size={20} className="text-green-600" />
                </div>
                <span className="text-sm text-gray-500">Driver Hours Needed</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">168 hrs</p>
              <p className="text-sm text-red-600 mt-1">+25% vs last week</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign size={20} className="text-purple-600" />
                </div>
                <span className="text-sm text-gray-500">Est. Labor Cost</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">$8,420</p>
              <p className="text-sm text-gray-500 mt-1">18% of revenue</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-500/25">
              <ClipboardList size={20} />
              Generate Schedule Templates
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50">
              <Printer size={20} />
              Print Forecast
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50">
              <RefreshCw size={20} />
              Recalculate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsReports;
