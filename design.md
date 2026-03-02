# Manus Trade Pro - Mobile App Interface Design

## Design Philosophy

**Manus Trade Pro** is a professional trading analysis app designed for iOS and Android. Following **Apple Human Interface Guidelines (HIG)**, the app prioritizes clarity, efficiency, and one-handed usability in portrait orientation (9:16).

The design emphasizes **data visualization** (candlestick charts, indicators) while maintaining simplicity for traders who need quick decision-making tools.

---

## Screen List

### 1. **Dashboard / Home Screen**
- Primary entry point
- Real-time price cards for monitored assets (Gold, Silver, Bitcoin, EUR/USD, GBP/USD, USD/JPY, AUD/USD, DAX)
- Quick access to MPS (Manus Pro Signal) status
- Recent alerts and signals
- Tab navigation to other sections

### 2. **Asset Detail Screen**
- Full candlestick chart with TradingView Lightweight Charts
- MPS indicator overlay (color-coded signal, confidence score)
- Component breakdown (Trend, Momentum, Structure, Risk)
- Technical indicators panel (RSI, MACD, Bollinger Bands, Ichimoku)
- Price action annotations (support/resistance, order blocks)
- Timeframe selector (1m, 5m, 15m, 1h, 4h, 1d)

### 3. **Indicators Screen**
- Detailed view of all active indicators
- Individual indicator settings and customization
- Indicator comparison mode
- Historical signal accuracy
- Indicator education/help

### 4. **Economic Calendar Screen**
- Upcoming economic events
- Event impact level (High/Medium/Low)
- Previous/Forecast/Actual values
- Real-time event notifications
- Calendar filter by country/event type

### 5. **News & Alerts Screen**
- Real-time news feed
- Market sentiment analysis
- Custom alert settings
- Alert history
- News source filtering

### 6. **Watchlist Screen**
- Saved assets for quick access
- Drag-to-reorder functionality
- Quick price updates
- Add/remove assets
- Watchlist groups

### 7. **Settings Screen**
- Theme (Light/Dark mode)
- Notification preferences
- Indicator sensitivity settings
- Data source selection
- Account/API key management
- About & Help

---

## Primary Content & Functionality

### Dashboard / Home Screen
**Content:**
- Header: App logo + theme toggle + settings icon
- Asset Cards (Grid or List):
  - Asset name (e.g., "Gold", "EUR/USD")
  - Current price
  - 24h change (% and color: green/red)
  - MPS signal (Buy/Sell/Hold with confidence)
  - Sparkline chart (mini 24h price chart)
- Quick Actions:
  - "View Chart" button per asset
  - "Add to Watchlist" button
- Recent Signals Section:
  - List of latest MPS signals triggered
  - Timestamp and asset name
  - Entry/exit recommendations

**Functionality:**
- Tap asset card → Navigate to Asset Detail
- Swipe to refresh prices
- Long-press asset → Add to watchlist
- Tap signal → Navigate to asset detail at signal time

---

### Asset Detail Screen
**Content:**
- Header:
  - Asset name + current price
  - 24h change
  - Back button
  - Share button
  
- Chart Area (60% of screen):
  - TradingView Lightweight Charts candlestick display
  - Timeframe selector (1m, 5m, 15m, 1h, 4h, 1d, 1w)
  - Zoom/pan controls
  - MPS indicator overlay (color bands: green/red/yellow)
  
- MPS Signal Panel (Below chart):
  - Large signal indicator (Buy/Sell/Hold)
  - Confidence score (0-100%)
  - Component breakdown (4 bars showing Trend/Momentum/Structure/Risk)
  - Signal strength explanation
  
- Technical Indicators Panel (Collapsible):
  - RSI chart
  - MACD chart
  - Bollinger Bands (on main chart)
  - Ichimoku Cloud (on main chart)
  - Toggle to show/hide each indicator
  
- Action Buttons:
  - "Set Alert" button
  - "Add to Watchlist" button
  - "Share Signal" button

**Functionality:**
- Pinch to zoom chart
- Swipe left/right to navigate timeframes
- Tap indicator name to toggle visibility
- Tap "Set Alert" → Alert configuration modal
- Real-time price updates every 1-5 seconds

---

