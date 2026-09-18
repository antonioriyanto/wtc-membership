import React from 'react';
import { Member } from '../types';

interface MembershipCardProps {
  member: Member;
}

export const MembershipCard: React.FC<MembershipCardProps> = ({ member }) => {
  let bgGradient = '';
  let textColor = '';
  let tierLabel = member.tier;

  switch (member.tier) {
    case 'BLUE':
      bgGradient = 'from-blue-900 via-blue-800 to-slate-900';
      textColor = 'text-blue-50';
      break;
    case 'SILVER':
      bgGradient = 'from-gray-200 via-gray-100 to-gray-300';
      textColor = 'text-gray-800';
      break;
    case 'GOLD':
      bgGradient = 'from-amber-600 via-yellow-400 to-amber-700';
      textColor = 'text-amber-950';
      break;
    case 'PLATINUM':
      bgGradient = 'from-slate-700 via-slate-500 to-slate-800';
      textColor = 'text-white';
      break;
    default:
      bgGradient = 'from-slate-800 via-slate-700 to-slate-900';
      textColor = 'text-white';
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${bgGradient} ${textColor} shadow-2xl border border-white/20 backdrop-blur-md transition-all duration-300 hover:shadow-3xl mx-auto w-full max-w-sm`}>
      {/* Glassmorphism accent shapes */}
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-black/10 rounded-full blur-xl"></div>
      
      <div className="relative z-10 flex flex-col h-full justify-between gap-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-extrabold text-xl tracking-tight uppercase opacity-90">Watch Club</h3>
            <p className="text-xs font-semibold opacity-75 uppercase tracking-widest mt-1">Official Member</p>
          </div>
          <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/20 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider">{tierLabel}</span>
          </div>
        </div>
        
        <div className="mt-8">
          <p className="text-[10px] font-bold opacity-75 uppercase tracking-widest mb-1">Member ID</p>
          <p className="text-lg font-mono font-bold tracking-widest">{member.membershipId}</p>
        </div>
        
        <div className="flex justify-between items-end mt-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider">{member.name}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold opacity-75 uppercase tracking-widest mb-1">Points</p>
            <p className="text-xl font-extrabold">{member.points.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
