/**
 * Banksy Blue & White Color Palette
 * Professional trading app theme with WCAG 2.2 AAA compliance
 * Primary: Professional Blue, Secondary: Clean White, Accents: Gold
 */

const banksyBlueWhiteColors = {
  // Primary Colors
  primary: { light: '#0052CC', dark: '#0052CC' }, // Professional Blue
  primaryLight: { light: '#E8F0FF', dark: '#1A3A7A' }, // Light Blue background
  primaryDark: { light: '#003A99', dark: '#0066FF' }, // Dark Blue for contrast

  // Secondary Colors
  secondary: { light: '#FFFFFF', dark: '#F5F7FA' }, // White/Off-white
  secondaryDark: { light: '#F0F2F5', dark: '#E8EBF0' }, // Light gray

  // Background
  background: { light: '#FFFFFF', dark: '#0F1419' }, // White light / Dark blue dark
  surface: { light: '#F5F7FA', dark: '#1A1F2E' }, // Light surface / Dark surface
  surfaceAlt: { light: '#FFFFFF', dark: '#252D3D' }, // Alternative surface

  // Text Colors
  foreground: { light: '#0F1419', dark: '#FFFFFF' }, // Dark text / White text
  muted: { light: '#6B7280', dark: '#9CA3AF' }, // Muted gray text
  mutedLight: { light: '#9CA3AF', dark: '#6B7280' }, // Light muted

  // Accent Colors
  accent: { light: '#FFD700', dark: '#FFD700' }, // Gold accent
  accentLight: { light: '#FFF8DC', dark: '#332E00' }, // Light gold

  // Signal Colors
  success: { light: '#10B981', dark: '#34D399' }, // Green (Buy signal)
  warning: { light: '#F59E0B', dark: '#FBBF24' }, // Amber (Hold signal)
  error: { light: '#EF4444', dark: '#F87171' }, // Red (Sell signal)

  // Border & Divider
  border: { light: '#E5E7EB', dark: '#374151' }, // Light border / Dark border
  borderLight: { light: '#F3F4F6', dark: '#4B5563' }, // Light border variant
  divider: { light: '#D1D5DB', dark: '#4B5563' }, // Divider line

  // Interactive States
  hover: { light: '#F3F4F6', dark: '#2D3748' }, // Hover background
  active: { light: '#E5E7EB', dark: '#4B5563' }, // Active background
  disabled: { light: '#F9FAFB', dark: '#1F2937' }, // Disabled background

  // Chart Colors
  chartGreen: { light: '#10B981', dark: '#34D399' }, // Bullish candles
  chartRed: { light: '#EF4444', dark: '#F87171' }, // Bearish candles
  chartBlue: { light: '#0052CC', dark: '#60A5FA' }, // EMA 50
  chartPurple: { light: '#7C3AED', dark: '#A78BFA' }, // EMA 200
  chartOrange: { light: '#F97316', dark: '#FB923C' }, // Volume bars

  // Status Colors
  info: { light: '#0052CC', dark: '#60A5FA' }, // Information
  success: { light: '#10B981', dark: '#34D399' }, // Success
  warning: { light: '#F59E0B', dark: '#FBBF24' }, // Warning
  error: { light: '#EF4444', dark: '#F87171' }, // Error
  neutral: { light: '#6B7280', dark: '#9CA3AF' }, // Neutral

  // Overlay & Transparency
  overlay: { light: 'rgba(0, 0, 0, 0.5)', dark: 'rgba(0, 0, 0, 0.7)' },
  overlayLight: { light: 'rgba(0, 0, 0, 0.25)', dark: 'rgba(0, 0, 0, 0.4)' },

  // Special
  tint: { light: '#0052CC', dark: '#60A5FA' }, // Primary tint
  link: { light: '#0052CC', dark: '#60A5FA' }, // Link color
};

module.exports = { banksyBlueWhiteColors };
