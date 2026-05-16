/**
 * GeoProfiles — single source of truth for distance limits per role.
 *
 * To add a new role (e.g. 'admin', 'vip') just add a key here.
 * GeoService reads this map, so no other file needs to change.
 *
 * discoveryRadiusKm : max distance to show an event in the Explore feed.
 * geofenceRadiusM   : max distance allowed to redeem a coupon (must be AT the venue).
 */
export const GEO_PROFILES = {
  user: {
    role: 'user',
    discoveryRadiusKm: 5,
    geofenceRadiusM: 150,
  },
  business: {
    role: 'business',
    discoveryRadiusKm: 2,    // visibilidade restrita ao raio do estabelecimento
    geofenceRadiusM: 500,    // cerca mais larga — dono pode estar em qualquer ponto do venue
  },
};

/** Fallback when role is unknown. */
export const DEFAULT_PROFILE = GEO_PROFILES.user;
