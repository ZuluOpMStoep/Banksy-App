/**
 * Performance Metrics Calculator
 * 
 * Calculates detailed trading performance metrics from backtest trades
 */

import {
  BacktestTrade,
  TradeMetrics,
  PerformanceByAsset,
  PerformanceByTimeframe,
  PerformanceByStrategy,
  PerformanceByConfidence,
} from '@/lib/types/backtesting';
import { calculateSubsetMetrics } from './backtesting-engine';

// ============================================================================
// PERFORMANCE METRICS CALCULATOR
// ============================================================================

export class PerformanceMetricsCalculator {
  /**
   * Calculate metrics by asset
   */
  static calculateByAsset(
    trades: BacktestTrade[],
    initialBalance: number
  ): PerformanceByAsset[] {
    const assetMap = new Map<string, BacktestTrade[]>();

    // Group trades by asset
    for (const trade of trades) {
      if (!assetMap.has(trade.assetSymbol)) {
        assetMap.set(trade.assetSymbol, []);
      }
      assetMap.get(trade.assetSymbol)!.push(trade);
    }

    // Calculate metrics for each asset
    const results: PerformanceByAsset[] = [];

    for (const [assetSymbol, assetTrades] of assetMap) {
      const metrics = calculateSubsetMetrics(assetTrades, initialBalance);
      const timeframeBreakdown = this.calculateByTimeframeForAsset(
        assetTrades,
        initialBalance
      );

      results.push({
        assetSymbol,
        assetName: this.getAssetName(assetSymbol),
        metrics,
        sampleSize: assetTrades.length,
        timeframeBreakdown,
      });
    }

    // Sort by sample size (descending)
    results.sort((a, b) => b.sampleSize - a.sampleSize);

    return results;
  }

  /**
   * Calculate metrics by timeframe for a specific asset
   */
  private static calculateByTimeframeForAsset(
    trades: BacktestTrade[],
    initialBalance: number
  ): PerformanceByTimeframe[] {
    const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'] as const;
    const results: PerformanceByTimeframe[] = [];

    for (const timeframe of timeframes) {
      const tfTrades = trades.filter((t) => {
        // Extract timeframe from trade (would need to be stored in trade object)
        // For now, we'll use a simple heuristic based on duration
        return this.getTimeframeFromDuration(t.duration) === timeframe;
      });

      if (tfTrades.length === 0) continue;

      const metrics = calculateSubsetMetrics(tfTrades, initialBalance);

      results.push({
        timeframe,
        metrics,
        sampleSize: tfTrades.length,
      });
    }

    return results;
  }

  /**
   * Calculate metrics by entry strategy
   */
  static calculateByStrategy(
    trades: BacktestTrade[],
    initialBalance: number
  ): PerformanceByStrategy[] {
    const strategies = ['Breakout', 'Pullback', 'Reversal', 'Continuation'] as const;
    const results: PerformanceByStrategy[] = [];

    for (const strategy of strategies) {
      const strategyTrades = trades.filter((t) => t.entryStrategy === strategy);

      if (strategyTrades.length === 0) continue;

      const metrics = calculateSubsetMetrics(strategyTrades, initialBalance);

      results.push({
        strategy,
        metrics,
        sampleSize: strategyTrades.length,
      });
    }

    // Sort by sample size (descending)
    results.sort((a, b) => b.sampleSize - a.sampleSize);

    return results;
  }

  /**
   * Calculate metrics by confidence level
   */
  static calculateByConfidence(
    trades: BacktestTrade[],
    initialBalance: number
  ): PerformanceByConfidence[] {
    const confidenceRanges = [
      { min: 90, max: 100 },
      { min: 80, max: 90 },
      { min: 70, max: 80 },
      { min: 60, max: 70 },
      { min: 50, max: 60 },
      { min: 0, max: 50 },
    ];

    const results: PerformanceByConfidence[] = [];

    for (const range of confidenceRanges) {
      const rangeTrades = trades.filter(
        (t) => t.confidence >= range.min && t.confidence < range.max
      );

      if (rangeTrades.length === 0) continue;

      const metrics = calculateSubsetMetrics(rangeTrades, initialBalance);
      const rangeLabel = `${range.min}-${range.max}%`;

      results.push({
        confidenceRange: rangeLabel,
        minConfidence: range.min,
        maxConfidence: range.max,
        metrics,
        sampleSize: rangeTrades.length,
      });
    }

    return results;
  }

