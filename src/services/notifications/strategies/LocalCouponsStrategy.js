import { INotificationStrategy } from '../INotificationStrategy';
import { makeNotif } from '../notifUtils';
import { COLORS } from '../../../utils/theme';

/**
 * Fires when a new coupon becomes available for a nearby event.
 * Role: user only.
 * Dedupe: once per coupon ID (never repeats the same coupon).
 */
export class LocalCouponsStrategy extends INotificationStrategy {
  _seenCouponIds = new Set();

  evaluate(ctx, fired) {
    if (ctx.currentUser?.role !== 'user') return [];

    const notifications = [];
    const nearbySet = new Set(ctx.nearbyEventIds);

    for (const coupon of ctx.coupons) {
      if (!nearbySet.has(coupon.eventId)) continue;
      if (coupon.remainingQty <= 0) continue;
      if (ctx.redeemedCoupons.includes(coupon.id)) continue;

      const dedupeKey = `local-coupon:${coupon.id}`;

      // Track seen IDs in memory (survives across evaluations, resets on restart)
      if (this._seenCouponIds.has(coupon.id)) continue;
      this._seenCouponIds.add(coupon.id);

      // Also skip if we already fired for this coupon in a previous app session.
      if (fired.has(dedupeKey)) continue;

      const event = ctx.events.find(e => e.id === coupon.eventId);
      const venueName = event?.name ?? coupon.venue ?? 'evento próximo';

      notifications.push(makeNotif({
        dedupeKey,
        type: 'coupon',
        title: 'Novo Cupom Disponível',
        body: `"${coupon.title}" disponível em ${venueName}. Resgate agora!`,
        icon: 'pricetag',
        color: COLORS.success,
        priority: 'normal',
        payload: { couponId: coupon.id, eventId: coupon.eventId },
        now: ctx.now,
      }));
    }

    return notifications;
  }
}
