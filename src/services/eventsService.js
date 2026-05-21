import { supabase } from '../lib/supabase';

/**
 * Returns an ISO timestamp for (now − 1 hour).
 * Used to filter out events that have been closed/ended for over an hour.
 */
function _oneHourAgoISO() {
  return new Date(Date.now() - 60 * 60 * 1000).toISOString();
}

/**
 * Returns true when an event should be hidden from the app.
 *
 * An event is considered expired when:
 *   • Its scheduled end time (ends_at) is more than 1 h in the past, OR
 *   • It was manually closed (closed_at set) more than 1 h ago.
 *
 * Used for client-side cleanup in AppContext after the event has already
 * been removed from the server response.
 */
export function isEventExpired(event) {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  if (event.endsAt && new Date(event.endsAt).getTime() < oneHourAgo) return true;
  if (event.closedAt && new Date(event.closedAt).getTime() < oneHourAgo) return true;
  return false;
}

export const eventsService = {
  async getAll() {
    const ago = _oneHourAgoISO();
    const { data, error } = await supabase
      .from('events')
      .select('*')
      // Only filter on closed_at (we control its format — always a full ISO timestamp).
      // ends_at is intentionally excluded from the server filter because legacy events
      // stored it as a time-only string ("02:00"), which causes incorrect string
      // comparisons in PostgreSQL. Client-side isEventExpired() handles ends_at cleanup
      // once events have been loaded, using new ISO datetimes going forward.
      .or(`closed_at.is.null,closed_at.gt.${ago}`)
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
    const ago = _oneHourAgoISO();
    let q = supabase.from('events').select('*');
    if (category && category !== 'todos') q = q.eq('category', category);
    if (query) q = q.or(`name.ilike.%${query}%,venue.ilike.%${query}%`);
    // Same filter rationale as getAll: closed_at only (ends_at may be legacy text)
    q = q
      .or(`closed_at.is.null,closed_at.gt.${ago}`)
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

  /**
   * Hard-deletes a single event and its associated storage objects.
   *
   * Deletion order:
   *   1. Remove photos from the `event-photos` storage bucket (best-effort).
   *   2. Delete the event row — DB CASCADE handles event_ratings, coupons, redemptions.
   *
   * @param {string} id  Event UUID
   * @returns {Promise<{ error: any }>}
   */
  async deleteEvent(id) {
    // ── 1. Storage cleanup (non-fatal) ──────────────────────────────────────
    try {
      const { data: ev } = await supabase
        .from('events')
        .select('photos')
        .eq('id', id)
        .single();

      if (ev?.photos?.length) {
        const paths = ev.photos
          .filter((u) => typeof u === 'string' && u.includes('/event-photos/'))
          .map((u) => u.split('/event-photos/')[1])
          .filter(Boolean);
        if (paths.length) {
          await supabase.storage.from('event-photos').remove(paths);
        }
      }
    } catch (_) {
      // Storage cleanup failure is non-fatal — proceed with DB delete.
    }

    // ── 2. Hard-delete event row (cascades to related tables) ───────────────
    const { error } = await supabase.from('events').delete().eq('id', id);
    return { error };
  },

  /**
   * Batch-deletes all events that were manually closed more than 1 hour ago
   * (closed_at < now() − 1 h).  Called by the AppContext purge interval as a
   * safety net in addition to client-side cleanup.
   *
   * @returns {Promise<{ deletedIds: string[], error: any }>}
   */
  async deleteExpiredBatch() {
    const ago = _oneHourAgoISO();
    const { data, error } = await supabase
      .from('events')
      .delete()
      .not('closed_at', 'is', null)
      .lt('closed_at', ago)
      .select('id');
    return { deletedIds: (data ?? []).map((r) => r.id), error };
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
  };
}
