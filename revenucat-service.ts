/**
 * Economic Calendar Filter
 * 
 * Filters trading signals based on economic events
 * Suppresses signals during high-impact events
 */

import { EconomicEvent } from '@/lib/types/trading';

// ============================================================================
// TYPES
// ============================================================================

export interface EventWindow {
  eventId: string;
  eventName: string;
  startTime: number;
  endTime: number;
  impact: 'high' | 'medium' | 'low';
  affectedAssets: string[];
}

export interface SignalFilterResult {
  allowed: boolean;
  reason: string;
  nearbyEvents: EventWindow[];
}

// ============================================================================
// ECONOMIC CALENDAR FILTER
// ============================================================================

export class EconomicCalendarFilter {
  private events: EconomicEvent[] = [];
  private eventWindows: Map<string, EventWindow> = new Map();
  private windowDuration: Map<'high' | 'medium' | 'low', number> = new Map([
    ['high', 30 * 60 * 1000], // 30 minutes before/after
    ['medium', 15 * 60 * 1000], // 15 minutes before/after
    ['low', 5 * 60 * 1000], // 5 minutes before/after
  ]);

  /**
   * Add economic events
   */
  setEvents(events: EconomicEvent[]): void {
    this.events = events;
    this.buildEventWindows();
  }

  /**
   * Build event windows with buffer times
   */
  private buildEventWindows(): void {
    this.eventWindows.clear();

    this.events.forEach((event) => {
      const windowDuration = this.windowDuration.get(event.impact) || 15 * 60 * 1000;
      const startTime = event.timestamp - windowDuration;
      const endTime = event.timestamp + windowDuration;

      const window: EventWindow = {
        eventId: event.id,
        eventName: event.name,
        startTime,
        endTime,
        impact: event.impact,
        affectedAssets: event.relatedAssets,
      };

      this.eventWindows.set(event.id, window);
    });
  }

  /**
   * Check if signal should be allowed for an asset
   */
  shouldAllowSignal(assetId: string, timestamp: number = Date.now()): SignalFilterResult {
    const nearbyEvents = this.getNearbyEvents(assetId, timestamp);

    if (nearbyEvents.length === 0) {
      return {
        allowed: true,
        reason: 'No nearby economic events',
        nearbyEvents: [],
      };
    }

    // Check for high-impact events
    const highImpactEvents = nearbyEvents.filter((e) => e.impact === 'high');
    if (highImpactEvents.length > 0) {
      return {
        allowed: false,
        reason: `High-impact event: ${highImpactEvents[0].eventName}`,
        nearbyEvents,
      };
    }

    // Check for medium-impact events
    const mediumImpactEvents = nearbyEvents.filter((e) => e.impact === 'medium');
    if (mediumImpactEvents.length > 0) {
      return {
        allowed: false,
        reason: `Medium-impact event: ${mediumImpactEvents[0].eventName}`,
        nearbyEvents,
      };
    }

    // Low-impact events are allowed
    return {
      allowed: true,
      reason: 'Only low-impact events nearby',
      nearbyEvents,
    };
  }

  /**
   * Get nearby events for an asset
   */
  private getNearbyEvents(assetId: string, timestamp: number): EventWindow[] {
    const nearby: EventWindow[] = [];

    this.eventWindows.forEach((window) => {
      if (
        window.affectedAssets.includes(assetId) &&
        timestamp >= window.startTime &&
        timestamp <= window.endTime
      ) {
        nearby.push(window);
      }
    });

    return nearby.sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * Get all upcoming events for an asset
   */
  getUpcomingEvents(assetId: string, hoursAhead: number = 24): EventWindow[] {
    const now = Date.now();
    const futureTime = now + hoursAhead * 60 * 60 * 1000;

    const upcoming: EventWindow[] = [];

    this.eventWindows.forEach((window) => {
      if (
        window.affectedAssets.includes(assetId) &&
        window.startTime >= now &&
        window.startTime <= futureTime
      ) {
        upcoming.push(window);
      }
    });

    return upcoming.sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * Get time until next event for an asset
   */
  getTimeUntilNextEvent(assetId: string): number | null {
    const upcoming = this.getUpcomingEvents(assetId, 24);
    if (upcoming.length === 0) return null;

    const nextEvent = upcoming[0];
    return Math.max(0, nextEvent.startTime - Date.now());
  }

  /**
   * Check if currently in event window
   */
  isInEventWindow(assetId: string): boolean {
    const result = this.shouldAllowSignal(assetId);
    return !result.allowed;
  }

  /**
   * Get event impact summary
   */
  getEventSummary(assetId: string): {
    highImpact: number;
    mediumImpact: number;
    lowImpact: number;
    totalToday: number;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrowStart = today.getTime() + 24 * 60 * 60 * 1000;

    let highImpact = 0;
    let mediumImpact = 0;
    let lowImpact = 0;

    this.eventWindows.forEach((window) => {
      if (
        window.affectedAssets.includes(assetId) &&
        window.startTime >= today.getTime() &&
        window.startTime < tomorrowStart
      ) {
        if (window.impact === 'high') highImpact++;
        else if (window.impact === 'medium') mediumImpact++;
        else lowImpact++;
      }
    });

    return {
      highImpact,
      mediumImpact,
      lowImpact,
      totalToday: highImpact + mediumImpact + lowImpact,
    };
  }

  /**
   * Set custom window duration for event impact level
   */
  setWindowDuration(impact: 'high' | 'medium' | 'low', durationMs: number): void {
    this.windowDuration.set(impact, Math.max(0, durationMs));
    this.buildEventWindows();
  }

  /**
   * Get all active events
   */
  getAllEvents(): EconomicEvent[] {
    return [...this.events];
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const economicCalendarFilter = new EconomicCalendarFilter();
