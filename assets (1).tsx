/**
 * Trade Journal Screen
 * Displays user's logged trades and performance metrics
 * Compares predicted vs actual accuracy
 */

import { ScrollView, Text, View, Pressable, FlatList, Modal, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { TradeJournalService } from '@/lib/services/trade-journal-service';
import { TradeEntry, TradeStats } from '@/lib/types/trade-journal';
import { useColors } from '@/hooks/use-colors';

export default function TradeJournalScreen() {
  const colors = useColors();
  const [trades, setTrades] = useState<TradeEntry[]>([]);
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewTradeModal, setShowNewTradeModal] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<TradeEntry | null>(null);

  // Form state for new trade
  const [formData, setFormData] = useState({
    asset: 'GOLD',
    signalType: 'BUY' as 'BUY' | 'SELL',
    entryPrice: '',
    predictedConfidence: '80',
    predictedAccuracy: '85',
  });

  useEffect(() => {
    loadTrades();
  }, []);

  const loadTrades = async () => {
    setLoading(true);
    try {
      const allTrades = await TradeJournalService.getAllTrades();
      const calculatedStats = await TradeJournalService.calculateStats(allTrades);
      setTrades(allTrades);
      setStats(calculatedStats);
    } catch (error) {
      console.error('Error loading trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrade = async () => {
    if (!formData.asset || !formData.entryPrice) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const entryPrice = parseFloat(formData.entryPrice);
      const riskAmount = entryPrice * 0.02; // 2% risk

      await TradeJournalService.createTrade({
        userId: 'user_1', // TODO: Get from auth
        asset: formData.asset,
        signalType: formData.signalType,
        entryPrice,
        entryTime: Date.now(),
        entryTimeframe: '1H',
        predictedTP1: entryPrice * (formData.signalType === 'BUY' ? 1.01 : 0.99),
        predictedTP2: entryPrice * (formData.signalType === 'BUY' ? 1.02 : 0.98),
        predictedTP3: entryPrice * (formData.signalType === 'BUY' ? 1.03 : 0.97),
        predictedSL: entryPrice * (formData.signalType === 'BUY' ? 0.98 : 1.02),
        predictedConfidence: parseInt(formData.predictedConfidence),
        predictedAccuracy: parseInt(formData.predictedAccuracy),
        riskAmount,
        rewardAmount1: riskAmount * 1,
        rewardAmount2: riskAmount * 2,
        rewardAmount3: riskAmount * 3,
        status: 'open',
        outcome: 'pending',
      });

      setFormData({
        asset: 'GOLD',
        signalType: 'BUY',
        entryPrice: '',
        predictedConfidence: '80',
        predictedAccuracy: '85',
      });
      setShowNewTradeModal(false);
      await loadTrades();
    } catch (error) {
      alert('Error creating trade');
      console.error(error);
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'win':
        return colors.success;
      case 'loss':
        return colors.error;
      case 'breakeven':
        return colors.warning;
      default:
        return colors.muted;
    }
  };

  const renderTradeItem = ({ item }: { item: TradeEntry }) => (
    <Pressable
      onPress={() => setSelectedTrade(item)}
      className="bg-surface rounded-lg p-4 mb-3 border border-border"
    >
      <View className="flex-row justify-between items-start mb-2">
        <View>
          <Text className="text-lg font-bold text-foreground">
            {item.asset} {item.signalType}
          </Text>
          <Text className="text-xs text-muted mt-1">
            Entry: ${item.entryPrice.toFixed(2)}
          </Text>
        </View>
        <View className="items-end">
          <Text
            className="text-sm font-bold px-3 py-1 rounded-full"
            style={{ color: getOutcomeColor(item.outcome) }}
          >
            {item.outcome.toUpperCase()}
          </Text>
          {item.actualPnL !== undefined && (
            <Text
              className="text-sm font-semibold mt-1"
              style={{ color: item.actualPnL >= 0 ? colors.success : colors.error }}
            >
              {item.actualPnL >= 0 ? '+' : ''}{item.actualPnLPercent?.toFixed(2)}%
            </Text>
          )}
        </View>
      </View>

      <View className="flex-row gap-2 mt-2">
        <View className="flex-1">
          <Text className="text-xs text-muted">Predicted</Text>
          <Text className="text-sm font-semibold text-foreground">
            {item.predictedAccuracy}%
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-muted">Confidence</Text>
          <Text className="text-sm font-semibold text-foreground">
            {item.predictedConfidence}%
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-muted">Status</Text>
          <Text className="text-sm font-semibold text-foreground capitalize">
            {item.status}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-foreground">Loading trades...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="p-6 gap-6">
          {/* Header */}
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-3xl font-bold text-foreground">
                Trade Journal
              </Text>
              <Text className="text-sm text-muted mt-1">
                Track your trades and accuracy
              </Text>
            </View>
            <Pressable
              onPress={() => setShowNewTradeModal(true)}
              className="bg-primary px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-bold">+ Trade</Text>
            </Pressable>
          </View>

          {/* Stats Summary */}
          {stats && stats.totalTrades > 0 && (
            <View className="bg-surface rounded-lg p-4 border border-border gap-3">
              <Text className="text-lg font-bold text-foreground">Performance</Text>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-xs text-muted">Win Rate</Text>
                  <Text className="text-2xl font-bold text-success">
                    {stats.winRate.toFixed(1)}%
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-muted">Total Trades</Text>
                  <Text className="text-2xl font-bold text-foreground">
                    {stats.totalTrades}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-muted">Profit Factor</Text>
                  <Text className="text-2xl font-bold text-foreground">
                    {stats.profitFactor.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Accuracy Comparison */}
              <View className="mt-3 pt-3 border-t border-border">
                <Text className="text-xs text-muted mb-2">Accuracy Comparison</Text>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-xs text-muted">Predicted</Text>
                    <Text className="text-lg font-bold text-foreground">
                      {stats.predictedAccuracy.toFixed(1)}%
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-muted">Actual</Text>
                    <Text className="text-lg font-bold text-foreground">
                      {stats.actualAccuracy.toFixed(1)}%
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-muted">Difference</Text>
                    <Text
                      className="text-lg font-bold"
                      style={{
                        color:
                          stats.accuracyDifference >= 0
                            ? colors.success
                            : colors.error,
                      }}
                    >
                      {stats.accuracyDifference >= 0 ? '+' : ''}
                      {stats.accuracyDifference.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Trades List */}
          <View>
            <Text className="text-lg font-bold text-foreground mb-3">
              Recent Trades
            </Text>
            {trades.length === 0 ? (
              <View className="bg-surface rounded-lg p-6 items-center">
                <Text className="text-muted">No trades logged yet</Text>
                <Text className="text-xs text-muted mt-2">
                  Start by logging your first trade
                </Text>
              </View>
            ) : (
              <FlatList
                data={trades.slice().reverse()}
                renderItem={renderTradeItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            )}
          </View>
        </View>
      </ScrollView>

      {/* New Trade Modal */}
      <Modal
        visible={showNewTradeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewTradeModal(false)}
      >
        <ScreenContainer className="bg-background justify-end">
          <View className="bg-surface rounded-t-2xl p-6 gap-4">
            <Text className="text-2xl font-bold text-foreground">Log Trade</Text>

            {/* Asset Picker */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">
                Asset
              </Text>
              <View className="flex-row gap-2">
                {['GOLD', 'SILVER', 'BTC', 'ETH'].map((asset) => (
                  <Pressable
                    key={asset}
                    onPress={() =>
                      setFormData({ ...formData, asset })
                    }
                    className={`flex-1 py-2 rounded-lg items-center ${
                      formData.asset === asset
                        ? 'bg-primary'
                        : 'bg-background border border-border'
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        formData.asset === asset
                          ? 'text-white'
                          : 'text-foreground'
                      }`}
                    >
                      {asset}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Signal Type */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">
                Signal Type
              </Text>
              <View className="flex-row gap-2">
                {['BUY', 'SELL'].map((type) => (
                  <Pressable
                    key={type}
                    onPress={() =>
                      setFormData({
                        ...formData,
                        signalType: type as 'BUY' | 'SELL',
                      })
                    }
                    className={`flex-1 py-2 rounded-lg items-center ${
                      formData.signalType === type
                        ? 'bg-primary'
                        : 'bg-background border border-border'
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        formData.signalType === type
                          ? 'text-white'
                          : 'text-foreground'
                      }`}
                    >
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Entry Price */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">
                Entry Price
              </Text>
              <TextInput
                value={formData.entryPrice}
                onChangeText={(text) =>
                  setFormData({ ...formData, entryPrice: text })
                }
                placeholder="e.g., 2050.50"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                style={{
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  color: colors.foreground,
                  fontSize: 16,
                }}
              />
            </View>

            {/* Predicted Confidence */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">
                Predicted Confidence (%)
              </Text>
              <TextInput
                value={formData.predictedConfidence}
                onChangeText={(text) =>
                  setFormData({ ...formData, predictedConfidence: text })
                }
                placeholder="e.g., 80"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                style={{
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  color: colors.foreground,
                  fontSize: 16,
                }}
              />
            </View>

            {/* Predicted Accuracy */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">
                Predicted Accuracy (%)
              </Text>
              <TextInput
                value={formData.predictedAccuracy}
                onChangeText={(text) =>
                  setFormData({ ...formData, predictedAccuracy: text })
                }
                placeholder="e.g., 85"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                style={{
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  color: colors.foreground,
                  fontSize: 16,
                }}
              />
            </View>

            {/* Buttons */}
            <View className="flex-row gap-3 mt-4">
              <Pressable
                onPress={() => setShowNewTradeModal(false)}
                className="flex-1 bg-background border border-border rounded-lg py-3 items-center"
              >
                <Text className="text-foreground font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateTrade}
                className="flex-1 bg-primary rounded-lg py-3 items-center"
              >
                <Text className="text-white font-semibold">Log Trade</Text>
              </Pressable>
            </View>
          </View>
        </ScreenContainer>
      </Modal>
    </ScreenContainer>
  );
}
