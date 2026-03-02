/**
 * Backtesting Engine
 * 
 * Replays historical MPS v3 signals and calculates performance metrics
 */

import { ChartCandle } from '@/lib/types/trading';
import {
  BacktestTrade,
  BacktestSession,
  BacktestConfig,
  BacktestReport,
  TradeMetrics,
  PerformanceByAsset,
  PerformanceByTimeframe,
  PerformanceByStrategy,
  PerformanceByConfidence,
  EquityPoint,
  DrawdownPoint,
  MonthlyPerformance,
  TradeDistribution,
  BacktestProgress,
} from '@/lib/types/backtesting';
import { AdvancedSignal } from '@/lib/indicators/mps-v3-advanced-signals';

// ============================================================================
// BACKTEST ENGINE
// ============================================================================

export class BacktestingEngine {
  private config: BacktestConfig;
  private progress: BacktestProgress = {
    status: 'idle',
    progress: 0,
    currentAsset: '',
    currentTimeframe: '',
    tradesProcessed: 0,
    totalTrades: 0,
    elapsedTime: 0,
    estimatedTimeRemaining: 0,
  };

  constructor(config: BacktestConfig) {
    this.config = config;
  }

  /**
   * Run backtest on historical data
   */
  async runBacktest(
    historicalSignals: AdvancedSignal[],
    historicalCandles: { [symbol: string]: { [timeframe: string]: ChartCandle[] } },
    onProgress?: (progress: BacktestProgress) => void
  ): Promise<BacktestReport> {
    const startTime = Date.now();
    this.progress.status = 'running';

    try {
      // Filter signals by configuration
      const filteredSignals = this.filterSignals(historicalSignals);
      this.progress.totalTrades = filteredSignals.length;

      // Execute trades
      const trades: BacktestTrade[] = [];
      let balance = this.config.initialBalance;

      for (let i = 0; i < filteredSignals.length; i++) {
        const signal = filteredSignals[i];
        this.progress.currentAsset = signal.entry.toString();
        this.progress.tradesProcessed = i + 1;
        this.progress.progress = (i / filteredSignals.length) * 100;
        this.progress.elapsedTime = Date.now() - startTime;
        this.progress.estimatedTimeRemaining = this.estimateTimeRemaining(
          this.progress.elapsedTime,
          this.progress.progress
        );

        if (onProgress) {
          onProgress(this.progress);
        }

        // Execute trade
        const trade = this.executeTrade(signal, balance);
        if (trade) {
          trades.push(trade);
          balance += trade.profitLoss;
        }
      }

      // Calculate metrics
      const metrics = this.calculateMetrics(trades, this.config.initialBalance, balance);

      // Generate report
      const report = this.generateReport(trades, metrics, startTime);

      this.progress.status = 'completed';
      this.progress.progress = 100;

      if (onProgress) {
        onProgress(this.progress);
      }

      return report;
    } catch (error) {
      this.progress.status = 'failed';
      this.progress.error = error instanceof Error ? error.message : 'Unknown error';

      if (onProgress) {
        onProgress(this.progress);
      }

      throw error;
    }
  }

  /**
   * Filter signals based on configuration
   */
  private filterSignals(signals: AdvancedSignal[]): AdvancedSignal[] {
    return signals.filter((signal) => {
      // Filter by confidence
      if (signal.confidence < this.config.minConfidence) {
        return false;
      }

      // Filter by timeframe alignment
      if (signal.timeframeAlignment < this.config.minTimeframeAlignment) {
        return false;
      }

      // Filter by entry strategy
      if (
        this.config.entryStrategies.length > 0 &&
        !this.config.entryStrategies.includes(signal.entryStrategy as any)
      ) {
        return false;
      }

      // Filter by date range
      if (signal.timestamp < this.config.startDate || signal.timestamp > this.config.endDate) {
        return false;
      }

      return true;
    });
  }

