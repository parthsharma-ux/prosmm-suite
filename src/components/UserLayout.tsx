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
    <div className="min-h-screen flex flex-col bg-background">
      <header className="h-14 flex items-center justify-between border-b bg-card px-6 shrink-0">
        <div className="flex items-center gap-8">
          <span className="text-sm font-bold tracking-tight text-foreground">SMM Panel</span>
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
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Balance: <span className="font-semibold text-foreground">${profile?.wallet_balance?.toFixed(2) ?? "0.00"}</span>
          </div>
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
            <LogOut className="h-4 w-4 mr-1" /> Sign Out
          </Button>
        </div>
      </header>
      {/* Mobile nav */}
      <nav className="md:hidden flex items-center gap-1 px-4 py-2 border-b bg-card overflow-x-auto">
        {navItems.map((item) => (
          <Link
            key={item.url}
            to={item.url}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors",
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
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
