import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { authService } from "../services/authService";
import { eventsService } from "../services/eventsService";
import { couponsService } from "../services/couponsService";
import { feedService } from "../services/feedService";
import { geoService } from "../services/geo/GeoService";
import { createPermissionStrategy } from "../permissions/PermissionStrategy";
import { crowdManagementService } from "../services/crowd/CrowdManagementService";
import { ratingService } from "../services/ratings/RatingService";
import { couponRedemptionService } from "../services/coupons/CouponRedemptionService";
import { notificationService } from "../services/notifications/NotificationService";
import { notificationPreferencesService } from "../services/notifications/NotificationPreferencesService";
import { announcementService } from "../services/announcements/AnnouncementService";
import { makeNotif } from "../services/notifications/notifUtils";
import { COLORS } from "../utils/theme";

const AppContext = createContext(null);

let _supabaseReady = false;
try {
  const { supabase } = require("../lib/supabase");
  _supabaseReady = !!supabase;
} catch (e) {
  _supabaseReady = false;
}

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [businessStats, setBusinessStats] = useState({
    activeEventId: null,
    activeEventName: null,
    venueName: null,
    checkedIn: 0,
    checkedInChange: '+0',
    rating: '—',
    reviewsToday: 0,
    recentReviews: [],
    heatLevel: null,
    couponsRedeemed: 0,
    couponsTotal: 0,
  });
  const [dataLoading, setDataLoading] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [nearbyEventIds, setNearbyEventIds] = useState([]);
  const [geoError, setGeoError] = useState(false);
  const [redeemedCoupons, setRedeemedCoupons] = useState([]);
  const [redemptionMap, setRedemptionMap] = useState({});
  const [checkedInEventIds, setCheckedInEventIds] = useState([]);
  const [eventRatingMap, setEventRatingMap] = useState({});
  const subscribedRatingsRef = useRef(new Set());
  const geoWatchRef  = useRef(null);
  const eventsRef    = useRef([]);
  const [selectedEventFilter, setSelectedEventFilter] = useState("Todos");

  // ── Bootstrap do gerenciamento de lotação ─────────────────────────────────
  useEffect(() => {
    crowdManagementService.setUpdateCallback((eventId, patch) => {
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, ...patch } : e)),
      );
    });
    return () => crowdManagementService.reset();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Anúncios do proprietário: assinatura Realtime para usuários comuns ────
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'user') return;
    announcementService.startRealtimeSubscription((row) => {
      notificationService.push(makeNotif({
        dedupeKey:  `announcement:${row.id}`,
        type:       'announcement',
        title:      row.title,
        body:       row.body,
        icon:       'megaphone',
        color:      COLORS.primary,
        priority:   'high',
        payload:    { eventId: row.event_id },
        now:        new Date(),
      }));
    });
  }, [currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'user') return;
    announcementService.setNearbyIds(nearbyEventIds);
  }, [nearbyEventIds, currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto check-out: saída do geofence ───────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const stale = crowdManagementService.getStaleCheckIns(nearbyEventIds).filter((id) => {
      const ev = events.find((e) => e.id === id);
      return ev?.lat != null && ev?.lng != null;
    });
    if (stale.length === 0) return;
    stale.forEach((id) => crowdManagementService.checkOut(id));
    setCheckedInEventIds((prev) => prev.filter((id) => !stale.includes(id)));
  }, [nearbyEventIds, currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { eventsRef.current = events; }, [events]);

  // ── Auto-gerenciamento de eventos ─────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    let _isRunning = false;

    async function autoManageEvents() {
      if (_isRunning) return;
      _isRunning = true;
      try {
        const now = Date.now();

        // ── Passagem 1: ocultar no cliente para todos os usuários ────────────
        const toHide = eventsRef.current.filter((e) => {
          if (e.endsAt) {
            const t = new Date(e.endsAt).getTime();
            if (!isNaN(t) && t <= now) return true;
          }
          return false;
        });
        if (toHide.length > 0) {
          const hideIds = new Set(toHide.map((e) => e.id));
          setEvents((prev) => prev.filter((e) => !hideIds.has(e.id)));
          setCoupons((prev) => prev.filter((c) => !hideIds.has(c.eventId)));
          setFeedPosts((prev) => prev.filter((p) => !hideIds.has(p.eventId)));
        }

        // ── Passagem 2: escritas no banco — somente donos ─────────────────────
        if (currentUser.role !== 'business' || !currentUser.id) return;

        const ownerEvents = eventsRef.current.filter((e) => e.ownerId === currentUser.id);

        const toStart = ownerEvents.filter((e) => {
          if (e.isLive || e.closedAt) return false;
          if (!e.startsAt) return false;
          const t = new Date(e.startsAt).getTime();
          return !isNaN(t) && t <= now;
        });
        if (toStart.length > 0) {
          await eventsService.startEventsBatch(toStart.map((e) => e.id));
          const startIds = new Set(toStart.map((e) => e.id));
          setEvents((prev) =>
            prev.map((e) => (startIds.has(e.id) ? { ...e, isLive: true } : e)),
          );
        }

        const toClose = ownerEvents.filter((e) => {
          if (!e.isLive || e.closedAt) return false;
          if (!e.endsAt) return false;
          const t = new Date(e.endsAt).getTime();
          return !isNaN(t) && t <= now;
        });
        if (toClose.length > 0) {
          const closeIds = toClose.map((e) => e.id);
          await Promise.all([
            eventsService.closeEventsBatch(closeIds),
            couponsService.closeByEventsBatch(closeIds),
            feedService.closeByEventsBatch(closeIds),
          ]);
          const closeIdsSet = new Set(closeIds);
          setEvents((prev) => prev.filter((e) => !closeIdsSet.has(e.id)));
          setCoupons((prev) => prev.filter((c) => !closeIdsSet.has(c.eventId)));
          setFeedPosts((prev) => prev.filter((p) => !closeIdsSet.has(p.eventId)));
        }
      } finally {
        _isRunning = false;
      }
    }

    autoManageEvents();
    const id = setInterval(autoManageEvents, 60_000);
    return () => clearInterval(id);
  }, [currentUser?.id, currentUser?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── businessStats: manter activeEvent sincronizado com o evento ao vivo ──
  useEffect(() => {
    if (currentUser?.role !== 'business' || !currentUser?.id) return;
    const liveEvent =
      events.find((e) => e.ownerId === currentUser.id && e.isLive) ??
      events.find((e) => e.ownerId === currentUser.id);
    setBusinessStats((prev) => ({
      ...prev,
      activeEventId:   liveEvent?.id   ?? null,
      activeEventName: liveEvent?.name ?? null,
    }));
  }, [events, currentUser?.id, currentUser?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    initSession();
  }, []);

  async function initSession() {
    setAuthLoading(true);
    try {
      const user = await authService.getSession();
      if (user) {
        setCurrentUser(user);
        await loadData(user);
        initGeo(user);
        crowdManagementService.startRealtimeSubscription();
      }
    } catch (e) {
    } finally {
      setAuthLoading(false);
    }
  }

  async function loadData(user) {
    setDataLoading(true);
    try {
      const [eventsRes, couponsRes, feedRes] = await Promise.all([
        eventsService.getAll(),
        couponsService.getAll(),
        feedService.getAll(),
      ]);
      if (eventsRes.data) {
        setEvents(eventsRes.data);
        setUserCoords(prev => {
          if (prev) _updateNearbyIds(prev, eventsRes.data, user?.role);
          return prev;
        });
      }
      if (user?.role === 'business') {
        setBusinessStats(prev => ({
          ...prev,
          venueName: user.venueName || prev.venueName,
        }));
      }
      if (couponsRes.data) setCoupons(couponsRes.data);
      if (feedRes.data) setFeedPosts(feedRes.data);
      if (user) {
        const redemptions = await couponRedemptionService.getUserRedemptions(user.id);
        setRedeemedCoupons(redemptions.map((r) => r.couponId));
        setRedemptionMap(
          Object.fromEntries(redemptions.map((r) => [r.couponId, r]))
        );
      }
    } catch (e) {
      console.log("Load data error:", e);
    } finally {
      setDataLoading(false);
    }
  }

  // ── Geolocalização ────────────────────────────────────────────────────────

  function _updateNearbyIds(coords, eventsArr, role) {
    const { nearbyIds } = geoService.filterNearbyEvents(coords, eventsArr, role ?? 'user');
    setNearbyEventIds(nearbyIds);
  }

  function startGeoWatch(role) {
    if (geoWatchRef.current) geoService.clearWatch(geoWatchRef.current);

    geoWatchRef.current = geoService.watchPosition((result) => {
      if (!result.coords) return;
      setUserCoords(result.coords);
      setEvents(current => {
        _updateNearbyIds(result.coords, current, role);
        return current;
      });
    });
  }

  async function initGeo(user) {
    const result = await geoService.getPosition();
    if (!result.coords) {
      setGeoError(true);
      return;
    }
    setGeoError(false);
    setUserCoords(result.coords);
    setEvents(current => {
      _updateNearbyIds(result.coords, current, user?.role);
      return current;
    });
    startGeoWatch(user?.role);
  }

  function stopGeoWatch() {
    if (geoWatchRef.current) {
      geoService.clearWatch(geoWatchRef.current);
      geoWatchRef.current = null;
    }
    setUserCoords(null);
    setNearbyEventIds([]);
    setGeoError(false);
  }

  // ── Autenticação ──────────────────────────────────────────────────────────
  async function login(email, password) {
    setAuthError("");
    setAuthLoading(true);
    const { user, error } = await authService.signIn(email, password);
    setAuthLoading(false);
    if (error) {
      setAuthError(error);
      return false;
    }
    setCurrentUser(user);
    await loadData(user);
    initGeo(user);
    crowdManagementService.startRealtimeSubscription();
    return true;
  }

  async function register({ name, email, password, role, venueName }) {
    setAuthError("");
    setAuthLoading(true);
    const { user, error } = await authService.signUp({
      email,
      password,
      name,
      role,
      venueName,
    });
    setAuthLoading(false);
    if (error) {
      setAuthError(error);
      return false;
    }
    setCurrentUser(user);
    return true;
  }

  async function updatePassword(newPassword) {
    return await authService.updatePassword(newPassword);
  }

  async function updateProfile({ name, avatar, venueName }) {
    if (!currentUser?.id) return { error: 'Não autenticado.' };
    const result = await authService.updateProfile(currentUser.id, { name, avatar, venueName });
    if (result.error) return result;
    setCurrentUser((prev) => ({
      ...prev,
      ...(name      !== undefined && { name }),
      ...(avatar    !== undefined && { avatar }),
      ...(venueName !== undefined && { venueName }),
    }));
    return { error: null };
  }

  async function logout() {
    crowdManagementService.reset();
    ratingService.reset();
    notificationService.reset();
    notificationPreferencesService.clear();
    announcementService.reset();
    subscribedRatingsRef.current.clear();
    await authService.signOut();
    stopGeoWatch();
    setCurrentUser(null);
    setAuthError("");
    setEvents([]);
    setCoupons([]);
    setFeedPosts([]);
    setRedeemedCoupons([]);
    setRedemptionMap({});
    setCheckedInEventIds([]);
    setEventRatingMap({});
  }

  // ── Eventos ───────────────────────────────────────────────────────────────
  async function updateEventFields(eventId, fields) {
    const perms = createPermissionStrategy(currentUser?.role);
    const allowed = Object.fromEntries(
      Object.entries(fields).filter(([key]) => perms.canEditEventField(key)),
    );
    if (Object.keys(allowed).length === 0) return { error: 'Campos não permitidos.' };
    const result = await eventsService.updateFields(eventId, allowed);
    if (!result.error) {
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, ...allowed } : e)),
      );
    }
    return result;
  }

  async function sendAnnouncement(eventId, anuncio) {
    if (!currentUser?.id) return { error: 'Não autenticado.' };
    return announcementService.send(eventId, currentUser.id, anuncio);
  }

  async function startEvent(eventId) {
    const result = await eventsService.startEvent(eventId);
    if (!result.error) {
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, isLive: true } : e)),
      );
    }
    return result;
  }

  async function closeEvent(eventId) {
    const perms = createPermissionStrategy(currentUser?.role);
    if (!perms.canEditEventField('closeEvent')) {
      return { error: 'Sem permissão para encerrar eventos.' };
    }
    const result = await eventsService.closeEvent(eventId);
    if (!result.error) {
      await couponsService.closeByEvent(eventId);
      await feedService.closeByEvent(eventId);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      setCoupons((prev) => prev.filter((c) => c.eventId !== eventId));
      setFeedPosts((prev) => prev.filter((p) => p.eventId !== eventId));
    }
    return result;
  }

  // ── Check-in / Check-out ──────────────────────────────────────────────────

  async function checkIn(eventId) {
    if (crowdManagementService.isCheckedIn(eventId)) {
      return { error: null, alreadyIn: true };
    }

    const event = events.find((e) => e.id === eventId);
    if (!event?.isLive) {
      return { error: 'O evento precisa estar ao vivo para fazer check-in.' };
    }

    // ── Verificação de proximidade ─────────────────────────────────────────
    if (event.lat != null && event.lng != null) {
      if (!userCoords) {
        return { error: 'Ative o GPS para fazer check-in.' };
      }
      const fence = geoService.checkGeofence(
        userCoords,
        { lat: event.lat, lng: event.lng },
        'user',
      );
      if (!fence.isInside) {
        return { error: `Você precisa estar no local para fazer check-in. ${fence.message}` };
      }
    }

    // ── Regra de evento único: auto check-out de outros eventos ──────────
    const otherIds = crowdManagementService.getCheckedInEventIds().filter((id) => id !== eventId);
    if (otherIds.length > 0) {
      await Promise.all(otherIds.map((id) => crowdManagementService.checkOut(id)));
      setCheckedInEventIds((prev) => prev.filter((id) => !otherIds.includes(id)));
    }

    const result = await crowdManagementService.checkIn(eventId);
    if (!result.error && !result.alreadyIn) {
      setCheckedInEventIds((prev) => [...prev, eventId]);
      if (event.endsAt) {
        crowdManagementService.scheduleAutoCheckOut(eventId, event.endsAt);
      }
    }
    return result;
  }

  async function checkOut(eventId) {
    const result = await crowdManagementService.checkOut(eventId);
    if (!result.error && !result.notIn) {
      setCheckedInEventIds((prev) => prev.filter((id) => id !== eventId));
    }
    return result;
  }

  async function addEvent(newEvent) {
    if (!currentUser?.id) return null;
    const result = await eventsService.create(newEvent, currentUser.id);
    if (!result.data) return null;
    setEvents((prev) => [result.data, ...prev]);
    return result.data;
  }

