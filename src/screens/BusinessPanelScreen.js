import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

const CROWD_OPTIONS = [
  { key: 'tranquilo', icon: '🟢', label: 'Tranquilo', color: COLORS.success },
  { key: 'moderado', icon: '🟡', label: 'Moderado', color: COLORS.warning },
  { key: 'cheio', icon: '🔥', label: 'Cheio', color: COLORS.primary },
  { key: 'lotado', icon: '🚨', label: 'Lotado', color: COLORS.danger },
];

const ANNOUNCEMENTS = [
  { icon: '🎤', label: 'Novo artista', msg: 'Um novo artista vai subir ao palco em breve!' },
  { icon: '⬇️', label: 'Fila diminuiu', msg: 'A fila diminuiu! Ótima hora para vir 🎉' },
  { icon: '🎁', label: 'Promoção', msg: '2 drinks pelo preço de 1 até meia-noite!' },
  { icon: '⚠️', label: 'Aviso', msg: 'Estamos quase lotados! Reserve seu lugar.' },
];

function MetricCard({ icon, label, value, sub, color }) {
  return (
    <View style={s.metricCard}>
      <Text style={s.metricIcon}>{icon}</Text>
      <Text style={[s.metricValue, { color }]}>{value}</Text>
      <Text style={s.metricLabel}>{label}</Text>
      {sub && <Text style={s.metricSub}>{sub}</Text>}
    </View>
  );
}

