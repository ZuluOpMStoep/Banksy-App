import { describe, it, expect, beforeEach, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SignalHistoryService } from './signal-history-service';
import { SignalHistoryEntry } from '@/lib/types/signal-history';

vi.mock('@react-native-async-storage/async-storage');
const mockedAsyncStorage = AsyncStorage as any;

describe('SignalHistoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAsyncStorage.getItem.mockResolvedValue(null);
    mockedAsyncStorage.setItem.mockResolvedValue(undefined);
    mockedAsyncStorage.removeItem.mockResolvedValue(undefined);
  });

  describe('addSignal', () => {
    it('should add a new signal entry', async () => {
      mockedAsyncStorage.getItem.mockResolvedValue(JSON.stringify([]));

      const newSignal = {
        assetId: 'bitcoin',
        signal: 'BUY' as const,
        timeFrame: '1h' as const,
        entryPrice: 65000,
        entryTime: Date.now(),
        entryConfidence: 85,
        stopLoss: 64000,
        takeProfit1: 66000,
        takeProfit2: 67000,
        takeProfit3: 68000,
        outcome: 'PENDING' as const,
        predictedAccuracy: 92,
        components: { trend: 10, momentum: 20, structure: 15, risk: 80 },
      };

      const result = await SignalHistoryService.addSignal(newSignal);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.assetId).toBe('bitcoin');
      expect(result.signal).toBe('BUY');
      expect(result.createdAt).toBeDefined();
      expect(mockedAsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('updateSignal', () => {
    it('should update an existing signal', async () => {
      const existingSignal: SignalHistoryEntry = {
        id: 'signal_123',
        assetId: 'bitcoin',
        signal: 'BUY',
        timeFrame: '1h',
        entryPrice: 65000,
        entryTime: Date.now(),
        entryConfidence: 85,
        stopLoss: 64000,
        takeProfit1: 66000,
        takeProfit2: 67000,
        takeProfit3: 68000,
        outcome: 'PENDING',
        predictedAccuracy: 92,
        components: { trend: 10, momentum: 20, structure: 15, risk: 80 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockedAsyncStorage.getItem.mockResolvedValue(JSON.stringify([existingSignal]));

      const updated = await SignalHistoryService.updateSignal('signal_123', {
        outcome: 'WIN',
        exitPrice: 66500,
        exitTime: Date.now(),
        profitLoss: 1500,
        profitLossPercent: 2.31,
      });

      expect(updated).toBeDefined();
      expect(updated?.outcome).toBe('WIN');
      expect(updated?.exitPrice).toBe(66500);
      expect(mockedAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should return null if signal not found', async () => {
      mockedAsyncStorage.getItem.mockResolvedValue(JSON.stringify([]));

      const result = await SignalHistoryService.updateSignal('nonexistent', { outcome: 'WIN' });

      expect(result).toBeNull();
    });
  });

  describe('getSignals', () => {
    it('should filter signals by asset', async () => {
      const signals: SignalHistoryEntry[] = [
        {
          id: 'signal_1',
          assetId: 'bitcoin',
          signal: 'BUY',
          timeFrame: '1h',
          entryPrice: 65000,
          entryTime: Date.now(),
          entryConfidence: 85,
          stopLoss: 64000,
          takeProfit1: 66000,
          takeProfit2: 67000,
          takeProfit3: 68000,
          outcome: 'WIN',
          profitLoss: 1000,
          predictedAccuracy: 92,
          components: { trend: 10, momentum: 20, structure: 15, risk: 80 },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'signal_2',
          assetId: 'gold',
          signal: 'SELL',
          timeFrame: '1h',
          entryPrice: 2050,
          entryTime: Date.now(),
          entryConfidence: 78,
          stopLoss: 2060,
          takeProfit1: 2040,
          takeProfit2: 2030,
          takeProfit3: 2020,
          outcome: 'LOSS',
          profitLoss: -100,
          predictedAccuracy: 88,
          components: { trend: -15, momentum: -20, structure: -10, risk: 70 },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      mockedAsyncStorage.getItem.mockResolvedValue(JSON.stringify(signals));

      const filtered = await SignalHistoryService.getSignals({ assetId: 'bitcoin' });

      expect(filtered.length).toBe(1);
      expect(filtered[0].assetId).toBe('bitcoin');
    });

    it('should sort signals by entry time', async () => {
      const now = Date.now();
      const signals: SignalHistoryEntry[] = [
        {
          id: 'signal_1',
          assetId: 'bitcoin',
          signal: 'BUY',
          timeFrame: '1h',
          entryPrice: 65000,
          entryTime: now - 1000,
          entryConfidence: 85,
          stopLoss: 64000,
          takeProfit1: 66000,
          takeProfit2: 67000,
          takeProfit3: 68000,
          outcome: 'WIN',
          profitLoss: 1000,
          predictedAccuracy: 92,
          components: { trend: 10, momentum: 20, structure: 15, risk: 80 },
          createdAt: now - 1000,
          updatedAt: now - 1000,
        },
        {
          id: 'signal_2',
          assetId: 'bitcoin',
          signal: 'BUY',
          timeFrame: '1h',
          entryPrice: 65100,
          entryTime: now,
          entryConfidence: 88,
          stopLoss: 64000,
          takeProfit1: 66000,
          takeProfit2: 67000,
          takeProfit3: 68000,
          outcome: 'PENDING',
          predictedAccuracy: 92,
          components: { trend: 10, momentum: 20, structure: 15, risk: 80 },
          createdAt: now,
          updatedAt: now,
        },
      ];

      mockedAsyncStorage.getItem.mockResolvedValue(JSON.stringify(signals));

      const sorted = await SignalHistoryService.getSignals(undefined, { sortBy: 'entryTime', order: 'desc' });

      expect(sorted[0].id).toBe('signal_2');
      expect(sorted[1].id).toBe('signal_1');
    });
  });

  describe('calculateStats', () => {
    it('should calculate win rate correctly', async () => {
      const signals: SignalHistoryEntry[] = [
        {
          id: 'signal_1',
          assetId: 'bitcoin',
          signal: 'BUY',
          timeFrame: '1h',
          entryPrice: 65000,
          entryTime: Date.now(),
          entryConfidence: 85,
          stopLoss: 64000,
          takeProfit1: 66000,
          takeProfit2: 67000,
          takeProfit3: 68000,
          outcome: 'WIN',
          profitLoss: 1000,
          predictedAccuracy: 92,
          components: { trend: 10, momentum: 20, structure: 15, risk: 80 },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'signal_2',
          assetId: 'bitcoin',
          signal: 'BUY',
          timeFrame: '1h',
          entryPrice: 65000,
          entryTime: Date.now(),
          entryConfidence: 85,
          stopLoss: 64000,
          takeProfit1: 66000,
          takeProfit2: 67000,
          takeProfit3: 68000,
          outcome: 'LOSS',
          profitLoss: -500,
          predictedAccuracy: 92,
          components: { trend: 10, momentum: 20, structure: 15, risk: 80 },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      mockedAsyncStorage.getItem.mockResolvedValue(JSON.stringify(signals));

      const stats = await SignalHistoryService.calculateStats();

      expect(stats.totalSignals).toBe(2);
      expect(stats.winCount).toBe(1);
      expect(stats.lossCount).toBe(1);
      expect(stats.winRate).toBe(50);
      expect(stats.totalProfit).toBe(1000);
      expect(stats.totalLoss).toBe(500);
      expect(stats.netProfit).toBe(500);
    });

    it('should return empty stats for no signals', async () => {
      mockedAsyncStorage.getItem.mockResolvedValue(JSON.stringify([]));

      const stats = await SignalHistoryService.calculateStats();

      expect(stats.totalSignals).toBe(0);
      expect(stats.winRate).toBe(0);
      expect(stats.netProfit).toBe(0);
    });
  });

  describe('exportToCSV', () => {
    it('should export signals to CSV format', async () => {
      const signals: SignalHistoryEntry[] = [
        {
          id: 'signal_1',
          assetId: 'bitcoin',
          signal: 'BUY',
          timeFrame: '1h',
          entryPrice: 65000,
          entryTime: Date.now(),
          entryConfidence: 85,
          stopLoss: 64000,
          takeProfit1: 66000,
          takeProfit2: 67000,
          takeProfit3: 68000,
          outcome: 'WIN',
          profitLoss: 1000,
          profitLossPercent: 1.54,
          predictedAccuracy: 92,
          components: { trend: 10, momentum: 20, structure: 15, risk: 80 },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      mockedAsyncStorage.getItem.mockResolvedValue(JSON.stringify(signals));

      const csv = await SignalHistoryService.exportToCSV();

      expect(csv).toContain('ID,Asset,Signal');
      expect(csv).toContain('bitcoin');
      expect(csv).toContain('BUY');
    });
  });
});