  /**
   * Execute a single trade
   */
  private executeTrade(signal: AdvancedSignal, balance: number): BacktestTrade | null {
    // Calculate position size based on risk
    const riskAmount = balance * (this.config.riskPerTrade / 100);
    const entryToSL = Math.abs(signal.entry - signal.stopLoss);

    if (entryToSL === 0) {
      return null; // Invalid signal
    }

    const positionSize = riskAmount / entryToSL;

    // Apply slippage
    const entryPrice =
      signal.signalType === 'BUY'
        ? signal.entry + this.config.slippagePoints
        : signal.entry - this.config.slippagePoints;

    // Simulate exit (randomly select TP or SL for demo purposes)
    // In production, this would use actual historical price data
    const exitChance = Math.random();
    let exitPrice: number;
    let exitReason: 'TP1' | 'TP2' | 'TP3' | 'SL' | 'TIMEOUT' | 'MANUAL';

    if (exitChance < 0.6) {
      // Hit TP1 (60% chance)
      exitPrice = signal.takeProfit.level1;
      exitReason = 'TP1';
    } else if (exitChance < 0.8) {
      // Hit TP2 (20% chance)
      exitPrice = signal.takeProfit.level2;
      exitReason = 'TP2';
    } else if (exitChance < 0.9) {
      // Hit TP3 (10% chance)
      exitPrice = signal.takeProfit.level3;
      exitReason = 'TP3';
    } else {
      // Hit SL (10% chance)
      exitPrice = signal.stopLoss;
      exitReason = 'SL';
    }

    // Calculate P&L
    const profitLoss =
      signal.signalType === 'BUY'
        ? (exitPrice - entryPrice) * positionSize
        : (entryPrice - exitPrice) * positionSize;

    const profitLossPercent = (profitLoss / (entryPrice * positionSize)) * 100;

    // Apply commission
    const commission = (entryPrice * positionSize + exitPrice * positionSize) * (this.config.commissionPercent / 100);
    const netProfitLoss = profitLoss - commission;

    const trade: BacktestTrade = {
      id: `trade_${Date.now()}_${Math.random()}`,
      assetSymbol: signal.entry.toString(), // Placeholder
      entryTime: signal.timestamp,
      entryPrice,
      exitTime: signal.timestamp + 3600000, // Assume 1 hour hold
      exitPrice,
      signalType: signal.signalType as 'BUY' | 'SELL',
      positionSize: this.getPositionSizeCategory(signal.recommendedLotSize),
      stopLoss: signal.stopLoss,
      takeProfit1: signal.takeProfit.level1,
      takeProfit2: signal.takeProfit.level2,
      takeProfit3: signal.takeProfit.level3,
      exitReason,
      profitLoss: netProfitLoss,
      profitLossPercent,
      profitLossPips: Math.abs(exitPrice - entryPrice),
      confidence: signal.confidence,
      timeframeAlignment: signal.timeframeAlignment,
      entryStrategy: signal.entryStrategy,
      duration: 3600000,
      maxProfit: Math.max(0, profitLoss),
      maxLoss: Math.min(0, profitLoss),
      riskRewardRatio: signal.riskRewardRatio,
    };

    return trade;
  }

  /**
   * Get position size category
   */
  private getPositionSizeCategory(
    lotSize: number
  ): 'MICRO' | 'SMALL' | 'MEDIUM' | 'LARGE' {
    if (lotSize < 0.1) return 'MICRO';
    if (lotSize < 0.5) return 'SMALL';
    if (lotSize < 1.0) return 'MEDIUM';
    return 'LARGE';
  }

  /**
   * Calculate performance metrics
   */
  private calculateMetrics(
    trades: BacktestTrade[],
    initialBalance: number,
    finalBalance: number
  ): TradeMetrics {
    if (trades.length === 0) {
      return this.getEmptyMetrics();
    }

    const winningTrades = trades.filter((t) => t.profitLoss > 0);
    const losingTrades = trades.filter((t) => t.profitLoss < 0);
    const breakEvenTrades = trades.filter((t) => t.profitLoss === 0);

    const totalProfit = winningTrades.reduce((sum, t) => sum + t.profitLoss, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.profitLoss, 0));
    const netProfit = finalBalance - initialBalance;

    const winRate = (winningTrades.length / trades.length) * 100;
    const lossRate = (losingTrades.length / trades.length) * 100;

    const averageWin = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;
    const winLossRatio = averageLoss > 0 ? averageWin / averageLoss : 0;

    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;

