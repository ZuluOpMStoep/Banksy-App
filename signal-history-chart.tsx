/**
 * Pattern Chart Overlay Component
 * 
 * Visualizes detected candle patterns on TradingView charts
 * Shows pattern highlights, labels, and statistics
 */

import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { CandlePattern } from '@/lib/indicators/candle-patterns';
import { cn } from '@/lib/utils';
import { useColors } from '@/hooks/use-colors';

// ============================================================================
// PATTERN HIGHLIGHT COMPONENT
// ============================================================================

export interface PatternHighlightProps {
  pattern: CandlePattern;
  chartWidth: number;
  chartHeight: number;
  candleWidth: number;
  candleSpacing: number;
  priceRange: { min: number; max: number };
  timeRange: { start: number; end: number };
  onPatternPress?: (pattern: CandlePattern) => void;
}

/**
 * Renders a visual highlight for a detected pattern on the chart
 */
export function PatternHighlight({
  pattern,
  chartWidth,
  chartHeight,
  candleWidth,
  candleSpacing,
  priceRange,
  timeRange,
  onPatternPress,
}: PatternHighlightProps) {
  const colors = useColors();

  // Calculate position based on pattern location
  const patternDuration = pattern.endTime - pattern.startTime;
  const totalDuration = timeRange.end - timeRange.start;
  const startPercent = (pattern.startTime - timeRange.start) / totalDuration;
  const widthPercent = patternDuration / totalDuration;

  const x = chartWidth * startPercent;
  const width = Math.max(chartWidth * widthPercent, candleWidth * pattern.candleCount);

  // Calculate price range for pattern
  const priceMin = pattern.direction === 'BULLISH' ? priceRange.min : priceRange.min;
  const priceMax = pattern.direction === 'BULLISH' ? priceRange.max : priceRange.max;
  const priceDiff = priceMax - priceMin;

  // Determine color based on pattern direction
  const bgColor =
    pattern.direction === 'BULLISH'
      ? colors.success + '20' // Green with transparency
      : colors.error + '20'; // Red with transparency

  const borderColor =
    pattern.direction === 'BULLISH' ? colors.success : colors.error;

  return (
    <Pressable
      onPress={() => onPatternPress?.(pattern)}
      className="absolute"
      style={{
        left: x,
        width,
        height: chartHeight,
        backgroundColor: bgColor,
        borderLeftWidth: 2,
        borderLeftColor: borderColor,
        borderRightWidth: 2,
        borderRightColor: borderColor,
      }}
    >
      {/* Pattern label */}
      <View className="absolute top-2 left-2 bg-background rounded px-2 py-1 border border-border">
        <Text className="text-xs font-semibold text-foreground">
          {pattern.type.replace(/_/g, ' ')}
        </Text>
        <Text className="text-xs text-muted">
          {Math.round(pattern.strength)}% strength
        </Text>
      </View>
    </Pressable>
  );
}

// ============================================================================
// PATTERN TIMELINE COMPONENT
// ============================================================================

export interface PatternTimelineProps {
  patterns: CandlePattern[];
  selectedPattern?: CandlePattern;
  onSelectPattern?: (pattern: CandlePattern) => void;
}

/**
 * Displays a timeline of detected patterns
 */
