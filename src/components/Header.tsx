import { Button } from "@/components/ui/button";
import { Bell, ShoppingCart, User, Search, X, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useState, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import Logo from "@/components/Logo";
import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

const Header = () => {
  const { user, logout, loading, token } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;
  const isAdmin = role === "ADMIN";
  const isBuyer = role === "BUYER";
  const isVendor = role === "VENDOR";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const [query, setQuery] = useState("");
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<number>>(() => {
    try {
      const stored = localStorage.getItem('dismissedNotifications');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [dismissedSystemNotifs, setDismissedSystemNotifs] = useState<Set<number>>(() => {
    try {
      const stored = localStorage.getItem('dismissedSystemNotifs');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const dismissNotification = useCallback((id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissedNotifications(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem('dismissedNotifications', JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const dismissSystemNotif = useCallback((id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissedSystemNotifs(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem('dismissedSystemNotifs', JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length === 0) {
      navigate('/products');
    } else {
      navigate(`/products?q=${encodeURIComponent(q)}`);
    }
  };

  // Fetch products and compute recent updates as notifications
  const { data: products } = useQuery<any[]>({
    queryKey: ["products", "catalog"],
    queryFn: () => fetchJson<any[]>('/api/products'),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // Fetch system notifications from backend (only if user is logged in)
  const { data: systemNotifications = [] } = useQuery<any[]>({
    queryKey: ["notifications", "system"],
    queryFn: () => fetchJson<any[]>('/api/notifications', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),
    enabled: !!token && !!user,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const unreadSystemNotifs = (systemNotifications ?? [])
    .filter((n) => !n.isRead && !dismissedSystemNotifs.has(n.id))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const recentNotifications = (products ?? [])
    .filter((p) => !!p.updatedAt)
    .filter((p) => {
      // treat anything updated in last 7 days as a recent update
      const updated = new Date(p.updatedAt).getTime();
      return Date.now() - updated < 1000 * 60 * 60 * 24 * 7;
    })
    .filter((p) => !dismissedNotifications.has(p.id))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const unseenCount = unreadSystemNotifs.length + recentNotifications.length;

  const clearAllNotifications = useCallback(() => {
    const productIds = recentNotifications.map((p: any) => p.id);
    const systemIds = unreadSystemNotifs.map((n: any) => n.id);
    
    setDismissedNotifications(prev => {
      const next = new Set(prev);
      productIds.forEach(id => next.add(id));
      const allDismissed = Array.from(next);
      localStorage.setItem('dismissedNotifications', JSON.stringify(allDismissed));
      return next;
    });

    setDismissedSystemNotifs(prev => {
      const next = new Set(prev);
      systemIds.forEach(id => next.add(id));
      const allDismissed = Array.from(next);
      localStorage.setItem('dismissedSystemNotifs', JSON.stringify(allDismissed));
      return next;
    });
  }, [recentNotifications, unreadSystemNotifs]);

  

  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        {/* Top row: Logo + icons */}
        <div className="flex items-center justify-between gap-2">
          {/* Mobile Menu Button */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 px-4 py-4 border-b">
                  <Logo className="w-8 h-8 object-contain" />
                  <span className="text-lg font-bold bg-gradient-to-r from-primary to-warning bg-clip-text text-transparent">
                    Antaraal
                  </span>
                </div>
                <nav className="flex flex-col gap-1 px-2 py-4 flex-1 overflow-y-auto">
                  <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileOpen(false)}>
                    <Link to="/products">Products</Link>
                  </Button>
                  <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileOpen(false)}>
                    <Link to="/vendors">Vendors</Link>
                  </Button>
                  <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileOpen(false)}>
                    <Link to="/overhaul-services">Overhaul Services</Link>
                  </Button>
                  {!user && (
                    <Button variant="outline" className="justify-start" asChild onClick={() => setMobileOpen(false)}>
                      <Link to="/vendor/apply">Apply as Vendor</Link>
                    </Button>
                  )}
                  {(isAdmin || isBuyer) && (
                    <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileOpen(false)}>
                      <Link to="/rfq">RFQ</Link>
                    </Button>
                  )}
                  {(isAdmin || isVendor) && (
                    <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileOpen(false)}>
                      <Link to="/quotes">Quotes</Link>
                    </Button>
                  )}
                </nav>
                <div className="border-t px-4 py-4 space-y-2">
                  {user ? (
                    <>
                      <Button variant="ghost" className="w-full justify-start" size="sm" onClick={() => { navigate("/account"); setMobileOpen(false); }}>
                        <User className="w-4 h-4 mr-2" />
                        {user.name}
                      </Button>
                      <Button variant="destructive" size="sm" className="w-full" onClick={() => { handleLogout(); setMobileOpen(false); }} disabled={loading}>
                        Log out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" className="w-full" asChild onClick={() => setMobileOpen(false)}>
                        <Link to="/signup">Sign Up</Link>
                      </Button>
                      <Button variant="default" className="w-full" asChild onClick={() => setMobileOpen(false)}>
                        <Link to="/login">Sign In</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Logo className="w-8 h-8 lg:w-10 lg:h-10 object-contain" />
            <h1 className="text-lg lg:text-2xl font-bold bg-gradient-to-r from-primary to-warning bg-clip-text text-transparent">
              Antaraal
            </h1>
          </Link>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-4 lg:mx-8">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <button type="submit" aria-label="Search products" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                <Search className="w-4 h-4" />
              </button>
              <Input
                placeholder="Search aerospace parts..."
                className="pl-10 bg-muted border-border"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search products"
              />
            </form>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/products">Products</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/vendors">Vendors</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/overhaul-services">Overhaul</Link>
            </Button>
            {!user && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/vendor/apply">Apply as Vendor</Link>
              </Button>
            )}
            {(isAdmin || isBuyer) && (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/rfq">RFQ</Link>
              </Button>
            )}
            {(isAdmin || isVendor) && (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/quotes">Quotes</Link>
              </Button>
            )}
          </nav>

          {/* Right side: Theme + Notifications + Cart + Auth */}
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeSwitcher />

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Notifications">
                  <div className="relative">
                    <Bell className="w-4 h-4" />
                    {unseenCount > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] w-4 h-4 sm:w-5 sm:h-5 sm:text-xs">
                        {unseenCount}
                      </span>
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" sideOffset={8} className="w-80 sm:w-96">
                <div className="flex items-center justify-between">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  {(unreadSystemNotifs.length > 0 || recentNotifications.length > 0) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={clearAllNotifications}
                    >
                      Clear all
                    </Button>
                  )}
                </div>
                <DropdownMenuSeparator />
                {unreadSystemNotifs.length === 0 && recentNotifications.length === 0 && (
                  <div className="px-3 py-8 text-center text-sm text-muted-foreground">No new notifications</div>
                )}
                <div className="max-h-[400px] overflow-y-auto">
                  {/* System Notifications */}
                  {unreadSystemNotifs.length > 0 && (
                    <>
                      <div className="px-3 py-1 text-xs font-semibold text-muted-foreground">System Messages</div>
                      {unreadSystemNotifs.map((notif: any) => (
                        <DropdownMenuItem key={`sys-${notif.id}`} asChild className="group">
                          <div className="flex items-start gap-2 py-2 px-3">
                            <div className="flex-1 flex flex-col gap-1">
                              <span className="text-sm font-medium leading-tight">{notif.title}</span>
                              {notif.body && (
                                <span className="text-xs text-muted-foreground line-clamp-2">{notif.body}</span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {new Date(notif.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => dismissSystemNotif(notif.id, e)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </DropdownMenuItem>
                      ))}
                      {recentNotifications.length > 0 && <DropdownMenuSeparator />}
                    </>
                  )}

                  {/* Product Updates */}
                  {recentNotifications.length > 0 && (
                    <>
                      <div className="px-3 py-1 text-xs font-semibold text-muted-foreground">Product Updates</div>
                      {recentNotifications.map((p: any) => (
                        <DropdownMenuItem key={`prod-${p.id}`} asChild className="group">
                          <Link to={`/products/${p.id}`} className="flex items-start gap-2 py-2">
                            <div className="flex-1 flex flex-col gap-1">
                              <span className="text-sm font-medium leading-tight">{p.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {p.status ?? 'updated'} — {new Date(p.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => dismissNotification(p.id, e)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </div>
                {(unreadSystemNotifs.length > 0 || recentNotifications.length > 0) && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-2">
                      <Button variant="ghost" size="sm" className="w-full" asChild>
                        <Link to="/products">View all products</Link>
                      </Button>
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Cart */}
            {user ? (
              <Button variant="ghost" size="icon" onClick={() => navigate("/cart")} aria-label="Cart">
                <ShoppingCart className="w-4 h-4" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" aria-label="Cart">
                <ShoppingCart className="w-4 h-4" />
              </Button>
            )}

            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center gap-1 border-l pl-2 ml-1">
              {user ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/account")}>
                    <User className="w-4 h-4 mr-2" />
                    <span className="max-w-[100px] truncate">{user.name}</span>
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleLogout} disabled={loading}>
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/signup">Sign Up</Link>
                  </Button>
                  <Button variant="default" size="sm" asChild>
                    <Link to="/login">Sign In</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar (below main row) */}
        <div className="md:hidden mt-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <button type="submit" aria-label="Search products" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              <Search className="w-4 h-4" />
            </button>
            <Input
              placeholder="Search aerospace parts..."
              className="pl-10 bg-muted border-border"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search products"
            />
          </form>
        </div>
      </div>
    </header>
  );
};

export default Header;