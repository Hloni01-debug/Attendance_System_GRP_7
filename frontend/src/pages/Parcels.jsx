import React, { useState, useEffect } from 'react';
import { Plus, Search, Package, Eye, Edit } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import { formatDateTime } from '../utils/helpers';

export default function Parcels() {
  const { user } = useAuthStore();
  const [parcels, setParcels] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    tracking_code: '',
    sender_name: '',
    recipient_name: '',
    recipient_addr: '',
    weight_kg: '',
    shift_id: '',
    notes: '',
  });

  useEffect(() => {
    fetchParcels();
    fetchShifts();
  }, []);

  const fetchParcels = async () => {
    try {
      const response = await api.get('/parcels');
      setParcels(response.data);
    } catch (error) {
      console.error('Failed to fetch parcels:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShifts = async () => {
    try {
      const response = await api.get('/delivery-shifts');
      setShifts(response.data.filter(s => s.status === 'active'));
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
    }
  };

  const handleCreateParcel = async (e) => {
    e.preventDefault();
    try {
      await api.post('/parcels', formData);
      toast.success('Parcel created successfully!');
      setShowModal(false);
      fetchParcels();
      setFormData({
        tracking_code: '',
        sender_name: '',
        recipient_name: '',
        recipient_addr: '',
        weight_kg: '',
        shift_id: '',
        notes: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create parcel');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-secondary',
      in_transit: 'badge-warning',
      delivered: 'badge-success',
      failed: 'badge-danger',
      returned: 'badge-info',
    };
    return <span className={`badge ${badges[status] || 'badge-secondary'}`}>{status.replace('_', ' ')}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Parcels</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Create Parcel
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="card-body">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by tracking code, sender, recipient..."
                className="input pl-10"
              />
            </div>
            <select className="input w-48">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
              <option value="returned">Returned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Parcels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {parcels.map((parcel) => (
          <div key={parcel.parcel_id} className="card hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Package size={20} className="text-blue-500" />
                  <span className="font-mono text-sm font-semibold">{parcel.tracking_code}</span>
                </div>
                {getStatusBadge(parcel.status)}
              </div>
              
              <div className="space-y-2 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Recipient</p>
                  <p className="text-sm font-medium">{parcel.recipient_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm text-gray-600 truncate">{parcel.recipient_addr}</p>
                </div>
                <div className="flex justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Weight</p>
                    <p className="text-sm">{parcel.weight_kg} kg</p>
                  </div>
                  {parcel.delivered_at && (
                    <div>
                      <p className="text-xs text-gray-500">Delivered</p>
                      <p className="text-sm">{formatDateTime(parcel.delivered_at, 'MMM dd')}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button className="flex-1 btn-outline flex items-center justify-center gap-1 py-1.5 text-sm">
                  <Eye size={14} />
                  Track
                </button>
                <button className="flex-1 btn-outline flex items-center justify-center gap-1 py-1.5 text-sm">
                  <Edit size={14} />
                  Update
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Parcel Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Parcel</h2>
            <form onSubmit={handleCreateParcel} className="space-y-4">
              <div>
                <label className="label">Tracking Code</label>
                <input
                  type="text"
                  value={formData.tracking_code}
                  onChange={(e) => setFormData({ ...formData, tracking_code: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Sender Name</label>
                  <input
                    type="text"
                    value={formData.sender_name}
                    onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Recipient Name</label>
                  <input
                    type="text"
                    value={formData.recipient_name}
                    onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">Recipient Address</label>
                <input
                  type="text"
                  value={formData.recipient_addr}
                  onChange={(e) => setFormData({ ...formData, recipient_addr: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Assign to Shift</label>
                  <select
                    value={formData.shift_id}
                    onChange={(e) => setFormData({ ...formData, shift_id: e.target.value })}
                    className="input"
                  >
                    <option value="">Unassigned</option>
                    {shifts.map(s => (
                      <option key={s.shift_id} value={s.shift_id}>
                        Shift #{s.shift_id} - {s.driver_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
                  rows={2}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">Create Parcel</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}