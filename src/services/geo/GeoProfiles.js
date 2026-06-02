export const GEO_PROFILES = {
  user: {
    role: 'user',
    discoveryRadiusKm: 5,
    geofenceRadiusM: 500,
  },
  business: {
    role: 'business',
    discoveryRadiusKm: 2,
    geofenceRadiusM: 500,
  },
};

export const DEFAULT_PROFILE = GEO_PROFILES.user;
