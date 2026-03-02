/**
 * Signal Stability Service
 * 
 * Prevents rapid signal flipping by:
 * 1. Locking signals for a minimum duration
 * 2. Requiring minimum pip movement for reversals
 * 3. Tracking signal history and persistence
 */

import { MPSSignalData } from '@/lib/types/trading';

export interface SignalLock {
  signal: string; // Current locked signal (BUY, SELL, HOLD)
  lockedAt: number; // Timestamp when signal was locked
  lockedUntil: number; // Timestamp when signal can be reversed
  entryPrice: number; // Price when signal was generated
  confidence: number; // Confidence of locked signal
  minPipMovement: number; // Minimum pips required to reverse
}

export interface PipMovementConfig {
  [assetId: string]: number; // Minimum pips for each asset
}

/**
 * Default minimum pip movements for each asset
 * These prevent noise-based signals
 */
const DEFAULT_PIP_MOVEMENTS: PipMovementConfig = {
  gold: 0.50, // $0.50 for Gold
  silver: 0.10, // $0.10 for Silver
  bitcoin: 50, // $50 for Bitcoin
  eur_usd: 0.0050, // 50 pips for EUR/USD
  gbp_usd: 0.0050, // 50 pips for GBP/USD
  usd_jpy: 0.50, // 50 pips for USD/JPY
  aud_usd: 0.0050, // 50 pips for AUD/USD
  dax: 50, // 50 pips for DAX
};

/**
 * Default signal lock duration (15 minutes)
 * Signals are locked for at least this duration before reversal is allowed
 */
const DEFAULT_LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export class SignalStabilityService {
  private signalLocks: Map<string, SignalLock> = new Map();
  private lockDurationMs: number;
  private pipMovements: PipMovementConfig;

  constructor(
    lockDurationMs: number = DEFAULT_LOCK_DURATION_MS,
    pipMovements: PipMovementConfig = DEFAULT_PIP_MOVEMENTS
  ) {
    this.lockDurationMs = lockDurationMs;
    this.pipMovements = pipMovements;
  }

  /**
   * Check if a new signal should be accepted or if current signal is still locked
   */
  shouldAcceptNewSignal(
    assetId: string,
    newSignal: MPSSignalData,
    currentPrice: number
  ): {
    shouldAccept: boolean;
    reason: string;
    lockedSignal?: SignalLock;
  } {
    const lock = this.signalLocks.get(assetId);

    // No existing lock - accept new signal
    if (!lock) {
      return {
        shouldAccept: true,
        reason: 'No existing signal lock',
      };
    }

    // Check if lock duration has expired
    const now = Date.now();
    if (now >= lock.lockedUntil) {
      // Lock expired - check for minimum pip movement
      return this.checkPipMovement(assetId, lock, newSignal, currentPrice);
    }

    // Lock still active - check if signal direction changed
    const newDirection = newSignal.signal.includes('BUY') ? 'BUY' : 'SELL';
    const lockedDirection = lock.signal.includes('BUY') ? 'BUY' : 'SELL';

    if (newDirection !== lockedDirection) {
      // Trying to reverse signal while locked
      const timeRemaining = Math.ceil((lock.lockedUntil - now) / 1000 / 60); // minutes
      return {
        shouldAccept: false,
        reason: `Signal locked for ${timeRemaining} more minutes. Reversal not allowed yet.`,
        lockedSignal: lock,
      };
    }

    // Same direction - accept if confidence is higher
    if (newSignal.confidence > lock.confidence) {
      return {
        shouldAccept: true,
        reason: 'Same direction with higher confidence',
      };
    }

    return {
      shouldAccept: false,
      reason: 'Signal locked and new signal has lower confidence',
      lockedSignal: lock,
    };
  }

  /**
   * Check if price has moved minimum pips required for reversal
   */
  private checkPipMovement(
    assetId: string,
    lock: SignalLock,
    newSignal: MPSSignalData,
    currentPrice: number
  ): {
    shouldAccept: boolean;
    reason: string;
    lockedSignal?: SignalLock;
  } {
    const minPips = this.pipMovements[assetId] || 50;
    const priceDifference = Math.abs(currentPrice - lock.entryPrice);

    if (priceDifference >= minPips) {
      return {
        shouldAccept: true,
        reason: `Minimum pip movement (${priceDifference.toFixed(2)} pips) exceeded`,
      };
    }

    return {
      shouldAccept: false,
      reason: `Minimum pip movement not met. Need ${minPips} pips, got ${priceDifference.toFixed(2)}`,
      lockedSignal: lock,
    };
  }

  /**
   * Lock a new signal
   */
  lockSignal(assetId: string, signal: MPSSignalData, currentPrice: number): void {
    const now = Date.now();
    const minPips = this.pipMovements[assetId] || 50;

    this.signalLocks.set(assetId, {
      signal: signal.signal,
      lockedAt: now,
      lockedUntil: now + this.lockDurationMs,
      entryPrice: currentPrice,
      confidence: signal.confidence,
      minPipMovement: minPips,
    });
  }

  /**
   * Get current locked signal for an asset
   */
  getLockedSignal(assetId: string): SignalLock | undefined {
    return this.signalLocks.get(assetId);
  }

  /**
   * Clear signal lock (manual reset)
   */
  clearLock(assetId: string): void {
    this.signalLocks.delete(assetId);
  }

  /**
   * Clear all locks
   */
  clearAllLocks(): void {
    this.signalLocks.clear();
  }

  /**
   * Get lock status for all assets
   */
  getLockStatus(): Record<string, SignalLock | undefined> {
    const status: Record<string, SignalLock | undefined> = {};
    const assetIds = ['gold', 'silver', 'bitcoin', 'eur_usd', 'gbp_usd', 'usd_jpy', 'aud_usd', 'dax'];

    assetIds.forEach((assetId) => {
      status[assetId] = this.signalLocks.get(assetId);
    });

    return status;
  }

  /**
   * Get time remaining for signal lock (in seconds)
   */
  getTimeRemainingForLock(assetId: string): number {
    const lock = this.signalLocks.get(assetId);
    if (!lock) return 0;

    const remaining = lock.lockedUntil - Date.now();
    return Math.max(0, Math.ceil(remaining / 1000));
  }

  /**
   * Update pip movement thresholds
   */
  updatePipMovements(pipMovements: Partial<PipMovementConfig>): void {
    this.pipMovements = { ...this.pipMovements, ...(pipMovements as PipMovementConfig) };
  }

  /**
   * Update lock duration
   */
  updateLockDuration(durationMs: number): void {
    this.lockDurationMs = durationMs;
  }
}

// Export singleton instance
export const signalStabilityService = new SignalStabilityService();
