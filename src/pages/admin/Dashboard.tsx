import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { fetchJson } from "@/lib/api";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { 
  Package, 
  DollarSign, 
  ShoppingCart, 
  Star, 
  TrendingUp, 
  Users, 
  MessageSquare,
  Award,
  Factory,
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

const kpiCards = [
  { label: "Total Products", key: "totalProducts" },
  { label: "Active Vendors", key: "activeVendors" },
  { label: "Open RFQs", key: "openRfqs" },
  { label: "Pending Complaints", key: "pendingComplaints" },
] as const;

type DashboardKpis = {
  totalProducts: number;
  activeVendors: number;
  openRfqs: number;
  pendingComplaints: number;
};

type AnalyticsData = {
  sales: {
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    pendingOrders: number;
    deliveredOrders: number;
    recentOrders: number;
    recentRevenue: number;
  };
  products: {
    popular: Array<{
      id: number;
      name: string;
      category: string;
      orderCount: number;
      totalQuantity: number;
    }>;
  };
  vendors: {
    top: Array<{
      vendor: string;
      _count: { vendor: number };
    }>;
  };
  users: {
    total: number;
    active: number;
    byRole: Array<{ role: string; _count: { role: number } }>;
  };
  rfqs: {
    total: number;
    byStatus: Array<{ status: string; _count: { status: number } }>;
  };
  quotes: {
    total: number;
    byStatus: Array<{ status: string; _count: { status: number } }>;
    conversionRate: string;
  };
  reviews: {
    total: number;
    pending: number;
    byStatus: Array<{ status: string; _count: { status: number } }>;
  };
};

type RevenueChartData = {
  month: string;
  revenue: number;
  orders: number;
};

type TopCustomer = {
  userId: number;
  name: string;
  email: string;
  totalRevenue: number;
  orderCount: number;
};

type TopVendor = {
  vendor: string;
  totalRevenue: number;
  orderCount: number;
  productCount: number;
};

type CategoryRevenue = {
  category: string;
  revenue: number;
  orderCount: number;
};

type ConversionFunnel = {
  funnel: Array<{
    stage: string;
    count: number;
    percentage: number;
    conversionFromPrevious: number;
  }>;
  summary: {
    overallConversion: number;
    totalUsers: number;
    totalOrders: number;
    completedOrders: number;
  };
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1'];

const AdminDashboard = () => {
  const { token } = useAdminAuth();
  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : undefined), [token]);

  useNotifications();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "dashboard", "kpis"],
    queryFn: () => fetchJson<DashboardKpis>("/api/admin/dashboard/kpis", {
      headers: authHeaders,
    }),
    staleTime: 1000 * 60,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () => fetchJson<AnalyticsData>("/api/admin/analytics", {
      headers: authHeaders,
    }),
    staleTime: 1000 * 60 * 5,
  });

  const { data: revenueChart, isLoading: revenueChartLoading } = useQuery({
    queryKey: ["admin", "analytics", "revenue-chart"],
    queryFn: () => fetchJson<RevenueChartData[]>("/api/admin/analytics/revenue-chart", {
      headers: authHeaders,
    }),
    staleTime: 1000 * 60 * 15,
  });

  const { data: topCustomers, isLoading: topCustomersLoading } = useQuery({
    queryKey: ["admin", "analytics", "top-customers"],
    queryFn: () => fetchJson<TopCustomer[]>("/api/admin/analytics/top-customers?limit=5", {
      headers: authHeaders,
    }),
    staleTime: 1000 * 60 * 10,
  });

  const { data: topVendors, isLoading: topVendorsLoading } = useQuery({
    queryKey: ["admin", "analytics", "top-vendors"],
    queryFn: () => fetchJson<TopVendor[]>("/api/admin/analytics/top-vendors?limit=5", {
      headers: authHeaders,
    }),
    staleTime: 1000 * 60 * 10,
  });

  const { data: categoryRevenue, isLoading: categoryRevenueLoading } = useQuery({
    queryKey: ["admin", "analytics", "revenue-by-category"],
    queryFn: () => fetchJson<CategoryRevenue[]>("/api/admin/analytics/revenue-by-category", {
      headers: authHeaders,
    }),
    staleTime: 1000 * 60 * 10,
  });

  const { data: conversionFunnel, isLoading: conversionFunnelLoading } = useQuery({
    queryKey: ["admin", "analytics", "conversion-funnel"],
    queryFn: () => fetchJson<ConversionFunnel>("/api/admin/analytics/conversion-funnel", {
      headers: authHeaders,
    }),
    staleTime: 1000 * 60 * 10,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Operations Dashboard</h1>
        <p className="text-sm text-muted-foreground">Comprehensive analytics and marketplace insights</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map(({ label, key }) => (
          <Card key={key} className="border-primary/10 bg-card/80">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-20" />
              ) : isError ? (
                <p className="text-sm text-destructive">Unavailable</p>
              ) : (
                <p className="text-3xl font-semibold">{data?.[key] ?? 0}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sales Overview */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Sales Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    ₹{analytics?.sales.totalRevenue.toLocaleString() ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last 30 days: ₹{analytics?.sales.recentRevenue.toLocaleString() ?? 0}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{analytics?.sales.totalOrders ?? 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last 30 days: {analytics?.sales.recentOrders ?? 0}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  ₹{analytics?.sales.avgOrderValue.toFixed(2) ?? 0}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sales Trends Chart */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Sales Trends (Last 12 Months)
        </h2>
        <Card>
          <CardContent className="pt-6">
            {revenueChartLoading ? (
              <Skeleton className="h-80 w-full" />
            ) : revenueChart && revenueChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Revenue (₹)"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="Orders"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-20">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Category */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Revenue by Category
        </h2>
        <Card>
          <CardContent className="pt-6">
            {categoryRevenueLoading ? (
              <Skeleton className="h-80 w-full" />
            ) : categoryRevenue && categoryRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8884d8" name="Revenue (₹)">
                    {categoryRevenue.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-20">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Customers and Vendors */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Customers */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Award className="h-6 w-6" />
            Top Customers
          </h2>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCustomersLoading ? (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ) : topCustomers && topCustomers.length > 0 ? (
                    topCustomers.map((customer) => (
                      <TableRow key={customer.userId}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-xs text-muted-foreground">{customer.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{customer.orderCount}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{customer.totalRevenue.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No customer data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Top Vendors */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Factory className="h-6 w-6" />
            Top Vendors
          </h2>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Products</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topVendorsLoading ? (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ) : topVendors && topVendors.length > 0 ? (
                    topVendors.map((vendor) => (
                      <TableRow key={vendor.vendor}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{vendor.vendor}</p>
                            <p className="text-xs text-muted-foreground">
                              {vendor.orderCount} orders
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{vendor.productCount}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{vendor.totalRevenue.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No vendor data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Conversion Funnel</h2>
        <Card>
          <CardContent className="pt-6">
            {conversionFunnelLoading ? (
              <Skeleton className="h-80 w-full" />
            ) : conversionFunnel ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Overall Conversion
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {conversionFunnel.summary.overallConversion.toFixed(2)}%
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Users
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {conversionFunnel.summary.totalUsers}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Orders
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {conversionFunnel.summary.totalOrders}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Completed Orders
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {conversionFunnel.summary.completedOrders}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-2">
                  {conversionFunnel.funnel.map((stage, index) => {
                    const widthPercent = Math.max(stage.percentage, 5);
                    const opacity = 1 - (index * 0.08);
                    
                    return (
                      <div key={stage.stage} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{stage.stage}</span>
                          <span className="text-muted-foreground">
                            {stage.count} ({stage.conversionFromPrevious.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-12 bg-muted rounded-md overflow-hidden relative">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-between px-4 transition-all"
                            style={{ 
                              width: `${widthPercent}%`,
                              opacity: opacity
                            }}
                          >
                            <span className="text-white font-medium text-sm">
                              {stage.count}
                            </span>
                            <span className="text-white/90 text-xs">
                              {stage.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-20">No funnel data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Popular Products */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Popular Products</h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Order Count</TableHead>
                  <TableHead className="text-right">Total Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyticsLoading ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ) : analytics?.products.popular && analytics.products.popular.length > 0 ? (
                  analytics.products.popular.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{product.orderCount}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{product.totalQuantity}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No order data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* User Activity & Reviews */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">User Activity & Engagement</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{analytics?.users.total ?? 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Active: {analytics?.users.active ?? 0}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">RFQ Conversion</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {analytics?.quotes.conversionRate ?? 0}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total RFQs: {analytics?.rfqs.total ?? 0}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{analytics?.reviews.total ?? 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Approved: {analytics?.reviews.byStatus.find(s => s.status === 'Approved')?._count.status ?? 0}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{analytics?.reviews.pending ?? 0}</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
