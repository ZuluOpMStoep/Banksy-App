/**
 * Backtesting Dashboard UI Components
 * 
 * Reusable components for displaying backtest results and metrics
 */

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { TradeMetrics, PerformanceByAsset, PerformanceByStrategy } from '@/lib/types/backtesting';

// ============================================================================
// METRIC CARD COMPONENTS
// ============================================================================

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
}

export function MetricCard({
  label,
  value,
  unit = '',
  color,
  trend,
  icon,
}: MetricCardProps) {
  const colors = useColors();

  let trendIcon = '';
  let trendColor = colors.foreground;

  if (trend === 'up') {
    trendIcon = '↑';
    trendColor = '#00D084';
  } else if (trend === 'down') {
    trendIcon = '↓';
    trendColor = '#FF0000';
  }

  return (
    <View className="bg-surface rounded-lg p-4 gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-muted">{label}</Text>
        {icon && <Text className="text-lg">{icon}</Text>}
      </View>

      <View className="flex-row items-baseline gap-1">
        <Text
          className="text-2xl font-bold"
          style={{ color: color || colors.foreground }}
        >
          {value}
        </Text>
        {unit && <Text className="text-sm text-muted">{unit}</Text>}
      </View>

      {trend && (
        <Text style={{ color: trendColor }} className="text-xs font-semibold">
          {trendIcon} {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
        </Text>
      )}
    </View>
  );
}

// ============================================================================
// METRICS GRID
// ============================================================================

interface MetricsGridProps {
  metrics: TradeMetrics;
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  const colors = useColors();

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 70) return '#00D084';
    if (winRate >= 60) return '#FFB700';
    return '#FF0000';
  };

  const getProfitFactorColor = (pf: number) => {
    if (pf >= 2.0) return '#00D084';
    if (pf >= 1.5) return '#FFB700';
    return '#FF0000';
  };

  const getSharpeRatioColor = (sr: number) => {
    if (sr >= 1.0) return '#00D084';
    if (sr >= 0.5) return '#FFB700';
    return '#FF0000';
  };

  return (
    <View className="gap-3">
      {/* Row 1: Win Rate, Profit Factor */}
      <View className="flex-row gap-3">
        <View className="flex-1">
          <MetricCard
            label="Win Rate"
            value={metrics.winRate.toFixed(1)}
            unit="%"
            color={getWinRateColor(metrics.winRate)}
            icon="📊"
          />
        </View>
        <View className="flex-1">
          <MetricCard
            label="Profit Factor"
            value={metrics.profitFactor.toFixed(2)}
            color={getProfitFactorColor(metrics.profitFactor)}
            icon="💰"
          />
        </View>
      </View>

      {/* Row 2: Sharpe Ratio, Max Drawdown */}
      <View className="flex-row gap-3">
        <View className="flex-1">
          <MetricCard
            label="Sharpe Ratio"
            value={metrics.sharpeRatio.toFixed(2)}
            color={getSharpeRatioColor(metrics.sharpeRatio)}
            icon="📈"
          />
        </View>
        <View className="flex-1">
          <MetricCard
            label="Max Drawdown"
            value={metrics.maxDrawdown.toFixed(1)}
            unit="%"
            color={metrics.maxDrawdown < 20 ? '#00D084' : '#FF6B35'}
            icon="📉"
          />
        </View>
      </View>

      {/* Row 3: Total Trades, Net Profit */}
      <View className="flex-row gap-3">
        <View className="flex-1">
          <MetricCard
            label="Total Trades"
            value={metrics.totalTrades}
            icon="🎯"
          />
        </View>
        <View className="flex-1">
          <MetricCard
            label="Net Profit"
            value={metrics.netProfit.toFixed(0)}
            unit="$"
            color={metrics.netProfit >= 0 ? '#00D084' : '#FF0000'}
            icon="💵"
          />
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// TRADE STATISTICS CARD
// ============================================================================

interface TradeStatsCardProps {
  metrics: TradeMetrics;
}

export function TradeStatsCard({ metrics }: TradeStatsCardProps) {
  const colors = useColors();

  return (
    <View className="bg-surface rounded-lg p-4 gap-3">
      <Text className="text-lg font-bold text-foreground">Trade Statistics</Text>

      <View className="gap-2">
        <StatRow
          label="Winning Trades"
          value={metrics.winningTrades}
          total={metrics.totalTrades}
          color="#00D084"
        />
        <StatRow
          label="Losing Trades"
          value={metrics.losingTrades}
          total={metrics.totalTrades}
          color="#FF0000"
        />
        <StatRow
          label="Break Even"
          value={metrics.breakEvenTrades}
          total={metrics.totalTrades}
          color="#FFB700"
        />
      </View>

      <View className="border-t border-border pt-3 gap-2">
        <MetricRowSmall
          label="Average Win"
          value={`$${metrics.averageWin.toFixed(2)}`}
        />
        <MetricRowSmall
          label="Average Loss"
          value={`$${metrics.averageLoss.toFixed(2)}`}
        />
        <MetricRowSmall
          label="Win/Loss Ratio"
          value={metrics.winLossRatio.toFixed(2)}
        />
      </View>
    </View>
  );
}

interface StatRowProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

function StatRow({ label, value, total, color }: StatRowProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <View className="gap-1">
      <View className="flex-row justify-between">
        <Text className="text-sm text-muted">{label}</Text>
        <Text className="text-sm font-semibold text-foreground">
          {value} ({percentage.toFixed(1)}%)
        </Text>
      </View>
      <View className="h-2 bg-border rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

// ============================================================================
// RISK METRICS CARD
// ============================================================================

interface RiskMetricsCardProps {
  metrics: TradeMetrics;
}

export function RiskMetricsCard({ metrics }: RiskMetricsCardProps) {
  const colors = useColors();

  return (
    <View className="bg-surface rounded-lg p-4 gap-3">
      <Text className="text-lg font-bold text-foreground">Risk Analysis</Text>

      <View className="gap-2">
        <MetricRowSmall
          label="Max Drawdown"
          value={`${metrics.maxDrawdown.toFixed(1)}%`}
        />
        <MetricRowSmall
          label="Largest Win"
          value={`$${metrics.largestWin.toFixed(2)}`}
        />
        <MetricRowSmall
          label="Largest Loss"
          value={`$${metrics.largestLoss.toFixed(2)}`}
        />
        <MetricRowSmall
          label="Consecutive Wins"
          value={metrics.consecutiveWins.toString()}
        />
        <MetricRowSmall
          label="Consecutive Losses"
          value={metrics.consecutiveLosses.toString()}
        />
      </View>
    </View>
  );
}

// ============================================================================
// RETURN METRICS CARD
// ============================================================================

interface ReturnMetricsCardProps {
  metrics: TradeMetrics;
}

export function ReturnMetricsCard({ metrics }: ReturnMetricsCardProps) {
  const colors = useColors();

  return (
    <View className="bg-surface rounded-lg p-4 gap-3">
      <Text className="text-lg font-bold text-foreground">Returns</Text>

      <View className="gap-2">
        <MetricRowSmall
          label="Total Return"
          value={`${metrics.totalReturn.toFixed(2)}%`}
        />
        <MetricRowSmall
          label="Annualized Return"
          value={`${metrics.annualizedReturn.toFixed(2)}%`}
        />
        <MetricRowSmall
          label="Monthly Return"
          value={`${metrics.monthlyReturn.toFixed(2)}%`}
        />
        <MetricRowSmall
          label="Sharpe Ratio"
          value={metrics.sharpeRatio.toFixed(2)}
        />
        <MetricRowSmall
          label="Sortino Ratio"
          value={metrics.sortinoRatio.toFixed(2)}
        />
        <MetricRowSmall
          label="Calmar Ratio"
          value={metrics.calmarRatio.toFixed(2)}
        />
      </View>
    </View>
  );
}

// ============================================================================
// PERFORMANCE BY ASSET
// ============================================================================

interface PerformanceByAssetCardProps {
  performance: PerformanceByAsset[];
}

export function PerformanceByAssetCard({ performance }: PerformanceByAssetCardProps) {
  const colors = useColors();

  if (performance.length === 0) {
    return (
      <View className="bg-surface rounded-lg p-4">
        <Text className="text-foreground">No asset performance data</Text>
      </View>
    );
  }

  return (
    <View className="bg-surface rounded-lg p-4 gap-3">
      <Text className="text-lg font-bold text-foreground">Performance by Asset</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
        {performance.map((asset) => (
          <View
            key={asset.assetSymbol}
            className="bg-border rounded-lg p-3 min-w-[150px] gap-2"
          >
            <Text className="font-semibold text-foreground text-sm">{asset.assetSymbol}</Text>
            <View className="gap-1">
              <MetricRowSmall
                label="Win Rate"
                value={`${asset.metrics.winRate.toFixed(0)}%`}
              />
              <MetricRowSmall
                label="Trades"
                value={asset.sampleSize.toString()}
              />
              <MetricRowSmall
                label="Profit"
                value={`$${asset.metrics.netProfit.toFixed(0)}`}
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// PERFORMANCE BY STRATEGY
// ============================================================================

interface PerformanceByStrategyCardProps {
  performance: PerformanceByStrategy[];
}

export function PerformanceByStrategyCard({ performance }: PerformanceByStrategyCardProps) {
  const colors = useColors();

  if (performance.length === 0) {
    return (
      <View className="bg-surface rounded-lg p-4">
        <Text className="text-foreground">No strategy performance data</Text>
      </View>
    );
  }

  return (
    <View className="bg-surface rounded-lg p-4 gap-3">
      <Text className="text-lg font-bold text-foreground">Performance by Strategy</Text>

      <View className="gap-2">
        {performance.map((strategy) => (
          <View key={strategy.strategy} className="bg-border rounded-lg p-3 gap-2">
            <View className="flex-row justify-between items-center">
              <Text className="font-semibold text-foreground">{strategy.strategy}</Text>
              <View className="flex-row gap-2">
                <View className="bg-background rounded px-2 py-1">
                  <Text className="text-xs font-semibold text-foreground">
                    {strategy.sampleSize} trades
                  </Text>
                </View>
              </View>
            </View>

            <View className="gap-1">
              <MetricRowSmall
                label="Win Rate"
                value={`${strategy.metrics.winRate.toFixed(0)}%`}
              />
              <MetricRowSmall
                label="Profit Factor"
                value={strategy.metrics.profitFactor.toFixed(2)}
              />
              <MetricRowSmall
                label="Avg Win"
                value={`$${strategy.metrics.averageWin.toFixed(2)}`}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface MetricRowSmallProps {
  label: string;
  value: string | number;
}

function MetricRowSmall({ label, value }: MetricRowSmallProps) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-xs text-muted">{label}</Text>
      <Text className="text-xs font-semibold text-foreground">{value}</Text>
    </View>
  );
}

// ============================================================================
// EQUITY CURVE CHART
// ============================================================================

interface EquityCurveChartProps {
  data: Array<{ timestamp: number; balance: number }>;
  initialBalance: number;
}

export function EquityCurveChart({ data, initialBalance }: EquityCurveChartProps) {
  const colors = useColors();

  if (data.length === 0) {
    return (
      <View className="bg-surface rounded-lg p-4 h-40 items-center justify-center">
        <Text className="text-muted">No equity curve data</Text>
      </View>
    );
  }

  const maxBalance = Math.max(...data.map((d) => d.balance));
  const minBalance = Math.min(...data.map((d) => d.balance));
  const range = maxBalance - minBalance;

  return (
    <View className="bg-surface rounded-lg p-4 gap-2">
      <Text className="text-lg font-bold text-foreground">Equity Curve</Text>

      <View className="h-40 bg-border rounded-lg p-2 flex-row items-flex-end gap-1">
        {data.map((point, index) => {
          const height = range > 0 ? ((point.balance - minBalance) / range) * 100 : 50;
          const isProfit = point.balance >= initialBalance;

          return (
            <View
              key={index}
              className="flex-1 rounded-t"
              style={{
                height: `${Math.max(height, 5)}%`,
                backgroundColor: isProfit ? '#00D084' : '#FF6B35',
              }}
            />
          );
        })}
      </View>

      <View className="flex-row justify-between">
        <Text className="text-xs text-muted">Initial: ${initialBalance.toFixed(0)}</Text>
        <Text className="text-xs text-muted">Final: ${data[data.length - 1].balance.toFixed(0)}</Text>
      </View>
    </View>
  );
}

// ============================================================================
// PERFORMANCE SUMMARY
// ============================================================================

interface PerformanceSummaryProps {
  metrics: TradeMetrics;
  duration: number; // milliseconds
}

export function PerformanceSummary({ metrics, duration }: PerformanceSummaryProps) {
  const colors = useColors();
  const durationDays = duration / (1000 * 60 * 60 * 24);

  return (
    <View className="bg-surface rounded-lg p-4 gap-3">
      <Text className="text-lg font-bold text-foreground">Summary</Text>

      <View className="gap-2">
        <MetricRowSmall
          label="Test Duration"
          value={`${durationDays.toFixed(0)} days`}
        />
        <MetricRowSmall
          label="Total Trades"
          value={metrics.totalTrades}
        />
        <MetricRowSmall
          label="Win Rate"
          value={`${metrics.winRate.toFixed(1)}%`}
        />
        <MetricRowSmall
          label="Profit Factor"
          value={metrics.profitFactor.toFixed(2)}
        />
        <MetricRowSmall
          label="Expectancy"
          value={`$${metrics.expectancyPerTrade.toFixed(2)}`}
        />
      </View>
    </View>
  );
}
