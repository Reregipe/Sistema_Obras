import { DashboardContent } from "@/components/Dashboard";
import { DashboardCharts } from "@/components/charts/DashboardCharts";

const Index = () => {
  return (
    <div className="space-y-6">
      <DashboardContent />
      <div className="container mx-auto px-6 pb-8">
        <DashboardCharts />
      </div>
    </div>
  );
};

export default Index;
