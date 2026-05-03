import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { EVENTS, FEED_POSTS, COUPONS, BUSINESS_STATS } from '../data/mockData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [events, setEvents] = useState(EVENTS);
  const [feedPosts, setFeedPosts] = useState(FEED_POSTS);
  const [coupons, setCoupons] = useState(COUPONS);
  const [businessStats, setBusinessStats] = useState(BUSINESS_STATS);
  const [nearbyEventIds] = useState(['1', '5']);
  const [redeemedCoupons, setRedeemedCoupons] = useState(['c3']);
  const [selectedEventFilter, setSelectedEventFilter] = useState('Todos');

  useEffect(() => {
    // Simulate crowd level changes every 30s
    const interval = setInterval(() => {
      setEvents(prev => prev.map(event => {
        if (!event.isLive) return event;
        const delta = Math.floor(Math.random() * 6) - 3;
        const newLevel = Math.max(5, Math.min(100, event.crowdLevel + delta));
        return { ...event, crowdLevel: newLevel };
      }));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  function redeemCoupon(couponId) {
    const coupon = coupons.find(c => c.id === couponId);
    if (!coupon) return { success: false, error: 'Cupom não encontrado' };
    if (redeemedCoupons.includes(couponId)) return { success: false, error: 'Cupom já resgatado' };
    if (coupon.remainingQty <= 0) return { success: false, error: 'Cupons esgotados' };

    setRedeemedCoupons(prev => [...prev, couponId]);
    setCoupons(prev => prev.map(c =>
      c.id === couponId
        ? { ...c, remainingQty: c.remainingQty - 1, isRedeemed: true }
        : c
    ));
    setBusinessStats(prev => ({ ...prev, couponsRedeemed: prev.couponsRedeemed + 1 }));
    return { success: true };
  }

  function addCoupon(newCoupon) {
    const coupon = {
      ...newCoupon,
      id: `c${Date.now()}`,
      isRedeemed: false,
      isNearby: true,
      remainingQty: newCoupon.totalQty,
    };
    setCoupons(prev => [...prev, coupon]);
    setEvents(prev => prev.map(e =>
      e.id === newCoupon.eventId ? { ...e, couponsCount: e.couponsCount + 1 } : e
    ));
    setBusinessStats(prev => ({ ...prev, couponsTotal: prev.couponsTotal + newCoupon.totalQty }));
    return coupon;
  }

  function addFeedPost(post) {
    const newPost = {
      ...post,
      id: `p${Date.now()}`,
      time: 'agora mesmo',
      timeAgo: 0,
      likes: 0,
      replies: 0,
      verified: nearbyEventIds.includes(post.eventId),
      user: { name: 'Você', initials: 'VC', color: '#9FE1CB', textColor: '#04342C' },
    };
    setFeedPosts(prev => [newPost, ...prev]);
  }

  function likePost(postId) {
    setFeedPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, likes: p.likes + 1 } : p
    ));
  }

  function getCouponsForEvent(eventId) {
    return coupons.filter(c => c.eventId === eventId);
  }

  function getNearbyCoupons() {
    return coupons.filter(c => nearbyEventIds.includes(c.eventId));
  }

  function isCouponRedeemed(couponId) {
    return redeemedCoupons.includes(couponId);
  }

  const value = {
    events,
    feedPosts,
    coupons,
    businessStats,
    nearbyEventIds,
    redeemedCoupons,
    selectedEventFilter,
    setSelectedEventFilter,
    redeemCoupon,
    addCoupon,
    addFeedPost,
    likePost,
    getCouponsForEvent,
    getNearbyCoupons,
    isCouponRedeemed,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
