/**
 * Subscription Context
 * Manages subscription state across the app
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { revenueCatService, CustomerInfo } from '@/lib/services/revenucat-service';
import { SubscriptionTier } from '@/lib/services/subscription-service';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SubscriptionContextType {
  customerInfo: CustomerInfo | null;
  isLoading: boolean;
  isSubscribed: boolean;
  tier: SubscriptionTier;
  daysUntilRenewal: number;
  isExpiringSoon: boolean;
  purchaseProduct: (productId: string) => Promise<boolean>;
  restorePurchases: () => Promise<void>;
  openManageSubscriptions: () => Promise<void>;
  hasFeature: (feature: string) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tier, setTier] = useState<SubscriptionTier>('free');

  // Initialize subscription on app start
  useEffect(() => {
    initializeSubscription();
  }, []);

  const initializeSubscription = async () => {
    try {
      setIsLoading(true);

      // Restore purchases
      const info = await revenueCatService.restorePurchases();
      if (info) {
        setCustomerInfo(info);
        updateTier(info);

        // Cache subscription info
        await AsyncStorage.setItem(
          'subscription_info',
          JSON.stringify(info)
        );
      } else {
        // Load from cache if available
        const cached = await AsyncStorage.getItem('subscription_info');
        if (cached) {
          const parsedInfo = JSON.parse(cached);
          setCustomerInfo(parsedInfo);
          updateTier(parsedInfo);
        }
      }
    } catch (error) {
      console.error('Failed to initialize subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTier = (info: CustomerInfo) => {
    if (info.activeSubscriptions.length === 0) {
      setTier('free');
    } else {
      const productId = info.activeSubscriptions[0];
      if (productId.includes('premium')) {
        setTier('premium');
      } else if (productId.includes('elite')) {
        setTier('elite');
      } else if (productId.includes('pro')) {
        setTier('pro');
      }
    }
  };

  const purchaseProduct = async (productId: string): Promise<boolean> => {
    try {
      const info = await revenueCatService.purchaseProduct(productId);
      if (info) {
        setCustomerInfo(info);
        updateTier(info);

        // Cache subscription info
        await AsyncStorage.setItem(
          'subscription_info',
          JSON.stringify(info)
        );

        return true;
      }
      return false;
    } catch (error) {
      console.error('Purchase failed:', error);
      return false;
    }
  };

  const restorePurchases = async () => {
    try {
      const info = await revenueCatService.restorePurchases();
      if (info) {
        setCustomerInfo(info);
        updateTier(info);

        await AsyncStorage.setItem(
          'subscription_info',
          JSON.stringify(info)
        );
      }
    } catch (error) {
      console.error('Restore failed:', error);
    }
  };

  const openManageSubscriptions = async () => {
    await revenueCatService.openManageSubscriptions();
  };

  const hasFeature = (feature: string): boolean => {
    const features: { [key in SubscriptionTier]: string[] } = {
      free: [
        'Dashboard with real-time prices',
        'Basic MPS v1 signals (limited)',
        'View 3 assets',
        'Economic calendar (read-only)',
      ],
      pro: [
        'Dashboard with real-time prices',
        'Basic MPS v1 signals (limited)',
        'View 3 assets',
        'Economic calendar (read-only)',
        'All Free features',
        'Full MPS v2 signals (all assets)',
        'View all 8 assets',
        'Advanced technical indicators',
        'Chart history (90 days)',
        'Push notifications for signals',
        'Basic sentiment analysis',
        'Economic event alerts',
        'Multi-timeframe analysis',
        'Watchlist (up to 10 assets)',
        'Price alerts (up to 5)',
        'Dark/Light theme',
      ],
      elite: [
        'All Pro features',
        'Advanced MPS v2 with ML optimization',
        'Full sentiment analysis (FinBERT)',
        'Geopolitical event tracking',
        'Chart history (1 year)',
        'Unlimited price alerts',
        'Unlimited watchlists',
        'Backtesting engine (100 trades)',
        'Portfolio tracker',
        'Win rate analytics',
        'Sharpe ratio calculation',
        'A/B testing framework',
        'Custom indicator parameters',
        'Export signals to CSV',
        'Priority support',
      ],
      premium: [
        'All Elite features',
        'Unlimited backtesting',
        'API access (REST)',
        'Webhook notifications',
        'Custom alerts via email/SMS',
        'Multi-user accounts (team)',
        'Advanced portfolio analytics',
        'Risk management tools',
        'Correlation analysis',
        'Heat maps',
        'Real-time sentiment dashboard',
        'News aggregation (50+ sources)',
        'Custom themes',
        'White-label option',
        'Dedicated account manager',
        '24/7 support',
      ],
    };

    return features[tier]?.includes(feature) || false;
  };

  const value: SubscriptionContextType = {
    customerInfo,
    isLoading,
    isSubscribed: revenueCatService.hasActiveSubscription(),
    tier,
    daysUntilRenewal: revenueCatService.getDaysUntilRenewal(),
    isExpiringSoon: revenueCatService.isExpiringsoon(),
    purchaseProduct,
    restorePurchases,
    openManageSubscriptions,
    hasFeature,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextType {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
}
