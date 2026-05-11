import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

function QRCode({ code, color }) {
  return (
    <View style={[s.qrWrap, { borderColor: color }]}>
      <View style={s.qrGrid}>
        {[0,1,2,3,4,5,6].map(row => (
          <View key={row} style={{ flexDirection: 'row', gap: 3 }}>
            {[0,1,2,3,4,5,6].map(col => {
              const isCorner = (row < 2 && col < 2) || (row < 2 && col > 4) || (row > 4 && col < 2);
              const filled = isCorner || Math.sin(row * col + 2.3) > 0.05;
              return <View key={col} style={[s.qrCell, { backgroundColor: filled ? color : 'transparent' }]} />;
            })}
          </View>
        ))}
      </View>
      <Text style={[s.qrCode, { color }]}>{code}</Text>
    </View>
  );
}

export default function CouponDetailScreen({ route, navigation }) {
  const { couponId } = route.params;
  const { coupons, redeemCoupon, isCouponRedeemed, nearbyEventIds } = useApp();
  const [showQR, setShowQR] = useState(false);

  const coupon = coupons.find(c => c.id === couponId);
  if (!coupon) return null;

  const isRedeemed = isCouponRedeemed(couponId);
  const isNearby = nearbyEventIds.includes(coupon.eventId);
  const isSoldOut = coupon.remainingQty === 0;
  const pct = (coupon.remainingQty / coupon.totalQty) * 100;
  const qrCode = `LV-${couponId.slice(0, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

  function handleRedeem() {
    if (!isNearby) { Alert.alert('📍 Vá ao local', `Chegue até ${coupon.venue} para resgatar este cupom.`); return; }
    Alert.alert('Resgatar agora?', `${coupon.title}\n\n${coupon.conditions}`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: () => {
        const r = redeemCoupon(couponId);
        if (r.success) setShowQR(true);
        else Alert.alert('Erro', r.error);
      }},
    ]);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: coupon.highlightColor }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Cupom</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[s.hero, { backgroundColor: coupon.highlightColor }]}>
          <View style={[s.heroGlow, { backgroundColor: coupon.gradient[1] || coupon.highlightColor, opacity: 0.4 }]} />
          <Text style={s.heroIcon}>{coupon.icon}</Text>
          <View style={s.heroTypeBadge}>
            <Text style={[s.heroTypeText, { color: coupon.highlightColor }]}>{coupon.typeLabel.toUpperCase()}</Text>
          </View>
          <Text style={s.heroTitle}>{coupon.title}</Text>
          <Text style={s.heroVenue}>{coupon.venue} · {coupon.eventName}</Text>
        </View>

        <View style={s.body}>
          {/* Status banners */}
          {isRedeemed || showQR ? (
            <View style={s.successBanner}>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
              <View>
                <Text style={s.successTitle}>Cupom resgatado!</Text>
                <Text style={s.successSub}>Mostre o QR Code ao atendente</Text>
              </View>
            </View>
          ) : isSoldOut ? (
            <View style={s.soldOutBanner}>
              <Ionicons name="close-circle" size={22} color={COLORS.danger} />
              <View>
                <Text style={s.soldOutTitle}>Cupons esgotados</Text>
                <Text style={s.soldOutSub}>Todos os cupons foram resgatados</Text>
              </View>
            </View>
          ) : isNearby ? (
            <View style={[s.nearbyBanner, { borderColor: coupon.highlightColor + '55' }]}>
              <View style={[s.nearbyDot, { backgroundColor: coupon.highlightColor }]} />
              <View>
                <Text style={[s.nearbyTitle, { color: coupon.highlightColor }]}>Você está no local!</Text>
                <Text style={s.nearbySub}>Pode resgatar este cupom agora</Text>
              </View>
            </View>
          ) : (
            <View style={s.farBanner}>
              <Ionicons name="location-outline" size={18} color={COLORS.warning} />
              <Text style={s.farText}>Chegue a {coupon.venue} para resgatar</Text>
            </View>
          )}

          {/* QR code after redemption */}
          {(isRedeemed || showQR) && (
            <View style={s.qrSection}>
              <QRCode code={qrCode} color={coupon.highlightColor} />
              <Text style={s.qrInstructions}>Apresente ao atendente do estabelecimento</Text>
            </View>
          )}

          {/* About */}
          <View style={s.infoCard}>
            <Text style={s.infoCardTitle}>Sobre este cupom</Text>
            <Text style={s.infoCardText}>{coupon.description}</Text>
          </View>

          {/* Conditions */}
          <View style={s.infoCard}>
            <Text style={s.infoCardTitle}>Condições</Text>
            <Text style={s.infoCardText}>{coupon.conditions}</Text>
            {coupon.expiresAt && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
                <Ionicons name="time-outline" size={14} color={COLORS.danger} />
                <Text style={{ fontSize: 13, color: COLORS.danger, fontWeight: '600' }}>Válido até {coupon.expiresAt}</Text>
              </View>
            )}
          </View>

          {/* Availability */}
          <View style={s.infoCard}>
            <Text style={s.infoCardTitle}>Disponibilidade</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 10 }}>
              <Text style={[s.qtyBig, { color: coupon.highlightColor }]}>{coupon.remainingQty}</Text>
              <Text style={s.qtySub}>/{coupon.totalQty} restantes</Text>
            </View>
            <View style={s.progressBg}>
              <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: coupon.highlightColor }]} />
            </View>
            {coupon.remainingQty <= 5 && coupon.remainingQty > 0 && (
              <Text style={s.lowStockText}>⚡ Últimas unidades! Resgate agora.</Text>
            )}
          </View>

          {/* CTA */}
          {!isRedeemed && !showQR && !isSoldOut && (
            <TouchableOpacity
              style={[s.redeemBtn, { backgroundColor: isNearby ? coupon.highlightColor : COLORS.bgOverlay, borderColor: isNearby ? coupon.highlightColor : COLORS.border }]}
              onPress={handleRedeem}>
              <Ionicons name="ticket" size={20} color={isNearby ? '#fff' : COLORS.textMuted} />
              <Text style={[s.redeemBtnText, !isNearby && { color: COLORS.textMuted }]}>
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

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  hero: { alignItems: 'center', paddingTop: 28, paddingBottom: 36, paddingHorizontal: 20, position: 'relative', overflow: 'hidden' },
  heroGlow: { ...StyleSheet.absoluteFillObject },
  heroIcon: { fontSize: 56, marginBottom: 14 },
  heroTypeBadge: { backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 14, paddingVertical: 5, borderRadius: RADIUS.full, marginBottom: 10 },
  heroTypeText: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 6, textTransform: 'uppercase' },
  heroVenue: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  body: { padding: 14 },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.success + '22', borderRadius: RADIUS.lg, padding: 14, marginBottom: 14, borderWidth: 0.5, borderColor: COLORS.success + '55' },
  successTitle: { fontSize: 14, fontWeight: '700', color: COLORS.success },
  successSub: { fontSize: 12, color: COLORS.success },
  soldOutBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.danger + '22', borderRadius: RADIUS.lg, padding: 14, marginBottom: 14, borderWidth: 0.5, borderColor: COLORS.danger + '44' },
  soldOutTitle: { fontSize: 14, fontWeight: '700', color: COLORS.danger },
  soldOutSub: { fontSize: 12, color: COLORS.danger },
  nearbyBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 14, marginBottom: 14, borderWidth: 1.5 },
  nearbyDot: { width: 12, height: 12, borderRadius: 6 },
  nearbyTitle: { fontSize: 14, fontWeight: '700' },
  nearbySub: { fontSize: 12, color: COLORS.textSub },
  farBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.warning + '22', borderRadius: RADIUS.lg, padding: 12, marginBottom: 14, borderWidth: 0.5, borderColor: COLORS.warning + '44' },
  farText: { fontSize: 13, color: COLORS.warning, flex: 1, fontWeight: '500' },
  qrSection: { alignItems: 'center', marginBottom: 14 },
  qrWrap: { borderWidth: 3, borderRadius: RADIUS.xl, padding: 18, alignItems: 'center', backgroundColor: COLORS.bgCard },
  qrGrid: { gap: 3 },
  qrCell: { width: 12, height: 12, borderRadius: 2 },
  qrCode: { fontSize: 13, fontWeight: '800', letterSpacing: 2, marginTop: 12, fontVariant: ['tabular-nums'] },
  qrInstructions: { fontSize: 13, color: COLORS.textSub, marginTop: 10 },
  infoCard: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: COLORS.border },
  infoCardTitle: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  infoCardText: { fontSize: 14, color: COLORS.text, lineHeight: 21 },
  qtyBig: { fontSize: 36, fontWeight: '900' },
  qtySub: { fontSize: 15, color: COLORS.textMuted },
  progressBg: { height: 8, backgroundColor: COLORS.bgOverlay, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 4 },
  lowStockText: { fontSize: 12, color: COLORS.danger, fontWeight: '600' },
  redeemBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: RADIUS.full, paddingVertical: 16, marginTop: 6, borderWidth: 1.5, ...SHADOW.glow },
  redeemBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
