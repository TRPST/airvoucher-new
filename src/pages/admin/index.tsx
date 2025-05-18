import { useEffect, useState, useMemo } from "react";
import { Activity, DollarSign, Store, Users, AlertCircle } from "lucide-react";

import { StatsTile } from "@/components/ui/stats-tile";
import { ChartPlaceholder } from "@/components/ui/chart-placeholder";
import useRequireRole from "@/hooks/useRequireRole";
import {
  fetchRetailers,
  fetchSalesReport,
  fetchEarningsSummary,
  fetchInventoryReport,
  type Retailer,
  type SalesReport,
  type EarningsSummary,
  type InventoryReport,
} from "@/actions/adminActions";
import { fetchAgents, type Agent } from "@/actions/admin/userActions";

export default function AdminDashboard() {
  // State for dashboard data
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [todaySales, setTodaySales] = useState<SalesReport[]>([]);
  const [recentSales, setRecentSales] = useState<SalesReport[]>([]);
  const [earningsSummary, setEarningsSummary] = useState<EarningsSummary[]>([]);
  const [inventoryReport, setInventoryReport] = useState<InventoryReport[]>([]);
  const [platformCommission, setPlatformCommission] = useState(0);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Protect this route - only allow admin role
  const { isLoading: isAuthLoading } = useRequireRole("admin");

  // Fetch dashboard data
  useEffect(() => {
    async function loadDashboardData() {
      setIsDataLoading(true);
      try {
        console.log("Loading admin dashboard data...");

        // Get retailers
        const { data: retailersData, error: retailersError } =
          await fetchRetailers();
        if (retailersError) {
          throw new Error(
            `Error fetching retailers: ${retailersError.message}`
          );
        }

        // Get agents
        const { data: agentsData, error: agentsError } = await fetchAgents();
        if (agentsError) {
          throw new Error(`Error fetching agents: ${agentsError.message}`);
        }

        // Get today's sales
        const today = new Date().toISOString().split("T")[0];
        const { data: todaySalesData, error: todaySalesError } =
          await fetchSalesReport({
            startDate: today,
            endDate: new Date().toISOString(),
          });
        if (todaySalesError) {
          throw new Error(
            `Error fetching today's sales: ${todaySalesError.message}`
          );
        }

        // Get recent sales (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { data: recentSalesData, error: recentSalesError } =
          await fetchSalesReport({
            startDate: thirtyDaysAgo.toISOString().split("T")[0],
            endDate: new Date().toISOString(),
          });
        if (recentSalesError) {
          throw new Error(
            `Error fetching recent sales: ${recentSalesError.message}`
          );
        }

        // Get earnings summary
        const { data: earningsData, error: earningsError } =
          await fetchEarningsSummary({
            startDate: today,
            endDate: new Date().toISOString(),
          });
        if (earningsError) {
          throw new Error(`Error fetching earnings: ${earningsError.message}`);
        }

        // Get inventory report
        const { data: inventoryData, error: inventoryError } =
          await fetchInventoryReport();
        if (inventoryError) {
          throw new Error(
            `Error fetching inventory: ${inventoryError.message}`
          );
        }

        // Update state with fetched data
        setRetailers(retailersData || []);
        setAgents(agentsData || []);
        setTodaySales(todaySalesData || []);
        setRecentSales(recentSalesData || []);
        setEarningsSummary(earningsData || []);
        setInventoryReport(inventoryData || []);

        // Calculate platform commission
        const commission =
          earningsData?.reduce(
            (sum, item) => sum + item.platform_commission,
            0
          ) || 0;
        setPlatformCommission(commission);

        console.log("Dashboard data loaded successfully");
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setIsDataLoading(false);
      }
    }

    if (!isAuthLoading) {
      loadDashboardData();
    }
  }, [isAuthLoading]);

  // Show loading state while checking authentication
  if (isAuthLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="ml-2">Loading authentication...</span>
      </div>
    );
  }

  // Show loading state while fetching data
  if (isDataLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="ml-2">Loading dashboard data...</span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center text-red-500">
        <AlertCircle className="h-12 w-12 mb-4" />
        <h2 className="text-xl font-bold">Error Loading Dashboard</h2>
        <p>{error}</p>
      </div>
    );
  }

  // Calculate dashboard metrics
  const todaySalesTotal = useMemo(() => {
    return todaySales.reduce((sum, sale) => sum + sale.amount, 0);
  }, [todaySales]);

  const activeRetailers = useMemo(() => {
    return retailers.filter((retailer) => retailer.status === "active").length;
  }, [retailers]);

  // Get actual agent count from profiles table
  const agentsCount = useMemo(() => {
    return agents.length;
  }, [agents]);

  // Prepare data for sales chart
  const dailySalesData = useMemo(() => {
    // Group sales by date
    const salesByDate = recentSales.reduce((acc, sale) => {
      const date = sale.created_at.split("T")[0];
      if (!acc[date]) {
        acc[date] = { date, total: 0, count: 0 };
      }
      acc[date].total += sale.amount;
      acc[date].count += 1;
      return acc;
    }, {} as Record<string, { date: string; total: number; count: number }>);

    // Convert to array and sort by date
    return Object.values(salesByDate).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [recentSales]);

  // Prepare data for voucher type chart
  const voucherTypeData = useMemo(() => {
    return earningsSummary.map((item) => ({
      type: item.voucher_type,
      sales: item.total_amount,
      count: item.total_sales,
    }));
  }, [earningsSummary]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome to your Air Voucher admin dashboard.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsTile
          label="Today's Sales"
          value={`R ${todaySalesTotal.toFixed(2)}`}
          icon={Activity}
          intent="primary"
          subtitle={`${todaySales.length} transactions`}
        />
        <StatsTile
          label="Airvoucher Commission"
          value={`R ${platformCommission.toFixed(2)}`}
          icon={DollarSign}
          intent="success"
          subtitle="From today's sales"
        />
        <StatsTile
          label="Active Retailers"
          value={activeRetailers}
          icon={Store}
          intent="info"
          subtitle={`${retailers.length} total retailers`}
        />
        <StatsTile
          label="Agents"
          value={agentsCount}
          icon={Users}
          intent="warning"
          subtitle="Total agents assigned"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ChartPlaceholder
          title="Sales Over Time"
          description="Daily sales trend for the past 30 days"
          data={dailySalesData}
          dataKey="total"
          labelKey="date"
          valuePrefix="R "
        />
        <ChartPlaceholder
          title="Sales by Voucher Type"
          description="Distribution of sales by voucher category"
          data={voucherTypeData}
          dataKey="sales"
          labelKey="type"
          valuePrefix="R "
        />
      </div>
    </div>
  );
}
