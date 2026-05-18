import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Car, Wrench, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    plate_number: '',
    make: '',
    model: '',
    year: '',
    capacity_kg: '',
    status: 'available',
    warehouse_id: '',
    registration_expiry: '',
    cof_expiry: '',
  });

  useEffect(() => {
    fetchVehicles();
    fetchWarehouses();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      setVehicles(response.data);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
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
      if (editingVehicle) {
        await api.put(`/vehicles/${editingVehicle.vehicle_id}`, formData);
        toast.success('Vehicle updated successfully!');
      } else {
        await api.post('/vehicles', formData);
        toast.success('Vehicle added successfully!');
      }
      setShowModal(false);
      setEditingVehicle(null);
      setFormData({
        plate_number: '',
        make: '',
        model: '',
        year: '',
        capacity_kg: '',
        status: 'available',
        warehouse_id: '',
        registration_expiry: '',
        cof_expiry: '',
      });
      fetchVehicles();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save vehicle');
    }
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      plate_number: vehicle.plate_number,
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || '',
      capacity_kg: vehicle.capacity_kg || '',
      status: vehicle.status,
      warehouse_id: vehicle.warehouse_id || '',
      registration_expiry: vehicle.registration_expiry ? vehicle.registration_expiry.split('T')[0] : '',
      cof_expiry: vehicle.cof_expiry ? vehicle.cof_expiry.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleDelete = async (vehicleId) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await api.delete(`/vehicles/${vehicleId}`);
        toast.success('Vehicle deleted successfully!');
        fetchVehicles();
      } catch (error) {
        toast.error('Failed to delete vehicle');
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      available: 'badge-success',
      in_use: 'badge-warning',
      maintenance: 'badge-danger',
    };
    return <span className={`badge ${badges[status] || 'badge-secondary'}`}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Fleet Management</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Add Vehicle
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Vehicles</p>
              <p className="text-2xl font-bold">{vehicles.length}</p>
            </div>
            <Car size={24} className="text-blue-500" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Available</p>
              <p className="text-2xl font-bold text-green-600">
                {vehicles.filter(v => v.status === 'available').length}
              </p>
            </div>
            <CheckCircle size={24} className="text-green-500" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">In Use</p>
              <p className="text-2xl font-bold text-yellow-600">
                {vehicles.filter(v => v.status === 'in_use').length}
              </p>
            </div>
            <AlertCircle size={24} className="text-yellow-500" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Maintenance</p>
              <p className="text-2xl font-bold text-red-600">
                {vehicles.filter(v => v.status === 'maintenance').length}
              </p>
            </div>
            <Wrench size={24} className="text-red-500" />
          </div>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="card">
        <div className="card-body">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Plate Number</th>
                  <th>Vehicle</th>
                  <th>Year</th>
                  <th>Capacity (kg)</th>
                  <th>Warehouse</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.vehicle_id}>
                    <td>
                      <div className="font-mono font-medium text-gray-900">{vehicle.plate_number}</div>
                      <div className="flex gap-2 mt-1 text-[10px] font-bold tracking-wider uppercase">
                        <span className={vehicle.license_status === 'VALID' ? "text-green-600 bg-green-50 px-1 rounded" : "text-red-600 bg-red-50 px-1 rounded"}>
                          Reg: {vehicle.license_status || 'VALID'}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className={vehicle.roadworthy_status === 'VALID' ? "text-green-600 bg-green-50 px-1 rounded" : "text-red-600 bg-red-50 px-1 rounded"}>
                          COF: {vehicle.roadworthy_status || 'VALID'}
                        </span>
                      </div>
                    </td>
                    <td>{vehicle.make} {vehicle.model}</td>
                    <td>{vehicle.year}</td>
                    <td>{vehicle.capacity_kg?.toLocaleString() || '-'}</td>
                    <td>{vehicle.warehouse_name || '-'}</td>
                    <td>
                      <div>
                        {getStatusBadge(vehicle.status)}
                        {vehicle.vehicle_readiness && vehicle.vehicle_readiness !== 'FIT FOR DISPATCH' && (
                          <div className="text-[10px] text-red-500 font-semibold mt-1 uppercase tracking-wide">
                            {vehicle.vehicle_readiness}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(vehicle)} className="text-blue-600 hover:text-blue-800">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(vehicle.vehicle_id)} className="text-red-600 hover:text-red-800">
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

      {/* Vehicle Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Plate Number</label>
                <input
                  type="text"
                  value={formData.plate_number}
                  onChange={(e) => setFormData({ ...formData, plate_number: e.target.value.toUpperCase() })}
                  className="input"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Make</label>
                  <input
                    type="text"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Model</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Year</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Capacity (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.capacity_kg}
                    onChange={(e) => setFormData({ ...formData, capacity_kg: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              
              <div className="grid grid-cols-2 gap-4 border-t border-dashed pt-4 mt-2">
                <div>
                  <label className="label">Registration Expiry</label>
                  <input
                    type="date"
                    value={formData.registration_expiry}
                    onChange={(e) => setFormData({ ...formData, registration_expiry: e.target.value })}
                    className="input"
                    required={!editingVehicle}
                  />
                </div>
                <div>
                  <label className="label">COF Expiry</label>
                  <input
                    type="date"
                    value={formData.cof_expiry}
                    onChange={(e) => setFormData({ ...formData, cof_expiry: e.target.value })}
                    className="input"
                    required={!editingVehicle}
                  />
                </div>
              </div>

              <div>
                <label className="label">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input"
                  required
                >
                  <option value="available">Available</option>
                  <option value="in_use">In Use</option>
                  <option value="maintenance">Maintenance</option>
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
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  {editingVehicle ? 'Update' : 'Add'}
                </button>
                <button type="button" onClick={() => {
                  setShowModal(false);
                  setEditingVehicle(null);
                }} className="btn-outline flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}