import * as ExpoLocation from 'expo-location';
import { ILocationProvider } from '../ILocationProvider';

export class ExpoLocationProvider extends ILocationProvider {
  constructor() {
    super();
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
    const subPromise = ExpoLocation.watchPositionAsync(
      {
        accuracy: ExpoLocation.Accuracy.Balanced,
        distanceInterval: 30,
        timeInterval: 15000,
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
