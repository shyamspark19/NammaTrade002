import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AuthForm } from "@/components/auth/AuthForm";
import { RoleRoute } from "@/components/routing/RoleRoute";
import NotFound from "./pages/NotFound";
import RoleSelection from "./pages/RoleSelection";
import Home from "./pages/Home";
import Support from "./pages/Support";
import Terms from "./pages/Terms";
import ProfileSettings from "./pages/shared/ProfileSettings";
import Privacy from "./pages/shared/Privacy";
import PaymentSettings from "./pages/shared/PaymentSettings";
import HistoricalLogs from "./pages/shared/HistoricalLogs";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminActivity from "./pages/admin/AdminActivity";
import AdminHistory from "./pages/admin/AdminHistory";
import AdminProducts from "./pages/admin/AdminProducts";

// Warehouse Pages
import WarehouseDashboard from "./pages/warehouse/WarehouseDashboard";
import WarehouseOrders from "./pages/warehouse/WarehouseOrders";
import WarehouseInventory from "./pages/warehouse/WarehouseInventory";
import WarehouseVendors from "./pages/warehouse/WarehouseVendors";
import WarehouseWholesale from "./pages/warehouse/WarehouseWholesale";
import WarehouseRetail from "./pages/warehouse/WarehouseRetail";

// Vendor Pages
import VendorDashboard from "./pages/vendor/VendorDashboard";
import VendorProducts from "./pages/vendor/VendorProducts";
import VendorPricing from "./pages/vendor/VendorPricing";
import VendorOrders from "./pages/vendor/VendorOrders";
import VendorAnalytics from "./pages/vendor/VendorAnalytics";
import VendorMaterialShop from "./pages/vendor/VendorMaterialShop";

// Consumer Pages
import ConsumerDashboard from "./pages/consumer/ConsumerDashboard";
import ConsumerShop from "./pages/consumer/ConsumerShop";
import ConsumerOrders from "./pages/consumer/ConsumerOrders";
import ConsumerTracking from "./pages/consumer/ConsumerTracking";
import ConsumerNotifications from "./pages/consumer/ConsumerNotifications";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading, roles } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Determine dashboard redirect based on role
  const getDashboardRedirect = () => {
    if (!user) return <Navigate to="/auth" replace />;
    if (roles.length === 0) return <RoleSelection />;
    if (roles.includes('admin')) return <Navigate to="/admin" replace />;
    if (roles.includes('warehouse')) return <Navigate to="/warehouse" replace />;
    if (roles.includes('vendor')) return <Navigate to="/vendor" replace />;
    return <Navigate to="/consumer" replace />;
  };

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<Home />} />
      <Route path="/support" element={<Support />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/auth" element={user ? getDashboardRedirect() : <AuthForm />} />

      {/* Dashboard Top-level Redirect */}
      <Route path="/dashboard" element={getDashboardRedirect()} />
      <Route path="/profile" element={user ? <ProfileSettings /> : <Navigate to="/auth" replace />} />
      <Route path="/privacy" element={user ? <Privacy /> : <Navigate to="/auth" replace />} />
      <Route path="/payment" element={user ? <PaymentSettings /> : <Navigate to="/auth" replace />} />
      <Route path="/history" element={user ? <HistoricalLogs /> : <Navigate to="/auth" replace />} />

      {/* Admin Section */}
      <Route path="/admin" element={<RoleRoute requiredRole="admin" />}>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="activity" element={<AdminActivity />} />
        <Route path="history" element={<AdminHistory />} />
      </Route>

      {/* Warehouse Section */}
      <Route path="/warehouse" element={<RoleRoute requiredRole="warehouse" />}>
        <Route index element={<WarehouseDashboard />} />
        <Route path="orders" element={<WarehouseOrders />} />
        <Route path="inventory" element={<WarehouseInventory />} />
        <Route path="vendors" element={<WarehouseVendors />} />
        <Route path="wholesale" element={<WarehouseWholesale />} />
        <Route path="retail" element={<WarehouseRetail />} />
      </Route>

      {/* Vendor Section */}
      <Route path="/vendor" element={<RoleRoute requiredRole="vendor" />}>
        <Route index element={<VendorDashboard />} />
        <Route path="products" element={<VendorProducts />} />
        <Route path="pricing" element={<VendorPricing />} />
        <Route path="orders" element={<VendorOrders />} />
        <Route path="analytics" element={<VendorAnalytics />} />
        <Route path="material" element={<VendorMaterialShop />} />
      </Route>

      {/* Consumer Section */}
      <Route path="/consumer" element={<RoleRoute requiredRole="consumer" />}>
        <Route index element={<ConsumerDashboard />} />
        <Route path="shop" element={<ConsumerShop />} />
        <Route path="orders" element={<ConsumerOrders />} />
        <Route path="tracking" element={<ConsumerTracking />} />
        <Route path="notifications" element={<ConsumerNotifications />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
