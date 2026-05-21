import { supabase } from '../../lib/supabase';

// ── Configuration ────────────────────────────────────────────────────────────
export const REDEMPTION_CONFIG = {
  RATE_LIMIT_PER_24H: 5,    // max redeems per user in any rolling 24 h window
  GEOFENCE_RADIUS_M:  150,  // must match GeoProfiles.user.geofenceRadiusM
};

// ── QR code generation ────────────────────────────────────────────────────────
function _generateQrCode() {
  const ts  = Date.now().toString(36).toUpperCase().slice(-6);
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `LV-${ts}-${rnd}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CouponRedemptionService
//
// Single source of truth for all coupon redemption logic.
// Decoupled from React — owns no state, no hooks, no components.
//
// Integration points:
//   • validate(couponId, userId)           → pre-flight checks (DB level)
//   • redeem(couponId, userId)             → write redemption + Observer triggers stock decrement
//   • getUserRedemptions(userId)           → full list with QR codes
//   • getRedemptionForCoupon(userId, couponId) → single QR for display
//   • getCouponRedemptionCount(couponId)   → for owner conversion metrics
//
// DB migration required:
//   ALTER TABLE redemptions ADD COLUMN IF NOT EXISTS redeemed_at TIMESTAMPTZ DEFAULT NOW();
//   ALTER TABLE redemptions ADD COLUMN IF NOT EXISTS qr_code TEXT;
//   CREATE INDEX IF NOT EXISTS idx_redemptions_user ON redemptions(user_id);
//   CREATE INDEX IF NOT EXISTS idx_redemptions_user_time ON redemptions(user_id, redeemed_at);
// ─────────────────────────────────────────────────────────────────────────────

class CouponRedemptionService {
  // ── Validation Pipeline ───────────────────────────────────────────────────

  /**
   * Runs all DB-level pre-redemption validations in a single round-trip batch.
   * Caller is responsible for local geo check (userCoords) before calling this.
   *
   * Checks (in order):
   *   1. Duplicate: user already redeemed this coupon
   *   2. Rate limit: ≤ RATE_LIMIT_PER_24H redeems in the last 24 h
   *   3. Stock: remaining_qty > 0
   *
   * @param {string} couponId
   * @param {string} userId
   * @returns {Promise<{ allowed: boolean, reason?: string }>}
   */
  async validate(couponId, userId) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [userCouponRes, rateRes, stockRes] = await Promise.all([
      // 1. How many times has this user redeemed this specific coupon?
      supabase
        .from('redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('coupon_id', couponId)
        .eq('user_id', userId),

      // 2. How many total redeems by this user in the last 24 h? (system-wide rate limit)
      supabase
        .from('redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('redeemed_at', since),

      // 3. Current stock + owner-defined per-user limit from redemption_rules
      supabase
        .from('coupons')
        .select('remaining_qty, redemption_rules')
        .eq('id', couponId)
        .single(),
    ]);

    // Per-user limit: owner can set maxPerUser in redemption_rules (default: 1).
    // Check before the system-wide rate limit so the error message is more specific.
    const maxPerUser = stockRes.data?.redemption_rules?.maxPerUser ?? 1;
    const userRedeemCount = userCouponRes.count ?? 0;
    if (userRedeemCount >= maxPerUser) {
      return {
        allowed: false,
        reason: maxPerUser === 1
          ? 'Você já resgatou este cupom.'
          : `Limite de ${maxPerUser} resgates por usuário atingido para este cupom.`,
      };
    }

    // System-wide 24 h rate limit across all coupons
    if ((rateRes.count ?? 0) >= REDEMPTION_CONFIG.RATE_LIMIT_PER_24H) {
      return {
        allowed: false,
        reason: `Limite de ${REDEMPTION_CONFIG.RATE_LIMIT_PER_24H} resgates em 24 horas atingido.`,
      };
    }

    if (!stockRes.data || stockRes.data.remaining_qty <= 0) {
      return { allowed: false, reason: 'Cupons esgotados.' };
    }

    return { allowed: true };
  }

  // ── Command ───────────────────────────────────────────────────────────────

  /**
   * Atomically writes a redemption record, then triggers stock decrement
   * via the Observer callback _onRedemptionCreated.
   *
   * Always call validate() before this method.
   *
   * @param {string} couponId
   * @param {string} userId
   * @returns {Promise<{ success: boolean, qrCode?: string, redeemedAt?: string, error?: string }>}
   */
  async redeem(couponId, userId) {
    const qrCode = _generateQrCode();

    const { data, error } = await supabase
      .from('redemptions')
      .insert({
        coupon_id:   couponId,
        user_id:     userId,
        qr_code:     qrCode,
        redeemed_at: new Date().toISOString(),
      })
      .select('id, qr_code, redeemed_at')
      .single();

    if (error) {
      return { success: false, error: 'Erro ao registrar resgate. Tente novamente.' };
    }

    // Observer: redemption created → decrement remaining_qty
    await this._onRedemptionCreated(couponId);

    return {
      success:    true,
      qrCode:     data.qr_code,
      redeemedAt: data.redeemed_at,
    };
  }

  /**
   * Observer callback: fired after a new redemption is successfully persisted.
   * Decrements coupons.remaining_qty — decoupled from the main write.
   *
   * Uses read-then-write (no stored procedure required).
   * Race-condition risk is acceptable for coupon stock purposes (same as CrowdManagementService).
   *
   * @param {string} couponId
   */
  async _onRedemptionCreated(couponId) {
    const { data } = await supabase
      .from('coupons')
      .select('remaining_qty')
      .eq('id', couponId)
      .single();
    if (!data || data.remaining_qty <= 0) return;
    await supabase
      .from('coupons')
      .update({ remaining_qty: Math.max(0, data.remaining_qty - 1) })
      .eq('id', couponId);
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  /**
   * Full redemption list for a user, newest first.
   * Includes QR codes for display.
   *
   * @param {string} userId
   * @returns {Promise<Array<{ couponId: string, qrCode: string, redeemedAt: string }>>}
   */
  async getUserRedemptions(userId) {
    const { data } = await supabase
      .from('redemptions')
      .select('coupon_id, qr_code, redeemed_at')
      .eq('user_id', userId)
      .order('redeemed_at', { ascending: false });
    return (data ?? []).map((r) => ({
      couponId:   r.coupon_id,
      qrCode:     r.qr_code ?? '',
      redeemedAt: r.redeemed_at ?? '',
    }));
  }

  /**
   * Fetch a single redemption for a (user, coupon) pair.
   * Returns null if not found.
   *
   * @param {string} userId
   * @param {string} couponId
   * @returns {Promise<{ qrCode: string, redeemedAt: string } | null>}
   */
  async getRedemptionForCoupon(userId, couponId) {
    const { data } = await supabase
      .from('redemptions')
      .select('qr_code, redeemed_at')
      .eq('user_id', userId)
      .eq('coupon_id', couponId)
      .maybeSingle();
    return data
      ? { qrCode: data.qr_code ?? '', redeemedAt: data.redeemed_at ?? '' }
      : null;
  }

  /**
   * Total number of redemptions for a coupon — for owner conversion metrics.
   *
   * @param {string} couponId
   * @returns {Promise<number>}
   */
  async getCouponRedemptionCount(couponId) {
    const { count } = await supabase
      .from('redemptions')
      .select('*', { count: 'exact', head: true })
      .eq('coupon_id', couponId);
    return count ?? 0;
  }
}

export const couponRedemptionService = new CouponRedemptionService();
