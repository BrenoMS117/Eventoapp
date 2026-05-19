import { INotificationStrategy } from '../INotificationStrategy';
import { makeNotif, minuteBucket } from '../notifUtils';
import { COLORS } from '../../../utils/theme';

const HISTORY_WINDOW_MS = 5 * 60 * 1000; // 5-minute rolling window
const SURGE_DELTA = 20;                   // crowd-level points to trigger

/**
 * Fires when crowd level rises ≥20 points within a 5-minute window.
 * Intended as an immediate security/capacity alert for owners.
 * Role: business only.
 * Dedupe: once per event per 5-minute bucket.
 */
export class CrowdSurgeStrategy extends INotificationStrategy {
  // eventId → Array<{ level: number, ts: Date }>
  _history = new Map();

  evaluate(ctx, fired) {
    if (ctx.currentUser?.role !== 'business') return [];

    const ownerId = ctx.currentUser.id;
    const liveOwnedEvents = ctx.events.filter(
      e => e.ownerId === ownerId && e.isLive && e.crowdLevel != null,
    );

    const notifications = [];

    for (const event of liveOwnedEvents) {
      const history = this._history.get(event.id) ?? [];
      history.push({ level: event.crowdLevel, ts: ctx.now });

      const cutoff = ctx.now.getTime() - HISTORY_WINDOW_MS;
      const recent = history.filter(h => h.ts.getTime() >= cutoff);
      this._history.set(event.id, recent);

      if (recent.length < 2) continue;

      const delta = event.crowdLevel - recent[0].level;
      if (delta < SURGE_DELTA) continue;

      const dedupeKey = `surge:${event.id}:${minuteBucket(ctx.now, 5)}`;
      if (fired.has(dedupeKey)) continue;

      notifications.push(makeNotif({
        dedupeKey,
        type: 'surge',
        title: 'Lotação Subindo Rápido!',
        body: `${event.name} subiu +${delta}% em 5 minutos. Verifique a segurança imediatamente.`,
        icon: 'trending-up',
        color: COLORS.danger,
        priority: 'high',
        payload: { eventId: event.id },
        now: ctx.now,
      }));
    }

    return notifications;
  }
}
