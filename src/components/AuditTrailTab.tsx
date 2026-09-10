import React, { useState } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import { AuditLog } from '../types';

export const AuditTrailTab: React.FC = () => {
  const [search, setSearch] = useState('');

  // Mock data for audit logs
  const [logs] = useState<AuditLog[]>([
    { id: 'AL-001', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), actorName: 'System', actorRole: 'SYSTEM', action: 'TIER_UPGRADE', details: 'Upgraded member MBR-8472 to GOLD tier based on lifetime points.', module: 'LOYALTY' },
    { id: 'AL-002', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), actorName: 'Sarah K. (Cashier)', actorRole: 'CASHIER', action: 'MANUAL_ADJUSTMENT', details: 'Added 500 points to MBR-1029 (Receipt: MAN-992).', module: 'TRANSACTIONS' },
    { id: 'AL-003', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), actorName: 'Admin (HO)', actorRole: 'HO_ADMIN', action: 'VOUCHER_CREATED', details: 'Created new Summer Special voucher (20% Off).', module: 'VOUCHERS' },
    { id: 'AL-004', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), actorName: 'Admin (HO)', actorRole: 'HO_ADMIN', action: 'LOYALTY_CONFIG_CHANGED', details: 'Changed Gold multiplier from 1.2x to 1.5x.', module: 'SETTINGS' },
  ]);

  const filteredLogs = logs.filter(l => 
    l.actorName.toLowerCase().includes(search.toLowerCase()) || 
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">System Audit Trail</h2>
          <p className="text-sm text-slate-500 mt-1">Immutable ledger of all administrative and system actions</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 text-slate-700">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search logs by actor, action, or details..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400" 
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-slate-50 border border-slate-200 rounded-lg text-sm hover:bg-slate-100 transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wide">Timestamp</th>
                <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wide">Actor</th>
                <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wide">Module</th>
                <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wide">Action</th>
                <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wide">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-5 text-sm font-mono text-slate-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-5 text-sm font-semibold text-slate-900">
                    {log.actorName}
                    <div className="text-[10px] text-slate-400 uppercase mt-0.5">{log.actorRole}</div>
                  </td>
                  <td className="py-3 px-5">
                    <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                      {log.module}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-sm font-medium text-slate-800">
                    {log.action}
                  </td>
                  <td className="py-3 px-5 text-sm text-slate-600">
                    {log.details}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-sm">
                    No audit logs match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
