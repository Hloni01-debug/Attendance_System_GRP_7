
import React, { useState } from 'react';
import { FileText, Download, Filter, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';

export default function Reports() {
  const [reportType, setReportType] = useState('delivery');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // ALL DATA IS PLACEHOLDER DATA FOR NOW. COULDNT IMPLEMENT IN TIME
  const deliveryData = [
    { month: 'Jan', deliveries: 1245, revenue: 45600 },
    { month: 'Feb', deliveries: 1380, revenue: 51200 },
    { month: 'Mar', deliveries: 1420, revenue: 53800 },
    { month: 'Apr', deliveries: 1300, revenue: 48900 },
    { month: 'May', deliveries: 1580, revenue: 60100 },
    { month: 'Jun', deliveries: 1650, revenue: 62900 },
  ];

  const employeePerformance = [
    { name: 'John Doe', deliveries: 342, rating: 4.8 },
    { name: 'Jane Smith', deliveries: 298, rating: 4.9 },
    { name: 'Mike Johnson', deliveries: 276, rating: 4.7 },
    { name: 'Sarah Williams', deliveries: 310, rating: 4.8 },
    { name: 'David Brown', deliveries: 264, rating: 4.6 },
  ];

  const fuelEfficiency = [
    { name: 'Jan', efficiency: 12.5 },
    { name: 'Feb', efficiency: 12.8 },
    { name: 'Mar', efficiency: 13.2 },
    { name: 'Apr', efficiency: 12.9 },
    { name: 'May', efficiency: 13.5 },
    { name: 'Jun', efficiency: 13.8 },
  ];

  const parcelStatusData = [
    { name: 'Delivered', value: 12450, color: '#10b981' },
    { name: 'In Transit', value: 2340, color: '#f59e0b' },
    { name: 'Pending', value: 1890, color: '#6b7280' },
    { name: 'Failed', value: 450, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
        <button className="btn-primary flex items-center gap-2">
          <Download size={18} />
          Export Report
        </button>
      </div>

      {/* Report Controls */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="label">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="input"
              >
                <option value="delivery">Delivery Performance</option>
                <option value="employee">Employee Performance</option>
                <option value="fuel">Fuel Efficiency</option>
                <option value="parcel">Parcel Analytics</option>
                <option value="financial">Financial Summary</option>
              </select>
            </div>
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">&nbsp;</label>
              <button className="btn-secondary flex items-center gap-2">
                <Filter size={18} />
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Performance Report */}
      {reportType === 'delivery' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-header flex items-center gap-2">
                <BarChart3 size={18} />
                Deliveries Overview
              </div>
              <div className="card-body">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deliveryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="deliveries" fill="#3b82f6" name="Deliveries" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-header flex items-center gap-2">
                <TrendingUp size={18} />
                Revenue Trends
              </div>
              <div className="card-body">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={deliveryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `R${value.toLocaleString()}`} />
                      <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header">Monthly Summary</div>
            <div className="card-body">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Total Deliveries</th>
                      <th>Revenue</th>
                      <th>Avg per Delivery</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveryData.map((item) => (
                      <tr key={item.month}>
                        <td>{item.month}</td>
                        <td>{item.deliveries.toLocaleString()}</td>
                        <td>R{item.revenue.toLocaleString()}</td>
                        <td>R{(item.revenue / item.deliveries).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Performance Report */}
      {reportType === 'employee' && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">Top Performing Employees</div>
            <div className="card-body">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Deliveries Completed</th>
                      <th>Customer Rating</th>
                      <th>Performance Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeePerformance.map((emp) => (
                      <tr key={emp.name}>
                        <td className="font-medium">{emp.name}</td>
                        <td>{emp.deliveries}</td>
                        <td>
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">★</span>
                            {emp.rating}
                          </div>
                        </td>
                        <td>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 rounded-full h-2"
                              style={{ width: `${(emp.rating / 5) * 100}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fuel Efficiency Report */}
      {reportType === 'fuel' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-header">Fuel Efficiency (km/L)</div>
              <div className="card-body">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={fuelEfficiency}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="efficiency" stroke="#f59e0b" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-header">Fuel Efficiency Stats</div>
              <div className="card-body">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Average Efficiency:</span>
                    <span className="font-bold">13.1 km/L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Best Month:</span>
                    <span className="font-bold">June (13.8 km/L)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Improvement:</span>
                    <span className="text-green-600">+10.4%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Parcel Analytics */}
      {reportType === 'parcel' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <PieChart size={18} />
              Parcel Status Distribution
            </div>
            <div className="card-body">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={parcelStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {parcelStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => value.toLocaleString()} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header">Parcel Statistics</div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Parcels:</span>
                  <span className="font-bold">17,130</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery Success Rate:</span>
                  <span className="font-bold text-green-600">92.7%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Average Delivery Time:</span>
                  <span className="font-bold">2.4 days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">On-time Deliveries:</span>
                  <span className="font-bold">89.3%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}