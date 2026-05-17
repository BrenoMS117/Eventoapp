import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { geoService } from '../services/geo/GeoService';

// ─────────────────────────────────────────────────────────────────────────────
// rankEvents — pure sorting function, separated from any React rendering.
//
// Composite score (lower = higher in list):
//   distanceKm  — primary driver; nearest first
//   liveBump    — live events float up by 2 km equivalent
//   premiumBump — reserved slot: when event.premiumRank > 0 it subtracts from
//                 the score, surfacing paid partners. Set from the back-end.
//
// To enable premium ranking in a future sprint:
//   1. Add a `premium_rank` column (integer, default 0) to the events table.
//   2. Map it in eventsService._mapEvent as `premiumRank: d.premium_rank ?? 0`.
//   3. No code change needed here — the formula already consumes it.
// ─────────────────────────────────────────────────────────────────────────────
function _score(event, distances) {
  const distKm    = distances.get(event.id) ?? 999;
  const liveBump  = event.isLive ? -2 : 0;
  const premiumBump = (event.premiumRank ?? 0) * -0.5;
  return distKm + liveBump + premiumBump;
}

function rankEvents(events, distances) {
  return [...events].sort((a, b) => _score(a, distances) - _score(b, distances));
}

// ─────────────────────────────────────────────────────────────────────────────
// useNearbyEvents
//
// Returns a stable, memoized snapshot that re-computes every time the GPS
// position changes (userCoords from AppContext) or the events list updates.
// Both inputs are managed by AppContext's GPS watcher, so real-time updates
// arrive automatically — this hook has zero polling of its own.
// ─────────────────────────────────────────────────────────────────────────────
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

    // Hero: prefer live + nearest; fall back to nearest; then any live event
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
