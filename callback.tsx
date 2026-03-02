import { useEffect, useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { SignalHistoryService } from '@/lib/services/signal-history-service';
import { SignalHistoryEntry, SignalHistoryStats } from '@/lib/types/signal-history';

export default function SignalHistoryScreen() {
  const [signals, setSignals] = useState<SignalHistoryEntry[]>([]);
  const [stats, setStats] = useState<SignalHistoryStats | null>(null);
  const [filter, setFilter] = useState<'all' | 'wins' | 'losses' | 'pending'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSignalHistory();
    const interval = setInterval(loadSignalHistory, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, [filter]);

  const loadSignalHistory = async () => {
    setLoading(true);
    try {
      let filtered = await SignalHistoryService.getSignals(
        filter !== 'all' ? { outcome: filter === 'wins' ? 'WIN' : filter === 'losses' ? 'LOSS' : 'PENDING' } : undefined,
        { sortBy: 'entryTime', order: 'desc' }
      );
      setSignals(filtered);

      const calculatedStats = await SignalHistoryService.calculateStats();
      setStats(calculatedStats);
    } catch (error) {
      console.error('Error loading signal history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSignalColor = (signal: string) => {
    if (signal.includes('BUY')) return 'text-success';
    if (signal.includes('SELL')) return 'text-error';
    return 'text-warning';
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'WIN':
        return 'bg-success/10 border-success';
      case 'LOSS':
        return 'bg-error/10 border-error';
      case 'BREAKEVEN':
        return 'bg-warning/10 border-warning';
      case 'PENDING':
        return 'bg-primary/10 border-primary';
      default:
        return 'bg-muted/10 border-muted';
    }
  };

  const getOutcomeTextColor = (outcome: string) => {
    switch (outcome) {
      case 'WIN':
        return 'text-success';
      case 'LOSS':
        return 'text-error';
      case 'BREAKEVEN':
        return 'text-warning';
      case 'PENDING':
        return 'text-primary';
      default:
        return 'text-muted';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatPrice = (price: number) => {
    return price > 100 ? price.toFixed(2) : price.toFixed(4);
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="mb-4">
          <Text className="text-3xl font-bold text-foreground mb-1">Signal History</Text>
          <Text className="text-sm text-muted">Track all generated signals and their performance</Text>
        </View>

        {/* Statistics Summary */}
        {stats && (
          <View className="bg-surface rounded-lg p-4 mb-4 border border-border">
            <Text className="text-sm font-bold text-muted mb-3">PERFORMANCE SUMMARY</Text>
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-xs text-muted">Total Signals:</Text>
                <Text className="text-xs font-bold text-foreground">{stats.totalSignals}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-muted">Win Rate:</Text>
                <Text className={`text-xs font-bold ${stats.winRate >= 50 ? 'text-success' : 'text-error'}`}>
                  {stats.winRate.toFixed(1)}%
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-muted">Net Profit:</Text>
                <Text className={`text-xs font-bold ${stats.netProfit >= 0 ? 'text-success' : 'text-error'}`}>
                  {stats.netProfit >= 0 ? '+' : ''}{stats.netProfit.toFixed(2)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-muted">Profit Factor:</Text>
                <Text className="text-xs font-bold text-foreground">
                  {stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-muted">Avg Risk/Reward:</Text>
                <Text className="text-xs font-bold text-foreground">{stats.averageRiskReward.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Filter Buttons */}
        <View className="flex-row gap-2 mb-4">
          {(['all', 'wins', 'losses', 'pending'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              className={`flex-1 py-2 px-3 rounded-lg border ${
                filter === f ? 'bg-primary border-primary' : 'bg-background border-border'
              }`}
            >
              <Text className={`text-xs font-bold text-center ${filter === f ? 'text-background' : 'text-foreground'}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Signal List */}
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-sm text-muted">Loading signals...</Text>
          </View>
        ) : signals.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-sm text-muted">No signals found</Text>
          </View>
        ) : (
          <FlatList
            data={signals}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View className="bg-surface rounded-lg p-3 mb-2 border border-border">
                {/* Header Row */}
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className={`text-sm font-bold ${getSignalColor(item.signal)}`}>{item.signal}</Text>
                      <Text className="text-xs text-muted">{item.assetId.toUpperCase()}</Text>
                      <Text className="text-xs text-muted/50">{item.timeFrame}</Text>
                    </View>
                    <Text className="text-xs text-muted mt-1">{formatTime(item.entryTime)}</Text>
                  </View>
                  <View className={`px-2 py-1 rounded border ${getOutcomeColor(item.outcome)}`}>
                    <Text className={`text-xs font-bold ${getOutcomeTextColor(item.outcome)}`}>{item.outcome}</Text>
                  </View>
                </View>

                {/* Price Info */}
                <View className="gap-1 mb-2 bg-background rounded p-2">
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-muted">Entry:</Text>
                    <Text className="text-xs font-semibold text-foreground">{formatPrice(item.entryPrice)}</Text>
                  </View>
                  {item.exitPrice && (
                    <View className="flex-row justify-between">
                      <Text className="text-xs text-muted">Exit:</Text>
                      <Text className="text-xs font-semibold text-foreground">{formatPrice(item.exitPrice)}</Text>
                    </View>
                  )}
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-muted">SL:</Text>
                    <Text className="text-xs font-semibold text-error">{formatPrice(item.stopLoss)}</Text>
                  </View>
                </View>

                {/* Performance */}
                {item.profitLoss !== undefined && (
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-muted">P/L:</Text>
                    <Text className={`text-xs font-bold ${item.profitLoss >= 0 ? 'text-success' : 'text-error'}`}>
                      {item.profitLoss >= 0 ? '+' : ''}{item.profitLoss.toFixed(2)} ({item.profitLossPercent?.toFixed(1)}%)
                    </Text>
                  </View>
                )}

                {/* Confidence & Accuracy */}
                <View className="flex-row justify-between mt-2 pt-2 border-t border-border">
                  <View className="flex-1">
                    <Text className="text-xs text-muted">Confidence: {item.entryConfidence.toFixed(0)}%</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-muted">Accuracy: {item.predictedAccuracy.toFixed(0)}%</Text>
                  </View>
                </View>
              </View>
            )}
          />
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
