import { describe, it, expect } from 'vitest';
import { TPSLCalculator } from './tp-sl-calculator';
import { ChartCandle } from '@/lib/types/trading';

describe('TPSLCalculator', () => {
  const calculator = new TPSLCalculator();

  // Helper to create mock candles
  const createCandles = (count: number, basePrice: number = 100): ChartCandle[] => {
    const candles: ChartCandle[] = [];
    for (let i = 0; i < count; i++) {
      const variation = Math.sin(i * 0.1) * 2;
      candles.push({
        timestamp: Date.now() - (count - i) * 60000,
        open: basePrice + variation,
        high: basePrice + variation + 1,
        low: basePrice + variation - 1,
        close: basePrice + variation + 0.5,
        volume: 1000000,
      });
    }
    return candles;
  };

  describe('calculateATR', () => {
    it('should calculate ATR correctly', () => {
      const candles = createCandles(20, 100);
      const atr = calculator.calculateATR(candles, 14);

      expect(atr).toBeGreaterThan(0);
      expect(atr).toBeLessThan(5);
    });

    it('should return 0 for insufficient candles', () => {
      const candles = createCandles(5, 100);
      const atr = calculator.calculateATR(candles, 14);

      expect(atr).toBe(0);
    });
  });

  describe('calculateBuyTPSL', () => {
    it('should calculate buy TP/SL with correct risk-reward ratios', () => {
      const candles = createCandles(20, 100);
      const entryPrice = 100;
      const result = calculator.calculateBuyTPSL(entryPrice, candles, 1.5);

      expect(result.entryPrice).toBe(entryPrice);
      expect(result.stopLoss).toBeLessThan(entryPrice);
      expect(result.takeProfit1).toBeGreaterThan(entryPrice);
      expect(result.takeProfit2).toBeGreaterThan(result.takeProfit1);
      expect(result.takeProfit3).toBeGreaterThan(result.takeProfit2);
      expect(result.takeProfit1RR).toBe(1);
      expect(result.takeProfit2RR).toBe(2);
      expect(result.takeProfit3RR).toBe(3);
    });

    it('should calculate correct risk amount', () => {
      const candles = createCandles(20, 100);
      const entryPrice = 100;
      const result = calculator.calculateBuyTPSL(entryPrice, candles, 1.5);

      const expectedRisk = entryPrice - result.stopLoss;
      expect(result.riskAmount).toBeCloseTo(expectedRisk, 2);
      expect(result.rewardAmount1).toBeCloseTo(expectedRisk * 1, 2);
      expect(result.rewardAmount2).toBeCloseTo(expectedRisk * 2, 2);
      expect(result.rewardAmount3).toBeCloseTo(expectedRisk * 3, 2);
    });

    it('should calculate correct percentages', () => {
      const candles = createCandles(20, 100);
      const entryPrice = 100;
      const result = calculator.calculateBuyTPSL(entryPrice, candles, 1.5);

      const expectedTP1Percent = ((result.takeProfit1 - entryPrice) / entryPrice) * 100;
      expect(result.takeProfit1Percent).toBeCloseTo(expectedTP1Percent, 2);
    });
  });

  describe('calculateSellTPSL', () => {
    it('should calculate sell TP/SL with correct risk-reward ratios', () => {
      const candles = createCandles(20, 100);
      const entryPrice = 100;
      const result = calculator.calculateSellTPSL(entryPrice, candles, 1.5);

      expect(result.entryPrice).toBe(entryPrice);
      expect(result.stopLoss).toBeGreaterThan(entryPrice);
      expect(result.takeProfit1).toBeLessThan(entryPrice);
      expect(result.takeProfit2).toBeLessThan(result.takeProfit1);
      expect(result.takeProfit3).toBeLessThan(result.takeProfit2);
      expect(result.takeProfit1RR).toBe(1);
      expect(result.takeProfit2RR).toBe(2);
      expect(result.takeProfit3RR).toBe(3);
    });
  });

  describe('calculateTPSL', () => {
    it('should delegate to calculateBuyTPSL for BUY signals', () => {
      const candles = createCandles(20, 100);
      const entryPrice = 100;
      const result = calculator.calculateTPSL('BUY', entryPrice, candles, 1.5);

      expect(result.stopLoss).toBeLessThan(entryPrice);
      expect(result.takeProfit1).toBeGreaterThan(entryPrice);
    });

    it('should delegate to calculateSellTPSL for SELL signals', () => {
      const candles = createCandles(20, 100);
      const entryPrice = 100;
      const result = calculator.calculateTPSL('SELL', entryPrice, candles, 1.5);

      expect(result.stopLoss).toBeGreaterThan(entryPrice);
      expect(result.takeProfit1).toBeLessThan(entryPrice);
    });
  });

  describe('checkTPSLHit', () => {
    it('should detect TP1 hit for BUY signal', () => {
      const candles = createCandles(20, 100);
      const entryPrice = 100;
      const tpsl = calculator.calculateBuyTPSL(entryPrice, candles, 1.5);

      const result = calculator.checkTPSLHit(tpsl.takeProfit1, tpsl, 'BUY');
      expect(result.hitTP).toBe(1);
      expect(result.hitSL).toBe(false);
    });

    it('should detect TP2 hit for BUY signal', () => {
      const candles = createCandles(20, 100);
      const entryPrice = 100;
      const tpsl = calculator.calculateBuyTPSL(entryPrice, candles, 1.5);

      const result = calculator.checkTPSLHit(tpsl.takeProfit2, tpsl, 'BUY');
      expect(result.hitTP).toBe(2);
      expect(result.hitSL).toBe(false);
    });

    it('should detect TP3 hit for BUY signal', () => {
      const candles = createCandles(20, 100);
      const entryPrice = 100;
      const tpsl = calculator.calculateBuyTPSL(entryPrice, candles, 1.5);

      const result = calculator.checkTPSLHit(tpsl.takeProfit3, tpsl, 'BUY');
      expect(result.hitTP).toBe(3);
      expect(result.hitSL).toBe(false);
    });

    it('should detect SL hit for BUY signal', () => {
      const candles = createCandles(20, 100);
      const entryPrice = 100;
      const tpsl = calculator.calculateBuyTPSL(entryPrice, candles, 1.5);

      const result = calculator.checkTPSLHit(tpsl.stopLoss - 1, tpsl, 'BUY');
      expect(result.hitTP).toBeNull();
      expect(result.hitSL).toBe(true);
    });

    it('should detect TP1 hit for SELL signal', () => {
      const candles = createCandles(20, 100);
      const entryPrice = 100;
      const tpsl = calculator.calculateSellTPSL(entryPrice, candles, 1.5);

      const result = calculator.checkTPSLHit(tpsl.takeProfit1, tpsl, 'SELL');
      expect(result.hitTP).toBe(1);
      expect(result.hitSL).toBe(false);
    });

    it('should detect SL hit for SELL signal', () => {
      const candles = createCandles(20, 100);
      const entryPrice = 100;
      const tpsl = calculator.calculateSellTPSL(entryPrice, candles, 1.5);

      const result = calculator.checkTPSLHit(tpsl.stopLoss + 1, tpsl, 'SELL');
      expect(result.hitTP).toBeNull();
      expect(result.hitSL).toBe(true);
    });
  });

  describe('formatTPSL', () => {
    it('should format TP/SL for display', () => {
      const candles = createCandles(20, 100);
      const entryPrice = 100;
      const tpsl = calculator.calculateBuyTPSL(entryPrice, candles, 1.5);

      const formatted = calculator.formatTPSL(tpsl);

      expect(formatted.sl).toContain('%');
      expect(formatted.tp1).toContain('%');
      expect(formatted.tp2).toContain('%');
      expect(formatted.tp3).toContain('%');
    });
  });
});
