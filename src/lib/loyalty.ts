export function calculateTier(points: number): 'BLUE' | 'SILVER' | 'GOLD' | 'PLATINUM' {
  if (points == null || isNaN(points)) return 'BLUE';
  
  if (points >= 30000) return 'PLATINUM';
  if (points >= 10000) return 'GOLD';
  if (points >= 5000) return 'SILVER';
  return 'BLUE';
}

export function getTierMultiplier(tier: string, config: any): number {
  if (!config) {
    // Default fallback rules
    if (tier === 'PLATINUM') return 2.0;
    if (tier === 'GOLD') return 1.5;
    return 1.0;
  }
  
  if (tier === 'PLATINUM') return Number(config.platinumMultiplier) || 2.0;
  if (tier === 'GOLD') return Number(config.goldMultiplier) || 1.5;
  return 1.0;
}

export function calculateEarnedPoints(amount: number, currentTier: string, config: any): number {
  if (amount <= 0 || isNaN(amount) || !isFinite(amount)) return 0;
  
  const basePoints = Math.floor(amount / 1000); // 1 point = Rp1000
  const multiplier = getTierMultiplier(currentTier, config);
  const earnedPoints = Math.floor(basePoints * multiplier);
  
  return earnedPoints;
}
