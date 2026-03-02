/**
 * Signal Confirmation Engine
 * 
 * Implements strict 4+ indicator confirmation to reduce false signals
 * Only shows signals when multiple indicators agree
 */

import { MPSSignalData } from '@/lib/types/trading';

// Component type
interface IndicatorComponent {
  value: number;
  description: string;
}

// ============================================================================
// TYPES
// ============================================================================

export interface ConfirmationResult {
  isConfirmed: boolean;
  confirmationScore: number; // 0-100%
  agreementCount: number; // How many indicators agree
  requiredAgreement: number; // Minimum required (typically 4)
  componentStatuses: {
    trend: boolean;
    momentum: boolean;
    structure: boolean;
    risk: boolean;
  };
  reason: string;
}

export interface SignalQualityMetrics {
  falseSignalRate: number; // Target: <5%
  confirmationRate: number; // % of signals that pass 4+ confirmation
  averageConfirmationScore: number;
  strongSignalRate: number; // % of signals with 100% agreement
}

// ============================================================================
// SIGNAL CONFIRMATION ENGINE
// ============================================================================

export class SignalConfirmationEngine {
  private requiredAgreement: number = 4; // Minimum indicators that must agree
  private minConfidenceThreshold: number = 75; // Min confidence to show signal

  constructor(requiredAgreement: number = 4, minConfidence: number = 75) {
    this.requiredAgreement = requiredAgreement;
    this.minConfidenceThreshold = minConfidence;
  }

  /**
   * Confirm a signal based on indicator agreement
   */
  confirmSignal(signal: MPSSignalData): ConfirmationResult {
    const components = signal.components;

    // Determine direction (bullish or bearish)
    const isBullish = signal.signal.includes('BUY');

    // Check each component for agreement
    const trendAgrees = this.componentAgrees(components.trend, isBullish);
    const momentumAgrees = this.componentAgrees(components.momentum, isBullish);
    const structureAgrees = this.componentAgrees(components.structure, isBullish);
    const riskAgrees = this.componentAgrees(components.risk, isBullish);

    const componentStatuses = {
      trend: trendAgrees,
      momentum: momentumAgrees,
      structure: structureAgrees,
      risk: riskAgrees,
    };

    // Count agreements
    const agreementCount = Object.values(componentStatuses).filter(Boolean).length;

    // Calculate confirmation score (0-100%)
    const confirmationScore = (agreementCount / 4) * 100;

    // Check if signal meets confirmation threshold
    const isConfirmed =
      agreementCount >= this.requiredAgreement &&
      signal.confidence >= this.minConfidenceThreshold;

    // Generate reason
    const reason = this.generateReason(
      isConfirmed,
      agreementCount,
      signal.confidence,
      componentStatuses
    );

    return {
      isConfirmed,
      confirmationScore,
      agreementCount,
      requiredAgreement: this.requiredAgreement,
      componentStatuses,
      reason,
    };
  }

  /**
   * Check if a component agrees with the signal direction
   */
  private componentAgrees(
    component: IndicatorComponent,
    isBullish: boolean
  ): boolean {
    // Component value > 0 means bullish, < 0 means bearish
    const componentIsBullish = component.value > 0;

    // Agreement when directions match
    return componentIsBullish === isBullish;
  }

  /**
   * Generate human-readable confirmation reason
   */
  private generateReason(
    isConfirmed: boolean,
    agreementCount: number,
    confidence: number,
    componentStatuses: Record<string, boolean>
  ): string {
    if (!isConfirmed) {
      if (agreementCount < this.requiredAgreement) {
        const agreeing = Object.entries(componentStatuses)
          .filter(([, agrees]) => agrees)
          .map(([name]) => name)
          .join(', ');

        return `Only ${agreementCount}/${this.requiredAgreement} indicators agree (${agreeing}). Need ${this.requiredAgreement}+ for confirmation.`;
      }

      if (confidence < this.minConfidenceThreshold) {
        return `Confidence ${confidence}% below minimum ${this.minConfidenceThreshold}%. Signal too weak.`;
      }

      return 'Signal does not meet confirmation criteria.';
    }

    if (agreementCount === 4) {
      return 'Perfect alignment: All 4 indicators agree. Strong signal.';
    }

    return `${agreementCount} indicators confirm. Confidence: ${confidence}%.`;
  }

  /**
   * Filter signals - only return confirmed ones
   */
  filterSignals(
    signals: Record<string, MPSSignalData>
  ): Record<string, { signal: MPSSignalData; confirmation: ConfirmationResult }> {
    const filtered: Record<
      string,
      { signal: MPSSignalData; confirmation: ConfirmationResult }
    > = {};

    for (const [assetId, signal] of Object.entries(signals)) {
      const confirmation = this.confirmSignal(signal);

      if (confirmation.isConfirmed) {
        filtered[assetId] = { signal, confirmation };
      }
    }

    return filtered;
  }

  /**
   * Calculate signal quality metrics
   */
  calculateQualityMetrics(
    allSignals: MPSSignalData[],
    confirmedSignals: MPSSignalData[]
  ): SignalQualityMetrics {
    if (allSignals.length === 0) {
      return {
        falseSignalRate: 0,
        confirmationRate: 0,
        averageConfirmationScore: 0,
        strongSignalRate: 0,
      };
    }

    // Calculate confirmation rate
    const confirmationRate = (confirmedSignals.length / allSignals.length) * 100;

    // Calculate average confirmation score
    const confirmationScores = confirmedSignals.map((signal) => {
      const confirmation = this.confirmSignal(signal);
      return confirmation.confirmationScore;
    });

    const averageConfirmationScore =
      confirmationScores.length > 0
        ? confirmationScores.reduce((a, b) => a + b, 0) /
          confirmationScores.length
        : 0;

    // Calculate strong signal rate (100% agreement)
    const strongSignals = confirmedSignals.filter((signal) => {
      const confirmation = this.confirmSignal(signal);
      return confirmation.agreementCount === 4;
    });

    const strongSignalRate = (strongSignals.length / confirmedSignals.length) * 100 || 0;

    // Estimate false signal rate (inverse of confirmation rate)
    const falseSignalRate = 100 - confirmationRate;

    return {
      falseSignalRate,
      confirmationRate,
      averageConfirmationScore,
      strongSignalRate,
    };
  }

  /**
   * Get confirmation status for display
   */
  getConfirmationStatus(confirmation: ConfirmationResult): {
    label: string;
    color: string;
    icon: string;
  } {
    if (confirmation.agreementCount === 4) {
      return {
        label: 'Perfect',
        color: '#22C55E', // Green
        icon: '✓✓✓✓',
      };
    }

    if (confirmation.agreementCount === 3) {
      return {
        label: 'Strong',
        color: '#3B82F6', // Blue
        icon: '✓✓✓',
      };
    }

    if (confirmation.agreementCount === 2) {
      return {
        label: 'Weak',
        color: '#F59E0B', // Amber
        icon: '✓✓',
      };
    }

    return {
      label: 'Rejected',
      color: '#EF4444', // Red
      icon: '✗',
    };
  }

  /**
   * Set minimum confidence threshold
   */
  setMinConfidenceThreshold(threshold: number): void {
    this.minConfidenceThreshold = Math.max(0, Math.min(100, threshold));
  }

  /**
   * Set required agreement count
   */
  setRequiredAgreement(count: number): void {
    this.requiredAgreement = Math.max(1, Math.min(4, count));
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const signalConfirmationEngine = new SignalConfirmationEngine(4, 75);
