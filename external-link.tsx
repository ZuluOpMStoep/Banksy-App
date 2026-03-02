import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { MPSSignalData } from '@/lib/types/trading';

interface AdvancedChartProps {
  symbol: string;
  mpsSignal?: MPSSignalData;
  height?: number;
  showMPS?: boolean;
}

/**
 * Advanced Charts Component
 * Integrates TradingView Advanced Charts with Banksy datafeed
 * 
 * Note: TradingView Advanced Charts requires web-based rendering
 * For native mobile, we use WebView with HTML/JS bridge
 */
export function AdvancedChart({
  symbol,
  mpsSignal,
  height = 500,
  showMPS = true,
}: AdvancedChartProps) {
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      // For native, would use WebView
      return;
    }

    // Initialize Advanced Charts on web
    initializeAdvancedCharts();
  }, [symbol]);

  const initializeAdvancedCharts = async () => {
    try {
      // Load TradingView Advanced Charts library
      const script = document.createElement('script');
      script.src = 'https://www.tradingview.com/static/bundles/advanced-charts.js';
      script.async = true;

      script.onload = () => {
        if ((window as any).TradingView) {
          createChart();
        }
      };

      document.head.appendChild(script);
    } catch (error) {
      console.error('Error loading Advanced Charts:', error);
      setIsLoading(false);
    }
  };

  const createChart = () => {
    if (!containerRef.current || !(window as any).TradingView) {
      return;
    }

    try {
      // Create chart widget
      new (window as any).TradingView.widget({
        autosize: true,
        symbol: symbol,
        interval: '60',
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'en',
        toolbar_bg: '#1e2022',
        enable_publishing: false,
        allow_symbol_change: false,
        container_id: 'tradingview-chart',
        studies: [
          'RSI@tv-basicstudies',
          'MACD@tv-basicstudies',
          'BB@tv-basicstudies',
        ],
        // Custom datafeed would be injected here
        // datafeed: TradingViewDatafeed,
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error creating chart:', error);
      setIsLoading(false);
    }
  };

  if (Platform.OS === 'web') {
    return (
      <div
        style={{
          width: '100%',
          height: `${height}px`,
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid #334155',
          backgroundColor: '#151718',
        }}
      >
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
            }}
          >
            <ActivityIndicator size="large" color="#0a7ea4" />
          </div>
        )}
        <div id="tradingview-chart" style={{ width: '100%', height: '100%' }} />

        {/* MPS Overlay */}
        {showMPS && mpsSignal && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              backgroundColor: 'rgba(21, 23, 24, 0.9)',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #334155',
              zIndex: 20,
            }}
          >
            <div style={{ color: '#ECEDEE', fontSize: '12px', marginBottom: '4px' }}>
              <strong>MPS Signal</strong>
            </div>
            <div
              style={{
                color:
                  mpsSignal.signal.includes('BUY') ? '#22C55E' : mpsSignal.signal.includes('SELL') ? '#EF4444' : '#F59E0B',
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '4px',
              }}
            >
              {mpsSignal.signal}
            </div>
            <div style={{ color: '#9BA1A6', fontSize: '11px' }}>
              Confidence: {mpsSignal.confidence}%
            </div>
          </div>
        )}
      </div>
    );
  }

  // For native platforms, show placeholder
  return (
    <ScreenContainer className="p-4">
      <View className="bg-surface rounded-xl p-6 border border-border items-center justify-center" style={{ height }}>
        <Text className="text-foreground font-semibold mb-2">Advanced Charts</Text>
        <Text className="text-muted text-sm text-center">
          Available on web platform. Use Lightweight Charts on mobile.
        </Text>
      </View>
    </ScreenContainer>
  );
}

export default AdvancedChart;
