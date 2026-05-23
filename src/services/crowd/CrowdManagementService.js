import { supabase } from '../../lib/supabase';

// ── Funções auxiliares ────────────────────────────────────────────────────────

function _labelFromLevel(level) {
  return level >= 85 ? 'Lotado'
       : level >= 60 ? 'Bastante cheio'
       : level >= 30 ? 'Moderado'
       : 'Tranquilo';
}

function _levelFromCount(count) {
  if (count >= 300) return 95;
  if (count >= 150) return 78;
  if (count >= 75)  return 55;
  if (count >= 30)  return 32;
  if (count >= 10)  return 18;
  return Math.max(1, count * 2);
}

async function _applyDelta(eventId, delta) {
  // ── Via RPC (atômica) ─────────────────────────────────────────────────────
  const { data: rpcData, error: rpcErr } = await supabase.rpc('adjust_crowd', {
    p_event_id: eventId,
    p_delta: delta,
  });
  if (!rpcErr && rpcData?.[0]) {
    const { new_count, new_level, new_label } = rpcData[0];
    return { error: null, count: new_count, level: new_level, label: new_label };
  }

  // ── Fallback: read-then-write ─────────────────────────────────────────────
  const { data, error } = await supabase
    .from('events')
    .select('checked_in_count, max_capacity')
    .eq('id', eventId)
    .single();

  if (error) return { error };

  const newCount = Math.max(0, (data.checked_in_count ?? 0) + delta);
  const cap = data.max_capacity;
  const level = cap
    ? Math.min(100, Math.round((newCount / cap) * 100))
    : _levelFromCount(newCount);
  const label = _labelFromLevel(level);

  const { error: upErr } = await supabase
    .from('events')
    .update({ checked_in_count: newCount, crowd_level: level, crowd_label: label })
    .eq('id', eventId);

  return { error: upErr ?? null, count: newCount, level, label };
}

// ── CrowdManagementService ────────────────────────────────────────────────────

class CrowdManagementService {
  constructor() {
    this._checkedInEvents = new Set();
    this._checkOutTimers = new Map();
    this._onUpdate = null;
    this._realtimeChannel = null;
  }

  // ── Registro de callback ──────────────────────────────────────────────────

  setUpdateCallback(fn) {
    this._onUpdate = fn;
  }

  // ── Status de check-in ────────────────────────────────────────────────────

  isCheckedIn(eventId) {
    return this._checkedInEvents.has(eventId);
  }

  getCheckedInEventIds() {
    return [...this._checkedInEvents];
  }

  // ── Check-in ──────────────────────────────────────────────────────────────

  async checkIn(eventId) {
    if (this._checkedInEvents.has(eventId)) return { alreadyIn: true };

    this._checkedInEvents.add(eventId);
    const result = await _applyDelta(eventId, +1);

    if (result.error) {
      this._checkedInEvents.delete(eventId);
    } else {
      this._onUpdate?.(eventId, {
        checkedInCount: result.count,
        crowdLevel:     result.level,
        crowdLabel:     result.label,
      });
    }
    return result;
  }

  // ── Check-out ─────────────────────────────────────────────────────────────

  async checkOut(eventId) {
    this._clearTimer(eventId);

    if (!this._checkedInEvents.has(eventId)) return { notIn: true };
    this._checkedInEvents.delete(eventId);

    const result = await _applyDelta(eventId, -1);
    if (!result.error) {
      this._onUpdate?.(eventId, {
        checkedInCount: result.count,
        crowdLevel:     result.level,
        crowdLabel:     result.label,
      });
    }
    return result;
  }

  // ── Auto check-out: fim do evento ────────────────────────────────────────

  scheduleAutoCheckOut(eventId, endsAtIso) {
    if (!endsAtIso) return;
    const endTime = new Date(endsAtIso).getTime();
    if (isNaN(endTime)) return;
    const delay = endTime - Date.now();
    if (delay <= 0) {
      if (this._checkedInEvents.has(eventId)) this.checkOut(eventId);
      return;
    }
    this._clearTimer(eventId);
    const timer = setTimeout(() => {
      this._checkOutTimers.delete(eventId);
      this.checkOut(eventId);
    }, delay);
    this._checkOutTimers.set(eventId, timer);
  }

  // ── Auto check-out: saída do geofence ────────────────────────────────────

  getStaleCheckIns(currentNearbyIds) {
    return [...this._checkedInEvents].filter(
      (id) => !currentNearbyIds.includes(id),
    );
  }

  // ── Assinatura Realtime ───────────────────────────────────────────────────

  startRealtimeSubscription() {
    if (this._realtimeChannel) return;

    this._realtimeChannel = supabase
      .channel('crowd-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'events' },
        (payload) => {
          const d = payload.new;
          if (!d?.id) return;
          this._onUpdate?.(d.id, {
            crowdLevel:     d.crowd_level      ?? 0,
            crowdLabel:     d.crowd_label      ?? 'Aguardando',
            checkedInCount: d.checked_in_count ?? 0,
            isLive:         d.is_live          ?? false,
            rating:         d.rating           ?? 0,
            reviewCount:    d.review_count     ?? 0,
          });
        },
      )
      .subscribe();
  }

  stopRealtimeSubscription() {
    if (this._realtimeChannel) {
      supabase.removeChannel(this._realtimeChannel);
      this._realtimeChannel = null;
    }
  }

  // ── Ciclo de vida ─────────────────────────────────────────────────────────

  reset() {
    for (const timer of this._checkOutTimers.values()) clearTimeout(timer);
    this._checkOutTimers.clear();
    this._checkedInEvents.clear();
    this.stopRealtimeSubscription();
    this._onUpdate = null;
  }

  // ── Privado ───────────────────────────────────────────────────────────────

  _clearTimer(eventId) {
    const timer = this._checkOutTimers.get(eventId);
    if (timer !== undefined) {
      clearTimeout(timer);
      this._checkOutTimers.delete(eventId);
    }
  }
}

export const crowdManagementService = new CrowdManagementService();
