import { supabase } from '../../lib/supabase';

class AnnouncementService {
  constructor() {
    this._channel = null;
    this._onAnnouncement = null;
    this._nearbyIds = new Set();
  }

  // ── Filtro de proximidade ─────────────────────────────────────────────────

  setNearbyIds(eventIds) {
    this._nearbyIds = new Set(eventIds ?? []);
  }

  // ── Assinatura Realtime ───────────────────────────────────────────────────

  startRealtimeSubscription(onAnnouncement) {
    if (this._channel) return;
    this._onAnnouncement = onAnnouncement;

    this._channel = supabase
      .channel('event-announcements-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_announcements' },
        (payload) => {
          const row = payload.new;
          if (!row?.event_id) return;
          if (!this._nearbyIds.has(row.event_id)) return;
          this._onAnnouncement?.(row);
        },
      )
      .subscribe();
  }

  stopRealtimeSubscription() {
    if (this._channel) {
      supabase.removeChannel(this._channel);
      this._channel = null;
      this._onAnnouncement = null;
    }
  }

  // ── Envio ─────────────────────────────────────────────────────────────────

  async send(eventId, ownerId, { type, title, body, icon }) {
    const { error } = await supabase
      .from('event_announcements')
      .insert({ event_id: eventId, owner_id: ownerId, type, title, body, icon });
    return { error };
  }

  // ── Ciclo de vida ─────────────────────────────────────────────────────────

  reset() {
    this.stopRealtimeSubscription();
    this._nearbyIds = new Set();
  }
}

export const announcementService = new AnnouncementService();
