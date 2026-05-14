import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, MapPin, Package, Truck, Clock } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import { formatDateTime } from '../utils/helpers';

export default function Deliveries() {
  const { user } = useAuthStore();
  const [shifts, setShifts] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    warehouse_id: user?.warehouse_id || '',
    start_time: '',
    route_notes: '',
  });

  useEffect(() => {
    fetchShifts();
    fetchVehicles();
  }, []);

  const fetchShifts = async () => {
    try {
      const response = await api.get('/delivery-shifts');
      setShifts(response.data);
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      setVehicles(response.data.filter(v => v.status === 'available'));
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
    }
  };

  const handleCreateShift = async (e) => {
    e.preventDefault();
    try {
      await api.post('/delivery-shifts', formData);
      toast.success('Delivery shift created successfully!');
      setShowModal(false);
      fetchShifts();
      setFormData({ vehicle_id: '', warehouse_id: user?.warehouse_id || '', start_time: '', route_notes: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create shift');
    }
  };

  const handleUpdateStatus = async (shiftId, status) => {
    try {
      await api.put(`/delivery-shifts/${shiftId}/status`, { status });
      toast.success(`Shift marked as ${status}`);
      fetchShifts();
    } catch (error) {
      toast.error('Failed to update shift status');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      planned: 'badge-secondary',
      active: 'badge-warning',
      completed: 'badge-success',
      cancelled: 'badge-danger',
    };
    return <span className={`badge ${badges[status] || 'badge-secondary'}`}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Delivery Shifts</h1>
        {user?.role === 'admin' && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            Create Shift
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search shifts..."
                  className="input pl-10"
                />
              </div>
            </div>
            <select className="input w-auto">
              <option value="">All Status</option>
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input type="date" className="input w-auto" />
          </div>
        </div>
      </div>

      {/* Shifts Table */}
      <div className="card">
        <div className="card-body">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Shift ID</th>
                  <th>Driver</th>
                  <th>Vehicle</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Status</th>
                  <th>Parcels</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift) => (
                  <tr key={shift.shift_id}>
                    <td>#{shift.shift_id}</td>
                    <td className="font-medium">{shift.driver_name}</td>
                    <td>{shift.vehicle_plate}</td>
                    <td>{formatDateTime(shift.start_time)}</td>
                    <td>{shift.end_time ? formatDateTime(shift.end_time) : '-'}</td>
                    <td>{getStatusBadge(shift.status)}</td>
                    <td>{shift.parcel_count || 0}</td>
                    <td>
                      <div className="flex gap-2">
                        {shift.status === 'planned' && (
                          <button
                            onClick={() => handleUpdateStatus(shift.shift_id, 'active')}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Start
                          </button>
                        )}
                        {shift.status === 'active' && (
                          <button
                            onClick={() => handleUpdateStatus(shift.shift_id, 'completed')}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Complete
                          </button>
                        )}
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical size={16} />
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

      {/* Create Shift Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Create Delivery Shift</h2>
            <form onSubmit={handleCreateShift} className="space-y-4">
              <div>
                <label className="label">Vehicle</label>
                <select
                  value={formData.vehicle_id}
                  onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map(v => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>
                      {v.plate_number} - {v.make} {v.model}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Start Time</label>
                <input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Route Notes</label>
                <textarea
                  value={formData.route_notes}
                  onChange={(e) => setFormData({ ...formData, route_notes: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Enter route details..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">Create Shift</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}