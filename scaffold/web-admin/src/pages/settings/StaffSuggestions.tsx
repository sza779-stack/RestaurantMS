import React, { useState } from 'react';
import {
  Lightbulb,
  Plus,
  Search,
  Filter,
  ThumbsUp,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  User,
  Calendar,
  Send,
  Sparkles
} from 'lucide-react';

const categories = [
  { id: 'all', name: 'All Suggestions', count: 24 },
  { id: 'pending', name: 'Pending Review', count: 8 },
  { id: 'accepted', name: 'Accepted', count: 10 },
  { id: 'implemented', name: 'Implemented', count: 4 },
  { id: 'mine', name: 'My Suggestions', count: 2 },
];

const suggestions = [
  {
    id: '1',
    title: 'Add gluten-free pizza crust option',
    description: 'We\'ve had many customers ask about gluten-free options. Adding a gluten-free crust would help us serve customers with dietary restrictions and potentially increase sales.',
    category: 'MENU',
    status: 'ACCEPTED',
    priority: 'HIGH',
    author: { name: 'Sarah Johnson', role: 'Server', avatar: 'SJ' },
    upvotes: 12,
    comments: 4,
    createdAt: '2024-01-15',
    adminResponse: 'Great suggestion! We\'re testing gluten-free dough recipes and plan to launch next month.',
  },
  {
    id: '2',
    title: 'Improve kitchen lighting',
    description: 'The prep area lighting is too dim, making it hard to see during evening shifts. Better lighting would improve safety and food quality.',
    category: 'OPERATIONS',
    status: 'IMPLEMENTED',
    priority: 'MEDIUM',
    author: { name: 'Mike Chen', role: 'Cook', avatar: 'MC' },
    upvotes: 8,
    comments: 2,
    createdAt: '2024-01-10',
    adminResponse: 'LED lights have been installed in all prep areas. Thank you for the feedback!',
  },
  {
    id: '3',
    title: 'Staff discount on family meals',
    description: 'Could we get a 20% discount when ordering family meals for takeout? It would be a nice perk and help us promote the family deals.',
    category: 'MORALE',
    status: 'PENDING',
    priority: 'LOW',
    author: { name: 'Emily Davis', role: 'Cashier', avatar: 'ED' },
    upvotes: 15,
    comments: 6,
    createdAt: '2024-01-18',
    adminResponse: null,
  },
  {
    id: '4',
    title: 'New POS terminal for busy hours',
    description: 'During rush hours, we often have lines because only one POS is working. A second terminal would speed up service.',
    category: 'EFFICIENCY',
    status: 'UNDER_REVIEW',
    priority: 'HIGH',
    author: { name: 'John Smith', role: 'Shift Manager', avatar: 'JS' },
    upvotes: 20,
    comments: 3,
    createdAt: '2024-01-12',
    adminResponse: null,
  },
  {
    id: '5',
    title: 'Weekly team lunch',
    description: 'Having a team lunch once a week would boost morale and help new staff integrate better with the team.',
    category: 'MORALE',
    status: 'PENDING',
    priority: 'MEDIUM',
    author: { name: 'Lisa Wang', role: 'Server', avatar: 'LW' },
    upvotes: 18,
    comments: 8,
    createdAt: '2024-01-16',
    adminResponse: null,
  },
];

const categoryColors: Record<string, string> = {
  MENU: 'bg-orange-100 text-orange-700',
  OPERATIONS: 'bg-blue-100 text-blue-700',
  EFFICIENCY: 'bg-green-100 text-green-700',
  MORALE: 'bg-purple-100 text-purple-700',
  CLEANLINESS: 'bg-cyan-100 text-cyan-700',
  SAFETY: 'bg-red-100 text-red-700',
  CUSTOMER_SERVICE: 'bg-pink-100 text-pink-700',
  GENERAL: 'bg-gray-100 text-gray-700',
};

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  PENDING: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Pending' },
  UNDER_REVIEW: { color: 'bg-blue-100 text-blue-700', icon: AlertCircle, label: 'Under Review' },
  ACCEPTED: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Accepted' },
  IMPLEMENTED: { color: 'bg-purple-100 text-purple-700', icon: Sparkles, label: 'Implemented' },
  REJECTED: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Rejected' },
};

