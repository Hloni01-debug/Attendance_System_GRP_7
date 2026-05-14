import React, { useState, useEffect } from 'react';
import {
  Users,
  Truck,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeDeliveries: 0,
    parcelsToday: 0,
    monthlyRevenue: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [deliveryTrends, setDeliveryTrends] = useState([]);
  const [parcelStatus, setParcelStatus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activityRes, trendsRes, statusRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/recent-activity'),
        api.get('/dashboard/delivery-trends'),
        api.get('/dashboard/parcel-status'),
      ]);
      setStats(statsRes.data);
      setRecentActivity(activityRes.data);
      setDeliveryTrends(trendsRes.data);
      setParcelStatus(statusRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
    },
    {
      title: 'Active Deliveries',
      value: stats.activeDeliveries,
      icon: Truck,
      color: 'bg-green-500',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
    },
    {
      title: "Today's Parcels",
      value: stats.parcelsToday,
      icon: Package,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats.monthlyRevenue),
      icon: DollarSign,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-600',
    },
  ];

  const PARCEL_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">
          Welcome back, {user?.first_name}!
        </h2>
        <p className="text-blue-100 mt-1">
          Here's what's happening with your delivery operations today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-xl`}>
                <stat.icon className={`${stat.textColor}`} size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Trends */}
        <div className="card">
          <div className="card-header">Delivery Trends (Last 7 Days)</div>
          <div className="card-body">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={deliveryTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="deliveries" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="parcels" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Parcel Status Distribution */}
        <div className="card">
          <div className="card-header">Parcel Status Distribution</div>
          <div className="card-body">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={parcelStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {parcelStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PARCEL_COLORS[index % PARCEL_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">Recent Activity</div>
        <div className="card-body">
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  {activity.type === 'delivery' && <CheckCircle size={20} className="text-green-500" />}
                  {activity.type === 'attendance' && <Clock size={20} className="text-blue-500" />}
                  {activity.type === 'alert' && <AlertCircle size={20} className="text-red-500" />}
                  <div>
                    <p className="text-sm text-gray-800">{activity.description}</p>
                    <p className="text-xs text-gray-400">{formatDate(activity.timestamp)}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{activity.user}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}