import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import {
  Store,
  Smartphone,
  DollarSign,
  CreditCard,
  Percent,
  Calendar,
  MoreHorizontal,
  ChevronDown,
  Plus,
  Loader2,
  AlertCircle,
  X,
  Power,
  Trash2,
  Check,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";

import { StatsTile } from "@/components/ui/stats-tile";
import { TablePlaceholder } from "@/components/ui/table-placeholder";
import { cn } from "@/utils/cn";
import {
  fetchRetailers,
  fetchAdminTerminals,
  fetchSalesReport,
  createTerminal,
  toggleTerminalStatus,
  deleteTerminal,
  type AdminRetailer,
  type AdminTerminal,
  type SalesReport,
} from "@/actions";

export default function RetailerDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "terminals"
  );

  // State for data and loading
  const [retailer, setRetailer] = useState<AdminRetailer | null>(null);
  const [terminals, setTerminals] = useState<AdminTerminal[]>([]);
  const [sales, setSales] = useState<SalesReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Terminal modal state
  const [showAddTerminalModal, setShowAddTerminalModal] = useState(false);
  const [terminalFormData, setTerminalFormData] = useState({
    name: "",
  });
  const [isSubmittingTerminal, setIsSubmittingTerminal] = useState(false);
  const [terminalFormError, setTerminalFormError] = useState<string | null>(
    null
  );

  // Terminal action states
  const [activeTerminalMenu, setActiveTerminalMenu] = useState<string | null>(
    null
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [terminalToDelete, setTerminalToDelete] =
    useState<AdminTerminal | null>(null);
  const [isProcessingTerminalAction, setIsProcessingTerminalAction] =
    useState(false);

  // Load retailer data
  useEffect(() => {
    async function loadRetailerData() {
      if (typeof id !== "string") return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch retailer info
        const { data: retailersData, error: retailerError } =
          await fetchRetailers();

        if (retailerError) {
          throw new Error(`Failed to load retailer: ${retailerError.message}`);
        }

        const foundRetailer = retailersData?.find((r) => r.id === id) || null;
        if (!foundRetailer) {
          throw new Error("Retailer not found");
        }

        setRetailer(foundRetailer);

        // Fetch terminals
        const { data: terminalsData, error: terminalsError } =
          await fetchAdminTerminals(id);

        if (terminalsError) {
          console.error("Error loading terminals:", terminalsError);
          // Continue with other data loading
        } else {
          setTerminals(terminalsData || []);
        }

        // Fetch sales
        const { data: salesData, error: salesError } = await fetchSalesReport(
          {}
        );

        if (salesError) {
          console.error("Error loading sales:", salesError);
          // Continue without sales data
        } else {
          // Filter sales for this retailer
          const retailerSales =
            salesData?.filter(
              (sale) => sale.retailer_name === foundRetailer.name
            ) || [];
          setSales(retailerSales);
        }
      } catch (err) {
        console.error("Error in retailer details:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load retailer data"
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadRetailerData();
  }, [id]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p>Loading retailer details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="rounded-lg border border-border bg-card p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto mb-4 h-10 w-10 text-destructive" />
          <h2 className="mb-2 text-xl font-semibold">Error</h2>
          <p className="mb-4 text-muted-foreground">{error}</p>
          <button
            onClick={() => router.push("/admin/retailers")}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            Back to Retailers
          </button>
        </div>
      </div>
    );
  }

  // Not found state
  if (!retailer) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="rounded-lg border border-border bg-card p-8 text-center shadow-sm">
          <Store className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">Retailer Not Found</h2>
          <p className="mb-4 text-muted-foreground">
            The retailer you are looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push("/admin/retailers")}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            Back to Retailers
          </button>
        </div>
      </div>
    );
  }

  // Format terminal data for table
  const terminalData = terminals.map((terminal) => ({
    Name: terminal.name,
    Status: (
      <div
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          terminal.status === "active"
            ? "bg-green-500/10 text-green-500"
            : "bg-amber-500/10 text-amber-500"
        )}
      >
        {terminal.status.charAt(0).toUpperCase() + terminal.status.slice(1)}
      </div>
    ),
    "Last Active": terminal.last_active
      ? new Date(terminal.last_active).toLocaleString("en-ZA", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Never",
    Actions: (
      <div className="flex items-center gap-2 relative">
        <button
          className="rounded-md p-2 hover:bg-muted"
          onClick={(e) => {
            e.stopPropagation();
            setActiveTerminalMenu(
              activeTerminalMenu === terminal.id ? null : terminal.id
            );
          }}
        >
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Dropdown Menu */}
        {activeTerminalMenu === terminal.id && (
          <div
            className="absolute right-0 top-8 z-10 w-48 rounded-md bg-card border border-border shadow-lg py-1 text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="flex w-full items-center px-4 py-2 hover:bg-muted gap-2"
              onClick={() => handleToggleTerminalStatus(terminal)}
              disabled={isProcessingTerminalAction}
            >
              <Power className="h-4 w-4 text-muted-foreground" />
              <span>
                {terminal.status === "active" ? "Deactivate" : "Activate"}
              </span>
              {isProcessingTerminalAction && (
                <Loader2 className="h-3 w-3 animate-spin ml-auto" />
              )}
            </button>
            <button
              className="flex w-full items-center px-4 py-2 hover:bg-muted text-destructive gap-2"
              onClick={() => {
                setTerminalToDelete(terminal);
                setShowDeleteModal(true);
                setActiveTerminalMenu(null);
              }}
              disabled={isProcessingTerminalAction}
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    ),
  }));

  // Format sales data for table
  const salesData = sales.slice(0, 5).map((sale) => ({
    Date: new Date(sale.created_at).toLocaleString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    Type: sale.voucher_type || "Unknown",
    Value: `R ${sale.amount.toFixed(2)}`,
    Commission: `R ${sale.retailer_commission.toFixed(2)}`,
    "PIN/Serial": "••••••••", // We don't expose PINs in the UI for security
  }));

  // Section toggle handler
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Terminal form handlers
  const handleTerminalInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setTerminalFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Terminal action handlers
  const handleToggleTerminalStatus = async (terminal: AdminTerminal) => {
    if (typeof id !== "string") return;

    setIsProcessingTerminalAction(true);
    try {
      const { error } = await toggleTerminalStatus(terminal.id);

      if (error) {
        console.error("Error toggling terminal status:", error);
        return;
      }

      // Refresh the terminals list
      const { data: terminalsData } = await fetchAdminTerminals(id);
      if (terminalsData) {
        setTerminals(terminalsData);
      }
    } catch (err) {
      console.error("Error in terminal action:", err);
    } finally {
      setIsProcessingTerminalAction(false);
      setActiveTerminalMenu(null);
    }
  };

  const handleDeleteTerminal = async () => {
    if (!terminalToDelete || typeof id !== "string") return;

    setIsProcessingTerminalAction(true);
    try {
      const { error } = await deleteTerminal(terminalToDelete.id);

      if (error) {
        console.error("Error deleting terminal:", error);
        return;
      }

      // Refresh the terminals list
      const { data: terminalsData } = await fetchAdminTerminals(id);
      if (terminalsData) {
        setTerminals(terminalsData);
      }

      // Close the modal
      setShowDeleteModal(false);
      setTerminalToDelete(null);
    } catch (err) {
      console.error("Error in terminal action:", err);
    } finally {
      setIsProcessingTerminalAction(false);
    }
  };

  const handleTerminalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!terminalFormData.name.trim()) {
      setTerminalFormError("Terminal name is required");
      return;
    }

    if (typeof id !== "string") {
      setTerminalFormError("Invalid retailer ID");
      return;
    }

    setIsSubmittingTerminal(true);
    setTerminalFormError(null);

    try {
      // Create the terminal
      const { data, error } = await createTerminal(id, terminalFormData.name);

      if (error) {
        setTerminalFormError(`Failed to create terminal: ${error.message}`);
        return;
      }

      // Refresh the terminals list
      const { data: terminalsData } = await fetchAdminTerminals(id);
      if (terminalsData) {
        setTerminals(terminalsData);
      }

      // Close the modal and reset form
      setShowAddTerminalModal(false);
      setTerminalFormData({ name: "" });
    } catch (err) {
      setTerminalFormError(
        `Error creating terminal: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setIsSubmittingTerminal(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Retailer Details
          </h1>
          <p className="text-muted-foreground">
            View and manage retailer information.
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/retailers")}
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted"
        >
          Back to List
        </button>
      </div>

      {/* Profile Card */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary md:h-20 md:w-20">
            <Store className="h-8 w-8 md:h-10 md:w-10" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold md:text-2xl">{retailer.name}</h2>
            <div className="mt-1 grid grid-cols-1 gap-x-4 gap-y-2 text-sm md:grid-cols-2">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Contact Person:</span>
                <span className="font-medium">
                  {retailer.contact_name || retailer.full_name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Contact Email:</span>
                <span className="font-medium">
                  {retailer.contact_email || retailer.email}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Status:</span>
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
                  {retailer.status.charAt(0).toUpperCase() +
                    retailer.status.slice(1)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Commission Group:</span>
                <span className="font-medium">
                  {retailer.commission_group_name || "None"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsTile
          label="Available Balance"
          value={`R ${retailer.balance.toFixed(2)}`}
          icon={DollarSign}
          intent="success"
          subtitle="Current account balance"
        />
        <StatsTile
          label="Credit Used"
          value={`R ${retailer.credit_used.toFixed(2)}`}
          icon={CreditCard}
          intent="warning"
          subtitle="Active credit amount"
        />
        <StatsTile
          label="Commission Earned"
          value={`R ${retailer.commission_balance.toFixed(2)}`}
          icon={Percent}
          intent="info"
          subtitle="Total earned to date"
        />
      </div>

      {/* Expandable Sections */}
      <div className="space-y-4">
        {/* Terminals Section */}
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <button
            onClick={() => toggleSection("terminals")}
            className="flex w-full items-center justify-between px-6 py-4 hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-medium">Terminals</h3>
              <div className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {terminals.length}
              </div>
            </div>
            <ChevronDown
              className={cn(
                "h-5 w-5 text-muted-foreground transition-transform",
                expandedSection === "terminals" && "rotate-180"
              )}
            />
          </button>
          <AnimatePresence initial={false}>
            {expandedSection === "terminals" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="border-t border-border p-4">
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={() => setShowAddTerminalModal(true)}
                      className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Add Terminal
                    </button>
                  </div>
                  <TablePlaceholder
                    columns={["Name", "Status", "Last Active", "Actions"]}
                    data={terminalData}
                    emptyMessage="No terminals found for this retailer"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sales History Section */}
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <button
            onClick={() => toggleSection("sales")}
            className="flex w-full items-center justify-between px-6 py-4 hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-medium">Sales History</h3>
              <div className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {sales.length}
              </div>
            </div>
            <ChevronDown
              className={cn(
                "h-5 w-5 text-muted-foreground transition-transform",
                expandedSection === "sales" && "rotate-180"
              )}
            />
          </button>
          <AnimatePresence initial={false}>
            {expandedSection === "sales" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="border-t border-border p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-muted-foreground">
                      Showing recent 5 of {sales.length} transactions
                    </div>
                    <button className="text-sm text-primary hover:underline">
                      View All
                    </button>
                  </div>
                  <TablePlaceholder
                    columns={[
                      "Date",
                      "Type",
                      "Value",
                      "Commission",
                      "PIN/Serial",
                    ]}
                    data={salesData}
                    emptyMessage="No sales found for this retailer"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Terminal Modal using Radix UI */}
      <Dialog.Root
        open={showAddTerminalModal}
        onOpenChange={setShowAddTerminalModal}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-card p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-lg font-semibold">
                Add New Terminal
              </Dialog.Title>
              <Dialog.Close className="rounded-full p-2 hover:bg-muted">
                <X className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Close</span>
              </Dialog.Close>
            </div>

            <div className="mt-2 space-y-4">
              {terminalFormError && (
                <div className="mb-4 rounded-md bg-destructive/10 p-3 text-destructive text-sm">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {terminalFormError}
                  </div>
                </div>
              )}

              <form onSubmit={handleTerminalSubmit}>
                <div className="space-y-2 mb-4">
                  <label className="text-sm font-medium">Terminal Name</label>
                  <input
                    type="text"
                    name="name"
                    value={terminalFormData.name}
                    onChange={handleTerminalInputChange}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Enter terminal name"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="rounded-md px-4 py-2 text-sm font-medium border border-input hover:bg-muted"
                    >
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    disabled={isSubmittingTerminal}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingTerminal ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                        Processing...
                      </>
                    ) : (
                      "Add Terminal"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Terminal Confirmation Modal */}
      <Dialog.Root open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-card p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-lg font-semibold text-destructive">
                Delete Terminal
              </Dialog.Title>
              <Dialog.Close className="rounded-full p-2 hover:bg-muted">
                <X className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Close</span>
              </Dialog.Close>
            </div>

            <div className="mt-2 space-y-4">
              <div className="flex items-center">
                <div className="mr-4 rounded-full bg-destructive/10 p-2">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="font-medium">
                    Are you sure you want to delete this terminal?
                  </p>
                  {terminalToDelete && (
                    <p className="text-sm text-muted-foreground">
                      Terminal: {terminalToDelete.name}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                This action cannot be undone. This will permanently delete the
                terminal and remove it from the system.
              </p>

              <div className="flex justify-end space-x-2 mt-6">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-md px-4 py-2 text-sm font-medium border border-input hover:bg-muted"
                    onClick={() => setTerminalToDelete(null)}
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="button"
                  onClick={handleDeleteTerminal}
                  disabled={isProcessingTerminalAction}
                  className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessingTerminalAction ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
