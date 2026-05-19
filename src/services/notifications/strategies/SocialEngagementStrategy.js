import { INotificationStrategy } from '../INotificationStrategy';
import { makeNotif, hourBucket } from '../notifUtils';
import { COLORS } from '../../../utils/theme';

/**
 * Groups new likes on the current user's posts and fires once per hour.
 * Avoids spam by batching all like activity into a single hourly digest.
 * Role: user only.
 * Dedupe: once per user per clock-hour.
 *
 * Requires feedPost.authorId — see feedService._mapPost note.
 */
export class SocialEngagementStrategy extends INotificationStrategy {
  // Snapshot of like counts at last evaluation to compute deltas.
  _likeSnapshot = new Map(); // postId → likes

  evaluate(ctx, fired) {
    if (ctx.currentUser?.role !== 'user') return [];

    const userId = ctx.currentUser.id;
    const myPosts = ctx.feedPosts.filter(p => p.authorId === userId);

    let newLikes = 0;
    for (const post of myPosts) {
      const prev = this._likeSnapshot.has(post.id)
        ? this._likeSnapshot.get(post.id)
        : post.likes; // baseline on first sight — no spike on init
      const delta = post.likes - prev;
      if (delta > 0) newLikes += delta;
      this._likeSnapshot.set(post.id, post.likes);
    }

    if (newLikes <= 0) return [];

    const dedupeKey = `social:${userId}:${hourBucket(ctx.now)}`;
    if (fired.has(dedupeKey)) return [];

    return [makeNotif({
      dedupeKey,
      type: 'social',
      title: 'Suas publicações estão em alta!',
      body: newLikes === 1
        ? 'Seu post recebeu uma nova curtida.'
        : `Seus posts receberam ${newLikes} novas curtidas.`,
      icon: 'heart',
      color: COLORS.primary,
      priority: 'low',
      payload: {},
      now: ctx.now,
    })];
  }
}
