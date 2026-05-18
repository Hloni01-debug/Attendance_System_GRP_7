import React, { useState, useEffect } from 'react';
import { DollarSign, FileText, CheckCircle, AlertCircle, Download, Search, X } from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function Payroll() {
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [stats, setStats] = useState({
    totalPayroll: 0,
    totalHours: 0,
    totalBonuses: 0,
    totalDeductions: 0,
  });

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [formEmpId, setFormEmpId] = useState('');
  const [formMonth, setFormMonth] = useState('05');
  const [formYear, setFormYear] = useState('2026');
  const [generatedDetail, setGeneratedDetail] = useState(null);

  useEffect(() => {
    loadCommittedPayroll();
    fetchEmployees();
  }, []);

  const loadCommittedPayroll = () => {
    const saved = localStorage.getItem('liftex_committed_payroll');
    const records = saved ? JSON.parse(saved) : [];
    setPayrollRecords(records);
    calculateStats(records);
    setLoading(false);
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
      totalPayroll: records.reduce((sum, r) => sum + Number(r.net_pay || 0), 0),
      totalHours: records.reduce((sum, r) => sum + Number(r.total_hours || 0), 0),
      totalBonuses: records.reduce((sum, r) => sum + Number(r.bonus || 0), 0),
      totalDeductions: records.reduce((sum, r) => sum + Number(r.deductions || 0), 0),
    });
  };

  const handleGenerateIndividualPayroll = async (e) => {
    e.preventDefault();
    if (!formEmpId) {
      toast.error('Please select an employee');
      return;
    }
    try {
      const response = await api.get(`/payroll/${formEmpId}`, {
        params: { month: formMonth, year: formYear }
      });
      setGeneratedDetail(response.data);
      toast.success('Payroll calculated successfully!');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to compute target payroll baseline.');
    }
  };

  const handleCommitDraft = async () => {
    if (!generatedDetail) return;
    const targetPayrollId = generatedDetail.payroll_id || generatedDetail.Employee_ID || generatedDetail.employee_id;
    
    const newRecord = {
      payroll_id: `${targetPayrollId}-${formYear}-${formMonth}`,
      Employee_ID: generatedDetail.Employee_ID || targetPayrollId,
      employee_name: generatedDetail.employee_name,
      period_start: `${formYear}-${formMonth}-01`,
      period_end: `${formYear}-${formMonth}-31`,
      total_hours: generatedDetail.total_hours,
      hourly_rate: generatedDetail.hourly_rate,
      base_pay: generatedDetail.base_pay,
      bonus: generatedDetail.bonus,
      deductions: generatedDetail.deductions,
      net_pay: generatedDetail.net_pay,
      status: 'draft'
    };

    const existingRecords = [...payrollRecords];
    const index = existingRecords.findIndex(r => r.payroll_id === newRecord.payroll_id);
    
    if (index >= 0) {
      existingRecords[index] = newRecord;
    } else {
      existingRecords.push(newRecord);
    }

    localStorage.setItem('liftex_committed_payroll', JSON.stringify(existingRecords));
    setPayrollRecords(existingRecords);
    calculateStats(existingRecords);
    
    toast.success('Payroll draft committed successfully!');
    setGeneratedDetail(null);
    setShowGenerateModal(false);
  };

  const handleApprovePayroll = async (payrollId) => {
    try {
      await api.put(`/payroll/${payrollId.split('-')[0]}/approve`);
      const updated = payrollRecords.map(r => r.payroll_id === payrollId ? { ...r, status: 'approved' } : r);
      localStorage.setItem('liftex_committed_payroll', JSON.stringify(updated));
      setPayrollRecords(updated);
      calculateStats(updated);
      toast.success('Payroll approved successfully!');
    } catch (error) {
      toast.error('Failed to approve payroll');
    }
  };

  const handleProcessPayment = async (payrollId) => {
    try {
      await api.put(`/payroll/${payrollId.split('-')[0]}/pay`);
      const updated = payrollRecords.map(r => r.payroll_id === payrollId ? { ...r, status: 'paid' } : r);
      localStorage.setItem('liftex_committed_payroll', JSON.stringify(updated));
      setPayrollRecords(updated);
      calculateStats(updated);
      toast.success('Payment processed successfully!');
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

  const filteredRecords = payrollRecords.filter(record => {
    const matchesSearch = record.employee_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus ? record.status === selectedStatus : true;
    const matchesPeriod = selectedPeriod ? record.payroll_id?.includes(selectedPeriod) : true;
    return matchesSearch && matchesStatus && matchesPeriod;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Payroll Management</h1>
        <button type="button" onClick={() => { setGeneratedDetail(null); setShowGenerateModal(true); }} className="btn-primary flex items-center gap-2">
          <FileText size={18} />
          Generate New Payroll
        </button>
      </div>

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
              <p className="text-2xl font-bold">{Number(stats.totalHours || 0).toFixed(1)}</p>
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

      <div className="card">
        <div className="card-body">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by employee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select className="input w-48" value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}>
              <option value="">All Periods</option>
              <option value="2026-05">May 2026</option>
            </select>
            <select className="input w-40" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
            </select>
            <button type="button" className="btn-outline flex items-center gap-2">
              <Download size={18} />
              Export
            </button>
          </div>
        </div>
      </div>

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
                {loading ? (
                  <tr>
                    <td colSpan="10" className="text-center py-4 text-sm text-gray-500">Loading payroll ledger entries...</td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-4 text-sm text-gray-500">No generated records active. Click "Generate New Payroll" to begin.</td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.payroll_id}>
                      <td className="font-medium">{record.employee_name}</td>
                      <td>{formatDate(record.period_start)} - {formatDate(record.period_end)}</td>
                      <td>{Number(record.total_hours).toFixed(1)}</td>
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
                              type="button"
                              onClick={() => handleApprovePayroll(record.payroll_id)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Approve
                            </button>
                          )}
                          {record.status === 'approved' && (
                            <button
                              type="button"
                              onClick={() => handleProcessPayment(record.payroll_id)}
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              Pay
                            </button>
                          )}
                          <button type="button" onClick={async () => {
                            try {
                              const targetId = record.Employee_ID || record.employee_id;
                              const pMonth = record.payroll_id.split('-')[2];
                              const pYear = record.payroll_id.split('-')[1];
                              const res = await api.get(`/payroll/${targetId}`, { params: { month: pMonth, year: pYear } });
                              setGeneratedDetail(res.data);
                              setFormMonth(pMonth);
                              setFormYear(pYear);
                              setFormEmpId(targetId);
                              setShowGenerateModal(true);
                            } catch(err) { toast.error("Could not fetch details"); }
                          }} className="text-gray-400 hover:text-gray-600">
                            <FileText size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FileText size={20} className="text-blue-600" />
                Generate Employee Monthly Breakdown
              </h2>
              <button type="button" onClick={() => { setShowGenerateModal(false); setGeneratedDetail(null); }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGenerateIndividualPayroll} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label text-xs">Target Employee</label>
                  <select 
                    className="input text-sm"
                    value={formEmpId}
                    onChange={(e) => setFormEmpId(e.target.value)}
                  >
                    <option value="">Select Employee...</option>
                    {employees.map(emp => {
                      const empId = emp.Employee_ID || emp.employee_id;
                      const fName = emp.First_Name || emp.first_name;
                      const lName = emp.Last_Name || emp.last_name;
                      return (
                        <option key={empId} value={empId}>
                          {fName} {lName} (ID: {empId})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="label text-xs">Billing Month</label>
                  <select className="input text-sm" value={formMonth} onChange={(e) => setFormMonth(e.target.value)}>
                    <option value="01">January</option>
                    <option value="02">February</option>
                    <option value="03">March</option>
                    <option value="04">April</option>
                    <option value="05">May</option>
                    <option value="06">June</option>
                    <option value="07">July</option>
                    <option value="08">August</option>
                    <option value="09">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                </div>
                <div>
                  <label className="label text-xs">Billing Year</label>
                  <select className="input text-sm" value={formYear} onChange={(e) => setFormYear(e.target.value)}>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" className="btn-primary text-sm py-2 px-4">
                  Generate payroll
                </button>
              </div>
            </form>

            {generatedDetail && (
              <div className="mx-6 mb-6 p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
                  <span className="font-bold text-gray-800 text-base">{generatedDetail.employee_name}</span>
                  <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full font-bold">
                    ID: {generatedDetail.Employee_ID || generatedDetail.employee_id}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <span className="text-gray-500">Total Logged Hours:</span>
                  <span className="font-semibold text-right text-gray-800">{Number(generatedDetail.total_hours || 0).toFixed(2)} hrs</span>

                  <span className="text-gray-500">Contracted Hourly Rate:</span>
                  <span className="font-semibold text-right text-gray-800">{formatCurrency(generatedDetail.hourly_rate)}/hr</span>

                  <span className="text-gray-500">Calculated Base Pay:</span>
                  <span className="font-semibold text-right text-gray-800">{formatCurrency(generatedDetail.base_pay)}</span>

                  <span className="text-gray-500">Aggregated Bonuses:</span>
                  <span className="font-semibold text-right text-green-600">+{formatCurrency(generatedDetail.bonus)}</span>

                  <span className="text-gray-500">Fuel Loss / Deductions:</span>
                  <span className="font-semibold text-right text-red-600">-{formatCurrency(generatedDetail.deductions)}</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-base font-bold text-gray-900">
                  <span>Net Payroll Distribution:</span>
                  <span className="text-blue-600 text-lg">{formatCurrency(generatedDetail.net_pay)}</span>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button 
                    type="button"
                    onClick={handleCommitDraft}
                    className="btn-primary text-xs py-1.5 px-3 bg-blue-600 hover:bg-blue-700"
                  >
                    Commit Draft
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}