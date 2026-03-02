/**
 * Take Profit / Stop Loss Calculator
 * 
 * Calculates optimal TP and SL levels based on ATR and risk-reward ratios
 */

import { ChartCandle } from '@/lib/types/trading';

// ============================================================================
// TYPES
// ============================================================================

export interface TPSLLevels {
  entryPrice: number;
  stopLoss: number;
  stopLossPercent: number;
  takeProfit1: number;
  takeProfit1Percent: number;
  takeProfit1RR: number; // Risk-Reward ratio
  takeProfit2: number;
  takeProfit2Percent: number;
  takeProfit2RR: number;
  takeProfit3: number;
  takeProfit3Percent: number;
  takeProfit3RR: number;
  riskAmount: number; // Entry - SL
  rewardAmount1: number; // TP1 - Entry
  rewardAmount2: number; // TP2 - Entry
  rewardAmount3: number; // TP3 - Entry
}

// ============================================================================
// TP/SL CALCULATOR
// ============================================================================

export class TPSLCalculator {
  /**
   * Calculate ATR (Average True Range)
   */
  calculateATR(candles: ChartCandle[], period: number = 14): number {
    if (candles.length < period) return 0;

    let trSum = 0;
    for (let i = candles.length - period; i < candles.length; i++) {
      const current = candles[i];
      const previous = i > 0 ? candles[i - 1] : current;

      const tr = Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close)
      );

      trSum += tr;
    }

    return trSum / period;
  }

  /**
   * Calculate TP/SL for a BUY signal
   */
  calculateBuyTPSL(
    entryPrice: number,
    candles: ChartCandle[],
    atrMultiplier: number = 1.5
  ): TPSLLevels {
    const atr = this.calculateATR(candles);
    const stopLoss = entryPrice - atr * atrMultiplier;
    const riskAmount = entryPrice - stopLoss;

    // Calculate TP levels with 1:1, 2:1, 3:1 risk-reward
    const tp1 = entryPrice + riskAmount * 1;
    const tp2 = entryPrice + riskAmount * 2;
    const tp3 = entryPrice + riskAmount * 3;

    return {
      entryPrice,
      stopLoss,
      stopLossPercent: ((stopLoss - entryPrice) / entryPrice) * 100,
      takeProfit1: tp1,
      takeProfit1Percent: ((tp1 - entryPrice) / entryPrice) * 100,
      takeProfit1RR: 1,
      takeProfit2: tp2,
      takeProfit2Percent: ((tp2 - entryPrice) / entryPrice) * 100,
      takeProfit2RR: 2,
      takeProfit3: tp3,
      takeProfit3Percent: ((tp3 - entryPrice) / entryPrice) * 100,
      takeProfit3RR: 3,
      riskAmount,
      rewardAmount1: riskAmount * 1,
      rewardAmount2: riskAmount * 2,
      rewardAmount3: riskAmount * 3,
    };
  }

  /**
   * Calculate TP/SL for a SELL signal
   */
  calculateSellTPSL(
    entryPrice: number,
    candles: ChartCandle[],
    atrMultiplier: number = 1.5
  ): TPSLLevels {
    const atr = this.calculateATR(candles);
    const stopLoss = entryPrice + atr * atrMultiplier;
    const riskAmount = stopLoss - entryPrice;

    // Calculate TP levels with 1:1, 2:1, 3:1 risk-reward
    const tp1 = entryPrice - riskAmount * 1;
    const tp2 = entryPrice - riskAmount * 2;
    const tp3 = entryPrice - riskAmount * 3;

    return {
      entryPrice,
      stopLoss,
      stopLossPercent: ((stopLoss - entryPrice) / entryPrice) * 100,
      takeProfit1: tp1,
      takeProfit1Percent: ((tp1 - entryPrice) / entryPrice) * 100,
      takeProfit1RR: 1,
      takeProfit2: tp2,
      takeProfit2Percent: ((tp2 - entryPrice) / entryPrice) * 100,
      takeProfit2RR: 2,
      takeProfit3: tp3,
      takeProfit3Percent: ((tp3 - entryPrice) / entryPrice) * 100,
      takeProfit3RR: 3,
      riskAmount,
      rewardAmount1: riskAmount * 1,
      rewardAmount2: riskAmount * 2,
      rewardAmount3: riskAmount * 3,
    };
  }

  /**
   * Calculate TP/SL based on signal type
   */
  calculateTPSL(
    signal: 'BUY' | 'SELL',
    entryPrice: number,
    candles: ChartCandle[],
    atrMultiplier: number = 1.5
  ): TPSLLevels {
    return signal === 'BUY'
      ? this.calculateBuyTPSL(entryPrice, candles, atrMultiplier)
      : this.calculateSellTPSL(entryPrice, candles, atrMultiplier);
  }

  /**
   * Check if price has hit TP or SL
   */
  checkTPSLHit(
    currentPrice: number,
    tpsl: TPSLLevels,
    signal: 'BUY' | 'SELL'
  ): { hitTP: number | null; hitSL: boolean } {
    let hitTP: number | null = null;
    let hitSL = false;

    if (signal === 'BUY') {
      // For BUY: TP levels are above entry, SL is below
      if (currentPrice >= tpsl.takeProfit3) hitTP = 3;
      else if (currentPrice >= tpsl.takeProfit2) hitTP = 2;
      else if (currentPrice >= tpsl.takeProfit1) hitTP = 1;

      if (currentPrice <= tpsl.stopLoss) hitSL = true;
    } else {
      // For SELL: TP levels are below entry, SL is above
      if (currentPrice <= tpsl.takeProfit3) hitTP = 3;
      else if (currentPrice <= tpsl.takeProfit2) hitTP = 2;
      else if (currentPrice <= tpsl.takeProfit1) hitTP = 1;

      if (currentPrice >= tpsl.stopLoss) hitSL = true;
    }

    return { hitTP, hitSL };
  }

  /**
   * Format TP/SL for display
   */
  formatTPSL(tpsl: TPSLLevels): {
    sl: string;
    tp1: string;
    tp2: string;
    tp3: string;
  } {
    return {
      sl: `${tpsl.stopLoss.toFixed(2)} (${tpsl.stopLossPercent.toFixed(2)}%)`,
      tp1: `${tpsl.takeProfit1.toFixed(2)} (${tpsl.takeProfit1Percent.toFixed(2)}%)`,
      tp2: `${tpsl.takeProfit2.toFixed(2)} (${tpsl.takeProfit2Percent.toFixed(2)}%)`,
      tp3: `${tpsl.takeProfit3.toFixed(2)} (${tpsl.takeProfit3Percent.toFixed(2)}%)`,
    };
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const tpslCalculator = new TPSLCalculator();
