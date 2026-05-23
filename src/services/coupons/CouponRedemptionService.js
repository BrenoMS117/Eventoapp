import { supabase } from '../../lib/supabase';

// ── Configuração ──────────────────────────────────────────────────────────────
export const REDEMPTION_CONFIG = {
  RATE_LIMIT_PER_24H: 5,
  GEOFENCE_RADIUS_M:  150,
};

// ── Geração de QR code ────────────────────────────────────────────────────────
function _generateQrCode() {
  const ts  = Date.now().toString(36).toUpperCase().slice(-6);
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `LV-${ts}-${rnd}`;
}

// ── CouponRedemptionService ───────────────────────────────────────────────────

class CouponRedemptionService {

  // ── Validação ─────────────────────────────────────────────────────────────

  async validate(couponId, userId) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [userCouponRes, rateRes, stockRes] = await Promise.all([
      supabase
        .from('redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('coupon_id', couponId)
        .eq('user_id', userId),

      supabase
        .from('redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('redeemed_at', since),

      supabase
        .from('coupons')
        .select('remaining_qty, redemption_rules')
        .eq('id', couponId)
        .single(),
    ]);

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

  // ── Comando ───────────────────────────────────────────────────────────────

  async redeem(couponId, userId) {
    let data  = null;
    let error = null;
    let remaining = 3;

    while (remaining-- > 0) {
      const qrCode = _generateQrCode();
      ({ data, error } = await supabase
        .from('redemptions')
        .insert({
          coupon_id:   couponId,
          user_id:     userId,
          qr_code:     qrCode,
          redeemed_at: new Date().toISOString(),
        })
        .select('id, qr_code, redeemed_at')
        .single());

      if (!error || error.code !== '23505') break;
    }

    if (error) {
      return { success: false, error: 'Erro ao registrar resgate. Tente novamente.' };
    }

    await this._onRedemptionCreated(couponId);

    return {
      success:    true,
      qrCode:     data.qr_code,
      redeemedAt: data.redeemed_at,
    };
  }

  async _onRedemptionCreated(couponId) {
    // ── Via RPC (atômica) ─────────────────────────────────────────────────
    const { error: rpcErr } = await supabase.rpc('decrement_coupon_qty', {
      p_coupon_id: couponId,
    });
    if (!rpcErr) return;

    // ── Fallback: read-then-write ─────────────────────────────────────────
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

  // ── Consultas ─────────────────────────────────────────────────────────────

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

  async getCouponRedemptionCount(couponId) {
    const { count } = await supabase
      .from('redemptions')
      .select('*', { count: 'exact', head: true })
      .eq('coupon_id', couponId);
    return count ?? 0;
  }
}

export const couponRedemptionService = new CouponRedemptionService();
