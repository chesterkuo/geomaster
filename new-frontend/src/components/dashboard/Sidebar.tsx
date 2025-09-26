import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  ChevronRight,
  Bell
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

export const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Check if SEO features are enabled
  const enableSeoFeatures = import.meta.env.VITE_ENABLE_SEO_FEATURES === 'true';

  // Check if Alerts feature is enabled
  const enableAlerts = import.meta.env.VITE_ENABLE_ALERTS === 'true';

  const menuSections = [
    {
      title: t("nav.main.title"),
      items: [
        { id: "tracking", label: t("nav.main.tracking"), icon: Globe, path: "/" },
        { id: "dashboard", label: t("nav.main.dashboard"), icon: LayoutDashboard, path: "/dashboard" },
        { id: "optimization", label: t("nav.main.optimization"), icon: BarChart3, path: "/optimization" },
        { id: "ai-search", label: t("nav.main.aiSearch"), icon: Brain, path: "/ai-search" },
      ]
    },
    // Only include SEO features if enabled
    ...(enableSeoFeatures ? [{
      title: t("nav.analytics.title"),
      items: [
        { id: "analytics", label: t("nav.analytics.analytics"), icon: BarChart3, path: "/analytics" },
        { id: "research", label: t("nav.analytics.research"), icon: Search, path: "/research" },
        { id: "reporting", label: t("nav.analytics.reporting"), icon: Map, path: "/reporting" },
      ]
  }] : []),
  {
    title: t("nav.management.title"),
    items: [
      { id: "team", label: t("nav.management.team"), icon: Users, path: "/team" },
      // Only include alerts if enabled
      ...(enableAlerts ? [{ id: "alerts", label: t("nav.management.alerts"), icon: Bell, path: "/alerts" }] : []),
      { id: "settings", label: t("nav.management.settings"), icon: Settings, path: "/settings" },
    ]
  }
  ];

  // Get all items for finding active item
  const allNavItems = menuSections.flatMap(section => section.items);
  
  const getActiveItem = () => {
    const currentItem = allNavItems.find(item => item.path === location.pathname);
    return currentItem?.id || "tracking";
  };

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
            <span className="text-foreground font-semibold text-lg">GEO Master</span>
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
      <nav className="p-2 space-y-4 flex-1 overflow-y-auto">
        {menuSections.map((section, sectionIndex) => (
          <div key={section.title}>
            <div className={cn(
              "text-xs font-medium text-muted-foreground mb-3 px-3",
              collapsed && "opacity-0"
            )}>
              {section.title}
            </div>
            
            <div className="space-y-1">
              {section.items.map((item) => (
                <Button
                  key={item.id}
                  variant={getActiveItem() === item.id ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start h-10 transition-all duration-200",
                    collapsed ? "px-2" : "px-3",
                    getActiveItem() === item.id && "bg-primary text-primary-foreground shadow-glow"
                  )}
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
                  {!collapsed && (
                    <span className="transition-all duration-300">{item.label}</span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 px-2">
        <div className={cn(
          "bg-gradient-card rounded-lg p-3 text-center border border-border",
          collapsed && "hidden"
        )}>
          <div className="text-sm font-medium text-foreground mb-1">{t('nav.upgrade.title')}</div>
          <div className="text-xs text-muted-foreground mb-2">{t('nav.upgrade.description')}</div>
          <Button size="sm" className="w-full bg-primary text-primary-foreground">
            {t('nav.upgrade.button')}
          </Button>
        </div>
      </div>
    </div>
  );
};