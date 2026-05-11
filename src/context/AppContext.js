import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { eventsService } from '../services/eventsService';
import { couponsService } from '../services/couponsService';
import { feedService } from '../services/feedService';
import { EVENTS, FEED_POSTS, COUPONS, BUSINESS_STATS } from '../data/mockData';

const AppContext = createContext(null);

let SUPABASE_CONFIGURED = false;
try {
  const url = require('../lib/supabase').supabase.supabaseUrl;
  SUPABASE_CONFIGURED = url && !url.includes('SEU_PROJETO');
} catch (e) {}

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [events, setEvents] = useState(EVENTS);
  const [feedPosts, setFeedPosts] = useState(FEED_POSTS);
  const [coupons, setCoupons] = useState(COUPONS);
  const [businessStats, setBusinessStats] = useState(BUSINESS_STATS);
  const [dataLoading, setDataLoading] = useState(false);
  const [nearbyEventIds] = useState(['1', '5']);
  const [redeemedCoupons, setRedeemedCoupons] = useState(['c3']);
  const [selectedEventFilter, setSelectedEventFilter] = useState('Todos');

  useEffect(() => {
    initSession();
    if (!SUPABASE_CONFIGURED) {
      const interval = setInterval(() => {
        setEvents(prev => prev.map(event => {
          if (!event.isLive) return event;
          const delta = Math.floor(Math.random() * 6) - 3;
          return { ...event, crowdLevel: Math.max(5, Math.min(100, event.crowdLevel + delta)) };
        }));
      }, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  async function initSession() {
    setAuthLoading(true);
    try {
      if (SUPABASE_CONFIGURED) {
        const user = await authService.getSession();
        if (user) { setCurrentUser(user); await loadData(user); }
      }
    } catch (e) { console.log('Session error:', e); }
    finally { setAuthLoading(false); }
  }

  async function loadData(user) {
    setDataLoading(true);
    try {
      const [eventsRes, couponsRes, feedRes] = await Promise.all([
        eventsService.getAll(), couponsService.getAll(), feedService.getAll(),
      ]);
      if (eventsRes.data) setEvents(eventsRes.data);
      if (couponsRes.data) setCoupons(couponsRes.data);
      if (feedRes.data) setFeedPosts(feedRes.data);
      if (user) {
        const redeemed = await couponsService.getUserRedemptions(user.id);
        setRedeemedCoupons(redeemed);
      }
    } catch (e) { console.log('Load data error:', e); }
    finally { setDataLoading(false); }
  }

  async function login(email, password) {
    setAuthError('');
    setAuthLoading(true);
    if (!SUPABASE_CONFIGURED) {
      const MOCK = [
        { id: 'u1', name: 'João Silva', email: 'joao@email.com', password: '123456', role: 'user', avatar: 'JS' },
        { id: 'b1', name: 'Beco do Batman Bar', email: 'beco@email.com', password: '123456', role: 'business', avatar: 'BB', venueName: 'Beco do Batman Bar', venueId: 'v1' },
      ];
      const user = MOCK.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      setAuthLoading(false);
      if (!user) { setAuthError('E-mail ou senha incorretos.'); return false; }
      setCurrentUser(user); return true;
    }
    const { user, error } = await authService.signIn(email, password);
    setAuthLoading(false);
    if (error) { setAuthError(error); return false; }
    setCurrentUser(user); await loadData(user); return true;
  }

  async function register({ name, email, password, role, venueName }) {
    setAuthError('');
    setAuthLoading(true);
    if (!SUPABASE_CONFIGURED) {
      const avatar = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
      setCurrentUser({ id: `u${Date.now()}`, name, email, role, avatar, ...(role === 'business' ? { venueName, venueId: `v${Date.now()}` } : {}) });
      setAuthLoading(false); return true;
    }
    const { user, error } = await authService.signUp({ email, password, name, role, venueName });
    setAuthLoading(false);
    if (error) { setAuthError(error); return false; }
    setCurrentUser(user); return true;
  }

  async function logout() {
    if (SUPABASE_CONFIGURED) await authService.signOut();
    setCurrentUser(null); setAuthError('');
    setEvents(EVENTS); setCoupons(COUPONS); setFeedPosts(FEED_POSTS); setRedeemedCoupons(['c3']);
  }

  async function redeemCoupon(couponId) {
    const coupon = coupons.find(c => c.id === couponId);
    if (!coupon) return { success: false, error: 'Cupom não encontrado.' };
    if (redeemedCoupons.includes(couponId)) return { success: false, error: 'Cupom já resgatado.' };
    if (coupon.remainingQty <= 0) return { success: false, error: 'Cupons esgotados.' };
    if (SUPABASE_CONFIGURED && currentUser?.id) {
      const result = await couponsService.redeem(couponId, currentUser.id);
      if (!result.success) return result;
    }
    setRedeemedCoupons(prev => [...prev, couponId]);
    setCoupons(prev => prev.map(c => c.id === couponId ? { ...c, remainingQty: c.remainingQty - 1, isRedeemed: true } : c));
    setBusinessStats(prev => ({ ...prev, couponsRedeemed: (prev.couponsRedeemed || 0) + 1 }));
    return { success: true };
  }

  async function addCoupon(newCoupon) {
    let coupon = { ...newCoupon, id: `c${Date.now()}`, isRedeemed: false, isNearby: true, remainingQty: newCoupon.totalQty };
    if (SUPABASE_CONFIGURED && currentUser?.id) {
      const result = await couponsService.create(newCoupon, currentUser.id);
      if (result.data) coupon = { ...result.data, isRedeemed: false };
    }
    setCoupons(prev => [coupon, ...prev]);
    setEvents(prev => prev.map(e => e.id === newCoupon.eventId ? { ...e, couponsCount: (e.couponsCount || 0) + 1 } : e));
    setBusinessStats(prev => ({ ...prev, couponsTotal: (prev.couponsTotal || 0) + newCoupon.totalQty }));
    return coupon;
  }

  async function addEvent(newEvent) {
    let event = { ...newEvent, id: `e${Date.now()}`, isLive: false, checkedInCount: 0, reviewCount: 0, rating: 0, couponsCount: 0, crowdLevel: 0, crowdLabel: 'Aguardando', queueMinutes: 0 };
    if (SUPABASE_CONFIGURED && currentUser?.id) {
      const result = await eventsService.create(newEvent, currentUser.id);
      if (result.data) event = result.data;
    }
    setEvents(prev => [event, ...prev]);
    return event;
  }

  async function addFeedPost(post) {
    let newPost = { ...post, id: `p${Date.now()}`, time: 'agora mesmo', timeAgo: 0, likes: 0, replies: 0, verified: nearbyEventIds.includes(post.eventId), user: currentUser ? { name: currentUser.name.split(' ')[0], initials: currentUser.avatar, color: '#9FE1CB', textColor: '#04342C' } : { name: 'Você', initials: 'VC', color: '#9FE1CB', textColor: '#04342C' } };
    if (SUPABASE_CONFIGURED && currentUser?.id) {
      const result = await feedService.create(post, currentUser);
      if (result.data) newPost = result.data;
    }
    setFeedPosts(prev => [newPost, ...prev]);
  }

  function likePost(postId) {
    setFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
    if (SUPABASE_CONFIGURED) feedService.like(postId);
  }

  const value = {
    currentUser, authError, setAuthError, authLoading, dataLoading,
    isSupabaseConfigured: SUPABASE_CONFIGURED,
    login, register, logout,
    events, feedPosts, coupons, businessStats,
    nearbyEventIds, redeemedCoupons, selectedEventFilter, setSelectedEventFilter,
    redeemCoupon, addCoupon, addEvent, addFeedPost, likePost,
    getCouponsForEvent: (eventId) => coupons.filter(c => c.eventId === eventId),
    getNearbyCoupons: () => coupons.filter(c => nearbyEventIds.includes(c.eventId)),
    isCouponRedeemed: (couponId) => redeemedCoupons.includes(couponId),
    refreshData: () => currentUser && loadData(currentUser),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
