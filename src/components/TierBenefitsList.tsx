import React from 'react';
import { MembershipTier, TIER_BENEFITS_DATA, TierBenefitItem } from '../data/tierBenefitsData';

export interface TierBenefitsListProps {
  currentTier: MembershipTier;
  onSelectBenefit?: (benefitTitle: string) => void;
}

const BenefitIcon: React.FC<{ type: TierBenefitItem['iconType'] }> = ({ type }) => {
  switch (type) {
    case 'percent':
      return (
        <svg className="w-5 h-5 text-neutral-600 dark:text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="5" x2="5" y2="19" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="6.5" cy="6.5" r="2.5" />
          <circle cx="17.5" cy="17.5" r="2.5" />
        </svg>
      );
    case 'gift':
      return (
        <svg className="w-5 h-5 text-neutral-600 dark:text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <polyline points="20 12 20 22 4 22 4 12" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="2" y="7" width="20" height="5" rx="1" />
          <line x1="12" y1="22" x2="12" y2="7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'service':
      return (
        <svg className="w-5 h-5 text-neutral-600 dark:text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="7" />
          <polyline points="12 9 12 12 14 13" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'sparkle':
    default:
      return (
        <svg className="w-5 h-5 text-neutral-600 dark:text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l2.4 7.2L21.6 12l-7.2 2.8L12 22l-2.4-7.2L2.4 12l7.2-2.8L12 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
};

const ChevronRightIcon: React.FC = () => (
  <svg className="w-4 h-4 text-neutral-300 dark:text-neutral-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const TierBenefitsList: React.FC<TierBenefitsListProps> = ({
  currentTier = 'BLUE',
  onSelectBenefit
}) => {
  const normalizedTier = (currentTier ? currentTier.toUpperCase() : 'BLUE') as MembershipTier;
  const benefits = TIER_BENEFITS_DATA[normalizedTier] || TIER_BENEFITS_DATA.BLUE;

  return (
    <section className="m-5">
      <h2 className="text-base font-bold mb-4 pl-1 text-neutral-900 dark:text-white">
        Your {normalizedTier} Level Benefits
      </h2>
      <div className="rounded-3xl border border-neutral-100 dark:border-white/10 bg-white dark:bg-white/5 p-2 sm:p-3 shadow-sm">
        <ul className="divide-y divide-neutral-100 dark:divide-white/5">
          {benefits.map((item) => (
            <li
              key={item.id}
              onClick={() => onSelectBenefit?.(item.title)}
              className="py-4 px-3 flex items-center justify-between hover:bg-neutral-50/80 dark:hover:bg-white/5 transition-colors rounded-2xl cursor-pointer"
            >
              <div className="flex items-center gap-4 min-w-0 pr-2">
                <div className="w-9 h-9 rounded-xl bg-neutral-100/80 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                  <BenefitIcon type={item.iconType} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate">
                    {item.title}
                  </div>
                  <div className="text-xs text-neutral-400 dark:text-neutral-400 mt-0.5 line-clamp-1">
                    {item.description}
                  </div>
                </div>
              </div>
              <ChevronRightIcon />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
