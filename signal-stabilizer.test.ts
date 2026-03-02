/**
 * Candle Pattern Recognition Engine
 * 
 * Detects and analyzes candlestick patterns across all 7 timeframes
 * Patterns include: Engulfing, Hammer, Doji, Shooting Star, Morning Star, Evening Star, etc.
 */

import { ChartCandle } from '@/lib/types/trading';

export type { ChartCandle };

// ============================================================================
// CANDLE PATTERN TYPES
// ============================================================================

export type CandlePatternType =
  | 'BULLISH_ENGULFING'
  | 'BEARISH_ENGULFING'
  | 'HAMMER'
  | 'INVERTED_HAMMER'
  | 'SHOOTING_STAR'
  | 'DOJI'
  | 'DRAGONFLY_DOJI'
  | 'GRAVESTONE_DOJI'
  | 'MORNING_STAR'
  | 'EVENING_STAR'
  | 'THREE_WHITE_SOLDIERS'
  | 'THREE_BLACK_CROWS'
  | 'BULLISH_HARAMI'
  | 'BEARISH_HARAMI'
  | 'PIERCING_LINE'
  | 'DARK_CLOUD_COVER'
  | 'MARUBOZU'
  | 'SPINNING_TOP'
  | 'KICKING'
  | 'LADDER_BOTTOM';

export interface CandlePattern {
  type: CandlePatternType;
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';
  direction: 'BULLISH' | 'BEARISH';
  strength: number; // 0-100 (confidence)
  reliability: number; // 0-100 (historical accuracy)
  candleCount: number; // Number of candles in pattern
  startIndex: number; // Index of first candle in pattern
  endIndex: number; // Index of last candle in pattern
  startTime: number;
  endTime: number;
  description: string;
  tradingSignal: 'BUY' | 'SELL' | 'CAUTION' | 'NEUTRAL';
  targetPrice?: number; // Projected price target
  stopLossPrice?: number; // Suggested stop loss
}

export interface CandleAnalysis {
  patterns: CandlePattern[];
  dominantPattern?: CandlePattern;
  patternCount: number;
  bullishPatterns: number;
  bearishPatterns: number;
  overallSignal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  patternStrength: number; // 0-100
}

// ============================================================================
// CANDLE PATTERN DETECTOR
// ============================================================================

export class CandlePatternDetector {
  /**
   * Analyze candles for patterns across all timeframes
   */
  static analyzeAllTimeframes(
    candles: { [timeframe: string]: ChartCandle[] }
  ): { [timeframe: string]: CandleAnalysis } {
    const results: { [timeframe: string]: CandleAnalysis } = {};
    const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'] as const;

    for (const timeframe of timeframes) {
      if (candles[timeframe] && candles[timeframe].length >= 3) {
        results[timeframe] = this.analyzeCandles(candles[timeframe], timeframe);
      }
    }

    return results;
  }