export default function BusinessPanelScreen({ navigation }) {
  const { businessStats, coupons, currentUser, logout } = useApp();
  const [crowdStatus, setCrowdStatus] = useState('moderado');

  const myCoupons = coupons.filter(c => c.eventId === businessStats.activeEventId);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="pulse" size={18} color={COLORS.primary} />
          <Text style={s.logo}>LiveVibe</Text>
        </View>
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity style={s.newEventBtn} onPress={() => navigation.navigate('NewEvent')}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={s.newEventText}>Novo Evento</Text>
          </TouchableOpacity>
          <View style={s.liveChip}>
            <View style={s.liveDot} />
            <Text style={s.liveChipText}>Ao vivo</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User + logout */}
        <View style={s.userCard}>
          <View style={s.userAvatar}>
            <Text style={s.userAvatarText}>{currentUser?.avatar || 'B'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.userName}>{currentUser?.name || 'Estabelecimento'}</Text>
            <Text style={s.userEmail}>{currentUser?.email || ''}</Text>
          </View>
          <TouchableOpacity style={s.logoutBtn}
            onPress={() => Alert.alert('Sair?', '', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sair', style: 'destructive', onPress: logout }])}>
            <Ionicons name="log-out-outline" size={16} color={COLORS.danger} />
            <Text style={s.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>

        {/* Active event */}
        <View style={s.activeBanner}>
          <View style={[s.activeDot, { backgroundColor: COLORS.success }]} />
          <Text style={s.activeBannerText}>{businessStats.activeEventName}</Text>
          <TouchableOpacity><Text style={s.editText}>Editar</Text></TouchableOpacity>
        </View>

        {/* Metrics */}
        <View style={s.metricsGrid}>
          <MetricCard icon="👥" label="Aqui agora" value={businessStats.checkedIn.toLocaleString()} sub={businessStats.checkedInChange} color={COLORS.primaryLight} />
          <MetricCard icon="⭐" label="Avaliação" value={businessStats.rating} sub={`${businessStats.reviewsToday} reviews`} color={COLORS.gold} />
          <MetricCard icon="🎟" label="Resgatados" value={businessStats.couponsRedeemed} sub={`/ ${businessStats.couponsTotal}`} color={COLORS.purpleLight} />
          <MetricCard icon="🔥" label="Vibe" value={businessStats.heatLevel || 'WARM'} color={COLORS.primary} />
        </View>

        {/* Crowd control */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Status de Lotação</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {CROWD_OPTIONS.map(opt => (
              <TouchableOpacity key={opt.key}
                style={[s.crowdBtn, crowdStatus === opt.key && { borderColor: opt.color, backgroundColor: opt.color + '22' }]}
                onPress={() => { setCrowdStatus(opt.key); Alert.alert('✅ Atualizado', `Lotação: ${opt.label}`); }}>
                <Text style={{ fontSize: 18, marginBottom: 2 }}>{opt.icon}</Text>
                <Text style={[s.crowdLabel, crowdStatus === opt.key && { color: opt.color, fontWeight: '700' }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Announce */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Anunciar ao Vivo</Text>
          {ANNOUNCEMENTS.map((a, i) => (
            <TouchableOpacity key={i} style={s.announceCard}
              onPress={() => Alert.alert('📢 Enviado!', `"${a.msg}"`)}>
              <Text style={s.announceIcon}>{a.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.announceLabel}>{a.label}</Text>
                <Text style={s.announceMsg} numberOfLines={1}>{a.msg}</Text>
              </View>
              <Ionicons name="send-outline" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Coupons */}
        <View style={s.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={s.sectionTitle}>Meus Cupons</Text>
            <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('AddCoupon')}>
              <Ionicons name="add" size={14} color="#fff" />
              <Text style={s.addBtnText}>Novo</Text>
            </TouchableOpacity>
          </View>
          {myCoupons.length === 0 ? (
            <TouchableOpacity style={s.emptyCard} onPress={() => navigation.navigate('AddCoupon')}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>🎟</Text>
              <Text style={s.emptyTitle}>Criar primeiro cupom</Text>
              <Text style={s.emptySub}>Atraia mais clientes com cupons exclusivos</Text>
            </TouchableOpacity>
          ) : myCoupons.map(c => (
            <View key={c.id} style={s.couponRow}>
              <View style={[s.couponDot, { backgroundColor: c.highlightColor }]}>
                <Text style={{ fontSize: 18 }}>{c.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={s.couponTitle} numberOfLines={1}>{c.title}</Text>
                  <View style={[s.couponTypeBadge, { backgroundColor: c.highlightColor + '33' }]}>
                    <Text style={[s.couponTypeText, { color: c.highlightColor }]}>{c.typeLabel}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={s.couponQty}>{c.remainingQty}/{c.totalQty} restantes</Text>
                  <Text style={{ fontSize: 11, color: COLORS.success }}>{c.totalQty - c.remainingQty} resgatados</Text>
                </View>
                <View style={s.progressBg}>
                  <View style={[s.progressFill, { width: `${(c.remainingQty / c.totalQty) * 100}%`, backgroundColor: c.highlightColor }]} />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Recent reviews */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Reviews Recentes</Text>
          {businessStats.recentReviews.map((r, i) => (
            <View key={i} style={s.reviewCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Text style={s.reviewUser}>{r.user}</Text>
                <Text style={{ fontSize: 11 }}>{'⭐'.repeat(r.stars)}</Text>
                <Text style={s.reviewTime}>{r.time}</Text>
              </View>
              <Text style={s.reviewText}>{r.text}</Text>
            </View>
          ))}
        </View>

        {/* Boost */}
        <View style={s.boostCard}>
          <Text style={s.boostTitle}>⚡ Impulsionar Visibilidade</Text>
          <Text style={s.boostSub}>Destaque seu evento no topo do feed para +2.300 usuários próximos</Text>
          <TouchableOpacity style={s.boostBtn} onPress={() => Alert.alert('Em breve', 'Planos em desenvolvimento!')}>
            <Text style={s.boostBtnText}>Ver planos →</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  logo: { fontSize: 16, fontWeight: '900', color: COLORS.text },
  newEventBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.full },
  newEventText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  liveChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.bgCard, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 0.5, borderColor: COLORS.border },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveChipText: { fontSize: 12, color: COLORS.text, fontWeight: '600' },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.bgCard, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary + '33', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.primary + '66' },
  userAvatarText: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  userName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  userEmail: { fontSize: 12, color: COLORS.textMuted },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.danger + '22', paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.full, borderWidth: 0.5, borderColor: COLORS.danger + '44' },
  logoutText: { fontSize: 13, color: COLORS.danger, fontWeight: '700' },
  activeBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary + '18', paddingHorizontal: 16, paddingVertical: 10 },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
  activeBannerText: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.text },
  editText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingTop: 12, gap: 8 },
  metricCard: { flex: 1, minWidth: '45%', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 14, borderWidth: 0.5, borderColor: COLORS.border },
  metricIcon: { fontSize: 18, marginBottom: 6 },
  metricValue: { fontSize: 22, fontWeight: '800' },
  metricLabel: { fontSize: 12, color: COLORS.textSub, marginTop: 2 },
  metricSub: { fontSize: 11, color: COLORS.success, fontWeight: '500', marginTop: 2 },
  section: { paddingHorizontal: 12, marginTop: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  crowdBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border },
  crowdLabel: { fontSize: 10, color: COLORS.textMuted },
  announceCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 12, marginBottom: 8, borderWidth: 0.5, borderColor: COLORS.border },
  announceIcon: { fontSize: 22 },
  announceLabel: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  announceMsg: { fontSize: 12, color: COLORS.textSub },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full },
  addBtnText: { fontSize: 12, color: '#fff', fontWeight: '700' },
  emptyCard: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl, padding: 24, alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, borderStyle: 'dashed' },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  emptySub: { fontSize: 13, color: COLORS.textSub, textAlign: 'center' },
  couponRow: { flexDirection: 'row', gap: 10, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, marginBottom: 8, padding: 12, borderWidth: 0.5, borderColor: COLORS.border, alignItems: 'center' },
  couponDot: { width: 44, height: 44, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  couponTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, flex: 1 },
  couponTypeBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: RADIUS.full },
  couponTypeText: { fontSize: 9, fontWeight: '700' },
  couponQty: { fontSize: 11, color: COLORS.textMuted },
  progressBg: { height: 4, backgroundColor: COLORS.bgOverlay, borderRadius: 2, overflow: 'hidden', marginTop: 6 },
  progressFill: { height: '100%', borderRadius: 2 },
  reviewCard: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 12, marginBottom: 8, borderWidth: 0.5, borderColor: COLORS.border },
  reviewUser: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  reviewTime: { fontSize: 11, color: COLORS.textMuted, marginLeft: 'auto' },
  reviewText: { fontSize: 13, color: COLORS.textSub },
  boostCard: { backgroundColor: COLORS.primary + '18', borderRadius: RADIUS.xl, margin: 12, padding: 18, borderWidth: 1, borderColor: COLORS.primary + '55' },
  boostTitle: { fontSize: 15, fontWeight: '800', color: COLORS.primaryLight, marginBottom: 6 },
  boostSub: { fontSize: 13, color: COLORS.textSub, lineHeight: 19, marginBottom: 14 },
  boostBtn: { backgroundColor: COLORS.primary, alignSelf: 'flex-start', paddingHorizontal: 18, paddingVertical: 9, borderRadius: RADIUS.full },
  boostBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});
