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

  // Tier color themes according to canonical specifications
  let bgGradient = 'from-blue-900 via-blue-800 to-slate-900';
  let textColor = 'text-blue-50';
  let subTextColor = 'text-blue-200/80';
  let badgeBg = 'bg-white/20 text-white border-white/30';
  let logoVariant: 'white' | 'dark' = 'white';
  let cardBorder = 'border-white/20';
  let glowColor = 'bg-blue-400/20';

  switch (tier) {
    case 'SILVER':
      bgGradient = 'from-gray-200 via-gray-100 to-gray-300';
      textColor = 'text-gray-900';
      subTextColor = 'text-gray-600';
      badgeBg = 'bg-gray-900/10 text-gray-900 border-gray-900/20';
      logoVariant = 'dark';
      cardBorder = 'border-black/10';
      glowColor = 'bg-white/40';
      break;
    case 'GOLD':
      bgGradient = 'from-amber-600 via-yellow-400 to-amber-700';
      textColor = 'text-amber-950';
      subTextColor = 'text-amber-900/85';
      badgeBg = 'bg-black/15 text-amber-950 border-amber-950/25';
      logoVariant = 'dark';
      cardBorder = 'border-amber-900/20';
      glowColor = 'bg-yellow-200/30';
      break;
    case 'PLATINUM':
      bgGradient = 'from-slate-700 via-slate-500 to-slate-800';
      textColor = 'text-white';
      subTextColor = 'text-slate-200/80';
      badgeBg = 'bg-amber-400/20 text-amber-300 border-amber-400/40';
      logoVariant = 'white';
      cardBorder = 'border-white/20';
      glowColor = 'bg-slate-300/20';
      break;
    case 'BLUE':
    default:
      bgGradient = 'from-blue-900 via-blue-800 to-slate-900';
      textColor = 'text-blue-50';
      subTextColor = 'text-blue-200/80';
      badgeBg = 'bg-white/20 text-white border-white/30';
      logoVariant = 'white';
      cardBorder = 'border-white/20';
      glowColor = 'bg-blue-400/20';
      break;
  }

  return (
    <div 
      onClick={onClickQr}
      className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-br ${bgGradient} ${textColor} shadow-xl border ${cardBorder} backdrop-blur-xl transition-all duration-300 mx-auto w-full max-w-xl aspect-[2/1] flex flex-col justify-between cursor-pointer select-none group hover:shadow-2xl hover:scale-[1.01]`}
    >
      {/* Subtle Atmospheric Light Flares */}
      <div className={`absolute -top-16 -right-16 w-52 h-52 ${glowColor} rounded-full blur-3xl pointer-events-none`}></div>
      <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-black/20 rounded-full blur-3xl pointer-events-none"></div>
      {/* Frosted Shimmer Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-black/10 pointer-events-none"></div>

      {/* Top Header: Brand Logo & Tier Badge */}
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <WatchClubLogo variant={logoVariant} className="h-4 sm:h-5" />
          <p className={`text-[9px] sm:text-[10px] font-semibold tracking-[0.2em] uppercase mt-1 ${subTextColor}`}>
            Official Member
          </p>
        </div>
        <div className={`px-3 py-1 backdrop-blur-md rounded-full border shadow-xs ${badgeBg}`}>
          <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase">{tier}</span>
        </div>
      </div>

      {/* Bottom Row: Member Details & Interactive Mini QR Code */}
      <div className="relative z-10 flex justify-between items-end gap-3 mt-auto">
        {/* Left Info: Cardholder, ID & Points */}
        <div className="flex flex-col justify-end min-w-0 pr-1">
          <div className="mb-2.5">
            <p className={`text-[8.5px] sm:text-[9.5px] font-bold uppercase tracking-widest ${subTextColor}`}>
              Cardholder
            </p>
            <p className="text-sm sm:text-base font-bold tracking-wide uppercase truncate max-w-[190px] sm:max-w-[260px] leading-tight">
              {name}
            </p>
            <p className="font-mono text-[11px] sm:text-xs font-bold tracking-[0.22em] opacity-90 mt-0.5">
              {id}
            </p>
          </div>

          <div>
            <p className={`text-[8.5px] sm:text-[9.5px] font-bold uppercase tracking-widest ${subTextColor}`}>
              Points Balance
            </p>
            <p className="text-base sm:text-xl font-black tracking-tight leading-tight">
              {pts.toLocaleString('id-ID')}{' '}
              <span className="text-[10px] sm:text-xs font-semibold opacity-85">PTS</span>
            </p>
          </div>
        </div>

        {/* Right Info: Clean Integrated Mini QR Tile */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            if (onClickQr) onClickQr();
          }}
          className="bg-white/95 backdrop-blur-sm p-2 sm:p-2.5 rounded-2xl shadow-lg cursor-pointer transition-transform duration-200 group-hover:scale-105 active:scale-95 flex flex-col items-center border border-black/10 flex-shrink-0"
        >
          <div className="w-13 h-13 sm:w-16 sm:h-16 flex items-center justify-center p-0.5">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(id)}`} 
              alt="QR Code" 
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-[7.5px] sm:text-[8.5px] font-bold text-neutral-800 uppercase tracking-tighter mt-1 text-center">
            Tap for Full QR
          </span>
        </div>
      </div>
    </div>
  );
};
