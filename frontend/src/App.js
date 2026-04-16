import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context
import { AuthProvider } from './context/AuthContext';

// Components
import ScrollToTop from './components/ScrollToTop';

// Layout Components
import Navbar from './components/layout/Navbar';
import AdminNavbar from './components/layout/AdminNavbar';
import Footer from './components/layout/Footer';

// Page Components
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Investments from './pages/Investments';
import CreateInvestment from './pages/CreateInvestment';
import InvestmentDetail from './pages/InvestmentDetail';
import Payments from './pages/Payments';
import Withdrawals from './pages/Withdrawals';
import WithdrawalDetail from './pages/WithdrawalDetail';
import Profile from './pages/Profile';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import FAQ from './pages/FAQ';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminWithdrawals from './pages/admin/AdminWithdrawals';
import AdminTransactions from './pages/admin/AdminTransactions';
import AdminSettings from './pages/admin/AdminSettings';

// Protected Route
import ProtectedRoute from './components/ProtectedRoute';

// Layout wrapper components
const UserLayout = ({ children }) => (
  <>
    <Navbar />
    <main className="flex-grow">{children}</main>
    <Footer />
  </>
);

const AdminLayout = ({ children }) => (
  <>
    <AdminNavbar />
    <main className="flex-grow">{children}</main>
  </>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white flex flex-col">
          <Toaster position="top-right" />
          
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<UserLayout><Home /></UserLayout>} />
            <Route path="/about" element={<UserLayout><About /></UserLayout>} />
            <Route path="/login" element={<UserLayout><Login /></UserLayout>} />
            <Route path="/register" element={<UserLayout><Register /></UserLayout>} />
            <Route path="/terms" element={<UserLayout><Terms /></UserLayout>} />
            <Route path="/privacy" element={<UserLayout><Privacy /></UserLayout>} />
            <Route path="/faq" element={<UserLayout><FAQ /></UserLayout>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            
            {/* Protected User Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <UserLayout><Dashboard /></UserLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/investments" element={
              <ProtectedRoute>
                <UserLayout><Investments /></UserLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/investments/new" element={
              <ProtectedRoute>
                <UserLayout><CreateInvestment /></UserLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/investments/:id" element={
              <ProtectedRoute>
                <UserLayout><InvestmentDetail /></UserLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/payments" element={
              <ProtectedRoute>
                <UserLayout><Payments /></UserLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/withdrawals" element={
              <ProtectedRoute>
                <UserLayout><Withdrawals /></UserLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/withdrawals/:id" element={
              <ProtectedRoute>
                <UserLayout><WithdrawalDetail /></UserLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <UserLayout><Profile /></UserLayout>
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute adminOnly={true}>
                <AdminLayout><AdminDashboard /></AdminLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/users" element={
              <ProtectedRoute adminOnly={true}>
                <AdminLayout><AdminUsers /></AdminLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/withdrawals" element={
              <ProtectedRoute adminOnly={true}>
                <AdminLayout><AdminWithdrawals /></AdminLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/transactions" element={
              <ProtectedRoute adminOnly={true}>
                <AdminLayout><AdminTransactions /></AdminLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/settings" element={
              <ProtectedRoute adminOnly={true}>
                <AdminLayout><AdminSettings /></AdminLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
