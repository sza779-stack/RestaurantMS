import React from 'react';
import { 
  Pizza, Phone, MapPin, Clock, Mail, Instagram, Twitter, Facebook,
  Heart
} from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-slate-950 text-white overflow-hidden glass-panel border-t-0">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
      </div>

      {/* Top Border Gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl blur-lg opacity-50 animate-pulse-glow" />
                <div className="relative w-10 h-10 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-xl flex items-center justify-center">
                  <Pizza className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <span className="text-lg font-bold premium-text neon-glow">
                  Future Pizza
                </span>
                <p className="text-[10px] text-cyan-400 -mt-1 font-mono tracking-widest uppercase">Next Gen Dining</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Experience the future of pizza delivery. Hand-crafted with premium ingredients, 
              delivered with cutting-edge technology.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-3">
              {[
                { icon: Facebook, label: 'Facebook' },
                { icon: Instagram, label: 'Instagram' },
                { icon: Twitter, label: 'Twitter' },
              ].map((social) => (
                <button
                  key={social.label}
                  className="group relative w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden transition-all hover:bg-white/10"
                  aria-label={social.label}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <social.icon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-6">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {[
                { label: 'Full Menu', view: 'menu' },
                { label: 'Build Your Own', view: 'menu' },
                { label: 'Rewards Program', view: 'rewards' },
                { label: 'Track Order', view: 'orders' },
                { label: 'My Account', view: 'account' },
              ].map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => onNavigate(link.view)}
                    className="text-gray-400 hover:text-cyan-400 transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-cyan-400 transition-colors" />
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Menu Categories */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-6">
              Menu
            </h3>
            <ul className="space-y-3">
              {['Signature Pizzas', 'Custom Pizza Builder', 'Fresh Pasta', 'Gourmet Subs', 'Chicken Wings', 'Sides & More', 'Desserts', 'Beverages'].map((item) => (
                <li key={item}>
                  <button
                    onClick={() => onNavigate('menu')}
                    className="text-gray-400 hover:text-cyan-400 transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-cyan-400 transition-colors" />
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-6">
              Contact Us
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">(555) 123-4567</p>
                  <p className="text-gray-500 text-xs">24/7 Order Line</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">hello@futurepizza.com</p>
                  <p className="text-gray-500 text-xs">Support Email</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 bg-pink-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-pink-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">7060 Oakland Mills Rd</p>
                  <p className="text-gray-500 text-xs">Columbia, MD 21046</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">10:00 AM - 11:00 PM</p>
                  <p className="text-gray-500 text-xs">Open Daily</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {currentYear} Future Pizza. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <button className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
              Privacy Policy
            </button>
            <button className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
              Terms of Service
            </button>
            <button className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
              Cookie Settings
            </button>
          </div>
          <p className="text-gray-600 text-sm flex items-center gap-1">
            Made with <Heart className="w-4 h-4 text-red-500 fill-current" /> for pizza lovers
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