  /**
   * Calculate win rate by entry strategy
   */
  static calculateWinRateByStrategy(trades: BacktestTrade[]): Map<string, number> {
    const strategies = ['Breakout', 'Pullback', 'Reversal', 'Continuation'];
    const winRates = new Map<string, number>();

    for (const strategy of strategies) {
      const strategyTrades = trades.filter((t) => t.entryStrategy === strategy);
      if (strategyTrades.length === 0) continue;

      const wins = strategyTrades.filter((t) => t.profitLoss > 0).length;
      const winRate = (wins / strategyTrades.length) * 100;
      winRates.set(strategy, winRate);
    }

    return winRates;
  }

  /**
   * Calculate average profit by entry strategy
   */
  static calculateAvgProfitByStrategy(trades: BacktestTrade[]): Map<string, number> {
    const strategies = ['Breakout', 'Pullback', 'Reversal', 'Continuation'];
    const avgProfits = new Map<string, number>();

    for (const strategy of strategies) {
      const strategyTrades = trades.filter((t) => t.entryStrategy === strategy);
      if (strategyTrades.length === 0) continue;

      const totalProfit = strategyTrades.reduce((sum, t) => sum + t.profitLoss, 0);
      const avgProfit = totalProfit / strategyTrades.length;
      avgProfits.set(strategy, avgProfit);
    }

    return avgProfits;
  }

  /**
   * Calculate best and worst performing assets
   */
  static calculateBestWorstAssets(trades: BacktestTrade[]): {
    best: { symbol: string; winRate: number };
    worst: { symbol: string; winRate: number };
  } {
    const assetMap = new Map<string, BacktestTrade[]>();

    for (const trade of trades) {
      if (!assetMap.has(trade.assetSymbol)) {
        assetMap.set(trade.assetSymbol, []);
      }
      assetMap.get(trade.assetSymbol)!.push(trade);
    }

    let bestAsset = { symbol: '', winRate: 0 };
    let worstAsset = { symbol: '', winRate: 100 };

    for (const [symbol, assetTrades] of assetMap) {
      const wins = assetTrades.filter((t) => t.profitLoss > 0).length;
      const winRate = (wins / assetTrades.length) * 100;

      if (winRate > bestAsset.winRate) {
        bestAsset = { symbol, winRate };
      }

      if (winRate < worstAsset.winRate) {
        worstAsset = { symbol, winRate };
      }
    }

    return { best: bestAsset, worst: worstAsset };
  }

  /**
   * Calculate best and worst performing strategies
   */
  static calculateBestWorstStrategies(trades: BacktestTrade[]): {
    best: { strategy: string; winRate: number };
    worst: { strategy: string; winRate: number };
  } {
    const strategies = ['Breakout', 'Pullback', 'Reversal', 'Continuation'];
    let bestStrategy = { strategy: '', winRate: 0 };
    let worstStrategy = { strategy: '', winRate: 100 };

    for (const strategy of strategies) {
      const strategyTrades = trades.filter((t) => t.entryStrategy === strategy);
      if (strategyTrades.length === 0) continue;

      const wins = strategyTrades.filter((t) => t.profitLoss > 0).length;
      const winRate = (wins / strategyTrades.length) * 100;

      if (winRate > bestStrategy.winRate) {
        bestStrategy = { strategy, winRate };
      }

      if (winRate < worstStrategy.winRate) {
        worstStrategy = { strategy, winRate };
      }
    }

    return { best: bestStrategy, worst: worstStrategy };
  }

