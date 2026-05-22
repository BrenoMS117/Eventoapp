import { supabase } from '../../lib/supabase';

/**
 * AnnouncementService
 *
 * Gerencia os anúncios rápidos enviados por donos de evento para usuários comuns.
 *
 * Fluxo:
 *   1. Dono chama send() → INSERT em event_announcements no banco.
 *   2. Supabase Realtime propaga o INSERT para todos os clientes assinados.
 *   3. AppContext filtra client-side: só entrega se o evento está no raio do usuário.
 *   4. notificationService.push() injeta a notificação na fila local do usuário.
 *
 * Para donos:
 *   • send(eventId, ownerId, { type, title, body, icon })
 *
 * Para usuários comuns (Realtime):
 *   • startRealtimeSubscription(onAnnouncement) — abre canal, chama callback por INSERT
 *   • setNearbyIds(eventIds)                    — atualiza filtro client-side de proximidade
 *   • stopRealtimeSubscription() / reset()      — chamar no logout
 */
class AnnouncementService {
  constructor() {
    /** Canal Realtime do Supabase */
    this._channel = null;
    /** Callback chamado quando chega um anúncio de evento próximo */
    this._onAnnouncement = null;
    /** IDs de eventos que o usuário está próximo (filtro client-side) */
    this._nearbyIds = new Set();
  }

  // ── Filtro de proximidade ─────────────────────────────────────────────────

  /**
   * Atualiza quais eventos são considerados "próximos" para o usuário atual.
   * Chamado pelo AppContext toda vez que nearbyEventIds muda.
   * @param {string[]} eventIds
   */
  setNearbyIds(eventIds) {
    this._nearbyIds = new Set(eventIds ?? []);
  }

  // ── Subscrição Realtime (usuários comuns) ─────────────────────────────────

  /**
   * Abre canal Realtime e escuta INSERTs em event_announcements.
   * Filtra client-side: só chama onAnnouncement para eventos próximos.
   * Idempotente: chamadas repetidas não abrem canais duplicados.
   *
   * @param {(row: {
   *   id: string,
   *   event_id: string,
   *   type: string,
   *   title: string,
   *   body: string,
   *   icon: string,
   *   created_at: string,
   * }) => void} onAnnouncement
   */
  startRealtimeSubscription(onAnnouncement) {
    if (this._channel) return; // já inscrito
    this._onAnnouncement = onAnnouncement;

    this._channel = supabase
      .channel('event-announcements-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_announcements' },
        (payload) => {
          const row = payload.new;
          if (!row?.event_id) return;
          // Filtro client-side: ignora anúncios de eventos fora do raio
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

  // ── Envio (donos de evento) ───────────────────────────────────────────────

  /**
   * Insere um anúncio no banco.
   * O Supabase Realtime propaga automaticamente o INSERT para os assinantes.
   *
   * @param {string} eventId
   * @param {string} ownerId
   * @param {{ type: string, title: string, body: string, icon: string }} announcement
   * @returns {Promise<{ error: any }>}
   */
  async send(eventId, ownerId, { type, title, body, icon }) {
    const { error } = await supabase
      .from('event_announcements')
      .insert({ event_id: eventId, owner_id: ownerId, type, title, body, icon });
    return { error };
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /** Teardown completo — chamar no logout. */
  reset() {
    this.stopRealtimeSubscription();
    this._nearbyIds = new Set();
  }
}

export const announcementService = new AnnouncementService();
