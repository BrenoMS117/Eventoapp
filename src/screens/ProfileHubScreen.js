/**
 * ProfileHubScreen
 *
 * Full-screen modal with two tabs:
 *   1. Perfil    — edit name, avatar initials, venue name (business), password
 *   2. Notificações — 24h history + push preference toggles
 *
 * Opened by the bell icon in ExploreScreen header.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useNotifications } from '../hooks/useNotifications';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';
import { PREFS_META } from '../services/notifications/NotificationPreferencesService';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const PRIORITY_COLOR = {
  high:   COLORS.danger,
  normal: COLORS.primary,
  low:    COLORS.textMuted,
};

function relativeTime(date) {
  if (!date) return '';
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60)  return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  return `${Math.floor(diff / 3600)}h atrás`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: single notification row
// ─────────────────────────────────────────────────────────────────────────────
function NotifRow({ notif, onRead }) {
  return (
    <TouchableOpacity
      style={[h.notifRow, notif.read && { opacity: 0.5 }]}
      onPress={() => onRead(notif.id)}
      activeOpacity={0.8}
    >
      <View style={[h.notifIcon, { backgroundColor: (notif.color ?? COLORS.primary) + '22' }]}>
        <Ionicons name={`${notif.icon}-outline`} size={18} color={notif.color ?? COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={h.notifTitle} numberOfLines={1}>{notif.title}</Text>
          {!notif.read && <View style={[h.unreadDot, { backgroundColor: notif.color ?? COLORS.primary }]} />}
        </View>
        <Text style={h.notifBody} numberOfLines={2}>{notif.body}</Text>
      </View>
      <Text style={h.notifTime}>{relativeTime(notif.createdAt)}</Text>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Notificações
// ─────────────────────────────────────────────────────────────────────────────
function NotificacoesTab() {
  const { currentUser } = useApp();
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications();
  const { prefs, toggle, loading: prefsLoading } = useNotificationPreferences();

  const role    = currentUser?.role ?? 'user';
  const metaList = PREFS_META[role] ?? [];

  // Last 24h
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const recent = notifications.filter((n) => new Date(n.createdAt).getTime() >= cutoff);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

      {/* ── History ────────────────────────────────────────────── */}
      <View style={h.section}>
        <View style={h.sectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={h.sectionTitle}>Histórico (últimas 24h)</Text>
            {unreadCount > 0 && (
              <Text style={h.unreadHint}>{unreadCount} não lida{unreadCount > 1 ? 's' : ''}</Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {unreadCount > 0 && (
              <TouchableOpacity style={h.actionBtn} onPress={markAllRead}>
                <Ionicons name="checkmark-done-outline" size={14} color={COLORS.primary} />
                <Text style={h.actionBtnText}>Marcar lidas</Text>
              </TouchableOpacity>
            )}
            {recent.length > 0 && (
              <TouchableOpacity style={[h.actionBtn, { borderColor: COLORS.danger + '55' }]} onPress={() =>
                Alert.alert('Limpar', 'Remover todo o histórico?', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Limpar', style: 'destructive', onPress: clearAll },
                ])
              }>
                <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
                <Text style={[h.actionBtnText, { color: COLORS.danger }]}>Limpar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {recent.length === 0 ? (
          <View style={h.emptyBox}>
            <Ionicons name="notifications-off-outline" size={36} color={COLORS.textMuted} />
            <Text style={h.emptyText}>Nenhuma notificação nas últimas 24h</Text>
          </View>
        ) : (
          recent.map((n) => <NotifRow key={n.id} notif={n} onRead={markRead} />)
        )}
      </View>

      {/* ── Preferences ────────────────────────────────────────── */}
      <View style={h.section}>
        <Text style={h.sectionTitle}>Preferências de Push</Text>
        <Text style={h.sectionSub}>Escolha quais alertas deseja receber no celular</Text>

        {prefsLoading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 16 }} />
        ) : (
          metaList.map((item) => (
            <View key={item.key} style={h.prefRow}>
              <View style={[h.prefIcon, { backgroundColor: item.color + '22' }]}>
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>
              <Text style={h.prefLabel}>{item.label}</Text>
              <Switch
                value={prefs[item.key] !== false}
                onValueChange={() => toggle(item.key)}
                trackColor={{ false: COLORS.bgOverlay, true: COLORS.primary + '88' }}
                thumbColor={prefs[item.key] !== false ? COLORS.primary : COLORS.textMuted}
              />
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Perfil
// ─────────────────────────────────────────────────────────────────────────────
function PerfilTab() {
  const { currentUser, updateProfile, updatePassword } = useApp();
  const isBusiness = currentUser?.role === 'business';

  const [editName,        setEditName]        = useState(currentUser?.name      ?? '');
  const [editAvatar,      setEditAvatar]      = useState(currentUser?.avatar    ?? '');
  const [editVenueName,   setEditVenueName]   = useState(currentUser?.venueName ?? '');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPwd,      setShowNewPwd]      = useState(false);
  const [showConfirmPwd,  setShowConfirmPwd]  = useState(false);
  const [saving,          setSaving]          = useState(false);

  async function handleSave() {
    const trimName  = editName.trim();
    const trimVenue = editVenueName.trim();

    if (!trimName) { Alert.alert('Atenção', 'O nome não pode ficar vazio.'); return; }
    if (isBusiness && !trimVenue) {
      Alert.alert('Atenção', 'O nome do estabelecimento não pode ficar vazio.'); return;
    }
    if (newPassword) {
      if (newPassword.length < 6) {
        Alert.alert('Atenção', 'A nova senha deve ter pelo menos 6 caracteres.'); return;
      }
      if (newPassword !== confirmPassword) {
        Alert.alert('Atenção', 'As senhas não coincidem.'); return;
      }
    }

    setSaving(true);
    const profileResult = await updateProfile({
      name:      trimName,
      avatar:    editAvatar.trim() || trimName.slice(0, 2).toUpperCase(),
      ...(isBusiness && { venueName: trimVenue }),
    });
    const passwordResult = newPassword
      ? await updatePassword(newPassword)
      : { error: null };
    setSaving(false);

    const error = profileResult.error || passwordResult.error;
    if (error) {
      Alert.alert('Erro', error);
    } else {
      Alert.alert('Sucesso', 'Perfil atualizado!');
      setNewPassword('');
      setConfirmPassword('');
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Avatar preview */}
        <View style={p.avatarWrap}>
          <View style={p.avatar}>
            <Text style={p.avatarText}>
              {editAvatar || editName.slice(0, 2).toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={p.avatarHint}>Iniciais exibidas no perfil</Text>
        </View>

        {/* ── Identidade ─────────────────────────────────────────── */}
        <View style={p.section}>
          <Text style={p.sectionTitle}>Identidade</Text>

          <Text style={p.label}>Nome</Text>
          <TextInput
            style={p.input}
            value={editName}
            onChangeText={setEditName}
            placeholder="Seu nome"
            placeholderTextColor={COLORS.textMuted}
            autoCorrect={false}
          />

          <Text style={p.label}>Iniciais (até 2 letras)</Text>
          <TextInput
            style={p.input}
            value={editAvatar}
            onChangeText={(v) => setEditAvatar(v.slice(0, 2).toUpperCase())}
            placeholder="Ex: AB"
            placeholderTextColor={COLORS.textMuted}
            maxLength={2}
            autoCapitalize="characters"
          />

          {isBusiness && (
            <>
              <Text style={p.label}>Nome do Estabelecimento</Text>
              <TextInput
                style={p.input}
                value={editVenueName}
                onChangeText={setEditVenueName}
                placeholder="Ex: Bar do João"
                placeholderTextColor={COLORS.textMuted}
                autoCorrect={false}
              />
            </>
          )}
        </View>

        {/* ── Segurança ───────────────────────────────────────────── */}
        <View style={p.section}>
          <Text style={p.sectionTitle}>Segurança</Text>
          <Text style={p.sectionSub}>Deixe em branco para não alterar a senha</Text>

          <Text style={p.label}>Nova Senha</Text>
          <View style={p.inputRow}>
            <TextInput
              style={[p.input, { flex: 1, marginBottom: 0, borderWidth: 0, borderRadius: 0 }]}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showNewPwd}
              autoCorrect={false}
              autoCapitalize="none"
            />
            <TouchableOpacity style={p.eyeBtn} onPress={() => setShowNewPwd((v) => !v)}>
              <Ionicons name={showNewPwd ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={[p.label, { marginTop: 12 }]}>Confirmar Nova Senha</Text>
          <View style={p.inputRow}>
            <TextInput
              style={[p.input, { flex: 1, marginBottom: 0, borderWidth: 0, borderRadius: 0 }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repita a nova senha"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showConfirmPwd}
              autoCorrect={false}
              autoCapitalize="none"
            />
            <TouchableOpacity style={p.eyeBtn} onPress={() => setShowConfirmPwd((v) => !v)}>
              <Ionicons name={showConfirmPwd ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Save ────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 16 }}>
          <TouchableOpacity
            style={[p.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={p.saveBtnText}>Salvar Alterações</Text>}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ProfileHubScreen — main export
// ─────────────────────────────────────────────────────────────────────────────
export default function ProfileHubScreen({ visible, onClose }) {
  const { currentUser } = useApp();
  const { unreadCount } = useNotifications();
  const [activeTab, setActiveTab] = useState('perfil');

  // Reset tab on every open
  const handleClose = useCallback(() => {
    setActiveTab('perfil');
    onClose();
  }, [onClose]);

  const TABS = [
    { key: 'perfil',        label: 'Perfil',        icon: 'person-outline' },
    { key: 'notificacoes',  label: 'Notificações',  icon: 'notifications-outline' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={hub.safe} edges={['top']}>

        {/* ── Header ────────────────────────────────────────────── */}
        <View style={hub.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={hub.avatarSmall}>
              <Text style={hub.avatarSmallText}>{currentUser?.avatar || '?'}</Text>
            </View>
            <View>
              <Text style={hub.headerName}>{currentUser?.name || 'Usuário'}</Text>
              <Text style={hub.headerEmail}>{currentUser?.email || ''}</Text>
            </View>
          </View>
          <TouchableOpacity style={hub.closeBtn} onPress={handleClose}>
            <Ionicons name="close" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ── Tab pills ─────────────────────────────────────────── */}
        <View style={hub.tabBar}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            const badge  = tab.key === 'notificacoes' && unreadCount > 0;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[hub.tab, active && hub.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Ionicons
                  name={tab.icon}
                  size={16}
                  color={active ? COLORS.primary : COLORS.textMuted}
                />
                <Text style={[hub.tabLabel, active && hub.tabLabelActive]}>
                  {tab.label}
                </Text>
                {badge && (
                  <View style={hub.tabBadge}>
                    <Text style={hub.tabBadgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Tab content ───────────────────────────────────────── */}
        <View style={{ flex: 1 }}>
          {activeTab === 'perfil'       && <PerfilTab />}
          {activeTab === 'notificacoes' && <NotificacoesTab />}
        </View>

      </SafeAreaView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const hub = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  avatarSmall: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primary + '33',
    borderWidth: 2, borderColor: COLORS.primary + '66',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarSmallText: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  headerName:  { fontSize: 15, fontWeight: '700', color: COLORS.text },
  headerEmail: { fontSize: 12, color: COLORS.textMuted },
  closeBtn: {
    padding: 6, backgroundColor: COLORS.bgOverlay,
    borderRadius: RADIUS.full, borderWidth: 0.5, borderColor: COLORS.border,
  },

  tabBar: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgCard,
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.primary + '18',
    borderColor: COLORS.primary + '55',
  },
  tabLabel:      { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  tabLabelActive:{ color: COLORS.primary, fontWeight: '700' },
  tabBadge: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    minWidth: 18, height: 18,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
});

// ── Notificações tab styles ───────────────────────────────────────────────────
const h = StyleSheet.create({
  section: {
    paddingHorizontal: 16, paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    marginBottom: 12, gap: 8,
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '800', color: COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2,
  },
  sectionSub: { fontSize: 12, color: COLORS.textMuted, marginBottom: 14 },
  unreadHint: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },

  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: RADIUS.full, borderWidth: 0.5, borderColor: COLORS.primary + '55',
  },
  actionBtnText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },

  emptyBox: {
    alignItems: 'center', paddingVertical: 32,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl, gap: 10,
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  emptyText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },

  notifRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: 12, marginBottom: 8,
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  notifIcon: {
    width: 38, height: 38, borderRadius: RADIUS.md,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  notifTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, flex: 1 },
  notifBody:  { fontSize: 12, color: COLORS.textSub, marginTop: 2, lineHeight: 17 },
  notifTime:  { fontSize: 10, color: COLORS.textMuted, flexShrink: 0, marginTop: 2 },
  unreadDot:  { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },

  prefRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: 14, marginBottom: 8,
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  prefIcon: {
    width: 36, height: 36, borderRadius: RADIUS.md,
    justifyContent: 'center', alignItems: 'center',
  },
  prefLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text },
});

// ── Perfil tab styles ─────────────────────────────────────────────────────────
const p = StyleSheet.create({
  avatarWrap: {
    alignItems: 'center', paddingTop: 24, paddingBottom: 8,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primary + '33',
    borderWidth: 2.5, borderColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8, ...SHADOW.md,
  },
  avatarText: { fontSize: 28, fontWeight: '900', color: COLORS.primary },
  avatarHint: { fontSize: 12, color: COLORS.textMuted },

  section: {
    paddingHorizontal: 16, paddingTop: 20, marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '800', color: COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4,
  },
  sectionSub: { fontSize: 12, color: COLORS.textMuted, marginBottom: 14 },

  label: {
    fontSize: 12, fontWeight: '700', color: COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6, marginTop: 2,
  },
  input: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: COLORS.text, marginBottom: 14,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, marginBottom: 0, overflow: 'hidden',
  },
  eyeBtn: { paddingHorizontal: 12, paddingVertical: 14 },

  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 15, alignItems: 'center',
    marginTop: 20, ...SHADOW.sm,
  },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
