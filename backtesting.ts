/**
 * Signal Test Runner
 * 
 * Runs a 1-hour test monitoring signals against real market data
 * Records all signal events and generates a detailed report
 */

import { signalMonitor } from './signal-monitor';
import { generateMockMPSSignal, generateMockCandles } from './mock-data';
import { tpslCalculator } from './tp-sl-calculator';
import { getMarketOverview } from './market-data-service';
import { TRADING_ASSETS } from '@/lib/constants/assets';

export interface TestConfig {
  durationMinutes: number;
  checkIntervalSeconds: number;
  logInterval: number; // Log every N checks
}

const DEFAULT_CONFIG: TestConfig = {
  durationMinutes: 60,
  checkIntervalSeconds: 5,
  logInterval: 12, // Log every 60 seconds
};

export class SignalTestRunner {
  private config: TestConfig;
  private isRunning: boolean = false;
  private lastSignals: Record<string, any> = {};

  constructor(config: Partial<TestConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start the 1-hour test
   */
  async startTest(): Promise<void> {
    console.log('\n🚀 Starting Signal Test Runner...');
    console.log(`Duration: ${this.config.durationMinutes} minutes`);
    console.log(`Check Interval: ${this.config.checkIntervalSeconds}s`);
    console.log('='.repeat(60));

    this.isRunning = true;
    signalMonitor.reset();

    const startTime = Date.now();
    const endTime = startTime + this.config.durationMinutes * 60 * 1000;
    let checkCount = 0;

    while (Date.now() < endTime && this.isRunning) {
      checkCount++;

      try {
        // Fetch current market data
        const prices = await getMarketOverview();

        // Check each asset
        for (const asset of TRADING_ASSETS) {
          const price = prices[asset.id];
          if (!price) continue;

          // Generate new signal
          const signal = generateMockMPSSignal(asset.id);
          const candles = generateMockCandles(100);
          const tpsl = tpslCalculator.calculateTPSL(
            signal.signal.includes('BUY') ? 'BUY' : 'SELL',
            price.price,
            candles
          );

          // Check if signal changed from last check
          const lastSignal = this.lastSignals[asset.id];
          if (!lastSignal) {
            // First signal for this asset
            signalMonitor.recordSignal(
              asset.id,
              signal,
              price.price,
              tpsl.takeProfit1,
              tpsl.stopLoss
            );
            this.lastSignals[asset.id] = signal.signal;
          } else if (lastSignal !== signal.signal) {
            // Signal reversed
            signalMonitor.recordReversal(asset.id, signal.signal);
            signalMonitor.recordSignal(
              asset.id,
              signal,
              price.price,
              tpsl.takeProfit1,
              tpsl.stopLoss
            );
            this.lastSignals[asset.id] = signal.signal;
          }

          // Update with current price
          signalMonitor.updateSignalWithPrice(asset.id, price.price);
        }

        // Log progress
        if (checkCount % this.config.logInterval === 0) {
          const elapsedMinutes = Math.round(signalMonitor.getElapsedTimeMs() / 1000 / 60);
          console.log(`\n⏱️  ${elapsedMinutes}/${this.config.durationMinutes} minutes elapsed`);
          console.log(signalMonitor.generateReport());
        }

        // Wait before next check
        await new Promise((resolve) =>
          setTimeout(resolve, this.config.checkIntervalSeconds * 1000)
        );
      } catch (error) {
        console.error('Error during test iteration:', error);
      }
    }

    this.isRunning = false;
    this.generateFinalReport();
  }

  /**
   * Stop the test
   */
  stopTest(): void {
    this.isRunning = false;
    console.log('\n⛔ Test stopped by user');
    this.generateFinalReport();
  }

  /**
   * Generate final test report
   */
  private generateFinalReport(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL TEST REPORT');
    console.log('='.repeat(60));
    console.log(signalMonitor.generateReport());

    // Additional analysis
    const results = signalMonitor.getAllResults();
    const totalSignals = results.reduce((sum, r) => sum + r.totalSignals, 0);
    const totalTpHits = results.reduce((sum, r) => sum + r.tpHitCount, 0);
    const totalRapidFlips = results.reduce((sum, r) => sum + r.rapidFlips, 0);

    console.log('\n📈 SUMMARY STATISTICS');
    console.log('-'.repeat(60));
    console.log(`Total Signals Generated: ${totalSignals}`);
    console.log(`Total TP Hits: ${totalTpHits} (${((totalTpHits / totalSignals) * 100).toFixed(1)}%)`);
    console.log(`Total Rapid Flips (<5min): ${totalRapidFlips}`);
    console.log(`Average TP Hit Rate: ${(results.reduce((sum, r) => sum + r.tpHitRate, 0) / results.length).toFixed(1)}%`);

    // Identify problem assets
    const problemAssets = results.filter((r) => r.tpHitRate < 50 || r.rapidFlips > 5);
    if (problemAssets.length > 0) {
      console.log('\n⚠️  PROBLEM ASSETS (TP Hit Rate <50% or Rapid Flips >5)');
      console.log('-'.repeat(60));
      problemAssets.forEach((asset) => {
        console.log(`${asset.assetId}: ${asset.tpHitRate.toFixed(1)}% TP Hit Rate, ${asset.rapidFlips} Rapid Flips`);
      });
    }

    console.log('\n' + '='.repeat(60));
  }

  /**
   * Get current test results
   */
  getResults() {
    return signalMonitor.getAllResults();
  }

  /**
   * Export results to JSON
   */
  exportResults(): string {
    return JSON.stringify(signalMonitor.getAllResults(), null, 2);
  }
}

// Export function to start test
export async function runSignalTest(durationMinutes: number = 60): Promise<void> {
  const runner = new SignalTestRunner({ durationMinutes });
  await runner.startTest();
}
