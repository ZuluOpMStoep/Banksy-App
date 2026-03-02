/**
 * Real-Time Update Engine
 * 
 * Provides WebSocket-like real-time updates for trading signals
 * Simulates sub-second latency for development
 */

import { MPSSignalData, ChartCandle } from '@/lib/types/trading';

// ============================================================================
// TYPES
// ============================================================================

export interface RealtimeUpdate {
  assetId: string;
  signal: MPSSignalData;
  previousSignal: MPSSignalData | null;
  changed: boolean;
  changeReason: string;
  timestamp: number;
  latency: number; // milliseconds
}

export interface UpdateListener {
  (update: RealtimeUpdate): void;
}

// ============================================================================
// REAL-TIME UPDATE ENGINE
// ============================================================================

export class RealtimeUpdateEngine {
  private listeners: Map<string, Set<UpdateListener>> = new Map();
  private updateIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private lastSignals: Map<string, MPSSignalData> = new Map();
  private isConnected: boolean = false;
  private updateFrequency: number = 5000; // 5 seconds

  /**
   * Connect to real-time updates
   */
  connect(): void {
    if (this.isConnected) return;
    this.isConnected = true;
  }

  /**
   * Disconnect from real-time updates
   */
  disconnect(): void {
    this.isConnected = false;
    this.updateIntervals.forEach((interval) => clearInterval(interval));
    this.updateIntervals.clear();
  }

  /**
   * Subscribe to signal updates for an asset
   */
  subscribe(assetId: string, listener: UpdateListener): () => void {
    if (!this.listeners.has(assetId)) {
      this.listeners.set(assetId, new Set());
    }

    this.listeners.get(assetId)!.add(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(assetId);
      if (listeners) {
        listeners.delete(listener);
      }
    };
  }

  /**
   * Publish signal update
   */
  publishUpdate(update: RealtimeUpdate): void {
    if (!this.isConnected) return;

    const listeners = this.listeners.get(update.assetId);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(update);
        } catch (error) {
          console.error('Error in update listener:', error);
        }
      });
    }
  }

  /**
   * Start real-time updates for an asset
   */
  startUpdates(assetId: string, signalGenerator: () => MPSSignalData): void {
    if (this.updateIntervals.has(assetId)) return;

    const interval = setInterval(() => {
      if (!this.isConnected) return;

      const newSignal = signalGenerator();
      const previousSignal = this.lastSignals.get(assetId) || null;

      // Detect signal change
      const changed = previousSignal ? previousSignal.signal !== newSignal.signal : true;
      const changeReason = this.getChangeReason(previousSignal, newSignal);

      // Simulate realistic latency (10-50ms)
      const latency = Math.random() * 40 + 10;

      const update: RealtimeUpdate = {
        assetId,
        signal: newSignal,
        previousSignal,
        changed,
        changeReason,
        timestamp: Date.now(),
        latency,
      };

      this.lastSignals.set(assetId, newSignal);
      this.publishUpdate(update);
    }, this.updateFrequency);

    this.updateIntervals.set(assetId, interval);
  }

  /**
   * Stop real-time updates for an asset
   */
  stopUpdates(assetId: string): void {
    const interval = this.updateIntervals.get(assetId);
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(assetId);
    }
  }

  /**
   * Determine why signal changed
   */
  private getChangeReason(
    previousSignal: MPSSignalData | null,
    newSignal: MPSSignalData
  ): string {
    if (!previousSignal) return 'Initial signal';

    // Check which component changed most
    const trendChange = Math.abs(
      newSignal.components.trend.value - previousSignal.components.trend.value
    );
    const momentumChange = Math.abs(
      newSignal.components.momentum.value - previousSignal.components.momentum.value
    );
    const structureChange = Math.abs(
      newSignal.components.structure.value - previousSignal.components.structure.value
    );
    const riskChange = Math.abs(
      newSignal.components.risk.value - previousSignal.components.risk.value
    );

    const changes = [
      { component: 'Trend', change: trendChange },
      { component: 'Momentum', change: momentumChange },
      { component: 'Structure', change: structureChange },
      { component: 'Risk', change: riskChange },
    ];

    const largest = changes.reduce((max, curr) =>
      curr.change > max.change ? curr : max
    );

    return `${largest.component} shifted (${largest.change.toFixed(2)})`;
  }

  /**
   * Get connection status
   */
  isConnectedStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Set update frequency
   */
  setUpdateFrequency(frequency: number): void {
    this.updateFrequency = Math.max(1000, frequency); // Minimum 1 second
  }

  /**
   * Get current signal for asset
   */
  getCurrentSignal(assetId: string): MPSSignalData | null {
    return this.lastSignals.get(assetId) || null;
  }

  /**
   * Get all current signals
   */
  getAllCurrentSignals(): Record<string, MPSSignalData> {
    const signals: Record<string, MPSSignalData> = {};
    this.lastSignals.forEach((signal, assetId) => {
      signals[assetId] = signal;
    });
    return signals;
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const realtimeUpdateEngine = new RealtimeUpdateEngine();
