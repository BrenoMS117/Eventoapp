import { useState, useEffect, useRef, useCallback } from 'react';
import { geoService } from '../services/geo/GeoService';

/**
 * useGeolocation — React hook that exposes the device's current position
 * and keeps it updated in the background via a position watcher.
 *
 * Usage:
 *   const { coords, error, loading, refresh } = useGeolocation();
 *
 * The hook requests permission on mount. If denied, `error` is set and
 * `coords` stays null — callers should degrade gracefully (hide the
 * distance label, skip the geofence check, etc.).
 */
export function useGeolocation() {
  const [coords, setCoords] = useState(null);
  const [error, setError]   = useState(null);
  const [loading, setLoading] = useState(true);
  const watchHandleRef = useRef(null);

  const startWatcher = useCallback(() => {
    watchHandleRef.current = geoService.watchPosition((result) => {
      if (result.coords) {
        setCoords(result.coords);
        setError(null);
      } else {
        setError(result.error);
      }
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      const result = await geoService.getPosition();
      if (cancelled) return;

      if (result.coords) {
        setCoords(result.coords);
        startWatcher();
      } else {
        setError(result.error);
      }
      setLoading(false);
    }

    init();

    return () => {
      cancelled = true;
      geoService.clearWatch(watchHandleRef.current);
    };
  }, [startWatcher]);

  /** Force a one-shot refresh (e.g. after user grants permission manually). */
  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await geoService.getPosition();
    if (result.coords) setCoords(result.coords);
    else setError(result.error);
    setLoading(false);
  }, []);

  return { coords, error, loading, refresh };
}
