import { supabase } from '../../lib/supabase';
import { RATING_MAP, computeWeightedRating } from './ratingDefinitions';

// ─────────────────────────────────────────────────────────────────────────────
// RatingService — Service Layer for event quick-rating
//
// Responsibilities:
//   • Command: submitVote (upsert — handles new vote + vote change atomically)
//   • Query:   fetchCounts, fetchUserVote
//   • Realtime: per-event Supabase channel, notifies AppContext on any change
//   • Computed: computeFeatured (dominant category)
//   • Metadata: updates events.rating and events.review_count consistently
//
// DB migration required:
//   CREATE TABLE IF NOT EXISTS event_ratings (
//     id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//     event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
//     user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
//     category   TEXT NOT NULL,
//     created_at TIMESTAMPTZ DEFAULT NOW(),
//     updated_at TIMESTAMPTZ DEFAULT NOW(),
//     UNIQUE(event_id, user_id)         -- one vote per user; upsert handles changes
//   );
//   CREATE INDEX IF NOT EXISTS idx_event_ratings_event ON event_ratings(event_id);
//
//   -- RLS
//   ALTER TABLE event_ratings ENABLE ROW LEVEL SECURITY;
//   CREATE POLICY "Anyone can read ratings"
//     ON event_ratings FOR SELECT USING (true);
//   CREATE POLICY "Users can upsert own ratings"
//     ON event_ratings FOR ALL USING (auth.uid() = user_id);
// ─────────────────────────────────────────────────────────────────────────────

class RatingService {
  constructor() {
    /** eventId → Supabase Realtime channel */
    this._channels = new Map();
    /** eventId → (eventId, counts) callback registered by AppContext */
    this._callbacks = new Map();
  }

  // ── Commands ──────────────────────────────────────────────────────────────

  /**
   * Upsert a vote for an (event, user) pair.
   * Changing the category replaces the existing vote (no duplicates).
   * After a successful upsert, updates events.rating and events.review_count.
   *
   * @param {string} eventId
   * @param {string} userId
   * @param {string} category  — must be a key in RATING_OPTIONS
   * @returns {Promise<{ error: any }>}
   */
  async submitVote(eventId, userId, category) {
    // 1 — Upsert the vote (conflict on (event_id, user_id) → update category)
    const { error: voteErr } = await supabase
      .from('event_ratings')
      .upsert(
        {
          event_id:   eventId,
          user_id:    userId,
          category,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'event_id,user_id' },
      );
    if (voteErr) return { error: voteErr };

    // 2 — Recompute counts and sync metadata on events table
    const { data: counts } = await this.fetchCounts(eventId);
    if (counts) {
      const reviewCount = Object.values(counts).reduce((a, b) => a + b, 0);
      const rating      = computeWeightedRating(counts);
      await supabase
        .from('events')
        .update({ review_count: reviewCount, rating })
        .eq('id', eventId);
    }

    return { error: null };
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  /**
   * Fetch aggregated vote counts for an event.
   * Returns a plain object keyed by category, e.g. { fogo: 12, tranquilo: 4 }.
   *
   * @param {string} eventId
   * @returns {Promise<{ data: Record<string, number>|null, error: any }>}
   */
  async fetchCounts(eventId) {
    const { data, error } = await supabase
      .from('event_ratings')
      .select('category')
      .eq('event_id', eventId);

    if (error) return { data: null, error };

    const counts = {};
    for (const row of data) {
      counts[row.category] = (counts[row.category] ?? 0) + 1;
    }
    return { data: counts, error: null };
  }

  /**
   * Fetch the current user's vote for an event (null if they haven't voted).
   *
   * @param {string} eventId
   * @param {string} userId
   * @returns {Promise<{ category: string|null, error: any }>}
   */
  async fetchUserVote(eventId, userId) {
    const { data, error } = await supabase
      .from('event_ratings')
      .select('category')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle();
    return { category: data?.category ?? null, error: error ?? null };
  }

  // ── Realtime ──────────────────────────────────────────────────────────────

  /**
   * Subscribe to any INSERT/UPDATE/DELETE on event_ratings for a specific event.
   * On every change, refetches counts and calls the callback with fresh data.
   * Safe to call multiple times for the same eventId (idempotent).
   *
   * @param {string} eventId
   * @param {(eventId: string, counts: Record<string, number>) => void} callback
   */
  subscribeToEvent(eventId, callback) {
    this._callbacks.set(eventId, callback);
    if (this._channels.has(eventId)) return; // channel already open

    const channel = supabase
      .channel(`ratings-${eventId}`)
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'event_ratings',
          filter: `event_id=eq.${eventId}`,
        },
        async () => {
          // Refetch on any change — avoids race conditions with simultaneous votes
          const { data: counts } = await this.fetchCounts(eventId);
          if (counts) {
            this._callbacks.get(eventId)?.(eventId, counts);
          }
        },
      )
      .subscribe();

    this._channels.set(eventId, channel);
  }

  /** Remove the Realtime channel for an event and its callback. */
  unsubscribeFromEvent(eventId) {
    const ch = this._channels.get(eventId);
    if (ch) {
      supabase.removeChannel(ch);
      this._channels.delete(eventId);
    }
    this._callbacks.delete(eventId);
  }

  // ── Computed ──────────────────────────────────────────────────────────────

  /**
   * Identifies the dominant category from a counts map.
   * Returns null when there are no votes.
   *
   * @param {Record<string, number>} counts
   * @returns {{
   *   category: string,
   *   icon: string,
   *   label: string,
   *   cor: string,
   *   votes: number,
   *   total: number,
   *   pct: number,
   *   isClear: boolean  — true when winner holds ≥35% of all votes
   * } | null}
   */
  computeFeatured(counts) {
    const entries = Object.entries(counts).filter(([, v]) => v > 0);
    if (entries.length === 0) return null;

    entries.sort(([, a], [, b]) => b - a);
    const [topKey, topVotes] = entries[0];
    const total = entries.reduce((s, [, v]) => s + v, 0);
    const pct   = Math.round((topVotes / total) * 100);
    const opt   = RATING_MAP[topKey];

    return {
      category: topKey,
      icon:     opt?.icon  ?? '⭐',
      label:    opt?.label ?? topKey,
      cor:      opt?.cor   ?? '#E83B5C',
      votes:    topVotes,
      total,
      pct,
      isClear: pct >= 35,
    };
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /** Close all open channels. Call on logout. */
  reset() {
    for (const ch of this._channels.values()) supabase.removeChannel(ch);
    this._channels.clear();
    this._callbacks.clear();
  }
}

export const ratingService = new RatingService();
