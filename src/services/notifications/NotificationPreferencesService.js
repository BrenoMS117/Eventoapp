import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../utils/theme';

// ─── Tipos de notificação por papel ──────────────────────────────────────────
export const PREFS_META = {
  user: [
    { key: 'proximity',    label: 'Eventos próximos',           icon: 'location-outline',  color: COLORS.primary },
    { key: 'ending',       label: 'Avisos de encerramento',     icon: 'time-outline',      color: COLORS.primary },
    { key: 'social',       label: 'Likes e dislikes',           icon: 'heart-outline',     color: COLORS.primary },
    { key: 'coupon',       label: 'Cupons disponíveis',         icon: 'pricetag-outline',  color: COLORS.primary },
    { key: 'announcement', label: 'Avisos do estabelecimento',  icon: 'megaphone-outline', color: COLORS.primary },
  ],
  business: [
    { key: 'stock',   label: 'Estoque de cupons',    icon: 'warning-outline',       color: COLORS.primary },
    { key: 'crowd',   label: 'Lotação do evento',    icon: 'people-outline',        color: COLORS.primary },
    { key: 'surge',   label: 'Pico de lotação',      icon: 'trending-up-outline',   color: COLORS.primary },
    { key: 'premium', label: 'Alertas de plano',     icon: 'star-outline',          color: COLORS.primary },
  ],
};

export const DEFAULT_PREFS = {
  user:     { proximity: true, ending: true, social: true, coupon: true, announcement: true },
  business: { stock: true, crowd: true, surge: true, premium: true },
};

const storageKey = (userId) => `@livevibe:notif_prefs:${userId}`;

// ─── Cache em memória + pub/sub ───────────────────────────────────────────────
let _cache  = {};
const _listeners = new Set();

function _emit() {
  _listeners.forEach((fn) => fn({ ..._cache }));
}

// ─── Serviço de preferências de notificação ───────────────────────────────────
export const notificationPreferencesService = {
  async load(userId, role) {
    try {
      const raw    = await AsyncStorage.getItem(storageKey(userId));
      const stored = raw ? JSON.parse(raw) : {};
      _cache = { ...(DEFAULT_PREFS[role] ?? {}), ...stored };
    } catch {
      _cache = { ...(DEFAULT_PREFS[role] ?? {}) };
    }
    _emit();
    return { ..._cache };
  },

  async save(userId, prefs) {
    _cache = { ...prefs };
    _emit();
    try {
      await AsyncStorage.setItem(storageKey(userId), JSON.stringify(prefs));
    } catch { /* silencioso — UI já atualizada */ }
  },

  getCache() {
    return { ..._cache };
  },

  subscribe(fn) {
    _listeners.add(fn);
    fn({ ..._cache });
    return () => _listeners.delete(fn);
  },

  isEnabled(type) {
    return _cache[type] !== false;
  },

  clear() {
    _cache = {};
    _emit();
  },
};
