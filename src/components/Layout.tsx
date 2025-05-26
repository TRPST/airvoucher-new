"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback } from "react";
import { getUserRole, signOutUser } from "@/actions/userActions";
import { fetchMyRetailer, RetailerProfile } from "@/actions/retailerActions";
import {
  LayoutDashboard,
  Store,
  Users,
  CreditCard,
  FileText,
  ShoppingCart,
  History,
  User,
  Percent,
  Menu,
  X,
  ChevronRight,
  LogOut,
} from "lucide-react";
// Import Supabase client directly
import { createClient } from "@/utils/supabase/client";
import * as Avatar from "@radix-ui/react-avatar";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { motion } from "framer-motion";

import { cn } from "@/utils/cn";
import { ThemeToggle } from "@/components/ui/theme-toggle";

type UserRole = "admin" | "retailer" | "agent";

interface LayoutProps {
  children: React.ReactNode;
  role?: UserRole;
}

export function Layout({ children, role = "admin" }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [supabaseClient] = React.useState(() => createClient());
  // State to manage user and session
  const [user, setUser] = React.useState<any>(null);
  const [session, setSession] = React.useState<any>(null);
  const [retailerProfile, setRetailerProfile] = React.useState<RetailerProfile | null>(null);

  // Fetch user session on component mount
  React.useEffect(() => {
    // Get current session
    const fetchSession = async () => {
      const { data } = await supabaseClient.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user || null);

      // Listen for auth changes
      const { data: authListener } = supabaseClient.auth.onAuthStateChange(
        (event: string, currentSession: any) => {
          setSession(currentSession);
          setUser(currentSession?.user || null);
        }
      );

      // Cleanup listener on unmount
      return () => {
        authListener.subscription.unsubscribe();
      };
    };

    fetchSession();
  }, [supabaseClient]);

  // Fetch retailer profile if user is a retailer
  React.useEffect(() => {
    const fetchRetailerProfile = async () => {
      if (role === "retailer" && user?.id) {
        try {
          const { data, error } = await fetchMyRetailer(user.id);
          if (error) {
            console.error("Error fetching retailer profile:", error);
          } else {
            setRetailerProfile(data);
          }
        } catch (err) {
          console.error("Error fetching retailer profile:", err);
        }
      } else {
        setRetailerProfile(null);
      }
    };

    fetchRetailerProfile();
  }, [role, user?.id]);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      // Use the signOutUser action instead of directly calling supabase
      const { error } = await signOutUser();
      if (error) {
        console.error("Error signing out:", error);
        return;
      }
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Helper function to get user's role from profiles table
  const getUserRoleFromProfile = async (userId: string) => {
    // Use the getUserRole action instead of directly querying supabase
    const { data, error } = await getUserRole(userId);
    
    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
    
    return data;
  };

  // Handle cross-portal navigation
  const handlePortalNavigation = useCallback(async (targetRole: UserRole) => {
    if (role !== targetRole) {
      try {
        console.log(`Switching from ${role} portal to ${targetRole} portal. Signing out first.`);
        // Sign out the current user using the action
        const { error: signOutError } = await signOutUser();
        if (signOutError) {
          console.error("Error signing out:", signOutError);
          return;
        }
        // Redirect to the auth page for the target role
        router.push(`/auth/${targetRole}`);
      } catch (error) {
        console.error("Error during portal navigation:", error);
      }
    }
  }, [role, router]);

  // Generate navigation items based on user role
  const getNavItems = (role: UserRole) => {
    switch (role) {
      case "admin":
        return [
          {
            name: "Dashboard",
            href: "/admin",
            icon: LayoutDashboard,
          },
          {
            name: "Retailers",
            href: "/admin/retailers",
            icon: Store,
          },
          {
            name: "Agents",
            href: "/admin/agents",
            icon: Users,
          },
          {
            name: "Vouchers",
            href: "/admin/vouchers",
            icon: CreditCard,
          },
          {
            name: "Commissions",
            href: "/admin/commissions",
            icon: Percent,
          },
          {
            name: "Reports",
            href: "/admin/reports",
            icon: FileText,
          },
          // Profile removed from sidebar nav
        ];
      case "retailer":
        return [
          {
            name: "Sell",
            href: "/retailer",
            icon: ShoppingCart,
          },
          {
            name: "History",
            href: "/retailer/history",
            icon: History,
          },
          {
            name: "Account",
            href: "/retailer/account",
            icon: User,
          },
        ];
      case "agent":
        return [
          {
            name: "Dashboard",
            href: "/agent",
            icon: LayoutDashboard,
          },
          {
            name: "Retailers",
            href: "/agent/retailers",
            icon: Store,
          },
          {
            name: "Commissions",
            href: "/agent/commissions",
            icon: Percent,
          },
          // Profile removed from sidebar nav
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems(role);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Mobile top nav */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background p-4 md:hidden">
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(true)}
            className="mr-2 rounded-md p-2 hover:bg-muted"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-bold">AirVoucher</span>
        </div>
        <ThemeToggle />
      </div>

      {/* Mobile sidebar (drawer) */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 animate-in slide-in-from-left border-r border-border bg-background p-4 md:hidden">
            <div className="flex justify-end">
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-md p-2 hover:bg-muted"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">AirVoucher</h1>
                {/* Logout button removed from top of sidebar */}
                <div className="w-8 h-5"></div>{" "}
                {/* Spacer to maintain layout */}
              </div>
              <div className="mt-4 rounded-full bg-primary py-1 px-4 text-center text-sm font-medium text-primary-foreground">
                {role === "retailer" && retailerProfile?.name
                  ? retailerProfile.name
                  : `${role.charAt(0).toUpperCase() + role.slice(1)} Portal`}
              </div>
              
             
            </div>
            <nav className="mt-8 flex flex-col space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                    pathname === item.href
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
            {user && (
              <div className="absolute bottom-16 left-4 right-4">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      className="w-full p-3 rounded-md flex items-center hover:bg-muted transition-colors outline-none border-0 focus:outline-none focus:border-0 focus:ring-0 focus-visible:outline-none"
                      aria-label="User menu"
                      style={{
                        outline: "none !important",
                        border: "none !important",
                      }}
                    >
                      <Avatar.Root className="w-8 h-8 rounded-full overflow-hidden bg-primary flex items-center justify-center text-primary-foreground mr-3">
                        <Avatar.Fallback>
                          {user.email.charAt(0).toUpperCase()}
                        </Avatar.Fallback>
                      </Avatar.Root>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium truncate">
                          {user.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </p>
                      </div>
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      side="top"
                      align="start"
                      sideOffset={8}
                      className="z-50 min-w-[200px] bg-background shadow-none overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200 p-1 border-0 outline-none ring-0 focus:outline-none focus:border-0 focus:ring-0"
                      style={{
                        boxShadow: "none !important",
                        outline: "none !important",
                        border: "none !important",
                        borderRadius: "0.375rem",
                      }}
                    >
                      {/* <DropdownMenu.Item
                        className="flex items-center rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted group outline-none border-0 focus:outline-none focus:border-0 focus:ring-0 data-[highlighted]:outline-none data-[highlighted]:bg-muted data-[highlighted]:border-0 data-[state=open]:outline-none cursor-pointer"
                        onSelect={() => {
                          // Navigate to profile based on role
                          const profilePath =
                            role === "retailer"
                              ? "/retailer/account"
                              : `/${role}/profile`;
                          router.push(profilePath);
                          setSidebarOpen(false); // Close sidebar after navigation
                        }}
                      >
                        <motion.div
                          className="flex items-center justify-between w-full"
                          whileHover={{ scale: 1.01 }}
                          transition={{ duration: 0.1, ease: "easeOut" }}
                        >
                          <div className="flex items-center">
                            <User className="mr-3 h-5 w-5" />
                            View Profile
                          </div>
                          <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                      </DropdownMenu.Item> */}
                      <DropdownMenu.Item
                        className="flex items-center rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted group outline-none border-0 focus:outline-none focus:border-0 focus:ring-0 data-[highlighted]:outline-none data-[highlighted]:bg-muted data-[highlighted]:border-0 data-[state=open]:outline-none cursor-pointer"
                        onSelect={handleSignOut}
                      >
                        <motion.div
                          className="flex items-center justify-between w-full"
                          whileHover={{ scale: 1.01 }}
                          transition={{ duration: 0.1, ease: "easeOut" }}
                        >
                          <div className="flex items-center">
                            <LogOut className="mr-3 h-5 w-5" />
                            Sign Out
                          </div>
                          <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            )}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  © 2025 AirVoucher
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Desktop sidebar */}
      <div className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-border bg-background p-4 md:block">
        <div className="flex h-full flex-col">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">AirVoucher</h1>
              {/* Logout button removed from top of sidebar */}
              <div className="w-8 h-5"></div> {/* Spacer to maintain layout */}
            </div>
            <div className="mt-4 rounded-full bg-primary py-1 px-4 text-center text-sm font-medium text-primary-foreground">
              {role === "retailer" && retailerProfile?.name
                ? retailerProfile.name
                : `${role.charAt(0).toUpperCase() + role.slice(1)} Portal`}
            </div>
          </div>
          {/* User info removed from here - moved to bottom */}

          <nav className="flex flex-1 flex-col space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                  pathname === item.href
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted"
                )}
              >
                <div className="flex items-center">
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </div>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100",
                    pathname === item.href ? "opacity-100" : ""
                  )}
                />
              </Link>
            ))}
          </nav>
          {/* Spacer to push user info and footer to bottom */}
          <div className="flex-1"></div>

          {/* User info placed at bottom of sidebar with drop-up menu */}
          {user && (
            <div className="mb-4 mt-auto">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    className="w-full p-3 rounded-md flex items-center hover:bg-muted transition-colors outline-none border-0 focus:outline-none focus:border-0 focus:ring-0 focus-visible:outline-none"
                    aria-label="User menu"
                    style={{
                      outline: "none !important",
                      border: "none !important",
                    }}
                  >
                    <Avatar.Root className="w-8 h-8 rounded-full overflow-hidden bg-primary flex items-center justify-center text-primary-foreground mr-3">
                      <Avatar.Fallback>
                        {user.email ? user.email.charAt(0).toUpperCase() : "U"}
                      </Avatar.Fallback>
                    </Avatar.Root>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium truncate">
                        {user?.email || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </p>
                    </div>
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    side="top"
                    align="start"
                    sideOffset={8}
                    className="z-50 min-w-[200px] bg-background shadow-none overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200 p-1 border-0 outline-none ring-0 focus:outline-none focus:border-0 focus:ring-0"
                    style={{
                      boxShadow: "none !important",
                      outline: "none !important",
                      border: "none !important",
                      borderRadius: "0.375rem",
                    }}
                  >
                    {/* <DropdownMenu.Item
                      className="flex items-center rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted group outline-none border-0 focus:outline-none focus:border-0 focus:ring-0 data-[highlighted]:outline-none data-[highlighted]:bg-muted data-[highlighted]:border-0 data-[state=open]:outline-none cursor-pointer"
                      onSelect={() => {
                        // Navigate to profile based on role
                        const profilePath =
                          role === "retailer"
                            ? "/retailer/account"
                            : `/${role}/profile`;
                        router.push(profilePath);
                      }}
                    >
                      <motion.div
                        className="flex items-center justify-between w-full"
                        whileHover={{ scale: 1.01 }}
                        transition={{ duration: 0.1, ease: "easeOut" }}
                      >
                        <div className="flex items-center">
                          <User className="mr-3 h-5 w-5" />
                          View Profile
                        </div>
                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.div>
                    </DropdownMenu.Item> */}
                    <DropdownMenu.Item
                      className="flex items-center rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted group outline-none border-0 focus:outline-none focus:border-0 focus:ring-0 data-[highlighted]:outline-none data-[highlighted]:bg-muted data-[highlighted]:border-0 data-[state=open]:outline-none cursor-pointer"
                      onSelect={handleSignOut}
                    >
                      <motion.div
                        className="flex items-center justify-between w-full"
                        whileHover={{ scale: 1.01 }}
                        transition={{ duration: 0.1, ease: "easeOut" }}
                      >
                        <div className="flex items-center">
                          <LogOut className="mr-3 h-5 w-5" />
                          Sign Out
                        </div>
                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.div>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          )}

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                © 2025 AirVoucher
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 md:pl-64">
        <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
