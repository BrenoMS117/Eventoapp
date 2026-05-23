import { ProximityStrategy }         from './strategies/ProximityStrategy';
import { EventEndingStrategy }        from './strategies/EventEndingStrategy';
import { SocialEngagementStrategy }   from './strategies/SocialEngagementStrategy';
import { LocalCouponsStrategy }       from './strategies/LocalCouponsStrategy';
import { GpsFailureStrategy }         from './strategies/GpsFailureStrategy';
import { CouponStockStrategy }        from './strategies/CouponStockStrategy';
import { CrowdLevelStrategy }         from './strategies/CrowdLevelStrategy';
import { CrowdSurgeStrategy }         from './strategies/CrowdSurgeStrategy';
import { PremiumConversionStrategy }  from './strategies/PremiumConversionStrategy';
import { PostEventRatingStrategy }    from './strategies/PostEventRatingStrategy';

const QUEUE_CAP = 50;

class NotificationService {
  constructor() {
    this._strategies = [];
    this._fired = new Map();
    this._queue = [];
    this._listeners = new Set();
  }

  register(strategy) {
    this._strategies.push(strategy);
    return this;
  }

  evaluate(ctx) {
    for (const strategy of this._strategies) {
      try {
        const results = strategy.evaluate(ctx, this._fired);
        for (const notification of results) {
          this._enqueue(notification);
          this._fired.set(notification.dedupeKey, ctx.now);
        }
      } catch (err) {
        console.warn(`[NotificationService] ${strategy.constructor.name} threw:`, err.message);
      }
    }
  }

  push(notification) {
    this._enqueue(notification);
  }

  // ── Gerenciamento de fila ─────────────────────────────────────────────────

  _enqueue(notification) {
    this._queue.unshift(notification);
    if (this._queue.length > QUEUE_CAP) this._queue.pop();
    this._emit();
  }

  _emit() {
    this._listeners.forEach(fn => fn([...this._queue]));
  }

  subscribe(fn) {
    this._listeners.add(fn);
    fn([...this._queue]);
    return () => this._listeners.delete(fn);
  }

  markRead(id) {
    this._queue = this._queue.map(n => n.id === id ? { ...n, read: true } : n);
    this._emit();
  }

  markAllRead() {
    this._queue = this._queue.map(n => ({ ...n, read: true }));
    this._emit();
  }

  clearAll() {
    this._queue = [];
    this._emit();
  }

  reset() {
    this._queue = [];
    this._fired.clear();
    this._emit();
  }

  get unreadCount() {
    return this._queue.filter(n => !n.read).length;
  }
}

// ── Singleton — registrar todas as estratégias aqui ───────────────────────────
export const notificationService = new NotificationService()
  // ── Estratégias de usuário ────────────────────────────────────────────
  .register(new ProximityStrategy())
  .register(new EventEndingStrategy())
  .register(new SocialEngagementStrategy())
  .register(new LocalCouponsStrategy())
  .register(new GpsFailureStrategy())
  // ── Estratégias de proprietário ───────────────────────────────────────
  .register(new CouponStockStrategy())
  .register(new CrowdLevelStrategy())
  .register(new CrowdSurgeStrategy())
  .register(new PremiumConversionStrategy())
  // ── Compartilhadas ────────────────────────────────────────────────────
  .register(new PostEventRatingStrategy());
