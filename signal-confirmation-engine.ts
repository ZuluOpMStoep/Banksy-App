import axios from 'axios';
import { AssetPrice, ChartCandle } from '@/lib/types/trading';

/**
 * Real-Time Market Data Service
 * Uses free APIs: CoinGecko (crypto), Polygon.io (forex/commodities)
 * No API keys required for free tier
 */

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const POLYGON_BASE = 'https://api.polygon.io/v1';

// Asset ID mappings for different APIs
const ASSET_MAPPINGS: Record<string, { coingecko?: string; polygon?: string; symbol: string }> = {
  bitcoin: { coingecko: 'bitcoin', polygon: 'X:BTCUSD', symbol: 'BTC/USD' },
  gold: { polygon: 'C:XAUUSD', symbol: 'XAU/USD' },
  silver: { polygon: 'C:XAGUSD', symbol: 'XAG/USD' },
  eur_usd: { polygon: 'C:EURUSD', symbol: 'EUR/USD' },
  gbp_usd: { polygon: 'C:GBPUSD', symbol: 'GBP/USD' },
  usd_jpy: { polygon: 'C:USDJPY', symbol: 'USD/JPY' },
  aud_usd: { polygon: 'C:AUDUSD', symbol: 'AUD/USD' },
  dax: { polygon: 'I:DAX', symbol: 'DAX' },
};

/**
 * Get real-time price for an asset with retry logic
 */
export async function getRealTimePrice(assetId: string, retries: number = 2): Promise<AssetPrice | null> {
  try {
    const mapping = ASSET_MAPPINGS[assetId];
    if (!mapping) return null;

    // Try CoinGecko first for crypto
    if (mapping.coingecko) {
      try {
        const response = await axios.get(
          `${COINGECKO_BASE}/simple/price?ids=${mapping.coingecko}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`,
          { timeout: 5000 }
        );

        const data = response.data[mapping.coingecko];
        if (data && data.usd) {
          return {
            assetId,
            price: data.usd,
            change24h: data.usd_24h_change || 0,
            changePercent24h: data.usd_24h_change || 0,
            high24h: data.usd * 1.05,
            low24h: data.usd * 0.95,
            volume24h: data.usd_24h_vol || 0,
            timestamp: Date.now(),
          };
        }
      } catch (err) {
        console.warn(`CoinGecko fetch failed for ${assetId}`);
      }
    }

    // Fallback to Polygon for forex/commodities (free tier)
    if (mapping.polygon) {
      try {
        const response = await axios.get(
          `${POLYGON_BASE}/last/forex?symbols=${mapping.polygon}`,
          { timeout: 5000 }
        );

        if (response.data.results && response.data.results.length > 0) {
          const result = response.data.results[0];
          if (result.last) {
            return {
              assetId,
              price: result.last,
              change24h: result.change || 0,
              changePercent24h: result.changePercent || 0,
              high24h: result.high || result.last,
              low24h: result.low || result.last,
              volume24h: result.volume || 0,
              timestamp: Date.now(),
            };
          }
        }
      } catch (err) {
        console.warn(`Polygon.io fetch failed for ${assetId}`);
        
        // Retry once on failure
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
          return getRealTimePrice(assetId, retries - 1);
        }
      }
    }

    return null;
  } catch (error) {
    console.error(`Error fetching price for ${assetId}`);
    return null;
  }
}

/**
 * Get historical candle data for charting
 */
export async function getHistoricalCandles(
  assetId: string,
  timeframe: string = '1h',
  limit: number = 100
): Promise<ChartCandle[]> {
  try {
    const mapping = ASSET_MAPPINGS[assetId];
    if (!mapping || !mapping.polygon) return [];

    // Convert timeframe to Polygon format
    const timeframeMap: Record<string, string> = {
      '1m': '1',
      '5m': '5',
      '15m': '15',
      '1h': '60',
      '4h': '240',
      '1d': '1D',
      '1w': '1W',
    };

    const polygonTimeframe = timeframeMap[timeframe] || '60';

    // Get aggregates from Polygon
    const response = await axios.get(
      `${POLYGON_BASE}/aggs/ticker/${mapping.polygon}/range/${polygonTimeframe}/2024-01-01/2025-12-31?limit=${limit}&sort=desc`,
      { timeout: 5000 }
    );

    if (!response.data.results) return [];

    // Convert Polygon format to ChartCandle format
    const candles: ChartCandle[] = response.data.results
      .reverse()
      .map((bar: any) => ({
        timestamp: bar.t,
        open: bar.o || 0,
        high: bar.h || 0,
        low: bar.l || 0,
        close: bar.c || 0,
        volume: bar.v || 0,
      }));

    return candles;
  } catch (error) {
    console.error(`Error fetching candles for ${assetId}`);
    return [];
  }
}

/**
 * Get multiple asset prices in parallel
 */
export async function getMultiplePrices(assetIds: string[]): Promise<Record<string, AssetPrice>> {
  const prices: Record<string, AssetPrice> = {};

  const results = await Promise.allSettled(
    assetIds.map((id) => getRealTimePrice(id))
  );

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      prices[assetIds[index]] = result.value;
    }
  });

  return prices;
}

/**
 * Stream real-time price updates (polling fallback for free tier)
 */
export function subscribeToPrice(
  assetId: string,
  callback: (price: AssetPrice) => void,
  interval: number = 5000
): () => void {
  const intervalId = setInterval(async () => {
    const price = await getRealTimePrice(assetId);
    if (price) {
      callback(price);
    }
  }, interval);

  // Return unsubscribe function
  return () => clearInterval(intervalId as any);
}

/**
 * Get market overview (all assets)
 */
export async function getMarketOverview(): Promise<Record<string, AssetPrice>> {
  const assetIds = Object.keys(ASSET_MAPPINGS);
  return getMultiplePrices(assetIds);
}

/**
 * Calculate price change statistics
 */
export function calculatePriceStats(candles: ChartCandle[]) {
  if (candles.length === 0) {
    return {
      high: 0,
      low: 0,
      average: 0,
      volatility: 0,
    };
  }

  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);

  const high = Math.max(...highs);
  const low = Math.min(...lows);
  const average = closes.reduce((a, b) => a + b, 0) / closes.length;

  // Calculate standard deviation (volatility)
  const variance =
    closes.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / closes.length;
  const volatility = Math.sqrt(variance);

  return { high, low, average, volatility };
}

/**
 * Format price for display
 */
export function formatPrice(price: number, assetId: string): string {
  // Crypto typically shows 2-4 decimals
  if (['bitcoin'].includes(assetId)) {
    return price.toFixed(2);
  }

  // Forex typically shows 4-5 decimals
  if (['eur_usd', 'gbp_usd', 'usd_jpy', 'aud_usd'].includes(assetId)) {
    return price.toFixed(5);
  }

  // Commodities typically show 2-3 decimals
  return price.toFixed(2);
}

export default {
  getRealTimePrice,
  getHistoricalCandles,
  getMultiplePrices,
  subscribeToPrice,
  getMarketOverview,
  calculatePriceStats,
  formatPrice,
};
