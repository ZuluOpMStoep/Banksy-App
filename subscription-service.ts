import { describe, it, expect } from 'vitest';
import { SignalConfirmationEngine } from './signal-confirmation-engine';
import { MPSSignalData } from '@/lib/types/trading';

describe('SignalConfirmationEngine', () => {
  const engine = new SignalConfirmationEngine(4, 75);

  // Helper to create test signals
  const createSignal = (
    signal: MPSSignalData['signal'],
    confidence: number,
    trendValue: number,
    momentumValue: number,
    structureValue: number,
    riskValue: number
  ): MPSSignalData => ({
    signal,
    confidence,
    score: 0.5,
    trendScore: 0.5,
    momentumScore: 0.5,
    structureScore: 0.5,
    riskScore: 0.5,
    components: {
      trend: { value: trendValue, description: trendValue > 0 ? 'Bullish' : 'Bearish' },
      momentum: { value: momentumValue, description: momentumValue > 0 ? 'Bullish' : 'Bearish' },
      structure: { value: structureValue, description: structureValue > 0 ? 'Bullish' : 'Bearish' },
      risk: { value: riskValue, description: riskValue > 0 ? 'Good' : 'Fair' },
    },
    entryPrice: 50000,
    validityTime: 60 * 60 * 1000,
    validityEndTime: Date.now() + 60 * 60 * 1000,
    timestamp: Date.now(),
    timeFrame: '1h',
  });

  describe('confirmSignal', () => {
    it('should confirm a BUY signal when all 4 indicators are bullish and confidence >= 75%', () => {
      const signal = createSignal('BUY', 80, 50, 50, 50, 50);
      const result = engine.confirmSignal(signal);

      expect(result.isConfirmed).toBe(true);
      expect(result.agreementCount).toBe(4);
      expect(result.confirmationScore).toBe(100);
    });

    it('should reject a BUY signal when confidence < 75%', () => {
      const signal = createSignal('BUY', 70, 50, 50, 50, 50);
      const result = engine.confirmSignal(signal);

      expect(result.isConfirmed).toBe(false);
      expect(result.reason).toContain('Confidence');
    });

    it('should reject a BUY signal when only 3 indicators agree', () => {
      const signal = createSignal('BUY', 80, 50, 50, 50, -50);
      const result = engine.confirmSignal(signal);

      expect(result.isConfirmed).toBe(false);
      expect(result.agreementCount).toBe(3);
    });

    it('should confirm a SELL signal when all 4 indicators are bearish and confidence >= 75%', () => {
      const signal = createSignal('SELL', 80, -50, -50, -50, -50);
      const result = engine.confirmSignal(signal);

      expect(result.isConfirmed).toBe(true);
      expect(result.agreementCount).toBe(4);
    });

    it('should reject a SELL signal with mixed indicators', () => {
      const signal = createSignal('SELL', 80, -50, 50, -50, 50);
      const result = engine.confirmSignal(signal);

      expect(result.isConfirmed).toBe(false);
      expect(result.agreementCount).toBe(2);
    });

    it('should handle HOLD signals with mixed indicators', () => {
      const signal = createSignal('HOLD', 80, 50, -50, 50, 50);
      const result = engine.confirmSignal(signal);

      expect(result.isConfirmed).toBe(false);
      expect(result.reason).toContain('Only');
    });

    it('should generate appropriate confirmation status labels', () => {
      const perfectSignal = createSignal('BUY', 80, 50, 50, 50, 50);
      const perfectResult = engine.confirmSignal(perfectSignal);
      const perfectStatus = engine.getConfirmationStatus(perfectResult);

      expect(perfectStatus.label).toBe('Perfect');
      expect(perfectStatus.color).toBe('#22C55E');

      const strongSignal = createSignal('BUY', 80, 50, 50, -50, 50);
      const strongResult = engine.confirmSignal(strongSignal);
      const strongStatus = engine.getConfirmationStatus(strongResult);

      expect(strongStatus.label).toBe('Strong');
    });
  });

  describe('filterSignals', () => {
    it('should only return confirmed signals', () => {
      const signals: Record<string, MPSSignalData> = {
        gold: createSignal('BUY', 80, 50, 50, 50, 50),
        silver: createSignal('BUY', 70, 50, 50, 50, 50),
        bitcoin: createSignal('SELL', 80, -50, -50, -50, -50),
      };

      const filtered = engine.filterSignals(signals);

      expect(Object.keys(filtered).length).toBe(2);
      expect(filtered['gold']).toBeDefined();
      expect(filtered['bitcoin']).toBeDefined();
      expect(filtered['silver']).toBeUndefined();
    });
  });

  describe('calculateQualityMetrics', () => {
    it('should calculate correct quality metrics', () => {
      const allSignals: MPSSignalData[] = [
        createSignal('BUY', 80, 50, 50, 50, 50),
        createSignal('BUY', 70, 50, 50, 50, 50),
        createSignal('SELL', 80, -50, -50, -50, -50),
      ];

      const confirmedSignals: MPSSignalData[] = [
        createSignal('BUY', 80, 50, 50, 50, 50),
        createSignal('SELL', 80, -50, -50, -50, -50),
      ];

      const metrics = engine.calculateQualityMetrics(allSignals, confirmedSignals);

      expect(metrics.confirmationRate).toBeCloseTo(66.67, 1);
      expect(metrics.falseSignalRate).toBeCloseTo(33.33, 1);
      expect(metrics.strongSignalRate).toBe(100);
    });
  });

  describe('configuration', () => {
    it('should allow setting minimum confidence threshold', () => {
      const customEngine = new SignalConfirmationEngine(4, 75);
      customEngine.setMinConfidenceThreshold(90);

      const signal = createSignal('BUY', 80, 50, 50, 50, 50);
      const result = customEngine.confirmSignal(signal);

      expect(result.isConfirmed).toBe(false);
    });

    it('should allow setting required agreement count', () => {
      const customEngine = new SignalConfirmationEngine(4, 75);
      customEngine.setRequiredAgreement(3);

      const signal = createSignal('BUY', 80, 50, 50, 50, -50);
      const result = customEngine.confirmSignal(signal);

      expect(result.isConfirmed).toBe(true);
      expect(result.agreementCount).toBe(3);
    });
  });
});
