import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, Search, User, Settings, LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { authService } from "@/lib/api/auth";

interface DashboardHeaderProps {
  onShowAuth?: () => void;
}

export const DashboardHeader = ({ onShowAuth }: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const handleNotificationsClick = () => {
    toast("通知功能開發中...");
  };

  const handleSettingsClick = () => {
    navigate("/settings");
  };

  const handleProfileClick = () => {
    navigate("/team");
  };

  const handleLogout = async () => {
    try {
      // Clear local state first
      logout(); // Clear local auth state
      
      // Try to call server logout, but don't fail if it errors
      try {
        await authService.logout();
      } catch (error) {
        // Ignore server logout errors (token might be expired)
        console.warn("Server logout failed, but local logout successful:", error);
      }
      
      toast.success("已成功登出");
      
      // Small delay to ensure state updates
      setTimeout(() => {
        navigate("/"); // Redirect to home page
      }, 100);
      
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("登出失敗，請稍後再試");
    }
  };

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
            onClick={handleNotificationsClick}
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
            onClick={handleSettingsClick}
          >
            <Settings className="h-4 w-4" />
          </Button>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2 px-3 h-9"
                >
                  <div className="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center">
                    <User className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm font-medium">
                    {user?.fullName || user?.email || "使用者"}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm">
                  <div className="font-medium">{user?.fullName || "使用者"}</div>
                  <div className="text-muted-foreground">{user?.email}</div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleProfileClick}>
                  <User className="mr-2 h-4 w-4" />
                  個人檔案
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSettingsClick}>
                  <Settings className="mr-2 h-4 w-4" />
                  設定
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  登出
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2 px-3 h-9"
              onClick={onShowAuth}
            >
              <div className="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center">
                <User className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm font-medium">訪客</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};