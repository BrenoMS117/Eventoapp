import { INotificationStrategy } from '../INotificationStrategy';
import { makeNotif, minuteBucket } from '../notifUtils';
import { COLORS } from '../../../utils/theme';

/**
 * Fires when GPS coordinates could not be obtained.
 * Requires AppContext to expose `geoError: boolean`.
 * Role: user only (owners are less dependent on location for core features).
 * Dedupe: at most once per 5-minute window to avoid repeated nagging.
 */
export class GpsFailureStrategy extends INotificationStrategy {
  evaluate(ctx, fired) {
    if (ctx.currentUser?.role !== 'user') return [];
    if (!ctx.geoError) return [];

    const dedupeKey = `gps:failure:${minuteBucket(ctx.now, 5)}`;
    if (fired.has(dedupeKey)) return [];

    return [makeNotif({
      dedupeKey,
      type: 'gps',
      title: 'Localização Indisponível',
      body: 'Não foi possível obter sua localização. Verifique as permissões do GPS nas configurações.',
      icon: 'location',
      color: COLORS.danger,
      priority: 'high',
      payload: {},
      now: ctx.now,
    })];
  }
}
