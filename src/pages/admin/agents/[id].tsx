import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ChevronLeft, Users, Store, TrendingUp, Calendar } from "lucide-react";

import { TablePlaceholder } from "@/components/ui/table-placeholder";
import { cn } from "@/utils/cn";
import {
  fetchAgentById,
  fetchAgentRetailers,
  type Agent,
} from "@/actions";
import useRequireRole from "@/hooks/useRequireRole";

export default function AgentDetails() {
  const router = useRouter();
  const { id } = router.query;

  // State for data and loading
  const [agent, setAgent] = useState<Agent | null>(null);
  const [retailers, setRetailers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Protect this route - only allow admin role
  const { isLoading: isAuthLoading } = useRequireRole("admin");

  // Load agent data
  useEffect(() => {
    async function loadAgentData() {
      if (typeof id !== "string") return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch agent info
        const { data: agentData, error: agentError } = await fetchAgentById(id);

        if (agentError) {
          throw new Error(`Failed to load agent: ${agentError.message}`);
        }

        if (!agentData) {
          throw new Error("Agent not found");
        }

        setAgent(agentData);

        // Fetch assigned retailers
        const { data: retailersData, error: retailersError } = await fetchAgentRetailers(id);

        if (retailersError) {
          console.error("Error loading retailers:", retailersError);
        } else {
          setRetailers(retailersData || []);
        }
      } catch (err) {
        console.error("Error in agent details:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load agent data"
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (!isAuthLoading) {
      loadAgentData();
    }
  }, [id, isAuthLoading]);

  // Show loading state while checking authentication
  if (isAuthLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="ml-2">Loading authentication...</span>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="ml-2">Loading agent data...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center text-red-500">
        <div className="h-12 w-12 mb-4" />
        <h2 className="text-xl font-bold">Error Loading Agent</h2>
        <p>{error}</p>
      </div>
    );
  }

  // Not found state
  if (!agent) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="rounded-lg border border-border bg-card p-8 text-center shadow-sm">
          <Users className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">Agent Not Found</h2>
          <p className="mb-4 text-muted-foreground">
            The agent you are looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push("/admin/agents")}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            Back to Agents
          </button>
        </div>
      </div>
    );
  }

  // Format retailers data for table
  const retailersTableData = retailers.map((retailer) => ({
    Name: (
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Store className="h-4 w-4" />
        </div>
        <div>
          <div className="font-medium">{retailer.name}</div>
          <div className="text-xs text-muted-foreground">
            {retailer.email}
          </div>
        </div>
      </div>
    ),
    Location: retailer.location || "N/A",
    Balance: `R ${retailer.balance.toFixed(2)}`,
    "Commission Balance": `R ${retailer.commission_balance.toFixed(2)}`,
    Status: (
      <div
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          retailer.status === "active"
            ? "bg-green-500/10 text-green-500"
            : retailer.status === "inactive"
            ? "bg-amber-500/10 text-amber-500"
            : "bg-destructive/10 text-destructive"
        )}
      >
        {retailer.status.charAt(0).toUpperCase() + retailer.status.slice(1)}
      </div>
    ),
  }));

  return (
    <div className="space-y-6">
      <Link href="/admin/agents">
        <button className="inline-flex items-center text-sm font-medium hover:text-primary transition-colors group">
          <ChevronLeft className="mr-2 h-5 w-5 transition-transform duration-200 transform group-hover:-translate-x-1" />
          Back to agents
        </button>
      </Link>
      
      <div style={{ marginTop: 10 }}>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Agent Details
        </h1>
        <p className="text-muted-foreground">
          View and manage agent information and performance.
        </p>
      </div>

      {/* Agent Profile Card */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{agent.full_name}</h2>
              <p className="text-muted-foreground">{agent.email}</p>
              {agent.phone && (
                <p className="text-sm text-muted-foreground">{agent.phone}</p>
              )}
            </div>
          </div>
          <div
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
              agent.status === "active"
                ? "bg-green-500/10 text-green-500"
                : "bg-amber-500/10 text-amber-500"
            )}
          >
            {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-muted-foreground" />
            <div className="text-muted-foreground">Retailers</div>
          </div>
          <div className="mt-1 text-2xl font-semibold">{agent.retailer_count}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <div className="text-muted-foreground">MTD Sales</div>
          </div>
          <div className="mt-1 text-2xl font-semibold">{agent.mtd_sales}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div className="text-muted-foreground">MTD Commission</div>
          </div>
          <div className="mt-1 text-2xl font-semibold text-green-600">
            R {agent.mtd_commission.toFixed(2)}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <div className="text-muted-foreground">YTD Commission</div>
          </div>
          <div className="mt-1 text-2xl font-semibold text-blue-600">
            R {agent.ytd_commission.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Assigned Retailers Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Assigned Retailers</h3>
          <div className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
            {retailers.length} retailers
          </div>
        </div>

        <TablePlaceholder
          columns={["Name", "Location", "Balance", "Commission Balance", "Status"]}
          data={retailersTableData}
          emptyMessage="No retailers assigned to this agent"
        />
      </div>
    </div>
  );
} 