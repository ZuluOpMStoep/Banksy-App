/**
 * MPS v3 Pattern Integration
 * 
 * Integrates candle pattern recognition with MPS v3 signal generation
 * to improve accuracy and confidence scoring.
 * 
 * Pattern weights are applied to MPS scores to enhance signal quality.
 */

import { CandlePatternDetector, CandlePattern } from './candle-patterns';
import type { Candle } from './mps-v3-advanced-signals';

// ============================================================================
// PATTERN WEIGHT CONFIGURATION
// ============================================================================

/**
 * Weight multipliers for different pattern types
 * Applied to MPS score to boost/reduce confidence
 */
export const PATTERN_WEIGHTS: Record<string, number> = {
  // Reversal patterns (strong signals)
  'BULLISH_ENGULFING': 1.25,
  'BEARISH_ENGULFING': 1.25,
  'MORNING_STAR': 1.30,
  'EVENING_STAR': 1.30,
  'PIERCING_LINE': 1.20,
  'DARK_CLOUD_COVER': 1.20,
  
  // Continuation patterns
  'THREE_WHITE_SOLDIERS': 1.15,
  'THREE_BLACK_CROWS': 1.15,
  'BULLISH_HARAMI': 1.10,
  'BEARISH_HARAMI': 1.10,
  
  // Reversal/Indecision patterns
  'HAMMER': 1.15,
  'SHOOTING_STAR': 1.15,
  'DOJI': 0.95, // Reduces confidence (indecision)
  'DRAGONFLY_DOJI': 1.10,
  'GRAVESTONE_DOJI': 1.10,
  
  // Continuation patterns
  'MARUBOZU': 1.05,
  'SPINNING_TOP': 0.90, // Reduces confidence (indecision)
};

// ============================================================================
// PATTERN ANALYSIS FOR MPS INTEGRATION
// ============================================================================

/**
 * Analyze patterns across all timeframes
 * Returns pattern-based confidence boost/reduction
 */
export interface PatternAnalysisResult {
  hasPattern: boolean;
  patterns: CandlePattern[];
  bullishPatternCount: number;
  bearishPatternCount: number;
  averageStrength: number;
  averageReliability: number;
  confidenceMultiplier: number; // 0.8 to 1.5
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  summary: string;
}

/**
 * Analyze patterns on a specific timeframe
 */
