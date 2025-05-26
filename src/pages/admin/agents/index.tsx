import * as React from "react";
import { Users, MoreHorizontal, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

import { TablePlaceholder } from "@/components/ui/table-placeholder";
import { cn } from "@/utils/cn";
import {
  fetchAllAgents,
  type Agent,
} from "@/actions";
import useRequireRole from "@/hooks/useRequireRole";

export default function AdminAgents() {
  // Protect this route - only allow admin role
  const { isLoading: isRoleLoading } = useRequireRole("admin");

  // States for data
  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Load agents data
  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch agents
        const { data: agentsData, error: agentsError } = await fetchAllAgents();

        if (agentsError) {
          setError(`Failed to load agents: ${agentsError.message}`);
          return;
        }

        setAgents(agentsData || []);
      } catch (err) {
        setError(
          `Unexpected error: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (!isRoleLoading) {
      loadData();
    }
  }, [isRoleLoading]);

  // Show loading state while checking authentication
  if (isRoleLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="ml-2">Loading authentication...</span>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading agents...</span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center text-red-500">
        <AlertCircle className="h-12 w-12 mb-4" />
        <h2 className="text-xl font-bold">Error Loading Agents</h2>
        <p>{error}</p>
      </div>
    );
  }

  // Format data for the table
  const tableData = agents.map((agent) => {
    const row = {
      Name: (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <div className="font-medium">{agent.full_name}</div>
            <div className="text-xs text-muted-foreground">
              {agent.email}
            </div>
          </div>
        </div>
      ),
      "Retailers": agent.retailer_count,
      "MTD Sales": agent.mtd_sales,
      "MTD Commission": `R ${agent.mtd_commission.toFixed(2)}`,
      "YTD Commission": `R ${agent.ytd_commission.toFixed(2)}`,
      Status: (
        <div
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
            agent.status === "active"
              ? "bg-green-500/10 text-green-500"
              : "bg-amber-500/10 text-amber-500"
          )}
        >
          {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
        </div>
      ),
    };

    // Wrap each row in a Link component
    return Object.entries(row).reduce((acc, [key, value]) => {
      acc[key] = (
        <Link
          href={`/admin/agents/${agent.id}`}
          className="cursor-pointer"
          style={{ display: "block" }}
        >
          {value}
        </Link>
      );
      return acc;
    }, {} as Record<string, React.ReactNode>);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Agents
          </h1>
          <p className="text-muted-foreground">
            Manage sales agents and their performance.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="text-muted-foreground">Total Agents</div>
          <div className="mt-1 text-2xl font-semibold">{agents.length}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="text-muted-foreground">Active Agents</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">
            {agents.filter((a) => a.status === "active").length}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="text-muted-foreground">Total Retailers Managed</div>
          <div className="mt-1 text-2xl font-semibold">
            {agents.reduce((sum, a) => sum + a.retailer_count, 0)}
          </div>
        </div>
      </div>

      <TablePlaceholder
        columns={["Name", "Retailers", "MTD Sales", "MTD Commission", "YTD Commission", "Status"]}
        data={tableData}
        rowsClickable={true}
        emptyMessage="No agents found."
      />
    </div>
  );
} 