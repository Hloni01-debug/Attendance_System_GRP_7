import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, Users, Truck, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length > 1) {
      searchAll();
    } else {
      setResults([]);
    }
  }, [query]);

  const searchAll = async () => {
    try {
      const [parcels, employees, deliveries] = await Promise.all([
        api.get(`/parcels/search?q=${query}`),
        api.get(`/employees/search?q=${query}`),
        api.get(`/delivery-shifts/search?q=${query}`),
      ]);
      
      setResults({
        parcels: parcels.data.slice(0, 3),
        employees: employees.data.slice(0, 3),
        deliveries: deliveries.data.slice(0, 3),
      });
      setShowResults(true);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleResultClick = (type, id) => {
    if (type === 'parcel') navigate(`/parcels?id=${id}`);
    if (type === 'employee') navigate(`/employees?id=${id}`);
    if (type === 'delivery') navigate(`/deliveries?id=${id}`);
    setShowResults(false);
    setQuery('');
  };

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search parcels, employees, deliveries... (Ctrl+K)"
          className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {showResults && (results.parcels?.length > 0 || results.employees?.length > 0 || results.deliveries?.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {results.parcels?.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 px-3 py-1">Parcels</div>
              {results.parcels.map(parcel => (
                <button
                  key={parcel.parcel_id}
                  onClick={() => handleResultClick('parcel', parcel.parcel_id)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded flex items-center gap-2"
                >
                  <Package size={14} />
                  <span className="font-mono text-sm">{parcel.tracking_code}</span>
                  <span className="text-xs text-gray-500">{parcel.recipient_name}</span>
                </button>
              ))}
            </div>
          )}
          
          {results.employees?.length > 0 && (
            <div className="p-2 border-t">
              <div className="text-xs font-semibold text-gray-500 px-3 py-1">Employees</div>
              {results.employees.map(employee => (
                <button
                  key={employee.employee_id}
                  onClick={() => handleResultClick('employee', employee.employee_id)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded flex items-center gap-2"
                >
                  <Users size={14} />
                  <span>{employee.first_name} {employee.last_name}</span>
                  <span className="text-xs text-gray-500">{employee.role}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}