import { describe, it, expect, beforeEach } from 'vitest';
import { TradeJournalService } from './trade-journal-service';
import { TradeEntry } from '@/lib/types/trade-journal';

describe('TradeJournalService', () => {
  beforeEach(async () => {
    // Clear trades before each test
    const trades = await TradeJournalService.getAllTrades();
    for (const trade of trades) {
      await TradeJournalService.deleteTrade(trade.id);
    }
  });

  describe('createTrade', () => {
    it('should create a new trade entry', async () => {
      const trade = await TradeJournalService.createTrade({
        userId: 'user_1',
        asset: 'GOLD',
        signalType: 'BUY',
        entryPrice: 2050,
        entryTime: Date.now(),
        entryTimeframe: '1H',
        predictedTP1: 2060,
        predictedTP2: 2070,
        predictedTP3: 2080,
        predictedSL: 2040,
        predictedConfidence: 85,
        predictedAccuracy: 90,
        riskAmount: 10,
        rewardAmount1: 10,
        rewardAmount2: 20,
        rewardAmount3: 30,
        status: 'open',
        outcome: 'pending',
      });

      expect(trade.id).toBeDefined();
      expect(trade.asset).toBe('GOLD');
      expect(trade.signalType).toBe('BUY');
      expect(trade.entryPrice).toBe(2050);
      expect(trade.status).toBe('open');
    });
  });

  describe('getAllTrades', () => {
    it('should return empty array initially', async () => {
      const trades = await TradeJournalService.getAllTrades();
      expect(trades).toEqual([]);
    });

    it('should return all created trades', async () => {
      await TradeJournalService.createTrade({
        userId: 'user_1',
        asset: 'GOLD',
        signalType: 'BUY',
        entryPrice: 2050,
        entryTime: Date.now(),
        entryTimeframe: '1H',
        predictedTP1: 2060,
        predictedTP2: 2070,
        predictedTP3: 2080,
        predictedSL: 2040,
        predictedConfidence: 85,
        predictedAccuracy: 90,
        riskAmount: 10,
        rewardAmount1: 10,
        rewardAmount2: 20,
        rewardAmount3: 30,
        status: 'open',
        outcome: 'pending',
      });

      await TradeJournalService.createTrade({
        userId: 'user_1',
        asset: 'SILVER',
        signalType: 'SELL',
        entryPrice: 25,
        entryTime: Date.now(),
        entryTimeframe: '4H',
        predictedTP1: 24,
        predictedTP2: 23,
        predictedTP3: 22,
        predictedSL: 26,
        predictedConfidence: 80,
        predictedAccuracy: 85,
        riskAmount: 1,
        rewardAmount1: 1,
        rewardAmount2: 2,
        rewardAmount3: 3,
        status: 'open',
        outcome: 'pending',
      });

      const trades = await TradeJournalService.getAllTrades();
      expect(trades.length).toBe(2);
    });
  });

  describe('getTrade', () => {
    it('should return trade by ID', async () => {
      const created = await TradeJournalService.createTrade({
        userId: 'user_1',
        asset: 'GOLD',
        signalType: 'BUY',
        entryPrice: 2050,
        entryTime: Date.now(),
        entryTimeframe: '1H',
        predictedTP1: 2060,
        predictedTP2: 2070,
        predictedTP3: 2080,
        predictedSL: 2040,
        predictedConfidence: 85,
        predictedAccuracy: 90,
        riskAmount: 10,
        rewardAmount1: 10,
        rewardAmount2: 20,
        rewardAmount3: 30,
        status: 'open',
        outcome: 'pending',
      });

      const retrieved = await TradeJournalService.getTrade(created.id);
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.asset).toBe('GOLD');
    });

    it('should return undefined for non-existent ID', async () => {
      const result = await TradeJournalService.getTrade('non_existent');
      expect(result).toBeUndefined();
    });
  });

  describe('updateTrade', () => {
    it('should update trade entry', async () => {
      const created = await TradeJournalService.createTrade({
        userId: 'user_1',
        asset: 'GOLD',
        signalType: 'BUY',
        entryPrice: 2050,
        entryTime: Date.now(),
        entryTimeframe: '1H',
        predictedTP1: 2060,
        predictedTP2: 2070,
        predictedTP3: 2080,
        predictedSL: 2040,
        predictedConfidence: 85,
        predictedAccuracy: 90,
        riskAmount: 10,
        rewardAmount1: 10,
        rewardAmount2: 20,
        rewardAmount3: 30,
        status: 'open',
        outcome: 'pending',
      });

      const updated = await TradeJournalService.updateTrade(created.id, {
        status: 'closed',
        outcome: 'win',
        exitPrice: 2060,
        actualPnL: 10,
        actualPnLPercent: 0.49,
      });

      expect(updated?.status).toBe('closed');
      expect(updated?.outcome).toBe('win');
      expect(updated?.exitPrice).toBe(2060);
    });
  });

  describe('deleteTrade', () => {
    it('should delete trade entry', async () => {
      const created = await TradeJournalService.createTrade({
        userId: 'user_1',
        asset: 'GOLD',
        signalType: 'BUY',
        entryPrice: 2050,
        entryTime: Date.now(),
        entryTimeframe: '1H',
        predictedTP1: 2060,
        predictedTP2: 2070,
        predictedTP3: 2080,
        predictedSL: 2040,
        predictedConfidence: 85,
        predictedAccuracy: 90,
        riskAmount: 10,
        rewardAmount1: 10,
        rewardAmount2: 20,
        rewardAmount3: 30,
        status: 'open',
        outcome: 'pending',
      });

      const deleted = await TradeJournalService.deleteTrade(created.id);
      expect(deleted).toBe(true);

      const retrieved = await TradeJournalService.getTrade(created.id);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('filterTrades', () => {
    it('should filter trades by asset', async () => {
      await TradeJournalService.createTrade({
        userId: 'user_1',
        asset: 'GOLD',
        signalType: 'BUY',
        entryPrice: 2050,
        entryTime: Date.now(),
        entryTimeframe: '1H',
        predictedTP1: 2060,
        predictedTP2: 2070,
        predictedTP3: 2080,
        predictedSL: 2040,
        predictedConfidence: 85,
        predictedAccuracy: 90,
        riskAmount: 10,
        rewardAmount1: 10,
        rewardAmount2: 20,
        rewardAmount3: 30,
        status: 'open',
        outcome: 'pending',
      });

      await TradeJournalService.createTrade({
        userId: 'user_1',
        asset: 'SILVER',
        signalType: 'SELL',
        entryPrice: 25,
        entryTime: Date.now(),
        entryTimeframe: '4H',
        predictedTP1: 24,
        predictedTP2: 23,
        predictedTP3: 22,
        predictedSL: 26,
        predictedConfidence: 80,
        predictedAccuracy: 85,
        riskAmount: 1,
        rewardAmount1: 1,
        rewardAmount2: 2,
        rewardAmount3: 3,
        status: 'open',
        outcome: 'pending',
      });

      const goldTrades = await TradeJournalService.filterTrades({ asset: 'GOLD' });
      expect(goldTrades.length).toBe(1);
      expect(goldTrades[0].asset).toBe('GOLD');
    });

    it('should filter trades by signal type', async () => {
      await TradeJournalService.createTrade({
        userId: 'user_1',
        asset: 'GOLD',
        signalType: 'BUY',
        entryPrice: 2050,
        entryTime: Date.now(),
        entryTimeframe: '1H',
        predictedTP1: 2060,
        predictedTP2: 2070,
        predictedTP3: 2080,
        predictedSL: 2040,
        predictedConfidence: 85,
        predictedAccuracy: 90,
        riskAmount: 10,
        rewardAmount1: 10,
        rewardAmount2: 20,
        rewardAmount3: 30,
        status: 'open',
        outcome: 'pending',
      });

      await TradeJournalService.createTrade({
        userId: 'user_1',
        asset: 'GOLD',
        signalType: 'SELL',
        entryPrice: 2060,
        entryTime: Date.now(),
        entryTimeframe: '1H',
        predictedTP1: 2050,
        predictedTP2: 2040,
        predictedTP3: 2030,
        predictedSL: 2070,
        predictedConfidence: 80,
        predictedAccuracy: 85,
        riskAmount: 10,
        rewardAmount1: 10,
        rewardAmount2: 20,
        rewardAmount3: 30,
        status: 'open',
        outcome: 'pending',
      });

      const buyTrades = await TradeJournalService.filterTrades({ signalType: 'BUY' });
      expect(buyTrades.length).toBe(1);
      expect(buyTrades[0].signalType).toBe('BUY');
    });
  });

  describe('closeTrade', () => {
    it('should close a trade and calculate PnL', async () => {
      const created = await TradeJournalService.createTrade({
        userId: 'user_1',
        asset: 'GOLD',
        signalType: 'BUY',
        entryPrice: 2050,
        entryTime: Date.now(),
        entryTimeframe: '1H',
        predictedTP1: 2060,
        predictedTP2: 2070,
        predictedTP3: 2080,
        predictedSL: 2040,
        predictedConfidence: 85,
        predictedAccuracy: 90,
        riskAmount: 10,
        rewardAmount1: 10,
        rewardAmount2: 20,
        rewardAmount3: 30,
        status: 'open',
        outcome: 'pending',
      });

      const closed = await TradeJournalService.closeTrade(
        created.id,
        2060,
        'TP1'
      );

      expect(closed?.status).toBe('closed');
      expect(closed?.outcome).toBe('win');
      expect(closed?.exitPrice).toBe(2060);
      expect(closed?.actualPnL).toBe(10);
    });
  });

  describe('calculateStats', () => {
    it('should calculate empty stats for no trades', async () => {
      const stats = await TradeJournalService.calculateStats();
      expect(stats.totalTrades).toBe(0);
      expect(stats.winRate).toBe(0);
    });

    it('should calculate win rate correctly', async () => {
      // Create 2 winning trades
      const trade1 = await TradeJournalService.createTrade({
        userId: 'user_1',
        asset: 'GOLD',
        signalType: 'BUY',
        entryPrice: 2050,
        entryTime: Date.now(),
        entryTimeframe: '1H',
        predictedTP1: 2060,
        predictedTP2: 2070,
        predictedTP3: 2080,
        predictedSL: 2040,
        predictedConfidence: 85,
        predictedAccuracy: 90,
        riskAmount: 10,
        rewardAmount1: 10,
        rewardAmount2: 20,
        rewardAmount3: 30,
        status: 'closed',
        outcome: 'win',
        actualPnL: 10,
        actualPnLPercent: 0.49,
      });

      const trade2 = await TradeJournalService.createTrade({
        userId: 'user_1',
        asset: 'SILVER',
        signalType: 'SELL',
        entryPrice: 25,
        entryTime: Date.now(),
        entryTimeframe: '4H',
        predictedTP1: 24,
        predictedTP2: 23,
        predictedTP3: 22,
        predictedSL: 26,
        predictedConfidence: 80,
        predictedAccuracy: 85,
        riskAmount: 1,
        rewardAmount1: 1,
        rewardAmount2: 2,
        rewardAmount3: 3,
        status: 'closed',
        outcome: 'loss',
        actualPnL: -1,
        actualPnLPercent: -4,
      });

      const stats = await TradeJournalService.calculateStats();
      expect(stats.totalTrades).toBe(2);
      expect(stats.winTrades).toBe(1);
      expect(stats.lossTrades).toBe(1);
      expect(stats.winRate).toBe(50);
    });
  });

  describe('getAccuracyComparison', () => {
    it('should compare predicted vs actual accuracy', async () => {
      await TradeJournalService.createTrade({
        userId: 'user_1',
        asset: 'GOLD',
        signalType: 'BUY',
        entryPrice: 2050,
        entryTime: Date.now(),
        entryTimeframe: '1H',
        predictedTP1: 2060,
        predictedTP2: 2070,
        predictedTP3: 2080,
        predictedSL: 2040,
        predictedConfidence: 85,
        predictedAccuracy: 90,
        riskAmount: 10,
        rewardAmount1: 10,
        rewardAmount2: 20,
        rewardAmount3: 30,
        status: 'closed',
        outcome: 'win',
        actualPnL: 10,
        actualPnLPercent: 0.49,
      });

      const comparison = await TradeJournalService.getAccuracyComparison();
      expect(comparison.predictedAccuracy).toBe(90);
      expect(comparison.actualAccuracy).toBe(100);
      expect(comparison.difference).toBeLessThan(0);
    });
  });
});
