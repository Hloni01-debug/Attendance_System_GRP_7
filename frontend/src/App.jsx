import React, { useEffect } from 'react';  // ← ADDED useEffect here
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Deliveries from './pages/Deliveries';
import Parcels from './pages/Parcels';
import Vehicles from './pages/Vehicles';
import Employees from './pages/Employees';
import Payroll from './pages/Payroll';
import Warehouses from './pages/Warehouses';
import Reports from './pages/Reports';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { token, user } = useAuthStore();

  useEffect(() => {
    // Your useEffect logic here
    console.log('App initialized');
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!token ? <Login /> : <Navigate to="/dashboard" />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/deliveries" element={<Deliveries />} />
            <Route path="/parcels" element={<Parcels />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/warehouses" element={<Warehouses />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
        </Route>
        
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;