  /**
   * Analyze candles for patterns on a specific timeframe
   */
  static analyzeCandles(
    candles: ChartCandle[],
    timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w'
  ): CandleAnalysis {
    const patterns: CandlePattern[] = [];

    // Check for 2-candle patterns
    if (candles.length >= 2) {
      const engulfing = this.detectEngulfing(candles, timeframe);
      if (engulfing) patterns.push(engulfing);

      const harami = this.detectHarami(candles, timeframe);
      if (harami) patterns.push(harami);

      const piercing = this.detectPiercingLine(candles, timeframe);
      if (piercing) patterns.push(piercing);

      const darkCloud = this.detectDarkCloudCover(candles, timeframe);
      if (darkCloud) patterns.push(darkCloud);

      const kicking = this.detectKicking(candles, timeframe);
      if (kicking) patterns.push(kicking);
    }

    // Check for 3-candle patterns
    if (candles.length >= 3) {
      const morningStar = this.detectMorningStar(candles, timeframe);
      if (morningStar) patterns.push(morningStar);

      const eveningStar = this.detectEveningStar(candles, timeframe);
      if (eveningStar) patterns.push(eveningStar);

      const threeWhiteSoldiers = this.detectThreeWhiteSoldiers(candles, timeframe);
      if (threeWhiteSoldiers) patterns.push(threeWhiteSoldiers);

      const threeBlackCrows = this.detectThreeBlackCrows(candles, timeframe);
      if (threeBlackCrows) patterns.push(threeBlackCrows);

      const ladderBottom = this.detectLadderBottom(candles, timeframe);
      if (ladderBottom) patterns.push(ladderBottom);
    }

    // Check for single-candle patterns
    if (candles.length >= 1) {
      const lastCandle = candles[candles.length - 1];
      const hammer = this.detectHammer(lastCandle, candles, timeframe);
      if (hammer) patterns.push(hammer);

      const shootingStar = this.detectShootingStar(lastCandle, candles, timeframe);
      if (shootingStar) patterns.push(shootingStar);

      const doji = this.detectDoji(lastCandle, candles, timeframe);
      if (doji) patterns.push(doji);

      const marubozu = this.detectMarubozu(lastCandle, candles, timeframe);
      if (marubozu) patterns.push(marubozu);

      const spinningTop = this.detectSpinningTop(lastCandle, candles, timeframe);
      if (spinningTop) patterns.push(spinningTop);
    }

    // Calculate analysis
    const bullishPatterns = patterns.filter((p) => p.direction === 'BULLISH').length;
    const bearishPatterns = patterns.filter((p) => p.direction === 'BEARISH').length;

    let overallSignal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL' = 'HOLD';
    if (bullishPatterns > bearishPatterns * 1.5) {
      overallSignal = bullishPatterns >= 3 ? 'STRONG_BUY' : 'BUY';
    } else if (bearishPatterns > bullishPatterns * 1.5) {
      overallSignal = bearishPatterns >= 3 ? 'STRONG_SELL' : 'SELL';
    }

    const avgStrength = patterns.length > 0 ? patterns.reduce((sum, p) => sum + p.strength, 0) / patterns.length : 0;

    return {
      patterns,
      dominantPattern: patterns.length > 0 ? patterns[0] : undefined,
      patternCount: patterns.length,
      bullishPatterns,
      bearishPatterns,
      overallSignal,
      patternStrength: avgStrength,
    };
  }

  // ============================================================================
  // 2-CANDLE PATTERNS
  // ============================================================================

  /**
   * Bullish Engulfing: Small bearish candle followed by larger bullish candle
   * Bearish Engulfing: Small bullish candle followed by larger bearish candle
   */
  static detectEngulfing(
    candles: ChartCandle[],
    timeframe: string
  ): CandlePattern | null {
    if (candles.length < 2) return null;

    const prev = candles[candles.length - 2];
    const curr = candles[candles.length - 1];

    const prevIsBullish = curr.close > curr.open;
    const currIsBullish = curr.close > curr.open;

    // Bullish Engulfing
    if (!prevIsBullish && currIsBullish && curr.open < prev.close && curr.close > prev.open) {
      const strength = Math.min(100, ((curr.close - curr.open) / (prev.close - prev.open)) * 100);

      return {
        type: 'BULLISH_ENGULFING',
        timeframe: timeframe as any,
        direction: 'BULLISH',
        strength,
        reliability: 72,
        candleCount: 2,
        startIndex: candles.length - 2,
        endIndex: candles.length - 1,
        startTime: prev.timestamp,
        endTime: curr.timestamp,
        description: 'Bullish engulfing pattern - strong reversal signal',
        tradingSignal: 'BUY',
        targetPrice: curr.close + (curr.close - curr.open) * 1.5,
        stopLossPrice: curr.open,
      };
    }

    // Bearish Engulfing
    if (prevIsBullish && !currIsBullish && curr.open > prev.close && curr.close < prev.open) {
      const strength = Math.min(100, ((curr.open - curr.close) / (prev.open - prev.close)) * 100);

      return {
        type: 'BEARISH_ENGULFING',
        timeframe: timeframe as any,
        direction: 'BEARISH',
        strength,
        reliability: 72,
        candleCount: 2,
        startIndex: candles.length - 2,
        endIndex: candles.length - 1,
        startTime: prev.timestamp,
        endTime: curr.timestamp,
        description: 'Bearish engulfing pattern - strong reversal signal',
        tradingSignal: 'SELL',
        targetPrice: curr.close - (curr.open - curr.close) * 1.5,
        stopLossPrice: curr.open,
      };
    }

    return null;
  }

