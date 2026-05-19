import { INotificationStrategy } from '../INotificationStrategy';
import { makeNotif, hourBucket } from '../notifUtils';
import { COLORS } from '../../../utils/theme';

const CROWD_THRESHOLD = 90; // percent

/**
 * Fires when a live owned event reaches ≥90% crowd capacity.
 * Role: business only.
 * Dedupe: once per event per clock-hour (re-fires each hour the event stays packed).
 */
export class CrowdLevelStrategy extends INotificationStrategy {
  evaluate(ctx, fired) {
    if (ctx.currentUser?.role !== 'business') return [];

    const ownerId = ctx.currentUser.id;
    const liveOwnedEvents = ctx.events.filter(
      e => e.ownerId === ownerId && e.isLive && e.crowdLevel != null,
    );

    const notifications = [];

    for (const event of liveOwnedEvents) {
      if (event.crowdLevel < CROWD_THRESHOLD) continue;

      const dedupeKey = `crowd:${event.id}:${hourBucket(ctx.now)}`;
      if (fired.has(dedupeKey)) continue;

      notifications.push(makeNotif({
        dedupeKey,
        type: 'crowd',
        title: 'Lotação Alta!',
        body: `${event.name} atingiu ${event.crowdLevel}% da capacidade. Verifique o controle de acesso.`,
        icon: 'people',
        color: COLORS.danger,
        priority: 'high',
        payload: { eventId: event.id },
        now: ctx.now,
      }));
    }

    return notifications;
  }
}