### Indicators Screen
**Content:**
- Indicator List:
  - RSI (with current value)
  - MACD (with histogram)
  - Bollinger Bands (with current position)
  - Ichimoku Cloud (with component status)
  - ADX (with trend strength)
  - Volume Profile (with POC level)
  - Order Blocks (with active blocks count)
  
- Per Indicator:
  - Current value/status
  - Overbought/oversold status
  - Divergence detection (if applicable)
  - Customization button (settings)
  
- Indicator Settings Modal:
  - Period adjustment (e.g., RSI period: 14)
  - Overbought/oversold thresholds
  - Color customization
  - Enable/disable toggle

**Functionality:**
- Tap indicator → Expand to show detailed chart
- Tap settings icon → Open customization modal
- Save custom settings per asset
- Compare indicators side-by-side

---

### Economic Calendar Screen
**Content:**
- Calendar View (by date):
  - Date header
  - List of events for that day
  - Event name, time, impact level (color-coded)
  
- Event Details (Tap to expand):
  - Event name
  - Scheduled time (with countdown)
  - Previous value
  - Forecast value
  - Actual value (after release)
  - Impact on related assets
  - News articles related to event
  
- Filters:
  - By country (US, EU, UK, Japan, etc.)
  - By impact level (High/Medium/Low)
  - By asset type (Forex, Crypto, Commodities)

**Functionality:**
- Swipe to navigate between dates
- Tap event → Expand details
- Set notification for event (30 min, 1 hour, 1 day before)
- Tap asset link → Navigate to asset detail
- Color coding: Red (High), Orange (Medium), Gray (Low)

---

### News & Alerts Screen
**Content:**
- News Feed:
  - Article headline
  - Source + timestamp
  - Sentiment indicator (positive/negative/neutral)
  - Related asset tags
  - Thumbnail image (if available)
  
- Alert History:
  - MPS signal alerts
  - Economic event alerts
  - Price level alerts
  - Timestamp and action taken
  
- Alert Settings:
  - Toggle notifications on/off
  - Notification sound
  - Alert types to receive

**Functionality:**
- Tap article → Open in browser or in-app reader
- Swipe to dismiss article
- Tap asset tag → Navigate to asset detail
- Long-press alert → Delete or snooze

---

### Watchlist Screen
**Content:**
- Watchlist Items (Drag-to-reorder):
  - Asset name
  - Current price
  - 24h change
  - MPS signal status
  - Sparkline chart
  
- Add Asset Button (+ icon):
  - Search/select from available assets
  - Add to watchlist
  
- Watchlist Groups (Optional):
  - "Forex Majors"
  - "Commodities"
  - "Crypto"
  - Collapsible groups

**Functionality:**
- Long-press to drag and reorder
- Swipe to delete
- Tap asset → Navigate to asset detail
- Tap + → Add asset modal
- Tap group header → Collapse/expand

---

### Settings Screen
**Content:**
- Theme Settings:
  - Light/Dark mode toggle
  - System default option
  
- Notifications:
  - MPS signal alerts (toggle)
  - Economic event alerts (toggle)
  - Price alert notifications (toggle)
  - Sound/vibration options
  
- Indicator Settings:
  - MPS sensitivity (Conservative/Moderate/Aggressive)
  - Indicator customization (link to Indicators screen)
  - Multi-timeframe validation (toggle)
  
- Data Settings:
  - Data source selection (Twelve Data, Finnhub, etc.)
  - Update frequency (1s, 5s, 10s, 30s)
  - Historical data retention
  
- Account:
  - API key management (if applicable)
  - User preferences
  - Data privacy
  
- About:
  - App version
  - Help & documentation
  - Contact support
  - Privacy policy
  - Terms of service

**Functionality:**
- Toggle switches for boolean settings
- Slider for numeric settings
- Tap to open modal for complex settings
- Save settings to AsyncStorage

---

## Key User Flows

### Flow 1: Check Trading Signal
1. User opens app → Dashboard
2. Sees asset cards with MPS signals
3. Taps asset with "Buy" signal
4. Navigates to Asset Detail screen
5. Views chart with MPS indicator overlay
6. Sees component breakdown (Trend/Momentum/Structure/Risk)
7. Reads signal explanation
8. Sets alert or adds to watchlist
9. Returns to dashboard

**Time to decision:** <30 seconds

---

### Flow 2: Monitor Economic Event
1. User navigates to Economic Calendar
2. Sees upcoming high-impact event (e.g., NFP)
3. Taps event to expand details
4. Sets notification (30 min before)
5. Sees related assets affected
6. Taps asset link → Asset Detail
7. Monitors MPS signal during event
8. Returns to calendar after event

