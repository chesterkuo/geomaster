import { useState, useEffect } from "react";
import { MobileNavigation, MobileMenuButton } from "./MobileNavigation";
import { BottomNavigation } from "./BottomNavigation";
import { PullToRefresh } from "./PullToRefresh";
import { AuthModal } from "@/components/auth/AuthModal";
import { Button } from "@/components/ui/button";
import { Bell, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTouchGestures, useBreakpoint } from "@/hooks/useTouchGestures";

interface MobileDashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  showSearch?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const MobileDashboardLayout = ({ 
  children, 
  title = "GEO Platform",
  showSearch = true,
  onRefresh,
  isRefreshing = false
}: MobileDashboardLayoutProps) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { isMobile } = useBreakpoint();

  // Touch gestures for navigation
  const touchHandlers = useTouchGestures({
    onSwipeRight: () => {
      if (!mobileNavOpen) setMobileNavOpen(true);
    },
    onSwipeLeft: () => {
      if (mobileNavOpen) setMobileNavOpen(false);
    },
    onPullToRefresh: onRefresh
  });

  if (!isMobile) {
    // Return desktop layout for larger screens
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" {...touchHandlers}>
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Left side - Menu button */}
          <MobileMenuButton 
            onClick={() => setMobileNavOpen(true)}
            isOpen={mobileNavOpen}
          />
          
          {/* Center - Title */}
          <h1 className="font-semibold text-lg text-foreground truncate mx-4">
            {title}
          </h1>
          
          {/* Right side - Actions */}
          <div className="flex items-center space-x-2">
            {showSearch && (
              <Button variant="ghost" size="sm" className="w-9 h-9 p-0">
                <Search className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" className="w-9 h-9 p-0 relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-9 h-9 p-0"
              onClick={() => setShowAuthModal(true)}
            >
              <User className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative">
        {onRefresh && (
          <PullToRefresh onRefresh={onRefresh} isRefreshing={isRefreshing} />
        )}
        
        <div className="px-4 py-4 pb-20 min-h-full">
          {children}
        </div>
      </main>

      {/* Mobile Navigation Drawer */}
      <MobileNavigation 
        isOpen={mobileNavOpen}
        onToggle={setMobileNavOpen}
      />

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
    </div>
  );
};

// Mobile-optimized metric card
interface MobileMetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  onTap?: () => void;
}

export const MobileMetricCard = ({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon, 
  color, 
  onTap 
}: MobileMetricCardProps) => {
  const [isPressed, setIsPressed] = useState(false);

  const touchHandlers = useTouchGestures({
    onDoubleTap: onTap
  });

  return (
    <div
      className={cn(
        "relative bg-card border border-border rounded-xl p-4",
        "transition-all duration-200 active:scale-95",
        "hover:shadow-lg focus:ring-2 focus:ring-primary focus:ring-offset-2",
        isPressed && "scale-95 shadow-sm",
        onTap && "cursor-pointer"
      )}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onTouchCancel={() => setIsPressed(false)}
      onClick={onTap}
      {...touchHandlers}
    >
      {/* Icon and trend indicator */}
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          color
        )}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className={cn(
          "text-xs font-medium px-2 py-1 rounded-full",
          trend === "up" 
            ? "text-geo-green bg-geo-green/10" 
            : "text-destructive bg-destructive/10"
        )}>
          {change}
        </div>
      </div>
      
      {/* Content */}
      <div className="space-y-1">
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-sm text-muted-foreground line-clamp-1">{title}</div>
      </div>

      {/* Touch feedback overlay */}
      {isPressed && (
        <div className="absolute inset-0 bg-primary/5 rounded-xl pointer-events-none" />
      )}
    </div>
  );
};

// Mobile grid layout for metrics
export const MobileMetricsGrid = ({ 
  children 
}: { 
  children: React.ReactNode 
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      {children}
    </div>
  );
};