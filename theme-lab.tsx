import { ScrollView, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/screen-container';
import { TRADING_ASSETS } from '@/lib/constants/assets';
import { generateMockMPSSignal, generateMockCandles, generateMockEconomicEvents } from '@/lib/services/mock-data';
import { AssetPrice, MPSSignalData } from '@/lib/types/trading';
import { signalConfirmationEngine } from '@/lib/services/signal-confirmation-engine';
import { tpslCalculator } from '@/lib/services/tp-sl-calculator';
import { economicCalendarFilter } from '@/lib/services/economic-calendar-filter';
import { getMarketOverview } from '@/lib/services/market-data-service';
import { signalStabilityService } from '@/lib/services/signal-stability-service';
import { signalStabilizer } from '@/lib/services/signal-stabilizer';
import { SignalHistoryService } from '@/lib/services/signal-history-service';
import { SignalHistoryChart } from '@/components/signal-history-chart';

/**
 * Dashboard / Home Screen
 * Displays real-time prices from CoinGecko & Polygon.io, MPS signals, TP/SL levels, and economic calendar warnings
 */
export default function HomeScreen() {
  const router = useRouter();
  const [prices, setPrices] = useState<Record<string, AssetPrice>>({});
  const [signals, setSignals] = useState<Record<string, MPSSignalData>>({});
  const [confirmedSignals, setConfirmedSignals] = useState<Record<string, any>>({});
  const [tpslLevels, setTPSLLevels] = useState<Record<string, any>>({});
  const [eventWarnings, setEventWarnings] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [signalsEnabled, setSignalsEnabled] = useState(true);
  const [lockedSignals, setLockedSignals] = useState<Record<string, any>>({});
  const [signalHistory, setSignalHistory] = useState<any[]>([]);

  // Initialize real-time data
  useEffect(() => {
    loadData();
    // Fetch real-time updates every 5 seconds
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      // Fetch real-time prices from market data service
      const realPrices = await getMarketOverview();
      const priceMap: Record<string, AssetPrice> = realPrices;
      const signalMap: Record<string, MPSSignalData> = {};
      const tpslMap: Record<string, any> = {};
      const warningsMap: Record<string, string> = {};

      // Set up economic calendar
      const events = generateMockEconomicEvents();
      economicCalendarFilter.setEvents(events);

      Object.entries(priceMap).forEach(([assetId, price]) => {
        const rawSignal = generateMockMPSSignal(assetId);
        // Apply signal stabilization to prevent rapid flipping
        const stabilized = signalStabilizer.stabilizeSignal(assetId, rawSignal, price.price);
        signalMap[assetId] = stabilized.signal;

        // Calculate TP/SL
        const candles = generateMockCandles(100);
        const signal = signalMap[assetId];
        const isBuy = signal.signal.includes('BUY');
        tpslMap[assetId] = tpslCalculator.calculateTPSL(
          isBuy ? 'BUY' : 'SELL',
          price.price,
          candles
        );

        // Check for event warnings
        const eventResult = economicCalendarFilter.shouldAllowSignal(assetId);
        if (!eventResult.allowed) {
          warningsMap[assetId] = eventResult.reason;
        }
      });

      setPrices(priceMap);
      setSignals(signalMap);
      setTPSLLevels(tpslMap);
      setEventWarnings(warningsMap);

      // Apply signal confirmation
      const filtered = signalConfirmationEngine.filterSignals(signalMap);
      setConfirmedSignals(filtered);

      // Load signal history for display
      try {
        const history = await SignalHistoryService.getAllSignals();
        setSignalHistory(history);
      } catch (err) {
        console.warn('Could not load signal history:', err);
      }
    } catch (error) {
      console.error('Error loading market data:', error);
      // Fallback: show error message or use cached data
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleResetSignals = () => {
    // Clear all signals and reload
    setSignals({});
    setConfirmedSignals({});
    setTPSLLevels({});
    setEventWarnings({});
    // Reload data after reset
    setTimeout(() => loadData(), 300);
  };

  const handleToggleSignals = () => {
    setSignalsEnabled(!signalsEnabled);
    if (!signalsEnabled) {
      // Re-enable signals and reload
      loadData();
    }
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

  const getPriceChangeColor = (change: number) => {
    return change >= 0 ? 'text-success' : 'text-error';
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="gap-4">
          {/* Header with Controls */}
          <View className="mb-2">
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-1">
                <Text className="text-3xl font-bold text-foreground">Manus Trade Pro</Text>
                <Text className="text-sm text-muted mt-1">Real-time Trading Analysis</Text>
              </View>
              <View className="flex-row gap-2">
                {/* Signal Toggle */}
                <TouchableOpacity
                  onPress={handleToggleSignals}
                  className={`px-3 py-2 rounded-lg ${signalsEnabled ? 'bg-success' : 'bg-error'}`}
                >
                  <Text className="text-xs font-bold text-white">
                    {signalsEnabled ? '🟢 ON' : '🔴 OFF'}
                  </Text>
                </TouchableOpacity>
                {/* Reset Button */}
                <TouchableOpacity
                  onPress={handleResetSignals}
                  className="px-3 py-2 rounded-lg bg-primary"
                >
                  <Text className="text-xs font-bold text-white">↻ Reset</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Show message if signals are disabled */}
          {!signalsEnabled && (
            <View className="bg-warning/10 border border-warning rounded-lg p-3 mb-2">
              <Text className="text-sm font-semibold text-warning">⚠️ Signals are currently disabled. Tap the ON button to enable.</Text>
            </View>
          )}

          {/* Asset Cards Grid */}
          {TRADING_ASSETS.map((asset) => {
            const price = prices[asset.id];
            const signal = signals[asset.id];
            const tpsl = tpslLevels[asset.id];
            const warning = eventWarnings[asset.id];

            if (!price || !signal || !tpsl) return null;

            return (
              <TouchableOpacity
                key={asset.id}
                onPress={() => {
                  router.push('./assets');
                }}
                activeOpacity={0.7}
              >
                <View className="bg-surface rounded-xl p-4 border border-border">
                  {/* Signal Lock Indicator */}
                  {lockedSignals[asset.id] && !lockedSignals[asset.id].isStable && (
                    <View className="bg-primary/10 border border-primary rounded-lg p-2 mb-3">
                      <Text className="text-xs font-semibold text-primary">🔒 {lockedSignals[asset.id].reason}</Text>
                    </View>
                  )}

                  {/* Event Warning Banner */}
                  {warning && (
                    <View className="bg-warning/10 border border-warning rounded-lg p-2 mb-3">
                      <Text className="text-xs font-semibold text-warning">⚠️ {warning}</Text>
                    </View>
                  )}

                  {/* Asset Header */}
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-foreground">{asset.displayName}</Text>
                      <Text className="text-xs text-muted mt-0.5">{asset.description}</Text>
                    </View>
                    <View className={`${getSignalColor(signal.signal)} px-3 py-1 rounded-full`}>
                      <Text className="text-xs font-bold text-background">
                        {signal.signal === 'STRONG_BUY' ? '🟢 STRONG BUY' : 
                         signal.signal === 'BUY' ? '🟢 BUY' :
                         signal.signal === 'STRONG_SELL' ? '🔴 STRONG SELL' :
                         signal.signal === 'SELL' ? '🔴 SELL' : '🟡 HOLD'}
                      </Text>
                    </View>
                  </View>

                  {/* Price Info */}
                  <View className="flex-row justify-between items-center mb-3">
                    <View>
                      <Text className="text-2xl font-bold text-foreground">
                        {price.price.toFixed(price.price > 100 ? 2 : 4)}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Text className={`text-sm font-semibold ${getPriceChangeColor(price.change24h)}`}>
                          {price.changePercent24h > 0 ? '+' : ''}
                          {price.changePercent24h.toFixed(2)}%
                        </Text>
                        <Text className={`text-xs ml-2 ${getPriceChangeColor(price.change24h)}`}>
                          {price.change24h > 0 ? '↑' : '↓'} {Math.abs(price.change24h).toFixed(2)}
                        </Text>
                      </View>
                    </View>

                    {/* Confidence Badge */}
                    <View className="items-center">
                      <View className="w-16 h-16 rounded-full bg-primary/10 justify-center items-center">
                        <Text className="text-lg font-bold text-primary">{signal.confidence}%</Text>
                      </View>
                      <Text className="text-xs text-muted mt-1">Confidence</Text>
                    </View>
                  </View>

                  {/* Component Breakdown */}
                  <View className="flex-row justify-between gap-2 mb-3">
                    {[
                      { label: 'Trend', abbr: 'T', value: signal.components.trend.value },
                      { label: 'Momentum', abbr: 'M', value: signal.components.momentum.value },
                      { label: 'Structure', abbr: 'S', value: signal.components.structure.value },
                      { label: 'Risk', abbr: 'R', value: signal.components.risk.value },
                    ].map((comp, idx) => (
                      <View key={idx} className="flex-1 bg-background rounded-lg p-2 items-center">
                        <Text className="text-xs font-bold text-muted">{comp.abbr}</Text>
                        <Text className="text-xs text-muted/50 mt-0.5">{comp.label}</Text>
                        <Text className={`text-sm font-bold mt-1 ${comp.value > 0 ? 'text-success' : 'text-error'}`}>
                          {comp.value > 0 ? '+' : ''}{comp.value}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Entry Price & Validity */}
                  <View className="bg-background rounded-lg p-3 mb-3">
                    <Text className="text-xs font-bold text-muted mb-2">ENTRY & VALIDITY</Text>
                    <View className="gap-1.5">
                      <View className="flex-row justify-between">
                        <Text className="text-xs text-muted">Entry:</Text>
                        <Text className="text-xs font-semibold text-foreground">{signal.entryPrice.toFixed(2)}</Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-xs text-muted">Valid:</Text>
                        <Text className="text-xs font-semibold text-primary">{Math.max(0, Math.round((signal.validityEndTime - Date.now()) / 60000))}m</Text>
                      </View>
                    </View>
                  </View>

                  {/* TP/SL Levels */}
                  <View className="bg-background rounded-lg p-3 mb-3">
                    <Text className="text-xs font-bold text-muted mb-2">TARGETS & STOPS</Text>
                    <View className="gap-1.5">
                      <View className="flex-row justify-between">
                        <Text className="text-xs text-muted">SL:</Text>
                        <Text className="text-xs font-semibold text-error">
                          {tpsl.stopLoss.toFixed(4)} ({tpsl.stopLossPercent.toFixed(2)}%)
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-xs text-muted">TP1 (1:1):</Text>
                        <Text className="text-xs font-semibold text-success">
                          {tpsl.takeProfit1.toFixed(4)} (+{tpsl.takeProfit1Percent.toFixed(2)}%)
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-xs text-muted">TP2 (2:1):</Text>
                        <Text className="text-xs font-semibold text-success">
                          {tpsl.takeProfit2.toFixed(4)} (+{tpsl.takeProfit2Percent.toFixed(2)}%)
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-xs text-muted">TP3 (3:1):</Text>
                        <Text className="text-xs font-semibold text-success">
                          {tpsl.takeProfit3.toFixed(4)} (+{tpsl.takeProfit3Percent.toFixed(2)}%)
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Timeframe & Accuracy Info */}
                  <View className="flex-row justify-between items-center pt-2 border-t border-border">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-xs text-muted">Signal:</Text>
                      <View className="bg-primary/10 px-2 py-1 rounded">
                        <Text className="text-xs font-semibold text-primary">1H</Text>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-xs text-muted">Accuracy:</Text>
                      <Text className="text-xs font-bold text-success">92%</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Signal History Chart */}
          {signalHistory.length > 0 && (
            <SignalHistoryChart signals={signalHistory} maxItems={10} />
          )}

          {/* Footer Spacing */}
          <View className="h-4" />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
