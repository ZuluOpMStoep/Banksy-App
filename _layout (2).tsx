import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { generateMockEconomicEvents } from '@/lib/services/mock-data';
import { EconomicEvent } from '@/lib/types/trading';

export default function CalendarScreen() {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setEvents(generateMockEconomicEvents());
  }, []);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-error';
      case 'medium':
        return 'bg-warning';
      default:
        return 'bg-muted';
    }
  };

  const getImpactBgColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-error/10 border-error/20';
      case 'medium':
        return 'bg-warning/10 border-warning/20';
      default:
        return 'bg-muted/10 border-muted/20';
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDaysUntil = (timestamp: number) => {
    const now = Date.now();
    const diff = timestamp - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          {/* Header */}
          <View className="mb-2">
            <Text className="text-3xl font-bold text-foreground">Economic Calendar</Text>
            <Text className="text-sm text-muted mt-1">Market-moving events ahead</Text>
          </View>

          {/* Impact Legend */}
          <View className="bg-surface rounded-xl p-4 border border-border">
            <Text className="text-sm font-semibold text-foreground mb-3">Impact Levels</Text>
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <View className="w-3 h-3 rounded-full bg-error" />
                <Text className="text-sm text-foreground">High Impact</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="w-3 h-3 rounded-full bg-warning" />
                <Text className="text-sm text-foreground">Medium Impact</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="w-3 h-3 rounded-full bg-muted" />
                <Text className="text-sm text-foreground">Low Impact</Text>
              </View>
            </View>
          </View>

          {/* Events List */}
          <View className="gap-3">
            {events.map((event) => (
              <TouchableOpacity
                key={event.id}
                onPress={() => setExpandedId(expandedId === event.id ? null : event.id)}
                activeOpacity={0.7}
              >
                <View className={`rounded-xl p-4 border ${getImpactBgColor(event.impact)}`}>
                  {/* Event Header */}
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1 pr-2">
                      <Text className="text-base font-semibold text-foreground">{event.name}</Text>
                      <Text className="text-xs text-muted mt-1">{event.country}</Text>
                    </View>
                    <View className={`${getImpactColor(event.impact)} px-3 py-1 rounded-full`}>
                      <Text className="text-xs font-bold text-background capitalize">{event.impact}</Text>
                    </View>
                  </View>

                  {/* Event Time */}
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-sm font-semibold text-foreground">
                      {formatDate(event.timestamp)} at {formatTime(event.timestamp)}
                    </Text>
                    <Text className="text-xs font-semibold text-primary">{getDaysUntil(event.timestamp)}</Text>
                  </View>

                  {/* Expanded Details */}
                  {expandedId === event.id && (
                    <View className="bg-background rounded-lg p-3 mt-3 border border-border/50">
                      <View className="gap-3">
                        {/* Previous Value */}
                        <View className="flex-row justify-between">
                          <Text className="text-xs text-muted">Previous</Text>
                          <Text className="text-sm font-semibold text-foreground">
                            {event.previous !== undefined ? event.previous : 'N/A'}{' '}
                            {event.unit || ''}
                          </Text>
                        </View>

                        {/* Forecast Value */}
                        <View className="flex-row justify-between">
                          <Text className="text-xs text-muted">Forecast</Text>
                          <Text className="text-sm font-semibold text-foreground">
                            {event.forecast !== undefined ? event.forecast : 'N/A'}{' '}
                            {event.unit || ''}
                          </Text>
                        </View>

                        {/* Actual Value (if available) */}
                        {event.actual !== undefined && (
                          <View className="flex-row justify-between border-t border-border/50 pt-2">
                            <Text className="text-xs text-muted">Actual</Text>
                            <Text className="text-sm font-semibold text-primary">
                              {event.actual} {event.unit || ''}
                            </Text>
                          </View>
                        )}

                        {/* Related Assets */}
                        {event.relatedAssets.length > 0 && (
                          <View className="pt-2 border-t border-border/50">
                            <Text className="text-xs text-muted mb-2">Affects</Text>
                            <View className="flex-row flex-wrap gap-2">
                              {event.relatedAssets.map((asset) => (
                                <View key={asset} className="bg-primary/10 px-2 py-1 rounded">
                                  <Text className="text-xs font-semibold text-primary">{asset}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tips */}
          <View className="bg-primary/10 rounded-xl p-4 border border-primary/20">
            <Text className="text-sm font-semibold text-primary mb-2">Pro Tip</Text>
            <Text className="text-xs text-foreground leading-relaxed">
              High-impact events often cause significant price movements. The MPS indicator automatically
              adjusts sensitivity during these periods to reduce false signals.
            </Text>
          </View>

          <View className="h-4" />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
