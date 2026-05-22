/**
 * NotificationsModal
 *
 * Hub de notificações com duas seções em scroll único:
 *   1. Histórico — alertas das últimas 24 h (marcar lido / limpar)
 *   2. Preferências — toggles de push por role (user | business)
 *
 * Não contém nada relacionado a perfil ou dados pessoais.
 */
import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications }            from '../hooks/useNotifications';
import { useNotificationPreferences }  from '../hooks/useNotificationPreferences';
import { PREFS_META }                  from '../services/notifications/NotificationPreferencesService';
import { useApp }                      from '../context/AppContext';
import { COLORS, RADIUS }              from '../utils/theme';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function relativeTime(date) {
  if (!date) return '';
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60)   return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  return `${Math.floor(diff / 3600)}h atrás`;
}

// ─────────────────────────────────────────────────────────────────────────────
// NotifRow — item do histórico
// ─────────────────────────────────────────────────────────────────────────────
function NotifRow({ notif, onRead }) {
  const accent = notif.color ?? COLORS.primary;
  return (
    <TouchableOpacity
      style={[s.row, notif.read && s.rowRead]}
      onPress={() => onRead(notif.id)}
      activeOpacity={0.75}
    >
      {/* Barra lateral colorida */}
      <View style={[s.rowAccent, { backgroundColor: accent }]} />

      <View style={[s.rowIcon, { backgroundColor: accent + '22' }]}>
        <Ionicons name={`${notif.icon}-outline`} size={17} color={accent} />
      </View>

      <View style={{ flex: 1 }}>
        <View style={s.rowTitleRow}>
          <Text style={s.rowTitle} numberOfLines={1}>{notif.title}</Text>
          {!notif.read && <View style={[s.unreadDot, { backgroundColor: accent }]} />}
        </View>
        <Text style={s.rowBody} numberOfLines={2}>{notif.body}</Text>
      </View>

      <Text style={s.rowTime}>{relativeTime(notif.createdAt)}</Text>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PrefRow — item de preferência de push
// ─────────────────────────────────────────────────────────────────────────────
function PrefRow({ item, enabled, onToggle }) {
  return (
    <View style={s.prefRow}>
      <View style={[s.prefIcon, { backgroundColor: item.color + '22' }]}>
        <Ionicons name={item.icon} size={17} color={item.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.prefLabel}>{item.label}</Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        trackColor={{ false: COLORS.bgOverlay, true: item.color + '66' }}
        thumbColor={enabled ? item.color : COLORS.textMuted}
        ios_backgroundColor={COLORS.bgOverlay}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SectionHeader
// ─────────────────────────────────────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle, actions }) {
  return (
    <View style={s.sectionHeaderWrap}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <Ionicons name={icon} size={14} color={COLORS.textMuted} />
          <Text style={s.sectionTitle}>{title}</Text>
        </View>
        {subtitle ? <Text style={s.sectionSub}>{subtitle}</Text> : null}
      </View>
      {actions && <View style={{ flexDirection: 'row', gap: 6 }}>{actions}</View>}
    </View>
  );
}

function ActionChip({ icon, label, color = COLORS.primary, onPress }) {
  return (
    <TouchableOpacity
      style={[s.chip, { borderColor: color + '55' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={13} color={color} />
      <Text style={[s.chipText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NotificationsModal
// ─────────────────────────────────────────────────────────────────────────────
export default function NotificationsModal({ visible, onClose }) {
  const { currentUser }                              = useApp();
  const { notifications, unreadCount,
          markRead, markAllRead, clearAll }           = useNotifications();
  const { prefs, toggle, resetToDefaults, loading }  = useNotificationPreferences();

  const role     = currentUser?.role ?? 'user';
  const metaList = PREFS_META[role] ?? [];

  // Histórico: apenas últimas 24 h
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const recent = notifications.filter(
    (n) => new Date(n.createdAt).getTime() >= cutoff,
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={s.safe} edges={['top']}>

        {/* ── Cabeçalho ──────────────────────────────────────────── */}
        <View style={s.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={s.headerIcon}>
              <Ionicons name="notifications" size={18} color={COLORS.primary} />
            </View>
            <View>
              <Text style={s.headerTitle}>Notificações</Text>
              <Text style={s.headerSub}>
                {unreadCount > 0
                  ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}`
                  : 'Tudo em dia'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ── Conteúdo ───────────────────────────────────────────── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
        >

          {/* ════════════ SEÇÃO 1: HISTÓRICO ════════════ */}
          <View style={s.section}>
            <SectionHeader
              icon="time-outline"
              title="Histórico (últimas 24h)"
              subtitle={recent.length === 0 ? null : `${recent.length} alerta${recent.length > 1 ? 's' : ''} recebido${recent.length > 1 ? 's' : ''}`}
              actions={
                <>
                  {unreadCount > 0 && (
                    <ActionChip
                      icon="checkmark-done-outline"
                      label="Marcar lidas"
                      onPress={markAllRead}
                    />
                  )}
                  {recent.length > 0 && (
                    <ActionChip
                      icon="trash-outline"
                      label="Limpar"
                      color={COLORS.danger}
                      onPress={() =>
                        Alert.alert('Limpar histórico', 'Remover todas as notificações?', [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Limpar',   style: 'destructive', onPress: clearAll },
                        ])
                      }
                    />
                  )}
                </>
              }
            />

            {recent.length === 0 ? (
              <View style={s.emptyBox}>
                <Ionicons name="notifications-off-outline" size={36} color={COLORS.textMuted} />
                <Text style={s.emptyTitle}>Sem notificações recentes</Text>
                <Text style={s.emptyBody}>Você não recebeu alertas nas últimas 24 horas.</Text>
              </View>
            ) : (
              recent.map((n) => (
                <NotifRow key={n.id} notif={n} onRead={markRead} />
              ))
            )}
          </View>

          {/* ════════════ SEÇÃO 2: PREFERÊNCIAS ════════════ */}
          <View style={s.section}>
            <SectionHeader
              icon="options-outline"
              title="Preferências de Push"
              subtitle="Escolha quais alertas receber no celular"
              actions={
                <ActionChip
                  icon="refresh-outline"
                  label="Padrão"
                  color={COLORS.textMuted}
                  onPress={() =>
                    Alert.alert('Restaurar padrões', 'Redefinir todas as preferências?', [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Restaurar', onPress: resetToDefaults },
                    ])
                  }
                />
              }
            />

            {loading ? (
              <ActivityIndicator
                color={COLORS.primary}
                style={{ marginTop: 20, marginBottom: 8 }}
              />
            ) : metaList.length === 0 ? (
              <View style={s.emptyBox}>
                <Text style={s.emptyBody}>Nenhuma preferência disponível para seu perfil.</Text>
              </View>
            ) : (
              metaList.map((item) => (
                <PrefRow
                  key={item.key}
                  item={item}
                  enabled={prefs[item.key] !== false}
                  onToggle={() => toggle(item.key)}
                />
              ))
            )}
          </View>

        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingBottom: 48 },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  headerIcon: {
    width: 36, height: 36, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + '1A',
    borderWidth: 1, borderColor: COLORS.primary + '33',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  headerSub:   { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  closeBtn: {
    padding: 6, backgroundColor: COLORS.bgOverlay,
    borderRadius: RADIUS.full,
    borderWidth: 0.5, borderColor: COLORS.border,
  },

  // ── Section ────────────────────────────────────────────────────────────────
  section: { paddingHorizontal: 16, paddingTop: 24 },

  sectionHeaderWrap: {
    flexDirection: 'row', alignItems: 'flex-start',
    marginBottom: 14, gap: 8,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.9,
  },
  sectionSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },

  // ── ActionChip ─────────────────────────────────────────────────────────────
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: RADIUS.full, borderWidth: 0.5,
  },
  chipText: { fontSize: 11, fontWeight: '700' },

  // ── Empty ──────────────────────────────────────────────────────────────────
  emptyBox: {
    alignItems: 'center', paddingVertical: 36,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl, gap: 8,
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textSub },
  emptyBody:  { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: 24 },

  // ── NotifRow ───────────────────────────────────────────────────────────────
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 0.5, borderColor: COLORS.border,
    marginBottom: 8, overflow: 'hidden',
  },
  rowRead:    { opacity: 0.45 },
  rowAccent:  { width: 3, alignSelf: 'stretch' },
  rowIcon: {
    width: 36, height: 36, borderRadius: RADIUS.md,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0, marginVertical: 10,
  },
  rowTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  rowTitle:    { fontSize: 13, fontWeight: '700', color: COLORS.text, flex: 1 },
  rowBody:     { fontSize: 12, color: COLORS.textSub, marginTop: 2, lineHeight: 17, marginBottom: 10 },
  rowTime:     { fontSize: 10, color: COLORS.textMuted, flexShrink: 0, marginTop: 12, marginRight: 10 },
  unreadDot:   { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },

  // ── PrefRow ────────────────────────────────────────────────────────────────
  prefRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: 14, marginBottom: 8,
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  prefIcon: {
    width: 36, height: 36, borderRadius: RADIUS.md,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  prefLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
});