  /**
   * Calculate risk-adjusted returns
   */
  static calculateRiskAdjustedReturns(trades: BacktestTrade[], initialBalance: number): {
    sharpeRatio: number;
    sortinoRatio: number;
    calmarRatio: number;
  } {
    if (trades.length === 0) {
      return { sharpeRatio: 0, sortinoRatio: 0, calmarRatio: 0 };
    }

    const returns = trades.map((t) => (t.profitLoss / initialBalance) * 100);
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;

    // Sharpe Ratio
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252) : 0;

    // Sortino Ratio (downside deviation only)
    const downReturns = returns.filter((r) => r < 0);
    const downVariance = downReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / Math.max(downReturns.length, 1);
    const downStdDev = Math.sqrt(downVariance);
    const sortinoRatio = downStdDev > 0 ? (meanReturn / downStdDev) * Math.sqrt(252) : 0;

    // Calmar Ratio
    let peak = initialBalance;
    let maxDrawdown = 0;
    let currentBalance = initialBalance;

    for (const trade of trades) {
      currentBalance += trade.profitLoss;
      if (currentBalance > peak) {
        peak = currentBalance;
      }
      const drawdown = ((peak - currentBalance) / peak) * 100;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    const totalReturn = ((currentBalance - initialBalance) / initialBalance) * 100;
    const annualizedReturn = totalReturn * (365 / Math.max(trades.length / 252, 1));
    const calmarRatio = maxDrawdown > 0 ? annualizedReturn / maxDrawdown : 0;

    return { sharpeRatio, sortinoRatio, calmarRatio };
  }

  /**
   * Calculate consecutive wins/losses
   */
  static calculateConsecutiveStats(trades: BacktestTrade[]): {
    maxConsecutiveWins: number;
    maxConsecutiveLosses: number;
    currentStreak: { type: 'win' | 'loss'; count: number };
  } {
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let currentWins = 0;
    let currentLosses = 0;
    let currentStreak: { type: 'win' | 'loss'; count: number } = { type: 'win', count: 0 };

    for (const trade of trades) {
      if (trade.profitLoss > 0) {
        currentWins++;
        maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWins);
        currentLosses = 0;
        currentStreak = { type: 'win', count: currentWins };
      } else if (trade.profitLoss < 0) {
        currentLosses++;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLosses);
        currentWins = 0;
        currentStreak = { type: 'loss', count: currentLosses };
      }
    }

    return { maxConsecutiveWins, maxConsecutiveLosses, currentStreak };
  }

  /**
   * Calculate profit distribution
   */
  static calculateProfitDistribution(trades: BacktestTrade[]): {
    hugeLoss: number; // < -5%
    largeLoss: number; // -5% to -2%
    smallLoss: number; // -2% to 0%
    breakEven: number; // 0%
    smallWin: number; // 0% to 2%
    largeWin: number; // 2% to 5%
    hugeWin: number; // > 5%
  } {
    const distribution = {
      hugeLoss: 0,
      largeLoss: 0,
      smallLoss: 0,
      breakEven: 0,
      smallWin: 0,
      largeWin: 0,
      hugeWin: 0,
    };

    for (const trade of trades) {
      if (trade.profitLossPercent < -5) distribution.hugeLoss++;
      else if (trade.profitLossPercent < -2) distribution.largeLoss++;
      else if (trade.profitLossPercent < 0) distribution.smallLoss++;
      else if (trade.profitLossPercent === 0) distribution.breakEven++;
      else if (trade.profitLossPercent < 2) distribution.smallWin++;
      else if (trade.profitLossPercent < 5) distribution.largeWin++;
      else distribution.hugeWin++;
    }

    return distribution;
  }

  /**
   * Calculate recovery factor
   */
  static calculateRecoveryFactor(trades: BacktestTrade[], initialBalance: number): number {
    if (trades.length === 0) return 0;

    const netProfit = trades.reduce((sum, t) => sum + t.profitLoss, 0);
    const maxLoss = Math.min(...trades.map((t) => t.profitLoss));

    if (maxLoss === 0) return 0;

    return Math.abs(netProfit / maxLoss);
  }

  /**
   * Get asset name from symbol
   */
  private static getAssetName(symbol: string): string {
    const names: { [key: string]: string } = {
      'XAU/USD': 'Gold',
      'XAG/USD': 'Silver',
      'BTC/USD': 'Bitcoin',
      'EUR/USD': 'Euro',
      'GBP/USD': 'British Pound',
      'USD/JPY': 'Japanese Yen',
      'AUD/USD': 'Australian Dollar',
      'DAX': 'DAX Index',
    };

    return names[symbol] || symbol;
  }

  /**
   * Get timeframe from trade duration
   */
  private static getTimeframeFromDuration(
    duration: number
  ): '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' {
    if (duration < 5 * 60 * 1000) return '1m';
    if (duration < 15 * 60 * 1000) return '5m';
    if (duration < 60 * 60 * 1000) return '15m';
    if (duration < 4 * 60 * 60 * 1000) return '1h';
    if (duration < 24 * 60 * 60 * 1000) return '4h';
    if (duration < 7 * 24 * 60 * 60 * 1000) return '1d';
    return '1w';
  }
}

