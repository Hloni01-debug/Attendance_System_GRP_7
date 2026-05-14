import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart3, Calendar, ArrowUp, ArrowDown } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import DateRangePicker from './DateRangePicker';
import api from '../services/api';
import { formatCurrency } from '../utils/helpers';

export default function ComparisonChart() {
  const [comparisonType, setComparisonType] = useState('deliveries');
  const [currentPeriod, setCurrentPeriod] = useState({ start: '', end: '' });
  const [previousPeriod, setPreviousPeriod] = useState({ start: '', end: '' });
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState({
    currentTotal: 0,
    previousTotal: 0,
    percentageChange: 0,
    trend: 'up'
  });
  const [loading, setLoading] = useState(false);

  // Set default periods (last 30 days vs previous 30 days)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    const prevEnd = new Date(start);
    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - 30);
    
    setCurrentPeriod({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
    setPreviousPeriod({
      start: prevStart.toISOString().split('T')[0],
      end: prevEnd.toISOString().split('T')[0]
    });
  }, []);

  useEffect(() => {
    if (currentPeriod.start && currentPeriod.end && previousPeriod.start && previousPeriod.end) {
      fetchComparisonData();
    }
  }, [comparisonType, currentPeriod, previousPeriod]);

  const fetchComparisonData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports/comparison', {
        params: {
          type: comparisonType,
          current_start: currentPeriod.start,
          current_end: currentPeriod.end,
          previous_start: previousPeriod.start,
          previous_end: previousPeriod.end
        }
      });
      
      setChartData(response.data.chartData);
      setStats({
        currentTotal: response.data.currentTotal,
        previousTotal: response.data.previousTotal,
        percentageChange: response.data.percentageChange,
        trend: response.data.percentageChange >= 0 ? 'up' : 'down'
      });
    } catch (error) {
      console.error('Failed to fetch comparison data:', error);
      // Demo data for testing
      setDemoData();
    } finally {
      setLoading(false);
    }
  };

  const setDemoData = () => {
    const demoChartData = [
      { period: 'Week 1', current: 450, previous: 380 },
      { period: 'Week 2', current: 520, previous: 410 },
      { period: 'Week 3', current: 490, previous: 440 },
      { period: 'Week 4', current: 580, previous: 470 },
    ];
    setChartData(demoChartData);
    setStats({
      currentTotal: 2040,
      previousTotal: 1700,
      percentageChange: 20,
      trend: 'up'
    });
  };

  const comparisonOptions = [
    { value: 'deliveries', label: 'Deliveries', icon: BarChart3 },
    { value: 'parcels', label: 'Parcels Processed', icon: BarChart3 },
    { value: 'revenue', label: 'Revenue', icon: TrendingUp },
    { value: 'attendance', label: 'Attendance Rate', icon: Calendar },
    { value: 'fuel_efficiency', label: 'Fuel Efficiency', icon: BarChart3 },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-sm mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm text-blue-600">
              Current Period: {comparisonType === 'revenue' ? formatCurrency(payload[0].value) : payload[0].value}
            </p>
            <p className="text-sm text-gray-500">
              Previous Period: {comparisonType === 'revenue' ? formatCurrency(payload[1].value) : payload[1].value}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Difference: {comparisonType === 'revenue' ? formatCurrency(payload[0].value - payload[1].value) : payload[0].value - payload[1].value}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1">
          <label className="label">Comparison Type</label>
          <select
            value={comparisonType}
            onChange={(e) => setComparisonType(e.target.value)}
            className="input"
          >
            {comparisonOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="label">Current Period</label>
          <DateRangePicker
            initialStartDate={currentPeriod.start}
            initialEndDate={currentPeriod.end}
            onRangeChange={(start, end) => setCurrentPeriod({ start, end })}
          />
        </div>
        
        <div>
          <label className="label">Compare to</label>
          <DateRangePicker
            initialStartDate={previousPeriod.start}
            initialEndDate={previousPeriod.end}
            onRangeChange={(start, end) => setPreviousPeriod({ start, end })}
          />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <p className="text-sm text-gray-500">Current Period</p>
          <p className="text-2xl font-bold">
            {comparisonType === 'revenue' ? formatCurrency(stats.currentTotal) : stats.currentTotal.toLocaleString()}
          </p>
        </div>
        
        <div className="stat-card">
          <p className="text-sm text-gray-500">Previous Period</p>
          <p className="text-2xl font-bold">
            {comparisonType === 'revenue' ? formatCurrency(stats.previousTotal) : stats.previousTotal.toLocaleString()}
          </p>
        </div>
        
        <div className="stat-card">
          <p className="text-sm text-gray-500">Change</p>
          <div className="flex items-center gap-2">
            {stats.trend === 'up' ? (
              <TrendingUp className="text-green-500" size={24} />
            ) : (
              <TrendingDown className="text-red-500" size={24} />
            )}
            <p className={`text-2xl font-bold ${stats.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {stats.percentageChange > 0 ? '+' : ''}{stats.percentageChange}%
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {stats.trend === 'up' ? 'Increase' : 'Decrease'} from previous period
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} />
            <span>{comparisonOptions.find(o => o.value === comparisonType)?.label} Comparison</span>
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="flex items-center justify-center h-80">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="current" fill="#3b82f6" name="Current Period" />
                  <Bar dataKey="previous" fill="#9ca3af" name="Previous Period" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="card">
        <div className="card-header">Key Insights</div>
        <div className="card-body">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <ArrowUp className="text-green-500 mt-0.5" size={16} />
              <div>
                <p className="text-sm font-semibold">Performance Summary</p>
                <p className="text-sm text-gray-600">
                  {stats.trend === 'up' 
                    ? `${comparisonType} increased by ${stats.percentageChange}% compared to the previous period. This represents ${comparisonType === 'revenue' ? formatCurrency(stats.currentTotal - stats.previousTotal) : (stats.currentTotal - stats.previousTotal).toLocaleString()} more.`
                    : `${comparisonType} decreased by ${Math.abs(stats.percentageChange)}% compared to the previous period.`
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <TrendingUp size={16} className="text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Recommendation</p>
                <p className="text-sm text-gray-600">
                  {stats.trend === 'up'
                    ? "Current strategies are working well. Consider investing more resources in high-performing areas."
                    : "Review processes and identify bottlenecks. Consider staff training or process optimization."
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}