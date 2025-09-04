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
  Home,
  PieChart,
  Eye
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
      { name: '競爭分析', href: '/competitors', icon: PieChart },
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
      <div className="fixed left-0 top-0 w-64 h-full bg-slate-800 border-r border-slate-700 block z-[100]" style={{
        position: 'fixed !important',
        left: '0 !important',
        top: '0 !important',
        width: '256px !important',
        height: '100vh !important',
        backgroundColor: '#1e293b !important',
        borderRight: '1px solid #334155 !important',
        zIndex: '2147483646 !important',
        display: 'block !important'
      }}>
        {/* TEST VISIBILITY INDICATOR */}
        <div className="force-visible-test" />
        <div className="absolute top-4 right-4 w-4 h-4 bg-red-500 rounded-full animate-pulse z-[200]" style={{
          position: 'absolute !important',
          top: '16px !important',
          right: '16px !important',
          width: '16px !important',
          height: '16px !important',
          backgroundColor: '#ef4444 !important',
          borderRadius: '50% !important',
          zIndex: '2147483647 !important',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite !important'
        }} />
        <SidebarContent currentPath={location.pathname} />
      </div>

      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-[100] w-64 bg-slate-800 border-r border-slate-700 transform transition-transform duration-300 ease-in-out lg:hidden",
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
    <div className="flex flex-col h-full p-5 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10 p-2">
        <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white text-xl">
          G
        </div>
        <div className="font-bold text-xl bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
          GEO Platform
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-8">
        {navItems.map((section) => (
          <div key={section.section} className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
              {section.section}
            </div>
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
                      "flex items-center gap-3 px-2 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-indigo-600/10 hover:translate-x-1 transition-all duration-300 group",
                      isActive && "bg-indigo-600/20 text-white border-l-3 border-indigo-500 pl-4"
                    )}
                  >
                    <Icon 
                      className={cn(
                        "w-5 h-5 opacity-80 transition-all duration-200",
                        isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-white"
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
      <div className="pt-4 border-t border-slate-700">
        <div className="text-xs text-slate-500 px-2">
          Version 1.0.0
        </div>
      </div>
    </div>
  )
}

export default Sidebar