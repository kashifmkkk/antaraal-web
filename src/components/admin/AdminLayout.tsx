import { useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Boxes,
  Factory,
  ClipboardList,
  FileText,
  Wrench,
  ShieldCheck,
  Megaphone,
  Users,
  Settings,
  Bell,
  Package,
  FileWarning,
  Star,
  FolderOpen,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

const navItems = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Inventory", to: "/admin/inventory", icon: Boxes },
  { label: "Categories", to: "/admin/categories", icon: FolderOpen },
  { label: "Vendors", to: "/admin/vendors", icon: Factory },
  { label: "RFQs", to: "/admin/rfqs", icon: ClipboardList },
  { label: "Quotes", to: "/admin/quotes", icon: FileText },
  { label: "Orders", to: "/admin/orders", icon: Package },
  { label: "Overhaul / MRO", to: "/admin/mro", icon: Wrench },
  { label: "Warranty Tracking", to: "/admin/warranty", icon: ShieldCheck },
  { label: "Warranty Claims", to: "/admin/warranty-claims", icon: FileWarning },
  { label: "Complaints", to: "/admin/complaints", icon: Megaphone },
  { label: "Users", to: "/admin/users", icon: Users },
  { label: "Reviews", to: "/admin/reviews", icon: Star },
  { label: "Notifications", to: "/admin/notifications", icon: Bell },
  { label: "Settings", to: "/admin/settings", icon: Settings },
];

const AdminLayout = () => {
  const { admin, logout } = useAdminAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const initials = useMemo(() => {
    if (!admin?.name) {
      return "AD";
    }
    const parts = admin.name.trim().split(" ");
    const first = parts[0]?.[0];
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1];
    return `${first ?? ""}${last ?? ""}`.toUpperCase();
  }, [admin?.name]);

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-background text-foreground">
      <aside className="hidden border-r border-primary/10 bg-card/70 backdrop-blur-sm lg:flex lg:w-64 xl:w-72">
        <div className="flex h-full w-full flex-col">
          <div className="px-6 py-6">
            <p className="text-lg font-semibold">Skyway Admin</p>
            <p className="text-xs text-muted-foreground">Internal operations console</p>
          </div>
          <Separator className="bg-primary/10" />
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-primary/10 ${
                    isActive ? "bg-primary/15 text-primary" : "text-muted-foreground"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="px-6 py-5 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Antaraal Skyway</p>
            <p>Confidential</p>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="border-b border-primary/10 bg-card/70 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
            <div className="flex items-center gap-3">
              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="ghost" size="icon" aria-label="Open admin navigation">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[86vw] max-w-sm p-0">
                  <SheetTitle className="sr-only">Admin navigation</SheetTitle>
                  <div className="flex h-full flex-col">
                    <div className="border-b px-5 py-5">
                      <p className="text-lg font-semibold">Skyway Admin</p>
                      <p className="text-xs text-muted-foreground">Internal operations console</p>
                    </div>
                    <ScrollArea className="flex-1">
                      <nav className="space-y-1 px-3 py-4">
                        {navItems.map(({ label, to, icon: Icon }) => (
                          <NavLink
                            key={to}
                            to={to}
                            onClick={() => setMobileNavOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors hover:bg-primary/10 ${
                                isActive ? "bg-primary/15 text-primary" : "text-muted-foreground"
                              }`
                            }
                          >
                            <Icon className="h-4 w-4" />
                            <span className="font-medium">{label}</span>
                          </NavLink>
                        ))}
                      </nav>
                    </ScrollArea>
                    <div className="border-t px-5 py-4">
                      <Button variant="outline" className="w-full" onClick={() => { setMobileNavOpen(false); logout(); }}>
                        Logout
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              <div>
                <p className="text-xs font-medium text-muted-foreground lg:hidden">Daily control room</p>
                <p className="hidden text-sm font-medium text-muted-foreground lg:block">Daily control room</p>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <Button variant="ghost" size="icon" className="text-muted-foreground hidden sm:inline-flex">
                <Bell className="h-4 w-4" />
              </Button>
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-primary/30 bg-primary/10 text-xs font-semibold uppercase text-primary">
                  {initials}
                </div>
                <div className="min-w-0 hidden sm:block">
                  <p className="truncate text-sm font-medium">{admin?.name ?? "Admin"}</p>
                  <p className="truncate text-xs text-muted-foreground">{admin?.email}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={logout} className="hidden sm:inline-flex">
                Logout
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 bg-muted/30">
          <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
