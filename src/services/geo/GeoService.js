import { haversineKm, isWithinRadius } from './GeoCalculator';
import { GEO_PROFILES, DEFAULT_PROFILE } from './GeoProfiles';
import { ExpoLocationProvider } from './providers/ExpoLocationProvider';

class GeoService {
  constructor(provider) {
    this._provider = provider;
  }

  // ── Permissão ─────────────────────────────────────────────────────────

  requestPermission() {
    return this._provider.requestPermission();
  }

  // ── Posição ───────────────────────────────────────────────────────────

  getPosition() {
    return this._provider.getCurrentPosition();
  }

  watchPosition(callback) {
    return this._provider.watchPosition(callback);
  }

  clearWatch(handle) {
    this._provider.clearWatch(handle);
  }

  // ── Descoberta de eventos ─────────────────────────────────────────────

  filterNearbyEvents(userCoords, events, role = 'user') {
    const profile = GEO_PROFILES[role] ?? DEFAULT_PROFILE;
    const distances = new Map();
    const nearbyIds = [];

    for (const event of events) {
      if (event.lat == null || event.lng == null) continue;
      const km = haversineKm(userCoords, { lat: event.lat, lng: event.lng });
      distances.set(event.id, Math.round(km * 10) / 10);
      if (km <= profile.discoveryRadiusKm) nearbyIds.push(event.id);
    }

    return { nearbyIds, distances, radiusKm: profile.discoveryRadiusKm };
  }

  // ── Geofence ──────────────────────────────────────────────────────────

  checkGeofence(userCoords, eventCoords, role = 'user') {
    const profile = GEO_PROFILES[role] ?? DEFAULT_PROFILE;
    const distanceM = Math.round(haversineKm(userCoords, eventCoords) * 1000);
    const isInside = distanceM <= profile.geofenceRadiusM;

    const message = isInside
      ? 'Você está no local. Pode resgatar!'
      : `Você está a ${distanceM} m do evento. Aproxime-se até ${profile.geofenceRadiusM} m para resgatar.`;

    return { isInside, distanceM, requiredM: profile.geofenceRadiusM, message };
  }

  // ── Geocodificação ────────────────────────────────────────────────────

  geocodeAddress(address) {
    return this._provider.geocode(address);
  }

  reverseGeocodeCoords(coords) {
    return this._provider.reverseGeocode(coords);
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────
export const geoService = new GeoService(new ExpoLocationProvider());
