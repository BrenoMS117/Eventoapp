import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { authService } from "../services/authService";
import { eventsService } from "../services/eventsService";
import { couponsService } from "../services/couponsService";
import { feedService } from "../services/feedService";
import { geoService } from "../services/geo/GeoService";
import { createPermissionStrategy } from "../permissions/PermissionStrategy";
import { crowdManagementService } from "../services/crowd/CrowdManagementService";
import { ratingService } from "../services/ratings/RatingService";

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
  const [checkedInEventIds, setCheckedInEventIds] = useState([]);
  /** Record<eventId, { counts, userVote, featured }> — lazy-loaded per event */
  const [eventRatingMap, setEventRatingMap] = useState({});
  /** Prevents double-subscription across concurrent calls */
  const subscribedRatingsRef = useRef(new Set());
  const geoWatchRef = useRef(null);
  const [selectedEventFilter, setSelectedEventFilter] = useState("Todos");

  // ── Crowd management bootstrap ────────────────────────────────────────────
  // Set the update callback once at mount (setEvents is stable, so safe here).
  useEffect(() => {
    crowdManagementService.setUpdateCallback((eventId, patch) => {
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, ...patch } : e)),
      );
    });
    return () => crowdManagementService.reset();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto check-out: geo exit (5 km discovery radius acts as exit threshold) ─
  useEffect(() => {
    if (!currentUser) return;
    // Only auto-evict events that have geographic coordinates.
    // Events without coords are never included in nearbyEventIds (filterNearbyEvents
    // skips them), so getStaleCheckIns would always flag them as stale — causing an
    // immediate auto-checkout right after check-in. Filter those out here.
    const stale = crowdManagementService.getStaleCheckIns(nearbyEventIds).filter((id) => {
      const ev = events.find((e) => e.id === id);
      return ev?.lat != null && ev?.lng != null;
    });
    if (stale.length === 0) return;
    stale.forEach((id) => crowdManagementService.checkOut(id));
    setCheckedInEventIds((prev) => prev.filter((id) => !stale.includes(id)));
  }, [nearbyEventIds, currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

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
      console.log("Session error:", e);
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
        // Recalculate nearby IDs with the freshly loaded events if we already
        // have a position (e.g. user refreshes while the app is already running).
        setUserCoords(prev => {
          if (prev) _updateNearbyIds(prev, eventsRes.data, user?.role);
          return prev;
        });
      }
      if (user?.role === 'business') {
        const myEvent = eventsRes.data?.find(e => e.ownerId === user.id);
        if (myEvent) {
          setBusinessStats(prev => ({
            ...prev,
            activeEventId: myEvent.id,
            activeEventName: myEvent.name,
            venueName: user.venueName || prev.venueName,
          }));
        }
      }
      if (couponsRes.data) setCoupons(couponsRes.data);
      if (feedRes.data) setFeedPosts(feedRes.data);
      if (user) {
        const redeemed = await couponsService.getUserRedemptions(user.id);
        setRedeemedCoupons(redeemed);
      }
    } catch (e) {
      console.log("Load data error:", e);
    } finally {
      setDataLoading(false);
    }
  }

  // ── Geolocation ───────────────────────────────────────────────────────

  function _updateNearbyIds(coords, eventsArr, role) {
    const { nearbyIds } = geoService.filterNearbyEvents(coords, eventsArr, role ?? 'user');
    setNearbyEventIds(nearbyIds);
  }

  function startGeoWatch(role) {
    // Stop any existing watcher before starting a new one.
    if (geoWatchRef.current) geoService.clearWatch(geoWatchRef.current);

    geoWatchRef.current = geoService.watchPosition((result) => {
      if (!result.coords) return;
      setUserCoords(result.coords);
      // Access the latest events snapshot via the setter callback to avoid
      // stale closure — setEvents is stable, but we need the current value.
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

  // ── AUTH ─────────────────────────────────────────────────────
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

  async function logout() {
    crowdManagementService.reset();
    ratingService.reset();
    subscribedRatingsRef.current.clear();
    await authService.signOut();
    stopGeoWatch();
    setCurrentUser(null);
    setAuthError("");
    setEvents([]);
    setCoupons([]);
    setFeedPosts([]);
    setRedeemedCoupons([]);
    setCheckedInEventIds([]);
    setEventRatingMap({});
  }

  // ── EVENTS ───────────────────────────────────────────────────
  /**
   * Atualiza apenas os campos permitidos para o papel do usuário.
   * A lista de campos permitidos é governada por PermissionRules.
   */
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
    if (!perms.canEditEventField('status')) {
      return { error: 'Sem permissão para encerrar eventos.' };
    }
    const result = await eventsService.closeEvent(eventId);
    if (!result.error) {
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, isLive: false } : e)),
      );
    }
    return result;
  }

  // ── CROWD CHECK-IN / CHECK-OUT ────────────────────────────────────────────

  /**
   * Check the current user into a live event.
   *
   * Rules:
   *  • Event must be live.
   *  • Proximity gate:
   *      – event with coords + GPS available → precise geofence (≤ 150 m)
   *      – event with coords + no GPS        → blocked
   *      – event without coords              → nearbyEventIds fallback (≤ 5 km);
   *                                            if also absent there, allow anyway
   *                                            (can't verify — test/legacy events)
   *  • Single-event rule: auto check-out from any other event before proceeding.
   */
  async function checkIn(eventId) {
    if (crowdManagementService.isCheckedIn(eventId)) {
      return { error: null, alreadyIn: true };
    }

    const event = events.find((e) => e.id === eventId);
    if (!event?.isLive) {
      return { error: 'O evento precisa estar ao vivo para fazer check-in.' };
    }

    // ── Proximity check ──────────────────────────────────────────────────
    if (event.lat != null && event.lng != null) {
      // Event has precise coordinates: enforce geofence.
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
    // Events without coordinates: nearbyEventIds is a best-effort fallback
    // (filterNearbyEvents skips events with null coords, so this is advisory only).
    // We allow check-in even if the event isn't listed — can't geo-verify.
    // ─────────────────────────────────────────────────────────────────────

    // ── Single-event rule: auto checkout from every other checked-in event ─
    const otherIds = crowdManagementService.getCheckedInEventIds().filter((id) => id !== eventId);
    if (otherIds.length > 0) {
      await Promise.all(otherIds.map((id) => crowdManagementService.checkOut(id)));
      setCheckedInEventIds((prev) => prev.filter((id) => !otherIds.includes(id)));
    }
    // ─────────────────────────────────────────────────────────────────────

    const result = await crowdManagementService.checkIn(eventId);
    if (!result.error && !result.alreadyIn) {
      setCheckedInEventIds((prev) => [...prev, eventId]);
      if (event.endsAt) {
        crowdManagementService.scheduleAutoCheckOut(eventId, event.endsAt);
      }
    }
    return result;
  }

  /**
   * Manually check the current user out from an event.
   */
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
  console.log('2.5 AQUI');
  
  try {
    if (!_supabaseReady || !currentUser?.id) {
      console.log('Supabase não pronto ou sem usuário');
      return;
    }

    const result = await eventsService.uploadPhoto(eventId, uri);
    console.log('5. uploadPhoto result:', JSON.stringify(result));

    if (result.error || !result.url) {
      console.log('6. ERRO no upload:', JSON.stringify(result.error));
      return { error: result.error };
    }

    const saveResult = await eventsService.savePhotoUrl(eventId, result.url);
    console.log('8. savePhotoUrl result:', JSON.stringify(saveResult));

    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== eventId) return e;
        const photos = [...(e.photos || []), result.url];
        return { ...e, photos, coverPhoto: photos[0] };
      }),
    );

    console.log('9. estado local atualizado');
    return { url: result.url };
  } catch (e) {
    console.log('ERRO CATCH:', e.message);
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

  // ── COUPONS ──────────────────────────────────────────────────
  async function redeemCoupon(couponId) {
    const perms = createPermissionStrategy(currentUser?.role);
    if (!perms.canRedeemCoupons()) {
      return { success: false, error: 'Donos de estabelecimento não podem resgatar cupons.' };
    }
    const coupon = coupons.find((c) => c.id === couponId);
    if (!coupon) return { success: false, error: "Cupom não encontrado." };
    if (redeemedCoupons.includes(couponId))
      return { success: false, error: "Cupom já resgatado." };
    if (coupon.remainingQty <= 0)
      return { success: false, error: "Cupons esgotados." };

    // ── Geofence check (uses cached userCoords — no GPS round-trip) ────────
    const event = events.find((e) => e.id === coupon.eventId);
    if (event?.lat != null && event?.lng != null) {
      if (!userCoords) {
        return { success: false, error: "Ative o GPS e tente novamente." };
      }
      const fence = geoService.checkGeofence(
        userCoords,
        { lat: event.lat, lng: event.lng },
        currentUser?.role ?? 'user',
      );
      if (!fence.isInside) {
        return { success: false, error: fence.message };
      }
    } else if (!nearbyEventIds.includes(coupon.eventId)) {
      return { success: false, error: `Chegue até ${coupon.venue} para resgatar este cupom.` };
    }
    // ────────────────────────────────────────────────────────────────────

    if (currentUser?.id) {
      const result = await couponsService.redeem(couponId, currentUser.id);
      if (!result.success) return result;
    }
    setRedeemedCoupons((prev) => [...prev, couponId]);
    setCoupons((prev) =>
      prev.map((c) =>
        c.id === couponId
          ? { ...c, remainingQty: c.remainingQty - 1, isRedeemed: true }
          : c,
      ),
    );
    setBusinessStats((prev) => ({
      ...prev,
      couponsRedeemed: (prev.couponsRedeemed || 0) + 1,
    }));
    // Auto check-in when redeeming a coupon at the event location
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
    return { success: true };
  }

  async function addCoupon(newCoupon) {
    let coupon = {
      ...newCoupon,
      id: `c${Date.now()}`,
      isRedeemed: false,
      isNearby: true,
      remainingQty: newCoupon.totalQty,
    };
    if (currentUser?.id) {
      const result = await couponsService.create(newCoupon, currentUser.id);
      if (result.data) coupon = { ...result.data, isRedeemed: false };
    }
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
      couponsTotal: (prev.couponsTotal || 0) + newCoupon.totalQty,
    }));
    return coupon;
  }

  // ── RATINGS ──────────────────────────────────────────────────────────────

  /** Load initial counts + user's vote for an event, then update state. */
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

  /**
   * Idempotent: subscribes to Realtime for a specific event's ratings,
   * then fetches the current state. Safe to call from multiple screens.
   */
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

  /**
   * Returns true when the current user is allowed to vote on an event.
   * Uses already-cached userCoords — no GPS call, instant result.
   *
   * Priority:
   *   1. user is checked in at this event → true  (presence already proven)
   *   2. role === 'business'              → false  (owners read-only)
   *   3. event has coords + GPS cached    → precise geofence (≤ 150 m)
   *   4. event has coords + no GPS        → false  (can't verify)
   *   5. event has NO coords              → true   (can't verify either way, allow)
   */
  function canVoteOnEvent(eventId) {
    if (!currentUser?.id) return false;
    // Check-in proves physical presence — bypass all geo checks.
    if (crowdManagementService.isCheckedIn(eventId)) return true;
    if (currentUser.role === 'business') return false;
    const event = events.find((e) => e.id === eventId);
    if (!event) return false;
    if (event.lat != null && event.lng != null) {
      // Coordinates available: require GPS and geofence.
      if (!userCoords) return false;
      return geoService.checkGeofence(
        userCoords,
        { lat: event.lat, lng: event.lng },
        'user',
      ).isInside;
    }
    // No coordinates on this event: cannot geo-verify, so allow.
    return true;
  }

  /**
   * Submit or update a vote.
   *
   * Access control:
   *   • role === 'business'  → blocked (owners cannot vote)
   *   • Checked-in users     → presence already proven, skip geo check
   *   • event with coords    → geofence against cached userCoords (no GPS call)
   *   • event without coords → allowed (can't verify location)
   *
   * On success: optimistic update to eventRatingMap; Realtime confirms
   * and also updates events.rating / events.reviewCount via DB trigger.
   */
  async function submitRating(eventId, category) {
    if (!currentUser?.id) return { error: 'Faça login para avaliar.' };

    // ── Role check ─────────────────────────────────────────────────────
    if (currentUser.role === 'business') {
      return { error: 'Donos de estabelecimento não podem avaliar eventos.' };
    }

    // ── Presence check ─────────────────────────────────────────────────
    // Check-in is the strongest proof of presence — skip geo entirely.
    const alreadyCheckedIn = crowdManagementService.isCheckedIn(eventId);
    if (!alreadyCheckedIn) {
      const event = events.find((e) => e.id === eventId);
      if (event?.lat != null && event?.lng != null) {
        // Precise geofence using cached coords (zero latency).
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
      // No coordinates on the event: can't verify, allow voting.
    }
    // ────────────────────────────────────────────────────────────────────

    // ── Optimistic update ──────────────────────────────────────────────
    setEventRatingMap((prev) => {
      const current  = prev[eventId] ?? { counts: {}, userVote: null };
      const oldVote  = current.userVote;
      const newCounts = { ...current.counts };

      // Remove old vote if changing
      if (oldVote && oldVote !== category) {
        newCounts[oldVote] = Math.max(0, (newCounts[oldVote] ?? 0) - 1);
      }
      // Add new vote (only if not already selected)
      if (oldVote !== category) {
        newCounts[category] = (newCounts[category] ?? 0) + 1;
      }
      const featured = ratingService.computeFeatured(newCounts);
      return { ...prev, [eventId]: { counts: newCounts, userVote: category, featured } };
    });

    // ── Persist ────────────────────────────────────────────────────────
    const result = await ratingService.submitVote(eventId, currentUser.id, category);
    if (result.error) {
      // Rollback: re-fetch authoritative state
      _loadEventRatings(eventId);
    }
    return result;
  }

  // ── FEED ─────────────────────────────────────────────────────
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
    startEvent,
    closeEvent,
    checkIn,
    checkOut,
    checkedInEventIds,
    isCheckedIn: (eventId) => crowdManagementService.isCheckedIn(eventId),
    // ── Ratings ─────────────────────────────────────────────────────────────
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
    refreshData: () => currentUser && loadData(currentUser),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp precisa estar dentro do AppProvider");
  return ctx;
}
