import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { notificationService } from '../services/notifications/NotificationService';
import { notificationPreferencesService } from '../services/notifications/NotificationPreferencesService';

export function useNotifications() {
  const {
    currentUser,
    events,
    coupons,
    feedPosts,
    userCoords,
    nearbyEventIds,
    redeemedCoupons,
    geoError,
  } = useApp();

  const [notifications, setNotifications] = useState([]);
  const [prefs, setPrefs] = useState(() => notificationPreferencesService.getCache());

  useEffect(() => {
    return notificationPreferencesService.subscribe(setPrefs);
  }, []);

  useEffect(() => {
    return notificationService.subscribe(setNotifications);
  }, []);

  const ctx = useMemo(() => ({
    currentUser,
    events,
    coupons,
    feedPosts,
    userCoords,
    nearbyEventIds,
    redeemedCoupons,
    geoError: geoError ?? false,
    now: new Date(),
  }), [
    currentUser,
    events,
    coupons,
    feedPosts,
    userCoords,
    nearbyEventIds,
    redeemedCoupons,
    geoError,
  ]);

  useEffect(() => {
    if (currentUser) notificationService.evaluate(ctx);
  }, [ctx, currentUser]);

  const filtered = useMemo(
    () => notifications.filter((n) => prefs[n.type] !== false),
    [notifications, prefs],
  );

  return {
    notifications: filtered,
    unreadCount: filtered.filter(n => !n.read).length,
    markRead:    (id) => notificationService.markRead(id),
    markAllRead: ()   => notificationService.markAllRead(),
    clearAll:    ()   => notificationService.clearAll(),
  };
}
