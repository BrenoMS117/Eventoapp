import { geoService } from '../geo/GeoService';

export class FeedValidationService {

  // ── Validação de postagem ─────────────────────────────────────────────

  validatePostPermission(userCoords, event, role = 'user') {
    if (!event) {
      return { allowed: false, reason: 'Selecione um evento antes de postar.' };
    }
    if (!userCoords) {
      return { allowed: false, reason: 'Localização indisponível. Ative o GPS.' };
    }
    if (event.lat == null || event.lng == null) {
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

  // ── Detecção de evento atual ──────────────────────────────────────────

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

  // ── Cálculo de expiração ──────────────────────────────────────────────

  calculateExpiry(event) {
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
    const FALLBACK_MS  = 24 * 60 * 60 * 1000;

    if (!event?.endsAt) {
      return new Date(Date.now() + FALLBACK_MS).toISOString();
    }

    const iso = new Date(event.endsAt);
    if (!isNaN(iso.getTime())) {
      return new Date(iso.getTime() + TWO_HOURS_MS).toISOString();
    }

    const match = String(event.endsAt).match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
      const now = new Date();
      const end = new Date(
        now.getFullYear(), now.getMonth(), now.getDate(),
        parseInt(match[1], 10), parseInt(match[2], 10),
      );
      if (end <= now) end.setDate(end.getDate() + 1);
      return new Date(end.getTime() + TWO_HOURS_MS).toISOString();
    }

    return new Date(Date.now() + FALLBACK_MS).toISOString();
  }

  // ── Rótulo de expiração ───────────────────────────────────────────────

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

export const feedValidationService = new FeedValidationService();
