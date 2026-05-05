import React, { createContext, useContext, useState, useEffect } from 'react';
import { EVENTS, FEED_POSTS, COUPONS, BUSINESS_STATS } from '../data/mockData';

const AppContext = createContext(null);

// Mock user database
const MOCK_USERS = [
  { id: 'u1', name: 'João Silva', email: 'joao@email.com', password: '123456', role: 'user', avatar: 'JS' },
  { id: 'u2', name: 'Maria Santos', email: 'maria@email.com', password: '123456', role: 'user', avatar: 'MS' },
  { id: 'b1', name: 'Beco do Batman Bar', email: 'beco@email.com', password: '123456', role: 'business', avatar: 'BB', venueName: 'Beco do Batman Bar', venueId: 'v1' },
  { id: 'b2', name: 'Club D', email: 'clubd@email.com', password: '123456', role: 'business', avatar: 'CD', venueName: 'Club D', venueId: 'v2' },
];

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authError, setAuthError] = useState('');
  const [events, setEvents] = useState(EVENTS);
  const [feedPosts, setFeedPosts] = useState(FEED_POSTS);
  const [coupons, setCoupons] = useState(COUPONS);
  const [businessStats, setBusinessStats] = useState(BUSINESS_STATS);
  const [nearbyEventIds] = useState(['1', '5']);
  const [redeemedCoupons, setRedeemedCoupons] = useState(['c3']);
  const [selectedEventFilter, setSelectedEventFilter] = useState('Todos');

  useEffect(() => {
    const interval = setInterval(() => {
      setEvents(prev => prev.map(event => {
        if (!event.isLive) return event;
        const delta = Math.floor(Math.random() * 6) - 3;
        return { ...event, crowdLevel: Math.max(5, Math.min(100, event.crowdLevel + delta)) };
      }));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // --- AUTH ---
  function login(email, password) {
    setAuthError('');
    const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) {
      setAuthError('E-mail ou senha incorretos.');
      return false;
    }
    setCurrentUser(user);
    return true;
  }

  function register({ name, email, password, role, venueName }) {
    setAuthError('');
    if (MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      setAuthError('Este e-mail já está cadastrado.');
      return false;
    }
    const newUser = {
      id: `u${Date.now()}`,
      name,
      email,
      password,
      role,
      avatar: name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
      ...(role === 'business' ? { venueName, venueId: `v${Date.now()}` } : {}),
    };
    MOCK_USERS.push(newUser);
    setCurrentUser(newUser);
    return true;
  }

  function logout() {
    setCurrentUser(null);
    setAuthError('');
  }

  // --- COUPONS ---
  function redeemCoupon(couponId) {
    const coupon = coupons.find(c => c.id === couponId);
    if (!coupon) return { success: false, error: 'Cupom não encontrado' };
    if (redeemedCoupons.includes(couponId)) return { success: false, error: 'Cupom já resgatado' };
    if (coupon.remainingQty <= 0) return { success: false, error: 'Cupons esgotados' };
    setRedeemedCoupons(prev => [...prev, couponId]);
    setCoupons(prev => prev.map(c => c.id === couponId ? { ...c, remainingQty: c.remainingQty - 1, isRedeemed: true } : c));
    setBusinessStats(prev => ({ ...prev, couponsRedeemed: prev.couponsRedeemed + 1 }));
    return { success: true };
  }

  function addCoupon(newCoupon) {
    const coupon = { ...newCoupon, id: `c${Date.now()}`, isRedeemed: false, isNearby: true, remainingQty: newCoupon.totalQty };
    setCoupons(prev => [...prev, coupon]);
    setEvents(prev => prev.map(e => e.id === newCoupon.eventId ? { ...e, couponsCount: e.couponsCount + 1 } : e));
    setBusinessStats(prev => ({ ...prev, couponsTotal: prev.couponsTotal + newCoupon.totalQty }));
    return coupon;
  }

  // --- EVENTS ---
  function addEvent(newEvent) {
    const event = {
      ...newEvent,
      id: `e${Date.now()}`,
      isLive: false,
      checkedInCount: 0,
      reviewCount: 0,
      rating: 0,
      couponsCount: 0,
      crowdLevel: 0,
      crowdLabel: 'Aguardando',
      queueMinutes: 0,
    };
    setEvents(prev => [event, ...prev]);
    return event;
  }

  // --- FEED ---
  function addFeedPost(post) {
    const newPost = {
      ...post,
      id: `p${Date.now()}`,
      time: 'agora mesmo',
      timeAgo: 0,
      likes: 0,
      replies: 0,
      verified: nearbyEventIds.includes(post.eventId),
      user: currentUser
        ? { name: currentUser.name.split(' ')[0], initials: currentUser.avatar, color: '#9FE1CB', textColor: '#04342C' }
        : { name: 'Você', initials: 'VC', color: '#9FE1CB', textColor: '#04342C' },
    };
    setFeedPosts(prev => [newPost, ...prev]);
  }

  function likePost(postId) {
    setFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
  }

  const value = {
    // Auth
    currentUser, authError, setAuthError,
    login, register, logout,
    // Data
    events, feedPosts, coupons, businessStats,
    nearbyEventIds, redeemedCoupons, selectedEventFilter, setSelectedEventFilter,
    // Actions
    redeemCoupon, addCoupon, addEvent, addFeedPost, likePost,
    getCouponsForEvent: (eventId) => coupons.filter(c => c.eventId === eventId),
    getNearbyCoupons: () => coupons.filter(c => nearbyEventIds.includes(c.eventId)),
    isCouponRedeemed: (couponId) => redeemedCoupons.includes(couponId),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}