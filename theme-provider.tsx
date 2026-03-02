import { getHistoricalCandles, getRealTimePrice, subscribeToPrice } from './market-data-service';
import { ChartCandle, AssetPrice } from '@/lib/types/trading';
import { TRADING_ASSETS } from '@/lib/constants/assets';

/**
 * TradingView Datafeed Adapter
 * Connects Banksy market data to TradingView Advanced Charts
 * Implements IExternalDatafeed interface
 */

export interface SymbolInfo {
  name: string;
  full_name: string;
  description: string;
  type: string;
  exchange: string;
  listed_exchange: string;
  timezone: string;
  session_regular: string;
  minmov: number;
  pricescale: number;
  has_intraday: boolean;
  has_daily: boolean;
  has_weekly_and_monthly: boolean;
  supported_resolutions: string[];
  volume_precision: number;
  data_status: 'streaming' | 'endofday' | 'pulsed' | 'delayed_streaming';
}

export interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface Quote {
  symbol: string;
  bid: number;
  ask: number;
  last_price: number;
  last_time: number;
}

/**
 * Symbol mapping for all supported assets
 */
const SYMBOL_MAP: Record<string, SymbolInfo> = {
  'XAUUSD': {
    name: 'XAUUSD',
    full_name: 'Gold Spot Price',
    description: 'Gold (XAU) vs US Dollar (USD)',
    type: 'commodity',
    exchange: 'FOREX',
    listed_exchange: 'FOREX',
    timezone: 'UTC',
    session_regular: '24x5',
    minmov: 1,
    pricescale: 100,
    has_intraday: true,
    has_daily: true,
    has_weekly_and_monthly: true,
    supported_resolutions: ['1', '5', '15', '60', '240', '1D', '1W'],
    volume_precision: 0,
    data_status: 'streaming',
  },
  'XAGUSD': {
    name: 'XAGUSD',
    full_name: 'Silver Spot Price',
    description: 'Silver (XAG) vs US Dollar (USD)',
    type: 'commodity',
    exchange: 'FOREX',
    listed_exchange: 'FOREX',
    timezone: 'UTC',
    session_regular: '24x5',
    minmov: 1,
    pricescale: 10000,
    has_intraday: true,
    has_daily: true,
    has_weekly_and_monthly: true,
    supported_resolutions: ['1', '5', '15', '60', '240', '1D', '1W'],
    volume_precision: 0,
    data_status: 'streaming',
  },
  'BTCUSD': {
    name: 'BTCUSD',
    full_name: 'Bitcoin',
    description: 'Bitcoin (BTC) vs US Dollar (USD)',
    type: 'crypto',
    exchange: 'CRYPTO',
    listed_exchange: 'CRYPTO',
    timezone: 'UTC',
    session_regular: '24x7',
    minmov: 1,
    pricescale: 100,
    has_intraday: true,
    has_daily: true,
    has_weekly_and_monthly: true,
    supported_resolutions: ['1', '5', '15', '60', '240', '1D', '1W'],
    volume_precision: 0,
    data_status: 'streaming',
  },
  'EURUSD': {
    name: 'EURUSD',
    full_name: 'Euro vs US Dollar',
    description: 'Euro (EUR) vs US Dollar (USD)',
    type: 'forex',
    exchange: 'FOREX',
    listed_exchange: 'FOREX',
    timezone: 'UTC',
    session_regular: '24x5',
    minmov: 1,
    pricescale: 100000,
    has_intraday: true,
    has_daily: true,
    has_weekly_and_monthly: true,
    supported_resolutions: ['1', '5', '15', '60', '240', '1D', '1W'],
    volume_precision: 0,
    data_status: 'streaming',
  },
  'GBPUSD': {
    name: 'GBPUSD',
    full_name: 'British Pound vs US Dollar',
    description: 'British Pound (GBP) vs US Dollar (USD)',
    type: 'forex',
    exchange: 'FOREX',
    listed_exchange: 'FOREX',
    timezone: 'UTC',
    session_regular: '24x5',
    minmov: 1,
    pricescale: 100000,
    has_intraday: true,
    has_daily: true,
    has_weekly_and_monthly: true,
    supported_resolutions: ['1', '5', '15', '60', '240', '1D', '1W'],
    volume_precision: 0,
    data_status: 'streaming',
  },
  'USDJPY': {
    name: 'USDJPY',
    full_name: 'US Dollar vs Japanese Yen',
    description: 'US Dollar (USD) vs Japanese Yen (JPY)',
    type: 'forex',
    exchange: 'FOREX',
    listed_exchange: 'FOREX',
    timezone: 'UTC',
    session_regular: '24x5',
    minmov: 1,
    pricescale: 10000,
    has_intraday: true,
    has_daily: true,
    has_weekly_and_monthly: true,
    supported_resolutions: ['1', '5', '15', '60', '240', '1D', '1W'],
    volume_precision: 0,
    data_status: 'streaming',
  },
  'AUDUSD': {
    name: 'AUDUSD',
    full_name: 'Australian Dollar vs US Dollar',
    description: 'Australian Dollar (AUD) vs US Dollar (USD)',
    type: 'forex',
    exchange: 'FOREX',
    listed_exchange: 'FOREX',
    timezone: 'UTC',
    session_regular: '24x5',
    minmov: 1,
    pricescale: 100000,
    has_intraday: true,
    has_daily: true,
    has_weekly_and_monthly: true,
    supported_resolutions: ['1', '5', '15', '60', '240', '1D', '1W'],
    volume_precision: 0,
    data_status: 'streaming',
  },
  'DAX': {
    name: 'DAX',
    full_name: 'DAX Index',
    description: 'German DAX Stock Index',
    type: 'index',
    exchange: 'XETRA',
    listed_exchange: 'XETRA',
    timezone: 'Europe/Berlin',
    session_regular: '0800-2200',
    minmov: 1,
    pricescale: 100,
    has_intraday: true,
    has_daily: true,
    has_weekly_and_monthly: true,
    supported_resolutions: ['1', '5', '15', '60', '240', '1D', '1W'],
    volume_precision: 0,
    data_status: 'streaming',
  },
};

