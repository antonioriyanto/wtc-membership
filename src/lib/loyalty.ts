import { LoyaltyConfig } from '../types';
import { initialLoyaltyConfig } from '../data/mockData';

/**
 * Retrieve the active loyalty configuration from local storage with fallback
 * to official Watch Club defaults (Rp 10.000 per base point, 1.25x Gold, 1.75x Platinum).
 */
export function getLoyaltyConfig(): LoyaltyConfig {
  try {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('wtc_loyalty_config') : null;
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        const { diamondThreshold, blackThreshold, diamondMultiplier, blackMultiplier, ...clean } = parsed;
        // Self-heal legacy 1000 amountUnit to 10000 default if not explicitly changed
        const effectiveAmountUnit = (!clean.amountUnit || clean.amountUnit === 1000) ? 10000 : clean.amountUnit;
        const effectiveGoldMultiplier = (!clean.goldMultiplier || clean.goldMultiplier === 1.5) ? 1.25 : clean.goldMultiplier;
        const effectivePlatinumMultiplier = (!clean.platinumMultiplier || clean.platinumMultiplier === 2.0) ? 1.75 : clean.platinumMultiplier;

        return {
          ...initialLoyaltyConfig,
          ...clean,
          amountUnit: Number(effectiveAmountUnit) || 10000,
          pointsPerAmount: Number(clean.pointsPerAmount) || 1,
          goldMultiplier: Number(effectiveGoldMultiplier) || 1.25,
          platinumMultiplier: Number(effectivePlatinumMultiplier) || 1.75,
        };
      }
    }
  } catch {}
  return initialLoyaltyConfig;
}

export function calculateTier(points: number, config?: Partial<LoyaltyConfig> | null): 'BLUE' | 'SILVER' | 'GOLD' | 'PLATINUM' {
  if (points == null || isNaN(points)) return 'BLUE';
  
  const effectiveConfig = config || getLoyaltyConfig();
  const platinumThreshold = Number(effectiveConfig?.platinumThreshold) || 30000;
  const goldThreshold = Number(effectiveConfig?.goldThreshold) || 10000;
  const silverThreshold = Number(effectiveConfig?.silverThreshold) || 5000;

  if (points >= platinumThreshold) return 'PLATINUM';
  if (points >= goldThreshold) return 'GOLD';
  if (points >= silverThreshold) return 'SILVER';
  return 'BLUE';
}

export function getTierMultiplier(tier: string, config?: Partial<LoyaltyConfig> | null): number {
  const effectiveConfig = config || getLoyaltyConfig();
  
  if (tier === 'PLATINUM') return Number(effectiveConfig?.platinumMultiplier) || 1.75;
  if (tier === 'GOLD') return Number(effectiveConfig?.goldMultiplier) || 1.25;
  return 1.0;
}

export function calculateEarnedPoints(amount: number, currentTier: string = 'BLUE', config?: Partial<LoyaltyConfig> | null): number {
  if (amount <= 0 || isNaN(amount) || !isFinite(amount)) return 0;
  
  const effectiveConfig = config || getLoyaltyConfig();
  const unit = Number(effectiveConfig?.amountUnit) > 0 ? Number(effectiveConfig.amountUnit) : 10000;
  const perUnit = Number(effectiveConfig?.pointsPerAmount) > 0 ? Number(effectiveConfig.pointsPerAmount) : 1;

  const basePoints = Math.floor(amount / unit) * perUnit;
  const multiplier = getTierMultiplier(currentTier, effectiveConfig);
  const earnedPoints = Math.floor(basePoints * multiplier);
  
  return Math.max(0, earnedPoints);
}
