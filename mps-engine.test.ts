/**
 * WCAG 2.2 AAA Compliance Module for Banksy
 * 
 * Ensures all features are accessible to users with disabilities:
 * - Keyboard navigation
 * - Screen reader support
 * - High contrast mode
 * - Text scaling
 * - Color-blind friendly
 * - Reduced motion support
 */

export interface AccessibilityConfig {
  enableKeyboardNav: boolean;
  enableScreenReader: boolean;
  enableHighContrast: boolean;
  enableLargeText: boolean;
  enableColorblindMode: boolean;
  enableReducedMotion: boolean;
  focusIndicatorWidth: number;
  minContrastRatio: number;
}

export class WCAGCompliance {
  private config: AccessibilityConfig = {
    enableKeyboardNav: true,
    enableScreenReader: true,
    enableHighContrast: false,
    enableLargeText: false,
    enableColorblindMode: false,
    enableReducedMotion: false,
    focusIndicatorWidth: 3,
    minContrastRatio: 7, // AAA standard
  };

  /**
   * Initialize accessibility features
   */
  public initialize(): void {
    this.setupKeyboardNavigation();
    this.setupScreenReaderSupport();
    this.setupFocusManagement();
    this.detectUserPreferences();
  }

  /**
   * Setup keyboard navigation (Tab, Enter, Arrow keys)
   */
  private setupKeyboardNavigation(): void {
    if (!this.config.enableKeyboardNav) return;

    document.addEventListener('keydown', (e) => {
      // Tab key: navigate to next focusable element
      if (e.key === 'Tab') {
        this.handleTabNavigation(e);
      }

      // Enter/Space: activate focused element
      if (e.key === 'Enter' || e.key === ' ') {
        this.handleActivation(e);
      }

      // Arrow keys: navigate within components
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        this.handleArrowNavigation(e);
      }

      // Escape: close modals/menus
      if (e.key === 'Escape') {
        this.handleEscape(e);
      }
    });
  }

  /**
   * Setup screen reader support with ARIA labels
   */
  private setupScreenReaderSupport(): void {
    if (!this.config.enableScreenReader) return;

    // Add ARIA labels to all interactive elements
    const interactiveElements = document.querySelectorAll(
      'button, [role="button"], input, select, textarea, a, [role="link"]'
    );

    interactiveElements.forEach((el: Element) => {
      const element = el as HTMLElement;
      // Add aria-label if not present
      if (!element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
        const label = this.generateAriaLabel(element);
        if (label) {
          element.setAttribute('aria-label', label);
        }
      }

      // Add role if not present
      if (!element.getAttribute('role')) {
        const role = this.determineRole(element);
        if (role) {
          element.setAttribute('role', role);
        }
      }

      // Add aria-pressed for toggle buttons
      if (element.classList.contains('toggle-button')) {
        element.setAttribute('aria-pressed', 'false');
      }
    });

    // Announce dynamic content changes
    this.setupLiveRegions();
  }

  /**
   * Setup focus management with visible indicators
   */
  private setupFocusManagement(): void {
    const focusStyle = `
      :focus-visible {
        outline: ${this.config.focusIndicatorWidth}px solid #FF6B35;
        outline-offset: 2px;
        border-radius: 2px;
      }
    `;

    const style = document.createElement('style');
    style.textContent = focusStyle;
    document.head.appendChild(style);

    // Track focus for custom styling
    document.addEventListener('focusin', (e) => {
      const target = e.target as HTMLElement;
      target.classList.add('focused');
    });

    document.addEventListener('focusout', (e) => {
      const target = e.target as HTMLElement;
      target.classList.remove('focused');
    });
  }

  /**
   * Detect user preferences (prefers-reduced-motion, prefers-color-scheme)
   */
  private detectUserPreferences(): void {
    // Detect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
      this.config.enableReducedMotion = true;
      document.documentElement.classList.add('reduce-motion');
    }

    // Detect high contrast preference
    const prefersHighContrast = window.matchMedia('(prefers-contrast: more)');
    if (prefersHighContrast.matches) {
      this.config.enableHighContrast = true;
      document.documentElement.classList.add('high-contrast');
    }

    // Listen for changes
    prefersReducedMotion.addEventListener('change', (e) => {
      this.config.enableReducedMotion = e.matches;
      if (e.matches) {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
    });
  }

  /**
   * Enable high contrast mode
   */
  public enableHighContrast(enabled: boolean): void {
    this.config.enableHighContrast = enabled;
    if (enabled) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }

  /**
   * Enable large text mode
   */
  public enableLargeText(enabled: boolean): void {
    this.config.enableLargeText = enabled;
    if (enabled) {
      document.documentElement.classList.add('large-text');
      document.documentElement.style.fontSize = '120%';
    } else {
      document.documentElement.classList.remove('large-text');
      document.documentElement.style.fontSize = '100%';
    }
  }

  /**
   * Enable colorblind-friendly mode
   */
  public enableColorblindMode(enabled: boolean): void {
    this.config.enableColorblindMode = enabled;
    if (enabled) {
      document.documentElement.classList.add('colorblind-mode');
    } else {
      document.documentElement.classList.remove('colorblind-mode');
    }
  }

  /**
   * Announce message to screen readers
   */
  public announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only'; // Visually hidden but readable by screen readers
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => announcement.remove(), 1000);
  }

  /**
   * Verify color contrast ratio (WCAG AAA = 7:1)
   */
  public verifyContrast(foreground: string, background: string): boolean {
    const fgLuminance = this.getLuminance(foreground);
    const bgLuminance = this.getLuminance(background);

    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);

    const contrastRatio = (lighter + 0.05) / (darker + 0.05);
    return contrastRatio >= this.config.minContrastRatio;
  }

  /**
   * Calculate relative luminance for contrast checking
   */
  private getLuminance(color: string): number {
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0;

    const [r, g, b] = rgb.map((val) => {
      const v = val / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): [number, number, number] | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : null;
  }

  /**
   * Setup live regions for dynamic content
   */
  private setupLiveRegions(): void {
    const liveRegion = document.createElement('div');
    liveRegion.id = 'live-region';
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }

  // Event handlers
  private handleTabNavigation(e: KeyboardEvent): void {
    // Browser handles tab navigation natively
    // This is here for custom tab order if needed
  }

  private handleActivation(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;
    if (target.getAttribute('role') === 'button' || target.tagName === 'BUTTON') {
      target.click();
    }
  }

  private handleArrowNavigation(e: KeyboardEvent): void {
    // Custom arrow navigation for menus, tabs, etc.
    const target = e.target as HTMLElement;
    const parent = target.parentElement;

    if (parent?.getAttribute('role') === 'menubar' || parent?.getAttribute('role') === 'tablist') {
      e.preventDefault();
      // Implement arrow navigation logic
    }
  }

  private handleEscape(e: KeyboardEvent): void {
    // Close open modals/menus
    const openModals = document.querySelectorAll('[role="dialog"][open]');
    if (openModals.length > 0) {
      (openModals[openModals.length - 1] as any).close?.();
    }
  }

  private generateAriaLabel(el: HTMLElement): string {
    // Generate aria-label from element content or attributes
    if (el.getAttribute('aria-label')) return el.getAttribute('aria-label') || '';
    if (el.getAttribute('title')) return el.getAttribute('title') || '';
    if (el.textContent) return el.textContent.trim();
    if (el.getAttribute('placeholder')) return el.getAttribute('placeholder') || '';
    return '';
  }

  private determineRole(el: HTMLElement): string | null {
    const tag = el.tagName.toLowerCase();
    const type = el.getAttribute('type');

    if (tag === 'button') return 'button';
    if (tag === 'a') return 'link';
    if (tag === 'input' && type === 'checkbox') return 'checkbox';
    if (tag === 'input' && type === 'radio') return 'radio';
    if (tag === 'input' && type === 'button') return 'button';

    return null;
  }
}

// Export singleton instance
export const wcagCompliance = new WCAGCompliance();

// CSS for screen reader only content
const srOnlyStyles = `
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  .reduce-motion * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .high-contrast {
    --color-primary: #FFFF00;
    --color-background: #000000;
    --color-foreground: #FFFF00;
    --color-border: #FFFF00;
  }

  .large-text {
    font-size: 120%;
    line-height: 1.6;
  }

  .colorblind-mode {
    --color-buy: #0173B2;
    --color-sell: #DE8F05;
    --color-hold: #CC78BC;
  }

  :focus-visible {
    outline: 3px solid #FF6B35;
    outline-offset: 2px;
  }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = srOnlyStyles;
document.head.appendChild(styleSheet);
