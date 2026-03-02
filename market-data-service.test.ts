import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SignalStabilizer } from '../signal-stabilizer';
import { MPSSignalData } from '@/lib/types/trading';

describe('SignalStabilizer', () => {
  let stabilizer: SignalStabilizer;
  const mockSignal = (signal: string): any => ({
    signal: signal as any as MPSSignalData,
    confidence: 85,
    score: 0.85,
    components: {
      trend: { value: 1, description: 'Uptrend' },
      momentum: { value: 1, description: 'Strong' },
      structure: { value: 1, description: 'Bullish' },
      risk: { value: 0.5, description: 'Moderate' },
    },
  });

  beforeEach(() => {
    stabilizer = new SignalStabilizer();
    vi.useFakeTimers();
  });

  it('should accept first signal for an asset', () => {
    const signal = mockSignal('STRONG_BUY');
    const result = stabilizer.stabilizeSignal('bitcoin', signal, 45000);

    expect(result.isStable).toBe(true);
    expect(result.signal.signal).toBe('STRONG_BUY');
    expect(result.reason).toContain('First signal');
  });

  it('should lock signal for 15 minutes', () => {
    const signal = mockSignal('STRONG_BUY');
    stabilizer.stabilizeSignal('bitcoin', signal, 45000);

    vi.advanceTimersByTime(5 * 60 * 1000);
    const flipSignal = mockSignal('STRONG_SELL');
    const result = stabilizer.stabilizeSignal('bitcoin', flipSignal, 45000);

    expect(result.isStable).toBe(false);
    expect(result.reason).toContain('Signal locked');
  });

  it('should require minimum pip movement before reversal', () => {
    const signal = mockSignal('BUY');
    stabilizer.stabilizeSignal('bitcoin', signal, 45000);

    vi.advanceTimersByTime(5 * 60 * 1000);
    const flipSignal = mockSignal('SELL');
    const result = stabilizer.stabilizeSignal('bitcoin', flipSignal, 45010);

    expect(result.isStable).toBe(false);
    expect(result.minPipsRequired).toBe(50);
  });

  it('should allow reversal after pip movement threshold', () => {
    const signal = mockSignal('BUY');
    stabilizer.stabilizeSignal('bitcoin', signal, 45000);

    vi.advanceTimersByTime(5 * 60 * 1000);
    const flipSignal = mockSignal('SELL');
    const result = stabilizer.stabilizeSignal('bitcoin', flipSignal, 45100);

    expect(result.isStable).toBe(true);
    expect(result.reason).toContain('reversed');
  });

  it('should track time remaining for lock', () => {
    const signal = mockSignal('STRONG_BUY');
    stabilizer.stabilizeSignal('eur_usd', signal, 1.095);

    vi.advanceTimersByTime(5 * 60 * 1000);
    const timeRemaining = stabilizer.getTimeRemainingForLock('eur_usd');

    expect(timeRemaining).toBeGreaterThan(9 * 60);
    expect(timeRemaining).toBeLessThanOrEqual(10 * 60);
  });

  it('should reset all states', () => {
    const signal = mockSignal('BUY');
    stabilizer.stabilizeSignal('bitcoin', signal, 45000);
    stabilizer.stabilizeSignal('gold', signal, 2050);

    stabilizer.reset();

    const newSignal = mockSignal('SELL');
    const result = stabilizer.stabilizeSignal('bitcoin', newSignal, 45000);

    expect(result.reason).toContain('First signal');
  });

  it('should use different pip requirements per asset', () => {
    const btcSignal = mockSignal('BUY');
    stabilizer.stabilizeSignal('bitcoin', btcSignal, 45000);

    vi.advanceTimersByTime(5 * 60 * 1000);
    const btcFlip = mockSignal('SELL');
    const btcResult = stabilizer.stabilizeSignal('bitcoin', btcFlip, 45010);

    expect(btcResult.minPipsRequired).toBe(50);

    const goldSignal = mockSignal('BUY');
    stabilizer.stabilizeSignal('gold', goldSignal, 2050);

    vi.advanceTimersByTime(5 * 60 * 1000);
    const goldFlip = mockSignal('SELL');
    const goldResult = stabilizer.stabilizeSignal('gold', goldFlip, 2050.10);

    expect(goldResult.minPipsRequired).toBe(0.5);
  });

  it('should provide statistics', () => {
    const signal = mockSignal('BUY');
    stabilizer.stabilizeSignal('bitcoin', signal, 45000);
    stabilizer.stabilizeSignal('gold', signal, 2050);

    const stats = stabilizer.getStatistics();

    expect(stats.bitcoin).toBeDefined();
    expect(stats.bitcoin.lastSignal).toBe('BUY');
    expect(stats.bitcoin.lastPrice).toBe(45000);
    expect(stats.bitcoin.minPipsRequired).toBe(50);

    expect(stats.gold).toBeDefined();
    expect(stats.gold.lastSignal).toBe('BUY');
    expect(stats.gold.lastPrice).toBe(2050);
    expect(stats.gold.minPipsRequired).toBe(0.5);
  });
});
