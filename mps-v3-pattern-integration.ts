/**
 * Candle Pattern Recognition Tests
 */

import { describe, it, expect } from 'vitest';
import { CandlePatternDetector } from './candle-patterns';
import type { ChartCandle } from './candle-patterns';

describe('CandlePatternDetector', () => {
  // ============================================================================
  // TEST DATA
  // ============================================================================

  const createCandle = (
    timestamp: number,
    open: number,
    high: number,
    low: number,
    close: number,
    volume: number = 1000
  ): any => ({
    timestamp,
    open,
    high,
    low,
    close,
    volume,
  });

  // ============================================================================
  // BULLISH ENGULFING TESTS
  // ============================================================================

  describe('Bullish Engulfing', () => {
    it('should detect bullish engulfing pattern', () => {
      const candles = [
        createCandle(1000, 100, 102, 98, 99), // Bearish candle
        createCandle(2000, 98, 105, 97, 104), // Bullish engulfing
      ];

      const pattern = CandlePatternDetector.detectEngulfing(candles, '1h');

      expect(pattern).not.toBeNull();
      expect(pattern?.type).toBe('BULLISH_ENGULFING');
      expect(pattern?.direction).toBe('BULLISH');
      expect(pattern?.tradingSignal).toBe('BUY');
    });

    it('should not detect engulfing when candles dont meet criteria', () => {
      const candles = [
        createCandle(1000, 100, 102, 98, 99), // Bearish
        createCandle(2000, 100, 101, 99, 100), // Small bullish (not engulfing)
      ];

      const pattern = CandlePatternDetector.detectEngulfing(candles, '1h');

      expect(pattern).toBeNull();
    });
  });

  // ============================================================================
  // BEARISH ENGULFING TESTS
  // ============================================================================

  describe('Bearish Engulfing', () => {
    it('should detect bearish engulfing pattern', () => {
      const candles = [
        createCandle(1000, 98, 105, 97, 104), // Bullish candle
        createCandle(2000, 105, 106, 96, 97), // Bearish engulfing
      ];

      const pattern = CandlePatternDetector.detectEngulfing(candles, '1h');

      expect(pattern).not.toBeNull();
      expect(pattern?.type).toBe('BEARISH_ENGULFING');
      expect(pattern?.direction).toBe('BEARISH');
      expect(pattern?.tradingSignal).toBe('SELL');
    });
  });

  // ============================================================================
  // HAMMER TESTS
  // ============================================================================

  describe('Hammer', () => {
    it('should detect hammer pattern', () => {
      const candles = [
        createCandle(1000, 100, 102, 98, 99),
        createCandle(2000, 100, 102, 85, 101), // Hammer: long lower wick
      ];

      const pattern = CandlePatternDetector.detectHammer(candles[1], candles, '1h');

      expect(pattern).not.toBeNull();
      expect(pattern?.type).toBe('HAMMER');
      expect(pattern?.direction).toBe('BULLISH');
      expect(pattern?.tradingSignal).toBe('BUY');
    });

    it('should not detect hammer with short lower wick', () => {
      const candles = [
        createCandle(1000, 100, 102, 98, 99),
        createCandle(2000, 100, 102, 98, 101), // No long wick
      ];

      const pattern = CandlePatternDetector.detectHammer(candles[1], candles, '1h');

      expect(pattern).toBeNull();
    });
  });

  // ============================================================================
  // SHOOTING STAR TESTS
  // ============================================================================

  describe('Shooting Star', () => {
    it('should detect shooting star pattern', () => {
      const candles = [
        createCandle(1000, 100, 102, 98, 99),
        createCandle(2000, 100, 115, 99, 101), // Shooting star: long upper wick
      ];

      const pattern = CandlePatternDetector.detectShootingStar(candles[1], candles, '1h');

      expect(pattern).not.toBeNull();
      expect(pattern?.type).toBe('SHOOTING_STAR');
      expect(pattern?.direction).toBe('BEARISH');
      expect(pattern?.tradingSignal).toBe('SELL');
    });
  });

  // ============================================================================
  // DOJI TESTS
  // ============================================================================

  describe('Doji', () => {
    it('should detect doji pattern', () => {
      const candles = [
        createCandle(1000, 100, 102, 98, 99),
        createCandle(2000, 100, 110, 90, 100), // Doji: open ≈ close
      ];

      const pattern = CandlePatternDetector.detectDoji(candles[1], candles, '1h');

      expect(pattern).not.toBeNull();
      expect(pattern?.type).toBe('DOJI');
      expect(pattern?.tradingSignal).toBe('CAUTION');
    });

    it('should detect dragonfly doji', () => {
      const candles = [
        createCandle(1000, 100, 102, 98, 99),
        createCandle(2000, 100, 105, 85, 100), // Dragonfly: long lower wick
      ];

      const pattern = CandlePatternDetector.detectDoji(candles[1], candles, '1h');

      expect(pattern).not.toBeNull();
      expect(pattern?.type).toBe('DRAGONFLY_DOJI');
      expect(pattern?.direction).toBe('BULLISH');
    });

    it('should detect gravestone doji', () => {
      const candles = [
        createCandle(1000, 100, 102, 98, 99),
        createCandle(2000, 100, 115, 99, 100), // Gravestone: long upper wick
      ];

      const pattern = CandlePatternDetector.detectDoji(candles[1], candles, '1h');

      expect(pattern).not.toBeNull();
      expect(pattern?.type).toBe('GRAVESTONE_DOJI');
      expect(pattern?.direction).toBe('BEARISH');
    });
  });

  // ============================================================================
  // HARAMI TESTS
  // ============================================================================

  describe('Harami', () => {
    it('should detect bullish harami', () => {
      const candles = [
        createCandle(1000, 105, 106, 95, 96), // Bearish
        createCandle(2000, 98, 102, 97, 101), // Small bullish inside
      ];

      const pattern = CandlePatternDetector.detectHarami(candles, '1h');

      expect(pattern).not.toBeNull();
      expect(pattern?.type).toBe('BULLISH_HARAMI');
      expect(pattern?.direction).toBe('BULLISH');
    });

    it('should detect bearish harami', () => {
      const candles = [
        createCandle(1000, 95, 105, 94, 104), // Bullish
        createCandle(2000, 102, 103, 98, 99), // Small bearish inside
      ];

      const pattern = CandlePatternDetector.detectHarami(candles, '1h');

      expect(pattern).not.toBeNull();
      expect(pattern?.type).toBe('BEARISH_HARAMI');
      expect(pattern?.direction).toBe('BEARISH');
    });
  });

  // ============================================================================
  // PIERCING LINE TESTS
  // ============================================================================

  describe('Piercing Line', () => {
    it('should detect piercing line pattern', () => {
      const candles = [
        createCandle(1000, 105, 106, 95, 96), // Bearish
        createCandle(2000, 96, 105, 95, 103), // Bullish closing above midpoint
      ];

      const pattern = CandlePatternDetector.detectPiercingLine(candles, '1h');

      expect(pattern).not.toBeNull();
      expect(pattern?.type).toBe('PIERCING_LINE');
      expect(pattern?.direction).toBe('BULLISH');
      expect(pattern?.tradingSignal).toBe('BUY');
    });
  });

  // ============================================================================
  // DARK CLOUD COVER TESTS
  // ============================================================================

  describe('Dark Cloud Cover', () => {
    it('should detect dark cloud cover pattern', () => {
      const candles = [
        createCandle(1000, 95, 105, 94, 104), // Bullish
        createCandle(2000, 105, 106, 96, 97), // Bearish closing below midpoint
      ];

      const pattern = CandlePatternDetector.detectDarkCloudCover(candles, '1h');

      expect(pattern).not.toBeNull();
      expect(pattern?.type).toBe('DARK_CLOUD_COVER');
      expect(pattern?.direction).toBe('BEARISH');
      expect(pattern?.tradingSignal).toBe('SELL');
    });
  });

  // ============================================================================
  // MORNING STAR TESTS
  // ============================================================================

  describe('Morning Star', () => {
    it('should detect morning star pattern', () => {
      const candles = [
        createCandle(1000, 105, 106, 95, 96), // Bearish
        createCandle(2000, 95, 97, 94, 96), // Small body
        createCandle(3000, 96, 105, 95, 104), // Bullish
      ];

      const pattern = CandlePatternDetector.detectMorningStar(candles, '1h');

      expect(pattern).not.toBeNull();
      expect(pattern?.type).toBe('MORNING_STAR');
      expect(pattern?.direction).toBe('BULLISH');
      expect(pattern?.candleCount).toBe(3);
    });
  });

  // ============================================================================
  // EVENING STAR TESTS
  // ============================================================================

  describe('Evening Star', () => {
    it('should detect evening star pattern', () => {
      const candles = [
        createCandle(1000, 95, 105, 94, 104), // Bullish
        createCandle(2000, 104, 106, 103, 105), // Small body
        createCandle(3000, 105, 106, 96, 97), // Bearish
      ];

      const pattern = CandlePatternDetector.detectEveningStar(candles, '1h');

      expect(pattern).not.toBeNull();
      expect(pattern?.type).toBe('EVENING_STAR');
      expect(pattern?.direction).toBe('BEARISH');
      expect(pattern?.candleCount).toBe(3);
    });
  });

  // ============================================================================
  // THREE WHITE SOLDIERS TESTS
  // ============================================================================

  describe('Three White Soldiers', () => {
    it('should detect three white soldiers pattern', () => {
      const candles = [
        createCandle(1000, 95, 100, 94, 99), // Bullish
        createCandle(2000, 99, 102, 98, 101), // Bullish higher
        createCandle(3000, 101, 105, 100, 104), // Bullish higher
      ];

      const pattern = CandlePatternDetector.detectThreeWhiteSoldiers(candles, '1h');

      expect(pattern).not.toBeNull();
      expect(pattern?.type).toBe('THREE_WHITE_SOLDIERS');
      expect(pattern?.direction).toBe('BULLISH');
      expect(pattern?.candleCount).toBe(3);
    });
  });

  // ============================================================================
  // THREE BLACK CROWS TESTS
  // ============================================================================

  describe('Three Black Crows', () => {
    it('should detect three black crows pattern', () => {
      const candles = [
        createCandle(1000, 104, 105, 100, 101), // Bearish
        createCandle(2000, 101, 102, 98, 99), // Bearish lower
        createCandle(3000, 99, 100, 95, 96), // Bearish lower
      ];

      const pattern = CandlePatternDetector.detectThreeBlackCrows(candles, '1h');

      expect(pattern).not.toBeNull();
      expect(pattern?.type).toBe('THREE_BLACK_CROWS');
      expect(pattern?.direction).toBe('BEARISH');
      expect(pattern?.candleCount).toBe(3);
    });
  });

  // ============================================================================
  // MARUBOZU TESTS
  // ============================================================================

  describe('Marubozu', () => {
    it('should detect bullish marubozu', () => {
      const candles = [createCandle(1000, 100, 105, 100, 105)]; // No wicks

      const pattern = CandlePatternDetector.detectMarubozu(candles[0], candles, '1h');

      expect(pattern).not.toBeNull();
      expect(pattern?.type).toBe('MARUBOZU');
      expect(pattern?.direction).toBe('BULLISH');
    });
  });

  // ============================================================================
  // SPINNING TOP TESTS
  // ============================================================================

  describe('Spinning Top', () => {
    it('should detect spinning top pattern', () => {
      const candles = [createCandle(1000, 100, 115, 85, 101)]; // Long wicks, small body

      const pattern = CandlePatternDetector.detectSpinningTop(candles[0], candles, '1h');

      expect(pattern).not.toBeNull();
      expect(pattern?.type).toBe('SPINNING_TOP');
      expect(pattern?.tradingSignal).toBe('CAUTION');
    });
  });

  // ============================================================================
  // PATTERN SCORE CALCULATION TESTS
  // ============================================================================

  describe('Pattern Score Calculation', () => {
    it('should calculate pattern score correctly', () => {
      const pattern: any = {
        type: 'BULLISH_ENGULFING',
        timeframe: '1h',
        direction: 'BULLISH',
        strength: 80,
        reliability: 72,
        candleCount: 2,
        startIndex: 0,
        endIndex: 1,
        startTime: 1000,
        endTime: 2000,
        description: 'Test',
        tradingSignal: 'BUY',
      };

      const score = CandlePatternDetector.calculatePatternScore(pattern);

      // Score = (strength * 0.6 + reliability * 0.4)
      // = (80 * 0.6 + 72 * 0.4) = 48 + 28.8 = 76.8
      expect(score).toBeCloseTo(76.8, 1);
    });
  });
});
