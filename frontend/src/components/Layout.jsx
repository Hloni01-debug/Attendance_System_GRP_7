import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Clock,
  Truck,
  Package,
  Car,
  Users,
  DollarSign,
  Warehouse,
  FileText,
  LogOut,
  Menu,
  X,
  Bell,
  User,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { getRoleColor, getRoleName } from '../utils/helpers';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'finance', 'driver', 'warehouse'] },
  { path: '/attendance', icon: Clock, label: 'Attendance', roles: ['admin', 'warehouse', 'finance'] },
  { path: '/deliveries', icon: Truck, label: 'Deliveries', roles: ['admin', 'driver', 'warehouse'] },
  { path: '/parcels', icon: Package, label: 'Parcels', roles: ['admin', 'driver', 'warehouse'] },
  { path: '/vehicles', icon: Car, label: 'Vehicles', roles: ['admin', 'finance'] },
  { path: '/employees', icon: Users, label: 'Employees', roles: ['admin', 'finance'] },
  { path: '/payroll', icon: DollarSign, label: 'Payroll', roles: ['admin', 'finance'] },
  { path: '/warehouses', icon: Warehouse, label: 'Warehouses', roles: ['admin', 'finance'] },
  { path: '/reports', icon: FileText, label: 'Reports', roles: ['admin', 'finance'] },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(user?.role || 'driver')
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            {sidebarOpen ? (
              <span className="text-xl font-bold text-blue-600">Liftex</span>
            ) : (
              <span className="text-xl font-bold text-blue-600">L</span>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded-lg hover:bg-gray-100"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {filteredNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''} ${!sidebarOpen && 'justify-center'}`
                }
              >
                <item.icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* User Info */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <User size={16} className="text-blue-600" />
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {getRoleName(user?.role)}
                  </p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-800">
              Welcome back, {user?.first_name}
            </h1>
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-2">
                <span className={`badge ${getRoleColor(user?.role)}`}>
                  {getRoleName(user?.role)}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}