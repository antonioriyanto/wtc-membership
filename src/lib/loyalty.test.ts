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
  });

  describe('calculateEarnedPoints', () => {
    it('calculates points properly based on multipliers', () => {
      const config = null; // using fallback config
      expect(calculateEarnedPoints(1000, 'BLUE', config)).toBe(1);
      expect(calculateEarnedPoints(5000, 'SILVER', config)).toBe(5);
      expect(calculateEarnedPoints(10000, 'GOLD', config)).toBe(15);
      expect(calculateEarnedPoints(10000, 'PLATINUM', config)).toBe(20);
    });

    it('handles malformed financial inputs safely', () => {
      const config = null;
      expect(calculateEarnedPoints(-10000, 'GOLD', config)).toBe(0);
      expect(calculateEarnedPoints(NaN, 'GOLD', config)).toBe(0);
      expect(calculateEarnedPoints(Infinity, 'GOLD', config)).toBe(0); // Guarded inside func
    });
  });
});
