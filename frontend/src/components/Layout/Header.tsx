import React from 'react'
import { Menu, Bell, User, Search } from 'lucide-react'

interface HeaderProps {
  onSidebarToggle: () => void
}

const Header: React.FC<HeaderProps> = ({ onSidebarToggle }) => {
  return (
    <header className="fixed top-0 left-64 right-0 h-20 bg-slate-800 border-b border-slate-700 px-6 lg:px-8 z-[90]">
      <div className="flex items-center justify-between h-full">
        {/* Left side - Mobile menu + Search */}
        <div className="flex items-center flex-1">
          <button
            onClick={onSidebarToggle}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 mr-4"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search Bar */}
          <div className="hidden md:flex items-center bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 max-w-md w-full">
            <Search className="w-5 h-5 text-slate-400 mr-3" />
            <input
              type="text"
              placeholder="搜尋頁面、關鍵字或報告..."
              className="bg-transparent border-none outline-none text-slate-300 placeholder-slate-400 flex-1"
            />
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-indigo-600 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
              3
            </span>
          </div>

          {/* User Menu */}
          <button className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-indigo-600 transition-colors">
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header