import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { COLORS, RADIUS, SHADOW } from "../utils/theme";

function QRCode({ codigo, cor }) {
  return (
    <View style={[s.qrWrap, { borderColor: cor }]}>
      <View style={s.qrGrid}>
        {[0, 1, 2, 3, 4, 5, 6].map((linha) => (
          <View key={linha} style={{ flexDirection: "row", gap: 3 }}>
            {[0, 1, 2, 3, 4, 5, 6].map((col) => {
              const canto =
                (linha < 2 && col < 2) ||
                (linha < 2 && col > 4) ||
                (linha > 4 && col < 2);
              const preenchido = canto || Math.sin(linha * col + 2.3) > 0.05;
              return (
                <View
                  key={col}
                  style={[
                    s.qrCelula,
                    { backgroundColor: preenchido ? cor : "transparent" },
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
      <Text style={[s.qrCodigo, { color: cor }]}>{codigo}</Text>
    </View>
  );
}

export default function CouponDetailScreen({ route, navigation }) {
  const { couponId } = route.params;
  const { coupons, redeemCoupon, isCouponRedeemed, nearbyEventIds } = useApp();
  const [mostrarQR, setMostrarQR] = useState(false);

  const cupom = coupons.find((c) => c.id === couponId);
  if (!cupom) return null;

  const resgatado = isCouponRedeemed(couponId);
  const isProximo = nearbyEventIds.includes(cupom.eventId);
  const esgotado = cupom.remainingQty === 0;
  const pct = (cupom.remainingQty / cupom.totalQty) * 100;
  const codigoQR = `LV-${couponId.slice(0, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

  function handleResgatar() {
    if (!isProximo) {
      Alert.alert(
        "📍 Vá ao local",
        `Chegue até ${cupom.venue} para resgatar este cupom.`,
      );
      return;
    }
    Alert.alert("Resgatar agora?", `${cupom.title}\n\n${cupom.conditions}`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Confirmar",
        onPress: () => {
          const r = redeemCoupon(couponId);
          if (r.success) setMostrarQR(true);
          else Alert.alert("Erro", r.error);
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Cabeçalho */}
      <View style={[s.header, { backgroundColor: cupom.highlightColor }]}>
        <TouchableOpacity
          style={s.voltarBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitulo}>Cupom</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[s.hero, { backgroundColor: cupom.highlightColor }]}>
          <View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: cupom.gradient?.[1] || cupom.highlightColor,
                opacity: 0.4,
              },
            ]}
          />
          <Text style={s.heroIcon}>{cupom.icon}</Text>
          <View style={s.heroBadgeTipo}>
            <Text
              style={[s.heroBadgeTipoTexto, { color: cupom.highlightColor }]}
            >
              {cupom.typeLabel.toUpperCase()}
            </Text>
          </View>
          <Text style={s.heroTitulo}>{cupom.title}</Text>
          <Text style={s.heroVenue}>
            {cupom.venue} · {cupom.eventName}
          </Text>
        </View>

        <View style={s.corpo}>
          {/* Banners de status */}
          {resgatado || mostrarQR ? (
            <View style={s.bannerSucesso}>
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={COLORS.success}
              />
              <View>
                <Text style={s.bannerSucessoTitulo}>Cupom resgatado!</Text>
                <Text style={s.bannerSucessoSub}>
                  Mostre o QR Code ao atendente
                </Text>
              </View>
            </View>
          ) : esgotado ? (
            <View style={s.bannerEsgotado}>
              <Ionicons name="close-circle" size={22} color={COLORS.danger} />
              <View>
                <Text style={s.bannerEsgotadoTitulo}>Cupons esgotados</Text>
                <Text style={s.bannerEsgotadoSub}>
                  Todos os cupons foram resgatados
                </Text>
              </View>
            </View>
          ) : isProximo ? (
            <View
              style={[
                s.bannerProximo,
                { borderColor: cupom.highlightColor + "55" },
              ]}
            >
              <View
                style={[
                  s.proximoDot,
                  { backgroundColor: cupom.highlightColor },
                ]}
              />
              <View>
                <Text
                  style={[
                    s.bannerProximoTitulo,
                    { color: cupom.highlightColor },
                  ]}
                >
                  Você está no local!
                </Text>
                <Text style={s.bannerProximoSub}>
                  Pode resgatar este cupom agora
                </Text>
              </View>
            </View>
          ) : (
            <View style={s.bannerLonge}>
              <Ionicons
                name="location-outline"
                size={18}
                color={COLORS.warning}
              />
              <Text style={s.bannerLongeTexto}>
                Chegue até {cupom.venue} para resgatar
              </Text>
            </View>
          )}

          {/* QR Code após resgate */}
          {(resgatado || mostrarQR) && (
            <View style={s.qrSecao}>
              <QRCode codigo={codigoQR} cor={cupom.highlightColor} />
              <Text style={s.qrInstrucoes}>
                Apresente ao atendente do estabelecimento
              </Text>
            </View>
          )}

          {/* Sobre o cupom */}
          <View style={s.infoCard}>
            <Text style={s.infoCardTitulo}>SOBRE ESTE CUPOM</Text>
            <Text style={s.infoCardTexto}>{cupom.description}</Text>
          </View>

          {/* Condições */}
          <View style={s.infoCard}>
            <Text style={s.infoCardTitulo}>CONDIÇÕES DE USO</Text>
            <Text style={s.infoCardTexto}>{cupom.conditions}</Text>
            {cupom.expiresAt && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 10,
                }}
              >
                <Ionicons name="time-outline" size={14} color={COLORS.danger} />
                <Text
                  style={{
                    fontSize: 13,
                    color: COLORS.danger,
                    fontWeight: "600",
                  }}
                >
                  Válido até {cupom.expiresAt}
                </Text>
              </View>
            )}
          </View>

          {/* Disponibilidade */}
          <View style={s.infoCard}>
            <Text style={s.infoCardTitulo}>DISPONIBILIDADE</Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                gap: 4,
                marginBottom: 10,
              }}
            >
              <Text style={[s.qtdGrande, { color: cupom.highlightColor }]}>
                {cupom.remainingQty}
              </Text>
              <Text style={s.qtdSub}>/{cupom.totalQty} restantes</Text>
            </View>
            <View style={s.progressBg}>
              <View
                style={[
                  s.progressFill,
                  { width: `${pct}%`, backgroundColor: cupom.highlightColor },
                ]}
              />
            </View>
            {cupom.remainingQty <= 5 && cupom.remainingQty > 0 && (
              <Text style={s.estoqueTexto}>
                ⚡ Últimas unidades! Resgate agora.
              </Text>
            )}
          </View>

          {/* Botão de resgate */}
          {!resgatado && !mostrarQR && !esgotado && (
            <TouchableOpacity
              style={[
                s.resgatarBtn,
                {
                  backgroundColor: isProximo
                    ? cupom.highlightColor
                    : COLORS.bgOverlay,
                  borderColor: isProximo ? cupom.highlightColor : COLORS.border,
                },
              ]}
              onPress={handleResgatar}
            >
              <Ionicons
                name="ticket"
                size={20}
                color={isProximo ? "#fff" : COLORS.textMuted}
              />
              <Text
                style={[
                  s.resgatarBtnTexto,
                  !isProximo && { color: COLORS.textMuted },
                ]}
              >
                {isProximo
                  ? "Resgatar cupom agora"
                  : "Vá ao local para resgatar"}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
  },
  voltarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitulo: { fontSize: 17, fontWeight: "700", color: "#fff" },
  hero: {
    alignItems: "center",
    paddingTop: 28,
    paddingBottom: 36,
    paddingHorizontal: 20,
    position: "relative",
    overflow: "hidden",
  },
  heroIcon: { fontSize: 56, marginBottom: 14 },
  heroBadgeTipo: {
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    marginBottom: 10,
  },
  heroBadgeTipoTexto: { fontSize: 12, fontWeight: "900", letterSpacing: 1 },
  heroTitulo: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  heroVenue: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  corpo: { padding: 14 },
  bannerSucesso: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.success + "22",
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: COLORS.success + "55",
  },
  bannerSucessoTitulo: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.success,
  },
  bannerSucessoSub: { fontSize: 12, color: COLORS.success },
  bannerEsgotado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.danger + "22",
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: COLORS.danger + "44",
  },
  bannerEsgotadoTitulo: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.danger,
  },
  bannerEsgotadoSub: { fontSize: 12, color: COLORS.danger },
  bannerProximo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
  },
  proximoDot: { width: 12, height: 12, borderRadius: 6 },
  bannerProximoTitulo: { fontSize: 14, fontWeight: "700" },
  bannerProximoSub: { fontSize: 12, color: COLORS.textSub },
  bannerLonge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.warning + "22",
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: COLORS.warning + "44",
  },
  bannerLongeTexto: {
    fontSize: 13,
    color: COLORS.warning,
    flex: 1,
    fontWeight: "500",
  },
  qrSecao: { alignItems: "center", marginBottom: 14 },
  qrWrap: {
    borderWidth: 3,
    borderRadius: RADIUS.xl,
    padding: 18,
    alignItems: "center",
    backgroundColor: COLORS.bgCard,
  },
  qrGrid: { gap: 3 },
  qrCelula: { width: 12, height: 12, borderRadius: 2 },
  qrCodigo: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 12,
  },
  qrInstrucoes: { fontSize: 13, color: COLORS.textSub, marginTop: 10 },
  infoCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  infoCardTitulo: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  infoCardTexto: { fontSize: 14, color: COLORS.text, lineHeight: 21 },
  qtdGrande: { fontSize: 36, fontWeight: "900" },
  qtdSub: { fontSize: 15, color: COLORS.textMuted },
  progressBg: {
    height: 8,
    backgroundColor: COLORS.bgOverlay,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: { height: "100%", borderRadius: 4 },
  estoqueTexto: { fontSize: 12, color: COLORS.danger, fontWeight: "600" },
  resgatarBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: RADIUS.full,
    paddingVertical: 16,
    marginTop: 6,
    borderWidth: 1.5,
    ...SHADOW.glow,
  },
  resgatarBtnTexto: { fontSize: 16, fontWeight: "800", color: "#fff" },
});
