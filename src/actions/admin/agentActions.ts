import { createClient } from "@/utils/supabase/client";
import { Agent, ResponseType } from "../types/adminTypes";

/**
 * Fetch all agents with their profile and performance information
 */
export async function fetchAgents(): Promise<ResponseType<Agent[]>> {
  const supabase = createClient();
  try {
    // Step 1: Fetch all profiles with agent role
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        phone,
        avatar_url,
        created_at,
        updated_at
      `)
      .eq("role", "agent")
      .order("full_name");

    if (profilesError) {
      return { data: null, error: profilesError };
    }

    if (!profiles || profiles.length === 0) {
      return { data: [], error: null };
    }

    // Step 2: For each agent, calculate performance metrics
    const agentIds = profiles.map(p => p.id);
    
    // Get retailer counts
    const { data: retailerCounts, error: retailerError } = await supabase
      .from("retailers")
      .select("agent_profile_id", { count: "exact" })
      .in("agent_profile_id", agentIds);

    if (retailerError) {
      console.warn("Error fetching retailer counts:", retailerError);
    }

    // Group retailer counts by agent
    const retailerCountMap = new Map<string, number>();
    if (retailerCounts) {
      agentIds.forEach(agentId => {
        const count = retailerCounts.filter(r => r.agent_profile_id === agentId).length;
        retailerCountMap.set(agentId, count);
      });
    }

    // Get current date ranges for performance calculations
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

    // Get sales data for performance metrics
    const { data: salesData, error: salesError } = await supabase
      .from("sales")
      .select(`
        id,
        created_at,
        agent_commission,
        terminals!inner(
          retailer_id,
          retailers!inner(agent_profile_id)
        )
      `)
      .gte("created_at", firstDayOfYear);

    if (salesError) {
      console.warn("Error fetching sales data:", salesError);
    }

    // Calculate performance metrics for each agent
    const agents: Agent[] = profiles.map(profile => {
      const agentSales = salesData?.filter((sale: any) => 
        sale.terminals?.retailers?.agent_profile_id === profile.id
      ) || [];

      const mtdSales = agentSales.filter((sale: any) => 
        new Date(sale.created_at) >= new Date(firstDayOfMonth)
      );

      const mtdSalesCount = mtdSales.length;
      const mtdCommission = mtdSales.reduce((sum: number, sale: any) => 
        sum + (sale.agent_commission || 0), 0
      );

      const ytdCommission = agentSales.reduce((sum: number, sale: any) => 
        sum + (sale.agent_commission || 0), 0
      );

      // Determine status based on recent activity
      const hasRecentSales = agentSales.some((sale: any) => {
        const saleDate = new Date(sale.created_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return saleDate >= thirtyDaysAgo;
      });

      const hasActiveRetailers = retailerCountMap.get(profile.id) || 0 > 0;
      const status = (hasActiveRetailers && hasRecentSales) ? "active" : "inactive";

      return {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        status,
        retailer_count: retailerCountMap.get(profile.id) || 0,
        mtd_sales: mtdSalesCount,
        mtd_commission: mtdCommission,
        ytd_commission: ytdCommission,
        total_commission_earned: ytdCommission, // For now, use YTD as total
      };
    });

    return { data: agents, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Fetch a specific agent by ID with detailed information
 */
export async function fetchAgentById(agentId: string): Promise<ResponseType<Agent>> {
  const supabase = createClient();
  try {
    // First get the agent profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        phone,
        avatar_url,
        created_at,
        updated_at
      `)
      .eq("id", agentId)
      .eq("role", "agent")
      .single();

    if (profileError) {
      return { data: null, error: profileError };
    }

    if (!profile) {
      return { data: null, error: new Error("Agent not found") };
    }

    // Get retailer count
    const { data: retailerCount, error: retailerError } = await supabase
      .from("retailers")
      .select("id", { count: "exact" })
      .eq("agent_profile_id", agentId);

    if (retailerError) {
      console.warn("Error fetching retailer count:", retailerError);
    }

    // Get performance metrics
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

    // Get sales data for this agent
    const { data: salesData, error: salesError } = await supabase
      .from("sales")
      .select(`
        id,
        created_at,
        agent_commission,
        terminals!inner(
          retailer_id,
          retailers!inner(agent_profile_id)
        )
      `)
      .eq("terminals.retailers.agent_profile_id", agentId)
      .gte("created_at", firstDayOfYear);

    if (salesError) {
      console.warn("Error fetching sales data:", salesError);
    }

    const agentSales = salesData || [];

    const mtdSales = agentSales.filter((sale: any) => 
      new Date(sale.created_at) >= new Date(firstDayOfMonth)
    );

    const mtdSalesCount = mtdSales.length;
    const mtdCommission = mtdSales.reduce((sum: number, sale: any) => 
      sum + (sale.agent_commission || 0), 0
    );

    const ytdCommission = agentSales.reduce((sum: number, sale: any) => 
      sum + (sale.agent_commission || 0), 0
    );

    // Determine status
    const hasRecentSales = agentSales.some((sale: any) => {
      const saleDate = new Date(sale.created_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return saleDate >= thirtyDaysAgo;
    });

    const hasActiveRetailers = (retailerCount?.length || 0) > 0;
    const status = (hasActiveRetailers && hasRecentSales) ? "active" : "inactive";

    const agent: Agent = {
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      status,
      retailer_count: retailerCount?.length || 0,
      mtd_sales: mtdSalesCount,
      mtd_commission: mtdCommission,
      ytd_commission: ytdCommission,
      total_commission_earned: ytdCommission,
    };

    return { data: agent, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Update agent profile information
 */
export async function updateAgent(
  agentId: string,
  updates: {
    full_name?: string;
    email?: string;
    phone?: string;
    avatar_url?: string;
  }
): Promise<ResponseType<{ id: string }>> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", agentId)
    .eq("role", "agent")
    .select("id")
    .single();

  return { data, error };
}

/**
 * Fetch retailers assigned to a specific agent
 */
export async function fetchAgentRetailers(agentId: string): Promise<ResponseType<any[]>> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("retailers")
      .select(`
        id,
        name,
        status,
        balance,
        commission_balance,
        location,
        profiles!retailers_user_profile_id_fkey(full_name, email)
      `)
      .eq("agent_profile_id", agentId)
      .order("name");

    if (error) {
      return { data: null, error };
    }

    // Transform the data to match expected format
    const retailers = data?.map(retailer => ({
      id: retailer.id,
      name: retailer.name,
      status: retailer.status,
      balance: retailer.balance || 0,
      commission_balance: retailer.commission_balance || 0,
      location: retailer.location,
      contact_name: retailer.profiles?.[0]?.full_name || "",
      email: retailer.profiles?.[0]?.email || "",
    })) || [];

    return { data: retailers, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
} 