async function addEventPhoto(eventId, uri) {

  try {
    if (!_supabaseReady || !currentUser?.id) {
      return;
    }

    const result = await eventsService.uploadPhoto(eventId, uri);

    if (result.error || !result.url) {
      return { error: result.error };
    }

    const saveResult = await eventsService.savePhotoUrl(eventId, result.url);

    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== eventId) return e;
        const photos = [...(e.photos || []), result.url];
        return { ...e, photos, coverPhoto: photos[0] };
      }),
    );

    return { url: result.url };
  } catch (e) {
  }
}

  async function removeEventPhoto(eventId, idx) {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== eventId) return e;
        const uri = (e.photos || [])[idx];
        if (uri?.includes('/event-photos/')) {
          const storagePath = uri.split('/event-photos/')[1];
          if (storagePath) eventsService.removePhoto(storagePath);
        }
        const photos = (e.photos || []).filter((_, i) => i !== idx);
        return { ...e, photos, coverPhoto: photos[0] || null };
      }),
    );
  }

  // ── Cupons ────────────────────────────────────────────────────────────────
  async function redeemCoupon(couponId) {
    const perms = createPermissionStrategy(currentUser?.role);
    if (!perms.canRedeemCoupons()) {
      return { success: false, error: 'Donos de estabelecimento não podem resgatar cupons.' };
    }
    const coupon = coupons.find((c) => c.id === couponId);
    if (!coupon) return { success: false, error: 'Cupom não encontrado.' };

    // ── Verificações locais rápidas (sem chamadas ao banco) ───────────────
    if (redeemedCoupons.includes(couponId)) {
      return { success: false, error: 'Você já resgatou este cupom.' };
    }
    if (coupon.remainingQty <= 0) {
      return { success: false, error: 'Cupons esgotados.' };
    }

    // ── Verificação de evento ao vivo ──────────────────────────────────────
    const eventForCoupon = events.find((e) => e.id === coupon.eventId);
    if (!eventForCoupon?.isLive) {
      return { success: false, error: 'O evento foi encerrado.' };
    }

    // ── Verificação geo com coords em cache ───────────────────────────────
    const alreadyCheckedIn = Boolean(coupon.eventId) && (
      checkedInEventIds.includes(coupon.eventId) ||
      crowdManagementService.isCheckedIn(coupon.eventId)
    );
    if (!alreadyCheckedIn) {
      const event = events.find((e) => e.id === coupon.eventId);
      if (event?.lat != null && event?.lng != null) {
        if (!userCoords) {
          return { success: false, error: 'Ative o GPS e tente novamente.' };
        }
        const fence = geoService.checkGeofence(
          userCoords,
          { lat: event.lat, lng: event.lng },
          currentUser?.role ?? 'user',
        );
        if (!fence.isInside) {
          return { success: false, error: fence.message };
        }
      }
    }

    // ── Validação no banco (limite de taxa + estoque) ─────────────────────
    if (currentUser?.id) {
      const validation = await couponRedemptionService.validate(couponId, currentUser.id);
      if (!validation.allowed) {
        return { success: false, error: validation.reason };
      }
    }

    // ── Persistir resgate ──────────────────────────────────────────────────
    let qrCode = '';
    if (currentUser?.id) {
      const result = await couponRedemptionService.redeem(couponId, currentUser.id);
      if (!result.success) return { success: false, error: result.error };
      qrCode = result.qrCode;

      setRedeemedCoupons((prev) => [...prev, couponId]);
      setRedemptionMap((prev) => ({
        ...prev,
        [couponId]: { couponId, qrCode, redeemedAt: result.redeemedAt },
      }));
    }

    // ── Atualizar estoque de cupons local ──────────────────────────────────
    setCoupons((prev) =>
      prev.map((c) =>
        c.id === couponId
          ? { ...c, remainingQty: Math.max(0, c.remainingQty - 1), isRedeemed: true }
          : c,
      ),
    );
    setBusinessStats((prev) => ({
      ...prev,
      couponsRedeemed: (prev.couponsRedeemed || 0) + 1,
    }));

    // ── Auto check-in via resgate de cupom ────────────────────────────────
    if (coupon.eventId && !crowdManagementService.isCheckedIn(coupon.eventId)) {
      const ev = events.find((e) => e.id === coupon.eventId);
      if (ev?.isLive) {
        crowdManagementService.checkIn(coupon.eventId).then((r) => {
          if (!r.error && !r.alreadyIn) {
            setCheckedInEventIds((prev) => [...prev, coupon.eventId]);
            if (ev.endsAt) crowdManagementService.scheduleAutoCheckOut(coupon.eventId, ev.endsAt);
          }
        });
      }
    }

    return { success: true, qrCode };
  }

  async function addCoupon(newCoupon) {
    if (!currentUser?.id) return { coupon: null, error: 'Faça login para criar cupons.' };
    const result = await couponsService.create(newCoupon, currentUser.id);
    if (result.error || !result.data) {
      return { coupon: null, error: result.error ?? new Error('Erro ao salvar cupom.') };
    }
    const coupon = { ...result.data, isRedeemed: false };
    setCoupons((prev) => [coupon, ...prev]);
    setEvents((prev) =>
      prev.map((e) =>
        e.id === newCoupon.eventId
          ? { ...e, couponsCount: (e.couponsCount || 0) + 1 }
          : e,
      ),
    );
    setBusinessStats((prev) => ({
      ...prev,
      couponsTotal: (prev.couponsTotal || 0) + (newCoupon.totalQty ?? 0),
    }));
    return { coupon, error: null };
  }

  // ── Avaliações ────────────────────────────────────────────────────────────

  async function _loadEventRatings(eventId) {
    const [countsRes, voteRes] = await Promise.all([
      ratingService.fetchCounts(eventId),
      currentUser?.id
        ? ratingService.fetchUserVote(eventId, currentUser.id)
        : Promise.resolve({ category: null, error: null }),
    ]);
    const counts   = countsRes.data ?? {};
    const userVote = voteRes.category ?? null;
    const featured = ratingService.computeFeatured(counts);
    setEventRatingMap((prev) => ({
      ...prev,
      [eventId]: { counts, userVote, featured },
    }));
  }

  function subscribeToEventRatings(eventId) {
    if (subscribedRatingsRef.current.has(eventId)) return;
    subscribedRatingsRef.current.add(eventId);

    ratingService.subscribeToEvent(eventId, (eid, counts) => {
      const featured = ratingService.computeFeatured(counts);
      setEventRatingMap((prev) => ({
        ...prev,
        [eid]: { ...(prev[eid] ?? {}), counts, featured },
      }));
    });
    _loadEventRatings(eventId);
  }

  function canRedeemCoupon(couponId) {
    const coupon = coupons.find((c) => c.id === couponId);
    if (!coupon) return { canRedeem: false, message: 'Cupom não encontrado.' };
    if (redeemedCoupons.includes(couponId))
      return { canRedeem: false, message: 'Você já resgatou este cupom.' };
    if (coupon.remainingQty <= 0)
      return { canRedeem: false, message: 'Cupons esgotados.' };

    // ── Verificação de evento ao vivo ──────────────────────────────────────
    const eventForCoupon = events.find((e) => e.id === coupon.eventId);
    if (!eventForCoupon?.isLive) {
      return { canRedeem: false, message: 'O evento foi encerrado.' };
    }

    if (coupon.eventId && (checkedInEventIds.includes(coupon.eventId) || crowdManagementService.isCheckedIn(coupon.eventId)))
      return { canRedeem: true, message: 'Você está no local. Pode resgatar!' };

    const event = events.find((e) => e.id === coupon.eventId);
    if (event?.lat != null && event?.lng != null) {
      if (!userCoords)
        return { canRedeem: false, message: 'Ative o GPS para verificar sua proximidade.' };
      const fence = geoService.checkGeofence(
        userCoords,
        { lat: event.lat, lng: event.lng },
        'user',
      );
      return { canRedeem: fence.isInside, message: fence.message };
    }
    return { canRedeem: true, message: 'Você está no local. Pode resgatar!' };
  }

  function canVoteOnEvent(eventId) {
    if (!currentUser?.id) return false;
    if (crowdManagementService.isCheckedIn(eventId)) return true;
    if (currentUser.role === 'business') return false;
    const event = events.find((e) => e.id === eventId);
    if (!event) return false;
    if (event.lat != null && event.lng != null) {
      if (!userCoords) return false;
      return geoService.checkGeofence(
        userCoords,
        { lat: event.lat, lng: event.lng },
        'user',
      ).isInside;
    }
    return true;
  }

  async function submitRating(eventId, category) {
    if (!currentUser?.id) return { error: 'Faça login para avaliar.' };

    // ── Verificação de papel ───────────────────────────────────────────────
    if (currentUser.role === 'business') {
      return { error: 'Donos de estabelecimento não podem avaliar eventos.' };
    }

    // ── Verificação de presença ────────────────────────────────────────────
    const alreadyCheckedIn = crowdManagementService.isCheckedIn(eventId);
    if (!alreadyCheckedIn) {
      const event = events.find((e) => e.id === eventId);
      if (event?.lat != null && event?.lng != null) {
        if (!userCoords) {
          return { error: 'Ative o GPS para enviar uma avaliação.' };
        }
        const fence = geoService.checkGeofence(
          userCoords,
          { lat: event.lat, lng: event.lng },
          'user',
        );
        if (!fence.isInside) {
          return { error: `Você precisa estar no local para avaliar. ${fence.message}` };
        }
      }
    }

    // ── Atualização otimista ───────────────────────────────────────────────
    setEventRatingMap((prev) => {
      const current  = prev[eventId] ?? { counts: {}, userVote: null };
      const oldVote  = current.userVote;
      const newCounts = { ...current.counts };

      if (oldVote && oldVote !== category) {
        newCounts[oldVote] = Math.max(0, (newCounts[oldVote] ?? 0) - 1);
      }
      if (oldVote !== category) {
        newCounts[category] = (newCounts[category] ?? 0) + 1;
      }
      const featured = ratingService.computeFeatured(newCounts);
      return { ...prev, [eventId]: { counts: newCounts, userVote: category, featured } };
    });

    // ── Persistir ──────────────────────────────────────────────────────────
    const result = await ratingService.submitVote(eventId, currentUser.id, category);
    if (result.error) {
      _loadEventRatings(eventId);
    }
    return result;
  }

  // ── Feed ──────────────────────────────────────────────────────────────────
  async function addFeedPost(post) {
    const perms = createPermissionStrategy(currentUser?.role);
    if (!perms.canPostToFeed()) return;
    let newPost = {
      ...post,
      id: `p${Date.now()}`,
      time: "agora",
      timeAgo: 0,
      likes: 0,
      dislikes: 0,
      replies: 0,
      verified: nearbyEventIds.includes(post.eventId),
      photos: post.photos || [],
      expiresAt: post.expiresAt ? new Date(post.expiresAt) : null,
      user: currentUser
        ? {
            name: currentUser.name.split(" ")[0],
            initials: currentUser.avatar,
            color: "#E83B5C",
            textColor: "#fff",
          }
        : { name: "Você", initials: "VC", color: "#E83B5C", textColor: "#fff" },
    };
    if (currentUser?.id) {
      const result = await feedService.create(post, currentUser);
      if (result.data) newPost = { ...result.data, photos: post.photos || [] };
    }
    setFeedPosts((prev) => [newPost, ...prev]);
  }

  async function likePost(postId) {
    setFeedPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p)),
    );
    const { error } = await feedService.like(postId);
    if (error) {
      setFeedPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes: p.likes - 1 } : p)),
      );
    }
  }

  async function dislikePost(postId) {
    setFeedPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, dislikes: (p.dislikes ?? 0) + 1 } : p)),
    );
    const { error } = await feedService.dislike(postId);
    if (error) {
      setFeedPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, dislikes: (p.dislikes ?? 0) - 1 } : p)),
      );
    }
  }

  const value = {
    currentUser,
    authError,
    setAuthError,
    authLoading,
    dataLoading,
    login,
    register,
    logout,
    updateProfile,
    updatePassword,
    events,
    feedPosts,
    coupons,
    businessStats,
    userCoords,
    nearbyEventIds,
    geoError,
    redeemedCoupons,
    selectedEventFilter,
    setSelectedEventFilter,
    redeemCoupon,
    addCoupon,
    addEvent,
    updateEventFields,
    sendAnnouncement,
    startEvent,
    closeEvent,
    checkIn,
    checkOut,
    checkedInEventIds,
    isCheckedIn: (eventId) => crowdManagementService.isCheckedIn(eventId),
    // ── Avaliações ─────────────────────────────────────────────────────────
    eventRatingMap,
    getEventRatings: (eventId) =>
      eventRatingMap[eventId] ?? { counts: {}, userVote: null, featured: null },
    subscribeToEventRatings,
    submitRating,
    canVoteOnEvent,
    addFeedPost,
    likePost,
    dislikePost,
    addEventPhoto,
    removeEventPhoto,
    getCouponsForEvent: (eventId) =>
      coupons.filter((c) => c.eventId === eventId),
    getNearbyCoupons: () =>
      coupons.filter((c) => nearbyEventIds.includes(c.eventId)),
    isCouponRedeemed: (couponId) => redeemedCoupons.includes(couponId),
    canRedeemCoupon,
    redemptionMap,
    getRedemptionDetails: (couponId) => redemptionMap[couponId] ?? null,
    refreshData: () => currentUser && loadData(currentUser),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp precisa estar dentro do AppProvider");
  return ctx;
}
