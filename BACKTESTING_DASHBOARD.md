# Banksy Backtesting Dashboard

## Overview

The Backtesting Dashboard provides comprehensive historical analysis of MPS v3 trading signals, allowing traders to validate indicator accuracy, measure performance metrics, and optimize trading strategies.

## Features

### 1. **Historical Signal Replay**
- Replays all MPS v3 signals from the past 90 days
- Simulates trade execution with realistic slippage and commissions
- Tracks entry, exit, stop loss, and take profit levels
- Records all trade outcomes and statistics

### 2. **Performance Metrics**

#### Win/Loss Statistics
- **Total Trades**: Number of trades executed
- **Win Rate**: Percentage of profitable trades
- **Profit Factor**: Total profit / Total loss ratio
- **Average Win/Loss**: Mean profit/loss per trade
- **Win/Loss Ratio**: Average win / Average loss

#### Risk Metrics
- **Max Drawdown**: Largest peak-to-trough decline
- **Sharpe Ratio**: Risk-adjusted return (higher is better)
- **Sortino Ratio**: Downside risk-adjusted return
- **Calmar Ratio**: Return / Max Drawdown
- **Standard Deviation**: Volatility of returns

#### Return Metrics
- **Total Return**: Overall profit/loss percentage
- **Annualized Return**: Projected yearly return
- **Monthly Return**: Average monthly return
- **Net Profit**: Total profit in dollars
- **Expectancy**: Average profit per trade

### 3. **Performance Breakdown**

#### By Asset
- Separate metrics for each trading asset (Gold, Silver, Bitcoin, Forex, DAX)
- Win rate, profit factor, and sample size per asset
- Identify best and worst performing assets

#### By Entry Strategy
- Performance metrics for each strategy (Breakout, Pullback, Reversal, Continuation)
- Strategy-specific win rates and profit factors
- Optimize strategy selection

#### By Confidence Level
- Metrics grouped by signal confidence (90-100%, 80-90%, etc.)
- Validate confidence score accuracy
- Set minimum confidence thresholds

#### By Timeframe
- Performance across different timeframes (1h, 4h, 1d)
- Identify optimal timeframes
- Multi-timeframe alignment validation

### 4. **Equity Curve & Drawdown**
- Visual representation of account growth
- Drawdown tracking over time
- Identify peak and trough periods
- Assess recovery patterns

### 5. **Monthly Performance**
- Month-by-month breakdown of trades and profits
- Seasonal pattern analysis
- Monthly win rates and returns
- Identify profitable/unprofitable periods

### 6. **Trade Distribution**
- Trades by hour of day
- Trades by day of week
- Trade duration distribution
- Profit range distribution

## Usage

### Running a Backtest

```typescript
import { BacktestingEngine } from '@/lib/services/backtesting-engine';
import { BacktestConfig } from '@/lib/types/backtesting';

const config: BacktestConfig = {
  startDate: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
  endDate: Date.now(),
  assets: ['XAU/USD', 'BTC/USD', 'EUR/USD'],
  timeframes: ['1h', '4h', '1d'],
  initialBalance: 10000,
  riskPerTrade: 2, // 2% per trade
  maxDrawdown: 20, // 20% max drawdown
  minConfidence: 75, // Only signals with 75%+ confidence
  minTimeframeAlignment: 4, // Require 4+ timeframes aligned
  entryStrategies: ['Breakout', 'Pullback'],
  slippagePoints: 0.5,
  commissionPercent: 0.1,
  maxHoldingTime: 86400000 * 7, // 7 days
  useStopLoss: true,
  useTakeProfit: true,
  partialTakeProfits: true,
};

const engine = new BacktestingEngine(config);

const report = await engine.runBacktest(
  historicalSignals,
  historicalCandles,
  (progress) => {
    console.log(`Progress: ${progress.progress}%`);
  }
);

console.log(`Win Rate: ${report.overallMetrics.winRate.toFixed(1)}%`);
console.log(`Profit Factor: ${report.overallMetrics.profitFactor.toFixed(2)}`);
console.log(`Sharpe Ratio: ${report.overallMetrics.sharpeRatio.toFixed(2)}`);
```

### Analyzing Results

```typescript
import { PerformanceMetricsCalculator } from '@/lib/services/performance-metrics';

// Get performance by asset
const byAsset = PerformanceMetricsCalculator.calculateByAsset(
  report.trades,
  config.initialBalance
);

// Get performance by strategy
const byStrategy = PerformanceMetricsCalculator.calculateByStrategy(
  report.trades,
  config.initialBalance
);

// Find best/worst assets
const { best, worst } = PerformanceMetricsCalculator.calculateBestWorstAssets(
  report.trades
);

console.log(`Best Asset: ${best.symbol} (${best.winRate.toFixed(1)}% win rate)`);
console.log(`Worst Asset: ${worst.symbol} (${worst.winRate.toFixed(1)}% win rate)`);
```

