import * as Notifications from 'expo-notifications';
import { MPSSignalData, MPSSignalType } from '@/lib/types/trading';

/**
 * Push Notification Service
 * Handles MPS signal alerts and market notifications
 */

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Get notification token for push notifications
 */
export async function getNotificationToken(): Promise<string | null> {
  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch (error) {
    console.error('Error getting notification token:', error);
    return null;
  }
}

/**
 * Send MPS signal notification
 */
export async function sendMPSSignalNotification(
  assetSymbol: string,
  signal: MPSSignalData
): Promise<void> {
  const { title, body, color } = getSignalNotificationContent(signal);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${assetSymbol} - ${title}`,
      body: body,
      data: {
        assetSymbol,
        signal: signal.signal,
        confidence: signal.confidence,
        deepLink: `dj-banksy://asset/${assetSymbol}`,
      },
      badge: 1,
      sound: 'default',
      color: color,
    },
    trigger: null, // Send immediately
  });
}

/**
 * Send price alert notification
 */
export async function sendPriceAlertNotification(
  assetSymbol: string,
  currentPrice: number,
  targetPrice: number,
  direction: 'above' | 'below'
): Promise<void> {
  const directionText = direction === 'above' ? 'above' : 'below';

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Price Alert: ${assetSymbol}`,
      body: `${assetSymbol} is now ${directionText} ${targetPrice.toFixed(2)}. Current: ${currentPrice.toFixed(2)}`,
      data: {
        assetSymbol,
        type: 'price_alert',
        deepLink: `dj-banksy://asset/${assetSymbol}`,
      },
      badge: 1,
      sound: 'default',
    },
    trigger: null,
  });
}

/**
 * Send economic event notification
 */
export async function sendEconomicEventNotification(
  eventName: string,
  country: string,
  impact: string
): Promise<void> {
  const impactEmoji = impact === 'high' ? '🔴' : impact === 'medium' ? '🟡' : '🟢';

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${impactEmoji} Economic Event: ${eventName}`,
      body: `${country} - ${impact.toUpperCase()} impact event happening now`,
      data: {
        type: 'economic_event',
        eventName,
        country,
        impact,
        deepLink: 'dj-banksy://calendar',
      },
      badge: 1,
      sound: 'default',
    },
    trigger: null,
  });
}

/**
 * Send portfolio alert notification
 */
export async function sendPortfolioAlertNotification(
  title: string,
  message: string,
  type: 'gain' | 'loss' | 'milestone'
): Promise<void> {
  const colors: Record<string, string> = {
    gain: '#22C55E',
    loss: '#EF4444',
    milestone: '#3B82F6',
  };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: title,
      body: message,
      data: {
        type: `portfolio_${type}`,
        deepLink: 'dj-banksy://watchlist',
      },
      badge: 1,
      sound: 'default',
      color: colors[type],
    },
    trigger: null,
  });
}

/**
 * Schedule a notification for a specific time
 */
export async function scheduleNotificationAtTime(
  title: string,
  body: string,
  triggerDate: Date
): Promise<string> {
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
      badge: 1,
    },
    trigger: null,
  });

  return notificationId;
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get notification content based on signal
 */
function getSignalNotificationContent(signal: MPSSignalData): {
  title: string;
  body: string;
  color: string;
} {
  const contentMap: Record<
    MPSSignalType,
    { title: string; body: string; color: string }
  > = {
    STRONG_BUY: {
      title: '🚀 STRONG BUY',
      body: `Confidence: ${signal.confidence}% | Score: ${(signal.score * 100).toFixed(0)}`,
      color: '#22C55E',
    },
    BUY: {
      title: '📈 BUY',
      body: `Confidence: ${signal.confidence}% | Score: ${(signal.score * 100).toFixed(0)}`,
      color: '#22C55E',
    },
    HOLD: {
      title: '⏸️ HOLD',
      body: `Confidence: ${signal.confidence}% | Score: ${(signal.score * 100).toFixed(0)}`,
      color: '#F59E0B',
    },
    SELL: {
      title: '📉 SELL',
      body: `Confidence: ${signal.confidence}% | Score: ${(signal.score * 100).toFixed(0)}`,
      color: '#EF4444',
    },
    STRONG_SELL: {
      title: '💥 STRONG SELL',
      body: `Confidence: ${signal.confidence}% | Score: ${(signal.score * 100).toFixed(0)}`,
      color: '#EF4444',
    },
  };

  return contentMap[signal.signal];
}

/**
 * Listen to notification responses
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(callback);
  return () => subscription.remove();
}

/**
 * Listen to incoming notifications
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): () => void {
  const subscription = Notifications.addNotificationReceivedListener(callback);
  return () => subscription.remove();
}

export default {
  requestNotificationPermissions,
  getNotificationToken,
  sendMPSSignalNotification,
  sendPriceAlertNotification,
  sendEconomicEventNotification,
  sendPortfolioAlertNotification,
  scheduleNotificationAtTime,
  cancelNotification,
  cancelAllNotifications,
  addNotificationResponseListener,
  addNotificationReceivedListener,
};
