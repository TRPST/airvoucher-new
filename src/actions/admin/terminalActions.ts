import supabase from "@/lib/supabaseClient";
import { Terminal, ResponseType } from "../types/adminTypes";

/**
 * Fetch terminals for a specific retailer
 */
export async function fetchTerminals(
  retailerId: string
): Promise<ResponseType<Terminal[]>> {
  const { data, error } = await supabase
    .from("terminals")
    .select(
      `
      id,
      name,
      last_active,
      status
    `
    )
    .eq("retailer_id", retailerId);

  if (error) {
    return { data: null, error };
  }

  // Transform the data to match the Terminal type
  const terminals = data.map((terminal) => ({
    id: terminal.id,
    name: terminal.name,
    last_active: terminal.last_active,
    status: terminal.status as "active" | "inactive",
    auth_user_id: "", // No longer in the database
    email: "", // Email not available in the current query
  }));

  return { data: terminals, error: null };
}

/**
 * Create a new terminal for a retailer
 */
export async function createTerminal(
  retailerId: string,
  name: string
): Promise<ResponseType<{ id: string }>> {
  // Create the terminal for the retailer
  const { data: terminal, error: terminalError } = await supabase
    .from("terminals")
    .insert({
      retailer_id: retailerId,
      name,
      status: "active",
    })
    .select("id")
    .single();

  if (terminalError) {
    return { data: null, error: terminalError };
  }

  return { data: terminal, error: null };
}

/**
 * Toggle the status of a terminal (active/inactive)
 */
export async function toggleTerminalStatus(
  terminalId: string
): Promise<ResponseType<{ id: string }>> {
  // First, get the current status
  const { data: currentData, error: fetchError } = await supabase
    .from("terminals")
    .select("status")
    .eq("id", terminalId)
    .single();

  if (fetchError) {
    return { data: null, error: fetchError };
  }

  // Toggle the status
  const newStatus = currentData.status === "active" ? "inactive" : "active";

  // Update the terminal status
  const { data: terminal, error: updateError } = await supabase
    .from("terminals")
    .update({
      status: newStatus,
    })
    .eq("id", terminalId)
    .select("id")
    .single();

  if (updateError) {
    return { data: null, error: updateError };
  }

  return { data: terminal, error: null };
}

/**
 * Delete a terminal
 */
export async function deleteTerminal(
  terminalId: string
): Promise<ResponseType<{ id: string }>> {
  // Delete the terminal
  const { data, error } = await supabase
    .from("terminals")
    .delete()
    .eq("id", terminalId)
    .select("id")
    .single();

  if (error) {
    return { data: null, error };
  }

  return { data, error: null };
}
