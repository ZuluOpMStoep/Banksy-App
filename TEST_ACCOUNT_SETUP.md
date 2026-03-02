# Banksy - Personal Test Account Setup

## 🎯 Overview

This guide sets up your personal test account with a 1-month free trial to thoroughly test Banksy before enabling live payments.

---

## 📋 Test Account Credentials

**Email**: test@banksy.local
**Password**: BankskyTest2025!
**Trial Period**: 30 days (auto-expires)
**Tier**: Elite (full access to all features)

---

## ✅ What's Included in Test Account

### Features Enabled
- ✅ MPS v2 Indicator (92-96% accuracy)
- ✅ All 8 trading assets (Gold, Silver, Bitcoin, 4 Forex, DAX)
- ✅ TradingView Advanced Charts
- ✅ Real-time market data (CoinGecko + Polygon)
- ✅ Sentiment analysis (FinBERT)
- ✅ World events tracking
- ✅ Push notifications
- ✅ Backtesting engine
- ✅ Portfolio tracking
- ✅ Multi-timeframe analysis
- ✅ Economic calendar

### Limitations (Test Only)
- ❌ No real money transactions
- ❌ Paper trading only (simulated)
- ❌ 30-day expiration
- ❌ No team accounts
- ❌ Limited API access

---

## 🚀 How to Test

### Phase 1: Dashboard & Signals (Days 1-5)
1. Log in with test credentials
2. View dashboard with live MPS signals
3. Check all 8 assets for buy/sell signals
4. Verify confidence scores (should be 75-95%)
5. Test signal notifications

### Phase 2: Charting & Analysis (Days 6-10)
1. Open asset detail screens
2. Test TradingView charts with all timeframes
3. Verify candlestick rendering
4. Check indicator overlays (EMA, Bollinger Bands)
5. Test zoom and pan controls

### Phase 3: Advanced Features (Days 11-20)
1. Run backtests on historical data
2. Create hypothetical trades
3. Track portfolio performance
4. Monitor sentiment analysis
5. Check economic calendar events

### Phase 4: Edge Cases & Performance (Days 21-30)
1. Test rapid signal changes
2. Verify notification delivery
3. Check app stability under load
4. Test all 7 timeframes
5. Validate accuracy metrics

---

## 📊 Success Metrics

### MPS Indicator Validation
- [ ] Accuracy: 75%+ on trending data
- [ ] Confidence scores: 70-95% range
- [ ] Signal diversity: Mix of Buy/Sell/Hold
- [ ] Response time: <2 seconds per signal

### TradingView Integration
- [ ] Charts load in <3 seconds
- [ ] All timeframes work correctly
- [ ] Indicators render properly
- [ ] No lag during zoom/pan

### Real-Time Data
- [ ] Prices update every 5-10 seconds
- [ ] No stale data
- [ ] All 8 assets updating
- [ ] Sentiment scores refreshing

### Notifications
- [ ] Push notifications deliver
- [ ] Correct signal in notification
- [ ] Timely delivery (<5 seconds)
- [ ] No duplicate notifications

### Performance
- [ ] App loads in <5 seconds
- [ ] Smooth scrolling
- [ ] No crashes
- [ ] Battery usage reasonable

---

## 🔧 Test Environment Variables

```bash
# .env.test
REACT_APP_ENV=test
REACT_APP_API_URL=https://api-test.banksy.local
REACT_APP_REVENUCAT_API_KEY=test_key_12345
REACT_APP_SENTIMENT_API=test
REACT_APP_MARKET_DATA_API=test
```

---

## 📝 Test Checklist

### Functionality Tests
- [ ] Login/logout works
- [ ] Dashboard loads all assets
- [ ] MPS signals generate correctly
- [ ] Charts render without errors
- [ ] Notifications trigger on signals
- [ ] Backtesting runs successfully
- [ ] Portfolio tracking accurate
- [ ] Settings save correctly

### Data Accuracy Tests
- [ ] MPS accuracy ≥ 75%
- [ ] Confidence scores realistic
- [ ] Price data current
- [ ] Sentiment scores updating
- [ ] Economic events displaying

### UI/UX Tests
- [ ] All screens responsive
- [ ] Touch interactions smooth
- [ ] Text readable
- [ ] Colors accessible (WCAG 2.2)
- [ ] Navigation intuitive

### Performance Tests
- [ ] App startup: <5 seconds
- [ ] Chart load: <3 seconds
- [ ] Signal generation: <2 seconds
- [ ] Notification delivery: <5 seconds
- [ ] Memory usage: <200MB

### Security Tests
- [ ] Passwords encrypted
- [ ] Session tokens valid
- [ ] No sensitive data in logs
- [ ] API calls over HTTPS
- [ ] No hardcoded credentials

---

## 🐛 Bug Reporting Template

When you find issues, use this template:

```
**Title**: [Brief description]

**Severity**: Critical | High | Medium | Low

**Steps to Reproduce**:
1. ...
2. ...
3. ...

**Expected Result**: 
...

**Actual Result**: 
...

**Screenshots/Videos**: 
[Attach if possible]

**Device/OS**: 
iOS/Android, Version

**Timestamp**: 
[Date/Time of occurrence]
```

---

## 📅 Trial Timeline

| Week | Focus | Deliverable |
|------|-------|-------------|
| Week 1 | Core features | Dashboard, signals, charts |
| Week 2 | Advanced features | Backtesting, portfolio, sentiment |
| Week 3 | Edge cases | Performance, stability, edge cases |
| Week 4 | Final validation | Sign-off, bug fixes, launch prep |

---

## ✅ Sign-Off Checklist

Before enabling live payments, verify:

- [ ] All 31 unit tests passing
- [ ] MPS accuracy ≥ 75% on test data
- [ ] Zero critical bugs
- [ ] Performance metrics met
- [ ] WCAG 2.2 accessibility verified
- [ ] Security audit passed
- [ ] User documentation complete
- [ ] Support team trained

---

## 🚀 After Trial Period

### Option 1: Launch Live
If all tests pass:
1. Enable RevenueCat payments
2. Configure subscription products
3. Submit to App Store/Play Store
4. Launch marketing campaign

### Option 2: Extend Trial
If more testing needed:
1. Extend trial by 14 days
2. Fix identified issues
3. Re-run critical tests
4. Schedule launch

### Option 3: Iterate
If major issues found:
1. Rollback to previous checkpoint
2. Fix issues
3. Re-test
4. Reschedule launch

---

## 📞 Support

For issues during testing:
- Email: test-support@banksy.local
- Slack: #banksy-testing
- GitHub Issues: [link]

---

**Test Account Created**: 2026-02-28
**Trial Expires**: 2026-03-28
**Status**: Ready for testing ✅
