import React, { useState, useEffect } from 'react';
import { MembershipTier, TIER_BENEFITS_DATA, TierBenefitItem } from '../data/tierBenefitsData';
import { X, Sparkles, Percent, Gift, Wrench, CheckCircle2, Info, ChevronRight, ShieldCheck } from 'lucide-react';

export interface TierBenefitsListProps {
  currentTier: MembershipTier;
  onSelectBenefit?: (benefit: TierBenefitItem) => void;
}

const BenefitIcon: React.FC<{ type: TierBenefitItem['iconType']; className?: string }> = ({ type, className = 'w-5 h-5' }) => {
  switch (type) {
    case 'percent':
      return <Percent className={className} />;
    case 'gift':
      return <Gift className={className} />;
    case 'service':
      return <Wrench className={className} />;
    case 'sparkle':
    default:
      return <Sparkles className={className} />;
  }
};

export const TierBenefitsList: React.FC<TierBenefitsListProps> = ({
  currentTier = 'BLUE',
  onSelectBenefit
}) => {
  const normalizedTier = (currentTier ? currentTier.toUpperCase() : 'BLUE') as MembershipTier;
  const benefits = TIER_BENEFITS_DATA[normalizedTier] || TIER_BENEFITS_DATA.BLUE;
  const [selectedBenefit, setSelectedBenefit] = useState<TierBenefitItem | null>(null);

  // Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedBenefit(null);
      }
    };
    if (selectedBenefit) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBenefit]);

  const handleItemClick = (item: TierBenefitItem) => {
    setSelectedBenefit(item);
    if (onSelectBenefit) {
      onSelectBenefit(item);
    }
  };

  // Tier accent theme color
  const getTierAccent = () => {
    switch (normalizedTier) {
      case 'SILVER':
        return {
          badge: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200',
          iconBg: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200',
          button: 'bg-slate-800 text-white hover:bg-slate-900',
        };
      case 'GOLD':
        return {
          badge: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200',
          iconBg: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
          button: 'bg-amber-600 text-white hover:bg-amber-700',
        };
      case 'PLATINUM':
        return {
          badge: 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-100',
          iconBg: 'bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-100',
          button: 'bg-neutral-900 text-white hover:bg-black',
        };
      case 'BLUE':
      default:
        return {
          badge: 'bg-blue-50 text-[#30466E] border-blue-200 dark:bg-blue-950/50 dark:text-blue-200',
          iconBg: 'bg-blue-50 text-[#4375A6] dark:bg-blue-900/30 dark:text-blue-300',
          button: 'bg-[#30466E] text-white hover:bg-[#222649]',
        };
    }
  };

  const accent = getTierAccent();

  return (
    <>
      <section className="m-5">
        <div className="flex items-center justify-between mb-4 pl-1">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">
            Your {normalizedTier} Level Benefits
          </h2>
          <span className="text-xs text-neutral-400 font-medium">
            Ketuk untuk detail
          </span>
        </div>

        <div className="rounded-3xl border border-neutral-100 dark:border-white/10 bg-white dark:bg-white/5 p-2 sm:p-3 shadow-sm">
          <ul className="divide-y divide-neutral-100 dark:divide-white/5">
            {benefits.map((item) => (
              <li
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="py-4 px-3 flex items-center justify-between hover:bg-neutral-50/90 dark:hover:bg-white/5 transition-colors rounded-2xl cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex items-center gap-4 min-w-0 pr-2">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${accent.iconBg}`}>
                    <BenefitIcon type={item.iconType} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-neutral-800 dark:text-neutral-100 truncate">
                        {item.title}
                      </span>
                      {item.badgeText && (
                        <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-300">
                          {item.badgeText}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                      {item.description}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-colors">
                  <span className="text-[11px] font-medium hidden sm:inline">Detail</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* DETAIL BENEFIT POP-UP MODAL */}
      {selectedBenefit && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedBenefit(null)}
        >
          <div 
            className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl border border-black/10 dark:border-white/15 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 pt-6 pb-4 flex items-start justify-between border-b border-neutral-100 dark:border-white/10">
              <div className="flex items-center gap-3.5 min-w-0 pr-2">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${accent.iconBg}`}>
                  <BenefitIcon type={selectedBenefit.iconType} className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${accent.badge}`}>
                      {normalizedTier} TIER
                    </span>
                    {selectedBenefit.badgeText && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-300">
                        {selectedBenefit.badgeText}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white mt-1 leading-tight">
                    {selectedBenefit.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedBenefit(null)}
                className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-neutral-500 hover:text-neutral-800 dark:text-neutral-300 transition-colors flex-shrink-0 cursor-pointer"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="px-6 py-5 overflow-y-auto space-y-5 text-neutral-700 dark:text-neutral-300">
              {/* Ringkasan & Penjelasan Lengkap */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">
                  Penjelasan Reward Lengkap
                </h4>
                <div className="text-sm sm:text-base leading-relaxed text-neutral-800 dark:text-neutral-100 bg-neutral-50/80 dark:bg-white/5 p-4 rounded-2xl border border-neutral-100 dark:border-white/5 font-normal">
                  {selectedBenefit.fullDetails}
                </div>
              </div>

              {/* Cara Penggunaan / Klaim */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                  <span>Cara Menggunakan & Klaim di Toko</span>
                </div>
                <div className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-200 bg-blue-50/60 dark:bg-blue-950/30 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/40">
                  {selectedBenefit.howToUse}
                </div>
              </div>

              {/* Syarat & Ketentuan */}
              {selectedBenefit.terms && selectedBenefit.terms.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Syarat & Ketentuan Resmi</span>
                  </div>
                  <ul className="space-y-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 pl-1">
                    {selectedBenefit.terms.map((term, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="leading-snug">{term}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-neutral-100 dark:border-white/10 bg-neutral-50/50 dark:bg-neutral-900/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedBenefit(null)}
                className={`w-full py-3 px-5 rounded-2xl font-bold text-sm transition-all shadow-sm cursor-pointer ${accent.button}`}
              >
                Mengerti & Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