  /**
   * Hammer: Small body at top, long lower wick, minimal upper wick
   */
  static detectHammer(
    candle: ChartCandle,
    allCandles: ChartCandle[],
    timeframe: string
  ): CandlePattern | null {
    const bodySize = Math.abs(candle.close - candle.open);
    const lowerWick = candle.open > candle.close ? candle.close - candle.low : candle.open - candle.low;
    const upperWick = candle.high - Math.max(candle.open, candle.close);

    // Hammer criteria: lower wick is 2-3x body size, upper wick is small (allow 0 for edge cases)
    if (bodySize > 0 && lowerWick > bodySize * 2 && upperWick <= bodySize * 0.5) {
      const strength = Math.min(100, (lowerWick / bodySize) * 30);

      return {
        type: 'HAMMER',
        timeframe: timeframe as any,
        direction: 'BULLISH',
        strength,
        reliability: 68,
        candleCount: 1,
        startIndex: allCandles.length - 1,
        endIndex: allCandles.length - 1,
        startTime: candle.timestamp,
        endTime: candle.timestamp,
        description: 'Hammer pattern - potential reversal from downtrend',
        tradingSignal: 'BUY',
        targetPrice: candle.close + lowerWick,
        stopLossPrice: candle.low,
      };
    }

    return null;
  }

  /**
   * Shooting Star: Small body at bottom, long upper wick, minimal lower wick
   */
  static detectShootingStar(
    candle: ChartCandle,
    allCandles: ChartCandle[],
    timeframe: string
  ): CandlePattern | null {
    const bodySize = Math.abs(candle.close - candle.open);
    const upperWick = candle.high - Math.max(candle.open, candle.close);
    const lowerWick = Math.min(candle.open, candle.close) - candle.low;

    // Shooting Star criteria: upper wick is 2-3x body size, lower wick is small (allow 0 for edge cases)
    if (bodySize > 0 && upperWick > bodySize * 2 && lowerWick <= bodySize * 0.5) {
      const strength = Math.min(100, (upperWick / bodySize) * 30);

      return {
        type: 'SHOOTING_STAR',
        timeframe: timeframe as any,
        direction: 'BEARISH',
        strength,
        reliability: 68,
        candleCount: 1,
        startIndex: allCandles.length - 1,
        endIndex: allCandles.length - 1,
        startTime: candle.timestamp,
        endTime: candle.timestamp,
        description: 'Shooting star pattern - potential reversal from uptrend',
        tradingSignal: 'SELL',
        targetPrice: candle.close - upperWick,
        stopLossPrice: candle.high,
      };
    }

    return null;
  }

