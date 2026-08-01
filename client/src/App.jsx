import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';

// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import RegisterBusiness from '@/pages/RegisterBusiness';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// App pages
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import POS from '@/pages/POS';
import Inventory from '@/pages/Inventory';
import Transactions from '@/pages/Transactions';
import Reports from '@/pages/Reports';
import Customers from '@/pages/Customers';
import StaffHub from '@/pages/StaffHub';
import Settings from '@/pages/Settings';
import EtimsCompliance from '@/pages/EtimsCompliance';
import Employees from '@/pages/Employees';
import MyShifts from '@/pages/MyShifts';
import EmployeeProfile from '@/pages/EmployeeProfile';
import Onboarding from '@/pages/Onboarding';
import ShiftAudits from '@/pages/ShiftAudits';
import Expenses from '@/pages/Expenses';
import Features from '@/pages/Features';
import PurchaseOrders from '@/pages/PurchaseOrders';
import Promotions from '@/pages/Promotions';
import EmployeeScheduling from '@/pages/EmployeeScheduling';
import CashFlow from '@/pages/CashFlow';
import Suppliers from '@/pages/Suppliers';
import AdvancedReports from '@/pages/AdvancedReports';
import StaffPerformance from '@/pages/StaffPerformance';
import HardwareRequirements from '@/pages/HardwareRequirements';
import ReceiptersEngine from '@/pages/admin/ReceiptersEngine';
import ReceiptersVaultHub from '@/pages/admin/ReceiptersVaultHub';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, user } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground font-medium">Loading DukaPOS...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
  }

  // If authenticated but tenant hasn't completed onboarding, always redirect to /onboarding
  const needsOnboarding = user && user.tenant && user.tenant.is_onboarded === false;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/register-business" element={<RegisterBusiness />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      {/* Onboarding: full-page, no sidebar, protected */}
      <Route path="/onboarding" element={<Onboarding />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        {/* Redirect to onboarding if tenant not yet onboarded */}
        {needsOnboarding && <Route path="*" element={<Navigate to="/onboarding" replace />} />}
        <Route element={<AppLayout />}>
          {/* ── Shared routes (admin + cashier) ── */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/my-shifts" element={<MyShifts />} />
          <Route path="/features" element={<Features />} />
          <Route path="/hardware-requirements" element={<HardwareRequirements />} />

          {/* ── Admin-only routes ── */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<Navigate to="/" replace />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/advanced-reports" element={<AdvancedReports />} />
            <Route path="/cash-flow" element={<CashFlow />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/promotions" element={<Promotions />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/staff" element={<StaffHub />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/employees/profile" element={<EmployeeProfile />} />
            <Route path="/employee-scheduling" element={<EmployeeScheduling />} />
            <Route path="/shift-audits" element={<ShiftAudits />} />
            <Route path="/staff-performance" element={<StaffPerformance />} />
            <Route path="/etims" element={<EtimsCompliance />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin/receipters-engine" element={<ReceiptersEngine />} />
            <Route path="/admin/receipters-vault" element={<ReceiptersVaultHub />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <ErrorBoundary>
            <AuthenticatedApp />
          </ErrorBoundary>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App