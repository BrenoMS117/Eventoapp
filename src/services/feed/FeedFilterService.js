/**
 * FeedFilterService — pure functions para filtragem inteligente do feed.
 *
 * Não depende de React, GPS, nem contexto. Recebe dados e retorna dados.
 * Fácil de testar unitariamente sem nenhum mock de ambiente.
 *
 * Estratégias de exibição:
 *
 *   filterForUser()
 *     Prioridade 1 — usuário está dentro do geofence de um evento específico
 *                    → mostra apenas posts desse evento (contexto imersivo)
 *     Prioridade 2 — usuário está perto de eventos (nearbyEventIds)
 *                    → mostra posts de todos os eventos próximos
 *     Prioridade 3 — usuário fora de qualquer evento
 *                    → mostra os posts mais recentes sem filtro geográfico
 *
 *   filterForBusiness()
 *     Exibe apenas posts dos eventos do próprio dono.
 *     Oculta posts de competidores.
 */
export const FeedFilterService = {

  // ── TTL guard ────────────────────────────────────────────────────────

  /**
   * Remove posts com expiresAt no passado.
   * Posts sem expiresAt nunca expiram.
   * @param {object[]} posts
   * @returns {object[]}
   */
  filterExpired(posts) {
    const now = Date.now();
    return posts.filter(p =>
      !p.expiresAt || p.expiresAt.getTime() > now,
    );
  },

  // ── User strategy ────────────────────────────────────────────────────

  /**
   * @param {object[]} posts         Lista completa de posts do contexto.
   * @param {string | null} currentEventId  Evento em que o usuário está AGORA.
   * @param {string[]} nearbyEventIds        Eventos dentro do raio de descoberta.
   * @returns {object[]}
   */
  filterForUser(posts, currentEventId, nearbyEventIds) {
    const active = this.filterExpired(posts);

    // Prioridade 1: dentro de um evento específico
    if (currentEventId) {
      const inEvent = active.filter(p => p.eventId === currentEventId);
      if (inEvent.length > 0) return inEvent;
    }

    // Prioridade 2: perto de eventos
    if (nearbyEventIds.length > 0) {
      const nearby = active.filter(p => nearbyEventIds.includes(p.eventId));
      if (nearby.length > 0) return nearby;
    }

    // Prioridade 3: feed global recente (sem filtro geo)
    return active.slice(0, 30);
  },

  // ── Business strategy ─────────────────────────────────────────────────

  /**
   * @param {object[]} posts
   * @param {string[]} ownerEventIds  IDs dos eventos que pertencem a este dono.
   * @returns {object[]}
   */
  filterForBusiness(posts, ownerEventIds) {
    return this.filterExpired(posts)
      .filter(p => ownerEventIds.includes(p.eventId));
  },

  // ── Label helper ─────────────────────────────────────────────────────

  /**
   * Texto descritivo de contexto exibido no topo do feed.
   * @param {object | null} currentEvent
   * @param {string[]} nearbyEventIds
   * @param {string} role
   * @returns {string}
   */
  feedContextLabel(currentEvent, nearbyEventIds, role) {
    if (role === 'business') return 'Posts do seu evento';
    if (currentEvent) return `Você está em: ${currentEvent.name}`;
    if (nearbyEventIds.length > 0) return `${nearbyEventIds.length} evento(s) próximo(s)`;
    return 'Posts recentes';
  },
};
