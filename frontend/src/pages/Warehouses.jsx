import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, MapPin, Phone, Warehouse as WarehouseIcon } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    contact_phone: '',
  });

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/warehouses');
      setWarehouses(response.data);
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingWarehouse) {
        await api.put(`/warehouses/${editingWarehouse.warehouse_id}`, formData);
        toast.success('Warehouse updated successfully!');
      } else {
        await api.post('/warehouses', formData);
        toast.success('Warehouse created successfully!');
      }
      setShowModal(false);
      setEditingWarehouse(null);
      setFormData({ name: '', location: '', contact_phone: '' });
      fetchWarehouses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save warehouse');
    }
  };

  const handleEdit = (warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      location: warehouse.location,
      contact_phone: warehouse.contact_phone || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (warehouseId) => {
    if (window.confirm('Are you sure you want to delete this warehouse? This will affect associated employees and vehicles.')) {
      try {
        await api.delete(`/warehouses/${warehouseId}`);
        toast.success('Warehouse deleted successfully!');
        fetchWarehouses();
      } catch (error) {
        toast.error('Failed to delete warehouse');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Warehouses</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Add Warehouse
        </button>
      </div>

      {/* Warehouses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warehouses.map((warehouse) => (
          <div key={warehouse.warehouse_id} className="card hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <WarehouseIcon size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{warehouse.name}</h3>
                    <p className="text-xs text-gray-500">ID: {warehouse.warehouse_id}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(warehouse)} className="text-blue-600 hover:text-blue-800">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDelete(warehouse.warehouse_id)} className="text-red-600 hover:text-red-800">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={16} />
                  <span>{warehouse.location}</span>
                </div>
                {warehouse.contact_phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={16} />
                    <span>{warehouse.contact_phone}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
                Created: {new Date(warehouse.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Warehouse Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Warehouse Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input"
                  required
                  placeholder="Street, City, Province"
                />
              </div>
              <div>
                <label className="label">Contact Phone</label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  className="input"
                  placeholder="+27 XX XXX XXXX"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  {editingWarehouse ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => {
                  setShowModal(false);
                  setEditingWarehouse(null);
                }} className="btn-outline flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}