/**
 * Map asset ID to TradingView symbol
 */
export function mapAssetToSymbol(assetId: string): string {
  const asset = TRADING_ASSETS.find((a) => a.id === assetId);
  if (!asset) throw new Error(`Unknown asset: ${assetId}`);

  // Map asset symbols to TradingView format
  const symbolMap: Record<string, string> = {
    gold: 'XAUUSD',
    silver: 'XAGUSD',
    bitcoin: 'BTCUSD',
    eur_usd: 'EURUSD',
    gbp_usd: 'GBPUSD',
    usd_jpy: 'USDJPY',
    aud_usd: 'AUDUSD',
    dax: 'DAX',
  };

  return symbolMap[assetId] || asset.symbol;
}

/**
 * Get symbol info for TradingView
 */
export function getSymbolInfo(symbol: string): SymbolInfo | null {
  return SYMBOL_MAP[symbol] || null;
}

/**
 * Convert resolution string to timeframe
 */
export function resolutionToTimeframe(resolution: string): string {
  const map: Record<string, string> = {
    '1': '1m',
    '5': '5m',
    '15': '15m',
    '60': '1h',
    '240': '4h',
    '1D': '1d',
    '1W': '1w',
  };
  return map[resolution] || '1h';
}

/**
 * Convert timeframe to resolution
 */
export function timeframeToResolution(timeframe: string): string {
  const map: Record<string, string> = {
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '1h': '60',
    '4h': '240',
    '1d': '1D',
    '1w': '1W',
  };
  return map[timeframe] || '60';
}

/**
 * Fetch historical bars for TradingView
 */
export async function getBars(
  symbol: string,
  resolution: string,
  from: number,
  to: number,
  limit: number = 500
): Promise<Bar[]> {
  try {
    // Map TradingView symbol to asset ID
    const assetId = Object.entries(SYMBOL_MAP).find(
      ([key]) => key === symbol
    )?.[0];

    if (!assetId) {
      console.error(`Unknown symbol: ${symbol}`);
      return [];
    }

    // Convert resolution to timeframe
    const timeframe = resolutionToTimeframe(resolution);

    // Fetch candles from market data service
    const candles = await getHistoricalCandles(assetId.toLowerCase(), timeframe, limit);

    // Convert to TradingView Bar format
    const bars: Bar[] = candles.map((candle: ChartCandle) => ({
      time: Math.floor(candle.timestamp / 1000), // Convert to seconds
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
    }));

    // Filter by time range
    return bars.filter((bar) => bar.time >= from && bar.time <= to);
  } catch (error) {
    console.error('Error fetching bars:', error);
    return [];
  }
}

