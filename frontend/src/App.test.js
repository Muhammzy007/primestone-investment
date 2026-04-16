import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Test each component individually
const TestComponent = ({ name, Component }) => {
  const [error, setError] = useState(null);
  
  useEffect(() => {
    console.log(`Testing ${name}`);
  }, []);

  try {
    return <Component />;
  } catch (err) {
    return (
      <div style={{ color: 'red', padding: '10px', border: '1px solid red', margin: '10px' }}>
        <h3>Error in {name}:</h3>
        <pre>{err.toString()}</pre>
      </div>
    );
  }
};

// Import components one by one to isolate the error
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Investments from './pages/Investments';
import InvestmentDetail from './pages/InvestmentDetail';
import Payments from './pages/Payments';
import Withdrawals from './pages/Withdrawals';
import WithdrawalDetail from './pages/WithdrawalDetail';
import Profile from './pages/Profile';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminWithdrawals from './pages/admin/AdminWithdrawals';
import AdminTransactions from './pages/admin/AdminTransactions';
import AdminSettings from './pages/admin/AdminSettings';
import Navbar from './components/layout/Navbar';
import AdminNavbar from './components/layout/AdminNavbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Component Test Page</h1>
      
      <h2>Testing Individual Components:</h2>
      
      <div style={{ display: 'grid', gap: '20px' }}>
        <div>
          <h3>Home Component:</h3>
          <TestComponent name="Home" Component={Home} />
        </div>
        
        <div>
          <h3>Login Component:</h3>
          <TestComponent name="Login" Component={Login} />
        </div>
        
        <div>
          <h3>Register Component:</h3>
          <TestComponent name="Register" Component={Register} />
        </div>
        
        <div>
          <h3>Dashboard Component:</h3>
          <TestComponent name="Dashboard" Component={Dashboard} />
        </div>
        
        <div>
          <h3>Investments Component:</h3>
          <TestComponent name="Investments" Component={Investments} />
        </div>
        
        <div>
          <h3>Navbar Component:</h3>
          <TestComponent name="Navbar" Component={Navbar} />
        </div>
        
        <div>
          <h3>AdminNavbar Component:</h3>
          <TestComponent name="AdminNavbar" Component={AdminNavbar} />
        </div>
        
        <div>
          <h3>Footer Component:</h3>
          <TestComponent name="Footer" Component={Footer} />
        </div>
      </div>
    </div>
  );
}

export default App;
