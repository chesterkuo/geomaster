import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Search, 
  FileText, 
  Target, 
  TrendingUp, 
  Hash, 
  FileBarChart, 
  Users, 
  Settings,
  Home
} from 'lucide-react'
import { cn } from '../../utils/cn'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const navItems = [
  {
    section: '主要功能',
    items: [
      { name: '儀表板', href: '/dashboard', icon: Home },
      { name: '網站掃描', href: '/scan', icon: Search },
      { name: '內容優化', href: '/optimize', icon: FileText },
      { name: 'AI 追蹤', href: '/tracking', icon: Target },
    ]
  },
  {
    section: '分析工具',
    items: [
      { name: '競爭分析', href: '/competitors', icon: TrendingUp },
      { name: '關鍵字研究', href: '/keywords', icon: Hash },
      { name: '報告中心', href: '/reports', icon: FileBarChart },
    ]
  },
  {
    section: '設定',
    items: [
      { name: '團隊管理', href: '/team', icon: Users },
      { name: '整合設定', href: '/settings', icon: Settings },
    ]
  }
]

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation()

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:flex lg:flex-shrink-0 lg:flex-col w-64 bg-slate-800 border-r border-slate-700"
      )}>
        <SidebarContent currentPath={location.pathname} />
      </div>

      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 bg-slate-800 border-r border-slate-700 transform transition-transform duration-300 ease-in-out lg:hidden",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent currentPath={location.pathname} onItemClick={onToggle} />
      </div>
    </>
  )
}

interface SidebarContentProps {
  currentPath: string
  onItemClick?: () => void
}

const SidebarContent: React.FC<SidebarContentProps> = ({ currentPath, onItemClick }) => {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 border-b border-slate-700">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-white text-xl">
          G
        </div>
        <div className="gradient-text font-bold text-xl">
          GEO Platform
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
        {navItems.map((section) => (
          <div key={section.section}>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              {section.section}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = currentPath === item.href

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={onItemClick}
                    className={cn(
                      "nav-item group",
                      isActive && "active"
                    )}
                  >
                    <Icon 
                      className={cn(
                        "w-5 h-5 transition-colors",
                        isActive ? "text-blue-400" : "text-slate-400 group-hover:text-white"
                      )}
                    />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <div className="text-xs text-slate-500">
          Version 1.0.0
        </div>
      </div>
    </div>
  )
}

export default Sidebar