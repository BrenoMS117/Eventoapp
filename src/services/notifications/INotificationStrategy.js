/**
 * Base class for all notification strategies (Strategy Pattern).
 *
 * Each concrete strategy:
 *   - Holds its own mutable inter-evaluation state (prev snapshots, history, etc.)
 *   - Receives the shared `fired` Map<dedupeKey, Date> for deduplication
 *   - Returns an array of NotificationPayload objects (empty array = nothing to fire)
 *
 * @typedef {{
 *   currentUser: { id: string, role: 'user'|'business', planType?: string|null } | null,
 *   events:        Array<object>,
 *   coupons:       Array<object>,
 *   feedPosts:     Array<object>,
 *   userCoords:    { latitude: number, longitude: number } | null,
 *   nearbyEventIds: string[],
 *   redeemedCoupons: string[],
 *   geoError:      boolean,
 *   now:           Date,
 * }} NotificationContext
 *
 * @typedef {{
 *   id:          string,
 *   dedupeKey:   string,
 *   type:        string,
 *   title:       string,
 *   body:        string,
 *   icon:        string,
 *   color:       string,
 *   priority:    'high'|'normal'|'low',
 *   payload:     object,
 *   createdAt:   Date,
 *   read:        boolean,
 * }} NotificationPayload
 */
export class INotificationStrategy {
  /**
   * Evaluate current context and return any notifications to enqueue.
   * @param {NotificationContext} ctx
   * @param {Map<string, Date>} fired  dedupeKey → last fired timestamp
   * @returns {NotificationPayload[]}
   */
  // eslint-disable-next-line no-unused-vars
  evaluate(ctx, fired) {
    return [];
  }
}