const priorityColors: Record<string, string> = {
  LOW: 'text-gray-500',
  MEDIUM: 'text-yellow-600',
  HIGH: 'text-orange-600',
  URGENT: 'text-red-600',
};

const StaffSuggestions: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewSuggestion, setShowNewSuggestion] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<typeof suggestions[0] | null>(null);

  const filteredSuggestions = suggestions.filter(s => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'mine') return s.author.name === 'You'; // Mock
    return s.status.toLowerCase() === activeFilter;
  }).filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff Suggestions</h1>
            <p className="text-gray-500 mt-1">Share ideas and feedback to improve our workplace</p>
          </div>
          <button 
            onClick={() => setShowNewSuggestion(true)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium"
          >
            <Plus size={18} />
            Submit Suggestion
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-5 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">Total Suggestions</p>
              <p className="text-3xl font-bold">24</p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <Lightbulb size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Implemented</p>
              <p className="text-3xl font-bold text-green-600">4</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Review</p>
              <p className="text-3xl font-bold text-yellow-600">8</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Upvotes</p>
              <p className="text-3xl font-bold text-purple-600">156</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <ThumbsUp className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Filters</h3>
            <nav className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveFilter(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeFilter === cat.id
                      ? 'bg-yellow-50 text-yellow-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeFilter === cat.id ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </nav>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Categories</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(categoryColors).map(([cat, colorClass]) => (
                  <span key={cat} className={`px-2 py-1 rounded-md text-xs font-medium ${colorClass}`}>
                    {cat.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search suggestions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>

          {/* Suggestions List */}
          <div className="space-y-4">
            {filteredSuggestions.map((suggestion) => {
              const status = statusConfig[suggestion.status];
              const StatusIcon = status.icon;
              
              return (
                <div 
                  key={suggestion.id} 
                  onClick={() => setSelectedSuggestion(suggestion)}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    {/* Author Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                      {suggestion.author.avatar}
                    </div>

                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">{suggestion.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-500">{suggestion.author.name}</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-sm text-gray-500">{suggestion.author.role}</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-sm text-gray-500">{suggestion.createdAt}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoryColors[suggestion.category]}`}>
                            {suggestion.category.replace('_', ' ')}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
                            <StatusIcon size={12} />
                            {status.label}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-gray-600 text-sm mt-2 line-clamp-2">{suggestion.description}</p>

                      {/* Admin Response */}
                      {suggestion.adminResponse && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 text-green-700 text-sm font-medium mb-1">
                            <CheckCircle size={14} />
                            Management Response
                          </div>
                          <p className="text-green-600 text-sm">{suggestion.adminResponse}</p>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center gap-6 mt-4">
                        <button className="flex items-center gap-1 text-gray-500 hover:text-yellow-600 transition-colors">
                          <ThumbsUp size={16} />
                          <span className="text-sm font-medium">{suggestion.upvotes}</span>
                        </button>
                        <button className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors">
                          <MessageCircle size={16} />
                          <span className="text-sm font-medium">{suggestion.comments}</span>
                        </button>
                        <span className={`text-sm font-medium ml-auto ${priorityColors[suggestion.priority]}`}>
                          {suggestion.priority} PRIORITY
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* New Suggestion Modal */}
      {showNewSuggestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full m-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Submit a Suggestion</h2>
              <button onClick={() => setShowNewSuggestion(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input 
                  type="text" 
                  placeholder="Brief summary of your suggestion"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500">
                    <option>Menu</option>
                    <option>Operations</option>
                    <option>Efficiency</option>
                    <option>Morale</option>
                    <option>Cleanliness</option>
                    <option>Safety</option>
                    <option>Customer Service</option>
                    <option>General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  rows={4}
                  placeholder="Describe your suggestion in detail..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  onClick={() => setShowNewSuggestion(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium flex items-center gap-2">
                  <Send size={18} />
                  Submit Suggestion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffSuggestions;
