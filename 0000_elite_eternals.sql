/**
 * Trading App Type Definitions
 */

// Asset Types
export type AssetType = 'forex' | 'crypto' | 'commodity' | 'index';

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  displayName: string;
  description: string;
  icon?: string;
}

export interface AssetPrice {
  assetId: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  timestamp: number;
}

// Chart Data
export interface ChartCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type TimeFrame = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | '1M';

// MPS Signal
export type MPSSignalType = 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';

export interface MPSSignalData {
  signal: MPSSignalType;
  confidence: number; // 0-100
  score: number; // -1.0 to +1.0
  trendScore: number;
  momentumScore: number;
  structureScore: number;
  riskScore: number;
  components: {
    trend: { value: number; description: string };
    momentum: { value: number; description: string };
    structure: { value: number; description: string };
    risk: { value: number; description: string };
  };
  entryPrice: number; // Current price when signal triggers
  validityTime: number; // How long signal is valid (ms)
  validityEndTime: number; // Timestamp when signal expires
  timestamp: number;
  timeFrame: TimeFrame;
}

// Indicators
export interface IndicatorSettings {
  rsiPeriod: number;
  rsiBuyThreshold: number;
  rsiSellThreshold: number;
  macdFast: number;
  macdSlow: number;
  macdSignal: number;
  bbPeriod: number;
  bbStdDev: number;
  adxPeriod: number;
  atrPeriod: number;
}

export interface IndicatorValues {
  rsi: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  bbUpper: number;
  bbMiddle: number;
  bbLower: number;
  ema50: number;
  ema200: number;
  sma50: number;
  sma200: number;
  adx: number;
  atr: number;
  ichimokuTenkan: number;
  ichimokuKijun: number;
  ichimokuSenkouA: number;
  ichimokuSenkouB: number;
}

// Economic Calendar
export type EventImpact = 'high' | 'medium' | 'low';

export interface EconomicEvent {
  id: string;
  name: string;
  country: string;
  timestamp: number;
  impact: EventImpact;
  forecast?: number;
  previous?: number;
  actual?: number;
  unit?: string;
  relatedAssets: string[]; // Asset symbols affected
}

// News
export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  timestamp: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  relatedAssets: string[]; // Asset symbols mentioned
  imageUrl?: string;
}

// Alerts
export type AlertType = 'signal' | 'price' | 'event' | 'news';

export interface Alert {
  id: string;
  type: AlertType;
  assetId: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
}

export interface PriceAlert {
  id: string;
  assetId: string;
  triggerPrice: number;
  triggerType: 'above' | 'below';
  enabled: boolean;
  createdAt: number;
}

// Watchlist
export interface WatchlistItem {
  assetId: string;
  addedAt: number;
  group?: string;
}

export interface Watchlist {
  items: WatchlistItem[];
  groups: string[];
}

// User Settings
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  signalAlertsEnabled: boolean;
  eventAlertsEnabled: boolean;
  priceAlertsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  mpsSensitivity: 'conservative' | 'moderate' | 'aggressive';
  dataUpdateFrequency: 1000 | 5000 | 10000 | 30000; // milliseconds
  defaultTimeFrame: TimeFrame;
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
