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

/**
 * NotificationService — central orchestrator (Singleton).
 *
 * Responsibilities:
 *   1. Maintain a registry of INotificationStrategy instances.
 *   2. Run all strategies on each `evaluate(ctx)` call.
 *   3. Deduplicate via a shared `_fired` Map<dedupeKey, Date>.
 *   4. Maintain a capped notification queue (newest first).
 *   5. Broadcast queue updates to all UI subscribers.
 *
 * Adding a new notification type requires only:
 *   a) Create a class extending INotificationStrategy.
 *   b) `.register(new YourStrategy())` below — nothing else changes.
 */
class NotificationService {
  constructor() {
    /** @type {import('./INotificationStrategy').INotificationStrategy[]} */
    this._strategies = [];
    /** @type {Map<string, Date>} dedupeKey → last fired time */
    this._fired = new Map();
    /** @type {import('./INotificationStrategy').NotificationPayload[]} newest first */
    this._queue = [];
    /** @type {Set<Function>} UI subscribers */
    this._listeners = new Set();
  }

  /**
   * Registers a strategy. Chainable.
   * @param {import('./INotificationStrategy').INotificationStrategy} strategy
   */
  register(strategy) {
    this._strategies.push(strategy);
    return this;
  }

  /**
   * Runs all strategies against the given context snapshot.
   * Safe to call on every React render cycle — strategies self-debounce via dedupeKeys.
   * @param {import('./INotificationStrategy').NotificationContext} ctx
   */
  evaluate(ctx) {
    for (const strategy of this._strategies) {
      try {
        const results = strategy.evaluate(ctx, this._fired);
        for (const notification of results) {
          this._enqueue(notification);
          this._fired.set(notification.dedupeKey, ctx.now);
        }
      } catch (err) {
        // Isolate a faulty strategy — never crash the whole pipeline.
        console.warn(`[NotificationService] ${strategy.constructor.name} threw:`, err.message);
      }
    }
  }

  /**
   * Injeta uma notificação diretamente na fila, sem passar pelas estratégias.
   * Usado por eventos Realtime (ex: anúncios de donos de evento) que chegam
   * por fora do ciclo evaluate() e precisam ser exibidos imediatamente.
   * @param {import('./INotificationStrategy').NotificationPayload} notification
   */
  push(notification) {
    this._enqueue(notification);
  }

  // ── Queue management ──────────────────────────────────────────────────

  _enqueue(notification) {
    this._queue.unshift(notification); // newest first
    if (this._queue.length > QUEUE_CAP) this._queue.pop();
    this._emit();
  }

  _emit() {
    this._listeners.forEach(fn => fn([...this._queue]));
  }

  /**
   * Subscribe to queue updates. Returns an unsubscribe function.
   * The subscriber is called immediately with the current queue snapshot.
   * @param {(notifications: import('./INotificationStrategy').NotificationPayload[]) => void} fn
   * @returns {() => void}
   */
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

  /**
   * Full reset — call on logout.
   * Clears queue, deduplication map, and emits to subscribers.
   * Listeners are preserved so UI components can react to the empty state.
   */
  reset() {
    this._queue = [];
    this._fired.clear();
    this._emit();
  }

  get unreadCount() {
    return this._queue.filter(n => !n.read).length;
  }
}

// ── Singleton — register all strategies here ─────────────────────────────────
export const notificationService = new NotificationService()
  // ── User strategies ──────────────────────────────────────────────────
  .register(new ProximityStrategy())
  .register(new EventEndingStrategy())
  .register(new SocialEngagementStrategy())
  .register(new LocalCouponsStrategy())
  .register(new GpsFailureStrategy())
  // ── Owner strategies ─────────────────────────────────────────────────
  .register(new CouponStockStrategy())
  .register(new CrowdLevelStrategy())
  .register(new CrowdSurgeStrategy())
  .register(new PremiumConversionStrategy())
  // ── Shared ───────────────────────────────────────────────────────────
  .register(new PostEventRatingStrategy());
