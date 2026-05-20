import * as ExpoLocation from 'expo-location';
import { ILocationProvider } from '../ILocationProvider';

/**
 * ExpoLocationProvider — concrete implementation backed by expo-location.
 *
 * To migrate to a different engine (Google Maps SDK, Mapbox, custom GPS):
 *   1. Create a new file in this /providers/ folder.
 *   2. Extend ILocationProvider and implement the same four methods.
 *   3. Change the single import line in GeoService.js.
 *   No other file in the project needs to change.
 */
export class ExpoLocationProvider extends ILocationProvider {
  constructor() {
    super();
    /** true once the user has granted foreground permission in this session */
    this._permissionGranted = false;
  }

  async requestPermission() {
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    const granted = status === ExpoLocation.PermissionStatus.GRANTED;
    this._permissionGranted = granted;
    return {
      granted,
      error: granted ? null : 'Permissão de localização negada pelo usuário.',
    };
  }

  async getCurrentPosition() {
    try {
      // Skip the permission round-trip when we already know it's granted.
      if (!this._permissionGranted) {
        const perm = await this.requestPermission();
        if (!perm.granted) return { coords: null, error: perm.error };
      }

      const loc = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });
      return {
        coords: { lat: loc.coords.latitude, lng: loc.coords.longitude },
        error: null,
      };
    } catch (e) {
      return { coords: null, error: e.message ?? 'Erro ao obter localização.' };
    }
  }

  watchPosition(callback) {
    // watchPositionAsync returns a Promise<LocationSubscription>.
    // We wrap it in a stable handle so callers never touch Expo internals.
    const subPromise = ExpoLocation.watchPositionAsync(
      {
        accuracy: ExpoLocation.Accuracy.Balanced,
        distanceInterval: 30, // fire only when device moves ≥ 30 m
        timeInterval: 15000,  // or every 15 s — whichever comes first
      },
      (loc) =>
        callback({
          coords: { lat: loc.coords.latitude, lng: loc.coords.longitude },
          error: null,
        }),
    );

    return {
      remove: async () => {
        const sub = await subPromise;
        sub.remove();
      },
    };
  }

  clearWatch(handle) {
    handle?.remove();
  }

  async geocode(address) {
    try {
      const results = await ExpoLocation.geocodeAsync(address);
      if (!results.length) return null;
      return { lat: results[0].latitude, lng: results[0].longitude };
    } catch {
      return null;
    }
  }

  async reverseGeocode(coords) {
    try {
      const results = await ExpoLocation.reverseGeocodeAsync({
        latitude: coords.lat,
        longitude: coords.lng,
      });
      if (!results.length) return null;
      const r = results[0];
      return {
        street: [r.street, r.streetNumber].filter(Boolean).join(', ') || r.name || '',
        district: r.district || r.subregion || '',
        city: r.city || r.region || '',
      };
    } catch {
      return null;
    }
  }
}
