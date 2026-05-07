import { supabase } from "../lib/supabase";

export const eventsService = {
  async getAll() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return { data: null, error };
    return { data: data.map(_mapEvent), error: null };
  },

  async getById(id) {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return { data: null, error };
    return { data: _mapEvent(data), error: null };
  },

  async create(event, ownerId) {
    const { data, error } = await supabase
      .from("events")
      .insert({
        owner_id: ownerId,
        name: event.name,
        venue: event.venue,
        address: event.address,
        category: event.category,
        category_label: event.categoryLabel,
        is_live: false,
        starts_at: event.startsAt,
        ends_at: event.endsAt,
        price: event.price,
        accessible: event.accessible,
        accessibility_notes: event.accessibilityNotes,
        next_act: event.nextAct,
        description: event.description,
        distance_km: 0.5,
        gradient: event.gradient,
        age_restriction: event.ageRestriction,
      })
      .select()
      .single();
    if (error) return { data: null, error };
    return { data: _mapEvent(data), error: null };
  },

  async updateCrowdLevel(id, level) {
    const label =
      level >= 85
        ? "Lotado"
        : level >= 60
          ? "Bastante cheio"
          : level >= 30
            ? "Moderado"
            : "Tranquilo";
    const { error } = await supabase
      .from("events")
      .update({ crowd_level: level, crowd_label: label })
      .eq("id", id);
    return { error };
  },
};

function _mapEvent(d) {
  return {
    id: d.id,
    name: d.name,
    venue: d.venue,
    address: d.address,
    category: d.category,
    categoryLabel: d.category_label,
    isLive: d.is_live,
    startsAt: d.starts_at,
    endsAt: d.ends_at,
    crowdLevel: d.crowd_level ?? 0,
    crowdLabel: d.crowd_label ?? "Aguardando",
    queueMinutes: d.queue_minutes ?? 0,
    rating: d.rating ?? 0,
    reviewCount: d.review_count ?? 0,
    checkedInCount: d.checked_in_count ?? 0,
    accessible: d.accessible ?? false,
    accessibilityNotes: d.accessibility_notes,
    nowPlaying: d.now_playing,
    nextAct: d.next_act,
    price: d.price,
    distanceKm: d.distance_km ?? 0,
    gradient: d.gradient ?? ["#1D9E75", "#085041"],
    couponsCount: d.coupons_count ?? 0,
    description: d.description,
    ageRestriction: d.age_restriction,
  };
}
