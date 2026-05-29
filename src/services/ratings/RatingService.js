import { supabase } from '../../lib/supabase';
import { RATING_MAP } from './ratingDefinitions';

const MAX_RATING_CHANNELS = 5;

class RatingService {
  constructor() {
    this._channels = new Map();
    this._callbacks = new Map();
  }

  // ── Comandos ──────────────────────────────────────────────────────────────

  async submitVote(eventId, userId, category) {
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
    // events.rating e events.review_count são atualizados pelo trigger
    // trg_update_event_rating (SECURITY DEFINER) no banco
    return { error: null };
  }

  // ── Consultas ─────────────────────────────────────────────────────────────

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

  subscribeToEvent(eventId, callback) {
    this._callbacks.set(eventId, callback);
    if (this._channels.has(eventId)) return;

    if (this._channels.size >= MAX_RATING_CHANNELS) {
      const oldestId = this._channels.keys().next().value;
      this.unsubscribeFromEvent(oldestId);
    }

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
          const { data: counts } = await this.fetchCounts(eventId);
          if (counts) {
            this._callbacks.get(eventId)?.(eventId, counts);
          }
        },
      )
      .subscribe();

    this._channels.set(eventId, channel);
  }

  unsubscribeFromEvent(eventId) {
    const ch = this._channels.get(eventId);
    if (ch) {
      supabase.removeChannel(ch);
      this._channels.delete(eventId);
    }
    this._callbacks.delete(eventId);
  }

  // ── Computado ─────────────────────────────────────────────────────────────

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

  // ── Ciclo de vida ─────────────────────────────────────────────────────────

  reset() {
    for (const ch of this._channels.values()) supabase.removeChannel(ch);
    this._channels.clear();
    this._callbacks.clear();
  }
}

export const ratingService = new RatingService();
