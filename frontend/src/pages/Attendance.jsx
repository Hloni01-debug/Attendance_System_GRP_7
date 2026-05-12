import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Search, Filter, Download } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatDateTime, formatTimeOnly } from '../utils/helpers';

export default function Attendance() {
  const { user } = useAuthStore();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ date: '', employeeId: '' });
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    fetchAttendanceData();
    fetchEmployees();
    fetchTodayAttendance();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      const response = await api.get('/attendance');
      setAttendanceRecords(response.data);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
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

  const fetchTodayAttendance = async () => {
    try {
      const response = await api.get('/attendance/today');
      setTodayAttendance(response.data);
    } catch (error) {
      console.error('Failed to fetch today\'s attendance:', error);
    }
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await api.post('/attendance/check-in', {
        warehouse_id: user?.warehouse_id,
      });
      toast.success('Check-in successful!');
      fetchTodayAttendance();
      fetchAttendanceData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Check-in failed');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      await api.post('/attendance/check-out');
      toast.success('Check-out successful!');
      fetchTodayAttendance();
      fetchAttendanceData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Check-out failed');
    } finally {
      setCheckingOut(false);
    }
  };

  const getStatusBadge = (record) => {
    if (record.check_in && !record.check_out) {
      return <span className="badge badge-warning">Active</span>;
    }
    if (record.check_in && record.check_out) {
      return <span className="badge badge-success">Completed</span>;
    }
    return <span className="badge badge-secondary">Absent</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today's Attendance Card for Drivers */}
      {user?.role === 'driver' && (
        <div className="card">
          <div className="card-header">Today's Attendance</div>
          <div className="card-body">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Today's Date</p>
                  <p className="font-medium">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
              
              {todayAttendance ? (
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Check-in Time</p>
                    <p className="font-medium">{formatTimeOnly(todayAttendance.check_in)}</p>
                  </div>
                  {todayAttendance.check_out && (
                    <div>
                      <p className="text-sm text-gray-500">Check-out Time</p>
                      <p className="font-medium">{formatTimeOnly(todayAttendance.check_out)}</p>
                    </div>
                  )}
                  {todayAttendance.hours_worked && (
                    <div>
                      <p className="text-sm text-gray-500">Hours Worked</p>
                      <p className="font-medium">{todayAttendance.hours_worked}</p>
                    </div>
                  )}
                  <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">
                    {todayAttendance.check_out ? 'Shift Completed' : 'Shift Active'}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">Not checked in yet</div>
              )}
              
              <div className="flex gap-3">
                {!todayAttendance?.check_in && (
                  <button
                    onClick={handleCheckIn}
                    disabled={checkingIn}
                    className="btn-primary flex items-center gap-2"
                  >
                    {checkingIn ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <CheckCircle size={18} />
                    )}
                    Check In
                  </button>
                )}
                {todayAttendance?.check_in && !todayAttendance?.check_out && (
                  <button
                    onClick={handleCheckOut}
                    disabled={checkingOut}
                    className="btn-secondary flex items-center gap-2"
                  >
                    {checkingOut ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <XCircle size={18} />
                    )}
                    Check Out
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <span>Attendance Records</span>
            <div className="flex gap-3">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={filter.date}
                  onChange={(e) => setFilter({ ...filter, date: e.target.value })}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {user?.role !== 'driver' && (
                <select
                  value={filter.employeeId}
                  onChange={(e) => setFilter({ ...filter, employeeId: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.first_name} {emp.last_name}
                    </option>
                  ))}
                </select>
              )}
              <button className="btn-outline flex items-center gap-2">
                <Download size={18} />
                Export
              </button>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours Worked</th>
                  <th>Warehouse</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((record) => (
                  <tr key={record.attendance_id}>
                    <td className="font-medium">{record.employee_name}</td>
                    <td>{formatDateTime(record.check_in, 'MMM dd, yyyy')}</td>
                    <td>{formatTimeOnly(record.check_in)}</td>
                    <td>{record.check_out ? formatTimeOnly(record.check_out) : '-'}</td>
                    <td>{record.hours_worked || '-'}</td>
                    <td>{record.warehouse_name}</td>
                    <td>{getStatusBadge(record)}</td>
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