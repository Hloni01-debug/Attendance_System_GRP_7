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

  // --- SECTION 1: INSPECTION MODAL STATE ---
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState(null);
  const [fuelStatus, setFuelStatus] = useState('None');

  // --- SECTION 2: MANUAL LOG ENTRY STATE ---
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [activeCompleteShiftId, setActiveCompleteShiftId] = useState(null);
  const [completeFormData, setCompleteFormData] = useState({
    odometer_end: '',
    tank_end: '',
    fuel_consumed_can: ''
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

  // Handles standard planned -> active transitions
  const handleUpdateStatus = async (shiftId, status) => {
    try {
      await api.put(`/delivery-shifts/${shiftId}/status`, { status });
      toast.success(`Shift marked as ${status}`);
      fetchShifts();
    } catch (error) {
      toast.error('Failed to update shift status');
    }
  };

  // Handles interactive form submissions for shift closures
  const handleFinalizeShiftCompletion = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/delivery-shifts/${activeCompleteShiftId}/status`, {
        status: 'completed',
        ...completeFormData
      });
      toast.success('Shift diagnostics captured and finalized successfully!');
      setIsCompleteModalOpen(false);
      setCompleteFormData({ odometer_end: '', tank_end: '', fuel_consumed_can: '' });
      fetchShifts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to finalize shift logs');
    }
  };
  
  const handleSaveInspection = async () => {
    try {
      await api.put(`/delivery-shifts/${selectedShiftId}/inspection`, { fuelStatus });
      toast.success(`Inspection complete. Status set to ${fuelStatus}.`);
      setIsInspectModalOpen(false);
      fetchShifts(); 
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update fuel status.");
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
        {user?.role?.includes('admin') && (
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
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            Start
                          </button>
                        )}
                        {shift.status === 'active' && (
                          <button
                            onClick={() => {
                              setActiveCompleteShiftId(shift.shift_id);
                              setIsCompleteModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Complete
                          </button>
                        )}
                        
                        {/* --- inspect button --- */}
                        {user?.role?.includes('admin') && shift.status === 'completed' && (
                          <button
                            onClick={() => {
                              setSelectedShiftId(shift.shift_id);
                              setFuelStatus(shift.missing_fuel_status || 'None');
                              setIsInspectModalOpen(true);
                            }}
                            className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                          >
                            Inspect
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

      {/* --- SECTION 3: INTERACTIVE MANUAL COMPLETION MODAL --- */}
      {isCompleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Finalize Shift Logs (#{activeCompleteShiftId})</h2>
            <p className="text-xs text-gray-500 mb-4">Input shift ending values.</p>
            
            <form onSubmit={handleFinalizeShiftCompletion} className="space-y-4">
              <div>
                <label className="label">Final Odometer Reading (km)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  required
                  value={completeFormData.odometer_end}
                  onChange={(e) => setCompleteFormData({ ...completeFormData, odometer_end: e.target.value })}
                  placeholder="e.g. 14520.50"
                />
              </div>
              
              <div>
                <label className="label">Final Tank Fuel Level (Litres)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  required
                  value={completeFormData.tank_end}
                  onChange={(e) => setCompleteFormData({ ...completeFormData, tank_end: e.target.value })}
                  placeholder="e.g. 45.20"
                />
              </div>

              <div>
                <label className="label">Expected Fuel Consumption (CAN-bus Litres)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  required
                  value={completeFormData.fuel_consumed_can}
                  onChange={(e) => setCompleteFormData({ ...completeFormData, fuel_consumed_can: e.target.value })}
                  placeholder="e.g. 16.80"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">Finalize Shift</button>
                <button type="button" onClick={() => setIsCompleteModalOpen(false)} className="btn-outline flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- fuel and fleet compliance --- */}
      {isInspectModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="border-b pb-2">
              <h2 className="text-xl font-bold text-gray-800">
                Shift Inspection Audit (#{selectedShiftId})
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                missing fuel review audit
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Missing Fuel Status
              </label>
              <select 
                value={fuelStatus} 
                onChange={(e) => setFuelStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="None">None (Clear / No Variance)</option>
                <option value="Stolen">Stolen (Flag Payroll Recovery Deduction)</option>
                <option value="Mechanical Fault">Mechanical Fault (Ground Asset for Repair Info)</option>
              </select>
            </div>
            
            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setIsInspectModalOpen(false)} 
                className="btn-outline flex-1 text-sm py-2"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleSaveInspection} 
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex-1 text-sm py-2"
              >
                Save Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}