export function analyzeTimeframePatterns(
  candles: Candle[],
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w'
): PatternAnalysisResult {
  if (!candles || candles.length < 3) {
    return {
      hasPattern: false,
      patterns: [],
      bullishPatternCount: 0,
      bearishPatternCount: 0,
      averageStrength: 0,
      averageReliability: 0,
      confidenceMultiplier: 1.0,
      direction: 'NEUTRAL',
      summary: 'Insufficient candle data',
    };
  }

  // Detect all patterns on this timeframe
  const patterns: CandlePattern[] = [];

  // Single-candle patterns
  for (let i = Math.max(0, candles.length - 5); i < candles.length; i++) {
    const hammer = CandlePatternDetector.detectHammer(candles[i], candles, timeframe);
    if (hammer) patterns.push(hammer);

    const shootingStar = CandlePatternDetector.detectShootingStar(candles[i], candles, timeframe);
    if (shootingStar) patterns.push(shootingStar);

    const doji = CandlePatternDetector.detectDoji(candles[i], candles, timeframe);
    if (doji) patterns.push(doji);

    const marubozu = CandlePatternDetector.detectMarubozu(candles[i], candles, timeframe);
    if (marubozu) patterns.push(marubozu);

    const spinningTop = CandlePatternDetector.detectSpinningTop(candles[i], candles, timeframe);
    if (spinningTop) patterns.push(spinningTop);
  }

  // Two-candle patterns (last 2 candles)
  if (candles.length >= 2) {
    const lastTwo = candles.slice(-2);
    const engulfing = CandlePatternDetector.detectEngulfing(lastTwo, timeframe);
    if (engulfing) patterns.push(engulfing);

    const harami = CandlePatternDetector.detectHarami(lastTwo, timeframe);
    if (harami) patterns.push(harami);

    const piercing = CandlePatternDetector.detectPiercingLine(lastTwo, timeframe);
    if (piercing) patterns.push(piercing);

    const darkCloud = CandlePatternDetector.detectDarkCloudCover(lastTwo, timeframe);
    if (darkCloud) patterns.push(darkCloud);
  }

  // Three-candle patterns (last 3 candles)
  if (candles.length >= 3) {
    const lastThree = candles.slice(-3);
    const morningStar = CandlePatternDetector.detectMorningStar(lastThree, timeframe);
    if (morningStar) patterns.push(morningStar);

    const eveningStar = CandlePatternDetector.detectEveningStar(lastThree, timeframe);
    if (eveningStar) patterns.push(eveningStar);

    const threeWhite = CandlePatternDetector.detectThreeWhiteSoldiers(lastThree, timeframe);
    if (threeWhite) patterns.push(threeWhite);

    const threeBlack = CandlePatternDetector.detectThreeBlackCrows(lastThree, timeframe);
    if (threeBlack) patterns.push(threeBlack);
  }

  // Count bullish and bearish patterns
  const bullishPatterns = patterns.filter((p) => p.direction === 'BULLISH');
  const bearishPatterns = patterns.filter((p) => p.direction === 'BEARISH');

  // Calculate averages
  const avgStrength =
    patterns.length > 0
      ? patterns.reduce((sum, p) => sum + p.strength, 0) / patterns.length
      : 0;

  const avgReliability =
    patterns.length > 0
      ? patterns.reduce((sum, p) => sum + p.reliability, 0) / patterns.length
      : 0;

  // Determine direction
  let direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  if (bullishPatterns.length > bearishPatterns.length) {
    direction = 'BULLISH';
  } else if (bearishPatterns.length > bullishPatterns.length) {
    direction = 'BEARISH';
  }

  // Calculate confidence multiplier
  // More patterns = higher confidence, but capped at 1.5x
  const patternCount = patterns.length;
  let confidenceMultiplier = 1.0;

  if (patternCount === 1) {
    confidenceMultiplier = 1.1;
  } else if (patternCount === 2) {
    confidenceMultiplier = 1.2;
  } else if (patternCount >= 3) {
    confidenceMultiplier = Math.min(1.0 + patternCount * 0.08, 1.5);
  }

  // If patterns are mixed (both bullish and bearish), reduce confidence
  if (bullishPatterns.length > 0 && bearishPatterns.length > 0) {
    confidenceMultiplier *= 0.85;
  }

  // Generate summary
  const summary =
    patterns.length === 0
      ? 'No patterns detected'
      : `${bullishPatterns.length} bullish, ${bearishPatterns.length} bearish patterns`;

  return {
    hasPattern: patterns.length > 0,
    patterns,
    bullishPatternCount: bullishPatterns.length,
    bearishPatternCount: bearishPatterns.length,
    averageStrength: avgStrength,
    averageReliability: avgReliability,
    confidenceMultiplier,
    direction,
    summary,
  };
}

// ============================================================================
// MPS SCORE ADJUSTMENT WITH PATTERNS
// ============================================================================

/**
 * Adjust MPS score based on detected patterns
 * 
 * @param mpsScore Original MPS score (-1 to +1)
 * @param patterns Detected patterns on this timeframe
 * @returns Adjusted MPS score with pattern influence
 */
export function adjustMPSScoreWithPatterns(
  mpsScore: number,
  patterns: CandlePattern[]
): number {
  if (patterns.length === 0) {
    return mpsScore;
  }

  // Calculate pattern-based adjustment
  let patternAdjustment = 0;

  for (const pattern of patterns) {
    const weight = PATTERN_WEIGHTS[pattern.type] || 1.0;
    const patternInfluence = (weight - 1.0) * 0.15; // Cap influence at 15% per pattern

    if (pattern.direction === 'BULLISH') {
      patternAdjustment += patternInfluence;
    } else if (pattern.direction === 'BEARISH') {
      patternAdjustment -= patternInfluence;
    }
  }

  // Apply adjustment to MPS score
  let adjustedScore = mpsScore + patternAdjustment;

  // Keep score in valid range (-1 to +1)
  adjustedScore = Math.max(-1, Math.min(1, adjustedScore));

  return adjustedScore;
}

