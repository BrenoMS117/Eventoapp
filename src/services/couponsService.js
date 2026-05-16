import { supabase } from '../lib/supabase';

export const couponsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return { data: null, error };
    return { data: data.map(_mapCoupon), error: null };
  },

  async getByEvent(eventId) {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('event_id', eventId);
    if (error) return { data: null, error };
    return { data: data.map(_mapCoupon), error: null };
  },

  async create(coupon, ownerId) {
    const { data, error } = await supabase
      .from('coupons')
      .insert({
        event_id: coupon.eventId,
        owner_id: ownerId,
        event_name: coupon.eventName,
        venue: coupon.venue,
        type: coupon.type,
        type_label: coupon.typeLabel,
        icon: coupon.icon,
        title: coupon.title,
        description: coupon.description,
        conditions: coupon.conditions,
        expires_at: coupon.expiresAt,
        total_qty: coupon.totalQty,
        remaining_qty: coupon.totalQty,
        is_nearby: true,
        gradient: coupon.gradient,
        highlight_color: coupon.highlightColor,
        redemption_rules: coupon.redemptionRules ?? null,
      })
      .select()
      .single();
    if (error) return { data: null, error };
    return { data: _mapCoupon(data), error: null };
  },

  async redeem(couponId, userId) {
    // Decrement remaining_qty
    const { data: coupon } = await supabase
      .from('coupons')
      .select('remaining_qty')
      .eq('id', couponId)
      .single();

    if (!coupon || coupon.remaining_qty <= 0) {
      return { success: false, error: 'Cupons esgotados.' };
    }

    const qrCode = `EVT-${couponId.slice(0, 8).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    const [{ error: redeemError }, { error: updateError }] = await Promise.all([
      supabase.from('redemptions').insert({ coupon_id: couponId, user_id: userId, qr_code: qrCode }),
      supabase.from('coupons').update({ remaining_qty: coupon.remaining_qty - 1 }).eq('id', couponId),
    ]);

    if (redeemError || updateError) return { success: false, error: 'Erro ao resgatar. Tente novamente.' };
    return { success: true, qrCode };
  },

  async getUserRedemptions(userId) {
    const { data } = await supabase
      .from('redemptions')
      .select('coupon_id')
      .eq('user_id', userId);
    return data?.map(r => r.coupon_id) ?? [];
  },
};

function _mapCoupon(d) {
  return {
    id: d.id,
    eventId: d.event_id,
    eventName: d.event_name,
    venue: d.venue,
    type: d.type,
    typeLabel: d.type_label,
    icon: d.icon,
    title: d.title,
    description: d.description,
    conditions: d.conditions,
    expiresAt: d.expires_at,
    totalQty: d.total_qty,
    remainingQty: d.remaining_qty,
    isNearby: d.is_nearby ?? false,
    isRedeemed: false, // computed from redemptions
    gradient: d.gradient ?? ['#1D9E75', '#085041'],
    highlightColor: d.highlight_color ?? '#0D9E75',
    redemptionRules: d.redemption_rules ?? null,
  };
}
