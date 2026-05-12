import React, { useState, useEffect } from 'react';
import { DollarSign, FileText, CheckCircle, AlertCircle, Download, Search } from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function Payroll() {
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [stats, setStats] = useState({
    totalPayroll: 0,
    totalHours: 0,
    totalBonuses: 0,
    totalDeductions: 0,
  });

  useEffect(() => {
    fetchPayrollRecords();
    fetchEmployees();
  }, []);

  const fetchPayrollRecords = async () => {
    try {
      const response = await api.get('/payroll');
      setPayrollRecords(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error('Failed to fetch payroll:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const calculateStats = (records) => {
    setStats({
      totalPayroll: records.reduce((sum, r) => sum + (r.net_pay || 0), 0),
      totalHours: records.reduce((sum, r) => sum + (r.total_hours || 0), 0),
      totalBonuses: records.reduce((sum, r) => sum + (r.bonus || 0), 0),
      totalDeductions: records.reduce((sum, r) => sum + (r.deductions || 0), 0),
    });
  };

  const handleApprovePayroll = async (payrollId) => {
    try {
      await api.put(`/payroll/${payrollId}/approve`);
      toast.success('Payroll approved successfully!');
      fetchPayrollRecords();
    } catch (error) {
      toast.error('Failed to approve payroll');
    }
  };

  const handleProcessPayment = async (payrollId) => {
    try {
      await api.put(`/payroll/${payrollId}/pay`);
      toast.success('Payment processed successfully!');
      fetchPayrollRecords();
    } catch (error) {
      toast.error('Failed to process payment');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'badge-secondary',
      approved: 'badge-warning',
      paid: 'badge-success',
    };
    return <span className={`badge ${badges[status] || 'badge-secondary'}`}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Payroll Management</h1>
        <button className="btn-primary flex items-center gap-2">
          <FileText size={18} />
          Generate New Payroll
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Payroll</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalPayroll)}</p>
            </div>
            <DollarSign size={24} className="text-blue-500" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Hours</p>
              <p className="text-2xl font-bold">{stats.totalHours.toFixed(1)}</p>
            </div>
            <FileText size={24} className="text-gray-500" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Bonuses</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalBonuses)}</p>
            </div>
            <CheckCircle size={24} className="text-green-500" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Deductions</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalDeductions)}</p>
            </div>
            <AlertCircle size={24} className="text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by employee..."
                className="input pl-10"
              />
            </div>
            <select className="input w-48">
              <option value="">All Periods</option>
              <option value="2024-01">January 2024</option>
              <option value="2024-02">February 2024</option>
              <option value="2024-03">March 2024</option>
            </select>
            <select className="input w-40">
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
            </select>
            <button className="btn-outline flex items-center gap-2">
              <Download size={18} />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="card">
        <div className="card-body">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Period</th>
                  <th>Hours</th>
                  <th>Rate</th>
                  <th>Base Pay</th>
                  <th>Bonus</th>
                  <th>Deductions</th>
                  <th>Net Pay</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payrollRecords.map((record) => (
                  <tr key={record.payroll_id}>
                    <td className="font-medium">{record.employee_name}</td>
                    <td>{formatDate(record.period_start)} - {formatDate(record.period_end)}</td>
                    <td>{record.total_hours.toFixed(1)}</td>
                    <td>{formatCurrency(record.hourly_rate)}</td>
                    <td>{formatCurrency(record.base_pay)}</td>
                    <td className="text-green-600">{formatCurrency(record.bonus)}</td>
                    <td className="text-red-600">{formatCurrency(record.deductions)}</td>
                    <td className="font-bold">{formatCurrency(record.net_pay)}</td>
                    <td>{getStatusBadge(record.status)}</td>
                    <td>
                      <div className="flex gap-2">
                        {record.status === 'draft' && (
                          <button
                            onClick={() => handleApprovePayroll(record.payroll_id)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Approve
                          </button>
                        )}
                        {record.status === 'approved' && (
                          <button
                            onClick={() => handleProcessPayment(record.payroll_id)}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Pay
                          </button>
                        )}
                        <button className="text-gray-400 hover:text-gray-600">
                          <FileText size={16} />
                        </button>
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
  );
}