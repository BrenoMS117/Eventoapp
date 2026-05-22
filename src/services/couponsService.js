import { supabase } from '../lib/supabase';

export const couponsService = {
  async getAll() {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      // Exclude coupons whose expires_at is already in the past.
      // This covers both naturally-timed coupons and coupons closed
      // by closeByEvent() when the owner ends the event.
      .or(`expires_at.is.null,expires_at.gt.${now}`)
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
        gradient: coupon.gradient,
        highlight_color: coupon.highlightColor,
        redemption_rules: coupon.redemptionRules ?? null,
      })
      .select()
      .single();
    if (error) return { data: null, error };
    return { data: _mapCoupon(data), error: null };
  },

  async uploadPhoto(couponId, uri) {
    const ext = uri.split('.').pop() ?? 'jpg';
    const path = `${couponId}/${Date.now()}.${ext}`;
    const response = await fetch(uri);
    const blob = await response.blob();
    const { error } = await supabase.storage.from('coupon-photos').upload(path, blob);
    if (error) return { url: null, error };
    const { data: urlData } = supabase.storage.from('coupon-photos').getPublicUrl(path);
    return { url: urlData.publicUrl, error: null };
  },

  async removePhoto(storagePath) {
    await supabase.storage.from('coupon-photos').remove([storagePath]);
  },

  async savePhotoUrl(couponId, url) {
    const { data: current } = await supabase
      .from('coupons')
      .select('photos')
      .eq('id', couponId)
      .single();
    const photos = [...(current?.photos ?? []), url];
    const { error } = await supabase
      .from('coupons')
      .update({ photos })
      .eq('id', couponId);
    return { error };
  },

  async updateCrowdLevel(couponId, crowdLevel) {
    const { error } = await supabase
      .from('coupons')
      .update({ crowd_level: crowdLevel })
      .eq('id', couponId);
    return { error };
  },

  /**
   * Marks all coupons of an event as expired (sets expires_at = NOW()).
   * Called automatically when the owner closes an event so no new
   * redemptions are possible from that point on.
   *
   * @param {string} eventId  UUID of the event being closed.
   * @returns {Promise<{ error: any }>}
   */
  async closeByEvent(eventId) {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('coupons')
      .update({ expires_at: now })
      .eq('event_id', eventId);
    return { error };
  },

  /**
   * Expira cupons de múltiplos eventos em uma única query (batch).
   * Substitui N chamadas sequenciais — elimina N+1 no autoManageEvents.
   * @param {string[]} eventIds
   */
  async closeByEventsBatch(eventIds) {
    if (!eventIds?.length) return { error: null };
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('coupons')
      .update({ expires_at: now })
      .in('event_id', eventIds);
    return { error };
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
