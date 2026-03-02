/**
 * Subscription Service
 * Manages in-app subscriptions for Banksy across iOS and Android
 * USD pricing only
 */

export type SubscriptionTier = 'free' | 'pro' | 'elite' | 'premium';

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  appleSKU?: string;
  googleSKU?: string;
}

export interface UserSubscription {
  userId: string;
  tier: SubscriptionTier;
  plan: SubscriptionPlan;
  startDate: number;
  renewalDate: number;
  isActive: boolean;
  autoRenew: boolean;
  transactionId?: string;
}

/**
 * Banksy Subscription Tiers
 * Designed for traders of all levels - USD pricing
 */
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  // FREE TIER - Entry level
  {
    id: 'free',
    tier: 'free',
    name: 'Free',
    description: 'Learn the basics',
    price: 0,
    billingCycle: 'monthly',
    features: [
      'Dashboard with real-time prices',
      'Basic MPS v1 signals (limited)',
      'View 3 assets',
      'Economic calendar (read-only)',
      'Limited chart history (7 days)',
      'No notifications',
      'No sentiment analysis',
      'No backtesting',
    ],
    appleSKU: 'com.djbanksy.free',
    googleSKU: 'djbanksy_free',
  },

  // PRO TIER - Serious learners ($4.99/month)
  {
    id: 'pro-monthly',
    tier: 'pro',
    name: 'Pro (Monthly)',
    description: 'Unlock advanced analysis',
    price: 4.99,
    billingCycle: 'monthly',
    features: [
      'All Free features',
      'Full MPS v3 signals (all assets)',
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
    appleSKU: 'com.djbanksy.pro.monthly',
    googleSKU: 'djbanksy_pro_monthly',
  },

  // ELITE TIER - Serious traders ($9.99/month)
  {
    id: 'elite-monthly',
    tier: 'elite',
    name: 'Elite (Monthly)',
    description: 'Professional trading tools',
    price: 9.99,
    billingCycle: 'monthly',
    features: [
      'All Pro features',
      'Advanced MPS v3 with pattern recognition',
      'Full sentiment analysis',
      'Geopolitical event tracking',
      'Chart history (1 year)',
      'Unlimited price alerts',
      'Unlimited watchlists',
      'Backtesting engine (100 trades)',
      'Portfolio tracker',
      'Win rate analytics',
      'Sharpe ratio calculation',
      'Trade journal with accuracy tracking',
      'Custom indicator parameters',
      'Export signals to CSV',
      'Priority support',
    ],
    appleSKU: 'com.djbanksy.elite.monthly',
    googleSKU: 'djbanksy_elite_monthly',
  },

  // PREMIUM TIER - Institutions ($19.99/month)
  {
    id: 'premium-monthly',
    tier: 'premium',
    name: 'Premium (Monthly)',
    description: 'Enterprise-grade analysis',
    price: 19.99,
    billingCycle: 'monthly',
    features: [
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
    appleSKU: 'com.djbanksy.premium.monthly',
    googleSKU: 'djbanksy_premium_monthly',
  },

  // YEARLY PLANS (20% discount)
  {
    id: 'pro-yearly',
    tier: 'pro',
    name: 'Pro (Yearly)',
    description: 'Save 20%',
    price: 47.88, // $4.99 * 12 * 0.8
    billingCycle: 'yearly',
    features: [
      'All Free features',
      'Full MPS v3 signals (all assets)',
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
    appleSKU: 'com.djbanksy.pro.yearly',
    googleSKU: 'djbanksy_pro_yearly',
  },

  {
    id: 'elite-yearly',
    tier: 'elite',
    name: 'Elite (Yearly)',
    description: 'Save 20%',
    price: 95.88, // $9.99 * 12 * 0.8
    billingCycle: 'yearly',
    features: [
      'All Pro features',
      'Advanced MPS v3 with pattern recognition',
      'Full sentiment analysis',
      'Geopolitical event tracking',
      'Chart history (1 year)',
      'Unlimited price alerts',
      'Unlimited watchlists',
      'Backtesting engine (100 trades)',
      'Portfolio tracker',
      'Win rate analytics',
      'Sharpe ratio calculation',
      'Trade journal with accuracy tracking',
      'Custom indicator parameters',
      'Export signals to CSV',
      'Priority support',
    ],
    appleSKU: 'com.djbanksy.elite.yearly',
    googleSKU: 'djbanksy_elite_yearly',
  },

  {
    id: 'premium-yearly',
    tier: 'premium',
    name: 'Premium (Yearly)',
    description: 'Save 20%',
    price: 191.88, // $19.99 * 12 * 0.8
    billingCycle: 'yearly',
    features: [
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
    appleSKU: 'com.djbanksy.premium.yearly',
    googleSKU: 'djbanksy_premium_yearly',
  },
];

/**
 * Get plans by billing cycle
 */
export function getPlansByBillingCycle(
  billingCycle: 'monthly' | 'yearly'
): SubscriptionPlan[] {
  return SUBSCRIPTION_PLANS.filter((plan) => plan.billingCycle === billingCycle);
}

/**
 * Get plan by ID
 */
export function getPlanById(id: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === id);
}

/**
 * Get plans by tier
 */
export function getPlansByTier(tier: SubscriptionTier): SubscriptionPlan[] {
  return SUBSCRIPTION_PLANS.filter((plan) => plan.tier === tier);
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

/**
 * Calculate monthly equivalent price
 */
export function getMonthlyEquivalent(plan: SubscriptionPlan): number {
  if (plan.billingCycle === 'monthly') {
    return plan.price;
  }
  return plan.price / 12;
}

/**
 * Get savings percentage for yearly plan
 */
export function getYearlySavings(tier: SubscriptionTier): number {
  const monthlyPlans = getPlansByTier(tier).filter(
    (p) => p.billingCycle === 'monthly'
  );
  const yearlyPlans = getPlansByTier(tier).filter(
    (p) => p.billingCycle === 'yearly'
  );

  if (monthlyPlans.length === 0 || yearlyPlans.length === 0) return 0;

  const monthlyPrice = monthlyPlans[0].price;
  const yearlyPrice = yearlyPlans[0].price;
  const fullYearCost = monthlyPrice * 12;

  return Math.round(((fullYearCost - yearlyPrice) / fullYearCost) * 100);
}
