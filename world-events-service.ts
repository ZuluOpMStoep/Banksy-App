/**
 * Signal Stabilizer
 * 
 * Wraps signal generation to enforce stability rules:
 * 1. Signal caching - same signal for 5 minutes minimum
 * 2. Minimum pip movement - require price movement before reversal
 * 3. Signal locking - lock signals for 15-30 minutes
 */

import { MPSSignalData } from '@/lib/types/trading';

export interface StabilizedSignal {
  signal: MPSSignalData;
  isStable: boolean;
  reason: string;
  lockedUntil?: number;
  minPipsRequired?: number;
}

export interface AssetSignalState {
  lastSignal: string;
  lastPrice: number;
  lastGeneratedAt: number;
  lockedUntil: number;
  minPipsRequired: number;
}

const SIGNAL_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes - don't change signals more than this
const SIGNAL_LOCK_DURATION = 15 * 60 * 1000; // 15 minutes - lock signals for this duration
const MIN_PIPS_MOVEMENT: Record<string, number> = {
  gold: 0.50,
  silver: 0.10,
  bitcoin: 50,
  eur_usd: 0.0050,
  gbp_usd: 0.0050,
  usd_jpy: 0.50,
  aud_usd: 0.0050,
  dax: 50,
};

export class SignalStabilizer {
  private assetStates: Map<string, AssetSignalState> = new Map();
  private signalCache: Map<string, { signal: string; timestamp: number }> = new Map();

  /**
   * Stabilize a signal based on stability rules
   */
  stabilizeSignal(
    assetId: string,
    newSignal: MPSSignalData,
    currentPrice: number
  ): StabilizedSignal {
    const now = Date.now();
    const state = this.assetStates.get(assetId);

    // First signal for this asset
    if (!state) {
      this.assetStates.set(assetId, {
        lastSignal: newSignal.signal,
        lastPrice: currentPrice,
        lastGeneratedAt: now,
        lockedUntil: now + SIGNAL_LOCK_DURATION,
        minPipsRequired: MIN_PIPS_MOVEMENT[assetId] || 50,
      });

      this.signalCache.set(assetId, {
        signal: newSignal.signal,
        timestamp: now,
      });

      return {
        signal: newSignal,
        isStable: true,
        reason: 'First signal for asset',
      };
    }

    // Check if signal is locked
    if (now < state.lockedUntil) {
      const timeRemaining = Math.round((state.lockedUntil - now) / 1000 / 60);
      
      // Same direction - allow update if confidence is higher
      if (state.lastSignal === newSignal.signal) {
      return {
        signal: { ...newSignal, signal: state.lastSignal as any },
        isStable: true,
        reason: `Signal locked for ${timeRemaining} more minutes (same direction)`,
        lockedUntil: state.lockedUntil,
      };
      }

      // Different direction - check for minimum pip movement
      const priceDifference = Math.abs(currentPrice - state.lastPrice);
      if (priceDifference < state.minPipsRequired) {
        return {
          signal: { ...newSignal, signal: state.lastSignal as any },
          isStable: false,
          reason: `Signal locked. Need ${state.minPipsRequired} pips movement, got ${priceDifference.toFixed(2)}`,
          lockedUntil: state.lockedUntil,
          minPipsRequired: state.minPipsRequired,
        };
      }

      // Minimum pips met - allow reversal
      this.updateAssetState(assetId, newSignal.signal, currentPrice, now);
      return {
        signal: newSignal,
        isStable: true,
        reason: `Signal reversed after ${priceDifference.toFixed(2)} pips movement`,
      };
    }

    // Lock duration expired - check cache
    const cached = this.signalCache.get(assetId);
    if (cached && now - cached.timestamp < SIGNAL_CACHE_DURATION) {
      // Return cached signal
      return {
        signal: { ...newSignal, signal: cached.signal as any },
        isStable: true,
        reason: 'Using cached signal (within 5-minute window)',
      };
    }

    // Cache expired - allow new signal
    this.updateAssetState(assetId, newSignal.signal as any, currentPrice, now);
    this.signalCache.set(assetId, {
      signal: newSignal.signal as any,
      timestamp: now,
    });

    return {
      signal: { ...newSignal },
      isStable: true,
      reason: 'New signal accepted (cache expired)',
    };
  }

  /**
   * Update asset state after signal change
   */
  private updateAssetState(assetId: string, signal: string, price: number, timestamp: number): void {
    this.assetStates.set(assetId, {
      lastSignal: signal,
      lastPrice: price,
      lastGeneratedAt: timestamp,
      lockedUntil: timestamp + SIGNAL_LOCK_DURATION,
      minPipsRequired: MIN_PIPS_MOVEMENT[assetId] || 50,
    });
  }

  /**
   * Get current state for an asset
   */
  getAssetState(assetId: string): AssetSignalState | undefined {
    return this.assetStates.get(assetId);
  }

  /**
   * Reset all states
   */
  reset(): void {
    this.assetStates.clear();
    this.signalCache.clear();
  }

  /**
   * Get time remaining for signal lock (in seconds)
   */
  getTimeRemainingForLock(assetId: string): number {
    const state = this.assetStates.get(assetId);
    if (!state) return 0;

    const remaining = state.lockedUntil - Date.now();
    return Math.max(0, Math.ceil(remaining / 1000));
  }

  /**
   * Get statistics
   */
  getStatistics(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    this.assetStates.forEach((state, assetId) => {
      stats[assetId] = {
        lastSignal: state.lastSignal,
        lastPrice: state.lastPrice,
        lockedForSeconds: this.getTimeRemainingForLock(assetId),
        minPipsRequired: state.minPipsRequired,
      };
    });

    return stats;
  }
}

// Export singleton instance
export const signalStabilizer = new SignalStabilizer();