**Time to setup:** <1 minute

---

### Flow 3: Analyze Indicator Details
1. User on Asset Detail screen
2. Taps "Indicators" panel
3. Navigates to Indicators screen
4. Taps RSI indicator
5. Sees RSI chart with divergence highlights
6. Adjusts RSI period (e.g., 14 → 21)
7. Sees chart update in real-time
8. Saves custom settings
9. Returns to Asset Detail

**Time to customize:** <2 minutes

---

### Flow 4: Build Watchlist
1. User on Dashboard
2. Taps + button → Add Asset modal
3. Searches for "Gold"
4. Selects XAU/USD
5. Confirms add
6. Navigates to Watchlist screen
7. Sees Gold added
8. Drags to reorder
9. Returns to Dashboard

**Time to build:** <1 minute

---

## Color Choices (Brand-Specific)

### Primary Colors
- **Primary Accent**: #0a7ea4 (Professional Blue) - Used for buttons, highlights, active states
- **Buy Signal**: #22C55E (Green) - Bullish signals, positive indicators
- **Sell Signal**: #EF4444 (Red) - Bearish signals, negative indicators
- **Hold Signal**: #F59E0B (Amber) - Neutral signals, indecision

### Background & Surface
- **Light Mode**:
  - Background: #FFFFFF (White)
  - Surface: #F5F5F5 (Light Gray)
  - Foreground Text: #11181C (Dark Gray/Black)
  - Muted Text: #687076 (Medium Gray)
  - Border: #E5E7EB (Light Border)

- **Dark Mode**:
  - Background: #151718 (Very Dark Gray)
  - Surface: #1e2022 (Dark Gray)
  - Foreground Text: #ECEDEE (Light Gray)
  - Muted Text: #9BA1A6 (Medium Light Gray)
  - Border: #334155 (Dark Border)

### Indicator Colors
- **Bullish**: Shades of green (#22C55E, #10B981, #059669)
- **Bearish**: Shades of red (#EF4444, #DC2626, #B91C1C)
- **Neutral**: Shades of gray (#6B7280, #9CA3AF, #D1D5DB)
- **Overbought**: Orange (#F59E0B)
- **Oversold**: Blue (#3B82F6)

### Chart Colors
- **Candlestick Up**: #22C55E (Green)
- **Candlestick Down**: #EF4444 (Red)
- **Volume Bar Up**: #22C55E with opacity
- **Volume Bar Down**: #EF4444 with opacity
- **Moving Averages**: Various shades (SMA 50: #3B82F6, SMA 200: #8B5CF6)
- **RSI Overbought (70)**: #F59E0B
- **RSI Oversold (30)**: #3B82F6

---

## Design Principles

1. **Clarity First**: All information is presented clearly without clutter
2. **One-Handed Usage**: All interactive elements reachable with thumb in portrait mode
3. **Real-Time Responsiveness**: Prices and signals update instantly
4. **Professional Aesthetic**: Clean, minimal design suitable for traders
5. **Accessibility**: High contrast, readable fonts, clear hierarchy
6. **Consistency**: Same patterns used across all screens
7. **Efficiency**: Traders can make decisions in <30 seconds

---

## Typography

- **Headings**: SF Pro Display (iOS) / Roboto (Android) - Bold, 24-28px
- **Subheadings**: SF Pro Display / Roboto - Semibold, 18-20px
- **Body Text**: SF Pro Text / Roboto - Regular, 16px
- **Small Text**: SF Pro Text / Roboto - Regular, 14px
- **Monospace (Prices/Numbers)**: SF Mono / Roboto Mono - Regular, 16-18px

---

## Spacing & Layout

- **Padding**: 16px standard (gutters), 8px compact, 24px generous
- **Gap Between Elements**: 12px (components), 16px (sections)
- **Card Radius**: 12px (standard), 16px (large cards)
- **Divider Height**: 1px (light), 0.5px (subtle)

---

## Next Steps

1. Create design mockups in Figma (optional)
2. Implement screens in React Native with NativeWind
3. Integrate TradingView Lightweight Charts
4. Connect MPS indicator logic
5. Add real-time data feeds
6. Implement economic calendar
7. Add news feed integration
8. Test on iOS and Android devices
