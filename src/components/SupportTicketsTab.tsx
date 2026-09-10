import React, { useState } from 'react';
import { MessageSquare, Search, Filter, AlertCircle, CheckCircle2 } from 'lucide-react';
import { SupportTicket } from '../types';

export const SupportTicketsTab: React.FC = () => {
  const [search, setSearch] = useState('');

  const [tickets] = useState<SupportTicket[]>([
    { id: 'TKT-1049', memberId: 'MBR-9381', memberName: 'Budi Santoso', subject: 'Missing points from last purchase', status: 'OPEN', priority: 'HIGH', createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), messages: [] },
    { id: 'TKT-1048', memberId: 'MBR-4221', memberName: 'Siti Rahma', subject: 'Unable to redeem birthday voucher', status: 'IN_PROGRESS', priority: 'MEDIUM', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), messages: [] },
    { id: 'TKT-1045', memberId: 'MBR-1122', memberName: 'Andi Wijaya', subject: 'Account tier not updated after crossing 1000 points', status: 'RESOLVED', priority: 'HIGH', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), messages: [] },
  ]);

  const filteredTickets = tickets.filter(t => 
    t.subject.toLowerCase().includes(search.toLowerCase()) || 
    t.memberName.toLowerCase().includes(search.toLowerCase()) ||
    t.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Support Tickets</h2>
          <p className="text-sm text-slate-500 mt-1">Manage member feedback, complaints, and inquiries</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by ticket ID, member, or subject..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400" 
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-slate-50 border border-slate-200 rounded-lg text-sm hover:bg-slate-100 transition-colors">
              <Filter className="w-4 h-4" /> Filter Status
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wide">Ticket</th>
                <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wide">Member</th>
                <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wide">Priority</th>
                <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wide">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map(t => (
                <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                  <td className="py-4 px-5">
                    <div className="text-sm font-bold text-slate-900">{t.subject}</div>
                    <div className="text-xs text-slate-500 mt-1 font-mono">{t.id}</div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="text-sm font-bold text-slate-800">{t.memberName}</div>
                    <div className="text-xs text-slate-500 mt-1">{t.memberId}</div>
                  </td>
                  <td className="py-4 px-5">
                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider flex items-center w-fit gap-1.5
                      ${t.status === 'OPEN' ? 'bg-blue-100 text-blue-700' : 
                        t.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' : 
                        'bg-emerald-100 text-emerald-700'}
                    `}>
                      {t.status === 'RESOLVED' && <CheckCircle2 className="w-3 h-3" />}
                      {t.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider
                      ${t.priority === 'HIGH' || t.priority === 'CRITICAL' ? 'text-red-600' : 
                        t.priority === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-600'}
                    `}>
                      {(t.priority === 'HIGH' || t.priority === 'CRITICAL') && <AlertCircle className="w-3.5 h-3.5" />}
                      {t.priority}
                    </div>
                  </td>
                  <td className="py-4 px-5 text-sm text-slate-600">
                    {new Date(t.updatedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
