/**
 * World Events Service
 * Monitors economic calendar, geopolitical events, and their market impact
 * Integrates with MPS v2 for real-time signal adjustment
 */

import type { WorldEvent } from '@/lib/indicators/mps-v2-engine';

export interface EconomicEvent {
  id: string;
  name: string;
  country: string;
  date: number;
  forecast: number;
  previous: number;
  actual?: number;
  importance: 'high' | 'medium' | 'low';
  affectedAssets: string[]; // e.g., ['EURUSD', 'XAUUSD']
  impact?: number; // -1 to 1
}

export interface GeopoliticalEvent {
  id: string;
  title: string;
  description: string;
  date: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'war' | 'sanctions' | 'trade' | 'political' | 'natural_disaster';
  affectedCountries: string[];
  affectedAssets: string[];
  sentiment: 'negative' | 'neutral' | 'positive';
}

export class WorldEventsService {
  private economicEvents: EconomicEvent[] = [];
  private geopoliticalEvents: GeopoliticalEvent[] = [];
  private eventImpactMap: Map<string, number> = new Map();

  /**
   * Initialize with historical events
   */
  public async initialize(): Promise<void> {
    await this.fetchEconomicCalendar();
    await this.fetchGeopoliticalEvents();
  }

  /**
   * Fetch economic calendar from TradingView or similar API
   */
  private async fetchEconomicCalendar(): Promise<void> {
    // In production: fetch from TradingView Economic Calendar API
    // For now: use mock data
    
    const mockEvents: EconomicEvent[] = [
      {
        id: 'nfp-2026-02',
        name: 'Non-Farm Payroll',
        country: 'US',
        date: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days from now
        forecast: 200000,
        previous: 180000,
        importance: 'high',
        affectedAssets: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'XAUUSD'],
      },
      {
        id: 'ecb-rate-2026-03',
        name: 'ECB Interest Rate Decision',
        country: 'EU',
        date: Date.now() + 10 * 24 * 60 * 60 * 1000,
        forecast: 3.5,
        previous: 3.25,
        importance: 'high',
        affectedAssets: ['EURUSD', 'EURGBP', 'XAUUSD'],
      },
      {
        id: 'cpi-us-2026-02',
        name: 'Consumer Price Index',
        country: 'US',
        date: Date.now() + 5 * 24 * 60 * 60 * 1000,
        forecast: 2.8,
        previous: 2.6,
        importance: 'high',
        affectedAssets: ['EURUSD', 'XAUUSD', 'BTCUSD'],
      },
    ];

