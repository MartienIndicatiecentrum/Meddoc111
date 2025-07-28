import React from 'react';
import { Bell, Home as HomeIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => (
  <header className="h-16 flex items-center justify-between bg-white border-b px-6">
    <div className="flex items-center gap-4">
      <Link to="/" className="flex items-center px-3 py-1.5 rounded-full border border-black hover:bg-gray-100 transition shadow-sm">
        <HomeIcon className="w-4 h-4 mr-1.5 text-gray-700" />
        <span className="text-sm text-gray-900 font-medium">Home</span>
      </Link>
      {/* Breadcrumbs kunnen hier */}
      <span className="font-semibold text-primary-700">Dashboard</span>
    </div>
    <div className="flex items-center gap-4">
      {/* SearchBar component kan hier */}
      <button className="relative">
        <Bell className="w-5 h-5" />
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>
      </button>
      {/* UserMenu component kan hier */}
      <div className="flex items-center gap-2 cursor-pointer">
        <img src="/api/placeholder/32/32" alt="User avatar" className="w-8 h-8 rounded-full border" />
        <span className="text-gray-700 font-medium">Sarah</span>
      </div>
    </div>
  </header>
);

export default Header;
