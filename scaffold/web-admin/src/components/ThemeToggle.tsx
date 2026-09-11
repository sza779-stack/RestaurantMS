import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
        <Sun className="w-5 h-5 text-gray-400" />
      </button>
    );
  }

  return (
    <div className="relative group">
      <button 
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
      >
        {resolvedTheme === 'light' ? (
          <Sun className="w-5 h-5 text-amber-500" />
        ) : (
          <Moon className="w-5 h-5 text-blue-400" />
        )}
        <span className="text-sm font-medium hidden sm:inline capitalize">{resolvedTheme}</span>
      </button>
      
      {/* Dropdown for theme selection */}
      <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <button
          onClick={() => setTheme('light')}
          className={`w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg ${theme === 'light' ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' : 'text-gray-700 dark:text-gray-300'}`}
        >
          <Sun className="w-4 h-4" />
          Light
          {theme === 'light' && <span className="ml-auto">✓</span>}
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${theme === 'dark' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300'}`}
        >
          <Moon className="w-4 h-4" />
          Dark
          {theme === 'dark' && <span className="ml-auto">✓</span>}
        </button>
        <button
          onClick={() => setTheme('system')}
          className={`w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 last:rounded-b-lg ${theme === 'system' ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' : 'text-gray-700 dark:text-gray-300'}`}
        >
          <Monitor className="w-4 h-4" />
          System
          {theme === 'system' && <span className="ml-auto">✓</span>}
        </button>
      </div>
    </div>
  );
}
