/**
 * Signal Monitor
 * 
 * Tracks trading signals in real-time to identify:
 * 1. Rapid signal flipping (BUY → SELL within short time)
 * 2. TP not hit before reversal
 * 3. False signals
 * 4. Entry price vs actual market movement
 */

import { MPSSignalData, AssetPrice } from '@/lib/types/trading';

export interface SignalEvent {
  assetId: string;
  signal: string;
  entryPrice: number;
  tpLevel: number;
  slLevel: number;
  confidence: number;
  generatedAt: number;
  reversedAt?: number;
  tpHitAt?: number;
  slHitAt?: number;
  finalPrice?: number;
  outcome?: 'TP_HIT' | 'SL_HIT' | 'REVERSED' | 'PENDING';
  durationMs?: number;
  pipsMovement?: number;
}

export interface SignalTestResult {
  assetId: string;
  totalSignals: number;
  tpHitCount: number;
  slHitCount: number;
  reversedCount: number;
  pendingCount: number;
  tpHitRate: number;
  averageDurationMs: number;
  averagePipsMovement: number;
  rapidFlips: number; // Signals reversed within 5 minutes
  signals: SignalEvent[];
}

export class SignalMonitor {
  private activeSignals: Map<string, SignalEvent> = new Map();
  private completedSignals: SignalEvent[] = [];
  private startTime: number = Date.now();

  /**
   * Record a new signal
   */
  recordSignal(
    assetId: string,
    signal: MPSSignalData,
    currentPrice: number,
    tpLevel: number,
    slLevel: number
  ): void {
    const key = `${assetId}_${Date.now()}`;
    
    this.activeSignals.set(key, {
      assetId,
      signal: signal.signal,
      entryPrice: currentPrice,
      tpLevel,
      slLevel,
      confidence: signal.confidence,
      generatedAt: Date.now(),
      outcome: 'PENDING',
    });
  }

  /**
   * Update signal with price movement
   */
  updateSignalWithPrice(assetId: string, currentPrice: number): void {
    const assetSignals = Array.from(this.activeSignals.values()).filter(
      (s) => s.assetId === assetId && !s.outcome || s.outcome === 'PENDING'
    );

    assetSignals.forEach((signalEvent) => {
      const isBuy = signalEvent.signal.includes('BUY');
      const isSell = signalEvent.signal.includes('SELL');

      // Check if TP hit
      if (isBuy && currentPrice >= signalEvent.tpLevel && !signalEvent.tpHitAt) {
        signalEvent.tpHitAt = Date.now();
        signalEvent.outcome = 'TP_HIT';
        signalEvent.finalPrice = currentPrice;
        signalEvent.durationMs = signalEvent.tpHitAt - signalEvent.generatedAt;
      } else if (isSell && currentPrice <= signalEvent.tpLevel && !signalEvent.tpHitAt) {
        signalEvent.tpHitAt = Date.now();
        signalEvent.outcome = 'TP_HIT';
        signalEvent.finalPrice = currentPrice;
        signalEvent.durationMs = signalEvent.tpHitAt - signalEvent.generatedAt;
      }

      // Check if SL hit
      if (isBuy && currentPrice <= signalEvent.slLevel && !signalEvent.slHitAt) {
        signalEvent.slHitAt = Date.now();
        signalEvent.outcome = 'SL_HIT';
        signalEvent.finalPrice = currentPrice;
        signalEvent.durationMs = signalEvent.slHitAt - signalEvent.generatedAt;
      } else if (isSell && currentPrice >= signalEvent.slLevel && !signalEvent.slHitAt) {
        signalEvent.slHitAt = Date.now();
        signalEvent.outcome = 'SL_HIT';
        signalEvent.finalPrice = currentPrice;
        signalEvent.durationMs = signalEvent.slHitAt - signalEvent.generatedAt;
      }

      // Move to completed if outcome determined
      if (signalEvent.outcome !== 'PENDING') {
        this.completedSignals.push(signalEvent);
        this.activeSignals.delete(
          Array.from(this.activeSignals.entries()).find(([_, v]) => v === signalEvent)?.[0] || ''
        );
      }
    });
  }

