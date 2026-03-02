# RevenueCat Integration Setup Guide for Banksy

## Overview

RevenueCat is a subscription management platform that handles in-app purchases across iOS and Android. This guide walks through complete setup for Banksy's 4-tier subscription system.

---

## Step 1: Create RevenueCat Account

1. Go to https://www.revenuecat.com
2. Click "Sign Up"
3. Create account with email
4. Verify email
5. Complete onboarding

---

## Step 2: Get API Keys

### Public API Key (for app)
1. Dashboard → Settings → API Keys
2. Copy "Public API Key" (starts with `pk_`)
3. Save this for app configuration

### Secret API Key (for server)
1. Dashboard → Settings → API Keys
2. Copy "Secret API Key" (starts with `sk_`)
3. Save securely (never commit to Git)

---

## Step 3: Create Products in RevenueCat

### Free Tier (No product needed - default)

### Pro Tier ($4.99/month, R89/month)

**iOS Product:**
- Product ID: `banksy_pro_monthly_usd`
- Type: Auto-Renewable Subscription
- Price: $4.99/month
- Duration: 1 month

**Android Product:**
- Product ID: `banksy_pro_monthly_usd`
- Type: Subscription
- Price: $4.99/month
- Duration: 1 month

**ZAR Version:**
- Product ID: `banksy_pro_monthly_zar`
- Price: R89/month

### Elite Tier ($9.99/month, R179/month)

**iOS Product:**
- Product ID: `banksy_elite_monthly_usd`
- Type: Auto-Renewable Subscription
- Price: $9.99/month
- Duration: 1 month

**Android Product:**
- Product ID: `banksy_elite_monthly_usd`
- Type: Subscription
- Price: $9.99/month
- Duration: 1 month

**ZAR Version:**
- Product ID: `banksy_elite_monthly_zar`
- Price: R179/month

### Premium Tier ($19.99/month, R359/month)

**iOS Product:**
- Product ID: `banksy_premium_monthly_usd`
- Type: Auto-Renewable Subscription
- Price: $19.99/month
- Duration: 1 month

**Android Product:**
- Product ID: `banksy_premium_monthly_usd`
- Type: Subscription
- Price: $19.99/month
- Duration: 1 month

**ZAR Version:**
- Product ID: `banksy_premium_monthly_zar`
- Price: R359/month

### Yearly Plans (20% discount)

For each tier, create yearly version:
- Pro Yearly: `banksy_pro_yearly_usd` ($39.99/year)
- Elite Yearly: `banksy_elite_yearly_usd` ($79.99/year)
- Premium Yearly: `banksy_premium_yearly_usd` ($159.99/year)

---

## Step 4: Configure Apple App Store

### Create In-App Purchase Products

1. Go to Apple App Store Connect
2. Select Banksy app
3. Go to "In-App Purchases"
4. Create new auto-renewable subscription products:

```
banksy_pro_monthly_usd
- Type: Auto-Renewable Subscription
- Reference Name: Banksy Pro Monthly USD
- Product ID: banksy_pro_monthly_usd
- Price: $4.99
- Billing Period: 1 Month
- Free Trial: 7 Days (optional)

banksy_elite_monthly_usd
- Type: Auto-Renewable Subscription
- Reference Name: Banksy Elite Monthly USD
- Product ID: banksy_elite_monthly_usd
- Price: $9.99
- Billing Period: 1 Month
- Free Trial: 7 Days (optional)

banksy_premium_monthly_usd
- Type: Auto-Renewable Subscription
- Reference Name: Banksy Premium Monthly USD
- Product ID: banksy_premium_monthly_usd
- Price: $19.99
- Billing Period: 1 Month
- Free Trial: 7 Days (optional)
```

### Link to RevenueCat

1. In RevenueCat Dashboard
2. Go to Projects → Banksy
3. Select "iOS"
4. Enter App Store Connect credentials
5. RevenueCat will auto-sync products

---

## Step 5: Configure Google Play Store

### Create In-App Purchase Products

1. Go to Google Play Console
2. Select Banksy app
3. Go to "Monetize" → "Products" → "Subscriptions"
4. Create subscription products:

```
banksy_pro_monthly_usd
- Product ID: banksy_pro_monthly_usd
- Name: Banksy Pro Monthly
- Price: $4.99
- Billing Period: 1 Month
- Free Trial: 7 Days (optional)

banksy_elite_monthly_usd
- Product ID: banksy_elite_monthly_usd
- Name: Banksy Elite Monthly
- Price: $9.99
- Billing Period: 1 Month
- Free Trial: 7 Days (optional)

banksy_premium_monthly_usd
- Product ID: banksy_premium_monthly_usd
- Name: Banksy Premium Monthly
- Price: $19.99
- Billing Period: 1 Month
- Free Trial: 7 Days (optional)
```

### Link to RevenueCat

1. In RevenueCat Dashboard
2. Go to Projects → Banksy
3. Select "Android"
4. Enter Google Play Console credentials
5. RevenueCat will auto-sync products

---

## Step 6: Environment Variables

Add to `.env` file:

```bash
REVENUCAT_PUBLIC_KEY=pk_your_public_key_here
REVENUCAT_SECRET_KEY=sk_your_secret_key_here
```

Add to `app.config.ts`:

```typescript
const env = {
  // ... existing config
  revenuecat: {
    publicKey: process.env.REVENUCAT_PUBLIC_KEY,
    secretKey: process.env.REVENUCAT_SECRET_KEY,
  },
};
```

---

## Step 7: SDK Integration