    this.economicEvents = mockEvents;
  }

  /**
   * Fetch geopolitical events
   */
  private async fetchGeopoliticalEvents(): Promise<void> {
    // In production: fetch from news APIs or geopolitical risk indices
    // For now: use mock data
    
    const mockEvents: GeopoliticalEvent[] = [
      {
        id: 'trade-war-2026',
        title: 'US-China Trade Tensions Escalate',
        description: 'New tariffs announced on Chinese imports',
        date: Date.now() - 2 * 24 * 60 * 60 * 1000,
        severity: 'high',
        type: 'trade',
        affectedCountries: ['US', 'China'],
        affectedAssets: ['EURUSD', 'AUDUSD', 'XAUUSD', 'BTCUSD'],
        sentiment: 'negative',
      },
      {
        id: 'middle-east-tensions',
        title: 'Middle East Geopolitical Tensions',
        description: 'Regional conflict escalation',
        date: Date.now() - 1 * 24 * 60 * 60 * 1000,
        severity: 'high',
        type: 'war',
        affectedCountries: ['Israel', 'Iran', 'Saudi Arabia'],
        affectedAssets: ['XAUUSD', 'XAGUSD', 'EURUSD', 'USDJPY'],
        sentiment: 'negative',
      },
    ];

    this.geopoliticalEvents = mockEvents;
  }

  /**
   * Get upcoming high-impact events (next 7 days)
   */
  public getUpcomingHighImpactEvents(): (EconomicEvent | GeopoliticalEvent)[] {
    const now = Date.now();
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;

    const economicHighImpact = this.economicEvents.filter(
      e => e.importance === 'high' && e.date > now && e.date < sevenDaysFromNow
    );

    const geopoliticalHighImpact = this.geopoliticalEvents.filter(
      e => e.severity === 'high' && e.date > now && e.date < sevenDaysFromNow
    );

    return [...economicHighImpact, ...geopoliticalHighImpact].sort(
      (a, b) => a.date - b.date
    );
  }

  /**
   * Calculate event impact on asset (0-1 scale)
   */
  public calculateEventImpact(assetId: string, event: EconomicEvent | GeopoliticalEvent): number {
    if (!event.affectedAssets.includes(assetId)) return 0;

    let impact = 0;

    if ('importance' in event) {
      // Economic event
      const economicEvent = event as EconomicEvent;
      impact = economicEvent.importance === 'high' ? 0.3 : 
               economicEvent.importance === 'medium' ? 0.15 : 0.05;

      // Adjust based on forecast vs previous
      if (economicEvent.actual !== undefined) {
        const surprise = Math.abs(economicEvent.actual - economicEvent.forecast) / economicEvent.forecast;
        impact *= (1 + surprise);
      }
    } else {
      // Geopolitical event
      const geoEvent = event as GeopoliticalEvent;
      impact = geoEvent.severity === 'critical' ? 0.5 :
               geoEvent.severity === 'high' ? 0.3 :
               geoEvent.severity === 'medium' ? 0.15 : 0.05;

      // Gold benefits from negative sentiment
      if (assetId === 'XAUUSD' && geoEvent.sentiment === 'negative') {
        impact *= 1.5;
      }

      // Risk assets suffer from negative sentiment
      if (['BTCUSD', 'EURUSD'].includes(assetId) && geoEvent.sentiment === 'negative') {
        impact *= 0.7;
      }
    }

    return Math.min(1, impact);
  }

  /**
   * Get event-adjusted signal for asset
   */
  public getEventAdjustedSignal(assetId: string): {
    adjustment: number; // -1 to 1
    reason: string;
    events: string[];
  } {
    const now = Date.now();
    const fourHoursAgo = now - 4 * 60 * 60 * 1000;

    // Recent events
    const recentEconomic = this.economicEvents.filter(
      e => e.affectedAssets.includes(assetId) && e.date > fourHoursAgo && e.date <= now
    );

    const recentGeopolitical = this.geopoliticalEvents.filter(
      e => e.affectedAssets.includes(assetId) && e.date > fourHoursAgo && e.date <= now
    );

    let totalAdjustment = 0;
    const eventNames: string[] = [];

    // Economic events
    recentEconomic.forEach(event => {
      const impact = this.calculateEventImpact(assetId, event);
      
      if (event.actual !== undefined) {
        // Event has occurred
        const surprise = (event.actual - event.forecast) / event.forecast;
        totalAdjustment += impact * surprise;
        eventNames.push(`${event.name}: ${event.actual > event.forecast ? 'Beat' : 'Miss'}`);
      }
    });

    // Geopolitical events
    recentGeopolitical.forEach(event => {
      const impact = this.calculateEventImpact(assetId, event);
      const sentimentMultiplier = event.sentiment === 'negative' ? -1 : 1;
      totalAdjustment += impact * sentimentMultiplier;
      eventNames.push(event.title);
    });

    let reason = 'No recent events';
    if (eventNames.length > 0) {
      reason = `Affected by: ${eventNames.join(', ')}`;
    }

    return {
      adjustment: Math.max(-1, Math.min(1, totalAdjustment)),
      reason,
      events: eventNames,
    };
  }

  /**
   * Get event risk level for asset (0-100)
   */
  public getEventRiskLevel(assetId: string): number {
    const now = Date.now();
    const nextTwentyFourHours = now + 24 * 60 * 60 * 1000;

    const upcomingEvents = [
      ...this.economicEvents.filter(
        e => e.affectedAssets.includes(assetId) && e.date > now && e.date < nextTwentyFourHours
      ),
      ...this.geopoliticalEvents.filter(
        e => e.affectedAssets.includes(assetId) && e.date > now && e.date < nextTwentyFourHours
      ),
    ];

    if (upcomingEvents.length === 0) return 0;

    let totalRisk = 0;
    upcomingEvents.forEach(event => {
      const impact = this.calculateEventImpact(assetId, event);
      totalRisk += impact * 100;
    });

    return Math.min(100, totalRisk);
  }

  /**
   * Get asset correlation with event type
   */
  public getAssetEventCorrelation(assetId: string, eventType: string): number {
    const correlations: { [key: string]: { [key: string]: number } } = {
      'XAUUSD': {
        'war': 0.85,
        'sanctions': 0.75,
        'trade': 0.60,
        'political': 0.50,
        'natural_disaster': 0.70,
        'high_inflation': 0.80,
        'rate_cut': -0.70,
      },
      'BTCUSD': {
        'war': -0.40,
        'sanctions': -0.50,
        'trade': -0.60,
        'political': -0.30,
        'natural_disaster': -0.20,
        'recession': -0.75,
      },
      'EURUSD': {
        'ecb_rate': 0.85,
        'trade': -0.70,
        'political': -0.50,
        'war': -0.60,
      },
    };

    const assetCorr = correlations[assetId] || {};
    return assetCorr[eventType] || 0;
  }

  /**
   * Add custom event
   */
  public addEconomicEvent(event: EconomicEvent): void {
    this.economicEvents.push(event);
  }

  public addGeopoliticalEvent(event: GeopoliticalEvent): void {
    this.geopoliticalEvents.push(event);
  }

  /**
   * Update event with actual value
   */
  public updateEventActual(eventId: string, actual: number): void {
    const event = this.economicEvents.find(e => e.id === eventId);
    if (event) {
      event.actual = actual;
    }
  }

  /**
   * Get event summary for asset
   */
  public getEventSummary(assetId: string): string {
    const upcoming = this.getUpcomingHighImpactEvents()
      .filter(e => e.affectedAssets.includes(assetId))
      .slice(0, 3);

    if (upcoming.length === 0) {
      return 'No significant events scheduled';
    }

    return upcoming
      .map(e => {
        const hoursUntil = Math.round((e.date - Date.now()) / (60 * 60 * 1000));
        const name = 'name' in e ? e.name : e.title;
        return `${name} in ${hoursUntil}h`;
      })
      .join(' • ');
  }

  /**
   * Cleanup old events
   */
  public cleanup(): void {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    this.economicEvents = this.economicEvents.filter(e => e.date > thirtyDaysAgo);
    this.geopoliticalEvents = this.geopoliticalEvents.filter(e => e.date > thirtyDaysAgo);
  }
}

export const worldEventsService = new WorldEventsService();
