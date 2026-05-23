import { INotificationStrategy } from '../INotificationStrategy';
import { makeNotif } from '../notifUtils';
import { COLORS } from '../../../utils/theme';

const WARN_BEFORE_MS = 10 * 60 * 1000;

export class EventEndingStrategy extends INotificationStrategy {
  evaluate(ctx, fired) {
    if (ctx.currentUser?.role !== 'user') return [];

    const notifications = [];
    const nowMs = ctx.now.getTime();

    for (const eventId of ctx.nearbyEventIds) {
      const event = ctx.events.find(e => e.id === eventId);
      if (!event?.isLive || !event.endsAt) continue;

      const endsAt = new Date(event.endsAt);
      if (isNaN(endsAt.getTime())) continue;

      const msUntilEnd = endsAt.getTime() - nowMs;
      if (msUntilEnd <= 0 || msUntilEnd > WARN_BEFORE_MS) continue;

      const dedupeKey = `ending:${event.id}:${endsAt.getTime()}`;
      if (fired.has(dedupeKey)) continue;

      const minsLeft = Math.ceil(msUntilEnd / 60000);
      notifications.push(makeNotif({
        dedupeKey,
        type: 'ending',
        title: 'Evento Encerrando em Breve',
        body: `${event.name} encerra em ${minsLeft} minuto${minsLeft !== 1 ? 's' : ''}. Aproveite!`,
        icon: 'time',
        color: COLORS.primary,
        priority: 'high',
        payload: { eventId: event.id },
        now: ctx.now,
      }));
    }

    return notifications;
  }
}
