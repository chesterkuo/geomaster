import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { DashboardHeader } from "./DashboardHeader";
import { AuthModal } from "@/components/auth/AuthModal";
import { MobileDashboardLayout, useBreakpoint } from "@/components/mobile";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { isMobile } = useBreakpoint();

  // Use mobile layout for mobile devices
  if (isMobile) {
    return (
      <MobileDashboardLayout 
        title="GEO Master"
        onRefresh={() => window.location.reload()}
      >
        {children}
      </MobileDashboardLayout>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      <main className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        sidebarCollapsed ? "ml-16" : "ml-64"
      )}>
        <DashboardHeader onShowAuth={() => setShowAuthModal(true)} />
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
        }}
      />
    </div>
  );
};