import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Globe, 
  BarChart3, 
  Brain,
  Settings
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const bottomNavItems: NavItem[] = [
  { id: "tracking", label: "掃描", icon: Globe, path: "/" },
  { id: "dashboard", label: "儀表板", icon: LayoutDashboard, path: "/dashboard" },
  { id: "ai-search", label: "AI追蹤", icon: Brain, path: "/ai-search" },
  { id: "analytics", label: "分析", icon: BarChart3, path: "/analytics" },
  { id: "settings", label: "設定", icon: Settings, path: "/settings" },
];

export const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveItem = () => {
    const currentItem = bottomNavItems.find(item => item.path === location.pathname);
    return currentItem?.id || "tracking";
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 bg-background border-t border-border">
      <div className="grid grid-cols-5 h-16">
        {bottomNavItems.map((item) => {
          const isActive = getActiveItem() === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center space-y-1",
                "transition-all duration-200 hover:bg-accent/50",
                "active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset",
                isActive && "text-primary"
              )}
              aria-label={item.label}
            >
              <div className={cn(
                "relative p-1.5 rounded-lg transition-all duration-200",
                isActive && "bg-primary/10"
              )}>
                <item.icon className={cn(
                  "h-5 w-5 transition-all duration-200",
                  isActive ? "text-primary scale-110" : "text-muted-foreground"
                )} />
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
                )}
              </div>
              <span className={cn(
                "text-xs font-medium truncate max-w-[60px]",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Safe area for devices with home indicators */}
      <div className="h-safe-area-inset-bottom bg-background" />
    </div>
  );
};