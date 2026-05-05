import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

function QRPlaceholder({ code, color }) {
  return (
    <View style={[styles.qrWrapper, { borderColor: color }]}>
      <View style={styles.qrInner}>
        {[0,1,2,3,4,5,6].map(row => (
          <View key={row} style={styles.qrRow}>
            {[0,1,2,3,4,5,6].map(col => {
              const isCorner = (row < 2 && col < 2) || (row < 2 && col > 4) || (row > 4 && col < 2);
              const isFilled = isCorner || (Math.sin(row * col + 1.5) > 0.1);
              return <View key={col} style={[styles.qrCell, { backgroundColor: isFilled ? color : 'transparent' }]} />;
            })}
          </View>
        ))}
      </View>
      <Text style={[styles.qrCode, { color }]}>{code}</Text>
    </View>
  );
}

export default function CouponDetailScreen({ route, navigation }) {
  const { couponId } = route.params;
  const { coupons, redeemCoupon, isCouponRedeemed, nearbyEventIds, events } = useApp();
  const [showQR, setShowQR] = useState(false);

  const coupon = coupons.find(c => c.id === couponId);
  if (!coupon) return null;

  const isRedeemed = isCouponRedeemed(couponId);
  const isNearby = nearbyEventIds.includes(coupon.eventId);
  const isSoldOut = coupon.remainingQty === 0;
  const qrCode = `EVT-${couponId.toUpperCase()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
  const pct = coupon.remainingQty / coupon.totalQty;

  function handleRedeem() {
    if (!isNearby) { Alert.alert('📍 Você precisa estar no local', `Chegue até ${coupon.venue} para resgatar este cupom.`); return; }
    Alert.alert('Resgatar agora?', `${coupon.title}\n\n${coupon.conditions}`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar resgate', onPress: () => {
        const result = redeemCoupon(couponId);
        if (result.success) setShowQR(true);
        else Alert.alert('Erro', result.error);
      }},
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.header, { backgroundColor: coupon.highlightColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cupom</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: coupon.highlightColor }]}>
          <Text style={styles.heroIcon}>{coupon.icon}</Text>
          <View style={styles.heroTypeBadge}>
            <Text style={[styles.heroTypeText, { color: coupon.highlightColor }]}>{coupon.typeLabel}</Text>
          </View>
          <Text style={styles.heroTitle}>{coupon.title}</Text>
          <Text style={styles.heroVenue}>{coupon.venue}</Text>
        </View>

        <View style={styles.body}>
          {isRedeemed || showQR ? (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
              <View style={{ flex: 1 }}>
                <Text style={styles.successTitle}>Cupom resgatado!</Text>
                <Text style={styles.successSub}>Apresente o QR Code ao atendente</Text>
              </View>
            </View>
          ) : isSoldOut ? (
            <View style={styles.soldOutBanner}>
              <Ionicons name="close-circle" size={22} color={COLORS.danger} />
              <View><Text style={styles.soldOutTitle}>Cupons esgotados</Text></View>
            </View>
          ) : isNearby ? (
            <View style={styles.nearbyBanner}>
              <View style={styles.nearbyDot} />
              <View><Text style={styles.nearbyTitle}>Você está no local!</Text><Text style={styles.nearbySub}>Pode resgatar este cupom agora</Text></View>
            </View>
          ) : (
            <View style={styles.farBanner}>
              <Ionicons name="location-outline" size={18} color={COLORS.amber} />
              <Text style={styles.farText}>Chegue ao {coupon.venue} para resgatar</Text>
            </View>
          )}

          {(isRedeemed || showQR) && (
            <View style={styles.qrSection}>
              <QRPlaceholder code={qrCode} color={coupon.highlightColor} />
              <Text style={styles.qrInstructions}>Mostre este código ao atendente</Text>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Sobre este cupom</Text>
            <Text style={styles.cardText}>{coupon.description}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Condições</Text>
            <Text style={styles.cardText}>{coupon.conditions}</Text>
            {coupon.expiresAt && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 }}>
              <Ionicons name="time-outline" size={14} color={COLORS.danger} />
              <Text style={{ fontSize: 13, color: COLORS.danger, fontWeight: '500' }}>Válido até {coupon.expiresAt}</Text>
            </View>}
          </View>
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Disponibilidade</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
              <Text style={{ fontSize: 32, fontWeight: '700', color: COLORS.text }}>{coupon.remainingQty}</Text>
              <Text style={{ fontSize: 14, color: COLORS.textSecondary }}>/{coupon.totalQty} restantes</Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: coupon.highlightColor }]} />
            </View>
            {coupon.remainingQty <= 5 && coupon.remainingQty > 0 && <Text style={{ fontSize: 12, color: COLORS.danger, fontWeight: '500', marginTop: 6 }}>⚡ Últimas unidades!</Text>}
          </View>

          {!isRedeemed && !showQR && !isSoldOut && (
            <TouchableOpacity style={[styles.redeemBtn, { backgroundColor: isNearby ? coupon.highlightColor : COLORS.border }]} onPress={handleRedeem}>
              <Ionicons name="ticket" size={18} color={isNearby ? '#fff' : COLORS.textMuted} />
              <Text style={[styles.redeemBtnText, !isNearby && { color: COLORS.textMuted }]}>
                {isNearby ? 'Resgatar cupom agora' : 'Vá ao local para resgatar'}
              </Text>
            </TouchableOpacity>
          )}
          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 14 },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#fff' },
  hero: { alignItems: 'center', paddingTop: 24, paddingBottom: 32, paddingHorizontal: 20 },
  heroIcon: { fontSize: 52, marginBottom: 12 },
  heroTypeBadge: { backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: RADIUS.full, marginBottom: 10 },
  heroTypeText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 6 },
  heroVenue: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  body: { padding: 12 },
  successBanner: { backgroundColor: COLORS.successLight, borderRadius: RADIUS.md, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  successTitle: { fontSize: 14, fontWeight: '600', color: COLORS.success },
  successSub: { fontSize: 12, color: COLORS.success },
  soldOutBanner: { backgroundColor: COLORS.dangerLight, borderRadius: RADIUS.md, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  soldOutTitle: { fontSize: 14, fontWeight: '600', color: COLORS.danger },
  nearbyBanner: { backgroundColor: COLORS.successLight, borderRadius: RADIUS.md, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  nearbyDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.success },
  nearbyTitle: { fontSize: 14, fontWeight: '600', color: COLORS.success },
  nearbySub: { fontSize: 12, color: COLORS.success },
  farBanner: { backgroundColor: COLORS.amberLight, borderRadius: RADIUS.md, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  farText: { fontSize: 13, color: COLORS.amber, flex: 1 },
  qrSection: { alignItems: 'center', marginBottom: 14 },
  qrWrapper: { borderWidth: 3, borderRadius: RADIUS.lg, padding: 16, alignItems: 'center', backgroundColor: COLORS.surface },
  qrInner: { gap: 3 },
  qrRow: { flexDirection: 'row', gap: 3 },
  qrCell: { width: 12, height: 12, borderRadius: 2 },
  qrCode: { fontSize: 12, fontWeight: '700', letterSpacing: 2, marginTop: 10 },
  qrInstructions: { fontSize: 13, color: COLORS.textSecondary, marginTop: 8 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: COLORS.border },
  cardSectionTitle: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  cardText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  progressBg: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  redeemBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: RADIUS.lg, paddingVertical: 16, marginTop: 6 },
  redeemBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});