import { supabase } from '../../lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a crowd_label for the given 0–100 level.
 * Matches the labels already used by eventsService.updateCrowdLevel.
 */
function _labelFromLevel(level) {
  return level >= 85 ? 'Lotado'
       : level >= 60 ? 'Bastante cheio'
       : level >= 30 ? 'Moderado'
       : 'Tranquilo';
}

/**
 * Estimates a qualitative crowd_level when max_capacity is unknown.
 * Based on absolute checked-in count.
 */
function _levelFromCount(count) {
  if (count >= 300) return 95;
  if (count >= 150) return 78;
  if (count >= 75)  return 55;
  if (count >= 30)  return 32;
  if (count >= 10)  return 18;
  return Math.max(1, count * 2);
}

/**
 * Atomically reads checked_in_count + max_capacity, applies delta,
 * recalculates crowd metrics and writes them back.
 *
 * NOTE: uses read-then-write (no stored procedure required).
 * Race-condition risk is acceptable for crowd estimation purposes.
 *
 * @param {string} eventId
 * @param {+1|-1} delta
 * @returns {Promise<{error: any, count?: number, level?: number, label?: string}>}
 */
async function _applyDelta(eventId, delta) {
  const { data, error } = await supabase
    .from('events')
    .select('checked_in_count, max_capacity')
    .eq('id', eventId)
    .single();

  if (error) return { error };

  const newCount = Math.max(0, (data.checked_in_count ?? 0) + delta);
  const cap = data.max_capacity;
  const level = cap
    ? Math.min(100, Math.round((newCount / cap) * 100))
    : _levelFromCount(newCount);
  const label = _labelFromLevel(level);

  const { error: upErr } = await supabase
    .from('events')
    .update({ checked_in_count: newCount, crowd_level: level, crowd_label: label })
    .eq('id', eventId);

  return { error: upErr ?? null, count: newCount, level, label };
}

// ─────────────────────────────────────────────────────────────────────────────
// CrowdManagementService
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CrowdManagementService
 *
 * Handles the full check-in / check-out lifecycle for crowd tracking.
 * Decoupled from React: owns no state, no hooks, no components.
 *
 * Integration points:
 *   • setUpdateCallback(fn)  — called with (eventId, patch) on every crowd change
 *   • checkIn(eventId)       — manual or triggered by coupon redemption
 *   • checkOut(eventId)      — manual, geo-exit, or event-end timer
 *   • startRealtimeSubscription() / stopRealtimeSubscription()
 *   • processGeoUpdate(nearbyIds) — auto-checkout for events left behind
 *   • reset()                — call on logout
 *
 * DB migration required:
 *   ALTER TABLE events ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT NULL;
 *   (checked_in_count, crowd_level, crowd_label already exist)
 */
class CrowdManagementService {
  constructor() {
    /** eventIds the current device user is actively checked into */
    this._checkedInEvents = new Set();
    /** auto check-out timers keyed by eventId */
    this._checkOutTimers = new Map();
    /** AppContext callback to propagate crowd patches to events state */
    this._onUpdate = null;
    /** Supabase Realtime channel for live crowd broadcasts */
    this._realtimeChannel = null;
  }

  // ── Callback wiring ───────────────────────────────────────────────────────

  /**
   * Register the function AppContext uses to apply crowd patches.
   * Called once at AppProvider mount with a stable setter reference.
   * @param {(eventId: string, patch: object) => void} fn
   */
  setUpdateCallback(fn) {
    this._onUpdate = fn;
  }

  // ── Check-in status ───────────────────────────────────────────────────────

  /** Returns true if the user is currently checked into the given event. */
  isCheckedIn(eventId) {
    return this._checkedInEvents.has(eventId);
  }

  /** Returns all event IDs the user is currently checked into. */
  getCheckedInEventIds() {
    return [...this._checkedInEvents];
  }

  // ── Check-in ──────────────────────────────────────────────────────────────

  /**
   * Check the current user into an event.
   * Adds the event to the in-memory set, writes the DB, and notifies AppContext.
   *
   * @param {string} eventId
   * @returns {Promise<{error: any, alreadyIn?: boolean, count?: number, level?: number, label?: string}>}
   */
  async checkIn(eventId) {
    if (this._checkedInEvents.has(eventId)) return { alreadyIn: true };

    this._checkedInEvents.add(eventId);
    const result = await _applyDelta(eventId, +1);

    if (result.error) {
      // Rollback the optimistic add
      this._checkedInEvents.delete(eventId);
    } else {
      this._onUpdate?.(eventId, {
        checkedInCount: result.count,
        crowdLevel:     result.level,
        crowdLabel:     result.label,
      });
    }
    return result;
  }

