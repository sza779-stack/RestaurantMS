import React from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import './settings-theme.css';
import {
  Package,
  Utensils,
  BarChart3,
  Lightbulb,
  Users,
  User,
  Settings,
  ChevronRight,
  Store,
  ArrowLeft,
  Truck,
  Database,
  Globe,
  UserPlus,
  ShieldAlert
} from 'lucide-react';
import { useStore } from '../../hooks/useStore';

const settingsNav = [
  {
    id: 'insights',
    name: 'Global Insights',
    description: 'Company-wide performance & BI',
    icon: Globe,
    color: 'indigo',
    path: '/settings/global-insights',
    roles: ['Owner']
  },
  {
    id: 'users',
    name: 'User Management',
    description: 'Manage access levels & store mapping',
    icon: UserPlus,
    color: 'blue',
    path: '/settings/users',
    roles: ['Owner']
  },
  {
    id: 'security',
    name: 'Security & Roles',
    description: 'RBAC, permissions & identity',
    icon: ShieldAlert,
    color: 'red',
    path: '/settings/security',
    roles: ['Owner']
  },
  {
    id: 'stock',
    name: 'Stock Management',
    description: 'Inventory, suppliers & purchase orders',
    icon: Package,
    color: 'blue',
    path: '/settings/stock'
  },
  {
    id: 'menu',
    name: 'Menu Management',
    description: 'Products, categories & modifiers',
    icon: Utensils,
    color: 'orange',
    path: '/settings/menu'
  },
  {
    id: 'delivery',
    name: 'Delivery Management',
    description: 'Drivers, dispatch map & delivery testing',
    icon: Truck,
    color: 'red',
    path: '/settings/delivery'
  },
  {
    id: 'analytics',
    name: 'Analytics & Reports',
    description: 'Sales data, insights & trends',
    icon: BarChart3,
    color: 'green',
    path: '/settings/analytics'
  },
  {
    id: 'customers',
    name: 'Customer Management',
    description: 'Profiles, phone search & addresses',
    icon: User,
    color: 'teal',
    path: '/settings/customers'
  },
  {
    id: 'suggestions',
    name: 'Staff Suggestions',
    description: 'Employee feedback & ideas',
    icon: Lightbulb,
    color: 'yellow',
    path: '/settings/suggestions'
  },
  {
    id: 'hr',
    name: 'HR Management',
    description: 'Wages, attendance & scheduling',
    icon: Users,
    color: 'purple',
    path: '/settings/hr'
  },
  {
    id: 'data',
    name: 'Data Management',
    description: 'Docker controls, backup & reset tools',
    icon: Database,
    color: 'indigo',
    path: '/settings/data'
  },
  {
    id: 'general',
    name: 'General Settings',
    description: 'Store configuration & preferences',
    icon: Settings,
    color: 'gray',
    path: '/settings/general'
  },
];

const colorClasses: Record<string, { 
  bg: string; 
  text: string; 
  border: string; 
  light: string;
  darkBg: string;
  darkText: string;
  darkLight: string;
}> = {
  blue: { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-600', light: 'bg-blue-50', darkBg: 'dark:bg-blue-500', darkText: 'dark:text-blue-400', darkLight: 'dark:bg-blue-900/30' },
  orange: { bg: 'bg-orange-600', text: 'text-orange-600', border: 'border-orange-600', light: 'bg-orange-50', darkBg: 'dark:bg-orange-500', darkText: 'dark:text-orange-400', darkLight: 'dark:bg-orange-900/30' },
  red: { bg: 'bg-red-600', text: 'text-red-600', border: 'border-red-600', light: 'bg-red-50', darkBg: 'dark:bg-red-500', darkText: 'dark:text-red-400', darkLight: 'dark:bg-red-900/30' },
  green: { bg: 'bg-green-600', text: 'text-green-600', border: 'border-green-600', light: 'bg-green-50', darkBg: 'dark:bg-green-500', darkText: 'dark:text-green-400', darkLight: 'dark:bg-green-900/30' },
  yellow: { bg: 'bg-yellow-600', text: 'text-yellow-600', border: 'border-yellow-600', light: 'bg-yellow-50', darkBg: 'dark:bg-yellow-500', darkText: 'dark:text-yellow-400', darkLight: 'dark:bg-yellow-900/30' },
  purple: { bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-600', light: 'bg-purple-50', darkBg: 'dark:bg-purple-500', darkText: 'dark:text-purple-400', darkLight: 'dark:bg-purple-900/30' },
  gray: { bg: 'bg-gray-600', text: 'text-gray-600', border: 'border-gray-600', light: 'bg-gray-50', darkBg: 'dark:bg-gray-500', darkText: 'dark:text-gray-400', darkLight: 'dark:bg-gray-800' },
  indigo: { bg: 'bg-indigo-600', text: 'text-indigo-600', border: 'border-indigo-600', light: 'bg-indigo-50', darkBg: 'dark:bg-indigo-500', darkText: 'dark:text-indigo-400', darkLight: 'dark:bg-indigo-900/30' },
  teal: { bg: 'bg-teal-600', text: 'text-teal-600', border: 'border-teal-600', light: 'bg-teal-50', darkBg: 'dark:bg-teal-500', darkText: 'dark:text-teal-400', darkLight: 'dark:bg-teal-900/30' },
};

const SettingsLayout: React.FC = () => {
  const { user } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  const userRoleName =
    typeof user?.role === 'string' ? user.role : user?.role?.name || '';

  const filteredNav = settingsNav.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(userRoleName);
  });

  const isRootSettings = location.pathname === '/settings' || location.pathname === '/settings/';

  if (isRootSettings) {
    return (
      <div className="settings-theme min-h-screen bg-background p-6 transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => navigate('/pos')}
              type="button"
              aria-label="Back to POS"
              className="p-2 rounded-lg transition-colors hover:bg-muted"
            >
              <ArrowLeft size={24} className="text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground mt-1">Manage your restaurant operations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNav.map((item) => {
              const colors = colorClasses[item.color];
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className="group rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/25"
                >
                  <div className="flex items-start gap-4">
                    <div className={`${colors.bg} ${colors.darkBg} p-4 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon size={28} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-card-foreground group-hover:text-foreground">{item.name}</h3>
                      <p className="text-muted-foreground mt-1 text-sm">{item.description}</p>
                    </div>
                    <ChevronRight size={24} className="text-muted-foreground/50 group-hover:text-muted-foreground group-hover:translate-x-1 transition-all" />
                  </div>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const activeItem = settingsNav.find(item => location.pathname.startsWith(item.path)) || settingsNav[0];
  const activeColors = colorClasses[activeItem.color];

  return (
    <div className="settings-theme min-h-screen bg-background flex transition-colors">
      <aside className="w-72 bg-card border-r border-border flex flex-col transition-colors">
        <div className="p-4 border-b border-border">
          <NavLink to="/settings" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Settings</span>
          </NavLink>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-3 space-y-1">
            {filteredNav.map((item) => {
              const colors = colorClasses[item.color];
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive ? `${colors.light} ${colors.darkLight} ${colors.text} ${colors.darkText} font-semibold` : 'text-muted-foreground hover:bg-muted/80 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Icon size={20} className={isActive ? `${colors.text} ${colors.darkText}` : 'text-muted-foreground/80'} />
                  <span className={isActive ? 'text-foreground' : ''}>{item.name}</span>
                  {isActive && <ChevronRight size={16} className="ml-auto" />}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>
      <main className="flex-1 overflow-auto settings-content">
        <Outlet />
      </main>
    </div>
  );
};

export default SettingsLayout;
