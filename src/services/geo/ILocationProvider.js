export class ILocationProvider {
  async requestPermission() {
    throw new Error('ILocationProvider.requestPermission() not implementado');
  }

  async getCurrentPosition() {
    throw new Error('ILocationProvider.getCurrentPosition() não implementado');
  }

  watchPosition(callback) {
    throw new Error('ILocationProvider.watchPosition() não implementado');
  }

  clearWatch(handle) {
    throw new Error('ILocationProvider.clearWatch() não implementado');
  }

  async geocode(address) {
    throw new Error('ILocationProvider.geocode() não implementado');
  }

  async reverseGeocode(coords) {
    throw new Error('ILocationProvider.reverseGeocode() não implementado');
  }
}