export function PatternTimeline({
  patterns,
  selectedPattern,
  onSelectPattern,
}: PatternTimelineProps) {
  const colors = useColors();

  if (patterns.length === 0) {
    return (
      <View className="p-4 bg-surface rounded-lg">
        <Text className="text-sm text-muted text-center">No patterns detected</Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="gap-2 p-2"
    >
      {patterns.map((pattern, idx) => (
        <Pressable
          key={idx}
          onPress={() => onSelectPattern?.(pattern)}
          className={cn(
            'px-3 py-2 rounded-lg border-2',
            selectedPattern === pattern
              ? 'border-primary bg-primary bg-opacity-10'
              : 'border-border bg-surface'
          )}
        >
          <Text
            className={cn(
              'text-xs font-semibold',
              selectedPattern === pattern ? 'text-primary' : 'text-foreground'
            )}
          >
            {pattern.type.substring(0, 8)}
          </Text>
          <Text
            className={cn(
              'text-xs',
              pattern.direction === 'BULLISH' ? 'text-success' : 'text-error'
            )}
          >
            {pattern.direction === 'BULLISH' ? '↑' : '↓'}
            {Math.round(pattern.strength)}%
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// ============================================================================
// PATTERN DETAILS PANEL
// ============================================================================

export interface PatternDetailsPanelProps {
  pattern: CandlePattern;
  onClose?: () => void;
}

/**
 * Displays detailed information about a selected pattern
 */
export function PatternDetailsPanel({
  pattern,
  onClose,
}: PatternDetailsPanelProps) {
  const colors = useColors();

  const directionColor =
    pattern.direction === 'BULLISH' ? colors.success : colors.error;

  return (
    <View className="bg-surface rounded-lg p-4 border border-border">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-bold text-foreground">
          {pattern.type.replace(/_/g, ' ')}
        </Text>
        {onClose && (
          <Pressable onPress={onClose} className="p-2">
            <Text className="text-lg text-muted">×</Text>
          </Pressable>
        )}
      </View>

      {/* Direction badge */}
      <View className="flex-row items-center gap-2 mb-4">
        <View
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: directionColor }}
        />
        <Text
          className="font-semibold text-sm"
          style={{ color: directionColor }}
        >
          {pattern.direction === 'BULLISH' ? 'Bullish' : 'Bearish'}
        </Text>
        <Text className="text-xs text-muted ml-auto">
          Timeframe: {pattern.timeframe}
        </Text>
      </View>

      {/* Metrics */}
      <View className="gap-3">
        <MetricRow
          label="Strength"
          value={`${Math.round(pattern.strength)}%`}
          color={colors.primary}
        />
        <MetricRow
          label="Reliability"
          value={`${Math.round(pattern.reliability)}%`}
          color={colors.primary}
        />
        <MetricRow
          label="Candles"
          value={`${pattern.candleCount}`}
          color={colors.muted}
        />
        <MetricRow
          label="Trading Signal"
          value={pattern.tradingSignal}
          color={
            pattern.tradingSignal === 'BUY'
              ? colors.success
              : pattern.tradingSignal === 'SELL'
                ? colors.error
                : colors.warning
          }
        />
      </View>

      {/* Description */}
      <View className="mt-4 pt-4 border-t border-border">
        <Text className="text-xs text-muted mb-2">Description</Text>
        <Text className="text-sm text-foreground leading-relaxed">
          {pattern.description}
        </Text>
      </View>
    </View>
  );
}

// ============================================================================
// PATTERN STATISTICS COMPONENT
// ============================================================================

export interface PatternStatisticsProps {
  patterns: CandlePattern[];
}

/**
 * Displays statistics about detected patterns
 */
export function PatternStatistics({ patterns }: PatternStatisticsProps) {
  const colors = useColors();

  const stats = useMemo(() => {
    const bullish = patterns.filter((p) => p.direction === 'BULLISH');
    const bearish = patterns.filter((p) => p.direction === 'BEARISH');
    const avgStrength =
      patterns.length > 0
        ? patterns.reduce((sum, p) => sum + p.strength, 0) / patterns.length
        : 0;
    const avgReliability =
      patterns.length > 0
        ? patterns.reduce((sum, p) => sum + p.reliability, 0) / patterns.length
        : 0;

    return {
      total: patterns.length,
      bullish: bullish.length,
      bearish: bearish.length,
      avgStrength: Math.round(avgStrength),
      avgReliability: Math.round(avgReliability),
    };
  }, [patterns]);

  return (
    <View className="bg-surface rounded-lg p-4 border border-border">
      <Text className="text-lg font-bold text-foreground mb-4">
        Pattern Statistics
      </Text>

      <View className="gap-3">
        <StatRow
          label="Total Patterns"
          value={stats.total.toString()}
          color={colors.primary}
        />
        <StatRow
          label="Bullish"
          value={stats.bullish.toString()}
          color={colors.success}
        />
        <StatRow
          label="Bearish"
          value={stats.bearish.toString()}
          color={colors.error}
        />
        <StatRow
          label="Avg Strength"
          value={`${stats.avgStrength}%`}
          color={colors.primary}
        />
        <StatRow
          label="Avg Reliability"
          value={`${stats.avgReliability}%`}
          color={colors.primary}
        />
      </View>
    </View>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function MetricRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View className="flex-row justify-between items-center">
      <Text className="text-sm text-muted">{label}</Text>
      <Text className="text-sm font-semibold" style={{ color }}>
        {value}
      </Text>
    </View>
  );
}

function StatRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View className="flex-row justify-between items-center">
      <Text className="text-sm text-foreground">{label}</Text>
      <Text className="text-sm font-bold" style={{ color }}>
        {value}
      </Text>
    </View>
  );
}
