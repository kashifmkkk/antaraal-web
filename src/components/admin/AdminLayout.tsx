import { useMemo } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAdminAuth } from "@/context/AdminAuthContext";

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
    <div className="flex min-h-screen bg-background text-foreground">
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
          <div className="flex items-center justify-between px-4 py-4 md:px-6">
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-muted-foreground">Daily control room</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Bell className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full border border-primary/30 bg-primary/10 text-xs font-semibold uppercase text-primary grid place-items-center">
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-medium">{admin?.name ?? "Admin"}</p>
                  <p className="text-xs text-muted-foreground">{admin?.email}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 bg-muted/30">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
