import { INotificationStrategy } from '../INotificationStrategy';
import { makeNotif, dayBucket } from '../notifUtils';
import { COLORS } from '../../../utils/theme';

/**
 * Sends a daily marketing nudge to owners who have not yet subscribed to a
 * visibility plan.
 *
 * DB prerequisite: add `plan_type VARCHAR DEFAULT NULL` to the `profiles` table
 * and expose it via authService._mapUser as `planType: d.plan_type ?? null`.
 * Until that column exists, `currentUser.planType` will always be undefined,
 * which this strategy treats as "no plan" — so it fires safely from day one.
 *
 * Role: business only.
 * Dedupe: once per owner per calendar day.
 */
export class PremiumConversionStrategy extends INotificationStrategy {
  evaluate(ctx, fired) {
    if (ctx.currentUser?.role !== 'business') return [];
    if (ctx.currentUser?.planType) return []; // already on a plan

    const ownerId = ctx.currentUser.id;
    const hasEvents = ctx.events.some(e => e.ownerId === ownerId);
    if (!hasEvents) return []; // nudge only owners with at least one event

    const dedupeKey = `premium:${ownerId}:${dayBucket(ctx.now)}`;
    if (fired.has(dedupeKey)) return [];

    return [makeNotif({
      dedupeKey,
      type: 'premium',
      title: 'Aumente Sua Visibilidade',
      body: 'Eventos Premium aparecem em destaque para usuários próximos. Conheça nossos planos!',
      icon: 'star',
      color: COLORS.purple,
      priority: 'low',
      payload: {},
      now: ctx.now,
    })];
  }
}