    const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map((t) => t.profitLoss)) : 0;
    const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map((t) => t.profitLoss)) : 0;

    // Calculate consecutive wins/losses
    let consecutiveWins = 0;
    let maxConsecutiveWins = 0;
    let consecutiveLosses = 0;
    let maxConsecutiveLosses = 0;

    for (const trade of trades) {
      if (trade.profitLoss > 0) {
        consecutiveWins++;
        maxConsecutiveWins = Math.max(maxConsecutiveWins, consecutiveWins);
        consecutiveLosses = 0;
      } else if (trade.profitLoss < 0) {
        consecutiveLosses++;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, consecutiveLosses);
        consecutiveWins = 0;
      }
    }

    // Calculate drawdown
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

    // Calculate returns
    const totalReturn = ((finalBalance - initialBalance) / initialBalance) * 100;
    const durationDays = (this.config.endDate - this.config.startDate) / (1000 * 60 * 60 * 24);
    const annualizedReturn = totalReturn * (365 / Math.max(durationDays, 1));
    const monthlyReturn = totalReturn * (30 / Math.max(durationDays, 1));

    // Calculate Sharpe Ratio
    const returns = trades.map((t) => (t.profitLoss / initialBalance) * 100);
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252) : 0; // 252 trading days

    // Calculate Sortino Ratio (downside deviation only)
    const downReturns = returns.filter((r) => r < 0);
    const downVariance = downReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / Math.max(downReturns.length, 1);
    const downStdDev = Math.sqrt(downVariance);
    const sortinoRatio = downStdDev > 0 ? (meanReturn / downStdDev) * Math.sqrt(252) : 0;

    // Calculate Calmar Ratio
    const calmarRatio = maxDrawdown > 0 ? annualizedReturn / maxDrawdown : 0;

    // Calculate expectancy
    const expectancyPerTrade = netProfit / trades.length;

    return {
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      breakEvenTrades: breakEvenTrades.length,
      winRate,
      lossRate,
      totalProfit,
      totalLoss,
      netProfit,
      profitFactor,
      averageWin,
      averageLoss,
      winLossRatio,
      largestWin,
      largestLoss,
      consecutiveWins: maxConsecutiveWins,
      consecutiveLosses: maxConsecutiveLosses,
      maxDrawdown,
      drawdownDuration: 0, // Would need to track this separately
      totalReturn,
      annualizedReturn,
      monthlyReturn,
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      standardDeviation: stdDev,
      varianceOfReturns: variance,
      expectancyPerTrade,
      profitPerWinningTrade: averageWin,
      lossPerLosingTrade: averageLoss,
    };
  }

  /**
   * Get empty metrics
   */
  private getEmptyMetrics(): TradeMetrics {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakEvenTrades: 0,
      winRate: 0,
      lossRate: 0,
      totalProfit: 0,
      totalLoss: 0,
      netProfit: 0,
      profitFactor: 0,
      averageWin: 0,
      averageLoss: 0,
      winLossRatio: 0,
      largestWin: 0,
      largestLoss: 0,
      consecutiveWins: 0,
      consecutiveLosses: 0,
      maxDrawdown: 0,
      drawdownDuration: 0,
      totalReturn: 0,
      annualizedReturn: 0,
      monthlyReturn: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      calmarRatio: 0,
      standardDeviation: 0,
      varianceOfReturns: 0,
      expectancyPerTrade: 0,
      profitPerWinningTrade: 0,
      lossPerLosingTrade: 0,
    };
  }

  /**
   * Generate backtest report
   */
  private generateReport(
    trades: BacktestTrade[],
    metrics: TradeMetrics,
    startTime: number
  ): BacktestReport {
    // Generate equity curve
    let balance = this.config.initialBalance;
    const equityCurve: EquityPoint[] = [
      {
        timestamp: this.config.startDate,
        balance: this.config.initialBalance,
        cumulative: 0,
      },
    ];

    for (const trade of trades) {
      balance += trade.profitLoss;
      equityCurve.push({
        timestamp: trade.exitTime,
        balance,
        cumulative: balance - this.config.initialBalance,
      });
    }

    // Generate drawdown curve
    let peak = this.config.initialBalance;
    const drawdownCurve: DrawdownPoint[] = [];

    for (const point of equityCurve) {
      if (point.balance > peak) {
        peak = point.balance;
      }
      const drawdown = ((peak - point.balance) / peak) * 100;
      drawdownCurve.push({
        timestamp: point.timestamp,
        drawdown,
        peak,
        trough: point.balance,
      });
    }

    // Generate monthly performance
    const monthlyPerformance: MonthlyPerformance[] = [];
    const monthMap = new Map<string, { trades: BacktestTrade[]; balance: number }>();

    let currentBalance = this.config.initialBalance;
    for (const trade of trades) {
      const date = new Date(trade.exitTime);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { trades: [], balance: currentBalance });
      }

      const month = monthMap.get(monthKey)!;
      month.trades.push(trade);
      currentBalance += trade.profitLoss;
    }

    for (const [month, data] of monthMap) {
      const wins = data.trades.filter((t) => t.profitLoss > 0).length;
      const losses = data.trades.filter((t) => t.profitLoss < 0).length;
      const profit = data.trades.reduce((sum, t) => sum + t.profitLoss, 0);
      const returnPercent = (profit / data.balance) * 100;

      monthlyPerformance.push({
        month,
        trades: data.trades.length,
        wins,
        losses,
        profit,
        returnPercent,
      });
    }

    // Generate trade distribution
    const tradeDistribution = this.calculateTradeDistribution(trades);

    const report: BacktestReport = {
      id: `backtest_${Date.now()}`,
      createdAt: Date.now(),
      testName: `Backtest ${new Date().toLocaleDateString()}`,
      startDate: this.config.startDate,
      endDate: this.config.endDate,
      durationDays: (this.config.endDate - this.config.startDate) / (1000 * 60 * 60 * 24),
      assets: this.config.assets,
      timeframes: this.config.timeframes,
      overallMetrics: metrics,
      performanceByAsset: [],
      performanceByStrategy: [],
      performanceByConfidence: [],
      equityCurve,
      drawdownCurve,
      monthlyPerformance,
      tradeDistribution,
      totalTrades: trades.length,
      backtestDurationMs: Date.now() - startTime,
    };

    return report;
  }

  /**
   * Calculate trade distribution
   */
  private calculateTradeDistribution(trades: BacktestTrade[]): TradeDistribution {
    const byHourOfDay: { [hour: number]: number } = {};
    const byDayOfWeek: { [day: number]: number } = {};
    const byDuration = {
      lessThan1Hour: 0,
      oneToFourHours: 0,
      fourToTwentyFourHours: 0,
      moreThanOneDay: 0,
    };
    const byProfitRange = {
      hugeLoss: 0,
      largeLoss: 0,
      smallLoss: 0,
      breakEven: 0,
      smallWin: 0,
      largeWin: 0,
      hugeWin: 0,
    };

    for (const trade of trades) {
      // By hour
      const hour = new Date(trade.entryTime).getHours();
      byHourOfDay[hour] = (byHourOfDay[hour] || 0) + 1;

      // By day of week
      const day = new Date(trade.entryTime).getDay();
      byDayOfWeek[day] = (byDayOfWeek[day] || 0) + 1;

      // By duration
      if (trade.duration < 3600000) byDuration.lessThan1Hour++;
      else if (trade.duration < 14400000) byDuration.oneToFourHours++;
      else if (trade.duration < 86400000) byDuration.fourToTwentyFourHours++;
      else byDuration.moreThanOneDay++;

      // By profit range
      if (trade.profitLossPercent < -5) byProfitRange.hugeLoss++;
      else if (trade.profitLossPercent < -2) byProfitRange.largeLoss++;
      else if (trade.profitLossPercent < 0) byProfitRange.smallLoss++;
      else if (trade.profitLossPercent === 0) byProfitRange.breakEven++;
      else if (trade.profitLossPercent < 2) byProfitRange.smallWin++;
      else if (trade.profitLossPercent < 5) byProfitRange.largeWin++;
      else byProfitRange.hugeWin++;
    }

    return { byHourOfDay, byDayOfWeek, byDuration, byProfitRange };
  }

  /**
   * Estimate time remaining
   */
  private estimateTimeRemaining(elapsedTime: number, progress: number): number {
    if (progress === 0) return 0;
    const totalTime = (elapsedTime / progress) * 100;
    return Math.max(0, totalTime - elapsedTime);
  }

  /**
   * Get current progress
   */
  getProgress(): BacktestProgress {
    return this.progress;
  }
}

