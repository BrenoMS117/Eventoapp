import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { authService } from "../services/authService";
import { eventsService } from "../services/eventsService";
import { couponsService } from "../services/couponsService";
import { feedService } from "../services/feedService";
import { geoService } from "../services/geo/GeoService";
import { createPermissionStrategy } from "../permissions/PermissionStrategy";

const AppContext = createContext(null);

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
  const [redeemedCoupons, setRedeemedCoupons] = useState([]);
  const geoWatchRef = useRef(null);
  const [selectedEventFilter, setSelectedEventFilter] = useState("Todos");

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
    if (!result.coords) return;
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
    await authService.signOut();
    stopGeoWatch();
    setCurrentUser(null);
    setAuthError("");
    setEvents([]);
    setCoupons([]);
    setFeedPosts([]);
    setRedeemedCoupons([]);
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

  async function addEvent(newEvent) {
    if (!currentUser?.id) return null;
    const result = await eventsService.create(newEvent, currentUser.id);
    if (!result.data) return null;
    setEvents((prev) => [result.data, ...prev]);
    return result.data;
  }

  async function addEventPhoto(eventId, uri) {
    const result = await eventsService.uploadPhoto(eventId, uri);
    const finalUri = result.url || uri;
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== eventId) return e;
        const photos = [...(e.photos || []), finalUri];
        return { ...e, photos, coverPhoto: photos[0] };
      }),
    );
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

    // ── Geofence check ──────────────────────────────────────────────────
    const event = events.find((e) => e.id === coupon.eventId);
    if (event?.lat != null && event?.lng != null) {
      // Event has coordinates: run a precise real-time geofence check.
      const posResult = await geoService.getPosition();
      if (!posResult.coords) {
        return { success: false, error: "Não foi possível verificar sua localização. Ative o GPS e tente novamente." };
      }
      const fence = geoService.checkGeofence(
        posResult.coords,
        { lat: event.lat, lng: event.lng },
        currentUser?.role ?? 'user',
      );
      if (!fence.isInside) {
        return { success: false, error: fence.message };
      }
    } else if (!nearbyEventIds.includes(coupon.eventId)) {
      // Fallback for events without coordinates: use the cached nearby list.
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
    redeemedCoupons,
    selectedEventFilter,
    setSelectedEventFilter,
    redeemCoupon,
    addCoupon,
    addEvent,
    updateEventFields,
    closeEvent,
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
