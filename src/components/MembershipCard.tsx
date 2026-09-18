import React from 'react';
import { Member } from '../types';
import { WatchClubLogo } from './WatchClubLogo';

interface MembershipCardProps {
  member?: Member;
  memberName?: string;
  memberId?: string;
  points?: number;
  tier?: string;
  onClickQr?: () => void;
}

export const MembershipCard: React.FC<MembershipCardProps> = ({
  member,
  memberName: propMemberName,
  memberId: propMemberId,
  points: propPoints,
  tier: propTier,
  onClickQr,
}) => {
  const name = propMemberName || member?.name || 'Valued Member';
  const id = propMemberId || member?.membershipId || member?.id || 'WTC-00000';
  const pts = propPoints !== undefined ? propPoints : (member?.points || 0);
  const tierRaw = propTier || member?.tier || 'BLUE';
  const tier = tierRaw.toUpperCase();

  let bgGradient = 'from-blue-900 via-blue-800 to-slate-900';
  let textColor = 'text-blue-50';
  let badgeBg = 'bg-white/20 text-white border-white/30';
  let logoVariant: 'white' | 'dark' = 'white';
  let chipBg = 'from-amber-300 via-yellow-200 to-amber-400 border-amber-500/40';

  switch (tier) {
    case 'SILVER':
      bgGradient = 'from-gray-200 via-gray-100 to-gray-300';
      textColor = 'text-gray-900';
      badgeBg = 'bg-gray-900/10 text-gray-900 border-gray-900/20';
      logoVariant = 'dark';
      chipBg = 'from-slate-400 via-slate-300 to-slate-500 border-slate-400';
      break;
    case 'GOLD':
      bgGradient = 'from-amber-600 via-yellow-400 to-amber-700';
      textColor = 'text-amber-950';
      badgeBg = 'bg-black/15 text-amber-950 border-amber-900/30';
      logoVariant = 'dark';
      chipBg = 'from-amber-200 via-yellow-100 to-amber-300 border-amber-600/50';
      break;
    case 'PLATINUM':
      bgGradient = 'from-slate-700 via-slate-500 to-slate-800';
      textColor = 'text-white';
      badgeBg = 'bg-amber-400/20 text-amber-300 border-amber-400/40';
      logoVariant = 'white';
      chipBg = 'from-amber-300 via-yellow-200 to-amber-400 border-amber-400/60';
      break;
    case 'BLUE':
    default:
      bgGradient = 'from-blue-900 via-blue-800 to-slate-900';
      textColor = 'text-blue-50';
      badgeBg = 'bg-white/20 text-white border-white/30';
      logoVariant = 'white';
      chipBg = 'from-amber-300 via-yellow-200 to-amber-400 border-amber-500/40';
      break;
  }

  return (
    <div 
      onClick={onClickQr}
      className={`relative overflow-hidden rounded-3xl p-5 sm:p-7 bg-gradient-to-br ${bgGradient} ${textColor} shadow-2xl border border-white/20 backdrop-blur-xl transition-all duration-300 mx-auto w-full max-w-xl aspect-[2/1] flex flex-col justify-between cursor-pointer select-none group hover:scale-[1.01]`}
    >
      {/* Background Decorative Glows */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-black/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header: Logo & Tier Badge */}
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <WatchClubLogo variant={logoVariant} className="h-4 sm:h-5" />
          <p className="text-[9px] sm:text-[10px] font-semibold opacity-80 uppercase tracking-widest mt-1">OFFICIAL MEMBER</p>
        </div>
        <div className={`px-3 py-1 backdrop-blur-md rounded-full border shadow-sm ${badgeBg}`}>
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">{tier}</span>
        </div>
      </div>

      {/* Middle Section: Chip & Mini Barcode */}
      <div className="relative z-10 flex justify-between items-center my-auto">
        {/* EMV Chip */}
        <div className={`w-10 h-8 sm:w-12 sm:h-9 rounded-md bg-gradient-to-tr ${chipBg} shadow-md border flex items-center justify-center opacity-90`}>
          <div className="w-6 h-5 border border-black/20 rounded-xs grid grid-cols-2 grid-rows-2 gap-px p-0.5">
            <div className="bg-black/10 rounded-2xs"></div>
            <div className="bg-black/10 rounded-2xs"></div>
            <div className="bg-black/10 rounded-2xs"></div>
            <div className="bg-black/10 rounded-2xs"></div>
          </div>
        </div>

        {/* Mini Barcode / QR Box inside card */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            if (onClickQr) onClickQr();
          }}
          className="bg-white p-2 rounded-xl shadow-lg cursor-pointer transition-transform duration-200 group-hover:scale-105 active:scale-95 flex flex-col items-center border border-black/10"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center p-0.5">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(id)}`} 
              alt="QR Code" 
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-[8px] sm:text-[9px] font-bold text-neutral-800 uppercase tracking-tighter mt-1">TAP FOR FULL QR</span>
        </div>
      </div>

      {/* Bottom Footer: Member ID, Name & Points */}
      <div className="relative z-10 flex justify-between items-end pt-2 border-t border-white/15">
        <div>
          <p className="text-[9px] sm:text-[10px] font-bold opacity-75 uppercase tracking-widest">Cardholder</p>
          <p className="text-xs sm:text-sm font-bold tracking-wide uppercase truncate max-w-[180px] sm:max-w-[240px]">{name}</p>
          <p className="font-mono text-[11px] sm:text-xs font-bold tracking-[0.2em] opacity-90 mt-0.5">{id}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] sm:text-[10px] font-bold opacity-75 uppercase tracking-widest">Points</p>
          <p className="text-base sm:text-xl font-black tracking-tight">{pts.toLocaleString('id-ID')} <span className="text-[10px] sm:text-xs font-semibold">PTS</span></p>
        </div>
      </div>
    </div>
  );
};