  /**
   * Doji: Open and close are equal or very close
   */
  static detectDoji(
    candle: ChartCandle,
    allCandles: ChartCandle[],
    timeframe: string
  ): CandlePattern | null {
    const bodySize = Math.abs(candle.close - candle.open);
    const totalRange = candle.high - candle.low;

    // Doji: body is less than 5% of total range
    if (bodySize < totalRange * 0.05) {
      const upperWick = candle.high - Math.max(candle.open, candle.close);
      const lowerWick = Math.min(candle.open, candle.close) - candle.low;

      let type: CandlePatternType = 'DOJI';
      let direction: 'BULLISH' | 'BEARISH' = 'NEUTRAL' as any;

      if (upperWick > lowerWick * 2) {
        type = 'GRAVESTONE_DOJI';
        direction = 'BEARISH';
      } else if (lowerWick > upperWick * 2) {
        type = 'DRAGONFLY_DOJI';
        direction = 'BULLISH';
      }

      return {
        type,
        timeframe: timeframe as any,
        direction,
        strength: 50,
        reliability: 55,
        candleCount: 1,
        startIndex: allCandles.length - 1,
        endIndex: allCandles.length - 1,
        startTime: candle.timestamp,
        endTime: candle.timestamp,
        description: `${type} - indecision pattern, potential reversal`,
        tradingSignal: 'CAUTION',
      };
    }

    return null;
  }

  /**
   * Harami: First candle is large, second candle is small and inside first
   */
  static detectHarami(
    candles: ChartCandle[],
    timeframe: string
  ): CandlePattern | null {
    if (candles.length < 2) return null;

    const prev = candles[candles.length - 2];
    const curr = candles[candles.length - 1];

    const prevIsBullish = prev.close > prev.open;
    const currIsBullish = curr.close > curr.open;

    // Bullish Harami: bearish followed by small bullish inside (allow <= for boundaries)
    if (!prevIsBullish && currIsBullish && curr.high < prev.close && curr.low > prev.open) {
      return {
        type: 'BULLISH_HARAMI',
        timeframe: timeframe as any,
        direction: 'BULLISH',
        strength: 55,
        reliability: 61,
        candleCount: 2,
        startIndex: candles.length - 2,
        endIndex: candles.length - 1,
        startTime: prev.timestamp,
        endTime: curr.timestamp,
        description: 'Bullish harami - potential reversal from downtrend',
        tradingSignal: 'BUY',
      };
    }

    // Bearish Harami: bullish followed by small bearish inside (allow < for boundaries)
    if (prevIsBullish && !currIsBullish && curr.high < prev.close && curr.low > prev.open) {
      return {
        type: 'BEARISH_HARAMI',
        timeframe: timeframe as any,
        direction: 'BEARISH',
        strength: 55,
        reliability: 61,
        candleCount: 2,
        startIndex: candles.length - 2,
        endIndex: candles.length - 1,
        startTime: prev.timestamp,
        endTime: curr.timestamp,
        description: 'Bearish harami - potential reversal from uptrend',
        tradingSignal: 'SELL',
      };
    }

    return null;
  }

  /**
   * Piercing Line: Bearish candle followed by bullish candle closing above midpoint
   */
  static detectPiercingLine(
    candles: ChartCandle[],
    timeframe: string
  ): CandlePattern | null {
    if (candles.length < 2) return null;

    const prev = candles[candles.length - 2];
    const curr = candles[candles.length - 1];

    const prevIsBearish = prev.close < prev.open;
    const currIsBullish = curr.close > curr.open;
    const midpoint = (prev.open + prev.close) / 2;

    if (prevIsBearish && currIsBullish && curr.close > midpoint && curr.open < prev.close) {
      return {
        type: 'PIERCING_LINE',
        timeframe: timeframe as any,
        direction: 'BULLISH',
        strength: 65,
        reliability: 66,
        candleCount: 2,
        startIndex: candles.length - 2,
        endIndex: candles.length - 1,
        startTime: prev.timestamp,
        endTime: curr.timestamp,
        description: 'Piercing line - bullish reversal pattern',
        tradingSignal: 'BUY',
      };
    }

    return null;
  }

