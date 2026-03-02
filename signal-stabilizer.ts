/**
 * RevenueCat Integration Service
 * Manages in-app subscriptions for iOS and Android
 * Handles purchases, renewals, and subscription status
 */

import { Platform } from 'react-native';

export interface RevenueCatConfig {
  apiKey: string;
  userId: string;
}

export interface PurchaseInfo {
  productId: string;
  purchaseDate: number;
  expirationDate?: number;
  isActive: boolean;
  isSandbox: boolean;
}

export interface CustomerInfo {
  userId: string;
  activeSubscriptions: string[];
  allPurchasedProductIds: string[];
  latestExpirationDate?: number;
  firstSeen: number;
  originalApplicationVersion?: string;
  managementURL?: string;
}

/**
 * RevenueCat Service
 * Handles subscription management via RevenueCat SDK
 */
export class RevenueCatService {
  private config: RevenueCatConfig | null = null;
  private customerInfo: CustomerInfo | null = null;
  private listeners: Map<string, Function[]> = new Map();

  /**
   * Initialize RevenueCat
   */
  public async initialize(config: RevenueCatConfig): Promise<void> {
    this.config = config;

    // In production: Initialize RevenueCat SDK
    // For now: Mock implementation
    console.log('RevenueCat initialized with API key:', config.apiKey);
  }

  /**
   * Set user ID
   */
  public setUserId(userId: string): void {
    if (this.config) {
      this.config.userId = userId;
    }
  }

  /**
   * Get available products
   */
  public async getAvailableProducts(): Promise<string[]> {
    // In production: Fetch from RevenueCat SDK
    // For now: Return mock product IDs
    return [
      'com.djbanksy.pro.monthly.usd',
      'com.djbanksy.pro.yearly.usd',
      'com.djbanksy.elite.monthly.usd',
      'com.djbanksy.elite.yearly.usd',
      'com.djbanksy.premium.monthly.usd',
      'com.djbanksy.premium.yearly.usd',
      'com.djbanksy.pro.monthly.zar',
      'com.djbanksy.pro.yearly.zar',
      'com.djbanksy.elite.monthly.zar',
      'com.djbanksy.elite.yearly.zar',
      'com.djbanksy.premium.monthly.zar',
      'com.djbanksy.premium.yearly.zar',
    ];
  }

  /**
   * Purchase product
   */
  public async purchaseProduct(productId: string): Promise<CustomerInfo | null> {
    try {
      // In production: Call RevenueCat SDK purchasePackage()
      // For now: Mock implementation
      console.log('Purchasing product:', productId);

      // Simulate purchase
      const purchaseInfo: PurchaseInfo = {
        productId,
        purchaseDate: Date.now(),
        expirationDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
        isActive: true,
        isSandbox: __DEV__,
      };

      // Update customer info
      await this.updateCustomerInfo();
      return this.customerInfo;
    } catch (error) {
      console.error('Purchase failed:', error);
      return null;
    }
  }

  /**
   * Restore purchases
   */
  public async restorePurchases(): Promise<CustomerInfo | null> {
    try {
      // In production: Call RevenueCat SDK restorePurchases()
      console.log('Restoring purchases...');
      await this.updateCustomerInfo();
      return this.customerInfo;
    } catch (error) {
      console.error('Restore failed:', error);
      return null;
    }
  }

  /**
   * Update customer info
   */
  private async updateCustomerInfo(): Promise<void> {
    // In production: Fetch from RevenueCat SDK getCustomerInfo()
    // For now: Mock implementation
    this.customerInfo = {
      userId: this.config?.userId || 'unknown',
      activeSubscriptions: ['com.djbanksy.pro.monthly.usd'],
      allPurchasedProductIds: ['com.djbanksy.pro.monthly.usd'],
      latestExpirationDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
      firstSeen: Date.now() - 30 * 24 * 60 * 60 * 1000,
    };

    this.emit('customerInfoUpdated', this.customerInfo);
  }

  /**
   * Get customer info
   */
  public getCustomerInfo(): CustomerInfo | null {
    return this.customerInfo;
  }

  /**
   * Check if user has active subscription
   */
  public hasActiveSubscription(): boolean {
    if (!this.customerInfo) return false;
    return this.customerInfo.activeSubscriptions.length > 0;
  }

  /**
   * Get active subscription product IDs
   */
  public getActiveSubscriptions(): string[] {
    return this.customerInfo?.activeSubscriptions || [];
  }

  /**
   * Check if specific product is purchased
   */
  public isPurchased(productId: string): boolean {
    if (!this.customerInfo) return false;
    return this.customerInfo.allPurchasedProductIds.includes(productId);
  }

  /**
   * Get days until renewal
   */
  public getDaysUntilRenewal(): number {
    if (!this.customerInfo?.latestExpirationDate) return 0;
    const daysRemaining = Math.ceil(
      (this.customerInfo.latestExpirationDate - Date.now()) / (24 * 60 * 60 * 1000)
    );
    return Math.max(0, daysRemaining);
  }

  /**
   * Check if subscription is expiring soon (within 7 days)
   */
  public isExpiringsoon(): boolean {
    return this.getDaysUntilRenewal() <= 7 && this.getDaysUntilRenewal() > 0;
  }

  /**
   * Get subscription status
   */
  public getSubscriptionStatus(): {
    isActive: boolean;
    daysRemaining: number;
    expirationDate?: Date;
    productId?: string;
  } {
    const isActive = this.hasActiveSubscription();
    const daysRemaining = this.getDaysUntilRenewal();
    const expirationDate = this.customerInfo?.latestExpirationDate
      ? new Date(this.customerInfo.latestExpirationDate)
      : undefined;
    const productId = this.customerInfo?.activeSubscriptions[0];

    return {
      isActive,
      daysRemaining,
      expirationDate,
      productId,
    };
  }

  /**
   * Open manage subscriptions URL
   */
  public async openManageSubscriptions(): Promise<void> {
    if (!this.customerInfo?.managementURL) {
      console.warn('Management URL not available');
      return;
    }

    // In production: Open URL in browser
    // import { Linking } from 'react-native';
    // await Linking.openURL(this.customerInfo.managementURL);
  }

  /**
   * Listen to events
   */
  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  /**
   * Remove event listener
   */
  public off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Get platform-specific SKU
   */
  public getPlatformSKU(baseSKU: string): string {
    if (Platform.OS === 'ios') {
      return baseSKU; // Apple uses same SKU
    } else if (Platform.OS === 'android') {
      return baseSKU; // Google Play uses same SKU
    }
    return baseSKU;
  }
}

export const revenueCatService = new RevenueCatService();

// Initialize on app start
export async function initializeRevenueCat(apiKey: string, userId: string): Promise<void> {
  await revenueCatService.initialize({
    apiKey,
    userId,
  });
}