// ============================================================================
// CONFIDENCE BOOST FROM PATTERNS
// ============================================================================

/**
 * Calculate confidence boost based on pattern analysis
 * 
 * @param baseConfidence Original confidence (0-100)
 * @param patternAnalysis Pattern analysis result
 * @returns Boosted confidence (0-100)
 */
export function boostConfidenceWithPatterns(
  baseConfidence: number,
  patternAnalysis: PatternAnalysisResult
): number {
  if (!patternAnalysis.hasPattern) {
    return baseConfidence;
  }

  // Apply confidence multiplier
  let boostedConfidence = baseConfidence * patternAnalysis.confidenceMultiplier;

  // Cap at 100
  boostedConfidence = Math.min(boostedConfidence, 100);

  return boostedConfidence;
}

// ============================================================================
// MULTI-TIMEFRAME PATTERN ALIGNMENT
// ============================================================================

/**
 * Calculate pattern alignment across multiple timeframes
 * Returns how many timeframes have bullish/bearish patterns
 */
export interface PatternAlignmentResult {
  bullishTimeframes: string[];
  bearishTimeframes: string[];
  alignmentScore: number; // 0-7 (how many timeframes agree)
  strongAlignment: boolean; // 5+ timeframes agree
}

/**
 * Analyze pattern alignment across all timeframes
 */
export function analyzePatternAlignment(
  candlesByTimeframe: Record<string, Candle[]>,
  timeframes: Array<'1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w'>
): PatternAlignmentResult {
  const bullishTimeframes: string[] = [];
  const bearishTimeframes: string[] = [];

  for (const tf of timeframes) {
    if (!candlesByTimeframe[tf]) continue;

    const analysis = analyzeTimeframePatterns(candlesByTimeframe[tf], tf);

    if (analysis.direction === 'BULLISH') {
      bullishTimeframes.push(tf);
    } else if (analysis.direction === 'BEARISH') {
      bearishTimeframes.push(tf);
    }
  }

  // Calculate alignment score
  const maxDirection = Math.max(bullishTimeframes.length, bearishTimeframes.length);
  const alignmentScore = maxDirection;
  const strongAlignment = alignmentScore >= 5;

  return {
    bullishTimeframes,
    bearishTimeframes,
    alignmentScore,
    strongAlignment,
  };
}

// ============================================================================
// PATTERN-ENHANCED SIGNAL GENERATION
// ============================================================================

/**
 * Generate enhanced MPS signal with pattern integration
 */
export interface EnhancedSignalData {
  originalMPSScore: number;
  patternAdjustedScore: number;
  originalConfidence: number;
  patternBoostedConfidence: number;
  patternAnalysis: PatternAnalysisResult;
  patternInfluence: number; // How much patterns changed the score
}

/**
 * Create enhanced signal data by integrating patterns
 */
export function createEnhancedSignalData(
  originalMPSScore: number,
  originalConfidence: number,
  candles: Candle[],
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w'
): EnhancedSignalData {
  // Analyze patterns
  const patternAnalysis = analyzeTimeframePatterns(candles, timeframe);

  // Adjust MPS score with patterns
  const patternAdjustedScore = adjustMPSScoreWithPatterns(
    originalMPSScore,
    patternAnalysis.patterns
  );

  // Boost confidence with patterns
  const patternBoostedConfidence = boostConfidenceWithPatterns(
    originalConfidence,
    patternAnalysis
  );

  // Calculate pattern influence
  const patternInfluence = patternAdjustedScore - originalMPSScore;

  return {
    originalMPSScore,
    patternAdjustedScore,
    originalConfidence,
    patternBoostedConfidence,
    patternAnalysis,
    patternInfluence,
  };
}
