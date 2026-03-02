/**
 * Continuous Signal Monitor
 * 
 * Runs continuously in the background to:
 * 1. Monitor all trading signals
 * 2. Detect anomalies (rapid flips, TP not hit, etc.)
 * 3. Log alerts to a file
 * 4. Generate periodic reports
 */

import { signalMonitor } from './signal-monitor';
import { generateMockMPSSignal, generateMockCandles } from './mock-data';
import { tpslCalculator } from './tp-sl-calculator';
import { getMarketOverview } from './market-data-service';
import { TRADING_ASSETS } from '@/lib/constants/assets';
import * as fs from 'fs';
import * as path from 'path';

export interface MonitoringConfig {
  checkIntervalSeconds: number;
  reportIntervalMinutes: number;
  alertThresholds: {
    rapidFlipThresholdMs: number; // Alert if signal flips within this time
    tpHitRateThreshold: number; // Alert if TP hit rate below this %
    maxConsecutiveFlips: number; // Alert if this many flips in a row
  };
  logFilePath: string;
}

const DEFAULT_CONFIG: MonitoringConfig = {
  checkIntervalSeconds: 5,
  reportIntervalMinutes: 15,
  alertThresholds: {
    rapidFlipThresholdMs: 5 * 60 * 1000, // 5 minutes
    tpHitRateThreshold: 60, // 60%
    maxConsecutiveFlips: 3,
  },
  logFilePath: '/tmp/banksy-signal-monitor.log',
};

export class ContinuousSignalMonitor {
  private config: MonitoringConfig;
  private isRunning: boolean = false;
  private lastSignals: Record<string, any> = {};
  private consecutiveFlips: Record<string, number> = {};
  private lastReportTime: number = Date.now();

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeLogFile();
  }

  /**
   * Initialize log file
   */
  private initializeLogFile(): void {
    const timestamp = new Date().toISOString();
    const header = `\n${'='.repeat(80)}\nBANKSY CONTINUOUS SIGNAL MONITORING\nStarted: ${timestamp}\n${'='.repeat(80)}\n`;
    fs.appendFileSync(this.config.logFilePath, header);
  }

  /**
   * Log a message
   */
  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(this.config.logFilePath, logMessage);
    console.log(logMessage);
  }

  /**
   * Start continuous monitoring
   */
  async startMonitoring(): Promise<void> {
    this.log('🚀 Starting continuous signal monitoring...');
    this.isRunning = true;

    while (this.isRunning) {
      try {
        await this.performCheck();

        // Check if it's time to generate a report
        if (Date.now() - this.lastReportTime >= this.config.reportIntervalMinutes * 60 * 1000) {
          this.generateReport();
          this.lastReportTime = Date.now();
        }

        // Wait before next check
        await new Promise((resolve) =>
          setTimeout(resolve, this.config.checkIntervalSeconds * 1000)
        );
      } catch (error) {
        this.log(`❌ Error during monitoring: ${error}`);
      }
    }
  }

  /**
   * Perform a single monitoring check
   */
  private async performCheck(): Promise<void> {
    try {
      const prices = await getMarketOverview();

      for (const asset of TRADING_ASSETS) {
        const price = prices[asset.id];
        if (!price) continue;

        const signal = generateMockMPSSignal(asset.id);
        const candles = generateMockCandles(100);
        const tpsl = tpslCalculator.calculateTPSL(
          signal.signal.includes('BUY') ? 'BUY' : 'SELL',
          price.price,
          candles
        );

        // Check for signal changes
        const lastSignal = this.lastSignals[asset.id];
        if (lastSignal && lastSignal.signal !== signal.signal) {
          // Signal flipped
          const flipDuration = Date.now() - lastSignal.timestamp;
          this.consecutiveFlips[asset.id] = (this.consecutiveFlips[asset.id] || 0) + 1;

          // Check for rapid flip
          if (flipDuration < this.config.alertThresholds.rapidFlipThresholdMs) {
            this.log(
              `⚠️  RAPID FLIP: ${asset.id.toUpperCase()} - ${lastSignal.signal} → ${signal.signal} in ${Math.round(flipDuration / 1000)}s`
            );
          }

          // Check for consecutive flips
          if (this.consecutiveFlips[asset.id] >= this.config.alertThresholds.maxConsecutiveFlips) {
            this.log(
              `🚨 ALERT: ${asset.id.toUpperCase()} - ${this.consecutiveFlips[asset.id]} consecutive flips detected!`
            );
          }
        } else if (lastSignal && lastSignal.signal === signal.signal) {
          // Signal stable
          this.consecutiveFlips[asset.id] = 0;
        }

        // Update signal tracking
        signalMonitor.recordSignal(
          asset.id,
          signal,
          price.price,
          tpsl.takeProfit1,
          tpsl.stopLoss
        );

        signalMonitor.updateSignalWithPrice(asset.id, price.price);

        // Update last signal
        this.lastSignals[asset.id] = {
          signal: signal.signal,
          timestamp: Date.now(),
          price: price.price,
        };
      }
    } catch (error) {
      // Silently handle errors during check
    }
  }

  /**
   * Generate periodic report
   */
  private generateReport(): void {
    const results = signalMonitor.getAllResults();
    const timestamp = new Date().toISOString();

    let report = `\n${'='.repeat(80)}\n📊 PERIODIC REPORT - ${timestamp}\n${'='.repeat(80)}\n`;

    results.forEach((result) => {
      report += `\n${result.assetId.toUpperCase()}:\n`;
      report += `  Total Signals: ${result.totalSignals}\n`;
      report += `  TP Hit Rate: ${result.tpHitRate.toFixed(1)}%\n`;
      report += `  Rapid Flips: ${result.rapidFlips}\n`;
      report += `  Avg Duration: ${Math.round(result.averageDurationMs / 1000)}s\n`;

      // Check for alerts
      if (result.tpHitRate < this.config.alertThresholds.tpHitRateThreshold) {
        report += `  🚨 ALERT: TP Hit Rate below ${this.config.alertThresholds.tpHitRateThreshold}%\n`;
      }

      if (result.rapidFlips > 5) {
        report += `  🚨 ALERT: High number of rapid flips (${result.rapidFlips})\n`;
      }
    });

    this.log(report);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.log('⛔ Stopping continuous signal monitoring');
    this.isRunning = false;
  }

  /**
   * Get log file path
   */
  getLogFilePath(): string {
    return this.config.logFilePath;
  }

  /**
   * Get current status
   */
  getStatus(): string {
    return this.isRunning ? 'RUNNING' : 'STOPPED';
  }
}

// Export singleton instance
export const continuousMonitor = new ContinuousSignalMonitor();
