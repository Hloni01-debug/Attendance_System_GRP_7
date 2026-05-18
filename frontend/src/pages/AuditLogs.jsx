import React, { useState, useEffect } from 'react';
import { Shield, Clock, FileText, RefreshCw } from 'lucide-react';
import api from '../services/api';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/audit');
      setLogs(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch audit trails:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    const currentAction = action || '';
    const classes = {
      INSERT: 'bg-green-50 text-green-700 border-green-200',
      UPDATE: 'bg-blue-50 text-blue-700 border-blue-200',
      DELETE: 'bg-red-50 text-red-700 border-red-200',
    };
    return (
      <span className={`px-2 py-1 text-xs font-bold rounded-md border inline-block whitespace-nowrap ${classes[currentAction.toUpperCase()] || 'bg-gray-50 text-gray-700'}`}>
        {currentAction}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="text-slate-700" size={26} />
            System Security Audit Log
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time accountability and data recording</p>
        </div>
        <button onClick={fetchLogs} className="btn-outline flex items-center gap-2 text-sm py-2" disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Logs
        </button>
      </div>

      <div className="card w-full">
        <div className="card-body p-0">
          <div className="table-container max-h-[70vh] overflow-y-auto">
            <table className="table min-w-full table-fixed">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="w-[16%] px-4 py-3 text-left">Timestamp</th>
                  <th className="w-[18%] px-4 py-3 text-left">Action</th>
                  <th className="w-[16%] px-4 py-3 text-left">Target Event</th>
                  <th className="w-[18%] px-4 py-3 text-left">Old Value</th>
                  <th className="w-[18%] px-4 py-3 text-left">New Value</th>
                  <th className="w-[14%] px-4 py-3 text-left">Admin</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-sm text-gray-500">Loading system audit trails...</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-sm text-gray-500">No logs found in the system audit database table.</td>
                  </tr>
                ) : (
                  logs.map((log, index) => {
                    const logId = log.Log_ID || index;
                    const timestamp = log.Action_Timestamp;
                    const actionType = log.Action_Type;
                    const tableAffected = log.Table_Affected;
                    const oldValue = log.Old_Value;
                    const newValue = log.New_Value;
                    const performer = log.performed_by || 'System Action';

                    return (
                      <tr key={logId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs text-gray-600 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-gray-400 shrink-0" />
                            <span className="truncate">{timestamp ? new Date(timestamp).toLocaleString() : '-'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 overflow-hidden">
                          {getActionBadge(actionType)}
                        </td>
                        <td className="px-4 py-3 overflow-hidden">
                          <div className="flex items-center gap-1 min-w-0">
                            <FileText size={13} className="text-slate-400 shrink-0" />
                            <span className="font-mono text-xs font-semibold text-gray-700 truncate">{tableAffected || '-'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-mono text-red-600 overflow-x-auto whitespace-nowrap max-w-full block scrollbar-thin container-snap">
                            {oldValue || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-mono text-green-600 overflow-x-auto whitespace-nowrap max-w-full block scrollbar-thin container-snap">
                            {newValue || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 overflow-hidden">
                          <div className="truncate" title={performer}>{performer}</div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}