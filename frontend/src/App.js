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

// Admin Layout
import AdminNavbar from './components/layout/AdminNavbar';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes with Navbar and Footer */}
          <Route path="/" element={
            <>
              <Navbar />
              <main className="flex-grow"><Home /></main>
              <Footer />
            </>
          } />
          <Route path="/login" element={
            <>
              <Navbar />
              <main className="flex-grow"><Login /></main>
              <Footer />
            </>
          } />
          <Route path="/register" element={
            <>
              <Navbar />
              <main className="flex-grow"><Register /></main>
              <Footer />
            </>
          } />
          <Route path="/forgot-password" element={
            <>
              <Navbar />
              <main className="flex-grow"><ForgotPassword /></main>
              <Footer />
            </>
          } />
          <Route path="/reset-password" element={
            <>
              <Navbar />
              <main className="flex-grow"><ResetPassword /></main>
              <Footer />
            </>
          } />
          <Route path="/faq" element={
            <>
              <Navbar />
              <main className="flex-grow"><FAQ /></main>
              <Footer />
            </>
          } />
          <Route path="/terms" element={
            <>
              <Navbar />
              <main className="flex-grow"><Terms /></main>
              <Footer />
            </>
          } />
          <Route path="/privacy" element={
            <>
              <Navbar />
              <main className="flex-grow"><Privacy /></main>
              <Footer />
            </>
          } />
          <Route path="/about" element={
            <>
              <Navbar />
              <main className="flex-grow"><About /></main>
              <Footer />
            </>
          } />
          
          {/* Admin Login - No Navbar/Footer */}
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* Admin Routes with AdminNavbar */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly={true}>
              <AdminNavbar />
              <main className="flex-grow"><AdminDashboard /></main>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute adminOnly={true}>
              <AdminNavbar />
              <main className="flex-grow"><AdminUsers /></main>
            </ProtectedRoute>
          } />
          <Route path="/admin/withdrawals" element={
            <ProtectedRoute adminOnly={true}>
              <AdminNavbar />
              <main className="flex-grow"><AdminWithdrawals /></main>
            </ProtectedRoute>
          } />
          <Route path="/admin/transactions" element={
            <ProtectedRoute adminOnly={true}>
              <AdminNavbar />
              <main className="flex-grow"><AdminTransactions /></main>
            </ProtectedRoute>
          } />
          
          {/* User Routes with Navbar and Footer */}
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
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
