import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { MetricsGrid } from "@/components/dashboard/MetricsGrid";
import { ChartSection } from "@/components/dashboard/ChartSection";
import { TabsSection } from "@/components/dashboard/TabsSection";

const Index = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Metrics Grid */}
        <MetricsGrid />
        
        {/* Charts Section */}
        <ChartSection />
        
        {/* Tabs Section */}
        <TabsSection />
      </div>
    </DashboardLayout>
  );
};

export default Index;
