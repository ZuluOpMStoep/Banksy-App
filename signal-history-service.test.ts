/**
 * Mock Data Service
 * Provides realistic trading data for development and testing
 */

import { AssetPrice, ChartCandle, MPSSignalData, NewsArticle, EconomicEvent } from '@/lib/types/trading';
import { TRADING_ASSETS } from '@/lib/constants/assets';

/**
 * Generate realistic price data for an asset
 */
export function generateMockPrice(assetId: string, basePrice: number = 100): AssetPrice {
  const change = (Math.random() - 0.5) * 4; // -2% to +2%
  const changePercent = (change / basePrice) * 100;

  return {
    assetId,
    price: basePrice + change,
    change24h: change,
    changePercent24h: changePercent,
    high24h: basePrice + Math.abs(change) + Math.random() * 2,
    low24h: basePrice - Math.abs(change) - Math.random() * 2,
    volume24h: Math.random() * 1000000,
    timestamp: Date.now(),
  };
}

/**
 * Generate mock prices for all assets
 */
export function generateMockPrices(): AssetPrice[] {
  const basePrices: Record<string, number> = {
    gold: 2050,
    silver: 24.5,
    bitcoin: 45000,
    eur_usd: 1.095,
    gbp_usd: 1.27,
    usd_jpy: 148.5,
    aud_usd: 0.67,
    dax: 18500,
  };

  return TRADING_ASSETS.map((asset) =>
    generateMockPrice(asset.id, basePrices[asset.id] || 100)
  );
}

/**
 * Generate realistic candlestick data
 */
export function generateMockCandles(
  count: number = 100,
  basePrice: number = 100,
  volatility: number = 0.02
): ChartCandle[] {
  const candles: ChartCandle[] = [];
  let currentPrice = basePrice;
  const now = Date.now();
  const candleInterval = 60 * 60 * 1000; // 1 hour

  for (let i = count; i > 0; i--) {
    const change = (Math.random() - 0.5) * volatility * currentPrice;
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * volatility * currentPrice;
    const low = Math.min(open, close) - Math.random() * volatility * currentPrice;
    const volume = Math.random() * 1000000;

    candles.push({
      timestamp: now - i * candleInterval,
      open,
      high,
      low,
      close,
      volume,
    });

    currentPrice = close;
  }

  return candles;
}

/**
 * Signal cache to prevent rapid random flipping
 * Signals are cached for 5 minutes per asset
 */
let signalCache: Record<string, { signal: MPSSignalData; timestamp: number }> = {};
const SIGNAL_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Generate mock MPS signal with aligned components
 * Uses caching to prevent rapid signal changes
 */
export function generateMockMPSSignal(assetId: string): MPSSignalData {
  const signals: MPSSignalData['signal'][] = ['STRONG_BUY', 'BUY', 'HOLD', 'SELL', 'STRONG_SELL'];
  const randomSignal = signals[Math.floor(Math.random() * signals.length)];

  const confidenceMap = {
    STRONG_BUY: 85 + Math.random() * 5,
    BUY: 75 + Math.random() * 5,
    HOLD: 50 + Math.random() * 10,
    SELL: 75 + Math.random() * 5,
    STRONG_SELL: 85 + Math.random() * 5,
  };

  const scoreMap = {
    STRONG_BUY: 0.75 + Math.random() * 0.25,
    BUY: 0.55 + Math.random() * 0.2,
    HOLD: -0.3 + Math.random() * 0.6,
    SELL: -0.75 + Math.random() * 0.2,
    STRONG_SELL: -1 + Math.random() * 0.25,
  };

  // Determine if signal is bullish or bearish
  const isBullish = randomSignal.includes('BUY');
  const isBearish = randomSignal.includes('SELL');

  // Generate components that align with signal direction
  const generateAlignedComponent = (isBullish: boolean, isBearish: boolean): { value: number; description: string } => {
    let value: number;
    let description: string;

    if (isBullish) {
      // For BUY signals, make components mostly positive
      value = Math.round((20 + Math.random() * 80) * 100) / 100;
      description = 'Bullish';
    } else if (isBearish) {
      // For SELL signals, make components mostly negative
      value = Math.round((-80 + Math.random() * -20) * 100) / 100;
      description = 'Bearish';
    } else {
      // For HOLD, components can be mixed
      value = Math.round((-40 + Math.random() * 80) * 100) / 100;
      description = Math.random() > 0.5 ? 'Bullish' : 'Bearish';
    }

    return { value, description };
  };

  return {
    signal: randomSignal,
    confidence: Math.round(confidenceMap[randomSignal]),
    score: scoreMap[randomSignal],
    trendScore: isBullish ? 0.5 + Math.random() * 0.5 : isBearish ? -0.5 - Math.random() * 0.5 : -0.5 + Math.random(),
    momentumScore: isBullish ? 0.5 + Math.random() * 0.5 : isBearish ? -0.5 - Math.random() * 0.5 : -0.5 + Math.random(),
    structureScore: isBullish ? 0.5 + Math.random() * 0.5 : isBearish ? -0.5 - Math.random() * 0.5 : -0.5 + Math.random(),
    riskScore: 50 + Math.random() * 50,
    components: {
      trend: generateAlignedComponent(isBullish, isBearish),
      momentum: generateAlignedComponent(isBullish, isBearish),
      structure: generateAlignedComponent(isBullish, isBearish),
      risk: {
        value: Math.round((50 + Math.random() * 50) * 100) / 100,
        description: Math.random() > 0.5 ? 'Good' : 'Fair',
      },
    },
    entryPrice: 50000 + Math.random() * 20000,
    validityTime: 60 * 60 * 1000,
    validityEndTime: Date.now() + 60 * 60 * 1000,
    timestamp: Date.now(),
    timeFrame: '1h',
  };
}

