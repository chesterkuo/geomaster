import React from 'react'
import { Menu, Bell, User } from 'lucide-react'

interface HeaderProps {
  onSidebarToggle: () => void
}

const Header: React.FC<HeaderProps> = ({ onSidebarToggle }) => {
  return (
    <header className="bg-slate-800 border-b border-slate-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onSidebarToggle}
            className="lg:hidden p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-white">GEO Platform</h1>
        </div>

        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700">
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header