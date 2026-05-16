/**
 * ILocationProvider — abstract interface for all location back-ends.
 *
 * Swap the provider in GeoService.js (the single wiring point) to change
 * from Expo Location to Google Maps SDK, Mapbox, or any other engine
 * without touching any business logic.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Type definitions (JSDoc — no TypeScript required)
 * ─────────────────────────────────────────────────────────────────────────
 *
 * @typedef {{ lat: number, lng: number }} Coordinates
 *
 * @typedef {{ granted: boolean, error: string|null }} PermissionResult
 *
 * @typedef {{ coords: Coordinates|null, error: string|null }} LocationResult
 *
 * @typedef {{ remove: () => void }} WatchHandle
 *   Returned by watchPosition so callers can stop the watcher without
 *   knowing the underlying subscription format.
 */

export class ILocationProvider {
  /**
   * Ask the OS for foreground location permission.
   * Must be called before any position read.
   * @returns {Promise<PermissionResult>}
   */
  async requestPermission() {
    throw new Error('ILocationProvider.requestPermission() not implemented');
  }

  /**
   * One-shot current position.
   * Internally calls requestPermission if needed.
   * @returns {Promise<LocationResult>}
   */
  async getCurrentPosition() {
    throw new Error('ILocationProvider.getCurrentPosition() not implemented');
  }

  /**
   * Subscribe to continuous position updates.
   * The provider fires callback whenever the device moves more than
   * distanceInterval metres (implementation-defined default: 30 m).
   *
   * @param {(result: LocationResult) => void} callback
   * @returns {WatchHandle}
   */
  watchPosition(callback) {
    throw new Error('ILocationProvider.watchPosition() not implemented');
  }

  /**
   * Stop a watch started by watchPosition.
   * @param {WatchHandle} handle
   */
  clearWatch(handle) {
    throw new Error('ILocationProvider.clearWatch() not implemented');
  }

  /**
   * Forward geocoding: address string → coordinates.
   * Returns null when the address cannot be resolved.
   * @param {string} address
   * @returns {Promise<Coordinates|null>}
   */
  async geocode(address) {
    throw new Error('ILocationProvider.geocode() not implemented');
  }

  /**
   * Reverse geocoding: coordinates → structured address.
   * Returns null when the coordinates cannot be resolved.
   * @param {Coordinates} coords
   * @returns {Promise<{ street: string, district: string, city: string }|null>}
   */
  async reverseGeocode(coords) {
    throw new Error('ILocationProvider.reverseGeocode() not implemented');
  }
}