### Comparing Backtests

```typescript
import { PerformanceComparison } from '@/lib/services/performance-metrics';

const comparison = PerformanceComparison.compare(
  report1.trades,
  report2.trades,
  initialBalance
);

console.log(`Winner: ${comparison.winner}`);
comparison.reasons.forEach((reason) => {
  console.log(`- ${reason}`);
});
```

## UI Components

### MetricCard
Displays a single metric with label, value, unit, and trend indicator.

```tsx
<MetricCard
  label="Win Rate"
  value={metrics.winRate.toFixed(1)}
  unit="%"
  color="#00D084"
  trend="up"
  icon="📊"
/>
```

### MetricsGrid
Displays a grid of key metrics (win rate, profit factor, Sharpe ratio, max drawdown).

```tsx
<MetricsGrid metrics={report.overallMetrics} />
```

### TradeStatsCard
Shows winning/losing/break-even trade counts and averages.

```tsx
<TradeStatsCard metrics={report.overallMetrics} />
```

### RiskMetricsCard
Displays risk-related metrics (max drawdown, largest win/loss, consecutive streaks).

```tsx
<RiskMetricsCard metrics={report.overallMetrics} />
```

### ReturnMetricsCard
Shows return metrics (total return, annualized return, Sharpe/Sortino/Calmar ratios).

```tsx
<ReturnMetricsCard metrics={report.overallMetrics} />
```

### PerformanceByAssetCard
Displays performance breakdown by trading asset.

```tsx
<PerformanceByAssetCard performance={report.performanceByAsset} />
```

### PerformanceByStrategyCard
Shows performance breakdown by entry strategy.

```tsx
<PerformanceByStrategyCard performance={report.performanceByStrategy} />
```

### EquityCurveChart
Visualizes account growth over time.

```tsx
<EquityCurveChart
  data={report.equityCurve}
  initialBalance={config.initialBalance}
/>
```

## Interpretation Guide

### Win Rate
- **70%+**: Excellent (very few false signals)
- **60-70%**: Good (acceptable accuracy)
- **50-60%**: Fair (needs improvement)
- **<50%**: Poor (more losses than wins)

### Profit Factor
- **2.0+**: Excellent (profits are 2x losses)
- **1.5-2.0**: Good (profits are 1.5-2x losses)
- **1.0-1.5**: Fair (profits barely exceed losses)
- **<1.0**: Loss-making (losses exceed profits)

### Sharpe Ratio
- **>1.0**: Excellent risk-adjusted returns
- **0.5-1.0**: Good risk-adjusted returns
- **0-0.5**: Acceptable risk-adjusted returns
- **<0**: Negative risk-adjusted returns

### Max Drawdown
- **<10%**: Excellent (minimal losses)
- **10-20%**: Good (manageable losses)
- **20-30%**: Fair (significant losses)
- **>30%**: Poor (severe losses)

### Expectancy
- Positive value: Strategy is profitable on average
- Negative value: Strategy loses money on average
- Larger absolute value: More consistent results

## Backtesting Limitations

1. **Historical Data Quality**: Accuracy depends on historical price data quality
2. **Slippage & Commissions**: Simulated values may differ from real trading
3. **Market Conditions**: Past performance doesn't guarantee future results
4. **Black Swan Events**: Extreme market moves may not be captured
5. **Execution Risk**: Real trading has additional risks (order rejection, partial fills)

## Best Practices

1. **Use Multiple Assets**: Test across different asset classes
2. **Test Multiple Timeframes**: Validate across 1h, 4h, 1d
3. **Vary Confidence Thresholds**: Find optimal minimum confidence
4. **Test Different Periods**: Include bull, bear, and sideways markets
5. **Compare Strategies**: Identify best-performing entry strategies
6. **Monitor Drawdown**: Ensure max drawdown is acceptable
7. **Check Expectancy**: Verify positive expectancy per trade
8. **Validate Sharpe Ratio**: Ensure risk-adjusted returns are good

## Future Enhancements

- [ ] Walk-forward analysis (out-of-sample testing)
- [ ] Monte Carlo simulation (randomized trade order)
- [ ] Sensitivity analysis (parameter optimization)
- [ ] Correlation analysis (asset relationships)
- [ ] Regime detection (market condition analysis)
- [ ] Machine learning optimization
- [ ] Real-time backtest updates
- [ ] Export reports to PDF/Excel
- [ ] Comparison with benchmark indices
- [ ] Risk of ruin calculation

## Support

For questions or issues with backtesting:
- Check historical data availability
- Verify configuration parameters
- Review trade execution logic
- Validate signal generation
- Contact support@banksy.app