/**
 * Generate mock news articles
 */
export function generateMockNews(): NewsArticle[] {
  const articles: NewsArticle[] = [
    {
      id: '1',
      title: 'Federal Reserve Signals Potential Rate Cuts in 2026',
      summary: 'The Federal Reserve indicated today that interest rate cuts could be on the horizon...',
      source: 'Bloomberg',
      url: 'https://bloomberg.com',
      timestamp: Date.now() - 3600000,
      sentiment: 'positive',
      relatedAssets: ['eur_usd', 'usd_jpy'],
    },
    {
      id: '2',
      title: 'Gold Prices Surge on Geopolitical Tensions',
      summary: 'Gold prices reached a new high as investors seek safe-haven assets...',
      source: 'Reuters',
      url: 'https://reuters.com',
      timestamp: Date.now() - 7200000,
      sentiment: 'positive',
      relatedAssets: ['gold'],
    },
    {
      id: '3',
      title: 'Bitcoin Faces Resistance at $45,000 Level',
      summary: 'Technical analysts suggest Bitcoin may consolidate before next move...',
      source: 'CoinTelegraph',
      url: 'https://cointelegraph.com',
      timestamp: Date.now() - 10800000,
      sentiment: 'neutral',
      relatedAssets: ['bitcoin'],
    },
    {
      id: '4',
      title: 'European Stocks Decline Amid Economic Concerns',
      summary: 'The DAX index fell 1.5% today following disappointing economic data...',
      source: 'Financial Times',
      url: 'https://ft.com',
      timestamp: Date.now() - 14400000,
      sentiment: 'negative',
      relatedAssets: ['dax'],
    },
  ];

  return articles;
}

/**
 * Generate mock economic events
 */
export function generateMockEconomicEvents() {
  return [
    {
      id: '1',
      name: 'US Non-Farm Payrolls',
      country: 'US',
      impact: 'high' as const,
      timestamp: Date.now() + 86400000,
      forecast: 200000,
      previous: 215000,
      unit: 'persons',
      relatedAssets: ['eur_usd', 'gbp_usd', 'usd_jpy'],
    },
    {
      id: '2',
      name: 'ECB Interest Rate Decision',
      country: 'EU',
      impact: 'high' as const,
      timestamp: Date.now() + 172800000,
      forecast: 3.75,
      previous: 4.0,
      unit: '%',
      relatedAssets: ['eur_usd'],
    },
    {
      id: '3',
      name: 'UK Inflation (CPI)',
      country: 'UK',
      impact: 'medium' as const,
      timestamp: Date.now() + 259200000,
      forecast: 3.2,
      previous: 3.9,
      unit: '%',
      relatedAssets: ['gbp_usd'],
    },
  ];
}

/**
 * Get mock asset data
 */
export function getMockAssetData(assetId: string) {
  return {
    assetId,
    candles: generateMockCandles(100),
    signal: generateMockMPSSignal(assetId),
    news: generateMockNews(),
    events: generateMockEconomicEvents(),
  };
}
