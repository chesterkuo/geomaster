import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Menu,
  X,
  LayoutDashboard, 
  Globe, 
  BarChart3, 
  Search, 
  Settings, 
  Users, 
  Map,
  Brain,
  ChevronRight,
  Home
} from "lucide-react";

interface MobileNavigationProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: string;
}

const menuSections = [
  {
    title: "主要功能",
    items: [
      { id: "tracking", label: "網站掃描", icon: Globe, path: "/" },
      { id: "dashboard", label: "儀表板", icon: LayoutDashboard, path: "/dashboard" },
      { id: "optimization", label: "內容優化", icon: BarChart3, path: "/optimization" },
      { id: "ai-search", label: "AI 可見度追蹤", icon: Brain, path: "/ai-search", badge: "新功能" },
    ]
  },
  {
    title: "分析工具", 
    items: [
      { id: "analytics", label: "競爭分析", icon: BarChart3, path: "/analytics" },
      { id: "research", label: "關鍵字研究", icon: Search, path: "/research" },
      { id: "reporting", label: "報告中心", icon: Map, path: "/reporting" },
    ]
  },
  {
    title: "設定功能",
    items: [
      { id: "team", label: "團隊管理", icon: Users, path: "/team" },
      { id: "settings", label: "系統設定", icon: Settings, path: "/settings" },
    ]
  }
];

const allNavItems = menuSections.flatMap(section => section.items);

export const MobileNavigation = ({ isOpen, onToggle }: MobileNavigationProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveItem = () => {
    const currentItem = allNavItems.find(item => item.path === location.pathname);
    return currentItem?.id || "tracking";
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    onToggle(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onToggle}>
      <SheetContent 
        side="left" 
        className="w-[300px] sm:w-[350px] p-0 bg-background border-border"
      >
        {/* Header */}
        <SheetHeader className="p-4 border-b border-border bg-gradient-card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">G</span>
            </div>
            <div>
              <SheetTitle className="text-foreground font-semibold text-xl">
                GEO Master
              </SheetTitle>
              <p className="text-xs text-muted-foreground">行動版介面</p>
            </div>
          </div>
        </SheetHeader>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menuSections.map((section, sectionIndex) => (
            <div key={section.title} className="mb-6">
              <div className="text-xs font-medium text-muted-foreground mb-3 px-4">
                {section.title}
              </div>
              
              <div className="space-y-1 px-2">
                {section.items.map((item) => (
                  <Button
                    key={item.id}
                    variant={getActiveItem() === item.id ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start h-12 px-4 text-left font-medium",
                      "transition-all duration-200 rounded-lg",
                      getActiveItem() === item.id && "bg-primary text-primary-foreground shadow-glow"
                    )}
                    onClick={() => handleNavigation(item.path)}
                  >
                    <item.icon className="h-5 w-5 mr-4 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="text-xs bg-geo-orange text-white px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 ml-2 opacity-50" />
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-gradient-card">
          <div className="bg-gradient-to-r from-geo-purple to-geo-blue rounded-lg p-4 text-center">
            <div className="text-sm font-medium text-white mb-1">升級方案</div>
            <div className="text-xs text-white/80 mb-3">解鎖更多功能和分析工具</div>
            <Button size="sm" className="w-full bg-white text-gray-900 hover:bg-gray-100">
              立即升級
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Hamburger Menu Button Component
interface MobileMenuButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export const MobileMenuButton = ({ onClick, isOpen }: MobileMenuButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        "relative w-10 h-10 p-0 md:hidden",
        "hover:bg-accent/50 transition-all duration-200",
        "focus:ring-2 focus:ring-primary focus:ring-offset-2"
      )}
      aria-label="開啟選單"
    >
      <div className="flex flex-col items-center justify-center space-y-1">
        <span 
          className={cn(
            "block w-5 h-0.5 bg-foreground transition-all duration-300",
            isOpen && "rotate-45 translate-y-1.5"
          )} 
        />
        <span 
          className={cn(
            "block w-5 h-0.5 bg-foreground transition-all duration-300",
            isOpen && "opacity-0"
          )} 
        />
        <span 
          className={cn(
            "block w-5 h-0.5 bg-foreground transition-all duration-300",
            isOpen && "-rotate-45 -translate-y-1.5"
          )} 
        />
      </div>
    </Button>
  );
};