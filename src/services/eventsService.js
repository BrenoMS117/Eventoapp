import { supabase } from '../lib/supabase';

export const eventsService = {
  async getAll() {
    // Safety net: don't load non-live events older than 14 days.
    // Live events always bypass this limit.
    const maxAge = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('events')
      .select('*')
      // Only open events (closed_at IS NULL = not yet closed by owner or auto-close).
      // Events are soft-closed — they stay in the DB for history but disappear from the feed.
      .is('closed_at', null)
      // Safety net: live OR recently created.
      // Prevents legacy events without closed_at from loading forever.
      .or(`is_live.eq.true,created_at.gt.${maxAge}`)
      .order('created_at', { ascending: false });
    if (error) return { data: null, error };
    return { data: data.map(_mapEvent), error: null };
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return { data: null, error };
    return { data: _mapEvent(data), error: null };
  },

  async create(event, ownerId) {
    const { data, error } = await supabase
      .from('events')
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
        lat: event.lat ?? null,
        lng: event.lng ?? null,
      })
      .select()
      .single();
    if (error) return { data: null, error };
    return { data: _mapEvent(data), error: null };
  },

  async search(query, category) {
    const maxAge = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    let q = supabase.from('events').select('*');
    if (category && category !== 'todos') q = q.eq('category', category);
    if (query) q = q.or(`name.ilike.%${query}%,venue.ilike.%${query}%`);
    q = q
      .is('closed_at', null)
      .or(`is_live.eq.true,created_at.gt.${maxAge}`)
      .order('created_at', { ascending: false })
      .limit(50);
    const { data, error } = await q;
    if (error) return { data: null, error };
    return { data: data.map(_mapEvent), error: null };
  },

  /**
   * Atualiza campos permitidos de um evento.
   * Apenas as chaves presentes em `fields` são enviadas ao banco.
   * @param {string} id
   * @param {{ nextAct?: string, endsAt?: string }} fields
   */
  async updateFields(id, fields) {
    const columnMap = { nextAct: 'next_act', endsAt: 'ends_at' };
    const patch = {};
    for (const [key, col] of Object.entries(columnMap)) {
      if (fields[key] !== undefined) patch[col] = fields[key];
    }
    if (Object.keys(patch).length === 0) return { error: null };
    const { error } = await supabase.from('events').update(patch).eq('id', id);
    return { error };
  },

  async startEvent(id) {
    const { error } = await supabase
      .from('events')
      .update({ is_live: true })
      .eq('id', id);
    return { error };
  },

  async closeEvent(id) {
    const { error } = await supabase
      .from('events')
      .update({ is_live: false, closed_at: new Date().toISOString() })
      .eq('id', id);
    return { error };
  },

async uploadPhoto(eventId, uri) {
  const ext = (uri.split('.').pop() || 'jpg').toLowerCase().split('?')[0];
  const path = `${eventId}/${Date.now()}.${ext}`;
  console.log('uploadPhoto - path:', path);

  const formData = new FormData();
  formData.append('file', {
    uri,
    name: `photo.${ext}`,
    type: `image/${ext}`,
  });
  console.log('uploadPhoto - formData montado');

  const { data, error } = await supabase.storage
    .from('event-photos')
    .upload(path, formData, { contentType: `image/${ext}` });

  console.log('uploadPhoto - upload retornou - data:', data, 'error:', JSON.stringify(error));

  if (error) return { url: null, path: null, error };

  const { data: { publicUrl } } = supabase.storage
    .from('event-photos')
    .getPublicUrl(path);

  console.log('uploadPhoto - publicUrl:', publicUrl);
  return { url: publicUrl, path, error: null };
},

  async removePhoto(path) {
    const { error } = await supabase.storage
      .from('event-photos')
      .remove([path]);
    return { error };
  },

  async savePhotoUrl(eventId, url) {
    const { data } = await supabase
      .from('events')
      .select('photos')
      .eq('id', eventId)
      .single();
    const photos = [...(data?.photos ?? []), url];
    const { error } = await supabase
      .from('events')
      .update({ photos })
      .eq('id', eventId);
    return { error };
  },

  async updateCrowdLevel(id, level) {
    const label = level >= 85 ? 'Lotado' : level >= 60 ? 'Bastante cheio' : level >= 30 ? 'Moderado' : 'Tranquilo';
    const { error } = await supabase
      .from('events')
      .update({ crowd_level: level, crowd_label: label })
      .eq('id', id);
    return { error };
  },

};

function _mapEvent(d) {
  return {
    id: d.id,
    ownerId: d.owner_id,
    name: d.name,
    venue: d.venue,
    address: d.address,
    category: d.category,
    categoryLabel: d.category_label,
    isLive: d.is_live,
    startsAt: d.starts_at,
    endsAt: d.ends_at,
    crowdLevel: d.crowd_level ?? 0,
    crowdLabel: d.crowd_label ?? 'Aguardando',
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
    gradient: d.gradient ?? ['#1D9E75', '#085041'],
    couponsCount: d.coupons_count ?? 0,
    description: d.description,
    ageRestriction: d.age_restriction,
    lat: d.lat ?? null,
    lng: d.lng ?? null,
    photos: d.photos ?? [],
    coverPhoto: d.photos?.[0] ?? null,
    maxCapacity: d.max_capacity ?? null,
    closedAt: d.closed_at ?? null,
    createdAt: d.created_at ?? null,
  };
}
