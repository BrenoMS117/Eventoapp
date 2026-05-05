import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

const QUICK_ANNOUNCEMENTS = [
  { icon: '🎤', label: 'Novo artista', message: 'Um novo artista vai subir ao palco em breve!' },
  { icon: '⬇️', label: 'Fila diminuiu', message: 'A fila diminuiu! Ótima hora para vir 🎉' },
  { icon: '🎁', label: 'Promoção', message: 'Promoção especial: 2 drinks pelo preço de 1 até meia-noite!' },
  { icon: '⚠️', label: 'Aviso', message: 'Estamos quase lotados! Reserve seu lugar.' },
  { icon: '♿', label: 'Acesso', message: 'Acesso para cadeirantes disponível pela entrada lateral.' },
];

const CROWD_OPTIONS = [
  { key: 'tranquilo', icon: '🟢', label: 'Tranquilo', color: COLORS.success },
  { key: 'moderado', icon: '🟡', label: 'Moderado', color: COLORS.warning },
  { key: 'cheio', icon: '🔥', label: 'Cheio', color: COLORS.warning },
  { key: 'lotado', icon: '🚨', label: 'Lotado', color: COLORS.danger },
];

export default function BusinessPanelScreen({ navigation }) {
  const { businessStats, coupons } = useApp();
  const [crowdStatus, setCrowdStatus] = useState('moderado');

  const businessCoupons = coupons.filter(c => c.eventId === businessStats.activeEventId);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🏢 Painel</Text>
          <Text style={styles.headerSub}>{businessStats.venueName}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => navigation.navigate('NewEvent')}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.headerActionText}>Novo evento</Text>
          </TouchableOpacity>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Ao vivo</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.eventBanner}>
          <Ionicons name="musical-notes" size={16} color={COLORS.primaryDark} />
          <Text style={styles.eventBannerText}>{businessStats.activeEventName}</Text>
        </View>

        <View style={styles.metricsGrid}>
          {[
            { icon: '👥', label: 'Aqui agora', value: businessStats.checkedIn.toLocaleString(), sub: businessStats.checkedInChange, color: COLORS.primary },
            { icon: '⭐', label: 'Avaliação', value: businessStats.rating, sub: `${businessStats.reviewsToday} reviews`, color: COLORS.amber },
            { icon: '🎟', label: 'Resgatados', value: businessStats.couponsRedeemed, sub: `de ${businessStats.couponsTotal}`, color: COLORS.purple },
            { icon: '📝', label: 'Reviews hoje', value: businessStats.reviewsToday, color: COLORS.primary },
          ].map(m => (
            <View key={m.label} style={styles.metricCard}>
              <Text style={styles.metricIcon}>{m.icon}</Text>
              <Text style={[styles.metricValue, { color: m.color }]}>{m.value}</Text>
              <Text style={styles.metricLabel}>{m.label}</Text>
              {m.sub && <Text style={styles.metricSub}>{m.sub}</Text>}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status de lotação</Text>
          <View style={styles.crowdRow}>
            {CROWD_OPTIONS.map(opt => (
              <TouchableOpacity key={opt.key} style={[styles.crowdBtn, crowdStatus === opt.key && { borderColor: opt.color, backgroundColor: opt.color + '18' }]} onPress={() => { setCrowdStatus(opt.key); Alert.alert('✅ Status atualizado', 'O status foi atualizado para os usuários.'); }}>
                <Text style={styles.crowdBtnIcon}>{opt.icon}</Text>
                <Text style={[styles.crowdBtnLabel, crowdStatus === opt.key && { color: opt.color, fontWeight: '600' }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Anunciar ao vivo</Text>
          <Text style={styles.sectionSub}>Notifique usuários próximos instantaneamente</Text>
          {QUICK_ANNOUNCEMENTS.map((a, i) => (
            <TouchableOpacity key={i} style={styles.announcementBtn} onPress={() => Alert.alert('📢 Anúncio enviado!', `"${a.message}"`)}>
              <Text style={styles.announceIcon}>{a.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.announceLabel}>{a.label}</Text>
                <Text style={styles.announceMsg} numberOfLines={1}>{a.message}</Text>
              </View>
              <Ionicons name="send-outline" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Meus cupons</Text>
            <TouchableOpacity style={styles.addCouponBtn} onPress={() => navigation.navigate('AddCoupon')}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.addCouponText}>Novo cupom</Text>
            </TouchableOpacity>
          </View>

          {businessCoupons.length === 0 ? (
            <TouchableOpacity style={styles.emptyCoupons} onPress={() => navigation.navigate('AddCoupon')}>
              <Text style={{ fontSize: 40, marginBottom: 10 }}>🎟</Text>
              <Text style={styles.emptyCouponsTitle}>Criar primeiro cupom</Text>
              <Text style={styles.emptyCouponsSub}>Atraia mais clientes com cupons exclusivos</Text>
            </TouchableOpacity>
          ) : businessCoupons.map(c => (
            <View key={c.id} style={styles.businessCouponCard}>
              <View style={[styles.bcLeft, { backgroundColor: COLORS.background }]}>
                <Text style={{ fontSize: 22 }}>{c.icon}</Text>
              </View>
              <View style={styles.bcBody}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={styles.bcTitle} numberOfLines={1}>{c.title}</Text>
                  <View style={[styles.bcTypeBadge, { backgroundColor: c.highlightColor + '22' }]}>
                    <Text style={[styles.bcTypeText, { color: c.highlightColor }]}>{c.typeLabel}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={styles.bcQty}>{c.remainingQty}/{c.totalQty} restantes</Text>
                  <Text style={{ fontSize: 11, color: COLORS.success, fontWeight: '500' }}>{c.totalQty - c.remainingQty} resgatados</Text>
                </View>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${(c.remainingQty / c.totalQty) * 100}%`, backgroundColor: c.highlightColor }]} />
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Avaliações recentes</Text>
          {businessStats.recentReviews.map((r, i) => (
            <View key={i} style={styles.reviewCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Text style={styles.reviewUser}>{r.user}</Text>
                <Text style={{ fontSize: 12 }}>{'⭐'.repeat(r.stars)}</Text>
                <Text style={styles.reviewTime}>{r.time}</Text>
              </View>
              <Text style={styles.reviewText}>{r.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.boostCard}>
          <Text style={styles.boostTitle}>⚡ Impulsionar visibilidade</Text>
          <Text style={styles.boostSub}>Destaque seu evento no topo do feed para +2.300 usuários próximos</Text>
          <TouchableOpacity style={styles.boostBtn} onPress={() => Alert.alert('Em breve', 'Planos de impulsionamento em desenvolvimento!')}>
            <Text style={styles.boostBtnText}>Ver planos →</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primaryDark, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  headerSub: { fontSize: 12, color: '#9FE1CB', marginTop: 2 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ade80' },
  liveText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  eventBanner: { backgroundColor: COLORS.primaryLight, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
  eventBannerText: { flex: 1, fontSize: 13, fontWeight: '500', color: COLORS.primaryDark },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, paddingTop: 12, gap: 8 },
  metricCard: { flex: 1, minWidth: '45%', backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 14, borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW.sm },
  metricIcon: { fontSize: 18, marginBottom: 6 },
  metricValue: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  metricLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  metricSub: { fontSize: 11, color: COLORS.success, fontWeight: '500', marginTop: 2 },
  section: { paddingHorizontal: 12, marginTop: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  sectionSub: { fontSize: 12, color: COLORS.textMuted, marginBottom: 10 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  addCouponBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.full },
  addCouponText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  crowdRow: { flexDirection: 'row', gap: 8 },
  crowdBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border },
  crowdBtnIcon: { fontSize: 18, marginBottom: 3 },
  crowdBtnLabel: { fontSize: 11, color: COLORS.textSecondary },
  announcementBtn: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW.sm },
  announceIcon: { fontSize: 22 },
  announceLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  announceMsg: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  emptyCoupons: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 24, alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, borderStyle: 'dashed' },
  emptyCouponsTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  emptyCouponsSub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  businessCouponCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, marginBottom: 8, flexDirection: 'row', overflow: 'hidden', borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW.sm },
  bcLeft: { width: 50, justifyContent: 'center', alignItems: 'center' },
  bcBody: { flex: 1, padding: 10 },
  bcTitle: { fontSize: 13, fontWeight: '600', color: COLORS.text, flex: 1 },
  bcTypeBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: RADIUS.full, marginLeft: 6 },
  bcTypeText: { fontSize: 9, fontWeight: '600' },
  bcQty: { fontSize: 11, color: COLORS.textSecondary },
  progressBg: { height: 4, backgroundColor: COLORS.border, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  reviewCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 12, marginBottom: 8, borderWidth: 0.5, borderColor: COLORS.border },
  reviewUser: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  reviewTime: { fontSize: 11, color: COLORS.textMuted, marginLeft: 'auto' },
  reviewText: { fontSize: 13, color: COLORS.textSecondary },
  boostCard: { backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.lg, margin: 12, padding: 16, borderWidth: 1, borderColor: COLORS.primary + '44' },
  boostTitle: { fontSize: 15, fontWeight: '700', color: COLORS.primaryDark, marginBottom: 4 },
  boostSub: { fontSize: 13, color: COLORS.primaryDark, lineHeight: 18, marginBottom: 12 },
  boostBtn: { backgroundColor: COLORS.primary, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.md },
  boostBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  headerActionBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 10,
  paddingVertical: 6,
  backgroundColor: 'rgba(255,255,255,0.12)',
  borderRadius: RADIUS.full,
  marginRight: 6,
},
headerActionText: { color: '#fff', fontSize: 12, marginLeft: 6, fontWeight: '600' },

});