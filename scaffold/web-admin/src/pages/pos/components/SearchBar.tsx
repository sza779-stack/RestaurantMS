import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Flame, Star } from 'lucide-react';

interface SearchItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  subcategory?: string;
  type: 'product' | 'category' | 'build-your-own';
}

interface SearchBarProps {
  items: SearchItem[];
  onSelect: (item: SearchItem) => void;
  onBuildYourOwn: () => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  items,
  onSelect,
  onBuildYourOwn,
  placeholder = 'Search menu items, categories...',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredItems, setFilteredItems] = useState<SearchItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim() === '') {
      setFilteredItems([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = items.filter(
      (item) =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery) ||
        (item.category || '').toLowerCase().includes(lowerQuery) ||
        item.subcategory?.toLowerCase().includes(lowerQuery),
    );

    const sorted = filtered.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      if (aName === lowerQuery) return -1;
      if (bName === lowerQuery) return 1;
      if (aName.startsWith(lowerQuery)) return -1;
      if (bName.startsWith(lowerQuery)) return 1;
      return 0;
    });

    setFilteredItems(sorted.slice(0, 10));
  }, [query, items]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = (item: SearchItem) => {
    if (item.type === 'build-your-own') {
      onBuildYourOwn();
    } else {
      onSelect(item);
    }
    setQuery('');
    setIsOpen(false);
  };

  const clearSearch = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const getIcon = (item: SearchItem) => {
    switch (item.type) {
      case 'build-your-own':
        return <span className="text-xl">??</span>;
      case 'category':
        return <Star size={18} className="text-yellow-500" />;
      default:
        if (item.category === 'Pizza') return <span className="text-lg">??</span>;
        if (item.category === 'Pasta') return <span className="text-lg">??</span>;
        if (item.category === 'Subs') return <span className="text-lg">??</span>;
        if (item.category === 'Drinks') return <span className="text-lg">??</span>;
        if (item.category === 'Dessert') return <span className="text-lg">??</span>;
        if (item.category === 'Sides') return <span className="text-lg">??</span>;
        return <Flame size={18} className="text-orange-500" />;
    }
  };

  const getCategoryColor = (category?: string) => {
    const safeCategory = category || 'Other';
    const colors: Record<string, string> = {
      Pizza: 'bg-red-100 text-red-700',
      Pasta: 'bg-yellow-100 text-yellow-700',
      Subs: 'bg-green-100 text-green-700',
      Drinks: 'bg-blue-100 text-blue-700',
      Dessert: 'bg-pink-100 text-pink-700',
      Sides: 'bg-orange-100 text-orange-700',
    };
    return colors[safeCategory] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full min-h-11 pl-10 pr-28 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-400 shadow-sm text-slate-900 dark:text-white placeholder-slate-400 font-medium"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={16} className="text-slate-400" />
          </button>
        )}

        <div className="absolute right-12 top-1/2 transform -translate-y-1/2 hidden md:flex items-center gap-1 text-xs text-slate-400">
          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">Ctrl</kbd>
          <span>+</span>
          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">K</kbd>
        </div>
      </div>

      {isOpen && (query.trim() !== '' || filteredItems.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 max-h-[400px] overflow-y-auto">
          {filteredItems.length === 0 && query.trim() !== '' ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              <Search size={48} className="mx-auto mb-3 text-slate-300" />
              <p className="text-lg font-medium">No items found</p>
              <p className="text-sm">Try searching for something else</p>
            </div>
          ) : (
            <div className="py-2">
              {filteredItems.map((item, index) => (
                <button
                  key={item.id + index}
                  onClick={() => handleSelect(item)}
                  className="w-full px-4 py-3 flex items-center gap-4 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                    {getIcon(item)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white truncate">{item.name}</span>
                      {item.type === 'build-your-own' && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                          Popular
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(item.category)}`}>
                        {item.category || 'Other'}
                      </span>
                      {item.subcategory && <span className="text-xs text-slate-500 dark:text-slate-400">{item.subcategory}</span>}
                    </div>

                    {item.description && <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.description}</p>}
                  </div>

                  {item.price > 0 && (
                    <div className="text-right">
                      <span className="font-bold text-orange-600 dark:text-orange-300">${item.price.toFixed(2)}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-2 bg-slate-50 dark:bg-slate-950">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 bg-white rounded border border-slate-300">Up</kbd>
                  <kbd className="px-1 bg-white rounded border border-slate-300">Down</kbd>
                  <span>to navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 bg-white rounded border border-slate-300">Enter</kbd>
                  <span>to select</span>
                </span>
              </div>
              <span>{filteredItems.length} results</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
