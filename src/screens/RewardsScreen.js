import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';
import { BADGES, USER_PROFILE } from '../data/mockData';

function VibberBar({ xp, next }) {
  const pct = Math.min(100, (xp / next) * 100);
  return (
    <View style={s.vibberBarWrap}>
      <View style={s.vibberBarBg}>
        <View style={[s.vibberBarFill, { width: `${pct}%` }]} />
      </View>
      <Text style={s.vibberBarText}>{xp.toLocaleString()} / {next.toLocaleString()} XP</Text>
    </View>
  );
}

function CouponCard({ coupon, isRedeemed, onPress }) {
  const timeLeft = coupon.timerSeconds;
  const h = Math.floor(timeLeft / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const sec = timeLeft % 60;
  const isSoldOut = coupon.remainingQty === 0;

  return (
    <TouchableOpacity style={[s.couponCard, isRedeemed && { opacity: 0.6 }]} onPress={onPress} activeOpacity={0.88} disabled={isSoldOut}>
      <View style={[s.couponBand, { backgroundColor: coupon.gradient[0] }]}>
        <Text style={s.couponIcon}>{coupon.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.couponTypeLabel}>{coupon.typeLabel}</Text>
          <Text style={s.couponTitle}>{coupon.title}</Text>
        </View>
        {/* Ticket tear */}
        <View style={s.couponTear}>
          <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', transform: [{ rotate: '90deg' }], letterSpacing: 2 }}>COUPON</Text>
        </View>
      </View>

      {/* Timer countdown */}
      {timeLeft > 0 && !isRedeemed && (
        <View style={s.timerRow}>
          {[h, m, sec].map((v, i) => (
            <React.Fragment key={i}>
              <View style={s.timerBox}>
                <Text style={s.timerNum}>{String(v).padStart(2, '0')}</Text>
              </View>
              {i < 2 && <Text style={s.timerSep}>:</Text>}
            </React.Fragment>
          ))}
        </View>
      )}

      {isRedeemed && (
        <View style={s.redeemedBanner}>
          <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
          <Text style={s.redeemedText}>Resgatado</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function BadgeGrid({ badges }) {
  return (
    <View style={s.badgeGrid}>
      {badges.map(b => (
        <View key={b.id} style={[s.badgeBox, b.locked && s.badgeBoxLocked]}>
          <Text style={[s.badgeIcon, b.locked && { opacity: 0.4 }]}>{b.icon}</Text>
          {b.locked && (
            <View style={s.badgeLock}>
              <Ionicons name="lock-closed" size={8} color={COLORS.textMuted} />
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

export default function RewardsScreen() {
  const { coupons, isCouponRedeemed, redeemCoupon, nearbyEventIds, currentUser, logout } = useApp();
  const user = USER_PROFILE;

  function handleRedeem(coupon) {
    if (!nearbyEventIds.includes(coupon.eventId)) {
      Alert.alert('📍 Vá ao local', `Chegue até ${coupon.venue} para resgatar.`);
      return;
    }
    if (isCouponRedeemed(coupon.id)) {
      Alert.alert('Já resgatado', 'Você já usou este cupom.');
      return;
    }
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
      {/* Header */}
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="pulse" size={18} color={COLORS.primary} />
          <Text style={s.logo}>LiveVibe</Text>
        </View>
        <Text style={s.headerTitle}>Rewards & Coupons</Text>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <TouchableOpacity style={s.iconBtn}>
            <Ionicons name="notifications-outline" size={20} color={COLORS.text} />
            <View style={s.notifDot} />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={() => Alert.alert('Sair?', '', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sair', onPress: logout }])}>
            <Ionicons name="person-circle-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={s.profileCard}>
          <View style={s.profileTop}>
            <View style={s.profileAvatar}>
              <Text style={s.profileAvatarText}>{currentUser?.avatar || 'U'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.profileName}>{currentUser?.name || user.username}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="location-outline" size={11} color={COLORS.textMuted} />
                <Text style={s.profileSub}>Location</Text>
              </View>
            </View>
            <TouchableOpacity style={s.menuDots}>
              <Ionicons name="ellipsis-vertical" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={s.statusRow}>
            <Text style={s.statusLabel}>Vibber Status: </Text>
            <Text style={[s.statusValue, { color: COLORS.gold }]}>{user.vibberStatus}</Text>
          </View>
          <VibberBar xp={user.vibberXP} next={user.vibberNextLevel} />

          {/* Geo Check-in */}
          <TouchableOpacity style={s.geoBtn}>
            <Text style={{ fontSize: 16 }}>🌐</Text>
            <Text style={s.geoBtnText}>Geo Check-in</Text>
          </TouchableOpacity>
        </View>

        {/* My Coupons */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>My Coupons</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 16 }}>
            {coupons.map(c => (
              <View key={c.id} style={{ width: 240 }}>
                <CouponCard coupon={c} isRedeemed={isCouponRedeemed(c.id)} onPress={() => handleRedeem(c)} />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Unlockable Badges */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Unlockable Badges</Text>
          <BadgeGrid badges={BADGES} />
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
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  iconBtn: { padding: 4, position: 'relative' },
  notifDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.primary, position: 'absolute', top: 4, right: 2, borderWidth: 1, borderColor: COLORS.bg },

  profileCard: { backgroundColor: COLORS.bgCard, marginHorizontal: 16, marginBottom: 6, borderRadius: RADIUS.xl, padding: 16, borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW.sm },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  profileAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primary + '44', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.primary },
  profileAvatarText: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  profileName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  profileSub: { fontSize: 12, color: COLORS.textMuted },
  menuDots: { padding: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statusLabel: { fontSize: 13, color: COLORS.textSub },
  statusValue: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },

  vibberBarWrap: { marginBottom: 14 },
  vibberBarBg: { height: 8, backgroundColor: COLORS.bgOverlay, borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  vibberBarFill: {
    height: '100%', borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  vibberBarText: { fontSize: 11, color: COLORS.textMuted, textAlign: 'right' },

  geoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: RADIUS.full, paddingVertical: 14,
    backgroundColor: COLORS.primary,
  },
  geoBtnText: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  section: { paddingLeft: 16, marginTop: 20, marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 12 },

  couponCard: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 0.5, borderColor: COLORS.border },
  couponBand: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, minHeight: 80 },
  couponIcon: { fontSize: 28 },
  couponTypeLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  couponTitle: { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 0.3 },
  couponTear: { width: 24, alignItems: 'center', borderLeftWidth: 1.5, borderLeftColor: 'rgba(255,255,255,0.25)', borderStyle: 'dashed', paddingLeft: 6, height: 60, justifyContent: 'center' },
  timerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 4 },
  timerBox: { backgroundColor: COLORS.bgOverlay, width: 36, height: 36, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center' },
  timerNum: { fontSize: 16, fontWeight: '800', color: COLORS.text, fontVariant: ['tabular-nums'] },
  timerSep: { fontSize: 18, fontWeight: '900', color: COLORS.textMuted },
  redeemedBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  redeemedText: { fontSize: 13, color: COLORS.success, fontWeight: '600' },

  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingRight: 16 },
  badgeBox: { width: 70, height: 70, borderRadius: RADIUS.lg, backgroundColor: COLORS.bgCard, justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: COLORS.border, position: 'relative' },
  badgeBoxLocked: { borderStyle: 'dashed' },
  badgeIcon: { fontSize: 30 },
  badgeLock: { position: 'absolute', bottom: 4, right: 4, backgroundColor: COLORS.bgOverlay, borderRadius: 6, padding: 2 },
});