### Install RevenueCat SDK

```bash
npm install react-native-purchases
```

### Configure in App

```typescript
// lib/services/revenucat-service.ts
import Purchases from 'react-native-purchases';

export async function initializeRevenueCat() {
  try {
    await Purchases.configure({
      apiKey: process.env.REVENUCAT_PUBLIC_KEY || '',
    });
    console.log('✅ RevenueCat initialized');
  } catch (error) {
    console.error('❌ RevenueCat init failed:', error);
  }
}

export async function getSubscriptionStatus() {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.activeSubscriptions;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return [];
  }
}

export async function purchaseSubscription(productId: string) {
  try {
    const { customerInfo } = await Purchases.purchasePackage(productId);
    return customerInfo;
  } catch (error) {
    console.error('Purchase failed:', error);
    throw error;
  }
}
```

---

## Step 8: Test Purchases

### iOS Testing

1. Add Apple ID as Sandbox Tester
2. Go to App Store Connect → Users and Access → Sandbox Testers
3. Create test account
4. On device, sign out of App Store
5. Sign in with sandbox account
6. Test purchases in app

### Android Testing

1. Add Google Account as Tester
2. Go to Google Play Console → Tests → Internal Testing
3. Add email to testers
4. Install app from internal test link
5. Test purchases in app

---

## Step 9: Monitor Revenue

### RevenueCat Dashboard

1. Dashboard → Revenue
2. View MRR (Monthly Recurring Revenue)
3. Track churn rate
4. Monitor subscription breakdown by tier
5. View trial conversion rates

### Charts to Monitor

- **MRR Growth**: Track monthly revenue
- **Churn Rate**: Monitor cancellations
- **LTV**: Lifetime value per customer
- **Conversion Rate**: Free → Paid conversion
- **Retention**: 30-day, 60-day, 90-day retention

---

## Step 10: Webhooks (Optional)

### Setup Webhook

1. RevenueCat Dashboard → Settings → Webhooks
2. Add webhook URL: `https://your-api.com/webhooks/revenucat`
3. Select events:
   - INITIAL_PURCHASE
   - RENEWAL
   - CANCELLATION
   - REFUND

### Handle Webhook

```typescript
// server/webhooks/revenucat.ts
export async function handleRevenuecat(event: any) {
  const { type, data } = event;

  switch (type) {
    case 'INITIAL_PURCHASE':
      // Log purchase in database
      await logPurchase(data);
      break;
    case 'RENEWAL':
      // Update subscription renewal
      await updateRenewal(data);
      break;
    case 'CANCELLATION':
      // Handle cancellation
      await handleCancellation(data);
      break;
  }
}
```

---

## Subscription Product IDs

### Complete List

| Tier | Frequency | USD | ZAR |
|------|-----------|-----|-----|
| Pro | Monthly | `banksy_pro_monthly_usd` | `banksy_pro_monthly_zar` |
| Pro | Yearly | `banksy_pro_yearly_usd` | `banksy_pro_yearly_zar` |
| Elite | Monthly | `banksy_elite_monthly_usd` | `banksy_elite_monthly_zar` |
| Elite | Yearly | `banksy_elite_yearly_usd` | `banksy_elite_yearly_zar` |
| Premium | Monthly | `banksy_premium_monthly_usd` | `banksy_premium_monthly_zar` |
| Premium | Yearly | `banksy_premium_yearly_usd` | `banksy_premium_yearly_zar` |

---

## Troubleshooting

### Issue: Products not appearing in app

**Solution:**
1. Verify product IDs match exactly
2. Check RevenueCat dashboard for product sync
3. Restart app
4. Clear app cache

### Issue: Purchase fails

**Solution:**
1. Check internet connection
2. Verify sandbox/production environment
3. Check RevenueCat logs
4. Verify payment method on device

### Issue: Subscription not recognized

**Solution:**
1. Call `Purchases.getCustomerInfo()` to refresh
2. Check RevenueCat dashboard for purchase
3. Verify product ID in code
4. Check subscription status in RevenueCat

---

## Security Best Practices

1. **Never commit API keys** - Use environment variables
2. **Use HTTPS** - All API calls must be encrypted
3. **Validate receipts** - RevenueCat handles this
4. **Secure webhooks** - Verify webhook signatures
5. **Rotate keys** - Regularly update API keys
6. **Monitor fraud** - Check RevenueCat fraud detection

---

## Pricing Strategy

### Current Pricing

- **Free**: $0 (Limited features)
- **Pro**: $4.99/month (Full features, 90-day history)
- **Elite**: $9.99/month (ML optimization, backtesting)
- **Premium**: $19.99/month (API access, team accounts)

### Yearly Discount

- 20% off annual plans
- Pro Yearly: $39.99/year (vs $59.88/year)
- Elite Yearly: $79.99/year (vs $119.88/year)
- Premium Yearly: $159.99/year (vs $239.88/year)

### Revenue Projections

| Users | Conversion | ARPU | MRR |
|-------|-----------|------|-----|
| 1,000 | 5% | $4.99 | $250 |
| 10,000 | 5% | $4.99 | $2,500 |
| 50,000 | 5% | $6.50 | $16,250 |
| 100,000 | 5% | $7.00 | $35,000 |

---

## Support

- **RevenueCat Docs**: https://docs.revenuecat.com
- **RevenueCat Support**: support@revenuecat.com
- **Banksy Support**: support@banksy-app.com

---

**Last Updated:** February 27, 2026
**Version:** 1.0
**Maintained By:** Banksy Development Team
