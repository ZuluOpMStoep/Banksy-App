import React, { useMemo } from 'react';
import { View, Text, ScrollView, FlatList } from 'react-native';
import { SignalHistoryEntry, SignalOutcome } from '@/lib/types/signal-history';

interface SignalHistoryChartProps {
  signals: SignalHistoryEntry[];
  maxItems?: number;
}

/**
 * Signal History Chart Component
 * Displays recent signals with their outcomes in a timeline format
 */
export function SignalHistoryChart({ signals, maxItems = 10 }: SignalHistoryChartProps) {
  const recentSignals = useMemo(() => {
    return signals.slice(0, maxItems);
  }, [signals, maxItems]);

  const getOutcomeColor = (outcome: SignalOutcome) => {
    switch (outcome) {
      case 'WIN':
        return 'bg-success';
      case 'LOSS':
        return 'bg-error';
      case 'BREAKEVEN':
        return 'bg-warning';
      case 'PENDING':
        return 'bg-primary';
      default:
        return 'bg-muted';
    }
  };

  const getOutcomeIcon = (outcome: SignalOutcome) => {
    switch (outcome) {
      case 'WIN':
        return '✓';
      case 'LOSS':
        return '✗';
      case 'BREAKEVEN':
        return '=';
      case 'PENDING':
        return '⏳';
      default:
        return '?';
    }
  };

  const getSignalDirection = (signal: string) => {
    return signal.includes('BUY') ? '↑' : '↓';
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (recentSignals.length === 0) {
    return (
      <View className="bg-surface rounded-xl p-4 border border-border items-center justify-center py-8">
        <Text className="text-muted text-sm">No signal history yet</Text>
      </View>
    );
  }

  return (
    <View className="bg-surface rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <View className="p-4 border-b border-border">
        <Text className="text-lg font-semibold text-foreground">Signal History</Text>
        <Text className="text-xs text-muted mt-1">Recent {recentSignals.length} signals</Text>
      </View>

      {/* Signal List */}
      <FlatList
        scrollEnabled={false}
        data={recentSignals}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View
            className={`flex-row items-center justify-between p-3 ${
              index !== recentSignals.length - 1 ? 'border-b border-border' : ''
            }`}
          >
            {/* Signal Direction & Type */}
            <View className="flex-1 flex-row items-center gap-2">
              <View className={`w-10 h-10 rounded-full ${getOutcomeColor(item.outcome)} items-center justify-center`}>
                <Text className="text-xs font-bold text-background">{getOutcomeIcon(item.outcome)}</Text>
              </View>

              <View className="flex-1">
                <View className="flex-row items-center gap-1">
                  <Text className="text-lg font-bold text-foreground">{getSignalDirection(item.signal)}</Text>
                  <Text className="text-sm font-semibold text-foreground">{item.signal}</Text>
                  <Text className="text-xs text-muted ml-1">({item.assetId.toUpperCase()})</Text>
                </View>
                <Text className="text-xs text-muted mt-0.5">{formatTime(item.entryTime)}</Text>
              </View>
            </View>

            {/* Entry Price & P&L */}
            <View className="items-end gap-1">
              <Text className="text-sm font-semibold text-foreground">${item.entryPrice.toFixed(2)}</Text>
              {item.profitLoss !== undefined && (
                <Text
                  className={`text-xs font-bold ${
                    item.profitLoss > 0 ? 'text-success' : item.profitLoss < 0 ? 'text-error' : 'text-muted'
                  }`}
                >
                  {item.profitLoss > 0 ? '+' : ''}
                  {item.profitLoss.toFixed(0)} pips
                </Text>
              )}
              {item.profitLossPercent !== undefined && (
                <Text
                  className={`text-xs ${
                    item.profitLossPercent > 0 ? 'text-success' : item.profitLossPercent < 0 ? 'text-error' : 'text-muted'
                  }`}
                >
                  {item.profitLossPercent > 0 ? '+' : ''}
                  {item.profitLossPercent.toFixed(2)}%
                </Text>
              )}
            </View>
          </View>
        )}
      />

      {/* Summary Stats */}
      <View className="bg-background/50 p-3 border-t border-border flex-row justify-around">
        <View className="items-center">
          <Text className="text-xs text-muted">Total</Text>
          <Text className="text-sm font-bold text-foreground">{recentSignals.length}</Text>
        </View>
        <View className="items-center">
          <Text className="text-xs text-muted">Win Rate</Text>
          <Text className="text-sm font-bold text-success">
            {recentSignals.length > 0
              ? Math.round(
                  (recentSignals.filter((s) => s.outcome === 'WIN').length / recentSignals.length) * 100
                )
              : 0}
            %
          </Text>
        </View>
        <View className="items-center">
          <Text className="text-xs text-muted">Avg P&L</Text>
          <Text
            className={`text-sm font-bold ${
              recentSignals.length > 0 &&
              recentSignals.reduce((sum, s) => sum + (s.profitLoss ?? 0), 0) / recentSignals.length > 0
                ? 'text-success'
                : 'text-error'
            }`}
          >
            {recentSignals.length > 0
              ? (recentSignals.reduce((sum, s) => sum + (s.profitLoss ?? 0), 0) / recentSignals.length).toFixed(0)
              : 0}{' '}
            pips
          </Text>
        </View>
      </View>
    </View>
  );
}
