import { INotificationStrategy } from '../INotificationStrategy';
import { makeNotif, dayBucket } from '../notifUtils';
import { COLORS } from '../../../utils/theme';

const LOW_STOCK_RATIO = 0.10; // fire when remaining ≤ 10% of total

/**
 * Fires when a coupon belonging to the owner's event falls below 10% stock.
 * Role: business only.
 * Dedupe: once per coupon per calendar day.
 */
export class CouponStockStrategy extends INotificationStrategy {
  evaluate(ctx, fired) {
    if (ctx.currentUser?.role !== 'business') return [];

    const ownerId = ctx.currentUser.id;
    const myEventIds = new Set(
      ctx.events.filter(e => e.ownerId === ownerId).map(e => e.id),
    );

    const notifications = [];

    for (const coupon of ctx.coupons) {
      if (!myEventIds.has(coupon.eventId)) continue;
      if (!coupon.totalQty || coupon.totalQty <= 0) continue;

      const ratio = coupon.remainingQty / coupon.totalQty;
      if (ratio > LOW_STOCK_RATIO) continue;

      const dedupeKey = `stock:${coupon.id}:${dayBucket(ctx.now)}`;
      if (fired.has(dedupeKey)) continue;

      notifications.push(makeNotif({
        dedupeKey,
        type: 'stock',
        title: 'Estoque de Cupons Baixo',
        body: `"${coupon.title}" tem apenas ${coupon.remainingQty} de ${coupon.totalQty} cupons restantes (${Math.round(ratio * 100)}%).`,
        icon: 'warning',
        color: COLORS.warning,
        priority: 'high',
        payload: { couponId: coupon.id, eventId: coupon.eventId },
        now: ctx.now,
      }));
    }

    return notifications;
  }
}