  /**
   * Dark Cloud Cover: Bullish candle followed by bearish candle closing below midpoint
   */
  static detectDarkCloudCover(
    candles: ChartCandle[],
    timeframe: string
  ): CandlePattern | null {
    if (candles.length < 2) return null;

    const prev = candles[candles.length - 2];
    const curr = candles[candles.length - 1];

    const prevIsBullish = prev.close > prev.open;
    const currIsBearish = curr.close < curr.open;
    const midpoint = prev.open + (prev.close - prev.open) / 2;

    if (prevIsBullish && currIsBearish && curr.close < midpoint && curr.open > prev.close) {
      return {
        type: 'DARK_CLOUD_COVER',
        timeframe: timeframe as any,
        direction: 'BEARISH',
        strength: 65,
        reliability: 66,
        candleCount: 2,
        startIndex: candles.length - 2,
        endIndex: candles.length - 1,
        startTime: prev.timestamp,
        endTime: curr.timestamp,
        description: 'Dark cloud cover - bearish reversal pattern',
        tradingSignal: 'SELL',
      };
    }

    return null;
  }

  /**
   * Kicking: Two candles with gaps between them, opposite directions
   */
  static detectKicking(
    candles: ChartCandle[],
    timeframe: string
  ): CandlePattern | null {
    if (candles.length < 2) return null;

    const prev = candles[candles.length - 2];
    const curr = candles[candles.length - 1];

    const prevIsBullish = prev.close > prev.open;
    const currIsBullish = curr.close > curr.open;

    // Bullish kicking: bearish gap down, then bullish gap up
    if (!prevIsBullish && currIsBullish && curr.low > prev.high) {
      return {
        type: 'KICKING',
        timeframe: timeframe as any,
        direction: 'BULLISH',
        strength: 75,
        reliability: 75,
        candleCount: 2,
        startIndex: candles.length - 2,
        endIndex: candles.length - 1,
        startTime: prev.timestamp,
        endTime: curr.timestamp,
        description: 'Kicking pattern - strong bullish reversal',
        tradingSignal: 'BUY',
      };
    }

    // Bearish kicking: bullish gap up, then bearish gap down
    if (prevIsBullish && !currIsBullish && curr.high < prev.low) {
      return {
        type: 'KICKING',
        timeframe: timeframe as any,
        direction: 'BEARISH',
        strength: 75,
        reliability: 75,
        candleCount: 2,
        startIndex: candles.length - 2,
        endIndex: candles.length - 1,
        startTime: prev.timestamp,
        endTime: curr.timestamp,
        description: 'Kicking pattern - strong bearish reversal',
        tradingSignal: 'SELL',
      };
    }

    return null;
  }

  // ============================================================================
  // 3-CANDLE PATTERNS
  // ============================================================================

  /**
   * Morning Star: Bearish, small body, bullish - reversal from downtrend
   */
  static detectMorningStar(
    candles: ChartCandle[],
    timeframe: string
  ): CandlePattern | null {
    if (candles.length < 3) return null;

    const first = candles[candles.length - 3];
    const second = candles[candles.length - 2];
    const third = candles[candles.length - 1];

    const firstIsBearish = first.close < first.open;
    const firstBodySize = Math.abs(first.close - first.open);
    const secondSmall = Math.abs(second.close - second.open) < firstBodySize * 0.5;
    const thirdIsBullish = third.close > third.open;
    const thirdAboveFirst = third.close > (first.open + first.close) / 2;

    if (firstIsBearish && secondSmall && thirdIsBullish && thirdAboveFirst) {
      return {
        type: 'MORNING_STAR',
        timeframe: timeframe as any,
        direction: 'BULLISH',
        strength: 78,
        reliability: 78,
        candleCount: 3,
        startIndex: candles.length - 3,
        endIndex: candles.length - 1,
        startTime: first.timestamp,
        endTime: third.timestamp,
        description: 'Morning star - strong bullish reversal from downtrend',
        tradingSignal: 'BUY',
        targetPrice: third.close + (third.close - first.close),
      };
    }

    return null;
  }

