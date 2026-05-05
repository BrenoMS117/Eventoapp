import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

const RATING_QUICK = [
  { key: 'tranquilo', icon: '🟢', label: 'Tranquilo', color: COLORS.successLight, text: COLORS.success },
  { key: 'cheio', icon: '🟡', label: 'Cheio', color: COLORS.warningLight, text: COLORS.warning },
  { key: 'lotado', icon: '🔴', label: 'Lotado', color: COLORS.dangerLight, text: COLORS.danger },
  { key: 'acessivel', icon: '♿', label: 'Acessível', color: COLORS.primaryLight, text: COLORS.primaryDark },
  { key: 'musica', icon: '🎵', label: 'Boa música', color: COLORS.purpleLight, text: COLORS.purple },
  { key: 'ruim', icon: '👎', label: 'Ruim', color: COLORS.dangerLight, text: COLORS.danger },
];

export default function EventDetailScreen({ route, navigation }) {
  const { eventId } = route.params;
  const { events, getCouponsForEvent, feedPosts, redeemCoupon, isCouponRedeemed, nearbyEventIds } = useApp();
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [ratingSent, setRatingSent] = useState(false);

  const event = events.find(e => e.id === eventId);
  if (!event) return null;

  const coupons = getCouponsForEvent(eventId);
  const eventPosts = feedPosts.filter(p => p.eventId === eventId).slice(0, 3);
  const isNearby = nearbyEventIds.includes(eventId);
  const crowdColor = event.crowdLevel >= 85 ? COLORS.danger : event.crowdLevel >= 60 ? COLORS.warning : COLORS.success;

  function handleRedeem(coupon) {
    if (!isNearby) { Alert.alert('Você precisa estar no local', 'Chegue perto do evento para resgatar cupons.'); return; }
    if (isCouponRedeemed(coupon.id)) { Alert.alert('Já resgatado', 'Você já usou este cupom.'); return; }
    Alert.alert(`Resgatar: ${coupon.title}`, coupon.description, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Resgatar agora', onPress: () => {
        const result = redeemCoupon(coupon.id);
        if (result.success) Alert.alert('✅ Resgatado!', `Apresente ao atendente do ${coupon.venue}.`);
        else Alert.alert('Erro', result.error);
      }},
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.header, { backgroundColor: event.gradient[0] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{event.name}</Text>
          <Text style={styles.headerSub}>{event.venue}</Text>
        </View>
        {isNearby && <View style={styles.nearbyBadge}><Text style={styles.nearbyText}>📍 Você está aqui</Text></View>}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {event.isLive && (
          <View style={[styles.liveBanner, { backgroundColor: event.gradient[0] + '22' }]}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBannerText}><Text style={{ fontWeight: '700', color: event.gradient[0] }}>{event.checkedInCount.toLocaleString()} pessoas</Text> estão aqui agora</Text>
          </View>
        )}

        <View style={styles.statsGrid}>
          {[
            { label: 'Lotação', value: `${event.crowdLevel}%`, sub: event.crowdLabel, color: crowdColor },
            { label: 'Fila', value: event.queueMinutes > 0 ? `~${event.queueMinutes}min` : 'Sem fila', sub: event.queueMinutes > 0 ? 'de espera' : 'Entre já!', color: event.queueMinutes > 10 ? COLORS.warning : COLORS.success },
            { label: 'Avaliação', value: `${event.rating} ⭐`, sub: `${event.reviewCount} reviews`, color: COLORS.primary },
            { label: 'Acessível', value: event.accessible ? '✓ Sim' : '✗ Não', sub: event.accessible ? 'Rampa + banheiro' : 'Sem acesso', color: event.accessible ? COLORS.success : COLORS.danger },
          ].map(stat => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statSub}>{stat.sub}</Text>
            </View>
          ))}
        </View>

        {event.nowPlaying && (
          <View style={styles.musicCard}>
            <Text style={styles.musicLabel}>🎵 Tocando agora</Text>
            <Text style={styles.musicNow}>{event.nowPlaying}</Text>
            {event.nextAct && <Text style={styles.musicNext}>A seguir: {event.nextAct}</Text>}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Avaliação rápida</Text>
          <View style={styles.ratingGrid}>
            {RATING_QUICK.map(r => (
              <TouchableOpacity key={r.key} style={[styles.ratingPill, { backgroundColor: r.color }, selectedRatings.includes(r.key) && styles.ratingPillSelected]} onPress={() => !ratingSent && setSelectedRatings(prev => prev.includes(r.key) ? prev.filter(k => k !== r.key) : [...prev, r.key])}>
                <Text style={[styles.ratingPillText, { color: r.text }]}>{r.icon} {r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedRatings.length > 0 && !ratingSent && (
            <TouchableOpacity style={styles.submitBtn} onPress={() => { setRatingSent(true); Alert.alert('Obrigado! 🙌', 'Sua avaliação foi enviada!'); }}>
              <Text style={styles.submitBtnText}>Enviar avaliação ↗</Text>
            </TouchableOpacity>
          )}
          {ratingSent && <View style={styles.ratingThanks}><Ionicons name="checkmark-circle" size={16} color={COLORS.success} /><Text style={styles.ratingThanksText}>Avaliação enviada! Obrigado 🙌</Text></View>}
        </View>

        {coupons.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Cupons disponíveis</Text>
              <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: '600' }}>{coupons.length} cupons</Text>
            </View>
            {coupons.map(coupon => {
              const redeemed = isCouponRedeemed(coupon.id);
              const isSoldOut = coupon.remainingQty === 0;
              return (
                <TouchableOpacity key={coupon.id} style={[styles.couponCard, redeemed && { opacity: 0.7 }]} onPress={() => handleRedeem(coupon)} activeOpacity={0.85} disabled={isSoldOut}>
                  <View style={[styles.couponLeft, { backgroundColor: coupon.highlightColor + '22' }]}>
                    <Text style={{ fontSize: 26 }}>{coupon.icon}</Text>
                  </View>
                  <View style={styles.couponBody}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <View style={[styles.couponTypeBadge, { backgroundColor: coupon.highlightColor + '22' }]}>
                        <Text style={[styles.couponTypeText, { color: coupon.highlightColor }]}>{coupon.typeLabel}</Text>
                      </View>
                      {redeemed && <View style={styles.redeemedBadge}><Text style={styles.redeemedText}>✓ Resgatado</Text></View>}
                      {isSoldOut && !redeemed && <View style={styles.soldOutBadge}><Text style={styles.soldOutText}>Esgotado</Text></View>}
                    </View>
                    <Text style={styles.couponTitle}>{coupon.title}</Text>
                    <Text style={styles.couponDesc} numberOfLines={2}>{coupon.description}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                      <Text style={{ fontSize: 11, color: COLORS.textMuted }}>{coupon.remainingQty}/{coupon.totalQty} restantes</Text>
                      {!redeemed && !isSoldOut && <Text style={[{ fontSize: 13, fontWeight: '600' }, { color: coupon.highlightColor }]}>{isNearby ? 'Resgatar →' : '📍 Ir ao local'}</Text>}
                    </View>
                    <View style={styles.qtyBar}>
                      <View style={[styles.qtyFill, { width: `${(coupon.remainingQty / coupon.totalQty) * 100}%`, backgroundColor: coupon.highlightColor }]} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {eventPosts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>O que estão dizendo</Text>
            {eventPosts.map(post => (
              <View key={post.id} style={styles.postCard}>
                <View style={[styles.postAvatar, { backgroundColor: post.user.color }]}>
                  <Text style={[styles.postAvatarText, { color: post.user.textColor }]}>{post.user.initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Text style={styles.postName}>{post.user.name}</Text>
                    {post.verified && <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓ No local</Text></View>}
                    <Text style={styles.postTime}>{post.time}</Text>
                  </View>
                  <Text style={styles.postText}>{post.text}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 14 },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  nearbyBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full },
  nearbyText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  liveBanner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.live },
  liveBannerText: { fontSize: 14, color: COLORS.text },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8, paddingTop: 8 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 12, borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW.sm },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '600' },
  statSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  musicCard: { backgroundColor: COLORS.surface, marginHorizontal: 12, marginTop: 10, borderRadius: RADIUS.md, padding: 12, borderWidth: 0.5, borderColor: COLORS.border },
  musicLabel: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 3 },
  musicNow: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  musicNext: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  section: { paddingHorizontal: 12, marginTop: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  ratingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ratingPill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.full },
  ratingPillSelected: { borderWidth: 2, borderColor: COLORS.primary },
  ratingPillText: { fontSize: 13, fontWeight: '500' },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: 12, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  ratingThanks: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.successLight, padding: 10, borderRadius: RADIUS.md, marginTop: 10 },
  ratingThanksText: { color: COLORS.success, fontSize: 13, fontWeight: '500' },
  couponCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, marginBottom: 10, flexDirection: 'row', overflow: 'hidden', borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW.sm },
  couponLeft: { width: 60, justifyContent: 'center', alignItems: 'center' },
  couponBody: { flex: 1, padding: 12 },
  couponTypeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full },
  couponTypeText: { fontSize: 10, fontWeight: '600' },
  redeemedBadge: { backgroundColor: COLORS.successLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full },
  redeemedText: { fontSize: 10, color: COLORS.success, fontWeight: '600' },
  soldOutBadge: { backgroundColor: COLORS.dangerLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full },
  soldOutText: { fontSize: 10, color: COLORS.danger, fontWeight: '600' },
  couponTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 3 },
  couponDesc: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 17 },
  qtyBar: { height: 3, backgroundColor: COLORS.border, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  qtyFill: { height: '100%', borderRadius: 2 },
  postCard: { flexDirection: 'row', gap: 10, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 12, marginBottom: 8, borderWidth: 0.5, borderColor: COLORS.border },
  postAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  postAvatarText: { fontSize: 12, fontWeight: '600' },
  postName: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  verifiedBadge: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 6, paddingVertical: 1, borderRadius: RADIUS.full },
  verifiedText: { fontSize: 9, color: COLORS.primaryDark, fontWeight: '600' },
  postTime: { fontSize: 11, color: COLORS.textMuted, marginLeft: 'auto' },
  postText: { fontSize: 13, color: COLORS.text, lineHeight: 18 },
});