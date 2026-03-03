import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Products from "./pages/Products";
import Vendors from "./pages/Vendors";
import OverhaulServices from "./pages/OverhaulServices";
import RFQ from "./pages/RFQ";
import Quotes from "./pages/Quotes";
import Cart from "./pages/Cart";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { AuthProvider } from "./context/AuthContext";
import AccountPage from "./pages/AccountPage";
import ProductDetails from "./pages/ProductDetails";
import VendorDetails from "./pages/VendorDetails";
import VendorProfile from "./pages/VendorProfile";
import VendorApply from "./pages/VendorApply";
import SubmitProduct from "./pages/SubmitProduct";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import AdminRoute from "./components/admin/AdminRoute";
import AdminLayout from "./components/admin/AdminLayout";
import { ThemeProvider } from "./context/ThemeContext";
import RequireRole from "./components/RequireRole";
import {
  AdminDashboard,
  AdminInventory,
  AdminCategories,
  AdminVendors,
  AdminRFQs,
  AdminQuotes,
  AdminMRO,
  AdminWarranty,
  AdminComplaints,
  AdminUsers,
  AdminSettings,
  AdminLogin,
  AdminOrders,
  AdminWarrantyClaims,
  AdminNotifications,
  AdminReviews,
} from "./pages/admin";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route element={<Layout />}>
                <Route path="/" element={<Index />} />
                <Route path="/products" element={<Products />} />
                <Route path="/vendors" element={<Vendors />} />
                <Route path="/vendors/:id" element={<VendorDetails />} />
                <Route path="/vendor/profile" element={
                  <RequireRole allowed={["VENDOR"]}>
                    <VendorProfile />
                  </RequireRole>
                } />
                <Route path="/vendor/submit-product" element={
                  <RequireRole allowed={["VENDOR"]}>
                    <SubmitProduct />
                  </RequireRole>
                } />
                <Route path="/vendor/apply" element={<VendorApply />} />
                <Route path="/products/:id" element={<ProductDetails />} />
                <Route path="/overhaul-services" element={<OverhaulServices />} />
                <Route
                  path="/rfq"
                  element={
                    <RequireRole allowed={["BUYER", "ADMIN"]}>
                      <RFQ />
                    </RequireRole>
                  }
                />
                <Route
                  path="/quotes"
                  element={
                    <RequireRole allowed={["VENDOR", "ADMIN"]}>
                      <Quotes />
                    </RequireRole>
                  }
                />
                <Route
                  path="/account"
                  element={
                    <RequireRole>
                      <AccountPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/cart"
                  element={
                    <RequireRole>
                      <Cart />
                    </RequireRole>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="inventory" element={<AdminInventory />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="vendors" element={<AdminVendors />} />
                  <Route path="rfqs" element={<AdminRFQs />} />
                  <Route path="quotes" element={<AdminQuotes />} />
                  <Route path="mro" element={<AdminMRO />} />
                  <Route path="warranty" element={<AdminWarranty />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="warranty-claims" element={<AdminWarrantyClaims />} />
                  <Route path="complaints" element={<AdminComplaints />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="notifications" element={<AdminNotifications />} />
                  <Route path="reviews" element={<AdminReviews />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
              </Route>
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
