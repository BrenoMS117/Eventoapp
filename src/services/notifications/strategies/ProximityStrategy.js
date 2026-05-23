import { INotificationStrategy } from '../INotificationStrategy';
import { makeNotif } from '../notifUtils';
import { COLORS } from '../../../utils/theme';

export class ProximityStrategy extends INotificationStrategy {
  _prevNearbyIds = new Set();

  evaluate(ctx, fired) {
    if (ctx.currentUser?.role !== 'user') return [];

    const current = new Set(ctx.nearbyEventIds);
    const newEntries = ctx.nearbyEventIds.filter(id => !this._prevNearbyIds.has(id));
    this._prevNearbyIds = current;

    const notifications = [];

    for (const eventId of newEntries) {
      const dedupeKey = `proximity:${eventId}`;
      if (fired.has(dedupeKey)) continue;

      const event = ctx.events.find(e => e.id === eventId);
      if (!event) continue;

      notifications.push(makeNotif({
        dedupeKey,
        type: 'proximity',
        title: 'Evento Próximo',
        body: `${event.name} está acontecendo perto de você agora!`,
        icon: 'location',
        color: COLORS.primary,
        priority: 'normal',
        payload: { eventId },
        now: ctx.now,
      }));
    }

    return notifications;
  }
}
