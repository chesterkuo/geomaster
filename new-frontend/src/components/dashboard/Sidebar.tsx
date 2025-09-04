import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Globe, 
  BarChart3, 
  Search, 
  Settings, 
  Users, 
  Map,
  Brain,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "儀表板", icon: LayoutDashboard, active: true },
  { id: "tracking", label: "網站追蹤", icon: Globe },
  { id: "optimization", label: "內容優化", icon: BarChart3 },
  { id: "ai-search", label: "AI 搜尋", icon: Brain },
  { id: "analytics", label: "數據分析", icon: BarChart3 },
  { id: "research", label: "關鍵字研究", icon: Search },
  { id: "reporting", label: "報告中心", icon: Map },
  { id: "team", label: "團隊管理", icon: Users },
  { id: "settings", label: "系統設定", icon: Settings },
];

export const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const [activeItem, setActiveItem] = useState("dashboard");

  return (
    <div className={cn(
      "fixed left-0 top-0 h-full bg-card border-r border-border transition-all duration-300 z-50",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className={cn(
          "flex items-center space-x-3 transition-all duration-300",
          collapsed && "opacity-0"
        )}>
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">G</span>
          </div>
          {!collapsed && (
            <span className="text-foreground font-semibold text-lg">GEO Platform</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="p-1 h-8 w-8"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="p-2 space-y-1">
        <div className={cn(
          "text-xs font-medium text-muted-foreground mb-3 px-3",
          collapsed && "opacity-0"
        )}>
          主要功能
        </div>
        
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant={activeItem === item.id ? "default" : "ghost"}
            className={cn(
              "w-full justify-start h-10 transition-all duration-200",
              collapsed ? "px-2" : "px-3",
              activeItem === item.id && "bg-primary text-primary-foreground shadow-glow"
            )}
            onClick={() => setActiveItem(item.id)}
          >
            <item.icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
            {!collapsed && (
              <span className="transition-all duration-300">{item.label}</span>
            )}
          </Button>
        ))}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 px-2">
        <div className={cn(
          "bg-gradient-card rounded-lg p-3 text-center border border-border",
          collapsed && "hidden"
        )}>
          <div className="text-sm font-medium text-foreground mb-1">升級方案</div>
          <div className="text-xs text-muted-foreground mb-2">解鎖更多功能</div>
          <Button size="sm" className="w-full bg-primary text-primary-foreground">
            立即升級
          </Button>
        </div>
      </div>
    </div>
  );
};