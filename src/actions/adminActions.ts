/**
 * This file serves as a facade that re-exports all admin-related functionality
 * from the smaller, more focused modules.
 */

// Re-export all types
export * from "./types/adminTypes";

// Re-export user/agent actions
export { fetchAgents, createAgent, type Agent } from "./admin/userActions";

// Re-export retailer actions
export {
  fetchRetailers,
  createRetailer,
  updateRetailer,
} from "./admin/retailerActions";

// Re-export terminal actions
export {
  fetchTerminals,
  createTerminal,
  toggleTerminalStatus,
  deleteTerminal,
} from "./admin/terminalActions";

// Re-export voucher actions
export {
  fetchVoucherInventory,
  uploadVouchers,
  disableVoucher,
} from "./admin/voucherActions";

// Re-export commission actions
export {
  fetchCommissionGroups,
  upsertCommissionRate,
} from "./admin/commissionActions";

// Re-export report actions
export {
  fetchSalesReport,
  fetchEarningsSummary,
  fetchInventoryReport,
} from "./admin/reportActions";