  /**
   * Record signal reversal
   */
  recordReversal(assetId: string, newSignal: string): void {
    const assetSignals = Array.from(this.activeSignals.values()).filter(
      (s) => s.assetId === assetId && s.outcome === 'PENDING'
    );

    assetSignals.forEach((signalEvent) => {
      if (signalEvent.outcome === 'PENDING') {
        signalEvent.reversedAt = Date.now();
        signalEvent.outcome = 'REVERSED';
        signalEvent.durationMs = signalEvent.reversedAt - signalEvent.generatedAt;
        
        this.completedSignals.push(signalEvent);
        this.activeSignals.delete(
          Array.from(this.activeSignals.entries()).find(([_, v]) => v === signalEvent)?.[0] || ''
        );
      }
    });
  }

  /**
   * Get test results for an asset
   */
  getResults(assetId: string): SignalTestResult {
    const assetSignals = this.completedSignals.filter((s) => s.assetId === assetId);
    
    const tpHitCount = assetSignals.filter((s) => s.outcome === 'TP_HIT').length;
    const slHitCount = assetSignals.filter((s) => s.outcome === 'SL_HIT').length;
    const reversedCount = assetSignals.filter((s) => s.outcome === 'REVERSED').length;
    const pendingCount = Array.from(this.activeSignals.values()).filter(
      (s) => s.assetId === assetId
    ).length;

    const totalSignals = assetSignals.length + pendingCount;
    const tpHitRate = totalSignals > 0 ? (tpHitCount / totalSignals) * 100 : 0;

    const avgDuration = assetSignals.length > 0
      ? assetSignals.reduce((sum, s) => sum + (s.durationMs || 0), 0) / assetSignals.length
      : 0;

    const avgPips = assetSignals.length > 0
      ? assetSignals.reduce((sum, s) => sum + Math.abs(s.finalPrice! - s.entryPrice), 0) / assetSignals.length
      : 0;

    const rapidFlips = assetSignals.filter((s) => (s.durationMs || 0) < 5 * 60 * 1000).length;

    return {
      assetId,
      totalSignals,
      tpHitCount,
      slHitCount,
      reversedCount,
      pendingCount,
      tpHitRate,
      averageDurationMs: avgDuration,
      averagePipsMovement: avgPips,
      rapidFlips,
      signals: assetSignals,
    };
  }

  /**
   * Get all results
   */
  getAllResults(): SignalTestResult[] {
    const assetIds = new Set(this.completedSignals.map((s) => s.assetId));
    return Array.from(assetIds).map((assetId) => this.getResults(assetId));
  }

  /**
   * Get elapsed time since monitoring started
   */
  getElapsedTimeMs(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Generate test report
   */
  generateReport(): string {
    const results = this.getAllResults();
    const elapsedMinutes = Math.round(this.getElapsedTimeMs() / 1000 / 60);

    let report = `\n=== SIGNAL MONITORING REPORT ===\n`;
    report += `Elapsed Time: ${elapsedMinutes} minutes\n\n`;

    results.forEach((result) => {
      report += `\n--- ${result.assetId.toUpperCase()} ---\n`;
      report += `Total Signals: ${result.totalSignals}\n`;
      report += `TP Hit: ${result.tpHitCount} (${result.tpHitRate.toFixed(1)}%)\n`;
      report += `SL Hit: ${result.slHitCount}\n`;
      report += `Reversed: ${result.reversedCount}\n`;
      report += `Pending: ${result.pendingCount}\n`;
      report += `Rapid Flips (<5min): ${result.rapidFlips}\n`;
      report += `Avg Duration: ${Math.round(result.averageDurationMs / 1000)}s\n`;
      report += `Avg Pips Movement: ${result.averagePipsMovement.toFixed(2)}\n`;
    });

    return report;
  }

  /**
   * Reset monitor
   */
  reset(): void {
    this.activeSignals.clear();
    this.completedSignals = [];
    this.startTime = Date.now();
  }
}

// Export singleton instance
export const signalMonitor = new SignalMonitor();
