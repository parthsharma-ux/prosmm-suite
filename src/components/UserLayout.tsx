import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Package, ShoppingCart, Wallet, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Services", url: "/dashboard/services", icon: Package },
  { title: "Orders", url: "/dashboard/orders", icon: ShoppingCart },
  { title: "Add Funds", url: "/dashboard/funds", icon: Wallet },
];

export default function UserLayout() {
  const { signOut, profile } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <header className="h-14 flex items-center justify-between border-b bg-card px-4 md:px-6 shrink-0 min-w-0">
        <div className="flex items-center gap-4 md:gap-8 min-w-0">
          <span className="text-sm font-bold tracking-tight text-foreground shrink-0">SMM Panel</span>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.url}
                to={item.url}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  (item.url === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(item.url))
                    ? "bg-accent text-primary"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <div className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
            <span className="font-semibold text-foreground">${profile?.wallet_balance?.toFixed(2) ?? "0.00"}</span>
          </div>
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground px-2">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>
      {/* Mobile nav — left aligned */}
      <nav className="md:hidden flex items-center gap-1 px-3 py-2 border-b bg-card overflow-x-auto">
        {navItems.map((item) => (
          <Link
            key={item.url}
            to={item.url}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors",
              (item.url === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(item.url))
                ? "bg-accent text-primary"
                : "text-muted-foreground"
            )}
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.title}
          </Link>
        ))}
      </nav>
      <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
