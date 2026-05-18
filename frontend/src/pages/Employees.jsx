import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, User, Mail, Phone, Building, DollarSign } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/helpers';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'driver',
    warehouse_id: '',
    hourly_rate: '',
    password: '',
    aarto_violations: '0',
    prdp_expiry: '',
  });

  useEffect(() => {
    fetchEmployees();
    fetchWarehouses();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/warehouses');
      setWarehouses(response.data);
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee.employee_id}`, formData);
        toast.success('Employee updated successfully!');
      } else {
        await api.post('/employees', formData);
        toast.success('Employee created successfully!');
      }
      setShowModal(false);
      setEditingEmployee(null);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        role: 'driver',
        warehouse_id: '',
        hourly_rate: '',
        password: '',
        aarto_violations: '0',
        prdp_expiry: '',
      });
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save employee');
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      role: employee.role,
      warehouse_id: employee.warehouse_id || '',
      hourly_rate: employee.hourly_rate,
      password: '',
      aarto_violations: employee.aarto_violations !== undefined && employee.aarto_violations !== null ? employee.aarto_violations.toString() : '0',
      prdp_expiry: employee.prdp_expiry ? employee.prdp_expiry.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleDelete = async (employeeId) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await api.delete(`/employees/${employeeId}`);
        toast.success('Employee deleted successfully!');
        fetchEmployees();
      } catch (error) {
        toast.error('Failed to delete employee');
      }
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'badge-danger',
      driver: 'badge-info',
      finance: 'badge-warning',
      warehouse: 'badge-success',
    };
    return <span className={`badge ${badges[role] || 'badge-secondary'}`}>{role}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Employees</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Add Employee
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="card-body">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              className="input pl-10"
            />
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="card">
        <div className="card-body">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Warehouse</th>
                  <th>Hourly Rate</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.employee_id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <User size={16} className="text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium">{employee.first_name} {employee.last_name}</p>
                          <p className="text-xs text-gray-500">ID: {employee.employee_id}</p>
                          {employee.role === 'driver' && (
                            <div className="flex gap-2 mt-1 text-[10px] font-bold tracking-wider uppercase">
                              <span className={employee.prdp_expiry && new Date(employee.prdp_expiry) > new Date() ? "text-green-600 bg-green-50 px-1 rounded" : "text-red-600 bg-red-50 px-1 rounded"}>
                                PrDP: {employee.prdp_expiry ? employee.prdp_expiry.split('T')[0] : 'MISSING'}
                              </span>
                              <span className="text-gray-300">|</span>
                              <span className={parseInt(employee.aarto_violations) < 12 ? "text-slate-600 bg-slate-100 px-1 rounded" : "text-amber-600 bg-amber-50 px-1 rounded"}>
                                AARTO: {employee.aarto_violations || 0} pts
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-1">
                        <p className="text-sm flex items-center gap-1"><Mail size={12} /> {employee.email}</p>
                        {employee.phone && <p className="text-sm flex items-center gap-1"><Phone size={12} /> {employee.phone}</p>}
                      </div>
                    </td>
                    <td>{getRoleBadge(employee.role)}</td>
                    <td>{employee.warehouse_name || '-'}</td>
                    <td>{formatCurrency(employee.hourly_rate)}/hr</td>
                    <td>
                      <span className={`badge ${employee.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {employee.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(employee)} className="text-blue-600 hover:text-blue-800">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(employee.employee_id)} className="text-red-600 hover:text-red-800">
                          <Trash2 size={18} />
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

      {/* Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  required
                />
              </div>
              {!editingEmployee && (
                <div>
                  <label className="label">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              )}
              <div>
                <label className="label">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input"
                  required
                >
                  <option value="driver">Driver</option>
                  <option value="admin">Admin</option>
                  <option value="finance">Finance</option>
                  <option value="warehouse">Warehouse</option>
                </select>
              </div>
              <div>
                <label className="label">Warehouse</label>
                <select
                  value={formData.warehouse_id}
                  onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                  className="input"
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map(w => (
                    <option key={w.warehouse_id} value={w.warehouse_id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Hourly Rate</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                  className="input"
                  required
                />
              </div>
              {formData.role === 'driver' && (
                <div className="grid grid-cols-2 gap-4 border-t border-dashed pt-4 mt-2">
                  <div>
                    <label className="label">PrDP Expiry</label>
                    <input
                      type="date"
                      value={formData.prdp_expiry}
                      onChange={(e) => setFormData({ ...formData, prdp_expiry: e.target.value })}
                      className="input"
                      required={!editingEmployee}
                    />
                  </div>
                  <div>
                    <label className="label">AARTO Violations</label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={formData.aarto_violations}
                      onChange={(e) => setFormData({ ...formData, aarto_violations: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  {editingEmployee ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => {
                  setShowModal(false);
                  setEditingEmployee(null);
                }} className="btn-outline flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}