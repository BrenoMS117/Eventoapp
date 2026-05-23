export const FeedFilterService = {

  // ── Expiração ─────────────────────────────────────────────────────────

  filterExpired(posts) {
    const now = Date.now();
    return posts.filter(p =>
      !p.expiresAt || p.expiresAt.getTime() > now,
    );
  },

  // ── Estratégia de usuário ─────────────────────────────────────────────

  filterForUser(posts, currentEventId, nearbyEventIds) {
    const active = this.filterExpired(posts);

    if (currentEventId) {
      const inEvent = active.filter(p => p.eventId === currentEventId);
      if (inEvent.length > 0) return inEvent;
    }

    if (nearbyEventIds.length > 0) {
      const nearby = active.filter(p => nearbyEventIds.includes(p.eventId));
      if (nearby.length > 0) return nearby;
    }

    return active.slice(0, 30);
  },

  // ── Estratégia de proprietário ────────────────────────────────────────

  filterForBusiness(posts, ownerEventIds) {
    return this.filterExpired(posts)
      .filter(p => ownerEventIds.includes(p.eventId));
  },

  // ── Rótulo de contexto ────────────────────────────────────────────────

  feedContextLabel(currentEvent, nearbyEventIds, role) {
    if (role === 'business') return 'Posts do seu evento';
    if (currentEvent) return `Você está em: ${currentEvent.name}`;
    if (nearbyEventIds.length > 0) return `${nearbyEventIds.length} evento(s) próximo(s)`;
    return 'Posts recentes';
  },
};
