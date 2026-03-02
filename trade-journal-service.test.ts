/**
 * Signal History Service
 * Manages persistence and retrieval of signal history with analytics
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SignalHistoryEntry,
  SignalHistoryStats,
  SignalHistoryFilter,
  SignalHistorySortOptions,
  SignalOutcome,
} from '@/lib/types/signal-history';
import { MPSSignalType, TimeFrame } from '@/lib/types/trading';

const STORAGE_KEY = 'signal_history';
const MAX_HISTORY_ENTRIES = 1000; // Keep last 1000 signals

export class SignalHistoryService {
  /**
   * Add a new signal entry to history
   */
  static async addSignal(entry: Omit<SignalHistoryEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<SignalHistoryEntry> {
    const now = Date.now();
    const id = `signal_${now}_${Math.random().toString(36).substr(2, 9)}`;

    const newEntry: SignalHistoryEntry = {
      ...entry,
      id,
      createdAt: now,
      updatedAt: now,
    };

    const history = await this.getAllSignals();
    history.push(newEntry);

    // Keep only last MAX_HISTORY_ENTRIES
    if (history.length > MAX_HISTORY_ENTRIES) {
      history.splice(0, history.length - MAX_HISTORY_ENTRIES);
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    return newEntry;
  }

  /**
   * Update an existing signal entry (e.g., when trade closes)
   */
  static async updateSignal(id: string, updates: Partial<SignalHistoryEntry>): Promise<SignalHistoryEntry | null> {
    const history = await this.getAllSignals();
    const index = history.findIndex((s) => s.id === id);

    if (index === -1) return null;

    const updated: SignalHistoryEntry = {
      ...history[index],
      ...updates,
      updatedAt: Date.now(),
    };

    history[index] = updated;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    return updated;
  }

  /**
   * Get all signals
   */
  static async getAllSignals(): Promise<SignalHistoryEntry[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading signal history:', error);
      return [];
    }
  }

  /**
   * Get signals with filtering and sorting
   */
  static async getSignals(
    filter?: SignalHistoryFilter,
    sort?: SignalHistorySortOptions
  ): Promise<SignalHistoryEntry[]> {
    let signals = await this.getAllSignals();

    // Apply filters
    if (filter) {
      signals = signals.filter((s) => {
        if (filter.assetId && s.assetId !== filter.assetId) return false;
        if (filter.signal && s.signal !== filter.signal) return false;
        if (filter.timeFrame && s.timeFrame !== filter.timeFrame) return false;
        if (filter.outcome && s.outcome !== filter.outcome) return false;
        if (filter.dateFrom && s.entryTime < filter.dateFrom) return false;
        if (filter.dateTo && s.entryTime > filter.dateTo) return false;
        if (filter.minConfidence && s.entryConfidence < filter.minConfidence) return false;
        if (filter.maxConfidence && s.entryConfidence > filter.maxConfidence) return false;
        if (filter.tags && filter.tags.length > 0) {
          const hasTags = filter.tags.some((tag) => s.tags?.includes(tag));
          if (!hasTags) return false;
        }
        return true;
      });
    }

    // Apply sorting
    if (sort) {
      signals.sort((a, b) => {
        let aVal: number;
        let bVal: number;

        switch (sort.sortBy) {
          case 'entryTime':
            aVal = a.entryTime;
            bVal = b.entryTime;
            break;
          case 'profitLoss':
            aVal = a.profitLoss ?? 0;
            bVal = b.profitLoss ?? 0;
            break;
          case 'confidence':
            aVal = a.entryConfidence;
            bVal = b.entryConfidence;
            break;
          case 'accuracy':
            aVal = a.predictedAccuracy;
            bVal = b.predictedAccuracy;
            break;
        }

        return sort.order === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }

    return signals;
  }

  /**
   * Get a single signal by ID
   */
  static async getSignal(id: string): Promise<SignalHistoryEntry | null> {
    const signals = await this.getAllSignals();
    return signals.find((s) => s.id === id) || null;
  }

  /**
   * Delete a signal entry
   */
  static async deleteSignal(id: string): Promise<boolean> {
    const history = await this.getAllSignals();
    const filtered = history.filter((s) => s.id !== id);

    if (filtered.length === history.length) return false; // Not found

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  }

  /**
   * Clear all signal history
   */
  static async clearAll(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Calculate statistics from signal history
   */
  static async calculateStats(filter?: SignalHistoryFilter): Promise<SignalHistoryStats> {
    const signals = await this.getSignals(filter);

    if (signals.length === 0) {
      return {
        totalSignals: 0,
        winCount: 0,
        lossCount: 0,
        breakevenCount: 0,
        pendingCount: 0,
        winRate: 0,
        lossRate: 0,
        totalProfit: 0,
        totalLoss: 0,
        netProfit: 0,
        averageWin: 0,
        averageLoss: 0,
        profitFactor: 0,
        bestTrade: 0,
        worstTrade: 0,
        averageRiskReward: 0,
        bySignalType: {},
        byAsset: {},
        byTimeFrame: {},
      };
    }

    const stats: SignalHistoryStats = {
      totalSignals: signals.length,
      winCount: signals.filter((s) => s.outcome === 'WIN').length,
      lossCount: signals.filter((s) => s.outcome === 'LOSS').length,
      breakevenCount: signals.filter((s) => s.outcome === 'BREAKEVEN').length,
      pendingCount: signals.filter((s) => s.outcome === 'PENDING').length,
      winRate: 0,
      lossRate: 0,
      totalProfit: 0,
      totalLoss: 0,
      netProfit: 0,
      averageWin: 0,
      averageLoss: 0,
      profitFactor: 0,
      bestTrade: 0,
      worstTrade: 0,
      averageRiskReward: 0,
      bySignalType: {},
      byAsset: {},
      byTimeFrame: {},
    };

    // Calculate basic stats
    const closedSignals = signals.filter((s) => s.outcome !== 'PENDING');
    const wins = signals.filter((s) => s.outcome === 'WIN');
    const losses = signals.filter((s) => s.outcome === 'LOSS');

    stats.winRate = closedSignals.length > 0 ? (stats.winCount / closedSignals.length) * 100 : 0;
    stats.lossRate = closedSignals.length > 0 ? (stats.lossCount / closedSignals.length) * 100 : 0;

    // Calculate profit/loss
    wins.forEach((s) => {
      if (s.profitLoss) stats.totalProfit += s.profitLoss;
    });
    losses.forEach((s) => {
      if (s.profitLoss) stats.totalLoss += Math.abs(s.profitLoss);
    });

    stats.netProfit = stats.totalProfit - stats.totalLoss;
    stats.averageWin = wins.length > 0 ? stats.totalProfit / wins.length : 0;
    stats.averageLoss = losses.length > 0 ? stats.totalLoss / losses.length : 0;
    stats.profitFactor = stats.totalLoss > 0 ? stats.totalProfit / stats.totalLoss : stats.totalProfit > 0 ? Infinity : 0;

    // Best and worst trades
    const allProfits = closedSignals.map((s) => s.profitLoss ?? 0);
    stats.bestTrade = Math.max(...allProfits, 0);
    stats.worstTrade = Math.min(...allProfits, 0);

    // Average risk/reward
    const riskRewards = closedSignals
      .map((s) => s.riskRewardRatio)
      .filter((r) => r !== undefined) as number[];
    stats.averageRiskReward = riskRewards.length > 0 ? riskRewards.reduce((a, b) => a + b) / riskRewards.length : 0;

    // By signal type
    const signalTypes: MPSSignalType[] = ['STRONG_BUY', 'BUY', 'HOLD', 'SELL', 'STRONG_SELL'];
    signalTypes.forEach((type) => {
      const typeSignals = signals.filter((s) => s.signal === type);
      if (typeSignals.length > 0) {
        const typeWins = typeSignals.filter((s) => s.outcome === 'WIN').length;
        const typeClosed = typeSignals.filter((s) => s.outcome !== 'PENDING').length;
        const typeProfit = typeSignals
          .filter((s) => s.outcome === 'WIN')
          .reduce((sum, s) => sum + (s.profitLoss ?? 0), 0);
        const typeLoss = typeSignals
          .filter((s) => s.outcome === 'LOSS')
          .reduce((sum, s) => sum + Math.abs(s.profitLoss ?? 0), 0);

        stats.bySignalType[type] = {
          count: typeSignals.length,
          winRate: typeClosed > 0 ? (typeWins / typeClosed) * 100 : 0,
          profitFactor: typeLoss > 0 ? typeProfit / typeLoss : typeProfit > 0 ? Infinity : 0,
        };
      }
    });

    // By asset
    const assetIds = [...new Set(signals.map((s) => s.assetId))];
    assetIds.forEach((assetId) => {
      const assetSignals = signals.filter((s) => s.assetId === assetId);
      const assetWins = assetSignals.filter((s) => s.outcome === 'WIN').length;
      const assetClosed = assetSignals.filter((s) => s.outcome !== 'PENDING').length;
      const assetProfit = assetSignals
        .filter((s) => s.outcome === 'WIN')
        .reduce((sum, s) => sum + (s.profitLoss ?? 0), 0);
      const assetLoss = assetSignals
        .filter((s) => s.outcome === 'LOSS')
        .reduce((sum, s) => sum + Math.abs(s.profitLoss ?? 0), 0);

      stats.byAsset[assetId] = {
        count: assetSignals.length,
        winRate: assetClosed > 0 ? (assetWins / assetClosed) * 100 : 0,
        profitFactor: assetLoss > 0 ? assetProfit / assetLoss : assetProfit > 0 ? Infinity : 0,
      };
    });

    // By timeframe
    const timeframes: TimeFrame[] = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];
    timeframes.forEach((tf) => {
      const tfSignals = signals.filter((s) => s.timeFrame === tf);
      if (tfSignals.length > 0) {
        const tfWins = tfSignals.filter((s) => s.outcome === 'WIN').length;
        const tfClosed = tfSignals.filter((s) => s.outcome !== 'PENDING').length;
        const tfProfit = tfSignals
          .filter((s) => s.outcome === 'WIN')
          .reduce((sum, s) => sum + (s.profitLoss ?? 0), 0);
        const tfLoss = tfSignals
          .filter((s) => s.outcome === 'LOSS')
          .reduce((sum, s) => sum + Math.abs(s.profitLoss ?? 0), 0);

        stats.byTimeFrame[tf] = {
          count: tfSignals.length,
          winRate: tfClosed > 0 ? (tfWins / tfClosed) * 100 : 0,
          profitFactor: tfLoss > 0 ? tfProfit / tfLoss : tfProfit > 0 ? Infinity : 0,
        };
      }
    });

    return stats;
  }

  /**
   * Export signal history to CSV format
   */
  static async exportToCSV(): Promise<string> {
    const signals = await this.getAllSignals();

    if (signals.length === 0) return 'No signals to export';

    const headers = [
      'ID',
      'Asset',
      'Signal',
      'TimeFrame',
      'Entry Price',
      'Entry Time',
      'Entry Confidence',
      'Stop Loss',
      'TP1',
      'TP2',
      'TP3',
      'Exit Price',
      'Exit Time',
      'Exit Reason',
      'Outcome',
      'Profit/Loss',
      'Profit/Loss %',
      'Risk/Reward',
    ];

    const rows = signals.map((s) => [
      s.id,
      s.assetId,
      s.signal,
      s.timeFrame,
      s.entryPrice.toFixed(2),
      new Date(s.entryTime).toISOString(),
      s.entryConfidence.toFixed(0),
      s.stopLoss.toFixed(2),
      s.takeProfit1.toFixed(2),
      s.takeProfit2.toFixed(2),
      s.takeProfit3.toFixed(2),
      s.exitPrice?.toFixed(2) ?? 'N/A',
      s.exitTime ? new Date(s.exitTime).toISOString() : 'N/A',
      s.exitReason ?? 'N/A',
      s.outcome,
      s.profitLoss?.toFixed(2) ?? 'N/A',
      s.profitLossPercent?.toFixed(2) ?? 'N/A',
      s.riskRewardRatio?.toFixed(2) ?? 'N/A',
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    return csv;
  }
}
