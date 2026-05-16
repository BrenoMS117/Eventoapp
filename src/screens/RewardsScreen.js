import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { COLORS, RADIUS, SHADOW } from "../utils/theme";
const BADGES = [
  { id: "b1", icon: "🎵", label: "Frequentador", locked: false },
  { id: "b2", icon: "🔥", label: "Agitador", locked: false },
  { id: "b3", icon: "⭐", label: "Top Vibber", locked: true },
  { id: "b4", icon: "🏆", label: "Lendário", locked: true },
];

const DEFAULT_PROFILE = {
  username: "Vibber",
  vibberStatus: "Bronze",
  vibberXP: 0,
  vibberNextLevel: 1000,
};

function BarraVibber({ xp, proximo }) {
  const pct = Math.min(100, (xp / proximo) * 100);
  return (
    <View style={s.barraWrap}>
      <View style={s.barraBg}>
        <View style={[s.barraFill, { width: `${pct}%` }]} />
      </View>
      <Text style={s.barraTexto}>
        {xp.toLocaleString()} / {proximo.toLocaleString()} XP
      </Text>
    </View>
  );
}

function CardCupom({ cupom, resgatado, onPress }) {
  const tempoTotal = cupom.timerSeconds;
  const h = Math.floor(tempoTotal / 3600);
  const m = Math.floor((tempoTotal % 3600) / 60);
  const sec = tempoTotal % 60;
  const esgotado = cupom.remainingQty === 0;

  return (
    <TouchableOpacity
      style={[s.cupomCard, resgatado && { opacity: 0.6 }]}
      onPress={onPress}
      activeOpacity={0.88}
      disabled={esgotado}
    >
      <View style={[s.cupomBanda, { backgroundColor: cupom.gradient[0] }]}>
        <Text style={s.cupomIcon}>{cupom.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.cupomTipoLabel}>{cupom.typeLabel}</Text>
          <Text style={s.cupomTitulo}>{cupom.title}</Text>
        </View>
        <View style={s.cupomRasgado}>
          <Text
            style={{
              fontSize: 8,
              color: "rgba(255,255,255,0.5)",
              transform: [{ rotate: "90deg" }],
              letterSpacing: 2,
            }}
          >
            CUPOM
          </Text>
        </View>
      </View>

      {tempoTotal > 0 && !resgatado && (
        <View style={s.timerRow}>
          {[h, m, sec].map((v, i) => (
            <React.Fragment key={i}>
              <View style={s.timerBox}>
                <Text style={s.timerNum}>{String(v).padStart(2, "0")}</Text>
              </View>
              {i < 2 && <Text style={s.timerSep}>:</Text>}
            </React.Fragment>
          ))}
        </View>
      )}

      {resgatado && (
        <View style={s.resgatadoBanner}>
          <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
          <Text style={s.resgatadoTexto}>Resgatado</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function RewardsScreen() {
  const {
    coupons,
    isCouponRedeemed,
    redeemCoupon,
    nearbyEventIds,
    currentUser,
    logout,
  } = useApp();
  const perfil = DEFAULT_PROFILE;

  function handleResgatar(cupom) {
    if (!nearbyEventIds.includes(cupom.eventId)) {
      Alert.alert("📍 Vá ao local", `Chegue até ${cupom.venue} para resgatar.`);
      return;
    }
    if (isCouponRedeemed(cupom.id)) {
      Alert.alert("Já resgatado", "Você já usou este cupom.");
      return;
    }
    Alert.alert(`Resgatar: ${cupom.title}`, cupom.description, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Resgatar agora",
        onPress: () => {
          const r = redeemCoupon(cupom.id);
          if (r.success)
            Alert.alert(
              "✅ Resgatado!",
              `Apresente ao atendente de ${cupom.venue}.`,
            );
          else Alert.alert("Erro", r.error);
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Cabeçalho */}
      <View style={s.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="pulse" size={18} color={COLORS.primary} />
          <Text style={s.logo}>LiveVibe</Text>
        </View>
        <Text style={s.headerTitulo}>Recompensas e Cupons</Text>
        <View style={{ flexDirection: "row", gap: 4 }}>
          <TouchableOpacity style={s.iconBtn}>
            <Ionicons
              name="notifications-outline"
              size={20}
              color={COLORS.text}
            />
            <View style={s.notifDot} />
          </TouchableOpacity>
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => {
               if (Platform.OS === 'web') {
                 if (window.confirm('Deseja sair?')) logout();
                 } else {
                  Alert.alert('Sair', 'Deseja sair?', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Sair', onPress: logout },
                  ]);
                }
             }}
          >
            <Ionicons
              name="person-circle-outline"
              size={24}
              color={COLORS.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cartão de perfil */}
        <View style={s.perfilCard}>
          <View style={s.perfilTopo}>
            <View style={s.perfilAvatar}>
              <Text style={s.perfilAvatarTexto}>
                {currentUser?.avatar || "U"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.perfilNome}>
                {currentUser?.name || perfil.username}
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Ionicons
                  name="location-outline"
                  size={11}
                  color={COLORS.textMuted}
                />
                <Text style={s.perfilSub}>Localização</Text>
              </View>
            </View>
            <TouchableOpacity style={s.menuDots}>
              <Ionicons
                name="ellipsis-vertical"
                size={18}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>

          <View style={s.statusRow}>
            <Text style={s.statusLabel}>Status Vibber: </Text>
            <Text style={[s.statusValor, { color: COLORS.gold }]}>
              {perfil.vibberStatus}
            </Text>
          </View>
          <BarraVibber xp={perfil.vibberXP} proximo={perfil.vibberNextLevel} />

          {/* Geo Check-in */}
          <TouchableOpacity style={s.geoBtn}>
            <Text style={{ fontSize: 16 }}>🌐</Text>
            <Text style={s.geoBtnTexto}>Fazer Check-in</Text>
          </TouchableOpacity>
        </View>

        {/* Meus Cupons */}
        <View style={s.secao}>
          <Text style={s.secaoTitulo}>Meus Cupons</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 16 }}
          >
            {coupons.map((c) => (
              <View key={c.id} style={{ width: 240 }}>
                <CardCupom
                  cupom={c}
                  resgatado={isCouponRedeemed(c.id)}
                  onPress={() => handleResgatar(c)}
                />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Conquistas */}
        <View style={s.secao}>
          <Text style={s.secaoTitulo}>Conquistas Desbloqueáveis</Text>
          <View style={s.conquistasGrid}>
            {BADGES.map((b) => (
              <View
                key={b.id}
                style={[s.conquistaBox, b.locked && s.conquistaBoxBloqueada]}
              >
                <Text style={[s.conquistaIcon, b.locked && { opacity: 0.4 }]}>
                  {b.icon}
                </Text>
                <Text
                  style={[
                    s.conquistaLabel,
                    b.locked && { color: COLORS.textMuted },
                  ]}
                >
                  {b.label}
                </Text>
                {b.locked && (
                  <View style={s.cadeado}>
                    <Ionicons
                      name="lock-closed"
                      size={8}
                      color={COLORS.textMuted}
                    />
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  logo: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  headerTitulo: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },
  iconBtn: { padding: 4, position: "relative" },
  notifDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    position: "absolute",
    top: 4,
    right: 2,
    borderWidth: 1,
    borderColor: COLORS.bg,
  },
  perfilCard: {
    backgroundColor: COLORS.bgCard,
    marginHorizontal: 16,
    marginBottom: 6,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  perfilTopo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  perfilAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary + "44",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  perfilAvatarTexto: { fontSize: 20, fontWeight: "800", color: COLORS.primary },
  perfilNome: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  perfilSub: { fontSize: 12, color: COLORS.textMuted },
  menuDots: { padding: 4 },
  statusRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  statusLabel: { fontSize: 13, color: COLORS.textSub },
  statusValor: { fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
  barraWrap: { marginBottom: 14 },
  barraBg: {
    height: 8,
    backgroundColor: COLORS.bgOverlay,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  barraFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  barraTexto: { fontSize: 11, color: COLORS.textMuted, textAlign: "right" },
  geoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: RADIUS.full,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
  },
  geoBtnTexto: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  secao: { paddingLeft: 16, marginTop: 20, marginBottom: 4 },
  secaoTitulo: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  cupomCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  cupomBanda: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    minHeight: 80,
  },
  cupomIcon: { fontSize: 28 },
  cupomTipoLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  cupomTitulo: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.3,
  },
  cupomRasgado: {
    width: 24,
    alignItems: "center",
    borderLeftWidth: 1.5,
    borderLeftColor: "rgba(255,255,255,0.25)",
    borderStyle: "dashed",
    paddingLeft: 6,
    height: 60,
    justifyContent: "center",
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 4,
  },
  timerBox: {
    backgroundColor: COLORS.bgOverlay,
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  timerNum: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  timerSep: { fontSize: 18, fontWeight: "900", color: COLORS.textMuted },
  resgatadoBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  resgatadoTexto: { fontSize: 13, color: COLORS.success, fontWeight: "600" },
  conquistasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingRight: 16,
  },
  conquistaBox: {
    width: 80,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: 10,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: COLORS.border,
    position: "relative",
  },
  conquistaBoxBloqueada: { borderStyle: "dashed" },
  conquistaIcon: { fontSize: 28, marginBottom: 4 },
  conquistaLabel: {
    fontSize: 10,
    color: COLORS.textSub,
    fontWeight: "600",
    textAlign: "center",
  },
  cadeado: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: COLORS.bgOverlay,
    borderRadius: 6,
    padding: 2,
  },
});
