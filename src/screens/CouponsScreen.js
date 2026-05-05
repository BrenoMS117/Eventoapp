import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

const COUPON_FILTERS = ['Todos', 'Próximos', '🍹 Bebida', '🍕 Comida', '🎧 Experiência', '🎟 Desconto'];
const TYPE_FILTER_MAP = { '🍹 Bebida': 'bebida', '🍕 Comida': 'comida', '🎧 Experiência': 'experiencia', '🎟 Desconto': 'desconto' };

function CouponCard({ coupon, onPress, isRedeemed }) {
  const pct = coupon.remainingQty / coupon.totalQty;
  const isLow = coupon.remainingQty <= 5 && coupon.remainingQty > 0;
  const isSoldOut = coupon.remainingQty === 0;

  return (
    <TouchableOpacity style={[styles.card, isSoldOut && styles.cardFaded]} onPress={onPress} activeOpacity={0.88} disabled={isSoldOut && !isRedeemed}>
      <View style={[styles.cardBand, { backgroundColor: coupon.highlightColor }]}>
        <Text style={styles.bandIcon}>{coupon.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.bandType}>{coupon.typeLabel}</Text>
          <Text style={styles.bandEvent} numberOfLines={1}>{coupon.eventName}</Text>
        </View>
        {coupon.isNearby && !isSoldOut && !isRedeemed && (
          <View style={styles.nearbyPill}><View style={styles.nearbyDot} /><Text style={styles.nearbyText}>Perto</Text></View>
        )}
        {isRedeemed && <View style={styles.redeemedPill}><Text style={styles.redeemedPillText}>✓ Resgatado</Text></View>}
        {isSoldOut && <View style={styles.soldOutPill}><Text style={styles.soldOutPillText}>Esgotado</Text></View>}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{coupon.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{coupon.description}</Text>
        <View style={styles.cardMeta}>
          <View style={styles.metaRow}><Ionicons name="location-outline" size={11} color={COLORS.textMuted} /><Text style={styles.metaText}>{coupon.venue}</Text></View>
          {coupon.expiresAt && <View style={styles.metaRow}><Ionicons name="time-outline" size={11} color={COLORS.textMuted} /><Text style={styles.metaText}>Até {coupon.expiresAt}</Text></View>}
        </View>
        <Text style={[styles.qtyLabel, isLow && { color: COLORS.danger }]}>
          {isSoldOut ? 'Esgotado' : isLow ? `⚡ Apenas ${coupon.remainingQty} restantes!` : `${coupon.remainingQty} de ${coupon.totalQty} disponíveis`}
        </Text>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: isLow ? COLORS.danger : coupon.highlightColor }]} />
        </View>
        {!isSoldOut && !isRedeemed && (
          <View style={styles.cardAction}>
            <Text style={[styles.actionLabel, { color: coupon.highlightColor }]}>
              {coupon.isNearby ? '🎯 Você está no local — Resgatar agora →' : '📍 Vá ao local para resgatar'}
            </Text>
          </View>
        )}
        {isRedeemed && <View style={styles.cardAction}><Text style={{ fontSize: 12, color: COLORS.success, fontWeight: '500' }}>✅ Apresente ao atendente</Text></View>}
      </View>
    </TouchableOpacity>
  );
}

export default function CouponsScreen({ navigation }) {
  const { coupons, isCouponRedeemed, nearbyEventIds } = useApp();
  const [filter, setFilter] = useState('Todos');

  const filtered = coupons.filter(c => {
    if (filter === 'Próximos') return nearbyEventIds.includes(c.eventId);
    if (TYPE_FILTER_MAP[filter]) return c.type === TYPE_FILTER_MAP[filter];
    return true;
  });

  const nearbyCoupons = coupons.filter(c => nearbyEventIds.includes(c.eventId) && !isCouponRedeemed(c.id));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎟 Cupons</Text>
        <Text style={styles.headerSub}>{nearbyCoupons.length} disponíveis perto de você</Text>
      </View>
      {nearbyCoupons.length > 0 && (
        <View style={styles.alertBanner}>
          <View style={styles.alertDot} />
          <Text style={styles.alertText}><Text style={{ fontWeight: '700' }}>{nearbyCoupons.length} cupons</Text> disponíveis nos eventos próximos!</Text>
        </View>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {COUPON_FILTERS.map(f => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterBtnActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎟</Text>
            <Text style={styles.emptyTitle}>Nenhum cupom aqui</Text>
            <Text style={styles.emptySub}>Explore eventos para encontrar cupons exclusivos</Text>
          </View>
        ) : filtered.map(c => (
          <CouponCard key={c.id} coupon={c} isRedeemed={isCouponRedeemed(c.id)} onPress={() => navigation.navigate('CouponDetail', { couponId: c.id })} />
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primaryDark, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  headerSub: { fontSize: 12, color: '#9FE1CB', marginTop: 2 },
  alertBanner: { backgroundColor: COLORS.amberLight, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
  alertDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.amber },
  alertText: { fontSize: 13, color: COLORS.amber, flex: 1 },
  filterScroll: { maxHeight: 48, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  filterContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, alignItems: 'center' },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: COLORS.surface, borderWidth: 0.5, borderColor: COLORS.border },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 12, color: COLORS.textSecondary },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  scroll: { flex: 1 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, marginHorizontal: 12, marginTop: 12, overflow: 'hidden', borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW.sm },
  cardFaded: { opacity: 0.6 },
  cardBand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  bandIcon: { fontSize: 24 },
  bandType: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'uppercase' },
  bandEvent: { fontSize: 12, color: '#fff', fontWeight: '500' },
  nearbyPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  nearbyDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#4ade80' },
  nearbyText: { fontSize: 10, color: '#fff', fontWeight: '600' },
  redeemedPill: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  redeemedPillText: { fontSize: 10, color: '#fff', fontWeight: '600' },
  soldOutPill: { backgroundColor: 'rgba(0,0,0,0.25)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  soldOutPillText: { fontSize: 10, color: '#fff', fontWeight: '600' },
  cardBody: { padding: 12 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  cardMeta: { flexDirection: 'row', gap: 14, marginTop: 8, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, color: COLORS.textMuted },
  qtyLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500', marginBottom: 4 },
  progressBg: { height: 4, backgroundColor: COLORS.border, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  cardAction: { marginTop: 10, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: COLORS.border },
  actionLabel: { fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  emptySub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
});