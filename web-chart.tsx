// components/web-chart.tsx
// UPGRADED: Full TradingView Lightweight Charts v4 with MPS overlay

import React, { useEffect, useRef } from 'react';
import { ChartCandle, MPSSignalData } from '@/lib/types/trading';

interface WebChartProps {
  candles: ChartCandle[];
  mpsSignal: MPSSignalData;
  assetSymbol: string;
  height?: number;
}

declare global {
  interface Window { LightweightCharts: any; }
}

export function WebChart({ candles, mpsSignal, assetSymbol, height = 400 }: WebChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<any>(null);
  const csRef        = useRef<any>(null);  // candlestick series ref for live updates

  const sigColor = (s: string) =>
    s==='STRONG_BUY'?'#00D084':s==='BUY'?'#00FF88':s==='HOLD'?'#FFB700':s==='SELL'?'#FF6B35':'#FF0000';

  useEffect(() => {
    // Load Lightweight Charts script if not already present
    if (!window.LightweightCharts) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/lightweight-charts@4.1.1/dist/lightweight-charts.standalone.production.js';
      script.onload = () => initChart();
      document.head.appendChild(script);
    } else {
      initChart();
    }
    return () => {
      if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }
    };
  }, []);

  // Update chart when candles change (live ticks)
  useEffect(() => {
    if (!csRef.current || !candles.length) return;
    const last = candles[candles.length - 1];
    csRef.current.update({
      time:  Math.floor(last.timestamp / 1000),
      open:  last.open,
      high:  last.high,
      low:   last.low,
      close: last.close,
    });
  }, [candles]);

  function initChart() {
    if (!containerRef.current || chartRef.current) return;

    const chart = window.LightweightCharts.createChart(containerRef.current, {
      layout:  { background:{ color:'#0F0F1E' }, textColor:'#9BA1A6' },
      width:   containerRef.current.clientWidth,
      height:  height,
      grid:    { horzLines:{ color:'#1A1A2E' }, vertLines:{ color:'#1A1A2E' } },
      rightPriceScale: { borderColor:'#3D3D5C' },
      timeScale:       { borderColor:'#3D3D5C', timeVisible:true, secondsVisible:false },
      crosshair: { mode: 1 },
    });

    chartRef.current = chart;

    // ── Candlestick series ──
    const cs = chart.addCandlestickSeries({
      upColor:'#00D084', downColor:'#FF0000',
      borderUpColor:'#00D084', borderDownColor:'#FF0000',
      wickUpColor:'#00D084', wickDownColor:'#FF0000',
    });
    csRef.current = cs;

    const data = candles.map(c => ({
      time:  Math.floor(c.timestamp / 1000),
      open:  c.open, high: c.high, low: c.low, close: c.close,
    }));
    cs.setData(data);

    // ── Volume histogram ──
    const vol = chart.addHistogramSeries({
      priceFormat: { type:'volume' },
      priceScaleId: 'vol',
      scaleMargins: { top:0.85, bottom:0 },
    });
    vol.setData(candles.map(c => ({
      time:  Math.floor(c.timestamp / 1000),
      value: c.volume ?? 0,
      color: c.close >= c.open ? 'rgba(0,208,132,0.3)' : 'rgba(255,0,0,0.3)',
    })));

    // ── MPS signal lines ──
    if (mpsSignal && data.length) {
      const sc      = sigColor(mpsSignal.signal);
      const isTrade = mpsSignal.signal !== 'HOLD';
      const t0      = data[0].time as number;
      const t1      = (data[data.length-1].time as number) + 18000;

      const hline = (val: number, color: string, title: string, dash = true) => {
        const s = chart.addLineSeries({ color, lineWidth:1, lineStyle: dash?2:1, title });
        s.setData([{ time:t0, value:val }, { time:t1, value:val }]);
      };

      hline(mpsSignal.entryPrice ?? data[data.length-1].close, sc, 'Entry', false);

      if (isTrade) {
        hline(mpsSignal.tp1,      'rgba(0,208,132,0.8)',  'TP1');
        hline(mpsSignal.tp2,      'rgba(0,208,132,0.55)', 'TP2');
        hline(mpsSignal.tp3,      'rgba(255,215,0,0.7)',  'TP3');
        hline(mpsSignal.stopLoss, 'rgba(255,0,0,0.7)',    'SL');
      }
    }

    chart.timeScale().fitContent();

    // Resize observer
    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);
  }

  return (
    <div style={{ position:'relative', borderRadius:12, overflow:'hidden', border:'1px solid #3D3D5C' }}>
      <div ref={containerRef} style={{ width:'100%', height }} />

      {/* MPS badge overlay */}
      {mpsSignal && (
        <div style={{
          position:'absolute', top:10, right:10,
          background:'rgba(26,26,46,0.92)', backdropFilter:'blur(8px)',
          border:`1.5px solid ${sigColor(mpsSignal.signal)}`,
          borderRadius:10, padding:'8px 12px',
          fontFamily:'-apple-system,sans-serif',
        }}>
          <div style={{ fontSize:14, fontWeight:700, color:sigColor(mpsSignal.signal) }}>
            {mpsSignal.signal.replace('_',' ')}
          </div>
          <div style={{ fontSize:11, color:'#9BA1A6', marginTop:2 }}>
            Confidence: {mpsSignal.confidence}%
          </div>
        </div>
      )}
    </div>
  );
}
