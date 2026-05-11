import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

const { width } = Dimensions.get('window');

const HEAT_COLORS = {
  BLAZING: '#FF4500', HOT: '#E83B5C', WARM: '#F59E0B', COOL: '#3B82F6',
};

const RATING_OPTIONS = [
  { key: 'fire', icon: '🔥', label: 'Intenso', color: COLORS.primary },
  { key: 'chill', icon: '✨', label: 'Chill', color: '#3B82F6' },
  { key: 'crowd', icon: '👥', label: 'Lotado', color: COLORS.warning },
  { key: 'accessible', icon: '♿', label: 'Acessível', color: COLORS.success },
  { key: 'music', icon: '🎵', label: 'Boa música', color: COLORS.purple },
  { key: 'bad', icon: '👎', label: 'Ruim', color: COLORS.danger },
];

function VibeMeter({ value, large = false }) {
  const h = large ? 10 : 6;
  const color = value > 70 ? COLORS.primary : value > 40 ? COLORS.purple : '#3B82F6';
  return (
    <View>
      <View style={{ height: h, backgroundColor: COLORS.bgOverlay, borderRadius: h / 2, overflow: 'hidden', marginBottom: 4 }}>
        <View style={{ height: '100%', width: `${Math.max(2, value)}%`, backgroundColor: color, borderRadius: h / 2 }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 10, color: COLORS.textMuted }}>Chill</Text>
        <Text style={{ fontSize: 10, color: COLORS.textMuted }}>Intense</Text>
      </View>
    </View>
  );
}

function StatCard({ label, value, sub, color, icon }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statIcon}>{icon}</Text>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
      {sub ? <Text style={s.statSub}>{sub}</Text> : null}
    </View>
  );
}

