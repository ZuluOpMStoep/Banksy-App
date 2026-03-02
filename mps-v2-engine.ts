/**
 * Supported Trading Assets
 * Gold, Silver, Bitcoin, Forex Pairs, and DAX
 */

import { Asset } from '@/lib/types/trading';

export const TRADING_ASSETS: Asset[] = [
  // Commodities
  {
    id: 'gold',
    symbol: 'XAU/USD',
    name: 'Gold',
    type: 'commodity',
    displayName: 'Gold (XAU/USD)',
    description: 'Gold spot price in US Dollars',
  },
  {
    id: 'silver',
    symbol: 'XAG/USD',
    name: 'Silver',
    type: 'commodity',
    displayName: 'Silver (XAG/USD)',
    description: 'Silver spot price in US Dollars',
  },

  // Cryptocurrency
  {
    id: 'bitcoin',
    symbol: 'BTC/USD',
    name: 'Bitcoin',
    type: 'crypto',
    displayName: 'Bitcoin (BTC/USD)',
    description: 'Bitcoin price in US Dollars',
  },

  // Forex Pairs (Top 4)
  {
    id: 'eur_usd',
    symbol: 'EUR/USD',
    name: 'Euro / US Dollar',
    type: 'forex',
    displayName: 'EUR/USD',
    description: 'Euro to US Dollar exchange rate',
  },
  {
    id: 'gbp_usd',
    symbol: 'GBP/USD',
    name: 'British Pound / US Dollar',
    type: 'forex',
    displayName: 'GBP/USD',
    description: 'British Pound to US Dollar exchange rate',
  },
  {
    id: 'usd_jpy',
    symbol: 'USD/JPY',
    name: 'US Dollar / Japanese Yen',
    type: 'forex',
    displayName: 'USD/JPY',
    description: 'US Dollar to Japanese Yen exchange rate',
  },
  {
    id: 'aud_usd',
    symbol: 'AUD/USD',
    name: 'Australian Dollar / US Dollar',
    type: 'forex',
    displayName: 'AUD/USD',
    description: 'Australian Dollar to US Dollar exchange rate',
  },

  // Index
  {
    id: 'dax',
    symbol: 'DAX',
    name: 'DAX Index',
    type: 'index',
    displayName: 'DAX (GER40)',
    description: 'German Stock Index (DAX)',
  },
];

// Asset ID to Symbol mapping for quick lookup
export const ASSET_SYMBOL_MAP: Record<string, string> = {
  gold: 'XAU/USD',
  silver: 'XAG/USD',
  bitcoin: 'BTC/USD',
  eur_usd: 'EUR/USD',
  gbp_usd: 'GBP/USD',
  usd_jpy: 'USD/JPY',
  aud_usd: 'AUD/USD',
  dax: 'DAX',
};

// Symbol to Asset ID mapping
export const SYMBOL_ASSET_MAP: Record<string, string> = {
  'XAU/USD': 'gold',
  'XAG/USD': 'silver',
  'BTC/USD': 'bitcoin',
  'EUR/USD': 'eur_usd',
  'GBP/USD': 'gbp_usd',
  'USD/JPY': 'usd_jpy',
  'AUD/USD': 'aud_usd',
  DAX: 'dax',
  'GER40': 'dax',
};

// Get asset by ID
export function getAssetById(id: string): Asset | undefined {
  return TRADING_ASSETS.find((asset) => asset.id === id);
}

// Get asset by symbol
export function getAssetBySymbol(symbol: string): Asset | undefined {
  return TRADING_ASSETS.find((asset) => asset.symbol === symbol);
}

// Get all assets of a specific type
export function getAssetsByType(type: 'forex' | 'crypto' | 'commodity' | 'index'): Asset[] {
  return TRADING_ASSETS.filter((asset) => asset.type === type);
}

// Default watchlist assets
export const DEFAULT_WATCHLIST = ['gold', 'bitcoin', 'eur_usd', 'dax'];
