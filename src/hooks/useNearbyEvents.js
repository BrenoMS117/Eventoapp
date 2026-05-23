import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { geoService } from '../services/geo/GeoService';

function _score(event, distances) {
  const distKm      = distances.get(event.id) ?? 999;
  const liveBump    = event.isLive ? -2 : 0;
  const premiumBump = (event.premiumRank ?? 0) * -0.5;
  return distKm + liveBump + premiumBump;
}

function rankEvents(events, distances) {
  return [...events].sort((a, b) => _score(a, distances) - _score(b, distances));
}

export function useNearbyEvents() {
  const { events, userCoords, currentUser } = useApp();

  return useMemo(() => {
    const liveEvents = events.filter((e) => e.isLive);

    if (!userCoords) {
      return {
        heroEvent: liveEvents[0] ?? events[0] ?? null,
        nearbyEvents: [],
        liveEvents,
        distances: new Map(),
        geoLabel: 'Ativando localização…',
        hasCoords: false,
      };
    }

    const { nearbyIds, distances, radiusKm } = geoService.filterNearbyEvents(
      userCoords,
      events,
      currentUser?.role ?? 'user',
    );

    const nearbyEvents = rankEvents(
      events.filter((e) => nearbyIds.includes(e.id)),
      distances,
    );

    const hero = nearbyEvents.find((e) => e.isLive) ?? nearbyEvents[0] ?? liveEvents[0] ?? null;

    const count = nearbyIds.length;
    const geoLabel = count > 0
      ? `${count} evento${count !== 1 ? 's' : ''} em até ${radiusKm} km`
      : 'Nenhum evento próximo agora';

    return {
      heroEvent: hero,
      nearbyEvents,
      liveEvents,
      distances,
      geoLabel,
      hasCoords: true,
    };
  }, [events, userCoords, currentUser?.role]);
}
