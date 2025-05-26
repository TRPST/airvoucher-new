// Import and re-export with namespaces to avoid name conflicts
import * as AdminActions from "./adminActions";
import * as RetailerActions from "./retailerActions";
import * as AgentActions from "./agentActions";
import * as UserActions from "./userActions";

// Export namespaces
export { AdminActions, RetailerActions, AgentActions, UserActions };

// Alternatively, we can selectively re-export specific items
// Admin exports
export type {
  Retailer as AdminRetailer,
  Agent,
  Terminal as AdminTerminal,
  VoucherInventory,
  CommissionGroup,
  CommissionRate,
  SalesReport,
  EarningsSummary,
  InventoryReport,
  ProfileData,
  RetailerData,
} from "./adminActions";

export {
  fetchRetailers,
  createRetailer,
  updateRetailer,
  updateRetailerBalance,
  fetchAgents,
  fetchAllAgents,
  fetchAgentById,
  updateAgent,
  fetchAgentRetailers,
  fetchTerminals as fetchAdminTerminals,
  createTerminal,
  fetchVoucherInventory,
  uploadVouchers,
  disableVoucher,
  fetchCommissionGroups,
  upsertCommissionRate,
  fetchVoucherTypes,
  createCommissionGroup,
  createCommissionRates,
  fetchSalesReport,
  fetchEarningsSummary,
  fetchInventoryReport,
} from "./adminActions";

// Retailer exports
export type {
  RetailerProfile,
  VoucherType,
  Terminal as RetailerTerminal,
  Sale as RetailerSale,
} from "./retailerActions";

export {
  fetchMyRetailer,
  fetchAvailableVoucherTypes,
  fetchVoucherInventoryByType,
  sellVoucher,
  fetchSalesHistory,
  fetchTerminals as fetchRetailerTerminals,
  fetchCommissionRate,
  fetchRetailerCommissionData,
} from "./retailerActions";

// Agent exports
export type { AgentRetailer, AgentStatement } from "./agentActions";

// User exports
export type { UserProfile } from "./userActions";

export {
  getUserRole,
  getUserProfile,
  signOutUser,
} from "./userActions";

export {
  fetchMyRetailers,
  fetchAgentStatements,
  fetchAgentSummary,
} from "./agentActions";
