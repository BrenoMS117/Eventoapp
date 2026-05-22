import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────────────────────────────────────
// Notification types per role — must match the `type` field in each strategy
// ─────────────────────────────────────────────────────────────────────────────
export const PREFS_META = {
  user: [
    { key: 'proximity',    label: 'Eventos próximos',           icon: 'location-outline',  color: '#E83B5C' },
    { key: 'ending',       label: 'Avisos de encerramento',     icon: 'time-outline',      color: '#F59E0B' },
    { key: 'social',       label: 'Likes e dislikes',           icon: 'heart-outline',     color: '#E83B5C' },
    { key: 'coupon',       label: 'Cupons disponíveis',         icon: 'pricetag-outline',  color: '#10B981' },
    { key: 'announcement', label: 'Avisos do estabelecimento',  icon: 'megaphone-outline', color: '#F59E0B' },
  ],
  business: [
    { key: 'stock',   label: 'Estoque de cupons',    icon: 'warning-outline',       color: '#F59E0B' },
    { key: 'crowd',   label: 'Lotação do evento',    icon: 'people-outline',        color: '#EF4444' },
    { key: 'surge',   label: 'Pico de lotação',      icon: 'trending-up-outline',   color: '#EF4444' },
    { key: 'premium', label: 'Alertas de plano',     icon: 'star-outline',          color: '#7B2FBE' },
  ],
};

export const DEFAULT_PREFS = {
  user:     { proximity: true, ending: true, social: true, coupon: true, announcement: true },
  business: { stock: true, crowd: true, surge: true, premium: true },
};

const storageKey = (userId) => `@livevibe:notif_prefs:${userId}`;

// ─── In-memory cache + pub/sub ────────────────────────────────────────────────
let _cache  = {};
const _listeners = new Set();

function _emit() {
  _listeners.forEach((fn) => fn({ ..._cache }));
}

// ─────────────────────────────────────────────────────────────────────────────
// NotificationPreferencesService — Repository pattern, singleton object
// ─────────────────────────────────────────────────────────────────────────────
export const notificationPreferencesService = {
  /**
   * Load preferences from AsyncStorage, merging with defaults.
   * Populates the in-memory cache and notifies subscribers.
   */
  async load(userId, role) {
    try {
      const raw     = await AsyncStorage.getItem(storageKey(userId));
      const stored  = raw ? JSON.parse(raw) : {};
      _cache = { ...(DEFAULT_PREFS[role] ?? {}), ...stored };
    } catch {
      _cache = { ...(DEFAULT_PREFS[role] ?? {}) };
    }
    _emit();
    return { ..._cache };
  },

  /**
   * Persist a full preferences snapshot and update the cache.
   */
  async save(userId, prefs) {
    _cache = { ...prefs };
    _emit();
    try {
      await AsyncStorage.setItem(storageKey(userId), JSON.stringify(prefs));
    } catch { /* silent — UI already updated */ }
  },

  /** Synchronous cache read — safe before first `load()` resolves. */
  getCache() {
    return { ..._cache };
  },

  /**
   * Subscribe to cache changes.
   * Calls `fn` immediately with the current snapshot.
   * Returns an unsubscribe function.
   */
  subscribe(fn) {
    _listeners.add(fn);
    fn({ ..._cache });
    return () => _listeners.delete(fn);
  },

  /** Returns true when the given notification type is enabled (defaults to true). */
  isEnabled(type) {
    return _cache[type] !== false;
  },

  /**
   * Limpa o cache de preferências e notifica os assinantes.
   * Chamar no logout para evitar que as prefs do usuário anterior
   * fiquem ativas até o próximo load().
   */
  clear() {
    _cache = {};
    _emit();
  },
};
