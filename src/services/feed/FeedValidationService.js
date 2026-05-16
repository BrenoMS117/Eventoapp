import { geoService } from '../geo/GeoService';

/**
 * FeedValidationService — Observer de localização para o módulo de Feed.
 *
 * Responsabilidade única: validar operações de feed com base na
 * posição geográfica do usuário. Não conhece React, não renderiza nada.
 *
 * Padrão Observer: o hook useFeed() assina as mudanças de `userCoords`
 * (providas pelo AppContext) e chama este serviço para recalcular
 * permissões e evento atual. Assim a lógica de localização fica
 * completamente separada da lógica de exibição.
 */
export class FeedValidationService {

  // ── Posting gate ─────────────────────────────────────────────────────

  /**
   * Verifica se o usuário pode postar em um evento específico.
   * Requer que o usuário esteja fisicamente dentro do geofence do evento.
   *
   * @param {{ lat: number, lng: number } | null} userCoords
   * @param {object | null} event  Evento-alvo com lat/lng opcionais.
   * @param {string} role
   * @returns {{ allowed: boolean, reason: string | null }}
   */
  validatePostPermission(userCoords, event, role = 'user') {
    if (!event) {
      return { allowed: false, reason: 'Selecione um evento antes de postar.' };
    }
    if (!userCoords) {
      return { allowed: false, reason: 'Localização indisponível. Ative o GPS.' };
    }
    if (event.lat == null || event.lng == null) {
      // Evento sem coordenadas cadastradas: permite por degradação graciosa.
      return { allowed: true, reason: null };
    }

    const fence = geoService.checkGeofence(
      userCoords,
      { lat: event.lat, lng: event.lng },
      role,
    );

    if (!fence.isInside) {
      return {
        allowed: false,
        reason: `Você está a ${fence.distanceM} m de ${event.venue}. Aproxime-se até ${fence.requiredM} m para postar.`,
      };
    }

    return { allowed: true, reason: null };
  }

  // ── Current event detection ───────────────────────────────────────────

  /**
   * Retorna o primeiro evento em que o usuário está fisicamente presente
   * (dentro do geofence). Retorna null se não estiver em nenhum evento.
   *
   * @param {{ lat: number, lng: number } | null} userCoords
   * @param {object[]} events
   * @param {string} role
   * @returns {object | null}
   */
  findCurrentEvent(userCoords, events, role = 'user') {
    if (!userCoords) return null;

    for (const event of events) {
      if (event.lat == null || event.lng == null) continue;
      const fence = geoService.checkGeofence(
        userCoords,
        { lat: event.lat, lng: event.lng },
        role,
      );
      if (fence.isInside) return event;
    }
    return null;
  }

  // ── TTL calculation ───────────────────────────────────────────────────

  /**
   * Calcula quando um post deve expirar: horário de término do evento + 2h.
   *
   * Aceita `endsAt` como ISO datetime ou string "HH:MM".
   * Se `endsAt` não puder ser interpretado, o post expira em 24h (fallback).
   *
   * @param {object | null} event
   * @returns {string} ISO datetime de expiração.
   */
  calculateExpiry(event) {
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
    const FALLBACK_MS  = 24 * 60 * 60 * 1000;

    if (!event?.endsAt) {
      return new Date(Date.now() + FALLBACK_MS).toISOString();
    }

    // Caso 1: ISO datetime completo
    const iso = new Date(event.endsAt);
    if (!isNaN(iso.getTime())) {
      return new Date(iso.getTime() + TWO_HOURS_MS).toISOString();
    }

    // Caso 2: string "HH:MM" — combina com a data de hoje
    const match = String(event.endsAt).match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
      const now = new Date();
      const end = new Date(
        now.getFullYear(), now.getMonth(), now.getDate(),
        parseInt(match[1], 10), parseInt(match[2], 10),
      );
      // Se o horário já passou hoje, considera amanhã
      if (end <= now) end.setDate(end.getDate() + 1);
      return new Date(end.getTime() + TWO_HOURS_MS).toISOString();
    }

    return new Date(Date.now() + FALLBACK_MS).toISOString();
  }

  // ── Expiry label ──────────────────────────────────────────────────────

  /**
   * Formata o tempo restante de um post de forma legível.
   * @param {Date | null} expiresAt
   * @returns {string | null}
   */
  formatTimeLeft(expiresAt) {
    if (!expiresAt) return null;
    const diffMs = expiresAt.getTime() - Date.now();
    if (diffMs <= 0) return 'Expirado';
    const h = Math.floor(diffMs / 3600000);
    const m = Math.floor((diffMs % 3600000) / 60000);
    if (h > 0) return `Expira em ${h}h ${m}min`;
    return `Expira em ${m}min`;
  }
}

/** Singleton — compartilhado por toda a aplicação. */
export const feedValidationService = new FeedValidationService();
