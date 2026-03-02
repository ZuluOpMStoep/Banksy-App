/**
 * Trade Journal Service
 * Manages trade entries, calculations, and statistics
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  TradeEntry,
  TradeStats,
  TradeFilter,
  TradeOutcome,
} from '@/lib/types/trade-journal';

const STORAGE_KEY = 'banksy_trade_journal';

export class TradeJournalService {
  /**
   * Create a new trade entry
   */
  static async createTrade(trade: Omit<TradeEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<TradeEntry> {
    const id = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const newTrade: TradeEntry = {
      ...trade,
      id,
      createdAt: now,
      updatedAt: now,
    };

    const trades = await this.getAllTrades();
    trades.push(newTrade);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trades));

    return newTrade;
  }

  /**
   * Get all trades
   */
  static async getAllTrades(): Promise<TradeEntry[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading trades:', error);
      return [];
    }
  }

  /**
   * Get trade by ID
   */
  static async getTrade(id: string): Promise<TradeEntry | undefined> {
    const trades = await this.getAllTrades();
    return trades.find((t) => t.id === id);
  }

  /**
   * Update a trade entry
   */
  static async updateTrade(id: string, updates: Partial<TradeEntry>): Promise<TradeEntry | undefined> {
    const trades = await this.getAllTrades();
    const index = trades.findIndex((t) => t.id === id);

    if (index === -1) return undefined;

    trades[index] = {
      ...trades[index],
      ...updates,
      id, // Prevent ID change
      createdAt: trades[index].createdAt, // Prevent creation date change
      updatedAt: Date.now(),
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
    return trades[index];
  }

  /**
   * Delete a trade entry
   */
  static async deleteTrade(id: string): Promise<boolean> {
    const trades = await this.getAllTrades();
    const filtered = trades.filter((t) => t.id !== id);

    if (filtered.length === trades.length) return false;

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  }

  /**
   * Filter trades by criteria
   */
  static async filterTrades(filter: TradeFilter): Promise<TradeEntry[]> {
    let trades = await this.getAllTrades();

    if (filter.asset) {
      trades = trades.filter((t) => t.asset === filter.asset);
    }

    if (filter.signalType) {
      trades = trades.filter((t) => t.signalType === filter.signalType);
    }

    if (filter.status) {
      trades = trades.filter((t) => t.status === filter.status);
    }

    if (filter.outcome) {
      trades = trades.filter((t) => t.outcome === filter.outcome);
    }

    if (filter.timeframe) {
      trades = trades.filter((t) => t.entryTimeframe === filter.timeframe);
    }

    if (filter.startDate) {
      trades = trades.filter((t) => t.entryTime >= filter.startDate!);
    }

    if (filter.endDate) {
      trades = trades.filter((t) => t.entryTime <= filter.endDate!);
    }

    return trades;
  }

  /**
   * Calculate trade statistics
   */
  static async calculateStats(trades?: TradeEntry[]): Promise<TradeStats> {
    const allTrades = trades || (await this.getAllTrades());
    const closedTrades = allTrades.filter((t) => t.status === 'closed');

    if (closedTrades.length === 0) {
      return this.emptyStats();
    }

    // Basic counts
    const winTrades = closedTrades.filter((t) => t.outcome === 'win');
    const lossTrades = closedTrades.filter((t) => t.outcome === 'loss');
    const breakevenTrades = closedTrades.filter((t) => t.outcome === 'breakeven');

    const winRate = (winTrades.length / closedTrades.length) * 100;
    const lossRate = (lossTrades.length / closedTrades.length) * 100;

    // PnL calculations
    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.actualPnL || 0), 0);
    const totalPnLPercent = closedTrades.reduce((sum, t) => sum + (t.actualPnLPercent || 0), 0) / closedTrades.length;

    const winPnLs = winTrades.map((t) => t.actualPnL || 0).filter((p) => p > 0);
    const lossPnLs = lossTrades.map((t) => t.actualPnL || 0).filter((p) => p < 0);

    const averageWin = winPnLs.length > 0 ? winPnLs.reduce((a, b) => a + b) / winPnLs.length : 0;
    const averageLoss = lossPnLs.length > 0 ? lossPnLs.reduce((a, b) => a + b) / lossPnLs.length : 0;

    const profitFactor = averageLoss !== 0 ? Math.abs(averageWin / averageLoss) : 0;

    const largestWin = Math.max(...winPnLs, 0);
    const largestLoss = Math.min(...lossPnLs, 0);

    // Accuracy comparison
    const predictedAccuracy = closedTrades.reduce((sum, t) => sum + t.predictedAccuracy, 0) / closedTrades.length;
    const actualAccuracy = winRate;
    const accuracyDifference = predictedAccuracy - actualAccuracy;

    // Risk/Reward
    const totalRisk = closedTrades.reduce((sum, t) => sum + t.riskAmount, 0);
    const totalReward = closedTrades.reduce((sum, t) => sum + (t.actualPnL || 0), 0);
    const averageRiskRewardRatio = closedTrades.reduce((sum, t) => sum + (t.actualRiskRewardRatio || 0), 0) / closedTrades.length;

    // By asset
    const assetGroups = this.groupBy(closedTrades, 'asset');
    const statsByAsset: Record<string, TradeStats> = {};
    for (const [asset, trades] of Object.entries(assetGroups)) {
      statsByAsset[asset] = await this.calculateStats(trades);
    }

    // By signal type
    const buyTrades = closedTrades.filter((t) => t.signalType === 'BUY');
    const sellTrades = closedTrades.filter((t) => t.signalType === 'SELL');

    return {
      totalTrades: closedTrades.length,
      winTrades: winTrades.length,
      lossTrades: lossTrades.length,
      breakevenTrades: breakevenTrades.length,
      winRate,
      lossRate,
      totalPnL,
      totalPnLPercent,
      averageWin,
      averageLoss,
      profitFactor,
      largestWin,
      largestLoss,
      predictedAccuracy,
      actualAccuracy,
      accuracyDifference,
      totalRisk,
      totalReward,
      averageRiskRewardRatio,
      statsByAsset,
      statsBySignal: {
        BUY: await this.calculateStats(buyTrades),
        SELL: await this.calculateStats(sellTrades),
      },
      statsByTimeframe: {},
    };
  }

  /**
   * Close a trade with outcome
   */
  static async closeTrade(
    id: string,
    exitPrice: number,
    exitType: 'TP1' | 'TP2' | 'TP3' | 'SL' | 'manual',
    notes?: string
  ): Promise<TradeEntry | undefined> {
    const trade = await this.getTrade(id);
    if (!trade) return undefined;

    const exitTime = Date.now();
    const actualPnL = trade.signalType === 'BUY'
      ? (exitPrice - trade.entryPrice) * 1 // Simplified: 1 unit
      : (trade.entryPrice - exitPrice) * 1;

    const actualPnLPercent = (actualPnL / trade.entryPrice) * 100;

    // Determine outcome
    let outcome: TradeOutcome = 'loss';
    if (actualPnL > 0) outcome = 'win';
    else if (actualPnL === 0) outcome = 'breakeven';

    // Calculate actual RR
    const actualRiskRewardRatio = trade.riskAmount > 0
      ? Math.abs(actualPnL / trade.riskAmount)
      : 0;

    return this.updateTrade(id, {
      status: 'closed',
      exitPrice,
      exitTime,
      exitType,
      actualPnL,
      actualPnLPercent,
      actualRiskRewardRatio,
      outcome,
      notes,
    });
  }

  /**
   * Get accuracy comparison
   */
  static async getAccuracyComparison(): Promise<{
    predictedAccuracy: number;
    actualAccuracy: number;
    difference: number;
  }> {
    const stats = await this.calculateStats();
    return {
      predictedAccuracy: stats.predictedAccuracy,
      actualAccuracy: stats.actualAccuracy,
      difference: stats.accuracyDifference,
    };
  }

  /**
   * Helper: Group array by key
   */
  private static groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((result, item) => {
      const groupKey = String(item[key]);
      if (!result[groupKey]) result[groupKey] = [];
      result[groupKey].push(item);
      return result;
    }, {} as Record<string, T[]>);
  }

  /**
   * Helper: Empty stats object
   */
  private static emptyStats(): TradeStats {
    return {
      totalTrades: 0,
      winTrades: 0,
      lossTrades: 0,
      breakevenTrades: 0,
      winRate: 0,
      lossRate: 0,
      totalPnL: 0,
      totalPnLPercent: 0,
      averageWin: 0,
      averageLoss: 0,
      profitFactor: 0,
      largestWin: 0,
      largestLoss: 0,
      predictedAccuracy: 0,
      actualAccuracy: 0,
      accuracyDifference: 0,
      totalRisk: 0,
      totalReward: 0,
      averageRiskRewardRatio: 0,
      statsByAsset: {},
      statsBySignal: {
        BUY: this.emptyStats() as any,
        SELL: this.emptyStats() as any,
      },
      statsByTimeframe: {},
    };
  }
}
