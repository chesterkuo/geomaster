import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { MetricsGrid } from "@/components/dashboard/MetricsGrid";
import { ChartSection } from "@/components/dashboard/ChartSection";
import { TabsSection } from "@/components/dashboard/TabsSection";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { AuthModal } from "@/components/auth/AuthModal";
import { BarChart3, Lock, User } from "lucide-react";

const Index = () => {
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Always show the layout components, but pass authentication state */}
        <MetricsGrid isAuthenticated={isAuthenticated} />
        
        <ChartSection isAuthenticated={isAuthenticated} />
        
        <TabsSection 
          isAuthenticated={isAuthenticated} 
          onShowAuth={() => setShowAuthModal(true)}
        />
      </div>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
        }}
      />
    </DashboardLayout>
  );
};

export default Index;
