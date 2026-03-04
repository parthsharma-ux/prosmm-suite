import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Package, ShoppingCart, Wallet, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Services", url: "/dashboard/services", icon: Package },
  { title: "Orders", url: "/dashboard/orders", icon: ShoppingCart },
  { title: "Add Funds", url: "/dashboard/funds", icon: Wallet },
];

export default function UserLayout() {
  const { signOut, profile } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (url: string) =>
    url === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(url);

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <header className="h-14 flex items-center justify-between border-b bg-card px-4 md:px-6 shrink-0 min-w-0">
        <div className="flex items-center gap-3 md:gap-8 min-w-0">
          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden shrink-0 h-8 w-8">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-card border-border">
              <div className="flex flex-col h-full">
                <div className="h-14 flex items-center px-4 border-b border-border">
                  <span className="text-sm font-bold tracking-tight text-foreground">SMM Panel</span>
                </div>
                <nav className="flex-1 py-3 px-2 space-y-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.url}
                      to={item.url}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                        isActive(item.url)
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.title}
                    </Link>
                  ))}
                </nav>
                <div className="border-t border-border p-3 space-y-2">
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted">
                    <span className="text-xs text-muted-foreground">Balance</span>
                    <span className="text-sm font-semibold text-foreground">${profile?.wallet_balance?.toFixed(2) ?? "0.00"}</span>
                  </div>
                  <div className="flex items-center justify-between px-2">
                    <ThemeToggle />
                    <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground gap-2">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <span className="text-sm font-bold tracking-tight text-foreground shrink-0">SMM Panel</span>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.url}
                to={item.url}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive(item.url)
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
          <div className="hidden md:block text-sm text-muted-foreground whitespace-nowrap">
            <span className="font-semibold text-foreground">${profile?.wallet_balance?.toFixed(2) ?? "0.00"}</span>
          </div>
          <div className="hidden md:block"><ThemeToggle /></div>
          <Button variant="ghost" size="sm" onClick={signOut} className="hidden md:flex text-muted-foreground px-2">
            <LogOut className="h-4 w-4" />
          </Button>
          {/* Mobile: show balance only */}
          <div className="md:hidden text-xs font-semibold text-foreground whitespace-nowrap">
            ${profile?.wallet_balance?.toFixed(2) ?? "0.00"}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
