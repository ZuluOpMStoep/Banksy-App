# TradingView Integration Guide

## Overview

Banksy integrates with TradingView's Advanced Charts and Lightweight Charts libraries to provide professional-grade market visualization with real-time data synchronization.

## Architecture

### Datafeed Module (`lib/services/tradingview-datafeed.ts`)

The datafeed module implements TradingView's `IExternalDatafeed` interface, connecting Banksy's market data sources to the charting engine.

**Key Components:**

1. **Symbol Mapping** - Maps Banksy assets to TradingView symbols
   - Gold (XAU/USD) → XAUUSD
   - Silver (XAG/USD) → XAGUSD
   - Bitcoin (BTC/USD) → BTCUSD
   - EUR/USD → EURUSD
   - GBP/USD → GBPUSD
   - USD/JPY → USDJPY
   - AUD/USD → AUDUSD
   - DAX → DAX

2. **SymbolInfo** - Provides metadata for each symbol
   - Exchange information
   - Session times
   - Price precision
   - Supported resolutions
   - Data status

3. **Resolution Conversion** - Maps between TradingView and market data resolutions
   - '1' → '1m' (1 minute)
   - '5' → '5m' (5 minutes)
   - '15' → '15m' (15 minutes)
   - '60' → '1h' (1 hour)
   - '240' → '4h' (4 hours)
   - '1D' → '1d' (1 day)
   - '1W' → '1w' (1 week)

### Data Flow

```
Market Data Sources (CoinGecko, Polygon)
         ↓
Market Data Service (market-data-service.ts)
         ↓
TradingView Datafeed (tradingview-datafeed.ts)
         ↓
Advanced Charts / Lightweight Charts
         ↓
Banksy UI
```

## API Methods

### `onReady(callback)`
Called when the datafeed is ready. Returns configuration with supported resolutions and exchanges.

```typescript
TradingViewDatafeed.onReady((config) => {
  console.log('Supported resolutions:', config.supported_resolutions);
});
```

### `resolveSymbol(symbolName, callback)`
Resolves symbol information for TradingView.

```typescript
TradingViewDatafeed.resolveSymbol('XAUUSD', (symbolInfo) => {
  console.log('Symbol info:', symbolInfo);
});
```

### `getBars(symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback)`
Fetches historical bar data for a symbol.

```typescript
TradingViewDatafeed.getBars(
  symbolInfo,
  '60',
  { from: 1609459200, to: 1640995200, countBack: 500 },
  (bars, meta) => {
    console.log('Bars:', bars);
  },
  (error) => {
    console.error('Error:', error);
  }
);
```

### `subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscriptionUID, onResetCacheNeededCallback)`
Subscribes to real-time bar updates.

```typescript
const unsubscribe = TradingViewDatafeed.subscribeBars(
  symbolInfo,
  '60',
  (bar) => {
    console.log('New bar:', bar);
  },
  'subscription-1'
);

// Later: unsubscribe();
```

### `getServerTime(callback)`
Returns current server time in Unix seconds.

```typescript
TradingViewDatafeed.getServerTime((time) => {
  console.log('Server time:', new Date(time * 1000));
});
```

## Integration with Advanced Charts

### Web Platform

For web, use TradingView's Advanced Charts widget directly:

```typescript
import { AdvancedChart } from '@/components/advanced-chart';

export function ChartScreen() {
  return (
    <AdvancedChart
      symbol="XAUUSD"
      mpsSignal={mpsSignal}
      height={500}
      showMPS={true}
    />
  );
}
```

### Mobile Platform

For native mobile, use Lightweight Charts with WebView:

```typescript
import { TradingChart } from '@/components/trading-chart';

export function ChartScreen() {
  return (
    <TradingChart
      candles={historicalCandles}
      mpsSignal={mpsSignal}
      assetSymbol="XAUUSD"
    />
  );
}
```

## Real-Time Data Updates

The datafeed automatically subscribes to price updates through the market data service:

1. **Polling** (Default) - Updates every 5 seconds
2. **WebSocket** (Optional) - For faster updates

```typescript
// Subscribe to real-time updates
const unsubscribe = subscribeToUpdates('XAUUSD', (bar) => {
  console.log('Price updated:', bar.close);
});

// Unsubscribe when done
unsubscribe();
```

## MPS Indicator Integration

The MPS indicator is overlaid on the chart to provide trading signals:

- **Green** - Buy signal (STRONG_BUY or BUY)
- **Red** - Sell signal (STRONG_SELL or SELL)
- **Amber** - Hold signal (NEUTRAL)

Confidence score (0-100%) is displayed alongside the signal.

## Performance Optimization

1. **Data Caching** - Historical bars are cached to reduce API calls
2. **Resolution Optimization** - Lower resolutions for longer timeframes
3. **Update Throttling** - Real-time updates are throttled to prevent excessive re-renders
4. **Lazy Loading** - Charts load only when visible

## Error Handling

All datafeed methods include error handling:

```typescript
try {
  const bars = await getBars(symbol, resolution, from, to);
} catch (error) {
  console.error('Failed to fetch bars:', error);
  // Fallback to cached data or empty chart
}
```

## Supported Symbols

| Symbol | Asset | Type | Exchange |
|--------|-------|------|----------|
| XAUUSD | Gold | Commodity | FOREX |
| XAGUSD | Silver | Commodity | FOREX |
| BTCUSD | Bitcoin | Crypto | CRYPTO |
| EURUSD | EUR/USD | Forex | FOREX |
| GBPUSD | GBP/USD | Forex | FOREX |
| USDJPY | USD/JPY | Forex | FOREX |
| AUDUSD | AUD/USD | Forex | FOREX |
| DAX | DAX Index | Index | XETRA |

## Troubleshooting

### Chart not loading
- Check browser console for errors
- Verify symbol is in SYMBOL_MAP
- Ensure market data service is connected

### No real-time updates
- Check subscription is active
- Verify market data service is returning prices
- Check update interval setting

### Incorrect data
- Verify resolution conversion is correct
- Check timestamp formatting (should be Unix seconds)
- Ensure price precision matches symbol pricescale

## Future Enhancements

1. **WebSocket Integration** - Real-time data streaming instead of polling
2. **Drawing Tools** - Enable drawing on charts
3. **Advanced Indicators** - Custom indicator library
4. **Multi-Chart Layout** - Compare multiple assets
5. **Chart Saving** - Save chart layouts and indicators