export default function EventDetailScreen({ route, navigation }) {
  const { eventId } = route.params;
  const { events, getCouponsForEvent, feedPosts, redeemCoupon, isCouponRedeemed, nearbyEventIds } = useApp();
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [ratingSent, setRatingSent] = useState(false);

  const event = events.find(e => e.id === eventId);
  if (!event) return null;

  const coupons = getCouponsForEvent(eventId);
  const posts = feedPosts.filter(p => p.eventId === eventId).slice(0, 3);
  const isNearby = nearbyEventIds.includes(eventId);
  const heatColor = HEAT_COLORS[event.heatLevel] || COLORS.primary;
  const crowdColor = event.crowdLevel >= 85 ? COLORS.danger : event.crowdLevel >= 60 ? COLORS.warning : COLORS.success;

  function toggleRating(key) {
    if (ratingSent) return;
    setSelectedRatings(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }

  function handleRedeem(coupon) {
    if (!isNearby) { Alert.alert('📍 Vá ao local', `Chegue até ${coupon.venue} para resgatar.`); return; }
    if (isCouponRedeemed(coupon.id)) { Alert.alert('Já resgatado', 'Você já usou este cupom.'); return; }
    Alert.alert(`Resgatar: ${coupon.title}`, coupon.description, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Resgatar agora', onPress: () => {
        const r = redeemCoupon(coupon.id);
        if (r.success) Alert.alert('✅ Resgatado!', `Apresente ao atendente de ${coupon.venue}.`);
        else Alert.alert('Erro', r.error);
      }},
    ]);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Hero header */}
      <View style={[s.hero, { backgroundColor: event.gradient[0] }]}>
        <View style={[s.heroOverlay, { backgroundColor: event.gradient[1], opacity: 0.5 }]} />
        <View style={s.heroBar}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          {isNearby && (
            <View style={s.nearbyChip}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' }} />
              <Text style={s.nearbyText}>Você está aqui</Text>
            </View>
          )}
          <TouchableOpacity style={s.shareBtn}>
            <Ionicons name="share-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={s.heroContent}>
          {event.isLive && (
            <View style={s.liveBadge}>
              <View style={s.liveDot} />
              <Text style={s.liveText}>LIVE</Text>
              <Text style={s.liveCount}> · {event.checkedInCount.toLocaleString()} aqui</Text>
            </View>
          )}
          <Text style={s.heroName}>{event.name}</Text>
          <Text style={s.heroVenue}>📍 {event.venue} · {event.address.split(' - ')[1] || event.distanceKm + 'km'}</Text>
          {event.heatLevel && (
            <View style={[s.heatChip, { backgroundColor: heatColor + '33', borderColor: heatColor + '66' }]}>
              <Text style={[s.heatChipText, { color: heatColor }]}>🔥 HEAT LEVEL: {event.heatLevel}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Vibe meter */}
        <View style={s.vibeSection}>
          <Text style={s.vibeSectionLabel}>Vibe Meter</Text>
          <VibeMeter value={event.vibeMeter} large />
        </View>

        {/* Stats grid */}
        <View style={s.statsGrid}>
          <StatCard icon="👥" label="Lotação" value={`${event.crowdLevel}%`} sub={event.crowdLabel} color={crowdColor} />
          <StatCard icon="⏱" label="Fila" value={event.queueMinutes > 0 ? `~${event.queueMinutes}min` : 'Sem fila'} sub={event.queueMinutes > 0 ? 'de espera' : 'Entre já!'} color={event.queueMinutes > 10 ? COLORS.warning : COLORS.success} />
          <StatCard icon="⭐" label="Avaliação" value={event.rating || '—'} sub={`${event.reviewCount} reviews`} color={COLORS.gold} />
          <StatCard icon="♿" label="Acessível" value={event.accessible ? '✓ Sim' : '✗ Não'} sub={event.accessibilityNotes?.slice(0, 14) || ''} color={event.accessible ? COLORS.success : COLORS.danger} />
        </View>

        {/* Now playing */}
        {event.nowPlaying && (
          <View style={s.nowPlayingCard}>
            <View style={s.nowPlayingLeft}>
              <Text style={s.nowPlayingLabel}>🎵 TOCANDO AGORA</Text>
              <Text style={s.nowPlayingArtist}>{event.nowPlaying}</Text>
              {event.nextAct ? <Text style={s.nextAct}>A seguir: {event.nextAct}</Text> : null}
            </View>
            <View style={s.nowPlayingWave}>
              {[14, 22, 18, 28, 16, 24, 20].map((h, i) => (
                <View key={i} style={[s.waveBar, { height: h, backgroundColor: COLORS.primary }]} />
              ))}
            </View>
          </View>
        )}

        {/* Quick rating */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Avaliação Rápida</Text>
          <View style={s.ratingGrid}>
            {RATING_OPTIONS.map(r => (
              <TouchableOpacity key={r.key}
                style={[s.ratingPill, { backgroundColor: r.color + '22', borderColor: selectedRatings.includes(r.key) ? r.color : r.color + '44' }]}
                onPress={() => toggleRating(r.key)}>
                <Text style={s.ratingIcon}>{r.icon}</Text>
                <Text style={[s.ratingLabel, { color: r.color }]}>{r.label}</Text>
                {selectedRatings.includes(r.key) && (
                  <Ionicons name="checkmark-circle" size={12} color={r.color} style={{ marginLeft: 3 }} />
                )}
              </TouchableOpacity>
            ))}
          </View>
          {selectedRatings.length > 0 && !ratingSent && (
            <TouchableOpacity style={s.submitRatingBtn} onPress={() => { setRatingSent(true); Alert.alert('Obrigado! 🙌', 'Avaliação enviada!'); }}>
              <Text style={s.submitRatingText}>Enviar avaliação →</Text>
            </TouchableOpacity>
          )}
          {ratingSent && (
            <View style={s.ratingThanks}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={{ fontSize: 13, color: COLORS.success, fontWeight: '600' }}>Avaliação enviada! Obrigado 🙌</Text>
            </View>
          )}
        </View>

        {/* Coupons */}
        {coupons.length > 0 && (
          <View style={s.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={s.sectionTitle}>Cupons Disponíveis</Text>
              <View style={s.couponCountBadge}>
                <Text style={s.couponCountText}>{coupons.length} cupons</Text>
              </View>
            </View>
            {coupons.map(coupon => {
              const redeemed = isCouponRedeemed(coupon.id);
              const soldOut = coupon.remainingQty === 0;
              const pct = (coupon.remainingQty / coupon.totalQty) * 100;
              return (
                <TouchableOpacity key={coupon.id}
                  style={[s.couponCard, redeemed && { opacity: 0.65 }]}
                  onPress={() => handleRedeem(coupon)} activeOpacity={0.85} disabled={soldOut}>
                  {/* Band */}
                  <View style={[s.couponBand, { backgroundColor: coupon.highlightColor }]}>
                    <Text style={s.couponBandIcon}>{coupon.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.couponBandType}>{coupon.typeLabel}</Text>
                      <Text style={s.couponBandTitle}>{coupon.title}</Text>
                    </View>
                    <View style={s.couponTear} />
                    {redeemed && <View style={s.redeemedBadge}><Text style={s.redeemedText}>✓</Text></View>}
                    {soldOut && !redeemed && <View style={s.soldOutBadge}><Text style={s.soldOutText}>Esgotado</Text></View>}
                  </View>
                  {/* Body */}
                  <View style={s.couponBody}>
                    <Text style={s.couponDesc} numberOfLines={2}>{coupon.description}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <Text style={s.couponQty}>{soldOut ? 'Esgotado' : `${coupon.remainingQty}/${coupon.totalQty} restantes`}</Text>
                      {!redeemed && !soldOut && (
                        <Text style={[s.redeemCTA, { color: coupon.highlightColor }]}>
                          {isNearby ? 'Resgatar →' : '📍 Vá ao local'}
                        </Text>
                      )}
                    </View>
                    <View style={s.couponProgress}>
                      <View style={[s.couponProgressFill, { width: `${pct}%`, backgroundColor: coupon.highlightColor }]} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Feed preview */}
        {posts.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>O que estão dizendo</Text>
            {posts.map(post => (
              <View key={post.id} style={s.feedCard}>
                <View style={[s.feedAvatar, { backgroundColor: post.user.color }]}>
                  <Text style={s.feedAvatarText}>{post.user.initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Text style={s.feedName}>{post.user.name}</Text>
                    {post.verified && (
                      <View style={s.verifiedBadge}>
                        <Text style={s.verifiedText}>✓ No local</Text>
                      </View>
                    )}
                    <Text style={s.feedTime}>{post.time}</Text>
                  </View>
                  <Text style={s.feedText}>{post.text}</Text>
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

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  hero: { height: 240, justifyContent: 'flex-end', position: 'relative' },
  heroOverlay: { ...StyleSheet.absoluteFillObject },
  heroBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 8, position: 'absolute', top: 0, left: 0, right: 0 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  shareBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  nearbyChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full },
  nearbyText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  heroContent: { padding: 16 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.danger, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, alignSelf: 'flex-start', marginBottom: 8 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff', marginRight: 5 },
  liveText: { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  liveCount: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  heroName: { fontSize: 24, fontWeight: '900', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  heroVenue: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  heatChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1, alignSelf: 'flex-start' },
  heatChipText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  vibeSection: { backgroundColor: COLORS.bgCard, margin: 12, borderRadius: RADIUS.lg, padding: 14, borderWidth: 0.5, borderColor: COLORS.border },
  vibeSectionLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 14, borderWidth: 0.5, borderColor: COLORS.border },
  statIcon: { fontSize: 18, marginBottom: 6 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 12, color: COLORS.textSub, marginTop: 2 },
  statSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  nowPlayingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgCard, marginHorizontal: 12, marginTop: 10, borderRadius: RADIUS.lg, padding: 14, borderWidth: 0.5, borderColor: COLORS.primary + '44' },
  nowPlayingLeft: { flex: 1 },
  nowPlayingLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  nowPlayingArtist: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 3 },
  nextAct: { fontSize: 12, color: COLORS.textSub },
  nowPlayingWave: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  waveBar: { width: 4, borderRadius: 2, opacity: 0.85 },
  section: { paddingHorizontal: 12, marginTop: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  ratingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ratingPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1.5 },
  ratingIcon: { fontSize: 14, marginRight: 5 },
  ratingLabel: { fontSize: 12, fontWeight: '600' },
  submitRatingBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingVertical: 13, alignItems: 'center', marginTop: 12 },
  submitRatingText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  ratingThanks: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.success + '22', padding: 10, borderRadius: RADIUS.md, marginTop: 10, borderWidth: 0.5, borderColor: COLORS.success + '44' },
  couponCountBadge: { backgroundColor: COLORS.primary + '22', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, borderWidth: 0.5, borderColor: COLORS.primary + '55' },
  couponCountText: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },
  couponCard: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl, marginBottom: 10, overflow: 'hidden', borderWidth: 0.5, borderColor: COLORS.border },
  couponBand: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  couponBandIcon: { fontSize: 26 },
  couponBandType: { fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  couponBandTitle: { fontSize: 15, fontWeight: '900', color: '#fff' },
  couponTear: { width: 1.5, height: 50, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 6, borderStyle: 'dashed' },
  redeemedBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full },
  redeemedText: { fontSize: 13, color: '#fff', fontWeight: '800' },
  soldOutBadge: { backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full },
  soldOutText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  couponBody: { padding: 12 },
  couponDesc: { fontSize: 13, color: COLORS.textSub, lineHeight: 18 },
  couponQty: { fontSize: 11, color: COLORS.textMuted },
  redeemCTA: { fontSize: 13, fontWeight: '700' },
  couponProgress: { height: 4, backgroundColor: COLORS.bgOverlay, borderRadius: 2, overflow: 'hidden', marginTop: 8 },
  couponProgressFill: { height: '100%', borderRadius: 2 },
  feedCard: { flexDirection: 'row', gap: 10, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 12, marginBottom: 8, borderWidth: 0.5, borderColor: COLORS.border },
  feedAvatar: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  feedAvatarText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  feedName: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  verifiedBadge: { backgroundColor: COLORS.primary + '33', paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.full },
  verifiedText: { fontSize: 10, color: COLORS.primaryLight, fontWeight: '600' },
  feedTime: { fontSize: 11, color: COLORS.textMuted, marginLeft: 'auto' },
  feedText: { fontSize: 13, color: COLORS.textSub, lineHeight: 18 },
});
