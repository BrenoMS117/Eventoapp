import { INotificationStrategy } from '../INotificationStrategy';
import { makeNotif, hourBucket } from '../notifUtils';
import { COLORS } from '../../../utils/theme';

const CROWD_THRESHOLD = 90;

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
        color: COLORS.primary,
        priority: 'high',
        payload: { eventId: event.id },
        now: ctx.now,
      }));
    }

    return notifications;
  }
}
