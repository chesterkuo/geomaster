import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Search, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export const DashboardHeader = () => {
  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center justify-between h-full px-6">
        {/* Search */}
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜尋功能、關鍵字或報告..."
            className="pl-10 bg-background/50 border-border focus:border-primary transition-colors"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            className="relative p-2 h-9 w-9"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-geo-orange rounded-full text-xs flex items-center justify-center text-white">
              3
            </span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="p-2 h-9 w-9"
          >
            <Settings className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="flex items-center space-x-2 px-3 h-9"
          >
            <div className="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center">
              <User className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-medium">管理員</span>
          </Button>
        </div>
      </div>
    </header>
  );
};