  /**
   * Evening Star: Bullish, small body, bearish - reversal from uptrend
   */
  static detectEveningStar(
    candles: ChartCandle[],
    timeframe: string
  ): CandlePattern | null {
    if (candles.length < 3) return null;

    const first = candles[candles.length - 3];
    const second = candles[candles.length - 2];
    const third = candles[candles.length - 1];

    const firstIsBullish = first.close > first.open;
    const secondSmall = Math.abs(second.close - second.open) < (first.close - first.open) * 0.5;
    const thirdIsBearish = third.close < third.open;
    const thirdBelowFirst = third.close < (first.open + first.close) / 2;

    if (firstIsBullish && secondSmall && thirdIsBearish && thirdBelowFirst) {
      return {
        type: 'EVENING_STAR',
        timeframe: timeframe as any,
        direction: 'BEARISH',
        strength: 78,
        reliability: 78,
        candleCount: 3,
        startIndex: candles.length - 3,
        endIndex: candles.length - 1,
        startTime: first.timestamp,
        endTime: third.timestamp,
        description: 'Evening star - strong bearish reversal from uptrend',
        tradingSignal: 'SELL',
        targetPrice: third.close - (first.close - third.close),
      };
    }

    return null;
  }

  /**
   * Three White Soldiers: Three consecutive bullish candles with increasing closes
   */
  static detectThreeWhiteSoldiers(
    candles: ChartCandle[],
    timeframe: string
  ): CandlePattern | null {
    if (candles.length < 3) return null;

    const first = candles[candles.length - 3];
    const second = candles[candles.length - 2];
    const third = candles[candles.length - 1];

    if (
      first.close > first.open &&
      second.close > second.open &&
      third.close > third.open &&
      second.close > first.close &&
      third.close > second.close
    ) {
      return {
        type: 'THREE_WHITE_SOLDIERS',
        timeframe: timeframe as any,
        direction: 'BULLISH',
        strength: 82,
        reliability: 82,
        candleCount: 3,
        startIndex: candles.length - 3,
        endIndex: candles.length - 1,
        startTime: first.timestamp,
        endTime: third.timestamp,
        description: 'Three white soldiers - strong bullish continuation',
        tradingSignal: 'BUY',
        targetPrice: third.close + (third.close - first.close),
      };
    }

    return null;
  }

  /**
   * Three Black Crows: Three consecutive bearish candles with decreasing closes
   */
  static detectThreeBlackCrows(
    candles: ChartCandle[],
    timeframe: string
  ): CandlePattern | null {
    if (candles.length < 3) return null;

    const first = candles[candles.length - 3];
    const second = candles[candles.length - 2];
    const third = candles[candles.length - 1];

    if (
      first.close < first.open &&
      second.close < second.open &&
      third.close < third.open &&
      second.close < first.close &&
      third.close < second.close
    ) {
      return {
        type: 'THREE_BLACK_CROWS',
        timeframe: timeframe as any,
        direction: 'BEARISH',
        strength: 82,
        reliability: 82,
        candleCount: 3,
        startIndex: candles.length - 3,
        endIndex: candles.length - 1,
        startTime: first.timestamp,
        endTime: third.timestamp,
        description: 'Three black crows - strong bearish continuation',
        tradingSignal: 'SELL',
        targetPrice: third.close - (first.close - third.close),
      };
    }

    return null;
  }

  /**
   * Ladder Bottom: Three bearish candles with each lower low, then reversal
   */
  static detectLadderBottom(
    candles: ChartCandle[],
    timeframe: string
  ): CandlePattern | null {
    if (candles.length < 3) return null;

    const first = candles[candles.length - 3];
    const second = candles[candles.length - 2];
    const third = candles[candles.length - 1];

    if (
      first.close < first.open &&
      second.close < second.open &&
      second.low < first.low &&
      third.close > third.open &&
      third.close > second.close
    ) {
      return {
        type: 'LADDER_BOTTOM',
        timeframe: timeframe as any,
        direction: 'BULLISH',
        strength: 75,
        reliability: 70,
        candleCount: 3,
        startIndex: candles.length - 3,
        endIndex: candles.length - 1,
        startTime: first.timestamp,
        endTime: third.timestamp,
        description: 'Ladder bottom - reversal after multiple lows',
        tradingSignal: 'BUY',
      };
    }

    return null;
  }

