import React, { useState } from 'react';
import { Megaphone, Plus, Search, Users, Mail, MessageSquare } from 'lucide-react';
import { Campaign } from '../types';

export const CampaignsTab: React.FC = () => {
  const [search, setSearch] = useState('');

  const [campaigns] = useState<Campaign[]>([
    { id: 'CMP-001', name: 'Summer End Mega Sale 20%', type: 'EMAIL', status: 'ACTIVE', targetAudience: 'ALL', content: 'Get 20% off all watches this weekend!', sentCount: 14500, openCount: 8200 },
    { id: 'CMP-002', name: 'Platinum Exclusive Preview', type: 'SMS', status: 'SCHEDULED', targetAudience: 'PLATINUM', content: 'Special preview for Platinum members. Show this SMS.', scheduledAt: '2024-09-01T10:00:00Z', sentCount: 0 },
    { id: 'CMP-003', name: 'We Miss You - Come Back', type: 'EMAIL', status: 'DRAFT', targetAudience: 'INACTIVE', content: 'We noticed you havent visited in a while.', sentCount: 0 },
  ]);

  const filteredCampaigns = campaigns.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Comms & Campaigns</h2>
          <p className="text-sm text-slate-500 mt-1">Manage email and SMS broadcasts to segmented members</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> New Campaign
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Mail className="w-6 h-6" /></div>
          <div>
            <div className="text-sm text-slate-500 font-medium">Emails Sent (MTD)</div>
            <div className="text-2xl font-bold text-slate-900">45,200</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><MessageSquare className="w-6 h-6" /></div>
          <div>
            <div className="text-sm text-slate-500 font-medium">SMS Sent (MTD)</div>
            <div className="text-2xl font-bold text-slate-900">12,450</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Users className="w-6 h-6" /></div>
          <div>
            <div className="text-sm text-slate-500 font-medium">Avg. Open Rate</div>
            <div className="text-2xl font-bold text-slate-900">38.4%</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search campaigns..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400" 
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wide">Campaign Name</th>
                <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wide">Type</th>
                <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wide">Target Audience</th>
                <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wide">Performance</th>
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.map(c => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-4 px-5">
                    <div className="text-sm font-bold text-slate-900">{c.name}</div>
                    <div className="text-xs text-slate-500 mt-1 truncate max-w-xs">{c.content}</div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                      {c.type === 'EMAIL' ? <Mail className="w-4 h-4 text-blue-500" /> : <MessageSquare className="w-4 h-4 text-emerald-500" />}
                      {c.type}
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider
                      ${c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 
                        c.status === 'SCHEDULED' ? 'bg-amber-100 text-amber-700' : 
                        'bg-slate-100 text-slate-600'}
                    `}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold uppercase tracking-wider">
                      {c.targetAudience}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    {c.status === 'ACTIVE' || c.status === 'COMPLETED' ? (
                      <div>
                        <div className="text-sm font-bold text-slate-900">{c.sentCount.toLocaleString()} Sent</div>
                        {c.openCount !== undefined && (
                          <div className="text-xs text-slate-500 mt-1">
                            {((c.openCount / c.sentCount) * 100).toFixed(1)}% Open Rate
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">Pending Execution</span>
                    )}
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
