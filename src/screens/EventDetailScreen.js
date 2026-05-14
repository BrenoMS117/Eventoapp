import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { COLORS, RADIUS, SHADOW } from "../utils/theme";
import { PhotoCarousel } from "../components/ImageCarousel";

const { width } = Dimensions.get("window");
const COR_HEAT = {
  BLAZING: "#FF4500",
  HOT: "#E83B5C",
  WARM: "#F59E0B",
  COOL: "#3B82F6",
};

const OPCOES_AVALIACAO = [
  { key: "fogo", icon: "🔥", label: "Intenso", cor: COLORS.primary },
  { key: "tranquilo", icon: "✨", label: "Tranquilo", cor: "#3B82F6" },
  { key: "cheio", icon: "👥", label: "Lotado", cor: COLORS.warning },
  { key: "acessivel", icon: "♿", label: "Acessível", cor: COLORS.success },
  { key: "musica", icon: "🎵", label: "Boa música", cor: COLORS.purple },
  { key: "ruim", icon: "👎", label: "Ruim", cor: COLORS.danger },
];

function VibeMeter({ value }) {
  const cor =
    value > 70 ? COLORS.primary : value > 40 ? COLORS.purple : "#3B82F6";
  return (
    <View>
      <View
        style={{
          height: 10,
          backgroundColor: COLORS.bgOverlay,
          borderRadius: 5,
          overflow: "hidden",
          marginBottom: 4,
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${Math.max(2, value)}%`,
            backgroundColor: cor,
            borderRadius: 5,
          }}
        />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 10, color: COLORS.textMuted }}>Tranquilo</Text>
        <Text style={{ fontSize: 10, color: COLORS.textMuted }}>Intenso</Text>
      </View>
    </View>
  );
}

export default function EventDetailScreen({ route, navigation }) {
  const { eventId } = route.params;
  const {
    events,
    getCouponsForEvent,
    feedPosts,
    redeemCoupon,
    isCouponRedeemed,
    nearbyEventIds,
  } = useApp();
  const [avaliacoesSelecionadas, setAvaliacoesSelecionadas] = useState([]);
  const [avaliacaoEnviada, setAvaliacaoEnviada] = useState(false);

  const evento = events.find((e) => e.id === eventId);
  if (!evento) return null;

  const cupons = getCouponsForEvent(eventId);
  const posts = feedPosts.filter((p) => p.eventId === eventId).slice(0, 3);
  const isProximo = nearbyEventIds.includes(eventId);
  const corHeat = COR_HEAT[evento.heatLevel] || COLORS.primary;
  const corLotacao =
    evento.crowdLevel >= 85
      ? COLORS.danger
      : evento.crowdLevel >= 60
        ? COLORS.warning
        : COLORS.success;

  function toggleAvaliacao(key) {
    if (avaliacaoEnviada) return;
    setAvaliacoesSelecionadas((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  function handleResgatar(cupom) {
    if (!isProximo) {
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
      {/* Hero header */}
      <View style={[s.hero, { backgroundColor: evento.gradient[0] }]}>
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: evento.gradient[1], opacity: 0.5 },
          ]}
        />
        <View style={s.heroBar}>
          <TouchableOpacity
            style={s.voltarBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          {isProximo && (
            <View style={s.proximoChip}>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "#4ade80",
                }}
              />
              <Text style={s.proximoTexto}>Você está aqui</Text>
            </View>
          )}
          <TouchableOpacity style={s.voltarBtn}>
            <Ionicons name="share-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={s.heroContent}>
          {evento.isLive && (
            <View style={s.liveBadge}>
              <View style={s.liveDot} />
              <Text style={s.liveTexto}>AO VIVO</Text>
              <Text style={s.liveContagem}>
                {" "}
                · {evento.checkedInCount.toLocaleString()} aqui
              </Text>
            </View>
          )}
          <Text style={s.heroNome}>{evento.name}</Text>
          <Text style={s.heroVenue}>📍 {evento.venue}</Text>
          {evento.heatLevel && (
            <View
              style={[
                s.heatChip,
                {
                  backgroundColor: corHeat + "33",
                  borderColor: corHeat + "66",
                },
              ]}
            >
              <Text style={[s.heatChipTexto, { color: corHeat }]}>
                🔥 NÍVEL: {evento.heatLevel}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Carrossel de fotos */}
        {evento.photos?.length > 0 && (
          <PhotoCarousel photos={evento.photos} height={240} />
        )}

        {/* Termômetro */}
        <View style={s.vibeSecao}>
          <Text style={s.vibeSecaoLabel}>TERMÔMETRO DO EVENTO</Text>
          <VibeMeter value={evento.vibeMeter} />
        </View>

        {/* Stats */}
        <View style={s.statsGrid}>
          {[
            {
              icon: "👥",
              label: "Lotação",
              valor: `${evento.crowdLevel}%`,
              sub: evento.crowdLabel,
              cor: corLotacao,
            },
            {
              icon: "⏱",
              label: "Fila",
              valor:
                evento.queueMinutes > 0
                  ? `~${evento.queueMinutes}min`
                  : "Sem fila",
              sub: evento.queueMinutes > 0 ? "de espera" : "Entre já!",
              cor: evento.queueMinutes > 10 ? COLORS.warning : COLORS.success,
            },
            {
              icon: "⭐",
              label: "Avaliação",
              valor: evento.rating || "—",
              sub: `${evento.reviewCount} avaliações`,
              cor: COLORS.gold,
            },
            {
              icon: "♿",
              label: "Acessível",
              valor: evento.accessible ? "✓ Sim" : "✗ Não",
              sub: evento.accessibilityNotes?.slice(0, 14) || "",
              cor: evento.accessible ? COLORS.success : COLORS.danger,
            },
          ].map((stat) => (
            <View key={stat.label} style={s.statCard}>
              <Text style={s.statIcon}>{stat.icon}</Text>
              <Text style={[s.statValor, { color: stat.cor }]}>
                {stat.valor}
              </Text>
              <Text style={s.statLabel}>{stat.label}</Text>
              {stat.sub ? <Text style={s.statSub}>{stat.sub}</Text> : null}
            </View>
          ))}
        </View>

        {/* Tocando agora */}
        {evento.nowPlaying && (
          <View style={s.tocandoCard}>
            <View style={{ flex: 1 }}>
              <Text style={s.tocandoLabel}>🎵 TOCANDO AGORA</Text>
              <Text style={s.tocandoArtista}>{evento.nowPlaying}</Text>
              {evento.nextAct ? (
                <Text style={s.proximoArtista}>A seguir: {evento.nextAct}</Text>
              ) : null}
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
            >
              {[14, 22, 18, 28, 16, 24, 20].map((h, i) => (
                <View
                  key={i}
                  style={{
                    width: 4,
                    height: h,
                    borderRadius: 2,
                    backgroundColor: COLORS.primary,
                    opacity: 0.85,
                  }}
                />
              ))}
            </View>
          </View>
        )}

        {/* Avaliação rápida */}
        <View style={s.secao}>
          <Text style={s.secaoTitulo}>AVALIAÇÃO RÁPIDA</Text>
          <View style={s.avaliacaoGrid}>
            {OPCOES_AVALIACAO.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[
                  s.avaliacaoPill,
                  {
                    backgroundColor: r.cor + "22",
                    borderColor: avaliacoesSelecionadas.includes(r.key)
                      ? r.cor
                      : r.cor + "44",
                  },
                ]}
                onPress={() => toggleAvaliacao(r.key)}
              >
                <Text style={s.avaliacaoIcon}>{r.icon}</Text>
                <Text style={[s.avaliacaoLabel, { color: r.cor }]}>
                  {r.label}
                </Text>
                {avaliacoesSelecionadas.includes(r.key) && (
                  <Ionicons
                    name="checkmark-circle"
                    size={12}
                    color={r.cor}
                    style={{ marginLeft: 3 }}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
          {avaliacoesSelecionadas.length > 0 && !avaliacaoEnviada && (
            <TouchableOpacity
              style={s.enviarAvaliacaoBtn}
              onPress={() => {
                setAvaliacaoEnviada(true);
                Alert.alert("Obrigado! 🙌", "Avaliação enviada com sucesso!");
              }}
            >
              <Text style={s.enviarAvaliacaoTexto}>Enviar avaliação →</Text>
            </TouchableOpacity>
          )}
          {avaliacaoEnviada && (
            <View style={s.avaliacaoObrigado}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={COLORS.success}
              />
              <Text
                style={{
                  fontSize: 13,
                  color: COLORS.success,
                  fontWeight: "600",
                }}
              >
                Avaliação enviada! Obrigado 🙌
              </Text>
            </View>
          )}
        </View>

        {/* Cupons */}
        {cupons.length > 0 && (
          <View style={s.secao}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text style={s.secaoTitulo}>CUPONS DISPONÍVEIS</Text>
              <View style={s.cupomContagemBadge}>
                <Text style={s.cupomContagemTexto}>{cupons.length} cupons</Text>
              </View>
            </View>
            {cupons.map((cupom) => {
              const resgatado = isCouponRedeemed(cupom.id);
              const esgotado = cupom.remainingQty === 0;
              const pct = (cupom.remainingQty / cupom.totalQty) * 100;
              return (
                <TouchableOpacity
                  key={cupom.id}
                  style={[s.cupomCard, resgatado && { opacity: 0.65 }]}
                  onPress={() => handleResgatar(cupom)}
                  activeOpacity={0.85}
                  disabled={esgotado}
                >
                  <View
                    style={[
                      s.cupomBanda,
                      { backgroundColor: cupom.highlightColor },
                    ]}
                  >
                    <Text style={s.cupomBandaIcon}>{cupom.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.cupomBandaTipo}>{cupom.typeLabel}</Text>
                      <Text style={s.cupomBandaTitulo}>{cupom.title}</Text>
                    </View>
                    {resgatado && (
                      <View style={s.resgatadoBadge}>
                        <Text style={s.resgatadoTexto}>✓</Text>
                      </View>
                    )}
                    {esgotado && !resgatado && (
                      <View style={s.esgotadoBadge}>
                        <Text style={s.esgotadoTexto}>Esgotado</Text>
                      </View>
                    )}
                  </View>
                  <View style={s.cupomCorpo}>
                    <Text style={s.cupomDesc} numberOfLines={2}>
                      {cupom.description}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 8,
                      }}
                    >
                      <Text style={s.cupomQtd}>
                        {esgotado
                          ? "Esgotado"
                          : `${cupom.remainingQty}/${cupom.totalQty} restantes`}
                      </Text>
                      {!resgatado && !esgotado && (
                        <Text
                          style={[
                            s.resgatarCTA,
                            { color: cupom.highlightColor },
                          ]}
                        >
                          {isProximo ? "Resgatar →" : "📍 Vá ao local"}
                        </Text>
                      )}
                    </View>
                    <View style={s.cupomProgress}>
                      <View
                        style={[
                          s.cupomProgressFill,
                          {
                            width: `${pct}%`,
                            backgroundColor: cupom.highlightColor,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Feed do evento */}
        {posts.length > 0 && (
          <View style={s.secao}>
            <Text style={s.secaoTitulo}>O QUE ESTÃO DIZENDO</Text>
            {posts.map((post) => (
              <View key={post.id} style={s.feedCard}>
                <View
                  style={[s.feedAvatar, { backgroundColor: post.user.color }]}
                >
                  <Text style={s.feedAvatarTexto}>{post.user.initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 4,
                    }}
                  >
                    <Text style={s.feedNome}>{post.user.name}</Text>
                    {post.verified && (
                      <View style={s.verificadoBadge}>
                        <Text style={s.verificadoTexto}>✓ No local</Text>
                      </View>
                    )}
                    <Text style={s.feedTempo}>{post.time}</Text>
                  </View>
                  <Text style={s.feedTexto}>{post.text}</Text>
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
  hero: { height: 200, justifyContent: "flex-end", position: "relative" },
  heroBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 8,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  voltarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  proximoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  proximoTexto: { fontSize: 11, color: "#fff", fontWeight: "600" },
  heroContent: { padding: 16 },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.danger,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
    marginRight: 5,
  },
  liveTexto: {
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1,
  },
  liveContagem: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  heroNome: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroVenue: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 8 },
  heatChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  heatChipTexto: { fontSize: 12, fontWeight: "800", letterSpacing: 0.3 },
  vibeSecao: {
    backgroundColor: COLORS.bgCard,
    margin: 12,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  vibeSecaoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  statIcon: { fontSize: 18, marginBottom: 6 },
  statValor: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 12, color: COLORS.textSub, marginTop: 2 },
  statSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  tocandoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgCard,
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 0.5,
    borderColor: COLORS.primary + "44",
  },
  tocandoLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  tocandoArtista: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 3,
  },
  proximoArtista: { fontSize: 12, color: COLORS.textSub },
  secao: { paddingHorizontal: 12, marginTop: 16 },
  secaoTitulo: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  avaliacaoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  avaliacaoPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
  },
  avaliacaoIcon: { fontSize: 14, marginRight: 5 },
  avaliacaoLabel: { fontSize: 12, fontWeight: "600" },
  enviarAvaliacaoBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 12,
  },
  enviarAvaliacaoTexto: { color: "#fff", fontWeight: "800", fontSize: 14 },
  avaliacaoObrigado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.success + "22",
    padding: 10,
    borderRadius: RADIUS.md,
    marginTop: 10,
    borderWidth: 0.5,
    borderColor: COLORS.success + "44",
  },
  cupomContagemBadge: {
    backgroundColor: COLORS.primary + "22",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 0.5,
    borderColor: COLORS.primary + "55",
  },
  cupomContagemTexto: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "700",
  },
  cupomCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    marginBottom: 10,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  cupomBanda: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
  },
  cupomBandaIcon: { fontSize: 26 },
  cupomBandaTipo: {
    fontSize: 10,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  cupomBandaTitulo: { fontSize: 15, fontWeight: "900", color: "#fff" },
  resgatadoBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  resgatadoTexto: { fontSize: 13, color: "#fff", fontWeight: "800" },
  esgotadoBadge: {
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  esgotadoTexto: { fontSize: 11, color: "#fff", fontWeight: "600" },
  cupomCorpo: { padding: 12 },
  cupomDesc: { fontSize: 13, color: COLORS.textSub, lineHeight: 18 },
  cupomQtd: { fontSize: 11, color: COLORS.textMuted },
  resgatarCTA: { fontSize: 13, fontWeight: "700" },
  cupomProgress: {
    height: 4,
    backgroundColor: COLORS.bgOverlay,
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 8,
  },
  cupomProgressFill: { height: "100%", borderRadius: 2 },
  feedCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  feedAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  feedAvatarTexto: { fontSize: 12, fontWeight: "700", color: "#fff" },
  feedNome: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  verificadoBadge: {
    backgroundColor: COLORS.primary + "33",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  verificadoTexto: {
    fontSize: 10,
    color: COLORS.primaryLight,
    fontWeight: "600",
  },
  feedTempo: { fontSize: 11, color: COLORS.textMuted, marginLeft: "auto" },
  feedTexto: { fontSize: 13, color: COLORS.textSub, lineHeight: 18 },
});
