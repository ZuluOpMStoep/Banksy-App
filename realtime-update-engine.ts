import { describe, it, expect } from 'vitest';
import { EconomicCalendarFilter } from './economic-calendar-filter';
import { EconomicEvent } from '@/lib/types/trading';

describe('EconomicCalendarFilter', () => {
  const filter = new EconomicCalendarFilter();

  // Helper to create mock events
  const createEvent = (
    name: string,
    impact: 'high' | 'medium' | 'low',
    offsetMinutes: number,
    assets: string[] = ['GOLD', 'SILVER']
  ): EconomicEvent => ({
    id: `event-${Date.now()}-${Math.random()}`,
    name,
    timestamp: Date.now() + offsetMinutes * 60 * 1000,
    impact,
    relatedAssets: assets,
    country: 'US',
    forecast: 0.5,
    previous: 0.3,
    actual: undefined,
  });

  describe('shouldAllowSignal', () => {
    it('should allow signals when no events are nearby', () => {
      const events = [
        createEvent('NFP', 'high', 120), // 2 hours away
      ];
      filter.setEvents(events);

      const result = filter.shouldAllowSignal('GOLD');
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('No nearby');
    });

    it('should block signals during high-impact events', () => {
      const now = Date.now();
      const events = [
        createEvent('NFP', 'high', 0), // Right now
      ];
      filter.setEvents(events);

      const result = filter.shouldAllowSignal('GOLD', now);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('High-impact');
    });

    it('should block signals during medium-impact events', () => {
      const now = Date.now();
      const events = [
        createEvent('CPI', 'medium', 0), // Right now
      ];
      filter.setEvents(events);

      const result = filter.shouldAllowSignal('GOLD', now);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Medium-impact');
    });

    it('should allow signals during low-impact events', () => {
      const now = Date.now();
      const events = [
        createEvent('Unemployment', 'low', 0), // Right now
      ];
      filter.setEvents(events);

      const result = filter.shouldAllowSignal('GOLD', now);
      expect(result.allowed).toBe(true);
      expect(result.reason).toContain('low-impact');
    });

    it('should respect event window duration for high-impact', () => {
      const now = Date.now();
      const events = [
        createEvent('NFP', 'high', 0), // Right now
      ];
      filter.setEvents(events);

      // 29 minutes before event - should block (window is 30 min)
      const result1 = filter.shouldAllowSignal('GOLD', now - 29 * 60 * 1000);
      expect(result1.allowed).toBe(false);

      // 31 minutes before event - should allow
      const result2 = filter.shouldAllowSignal('GOLD', now - 31 * 60 * 1000);
      expect(result2.allowed).toBe(true);
    });

    it('should not block unrelated assets', () => {
      const now = Date.now();
      const events = [
        createEvent('NFP', 'high', 0, ['GOLD']), // Only affects GOLD
      ];
      filter.setEvents(events);

      const result = filter.shouldAllowSignal('SILVER', now);
      expect(result.allowed).toBe(true);
    });
  });

  describe('getUpcomingEvents', () => {
    it('should return upcoming events within time window', () => {
      const events = [
        createEvent('NFP', 'high', 60), // 1 hour away
        createEvent('CPI', 'medium', 120), // 2 hours away
        createEvent('ECB', 'high', 1440), // 24 hours away
        createEvent('Old', 'low', -60), // 1 hour ago
      ];
      filter.setEvents(events);

      const upcoming = filter.getUpcomingEvents('GOLD', 24);
      expect(upcoming.length).toBe(3);
      expect(upcoming[0].eventName).toBe('NFP');
    });

    it('should sort events by start time', () => {
      const events = [
        createEvent('Event3', 'low', 180),
        createEvent('Event1', 'low', 60),
        createEvent('Event2', 'low', 120),
      ];
      filter.setEvents(events);

      const upcoming = filter.getUpcomingEvents('GOLD', 24);
      expect(upcoming[0].eventName).toBe('Event1');
      expect(upcoming[1].eventName).toBe('Event2');
      expect(upcoming[2].eventName).toBe('Event3');
    });
  });

  describe('getTimeUntilNextEvent', () => {
    it('should return time until next event', () => {
      const now = Date.now();
      const events = [
        createEvent('NFP', 'high', 60), // 1 hour away
      ];
      filter.setEvents(events);

      const timeUntil = filter.getTimeUntilNextEvent('GOLD');
      expect(timeUntil).not.toBeNull();
      expect(timeUntil!).toBeGreaterThan(0);
      expect(timeUntil!).toBeLessThan(65 * 60 * 1000);
    });

    it('should return null when no upcoming events', () => {
      const events = [
        createEvent('Old', 'low', -60), // 1 hour ago
      ];
      filter.setEvents(events);

      const timeUntil = filter.getTimeUntilNextEvent('GOLD');
      expect(timeUntil).toBeNull();
    });
  });

  describe('isInEventWindow', () => {
    it('should return true when in event window', () => {
      const now = Date.now();
      const events = [
        createEvent('NFP', 'high', 0), // Right now
      ];
      filter.setEvents(events);

      const inWindow = filter.isInEventWindow('GOLD');
      expect(inWindow).toBe(true);
    });

    it('should return false when not in event window', () => {
      const events = [
        createEvent('NFP', 'high', 120), // 2 hours away
      ];
      filter.setEvents(events);

      const inWindow = filter.isInEventWindow('GOLD');
      expect(inWindow).toBe(false);
    });
  });

  describe('getEventSummary', () => {
    it('should count events by impact level', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const offset = (today.getTime() - Date.now()) / (60 * 1000) + 60; // 1 hour from start of day

      const events = [
        createEvent('NFP', 'high', offset),
        createEvent('CPI', 'medium', offset + 60),
        createEvent('Unemployment', 'low', offset + 120),
        createEvent('Old', 'high', -1440), // Yesterday
      ];
      filter.setEvents(events);

      const summary = filter.getEventSummary('GOLD');
      expect(summary.highImpact).toBeGreaterThanOrEqual(0);
      expect(summary.mediumImpact).toBeGreaterThanOrEqual(0);
      expect(summary.lowImpact).toBeGreaterThanOrEqual(0);
      expect(summary.totalToday).toBeGreaterThanOrEqual(0);
    });
  });

  describe('setWindowDuration', () => {
    it('should allow customizing window duration', () => {
      const now = Date.now();
      const events = [
        createEvent('NFP', 'high', 0), // Right now
      ];
      filter.setEvents(events);

      // Default: 30 minutes
      const result1 = filter.shouldAllowSignal('GOLD', now - 29 * 60 * 1000);
      expect(result1.allowed).toBe(false);

      // Change to 10 minutes
      filter.setWindowDuration('high', 10 * 60 * 1000);
      const result2 = filter.shouldAllowSignal('GOLD', now - 15 * 60 * 1000);
      expect(result2.allowed).toBe(true);
    });
  });

  describe('getAllEvents', () => {
    it('should return all events', () => {
      const events = [
        createEvent('Event1', 'high', 60),
        createEvent('Event2', 'medium', 120),
      ];
      filter.setEvents(events);

      const all = filter.getAllEvents();
      expect(all.length).toBe(2);
      expect(all[0].name).toBe('Event1');
      expect(all[1].name).toBe('Event2');
    });
  });
});
