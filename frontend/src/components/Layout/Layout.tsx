import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import Sidebar from './Sidebar'
import Header from './Header'
import LoadingBar from '../UI/LoadingBar'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { loading } = useSelector((state: RootState) => state.ui)

  return (
    <div className="fixed inset-0 bg-slate-900 font-sans z-[999999]" style={{
      position: 'fixed !important',
      top: '0 !important',
      left: '0 !important',
      width: '100vw !important',
      height: '100vh !important',
      zIndex: '2147483647 !important',
      overflow: 'auto !important',
      backgroundColor: '#0f172a !important'
    }}>
      {loading && <LoadingBar isLoading={true} />}
      
      {/* Sidebar - Fixed */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Header - Fixed */}
      <Header onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Main Content */}
      <main className="ml-64 pt-20 min-h-screen">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform duration-200 hover:shadow-xl hover:shadow-indigo-500/25">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default Layout