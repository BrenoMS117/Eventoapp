import { haversineKm, isWithinRadius } from './GeoCalculator';
import { GEO_PROFILES, DEFAULT_PROFILE } from './GeoProfiles';
import { ExpoLocationProvider } from './providers/ExpoLocationProvider';

/**
 * GeoService — orchestrates all geolocation use cases.
 *
 * Depends only on ILocationProvider (injected) and pure GeoCalculator math.
 * Framework-specific code lives exclusively in the /providers/ layer.
 *
 * ─── Use Cases ────────────────────────────────────────────────────────────
 *  • getPosition()                        → one-shot current coordinates
 *  • watchPosition(cb)                    → continuous updates
 *  • clearWatch(handle)                   → stop watching
 *  • filterNearbyEvents(coords, events, role) → event discovery
 *  • checkGeofence(userCoords, eventCoords, role) → coupon gate
 *  • geocodeAddress(address)              → text → coordinates
 * ─────────────────────────────────────────────────────────────────────────
 */
class GeoService {
  /** @param {import('./ILocationProvider').ILocationProvider} provider */
  constructor(provider) {
    this._provider = provider;
  }

  // ── Permission ────────────────────────────────────────────────────────

  requestPermission() {
    return this._provider.requestPermission();
  }

  // ── Position ──────────────────────────────────────────────────────────

  /** @returns {Promise<import('./ILocationProvider').LocationResult>} */
  getPosition() {
    return this._provider.getCurrentPosition();
  }

  /**
   * @param {(result: import('./ILocationProvider').LocationResult) => void} callback
   * @returns {import('./ILocationProvider').WatchHandle}
   */
  watchPosition(callback) {
    return this._provider.watchPosition(callback);
  }

  /** @param {import('./ILocationProvider').WatchHandle} handle */
  clearWatch(handle) {
    this._provider.clearWatch(handle);
  }

  // ── Event Discovery ───────────────────────────────────────────────────

  /**
   * Filters events that fall within the discovery radius for the given role.
   * Events without coordinates are silently excluded (graceful degradation).
   *
   * @param {import('./ILocationProvider').Coordinates} userCoords
   * @param {Array<{ id: string, lat: number|null, lng: number|null }>} events
   * @param {'user'|'business'} role
   * @returns {{
   *   nearbyIds: string[],
   *   distances: Map<string, number>,
   *   radiusKm: number
   * }}
   */
  filterNearbyEvents(userCoords, events, role = 'user') {
    const profile = GEO_PROFILES[role] ?? DEFAULT_PROFILE;
    const distances = new Map();
    const nearbyIds = [];

    for (const event of events) {
      if (event.lat == null || event.lng == null) continue;
      const km = haversineKm(userCoords, { lat: event.lat, lng: event.lng });
      distances.set(event.id, Math.round(km * 10) / 10); // 1 decimal place
      if (km <= profile.discoveryRadiusKm) nearbyIds.push(event.id);
    }

    return { nearbyIds, distances, radiusKm: profile.discoveryRadiusKm };
  }

  // ── Geofence (Coupon Gate) ────────────────────────────────────────────

  /**
   * Checks whether the user is physically inside the event's geofence.
   * Used to block coupon redemption from a distance.
   *
   * @param {import('./ILocationProvider').Coordinates} userCoords
   * @param {import('./ILocationProvider').Coordinates} eventCoords
   * @param {'user'|'business'} role
   * @returns {{
   *   isInside: boolean,
   *   distanceM: number,
   *   requiredM: number,
   *   message: string
   * }}
   */
  checkGeofence(userCoords, eventCoords, role = 'user') {
    const profile = GEO_PROFILES[role] ?? DEFAULT_PROFILE;
    const distanceM = Math.round(haversineKm(userCoords, eventCoords) * 1000);
    const isInside = distanceM <= profile.geofenceRadiusM;

    const message = isInside
      ? 'Você está no local. Pode resgatar!'
      : `Você está a ${distanceM} m do evento. Aproxime-se até ${profile.geofenceRadiusM} m para resgatar.`;

    return { isInside, distanceM, requiredM: profile.geofenceRadiusM, message };
  }

  // ── Geocoding ─────────────────────────────────────────────────────────

  /**
   * Converts a free-text address into coordinates.
   * Returns null if the address cannot be resolved.
   * @param {string} address
   * @returns {Promise<import('./ILocationProvider').Coordinates|null>}
   */
  geocodeAddress(address) {
    return this._provider.geocode(address);
  }

  /**
   * Converts coordinates into a structured address.
   * Returns null if resolution fails.
   * @param {import('./ILocationProvider').Coordinates} coords
   * @returns {Promise<{ street: string, district: string, city: string }|null>}
   */
  reverseGeocodeCoords(coords) {
    return this._provider.reverseGeocode(coords);
  }
}

// ── Singleton wiring point ────────────────────────────────────────────────
// To swap the provider (Google Maps, Mapbox, custom GPS):
//   replace `new ExpoLocationProvider()` with the new concrete class.
//   Nothing else changes.
export const geoService = new GeoService(new ExpoLocationProvider());
