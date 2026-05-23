import { INotificationStrategy } from '../INotificationStrategy';
import { makeNotif, dayBucket } from '../notifUtils';
import { COLORS } from '../../../utils/theme';

export class PremiumConversionStrategy extends INotificationStrategy {
  evaluate(ctx, fired) {
    if (ctx.currentUser?.role !== 'business') return [];
    if (ctx.currentUser?.planType) return [];

    const ownerId = ctx.currentUser.id;
    const hasEvents = ctx.events.some(e => e.ownerId === ownerId);
    if (!hasEvents) return [];

    const dedupeKey = `premium:${ownerId}:${dayBucket(ctx.now)}`;
    if (fired.has(dedupeKey)) return [];

    return [makeNotif({
      dedupeKey,
      type: 'premium',
      title: 'Aumente Sua Visibilidade',
      body: 'Eventos Premium aparecem em destaque para usuários próximos. Conheça nossos planos!',
      icon: 'star',
      color: COLORS.primary,
      priority: 'low',
      payload: {},
      now: ctx.now,
    })];
  }
}