  // ============================================================================
  // SINGLE CANDLE PATTERNS
  // ============================================================================

  /**
   * Marubozu: No wicks, body fills entire candle
   */
  static detectMarubozu(
    candle: ChartCandle,
    allCandles: ChartCandle[],
    timeframe: string
  ): CandlePattern | null {
    const isBullish = candle.close > candle.open;
    const hasNoWicks = candle.open === candle.low && candle.close === candle.high;

    if (hasNoWicks) {
      return {
        type: 'MARUBOZU',
        timeframe: timeframe as any,
        direction: isBullish ? 'BULLISH' : 'BEARISH',
        strength: 70,
        reliability: 68,
        candleCount: 1,
        startIndex: allCandles.length - 1,
        endIndex: allCandles.length - 1,
        startTime: candle.timestamp,
        endTime: candle.timestamp,
        description: `${isBullish ? 'Bullish' : 'Bearish'} marubozu - strong conviction`,
        tradingSignal: isBullish ? 'BUY' : 'SELL',
      };
    }

    return null;
  }

  /**
   * Spinning Top: Small body with long wicks on both sides
   */
  static detectSpinningTop(
    candle: ChartCandle,
    allCandles: ChartCandle[],
    timeframe: string
  ): CandlePattern | null {
    const bodySize = Math.abs(candle.close - candle.open);
    const totalRange = candle.high - candle.low;
    const upperWick = candle.high - Math.max(candle.open, candle.close);
    const lowerWick = Math.min(candle.open, candle.close) - candle.low;

    if (
      bodySize < totalRange * 0.3 &&
      upperWick > bodySize * 1.5 &&
      lowerWick > bodySize * 1.5
    ) {
      return {
        type: 'SPINNING_TOP',
        timeframe: timeframe as any,
        direction: 'NEUTRAL' as any,
        strength: 40,
        reliability: 50,
        candleCount: 1,
        startIndex: allCandles.length - 1,
        endIndex: allCandles.length - 1,
        startTime: candle.timestamp,
        endTime: candle.timestamp,
        description: 'Spinning top - indecision, potential reversal',
        tradingSignal: 'CAUTION',
      };
    }

    return null;
  }

  /**
   * Inverted Hammer: Small body at bottom, long upper wick
   */
  static detectInvertedHammer(
    candle: ChartCandle,
    allCandles: ChartCandle[],
    timeframe: string
  ): CandlePattern | null {
    const bodySize = Math.abs(candle.close - candle.open);
    const upperWick = candle.high - Math.max(candle.open, candle.close);
    const lowerWick = Math.min(candle.open, candle.close) - candle.low;

    if (upperWick > bodySize * 2 && lowerWick < bodySize * 0.5) {
      return {
        type: 'INVERTED_HAMMER',
        timeframe: timeframe as any,
        direction: 'BULLISH',
        strength: 60,
        reliability: 60,
        candleCount: 1,
        startIndex: allCandles.length - 1,
        endIndex: allCandles.length - 1,
        startTime: candle.timestamp,
        endTime: candle.timestamp,
        description: 'Inverted hammer - potential reversal',
        tradingSignal: 'BUY',
      };
    }

    return null;
  }

  /**
   * Get pattern description with trading implications
   */
  static getPatternDescription(pattern: CandlePattern): string {
    return `${pattern.type} on ${pattern.timeframe}: ${pattern.description}. Signal: ${pattern.tradingSignal}. Strength: ${pattern.strength.toFixed(0)}%, Reliability: ${pattern.reliability}%`;
  }

  /**
   * Calculate pattern score for MPS integration (0-100)
   */
  static calculatePatternScore(pattern: CandlePattern): number {
    return (pattern.strength * 0.6 + pattern.reliability * 0.4);
  }
}