  // ── Check-out ─────────────────────────────────────────────────────────────

  /**
   * Check the current user out from an event.
   * Silently no-ops if the user was not checked in.
   *
   * @param {string} eventId
   * @returns {Promise<{error: any, notIn?: boolean, count?: number, level?: number, label?: string}>}
   */
  async checkOut(eventId) {
    this._clearTimer(eventId);

    if (!this._checkedInEvents.has(eventId)) return { notIn: true };
    this._checkedInEvents.delete(eventId);

    const result = await _applyDelta(eventId, -1);
    if (!result.error) {
      this._onUpdate?.(eventId, {
        checkedInCount: result.count,
        crowdLevel:     result.level,
        crowdLabel:     result.label,
      });
    }
    return result;
  }

  // ── Auto check-out: event end timer ───────────────────────────────────────

  /**
   * Schedule an automatic check-out when the event's ends_at time arrives.
   * Replaces any existing timer for this event.
   *
   * @param {string} eventId
   * @param {string|null} endsAtIso  ISO-8601 timestamp or null
   */
  scheduleAutoCheckOut(eventId, endsAtIso) {
    if (!endsAtIso) return;
    const endTime = new Date(endsAtIso).getTime();
    // Guard: endsAt is stored as a plain "HH:MM" time string, not a full
    // ISO-8601 datetime. new Date("02:00") → Invalid Date → NaN.
    // setTimeout(fn, NaN) coerces to setTimeout(fn, 0) and fires immediately,
    // causing instant checkout right after check-in. Skip scheduling in that case.
    if (isNaN(endTime)) return;
    const delay = endTime - Date.now();
    if (delay <= 0) {
      // Event already over — check out immediately if still in
      if (this._checkedInEvents.has(eventId)) this.checkOut(eventId);
      return;
    }
    this._clearTimer(eventId);
    const timer = setTimeout(() => {
      this._checkOutTimers.delete(eventId);
      this.checkOut(eventId);
    }, delay);
    this._checkOutTimers.set(eventId, timer);
  }

  // ── Auto check-out: geo exit ──────────────────────────────────────────────

  /**
   * Called by AppContext's geo watcher after it computes new nearby event IDs.
   * Returns the list of eventIds that were checked in but are no longer nearby
   * — AppContext uses this to update checkedInEventIds state and call checkOut.
   *
   * @param {string[]} currentNearbyIds
   * @returns {string[]} eventIds to check out
   */
  getStaleCheckIns(currentNearbyIds) {
    return [...this._checkedInEvents].filter(
      (id) => !currentNearbyIds.includes(id),
    );
  }

  // ── Realtime subscription ─────────────────────────────────────────────────

  /**
   * Subscribe to all event UPDATE events via Supabase Realtime.
   * Patches crowd fields into AppContext's events state.
   * Safe to call multiple times — only opens one channel.
   */
  startRealtimeSubscription() {
    if (this._realtimeChannel) return;

    this._realtimeChannel = supabase
      .channel('crowd-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'events' },
        (payload) => {
          const d = payload.new;
          if (!d?.id) return;
          this._onUpdate?.(d.id, {
            crowdLevel:     d.crowd_level      ?? 0,
            crowdLabel:     d.crowd_label      ?? 'Aguardando',
            checkedInCount: d.checked_in_count ?? 0,
            isLive:         d.is_live          ?? false,
            // Propagate rating metadata updated by RatingService.submitVote
            rating:         d.rating           ?? 0,
            reviewCount:    d.review_count     ?? 0,
          });
        },
      )
      .subscribe();
  }

  stopRealtimeSubscription() {
    if (this._realtimeChannel) {
      supabase.removeChannel(this._realtimeChannel);
      this._realtimeChannel = null;
    }
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /**
   * Full teardown — call on logout.
   * Cancels all timers, clears the checked-in set, stops Realtime.
   */
  reset() {
    for (const timer of this._checkOutTimers.values()) clearTimeout(timer);
    this._checkOutTimers.clear();
    this._checkedInEvents.clear();
    this.stopRealtimeSubscription();
    this._onUpdate = null;
  }

  // ── Private ───────────────────────────────────────────────────────────────

  _clearTimer(eventId) {
    const timer = this._checkOutTimers.get(eventId);
    if (timer !== undefined) {
      clearTimeout(timer);
      this._checkOutTimers.delete(eventId);
    }
  }
}

export const crowdManagementService = new CrowdManagementService();
