import * as Notifications from 'expo-notifications';
import { MPSSignalType } from '@/lib/types/trading';

/**
 * Advanced Notification Service
 * Sends detailed push notifications when 4+ timeframes align
 * Includes entry price, stop loss, take profit levels, and risk-reward ratios
 */

export interface NotificationPayload extends Record<string, unknown> {
  signalType: 'STRONG_BUY' | 'BUY' | 'SELL' | 'STRONG_SELL';
  asset: string;
  assetSymbol: string;
  entryPrice: number;
  stopLoss: number;
  takeProfitLevels: {
    tp1: { price: number; riskReward: number };
    tp2: { price: number; riskReward: number };
    tp3: { price: number; riskReward: number };
  };
  confidence: number;
  timeframesAligned: number;
  positionSize: 'LARGE' | 'MEDIUM' | 'SMALL' | 'MICRO';
  riskRewardRatio: number;
  entryStrategy: string;
  timestamp: number;
}

export class AdvancedNotificationService {
  private static notificationListener: any = null;
  private static responseListener: any = null;

  /**
   * Initialize notification handlers
   */
  static async initialize() {
    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Listen for notifications when app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );

    // Listen for notification responses (user tapped notification)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const { data } = response.notification.request.content;
        this.handleNotificationResponse(data);
      }
    );
  }

  /**
   * Send signal notification when 4+ timeframes align
   */
  static async sendSignalNotification(signal: any) {
    // Only send if 4+ timeframes aligned
    if (signal.timeframesAligned < 4) {
      return;
    }

    const payload: NotificationPayload = {
      signalType: signal.signalType,
      asset: signal.assetName,
      assetSymbol: signal.assetSymbol,
      entryPrice: signal.entryPrice,
      stopLoss: signal.stopLoss,
      takeProfitLevels: signal.takeProfitLevels,
      confidence: signal.confidence,
      timeframesAligned: signal.timeframesAligned,
      positionSize: signal.positionSize,
      riskRewardRatio: signal.riskRewardRatio,
      entryStrategy: signal.entryStrategy,
      timestamp: Date.now(),
    };

    const title = this.getNotificationTitle(signal);
    const body = this.getNotificationBody(signal);
    
    // Validate signal has required fields
    if (!signal.assetName || !signal.entryPrice || !signal.stopLoss) {
      console.warn('Invalid signal data for notification');
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: payload,
          sound: true,
          badge: 1,
        },
        trigger: null, // Send immediately
      });

      console.log(`Signal notification sent: ${title}`);
    } catch (error) {
      console.error('Failed to send signal notification:', error);
    }
  }

  /**
   * Send risk alert notification
   */
  static async sendRiskAlert(
    asset: string,
    assetSymbol: string,
    currentPrice: number,
    stopLoss: number,
    riskPercentage: number
  ) {
    const title = `⚠️ Risk Alert - ${asset}`;
    const body = `Price near stop loss: ${currentPrice.toFixed(2)} (Risk: ${riskPercentage.toFixed(1)}%)`;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'RISK_ALERT',
            asset,
            assetSymbol,
            currentPrice,
            stopLoss,
            riskPercentage,
          },
          sound: true,
          badge: 1,
          priority: 'high',
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to send risk alert:', error);
    }
  }

  /**
   * Send take profit notification
   */
  static async sendTakeProfitAlert(
    asset: string,
    assetSymbol: string,
    currentPrice: number,
    takeProfitLevel: number,
    profitPercentage: number
  ) {
    const title = `💰 Take Profit Alert - ${asset}`;
    const body = `Price reached TP level: ${currentPrice.toFixed(2)} (Profit: ${profitPercentage.toFixed(1)}%)`;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'TAKE_PROFIT_ALERT',
            asset,
            assetSymbol,
            currentPrice,
            takeProfitLevel,
            profitPercentage,
          },
          sound: true,
          badge: 1,
          priority: 'high',
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to send take profit alert:', error);
    }
  }

  /**
   * Send economic event notification
   */
  static async sendEventNotification(
    eventName: string,
    impact: 'HIGH' | 'MEDIUM' | 'LOW',
    affectedAssets: string[],
    timeUntilEvent: number
  ) {
    const impactEmoji = impact === 'HIGH' ? '🔴' : impact === 'MEDIUM' ? '🟡' : '🟢';
    const title = `${impactEmoji} Economic Event - ${eventName}`;
    const body = `Affects: ${affectedAssets.join(', ')} (in ${Math.floor(timeUntilEvent / 60)} min)`;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'ECONOMIC_EVENT',
            eventName,
            impact,
            affectedAssets,
            timeUntilEvent,
          },
          sound: true,
          badge: 1,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to send event notification:', error);
    }
  }

  /**
   * Get notification title based on signal type
   */
  private static getNotificationTitle(signal: any): string {
    const emoji =
      signal.signalType === 'STRONG_BUY'
        ? '🚀'
        : signal.signalType === 'BUY'
          ? '📈'
          : signal.signalType === 'STRONG_SELL'
            ? '💥'
            : '📉';

    return `${emoji} ${signal.signalType} - ${signal.assetName}`;
  }

  /**
   * Get notification body with key details
   */
  private static getNotificationBody(signal: any): string {
    return `Entry: ${signal.entryPrice.toFixed(2)} | SL: ${signal.stopLoss.toFixed(2)} | TP1: ${signal.takeProfitLevels.tp1.price.toFixed(2)} | RR: 1:${signal.riskRewardRatio.toFixed(1)} | Confidence: ${signal.confidence}%`;
  }

  /**
   * Handle notification response (user tapped notification)
   */
  private static handleNotificationResponse(data: any) {
    console.log('Notification tapped:', data);

    // Navigate to asset detail screen or signal detail screen
    if (data.assetSymbol) {
      // This would be handled by your navigation system
      // Example: navigation.navigate('AssetDetail', { symbol: data.assetSymbol })
    }
  }

  /**
   * Clean up notification listeners
   */
  static cleanup() {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }

  /**
   * Request notification permissions
   */
  static async requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Check if notifications are enabled
   */
  static async areNotificationsEnabled(): Promise<boolean> {
    const settings = await Notifications.getPermissionsAsync();
    return settings.granted;
  }
}