// ============================================================================
// PERFORMANCE COMPARISON
// ============================================================================

export class PerformanceComparison {
  /**
   * Compare two sets of trades
   */
  static compare(
    trades1: BacktestTrade[],
    trades2: BacktestTrade[],
    initialBalance: number
  ): {
    metrics1: TradeMetrics;
    metrics2: TradeMetrics;
    winner: 'trades1' | 'trades2' | 'tie';
    reasons: string[];
  } {
    const metrics1 = calculateSubsetMetrics(trades1, initialBalance);
    const metrics2 = calculateSubsetMetrics(trades2, initialBalance);

    const reasons: string[] = [];
    let trades1Score = 0;
    let trades2Score = 0;

    // Compare win rate
    if (metrics1.winRate > metrics2.winRate) {
      trades1Score++;
      reasons.push(`Better win rate: ${metrics1.winRate.toFixed(1)}% vs ${metrics2.winRate.toFixed(1)}%`);
    } else if (metrics2.winRate > metrics1.winRate) {
      trades2Score++;
      reasons.push(`Better win rate: ${metrics2.winRate.toFixed(1)}% vs ${metrics1.winRate.toFixed(1)}%`);
    }

    // Compare profit factor
    if (metrics1.profitFactor > metrics2.profitFactor) {
      trades1Score++;
      reasons.push(`Better profit factor: ${metrics1.profitFactor.toFixed(2)} vs ${metrics2.profitFactor.toFixed(2)}`);
    } else if (metrics2.profitFactor > metrics1.profitFactor) {
      trades2Score++;
      reasons.push(`Better profit factor: ${metrics2.profitFactor.toFixed(2)} vs ${metrics1.profitFactor.toFixed(2)}`);
    }

    // Compare Sharpe ratio
    if (metrics1.sharpeRatio > metrics2.sharpeRatio) {
      trades1Score++;
      reasons.push(`Better Sharpe ratio: ${metrics1.sharpeRatio.toFixed(2)} vs ${metrics2.sharpeRatio.toFixed(2)}`);
    } else if (metrics2.sharpeRatio > metrics1.sharpeRatio) {
      trades2Score++;
      reasons.push(`Better Sharpe ratio: ${metrics2.sharpeRatio.toFixed(2)} vs ${metrics1.sharpeRatio.toFixed(2)}`);
    }

    // Compare max drawdown
    if (metrics1.maxDrawdown < metrics2.maxDrawdown) {
      trades1Score++;
      reasons.push(`Lower drawdown: ${metrics1.maxDrawdown.toFixed(1)}% vs ${metrics2.maxDrawdown.toFixed(1)}%`);
    } else if (metrics2.maxDrawdown < metrics1.maxDrawdown) {
      trades2Score++;
      reasons.push(`Lower drawdown: ${metrics2.maxDrawdown.toFixed(1)}% vs ${metrics1.maxDrawdown.toFixed(1)}%`);
    }

    let winner: 'trades1' | 'trades2' | 'tie' = 'tie';
    if (trades1Score > trades2Score) winner = 'trades1';
    else if (trades2Score > trades1Score) winner = 'trades2';

    return { metrics1, metrics2, winner, reasons };
  }
}
