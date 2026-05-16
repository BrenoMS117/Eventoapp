/**
 * Pure haversine math — no framework dependencies.
 * All functions are stateless and side-effect-free so they can be
 * unit-tested without any native modules loaded.
 *
 * Coordinate convention throughout the geo module:
 *   { lat: number, lng: number }  (decimal degrees, WGS-84)
 */

const EARTH_RADIUS_KM = 6371;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Great-circle distance between two points (Haversine formula).
 * @param {{ lat: number, lng: number }} a
 * @param {{ lat: number, lng: number }} b
 * @returns {number} Distance in kilometres.
 */
export function haversineKm(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Returns true when point b is within radiusM metres of point a.
 * @param {{ lat: number, lng: number }} a  Reference point.
 * @param {{ lat: number, lng: number }} b  Point to test.
 * @param {number} radiusM  Threshold in metres.
 */
export function isWithinRadius(a, b, radiusM) {
  return haversineKm(a, b) * 1000 <= radiusM;
}
