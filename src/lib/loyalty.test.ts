import { describe, it, expect } from 'vitest';
import { calculateTier, getTierMultiplier, calculateEarnedPoints } from './loyalty';

describe('Loyalty Engine Boundary Tests', () => {
  describe('calculateTier', () => {
    it('handles exact boundary limits correctly', () => {
      expect(calculateTier(0)).toBe('BLUE');
      expect(calculateTier(4999)).toBe('BLUE');
      expect(calculateTier(5000)).toBe('SILVER');
      expect(calculateTier(9999)).toBe('SILVER');
      expect(calculateTier(10000)).toBe('GOLD');
      expect(calculateTier(29999)).toBe('GOLD');
      expect(calculateTier(30000)).toBe('PLATINUM');
      expect(calculateTier(49999)).toBe('PLATINUM');
      expect(calculateTier(50000)).toBe('PLATINUM');
      expect(calculateTier(99999)).toBe('PLATINUM');
      expect(calculateTier(100000)).toBe('PLATINUM');
      expect(calculateTier(999999999)).toBe('PLATINUM');
    });

    it('handles negative, NaN, and Infinity safely', () => {
      expect(calculateTier(-500)).toBe('BLUE');
      expect(calculateTier(NaN)).toBe('BLUE');
      expect(calculateTier(-Infinity)).toBe('BLUE');
      expect(calculateTier(Infinity)).toBe('PLATINUM');
    });

    it('respects dynamic custom thresholds from config', () => {
      const customConfig = {
        silverThreshold: 2000,
        goldThreshold: 8000,
        platinumThreshold: 25000,
      };
      expect(calculateTier(1999, customConfig)).toBe('BLUE');
      expect(calculateTier(2000, customConfig)).toBe('SILVER');
      expect(calculateTier(8000, customConfig)).toBe('GOLD');
      expect(calculateTier(25000, customConfig)).toBe('PLATINUM');
    });
  });

  describe('calculateEarnedPoints', () => {
    it('calculates points properly based on Watch Club default rules (Rp 10.000 = 1 Pt)', () => {
      const standardConfig = {
        amountUnit: 10000,
        pointsPerAmount: 1,
        goldMultiplier: 1.25,
        platinumMultiplier: 1.75
      };
      // Rp 1.254.600 for BLUE should give 125 Pts (matches user HO admin simulation)
      expect(calculateEarnedPoints(1254600, 'BLUE', standardConfig)).toBe(125);
      expect(calculateEarnedPoints(10000, 'BLUE', standardConfig)).toBe(1);
      expect(calculateEarnedPoints(50000, 'SILVER', standardConfig)).toBe(5);
      expect(calculateEarnedPoints(100000, 'GOLD', standardConfig)).toBe(12); // Math.floor(10 * 1.25)
      expect(calculateEarnedPoints(100000, 'PLATINUM', standardConfig)).toBe(17); // Math.floor(10 * 1.75)
    });

    it('supports custom legacy config ratios', () => {
      const legacyConfig = {
        amountUnit: 1000,
        pointsPerAmount: 1,
        goldMultiplier: 1.5,
        platinumMultiplier: 2.0
      };
      expect(calculateEarnedPoints(1000, 'BLUE', legacyConfig)).toBe(1);
      expect(calculateEarnedPoints(5000, 'SILVER', legacyConfig)).toBe(5);
      expect(calculateEarnedPoints(10000, 'GOLD', legacyConfig)).toBe(15);
      expect(calculateEarnedPoints(10000, 'PLATINUM', legacyConfig)).toBe(20);
    });

    it('handles malformed financial inputs safely', () => {
      const config = null;
      expect(calculateEarnedPoints(-10000, 'GOLD', config)).toBe(0);
      expect(calculateEarnedPoints(NaN, 'GOLD', config)).toBe(0);
      expect(calculateEarnedPoints(Infinity, 'GOLD', config)).toBe(0); // Guarded inside func
    });
  });
});
