import { INotificationStrategy } from '../INotificationStrategy';
import { makeNotif } from '../notifUtils';
import { COLORS } from '../../../utils/theme';

const DELAY_MIN  = 30;  // start firing 30 min after event ends
const WINDOW_MIN = 90;  // stop firing 90 min after event ends

/**
 * Fires once per user per event when the event ended 30–90 minutes ago.
 *  • Owners   → metrics summary ("veja as métricas finais")
 *  • Users    → rating prompt ("avalie o evento")
 *
 * The user scope uses `nearbyEventIds`: if the user was near the event when it
 * ended, they're likely attendees. This is a best-effort heuristic since there
 * is no explicit check-in table yet.
 *
 * Role: both.
 * Dedupe: once per (eventId, userId) pair — never repeats.
 */
export class PostEventRatingStrategy extends INotificationStrategy {
  evaluate(ctx, fired) {
    if (!ctx.currentUser) return [];

    const userId  = ctx.currentUser.id;
    const isOwner = ctx.currentUser.role === 'business';
    const nowMs   = ctx.now.getTime();
    const notifications = [];

    for (const event of ctx.events) {
      if (event.isLive || !event.endsAt) continue;

      const endsAt = new Date(event.endsAt);
      if (isNaN(endsAt.getTime())) continue;

      const minsAfterEnd = (nowMs - endsAt.getTime()) / 60000;
      if (minsAfterEnd < DELAY_MIN || minsAfterEnd > WINDOW_MIN) continue;

      const meOwns   = event.ownerId === userId;
      const meNearby = ctx.nearbyEventIds.includes(event.id);

      if (!meOwns && !meNearby) continue;

      const dedupeKey = `rating:${event.id}:${userId}`;
      if (fired.has(dedupeKey)) continue;

      if (meOwns) {
        notifications.push(makeNotif({
          dedupeKey,
          type: 'rating',
          title: 'Evento Encerrado',
          body: `${event.name} terminou. Confira as métricas finais do seu evento!`,
          icon: 'bar-chart',
          color: COLORS.success,
          priority: 'normal',
          payload: { eventId: event.id },
          now: ctx.now,
        }));
      } else {
        notifications.push(makeNotif({
          dedupeKey,
          type: 'rating',
          title: 'Como foi o evento?',
          body: `Deixe sua avaliação para ${event.name} e ajude outros usuários.`,
          icon: 'star',
          color: COLORS.warning,
          priority: 'low',
          payload: { eventId: event.id },
          now: ctx.now,
        }));
      }
    }

    return notifications;
  }
}
