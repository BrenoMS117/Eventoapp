import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { notificationService } from '../services/notifications/NotificationService';
import { notificationPreferencesService } from '../services/notifications/NotificationPreferencesService';

/**
 * useNotifications
 *
 * Two responsibilities:
 *   1. Subscribes the component to the notification queue so it re-renders
 *      whenever a new notification arrives or is read.
 *   2. Re-evaluates all strategies whenever the app context changes
 *      (new coords, new events, new coupons, etc.).
 *
 * Call this hook once in a component that is always mounted while the user is
 * logged in (e.g. a headless <NotificationEngine /> inside AppNavigator).
 */
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

  // Keep prefs in sync so filtering updates without a remount
  useEffect(() => {
    return notificationPreferencesService.subscribe(setPrefs);
  }, []);

  // Subscribe once — receives queue updates pushed by NotificationService.
  useEffect(() => {
    return notificationService.subscribe(setNotifications);
  }, []);

  // Stable context snapshot — evaluated dependencies match strategy inputs.
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

  // Drive evaluations whenever context changes.
  useEffect(() => {
    if (currentUser) notificationService.evaluate(ctx);
  }, [ctx, currentUser]);

  // Filter by user preferences — types absent from prefs object are kept (opt-out model)
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