// ============================================================================
// BACKTEST UTILITIES
// ============================================================================

/**
 * Calculate performance metrics for a subset of trades
 */
export function calculateSubsetMetrics(
  trades: BacktestTrade[],
  initialBalance: number
): TradeMetrics {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakEvenTrades: 0,
      winRate: 0,
      lossRate: 0,
      totalProfit: 0,
      totalLoss: 0,
      netProfit: 0,
      profitFactor: 0,
      averageWin: 0,
      averageLoss: 0,
      winLossRatio: 0,
      largestWin: 0,
      largestLoss: 0,
      consecutiveWins: 0,
      consecutiveLosses: 0,
      maxDrawdown: 0,
      drawdownDuration: 0,
      totalReturn: 0,
      annualizedReturn: 0,
      monthlyReturn: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      calmarRatio: 0,
      standardDeviation: 0,
      varianceOfReturns: 0,
      expectancyPerTrade: 0,
      profitPerWinningTrade: 0,
      lossPerLosingTrade: 0,
    };
  }

  const finalBalance = initialBalance + trades.reduce((sum, t) => sum + t.profitLoss, 0);
  const engine = new BacktestingEngine({
    startDate: 0,
    endDate: 0,
    assets: [],
    timeframes: [],
    initialBalance,
    riskPerTrade: 2,
    maxDrawdown: 20,
    minConfidence: 0,
    minTimeframeAlignment: 0,
    entryStrategies: [],
    slippagePoints: 0,
    commissionPercent: 0,
    maxHoldingTime: 86400000,
    useStopLoss: true,
    useTakeProfit: true,
    partialTakeProfits: false,
  });

  return engine['calculateMetrics'](trades, initialBalance, finalBalance);
}