/**
 * Get real-time quotes
 */
export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  try {
    const quotes: Quote[] = [];

    for (const symbol of symbols) {
      // Find asset ID from symbol
      const assetId = Object.keys(SYMBOL_MAP).find((key) => key === symbol);
      if (!assetId) continue;

      // Get real-time price
      const price = await getRealTimePrice(assetId.toLowerCase());
      if (!price) continue;

      quotes.push({
        symbol,
        bid: price.price * 0.9999, // Simulate bid/ask spread
        ask: price.price * 1.0001,
        last_price: price.price,
        last_time: Math.floor(price.timestamp / 1000),
      });
    }

    return quotes;
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return [];
  }
}

/**
 * Subscribe to real-time updates
 */
export function subscribeToUpdates(
  symbol: string,
  onUpdate: (bar: Bar) => void,
  interval: number = 5000
): () => void {
  // Find asset ID from symbol
  const assetId = Object.keys(SYMBOL_MAP).find((key) => key === symbol);
  if (!assetId) {
    console.error(`Unknown symbol: ${symbol}`);
    return () => {};
  }

  // Subscribe to price updates
  const unsubscribe = subscribeToPrice(assetId.toLowerCase(), (price: AssetPrice) => {
    // Convert price to bar format
    const bar: Bar = {
      time: Math.floor(price.timestamp / 1000),
      open: price.price,
      high: price.high24h,
      low: price.low24h,
      close: price.price,
      volume: price.volume24h,
    };

    onUpdate(bar);
  }, interval);

  return unsubscribe;
}

/**
 * TradingView Datafeed implementation
 */
export const TradingViewDatafeed = {
  onReady: (callback: (config: any) => void) => {
    const config = {
      supported_resolutions: ['1', '5', '15', '60', '240', '1D', '1W'],
      exchanges: [
        { value: 'FOREX', name: 'Forex' },
        { value: 'CRYPTO', name: 'Crypto' },
        { value: 'XETRA', name: 'XETRA' },
      ],
      symbols_types: [
        { name: 'forex', value: 'forex' },
        { name: 'commodity', value: 'commodity' },
        { name: 'crypto', value: 'crypto' },
        { name: 'index', value: 'index' },
      ],
    };
    setTimeout(() => callback(config), 0);
  },

  resolveSymbol: (symbolName: string, onSymbolResolvedCallback: (info: SymbolInfo) => void) => {
    const symbolInfo = getSymbolInfo(symbolName);
    if (symbolInfo) {
      setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0);
    }
  },

  getBars: async (
    symbolInfo: SymbolInfo,
    resolution: string,
    periodParams: any,
    onHistoryCallback: (bars: Bar[], meta: any) => void,
    onErrorCallback: (error: string) => void
  ) => {
    try {
      const bars = await getBars(
        symbolInfo.name,
        resolution,
        periodParams.from,
        periodParams.to,
        periodParams.countBack
      );

      onHistoryCallback(bars, { noData: bars.length === 0 });
    } catch (error) {
      onErrorCallback(String(error));
    }
  },

  subscribeBars: (
    symbolInfo: SymbolInfo,
    resolution: string,
    onRealtimeCallback: (bar: Bar) => void,
    subscriptionUID: string,
    onResetCacheNeededCallback: () => void
  ) => {
    return subscribeToUpdates(symbolInfo.name, onRealtimeCallback);
  },

  unsubscribeBars: (subscriberUID: string) => {
    // Unsubscribe handled by returned function
  },

  getServerTime: (callback: (time: number) => void) => {
    callback(Math.floor(Date.now() / 1000));
  },
};

export default TradingViewDatafeed;
