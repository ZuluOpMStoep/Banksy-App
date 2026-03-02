import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import {
  getRealTimePrice,
  getMultiplePrices,
  calculatePriceStats,
  formatPrice,
} from './market-data-service';
import { ChartCandle } from '@/lib/types/trading';

vi.mock('axios');
const mockedAxios = axios as any;

describe('Market Data Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRealTimePrice', () => {
    it('should fetch Bitcoin price from CoinGecko', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          bitcoin: {
            usd: 65000,
            usd_24h_change: 2.5,
            usd_24h_vol: 30000000000,
          },
        },
      });

      const price = await getRealTimePrice('bitcoin');

      expect(price).toBeDefined();
      expect(price?.price).toBe(65000);
      expect(price?.changePercent24h).toBe(2.5);
      expect(price?.assetId).toBe('bitcoin');
    });

    it('should fetch Gold price from Polygon.io', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          results: [
            {
              last: 2050.5,
              change: 10.5,
              changePercent: 0.52,
              high: 2055,
              low: 2045,
              volume: 1000000,
            },
          ],
        },
      });

      const price = await getRealTimePrice('gold');

      expect(price).toBeDefined();
      expect(price?.price).toBe(2050.5);
      expect(price?.changePercent24h).toBe(0.52);
      expect(price?.assetId).toBe('gold');
    });

    it('should fetch Silver price from Polygon.io', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          results: [
            {
              last: 24.5,
              change: 0.5,
              changePercent: 2.08,
              high: 25,
              low: 24,
              volume: 500000,
            },
          ],
        },
      });

      const price = await getRealTimePrice('silver');

      expect(price).toBeDefined();
      expect(price?.price).toBe(24.5);
      expect(price?.changePercent24h).toBe(2.08);
      expect(price?.assetId).toBe('silver');
    });

    it('should fetch EUR/USD from Polygon.io', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          results: [
            {
              last: 1.0850,
              change: 0.0015,
              changePercent: 0.14,
              high: 1.0860,
              low: 1.0840,
              volume: 2000000,
            },
          ],
        },
      });

      const price = await getRealTimePrice('eur_usd');

      expect(price).toBeDefined();
      expect(price?.price).toBe(1.0850);
      expect(price?.changePercent24h).toBe(0.14);
      expect(price?.assetId).toBe('eur_usd');
    });

    it('should return null for unknown asset', async () => {
      const price = await getRealTimePrice('unknown_asset');
      expect(price).toBeNull();
    });

    it('should retry on failure', async () => {
      mockedAxios.get
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: {
            results: [
              {
                last: 2050,
                change: 10,
                changePercent: 0.5,
              },
            ],
          },
        });

      const price = await getRealTimePrice('gold', 1);

      expect(price).toBeDefined();
      expect(price?.price).toBe(2050);
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('getMultiplePrices', () => {
    it('should fetch multiple prices in parallel', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({
          data: { bitcoin: { usd: 65000, usd_24h_change: 2.5, usd_24h_vol: 30000000000 } },
        })
        .mockResolvedValueOnce({
          data: {
            results: [{ last: 2050, change: 10, changePercent: 0.5 }],
          },
        });

      const prices = await getMultiplePrices(['bitcoin', 'gold']);

      expect(Object.keys(prices).length).toBeGreaterThan(0);
      expect(prices['bitcoin']?.price).toBe(65000);
      expect(prices['gold']?.price).toBe(2050);
    });

    it('should handle partial failures', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({
          data: { bitcoin: { usd: 65000, usd_24h_change: 2.5, usd_24h_vol: 30000000000 } },
        })
        .mockRejectedValueOnce(new Error('API error'));

      const prices = await getMultiplePrices(['bitcoin', 'gold']);

      expect(prices['bitcoin']).toBeDefined();
      expect(prices['gold']).toBeUndefined();
    });
  });

  describe('calculatePriceStats', () => {
    it('should calculate statistics from candles', () => {
      const candles: ChartCandle[] = [
        { timestamp: 1000, open: 100, high: 105, low: 95, close: 102, volume: 1000 },
        { timestamp: 2000, open: 102, high: 108, low: 100, close: 105, volume: 1200 },
        { timestamp: 3000, open: 105, high: 110, low: 103, close: 107, volume: 1100 },
      ];

      const stats = calculatePriceStats(candles);

      expect(stats.high).toBe(110);
      expect(stats.low).toBe(95);
      expect(stats.average).toBeCloseTo(104.67, 1);
      expect(stats.volatility).toBeGreaterThan(0);
    });

    it('should return zeros for empty candles', () => {
      const stats = calculatePriceStats([]);

      expect(stats.high).toBe(0);
      expect(stats.low).toBe(0);
      expect(stats.average).toBe(0);
      expect(stats.volatility).toBe(0);
    });
  });

  describe('formatPrice', () => {
    it('should format Bitcoin with 2 decimals', () => {
      expect(formatPrice(65123.456, 'bitcoin')).toBe('65123.46');
    });

    it('should format forex with 5 decimals', () => {
      expect(formatPrice(1.085012345, 'eur_usd')).toBe('1.08501');
    });

    it('should format commodities with 2 decimals', () => {
      expect(formatPrice(2050.123, 'gold')).toBe('2050.12');
    });
  });
});
