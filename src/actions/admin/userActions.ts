import supabase from "@/lib/supabaseClient";
import { ResponseType } from "../types/adminTypes";

export type Agent = {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  retailer_count: number;
};

/**
 * Fetch all users with role "agent"
 */
export async function fetchAgents(): Promise<ResponseType<Agent[]>> {
  try {
    // Query profiles with role="agent"
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, avatar_url")
      .eq("role", "agent");

    if (error) {
      console.error("Supabase error when fetching agents:", error);
      return { data: null, error };
    }

    // For each agent, count their retailers
    const agentsWithCounts = await Promise.all(
      data.map(async (agent) => {
        const { count, error: countError } = await supabase
          .from("retailers")
          .select("id", { count: "exact", head: true })
          .eq("agent_profile_id", agent.id);

        if (countError) {
          console.error(
            `Error counting retailers for agent ${agent.id}:`,
            countError
          );
        }

        return {
          id: agent.id,
          full_name: agent.full_name,
          email: agent.email,
          phone: agent.phone,
          avatar_url: agent.avatar_url,
          retailer_count: count || 0,
        };
      })
    );

    return { data: agentsWithCounts, error: null };
  } catch (err) {
    console.error("Unexpected error in fetchAgents:", err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Create a new user with the agent role
 */
export async function createAgent(
  email: string,
  fullName: string,
  password: string,
  phone?: string
): Promise<ResponseType<{ id: string }>> {
  try {
    // First, create the Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: "agent",
        },
      },
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      return { data: null, error: authError };
    }

    if (!authData.user) {
      return {
        data: null,
        error: new Error("Failed to create user in authentication system"),
      };
    }

    // Next, create the profile linked to the new user ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: authData.user.id,
        full_name: fullName,
        email,
        phone,
        role: "agent",
      })
      .select("id")
      .single();

    if (profileError) {
      console.error("Error creating agent profile:", profileError);
      return { data: null, error: profileError };
    }

    return { data: profile, error: null };
  } catch (error) {
    console.error("Unexpected error in createAgent:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
