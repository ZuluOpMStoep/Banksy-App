import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { cn } from '@/lib/utils';

export interface SignalNotificationProps {
  signalType: 'STRONG_BUY' | 'BUY' | 'SELL' | 'STRONG_SELL';
  assetName: string;
  assetSymbol: string;
  entryPrice: number;
  stopLoss: number;
  takeProfitLevels: {
    tp1: { price: number; riskReward: number };
    tp2: { price: number; riskReward: number };
    tp3: { price: number; riskReward: number };
  };
  confidence: number;
  timeframesAligned: number;
  positionSize: 'LARGE' | 'MEDIUM' | 'SMALL' | 'MICRO';
  riskRewardRatio: number;
  entryStrategy: string;
  onDismiss?: () => void;
  onViewDetails?: () => void;
}

export function SignalNotificationCard({
  signalType,
  assetName,
  assetSymbol,
  entryPrice,
  stopLoss,
  takeProfitLevels,
  confidence,
  timeframesAligned,
  positionSize,
  riskRewardRatio,
  entryStrategy,
  onDismiss,
  onViewDetails,
}: SignalNotificationProps) {
  const getSignalColor = () => {
    switch (signalType) {
      case 'STRONG_BUY':
        return 'bg-success';
      case 'BUY':
        return 'bg-success';
      case 'STRONG_SELL':
        return 'bg-error';
      case 'SELL':
        return 'bg-error';
      default:
        return 'bg-warning';
    }
  };

  const getSignalEmoji = () => {
    switch (signalType) {
      case 'STRONG_BUY':
        return '🚀';
      case 'BUY':
        return '📈';
      case 'STRONG_SELL':
        return '💥';
      case 'SELL':
        return '📉';
      default:
        return '⏸️';
    }
  };

  const getPositionSizeColor = () => {
    switch (positionSize) {
      case 'LARGE':
        return 'text-success';
      case 'MEDIUM':
        return 'text-primary';
      case 'SMALL':
        return 'text-warning';
      case 'MICRO':
        return 'text-muted';
      default:
        return 'text-foreground';
    }
  };

  const riskAmount = entryPrice - stopLoss;
  const riskPercentage = ((riskAmount / entryPrice) * 100).toFixed(2);

  return (
    <View className={cn('rounded-lg p-4 mb-4 border border-border', getSignalColor())}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <Text className="text-2xl">{getSignalEmoji()}</Text>
          <View>
            <Text className="text-lg font-bold text-foreground">{signalType}</Text>
            <Text className="text-sm text-muted">{assetName}</Text>
          </View>
        </View>
        <View className="items-center">
          <Text className="text-sm font-semibold text-foreground">{confidence}%</Text>
          <Text className="text-xs text-muted">Confidence</Text>
        </View>
      </View>

      {/* Timeframe Alignment */}
      <View className="mb-3 p-2 bg-surface rounded">
        <Text className="text-xs text-muted mb-1">Timeframe Alignment</Text>
        <View className="flex-row items-center gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <View
              key={i}
              className={cn(
                'h-2 flex-1 rounded',
                i < timeframesAligned ? 'bg-success' : 'bg-border'
              )}
            />
          ))}
        </View>
        <Text className="text-xs text-foreground mt-1">{timeframesAligned}/7 timeframes aligned</Text>
      </View>

      {/* Price Levels */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
        <View className="flex-row gap-2">
          {/* Entry */}
          <View className="bg-surface rounded p-2 min-w-24">
            <Text className="text-xs text-muted">Entry</Text>
            <Text className="text-sm font-bold text-foreground">{entryPrice.toFixed(2)}</Text>
          </View>

          {/* Stop Loss */}
          <View className="bg-error/10 rounded p-2 min-w-24">
            <Text className="text-xs text-muted">Stop Loss</Text>
            <Text className="text-sm font-bold text-error">{stopLoss.toFixed(2)}</Text>
            <Text className="text-xs text-muted">{riskPercentage}%</Text>
          </View>

          {/* TP1 */}
          <View className="bg-success/10 rounded p-2 min-w-24">
            <Text className="text-xs text-muted">TP1 (1:1)</Text>
            <Text className="text-sm font-bold text-success">
              {takeProfitLevels.tp1.price.toFixed(2)}
            </Text>
          </View>

          {/* TP2 */}
          <View className="bg-success/10 rounded p-2 min-w-24">
            <Text className="text-xs text-muted">TP2 (2:1)</Text>
            <Text className="text-sm font-bold text-success">
              {takeProfitLevels.tp2.price.toFixed(2)}
            </Text>
          </View>

          {/* TP3 */}
          <View className="bg-success/10 rounded p-2 min-w-24">
            <Text className="text-xs text-muted">TP3 (3:1)</Text>
            <Text className="text-sm font-bold text-success">
              {takeProfitLevels.tp3.price.toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Details Grid */}
      <View className="grid grid-cols-2 gap-2 mb-3">
        <View className="bg-surface rounded p-2">
          <Text className="text-xs text-muted">Risk:Reward</Text>
          <Text className="text-sm font-bold text-foreground">1:{riskRewardRatio.toFixed(1)}</Text>
        </View>

        <View className={cn('bg-surface rounded p-2')}>
          <Text className="text-xs text-muted">Position Size</Text>
          <Text className={cn('text-sm font-bold', getPositionSizeColor())}>{positionSize}</Text>
        </View>

        <View className="bg-surface rounded p-2">
          <Text className="text-xs text-muted">Entry Strategy</Text>
          <Text className="text-xs font-semibold text-foreground">{entryStrategy}</Text>
        </View>

        <View className="bg-surface rounded p-2">
          <Text className="text-xs text-muted">Symbol</Text>
          <Text className="text-sm font-bold text-foreground">{assetSymbol}</Text>
        </View>
      </View>

      {/* Actions */}
      <View className="flex-row gap-2">
        <Pressable
          onPress={onViewDetails}
          className="flex-1 bg-primary rounded-lg py-2 px-3 active:opacity-80"
        >
          <Text className="text-center font-semibold text-background">View Details</Text>
        </Pressable>

        <Pressable
          onPress={onDismiss}
          className="flex-1 bg-surface border border-border rounded-lg py-2 px-3 active:opacity-80"
        >
          <Text className="text-center font-semibold text-foreground">Dismiss</Text>
        </Pressable>
      </View>
    </View>
  );
}
