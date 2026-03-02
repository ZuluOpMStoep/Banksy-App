import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { TRADING_ASSETS } from '@/lib/constants/assets';
import { getMockAssetData } from '@/lib/services/mock-data';
import { ChartCandle, MPSSignalData, TimeFrame } from '@/lib/types/trading';

export default function AssetsScreen() {
  const [selectedAsset, setSelectedAsset] = useState(TRADING_ASSETS[0]);
  const [candles, setCandles] = useState<ChartCandle[]>([]);
  const [signal, setSignal] = useState<MPSSignalData | null>(null);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('1h');

  useEffect(() => {
    loadAssetData(selectedAsset.id);
  }, [selectedAsset]);

  const loadAssetData = (assetId: string) => {
    const data = getMockAssetData(assetId);
    setCandles(data.candles);
    setSignal(data.signal);
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'STRONG_BUY':
      case 'BUY':
        return 'bg-success';
      case 'STRONG_SELL':
      case 'SELL':
        return 'bg-error';
      default:
        return 'bg-warning';
    }
  };

  const getComponentColor = (value: number) => {
    return value > 0 ? 'text-success' : 'text-error';
  };

  // Web version - simple chart visualization
  if (Platform.OS === 'web') {
    return (
      <ScreenContainer className="p-4">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="gap-4">
            {/* Header */}
            <View className="mb-2">
              <Text className="text-3xl font-bold text-foreground">Asset Analysis</Text>
              <Text className="text-sm text-muted mt-1">Professional trading charts and signals</Text>
            </View>

            {/* Asset Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
              {TRADING_ASSETS.map((asset) => (
                <TouchableOpacity
                  key={asset.id}
                  onPress={() => setSelectedAsset(asset)}
                  className={`px-4 py-2 rounded-lg ${
                    selectedAsset.id === asset.id
                      ? 'bg-primary'
                      : 'bg-surface border border-border'
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      selectedAsset.id === asset.id
                        ? 'text-background'
                        : 'text-foreground'
                    }`}
                  >
                    {asset.symbol}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Chart Placeholder */}
            <View className="bg-surface rounded-xl p-6 border border-border h-64 justify-center items-center">
              <Text className="text-lg font-semibold text-foreground mb-2">
                {selectedAsset.displayName}
              </Text>
              <Text className="text-sm text-muted text-center">
                TradingView Lightweight Charts Integration
              </Text>
              <Text className="text-xs text-muted mt-4">
                Candlestick chart with MPS indicator overlay
              </Text>
              <Text className="text-xs text-muted mt-2">
                {candles.length} candles loaded
              </Text>
            </View>

            {/* MPS Signal Panel */}
            {signal && (
              <View className="bg-surface rounded-xl p-4 border border-border">
                <View className="flex-row justify-between items-start mb-4">
                  <View>
                    <Text className="text-lg font-semibold text-foreground">MPS Signal</Text>
                    <Text className="text-xs text-muted mt-1">Manus Pro Signal Analysis</Text>
                  </View>
                  <View className={`${getSignalColor(signal.signal)} px-4 py-2 rounded-lg`}>
                    <Text className="text-sm font-bold text-background">{signal.signal}</Text>
                  </View>
                </View>

                {/* Confidence Score */}
                <View className="mb-4">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-sm font-semibold text-foreground">Confidence</Text>
                    <Text className="text-lg font-bold text-primary">{signal.confidence}%</Text>
                  </View>
                  <View className="bg-background rounded-full h-2 overflow-hidden">
                    <View
                      className="bg-primary h-full"
                      style={{ width: `${signal.confidence}%` }}
                    />
                  </View>
                </View>

                {/* Component Breakdown */}
                <View className="gap-3">
                  <Text className="text-sm font-semibold text-foreground">Components</Text>

                  {[
                    { label: 'Trend', value: signal.components.trend.value, weight: '40%' },
                    { label: 'Momentum', value: signal.components.momentum.value, weight: '30%' },
                    { label: 'Structure', value: signal.components.structure.value, weight: '20%' },
                    { label: 'Risk', value: signal.components.risk.value, weight: '10%' },
                  ].map((comp) => (
                    <View key={comp.label} className="flex-row justify-between items-center">
                      <View className="flex-1">
                        <Text className="text-xs text-muted">
                          {comp.label} ({comp.weight})
                        </Text>
                      </View>
                      <Text className={`text-sm font-bold ${getComponentColor(comp.value)}`}>
                        {comp.value > 0 ? '+' : ''}{comp.value}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Timeframe Selector */}
            <View className="bg-surface rounded-xl p-4 border border-border">
              <Text className="text-sm font-semibold text-foreground mb-3">Timeframe</Text>
              <View className="flex-row flex-wrap gap-2">
                {(['1m', '5m', '15m', '1h', '4h', '1d', '1w'] as TimeFrame[]).map((tf) => (
                  <TouchableOpacity
                    key={tf}
                    onPress={() => setTimeFrame(tf)}
                    className={`px-3 py-1 rounded ${
                      timeFrame === tf ? 'bg-primary' : 'bg-background border border-border'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        timeFrame === tf ? 'text-background' : 'text-foreground'
                      }`}
                    >
                      {tf}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Technical Indicators */}
            <View className="bg-surface rounded-xl p-4 border border-border">
              <Text className="text-sm font-semibold text-foreground mb-3">Technical Indicators</Text>
              <View className="gap-2">
                <View className="flex-row justify-between">
                  <Text className="text-xs text-muted">RSI</Text>
                  <Text className="text-xs font-semibold text-foreground">65.2</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-muted">MACD</Text>
                  <Text className="text-xs font-semibold text-foreground">0.45</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-muted">Bollinger Bands</Text>
                  <Text className="text-xs font-semibold text-foreground">Mid</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-muted">ADX</Text>
                  <Text className="text-xs font-semibold text-foreground">35.8</Text>
                </View>
              </View>
            </View>

            <View className="h-4" />
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // Native version
  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          {/* Header */}
          <View className="mb-2">
            <Text className="text-3xl font-bold text-foreground">Asset Analysis</Text>
            <Text className="text-sm text-muted mt-1">Professional trading charts</Text>
          </View>

          {/* Asset Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {TRADING_ASSETS.map((asset) => (
                <TouchableOpacity
                  key={asset.id}
                  onPress={() => setSelectedAsset(asset)}
                  className={`px-4 py-2 rounded-lg ${
                    selectedAsset.id === asset.id ? 'bg-primary' : 'bg-surface border border-border'
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      selectedAsset.id === asset.id ? 'text-background' : 'text-foreground'
                    }`}
                  >
                    {asset.symbol}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Chart Info */}
          <View className="bg-surface rounded-xl p-6 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-2">
              {selectedAsset.displayName}
            </Text>
            <Text className="text-sm text-muted">
              {candles.length} candles loaded for {timeFrame} timeframe
            </Text>
            <Text className="text-xs text-muted mt-3">
              TradingView Lightweight Charts with MPS indicator overlay
            </Text>
          </View>

          {/* MPS Signal */}
          {signal && (
            <View className={`${getSignalColor(signal.signal)} rounded-xl p-4`}>
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-lg font-bold text-background">{signal.signal}</Text>
                  <Text className="text-xs text-background/80 mt-1">
                    Confidence: {signal.confidence}%
                  </Text>
                </View>
                <View className="items-center">
                  <Text className="text-2xl font-bold text-background">{signal.confidence}%</Text>
                </View>
              </View>
            </View>
          )}

          <View className="h-4" />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
