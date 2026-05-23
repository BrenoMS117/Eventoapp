import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  notificationPreferencesService,
  DEFAULT_PREFS,
} from '../services/notifications/NotificationPreferencesService';

export function useNotificationPreferences() {
  const { currentUser } = useApp();
  const role = currentUser?.role ?? 'user';

  const [prefs,   setPrefs]   = useState(() => notificationPreferencesService.getCache());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.id) return;
    setLoading(true);
    notificationPreferencesService
      .load(currentUser.id, role)
      .then(() => setLoading(false));

    return notificationPreferencesService.subscribe(setPrefs);
  }, [currentUser?.id, role]);

  async function toggle(key) {
    if (!currentUser?.id) return;
    const updated = { ...prefs, [key]: !prefs[key] };
    await notificationPreferencesService.save(currentUser.id, updated);
  }

  async function resetToDefaults() {
    if (!currentUser?.id) return;
    await notificationPreferencesService.save(currentUser.id, DEFAULT_PREFS[role] ?? {});
  }

  return { prefs, toggle, resetToDefaults, loading };
}
