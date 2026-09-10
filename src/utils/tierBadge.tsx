import React from 'react';

export const TIER_CARD_GRADIENTS = {
  BLUE: {
    background: 'linear-gradient(135deg, #4375A6 0%, #30466E 25%, #222649 50%, #17182C 75%, #101010 100%)',
    textColor: '#FFFFFF',
    borderColor: 'rgba(67, 117, 166, 0.6)',
    boxShadow: '0 1px 3px rgba(16, 16, 16, 0.3)',
  },
  SILVER: {
    background: 'linear-gradient(135deg, #F8F4F3 0%, #A3A3A3 25%, #FCFCFC 50%, #909090 75%, #F4F0F1 100%)',
    textColor: '#1E293B',
    borderColor: '#94A3B8',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  GOLD: {
    background: 'linear-gradient(135deg, #EEC944 0%, #FAE56F 25%, #DDAF1D 50%, #FFFA8A 75%, #B96F15 100%)',
    textColor: '#451A03',
    borderColor: '#D97706',
    boxShadow: '0 1px 3px rgba(185, 111, 21, 0.35)',
  },
  PLATINUM: {
    background: 'linear-gradient(135deg, #ECF1F7 0%, #A7B8CA 25%, #E2E7ED 50%, #A7B8CA 75%, #F8F7FC 100%)',
    textColor: '#0F172A',
    borderColor: '#94A3B8',
    boxShadow: '0 1px 3px rgba(167, 184, 202, 0.3)',
  },
  DIAMOND: {
    background: 'linear-gradient(135deg, #F9FFFF 0%, #FFFFFF 12.5%, #CCD7E7 25%, #FDE2CA 30.61%, #B9C9DD 38.27%, #E7F7E0 50%, #FFFFFF 62.29%, #FEEBF0 70.02%, #DCE4EE 75%, #B9C9DD 85.2%, #FFFFFF 100%)',
    textColor: '#0F172A',
    borderColor: '#7DD3FC',
    boxShadow: '0 1px 3px rgba(185, 201, 221, 0.35)',
  },
  BLACK: {
    background: 'radial-gradient(circle at top left, #1e293b, #0f172a)',
    textColor: '#FFFFFF',
    borderColor: '#334155',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
  },
};

export const getTierStyle = (tier?: string) => {
  const key = (tier || 'SILVER').toUpperCase() as keyof typeof TIER_CARD_GRADIENTS;
  return TIER_CARD_GRADIENTS[key] || TIER_CARD_GRADIENTS.SILVER;
};

export interface TierBadgeProps {
  tier?: string;
  className?: string;
  showSuffix?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const TierBadge: React.FC<TierBadgeProps> = ({
  tier = 'SILVER',
  className = '',
  showSuffix = true,
  size = 'md',
}) => {
  const config = getTierStyle(tier);
  const normalizedTier = (tier || 'SILVER').toUpperCase();

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[0.65rem] font-bold rounded',
    md: 'px-2.5 py-1 text-[0.7rem] font-extrabold rounded-md',
    lg: 'px-3 py-1.5 text-xs font-black rounded-lg',
  }[size];

  return (
    <span
      className={`inline-flex items-center justify-center tracking-wider border shadow-xs select-none whitespace-nowrap uppercase ${sizeClasses} ${className}`}
      style={{
        background: config.background,
        color: config.textColor,
        borderColor: config.borderColor,
        boxShadow: config.boxShadow,
      }}
    >
      {normalizedTier}{showSuffix ? ' TIER' : ''}
    </span>
  );
};
