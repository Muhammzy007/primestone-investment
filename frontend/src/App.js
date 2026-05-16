import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

// Layout Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import FAQ from './pages/FAQ';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import About from './pages/About';

// User Pages
import Dashboard from './pages/Dashboard';
import Investments from './pages/Investments';
import CreateInvestment from './pages/CreateInvestment';
import InvestmentDetail from './pages/InvestmentDetail';
import Payments from './pages/Payments';
import Withdrawals from './pages/Withdrawals';
import Profile from './pages/Profile';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminWithdrawals from './pages/admin/AdminWithdrawals';
import AdminTransactions from './pages/admin/AdminTransactions';

// Protected Route Component
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <div className="min-h-screen bg-gradient-to-b from-primestone-50 to-white flex flex-col">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/about" element={<About />} />
            
            {/* Admin Login - No Layout */}
            <Route path="/admin/login" element={<AdminLogin />} />
            
            {/* Admin Routes - No Navbar/Footer */}
            <Route path="/admin" element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute adminOnly={true}>
                <AdminUsers />
              </ProtectedRoute>
            } />
            <Route path="/admin/withdrawals" element={
              <ProtectedRoute adminOnly={true}>
                <AdminWithdrawals />
              </ProtectedRoute>
            } />
            <Route path="/admin/transactions" element={
              <ProtectedRoute adminOnly={true}>
                <AdminTransactions />
              </ProtectedRoute>
            } />
            
            {/* User Routes with Layout */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Navbar />
                <main className="flex-grow"><Dashboard /></main>
                <Footer />
              </ProtectedRoute>
            } />
            <Route path="/investments" element={
              <ProtectedRoute>
                <Navbar />
                <main className="flex-grow"><Investments /></main>
                <Footer />
              </ProtectedRoute>
            } />
            <Route path="/investments/new" element={
              <ProtectedRoute>
                <Navbar />
                <main className="flex-grow"><CreateInvestment /></main>
                <Footer />
              </ProtectedRoute>
            } />
            <Route path="/investments/:id" element={
              <ProtectedRoute>
                <Navbar />
                <main className="flex-grow"><InvestmentDetail /></main>
                <Footer />
              </ProtectedRoute>
            } />
            <Route path="/payments" element={
              <ProtectedRoute>
                <Navbar />
                <main className="flex-grow"><Payments /></main>
                <Footer />
              </ProtectedRoute>
            } />
            <Route path="/withdrawals" element={
              <ProtectedRoute>
                <Navbar />
                <main className="flex-grow"><Withdrawals /></main>
                <Footer />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Navbar />
                <main className="flex-grow"><Profile /></main>
                <Footer />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
