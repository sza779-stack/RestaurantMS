import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Settings, Store } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { ThemeToggle } from './ThemeToggle';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, currentStore } = useStore();
  const location = useLocation();
  const isSettingsPage = location.pathname.startsWith('/settings');
  const isPosPage = location.pathname.startsWith('/pos');

  return (
    <div className="min-h-screen bg-background transition-colors">
      <header className="bg-card shadow-sm border-b border-border transition-colors">
        <div className="px-4 py-3 flex items-center gap-4">
          <div className="flex items-center space-x-4 shrink-0">
            <NavLink to="/pos" className="flex items-center gap-2">
              <Store className="text-blue-600 dark:text-blue-400" size={24} />
              <h1 className="text-xl font-bold text-foreground transition-colors">
                Restaurant Platform
              </h1>
            </NavLink>
            {currentStore && (
              <span className="text-sm text-muted-foreground transition-colors">
                {currentStore.name}
              </span>
            )}
          </div>

          <div
            id={isPosPage ? 'pos-top-controls' : undefined}
            className="flex-1 min-w-0"
          />

          <div className="flex items-center space-x-4 shrink-0">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Settings Link */}
            <NavLink
              to="/settings"
              className={`p-2 rounded-lg transition-colors ${
                isSettingsPage 
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/80 dark:text-blue-300' 
                  : 'text-muted-foreground hover:bg-muted'
              }`}
              title="Settings"
            >
              <Settings size={20} />
            </NavLink>
            
            <span className="text-sm text-muted-foreground transition-colors">
              {user?.firstName} {user?.lastName}
            </span>
            <button
              onClick={logout}
              className="px-3 py-1.5 text-sm bg-secondary text-secondary-foreground hover:bg-muted rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
};

export default Layout;
