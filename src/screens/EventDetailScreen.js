import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { COLORS, RADIUS, SHADOW } from "../utils/theme";
import { PhotoCarousel } from "../components/ImageCarousel";
import { RATING_OPTIONS, RATING_MAP } from "../services/ratings/ratingDefinitions";

const { width } = Dimensions.get("window");

function fmtDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}
function fmtTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return typeof iso === 'string' && iso.includes(':') ? iso : null;
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}


// ─── RatingSection ───────────────────────────────────────────────────────────

function RatingSection({ evento, userRating, onVote, canVote, isOwner }) {
  const [submitting, setSubmitting] = useState(null);
  const [feedback, setFeedback]     = useState(false);

  const counts   = userRating?.counts   ?? {};
  const userVote = userRating?.userVote ?? null;
  const featured = userRating?.featured ?? null;
  const total    = Object.values(counts).reduce((a, b) => a + b, 0);

  async function handleVote(category) {
    if (!canVote || submitting) return;
    if (category === userVote) return;
    setSubmitting(category);
    const result = await onVote(evento.id, category);
    setSubmitting(null);
    if (result?.error) {
      Alert.alert('Avaliação', result.error);
    } else {
      setFeedback(true);
      setTimeout(() => setFeedback(false), 2800);
    }
  }

  return (
    <View style={rs.wrap}>
      {featured?.isClear && (
        <View style={[rs.featBanner, { borderColor: featured.cor + '55' }]}>
          <Text style={rs.featLabel}>CARACTERÍSTICA EM DESTAQUE</Text>
          <View style={rs.featRow}>
            <View style={{ flex: 1 }}>
              <Text style={[rs.featName, { color: featured.cor }]}>{featured.label}</Text>
              <View style={rs.featBarBg}>
                <View style={[rs.featBarFill, { width: `${featured.pct}%`, backgroundColor: featured.cor }]} />
              </View>
            </View>
            <View style={rs.featStats}>
              <Text style={[rs.featPct, { color: featured.cor }]}>{featured.pct}%</Text>
              <Text style={rs.featCount}>{featured.votes} votos</Text>
            </View>
          </View>
        </View>
      )}

      <View style={rs.header}>
        <Text style={rs.headerTitle}>
          {isOwner ? 'PERCEPÇÃO DO PÚBLICO' : 'COMO ESTÁ O EVENTO?'}
        </Text>
        {total > 0 && (
          <Text style={rs.headerCount}>{total} {total === 1 ? 'avaliação' : 'avaliações'}</Text>
        )}
      </View>

      <View style={rs.grid}>
        {RATING_OPTIONS.map((opt) => {
          const count      = counts[opt.key] ?? 0;
          const pct        = total > 0 ? Math.round((count / total) * 100) : 0;
          const isVoted    = userVote === opt.key;
          const isTop      = featured?.category === opt.key;
          const isBusy     = submitting === opt.key;
          const isDisabled = !canVote || !!submitting;

          return (
            <TouchableOpacity
              key={opt.key}
              style={[
                rs.pill,
                isVoted && { borderColor: opt.cor, backgroundColor: opt.cor + '28' },
                isTop && !isVoted && { borderColor: opt.cor + '77' },
              ]}
              onPress={() => handleVote(opt.key)}
              disabled={isDisabled}
              activeOpacity={canVote ? 0.72 : 1}
            >
              {pct > 0 && !isVoted && (
                <View
                  style={[
                    rs.pillProgress,
                    { width: `${pct}%`, backgroundColor: opt.cor + '14' },
                  ]}
                />
              )}

              {isBusy && (
                <ActivityIndicator size="small" color={opt.cor} style={rs.pillIconSlot} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={[rs.pillLabel, isVoted && { color: opt.cor, fontWeight: '800' }]}>
                  {opt.label}
                </Text>
                <Text style={[rs.pillVotes, isTop && { color: opt.cor, fontWeight: '600' }]}>
                  {count > 0 ? `${count} votos` : '—'}
                </Text>
              </View>
              {isVoted && (
                <Ionicons name="star" size={13} color={opt.cor} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {feedback && (
        <View style={rs.feedbackRow}>
          <Ionicons name="checkmark-circle" size={15} color={COLORS.success} />
          <Text style={rs.feedbackText}>Avaliação registrada!</Text>
        </View>
      )}
      {!feedback && userVote && (
        <View style={rs.votedRow}>
          <Ionicons name="star" size={13} color={RATING_MAP[userVote]?.cor ?? COLORS.primary} />
          <Text style={rs.votedText}>
            Você votou: {RATING_MAP[userVote]?.label}
            {canVote ? ' — toque em outra para mudar' : ''}
          </Text>
        </View>
      )}
      {isOwner && (
        <Text style={rs.hintText}>Donos de estabelecimento visualizam em modo leitura</Text>
      )}
      {!canVote && !isOwner && (
        <Text style={rs.hintText}>Vá ao local para avaliar</Text>
      )}
    </View>
  );
}

const rs = StyleSheet.create({
  wrap: { paddingHorizontal: 12, marginTop: 16 },

  // ── Banner em destaque ──
  featBanner: {
    backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 14,
    borderWidth: 1, marginBottom: 16,
  },
  featLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
  },
  featRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featIcon: { fontSize: 30 },
  featName: { fontSize: 17, fontWeight: '900', marginBottom: 6 },
  featBarBg: {
    height: 6, backgroundColor: COLORS.bgOverlay,
    borderRadius: 3, overflow: 'hidden',
  },
  featBarFill: { height: '100%', borderRadius: 3 },
  featStats: { alignItems: 'flex-end', minWidth: 52 },
  featPct: { fontSize: 24, fontWeight: '900', lineHeight: 26 },
  featCount: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  // ── Cabeçalho ──
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'baseline', marginBottom: 12,
  },
  headerTitle: {
    fontSize: 12, fontWeight: '800', color: COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  headerCount: { fontSize: 11, color: COLORS.textMuted },

  // ── Opções ──
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 58,
  },
  pillProgress: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0,
    borderRadius: 12,
  },
  pillIconSlot: { width: 22, alignItems: 'center' },
  pillIcon: { fontSize: 20 },
  pillLabel: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  pillVotes: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  trophyIcon: { fontSize: 13 },

  // ── Status do usuário ──
  votedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.bgOverlay, borderRadius: 10,
    padding: 10, marginTop: 10,
  },
  votedText: { fontSize: 12, color: COLORS.textSub, flex: 1 },
  feedbackRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.success + '22', borderRadius: 10,
    padding: 10, marginTop: 10,
    borderWidth: 0.5, borderColor: COLORS.success + '44',
  },
  feedbackText: { fontSize: 13, fontWeight: '700', color: COLORS.success },
  hintText: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginTop: 10 },
});

// ─── CrowdPanel ──────────────────────────────────────────────────────────────

function CrowdPanel({ evento }) {
  const level = evento.crowdLevel ?? 0;
  const barColor =
    level >= 85 ? COLORS.danger
    : level >= 60 ? COLORS.warning
    : level >= 30 ? COLORS.primary
    : COLORS.success;

  return (
    <View style={cs.panel}>
      <Text style={cs.panelLabel}>PÚBLICO AO VIVO</Text>

      <View style={cs.barBg}>
        <View style={[cs.barFill, { width: `${Math.max(2, level)}%`, backgroundColor: barColor }]} />
      </View>

      <View style={cs.statsRow}>
        <View>
          <Text style={[cs.levelPct, { color: barColor }]}>{level}%</Text>
          <Text style={cs.levelLabel}>{evento.crowdLabel ?? 'Aguardando'}</Text>
        </View>
        {evento.maxCapacity ? (
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={cs.capacityNum}>{evento.maxCapacity} pessoas</Text>
            <Text style={cs.capacitySub}>capacidade máxima</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const cs = StyleSheet.create({
  panel: {
    backgroundColor: COLORS.bgCard,
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 16,
    padding: 14,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  panelLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
  },
  barBg: {
    height: 12, backgroundColor: COLORS.bgOverlay,
    borderRadius: 6, overflow: 'hidden', marginBottom: 10,
  },
  barFill: { height: '100%', borderRadius: 6 },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  levelPct: { fontSize: 28, fontWeight: '900', lineHeight: 32 },
  levelLabel: { fontSize: 12, color: COLORS.textSub, marginTop: 2 },
  capacityNum: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  capacitySub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
});


export default function EventDetailScreen({ route, navigation }) {
  const { eventId } = route.params;
  const {
    events,
    getCouponsForEvent,
    feedPosts,
    redeemCoupon,
    isCouponRedeemed,
    nearbyEventIds,
    currentUser,
    subscribeToEventRatings,
    getEventRatings,
    submitRating,
    canVoteOnEvent,
    canRedeemCoupon,
  } = useApp();

  useEffect(() => {
    subscribeToEventRatings(eventId);
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  const evento = events.find((e) => e.id === eventId);
  if (!evento) return null;

  const cupons = getCouponsForEvent(eventId);
  const eventoPosts = feedPosts.filter((p) => p.eventId === eventId);
  const posts = eventoPosts.slice(0, 3);
  const filaCount = eventoPosts.filter((p) => p.type === 'lotacao').length;
  const totalPosts = eventoPosts.length;
  const isProximo = nearbyEventIds.includes(eventId);

  async function handleResgatar(cupom) {
    if (isCouponRedeemed(cupom.id)) {
      Alert.alert("Já resgatado", "Você já usou este cupom.");
      return;
    }
    const { canRedeem, message: geoMsg } = canRedeemCoupon(cupom.id);
    if (!canRedeem) {
      Alert.alert("Vá ao local", geoMsg);
      return;
    }
    Alert.alert(`Resgatar: ${cupom.title}`, cupom.description, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Resgatar agora",
        onPress: async () => {
          const r = await redeemCoupon(cupom.id);
          if (r.success)
            Alert.alert("Resgatado!", `Apresente ao atendente de ${cupom.venue}.`);
          else
            Alert.alert("Erro ao resgatar", r.error ?? "Tente novamente.");
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[s.hero, { backgroundColor: evento.gradient[0] }]}>
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: evento.gradient[1], opacity: 0.5 },
            ]}
          />
          <TouchableOpacity style={s.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={s.heroContent}>
            {evento.isLive && (
              <View style={s.liveBadge}>
                <View style={s.liveDot} />
                <Text style={s.liveTexto}>AO VIVO</Text>
              </View>
            )}
            <Text style={s.heroNome}>{evento.name}</Text>
            <View style={s.heroFooter}>
              <Text style={s.heroVenue}>{evento.venue}</Text>
              {evento.price && (
                <View style={[s.precoBadge, evento.price === 'Gratuito' && s.precoBadgeFree]}>
                  <Ionicons name="ticket-outline" size={11} color={evento.price === 'Gratuito' ? COLORS.success : '#fff'} />
                  <Text style={[s.precoTexto, evento.price === 'Gratuito' && { color: COLORS.success }]}>
                    {evento.price === 'Gratuito' ? evento.price : `R$ ${evento.price}`}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── Info strip ── */}
        <View style={s.infoStrip}>
          {evento.startsAt && (
            <View style={[s.infoItem, s.infoItemSep]}>
              <Text style={s.infoItemLabel}>Data</Text>
              <Text style={s.infoItemValor}>{fmtDate(evento.startsAt) ?? '—'}</Text>
            </View>
          )}
          {evento.startsAt && (
            <View style={[s.infoItem, s.infoItemSep]}>
              <Text style={s.infoItemLabel}>Horário</Text>
              <Text style={s.infoItemValor}>
                {fmtTime(evento.startsAt) ?? '—'}{evento.endsAt ? ` – ${fmtTime(evento.endsAt)}` : ''}
              </Text>
            </View>
          )}
          {evento.categoryLabel && (
            <View style={[s.infoItem, s.infoItemSep]}>
              <Text style={s.infoItemLabel}>Categoria</Text>
              <Text style={s.infoItemValor}>{evento.categoryLabel}</Text>
            </View>
          )}
          {evento.ageRestriction && (
            <View style={s.infoItem}>
              <Text style={s.infoItemLabel}>Faixa etária</Text>
              <Text style={s.infoItemValor}>{evento.ageRestriction}</Text>
            </View>
          )}
        </View>
        {evento.address && (
          <View style={s.addressRow}>
            <Ionicons name="location-outline" size={16} color={COLORS.textMuted} />
            <Text style={s.addressTexto} numberOfLines={1}>{evento.address}</Text>
          </View>
        )}

        {/* ── Carrossel de fotos ── */}
        {evento.photos?.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <PhotoCarousel photos={evento.photos} height={240} />
          </View>
        )}

        {/* ── Painel de público ── */}
        {evento.isLive && (
          <CrowdPanel evento={evento} />
        )}

        {/* ── Estatísticas ── */}
        <View style={s.statsGrid}>
          {[
            {
              label: "Fila",
              valor: filaCount === 0 ? "Sem fila" : filaCount <= 2 ? "Moderado" : "Cheio",
              sub:   filaCount === 0 ? "Entre já!" : filaCount <= 2 ? "Pode esperar" : "Fila grande",
              cor:   filaCount === 0 ? COLORS.success : filaCount <= 2 ? COLORS.warning : COLORS.danger,
            },
            {
              label: "Avaliação",
              valor: totalPosts > 0 ? String(totalPosts) : "—",
              sub:   totalPosts === 1 ? "avaliação" : "avaliações",
              cor:   COLORS.gold,
            },
            {
              label: "Acessível",
              valor: evento.accessible ? "Sim" : "Não",
              sub: evento.accessibilityNotes?.slice(0, 14) || "",
              cor: evento.accessible ? COLORS.success : COLORS.danger,
            },
          ].map((stat) => (
            <View key={stat.label} style={s.statCard}>
              <Text style={[s.statValor, { color: stat.cor }]}>
                {stat.valor}
              </Text>
              <Text style={s.statLabel}>{stat.label}</Text>
              {stat.sub ? <Text style={s.statSub}>{stat.sub}</Text> : null}
            </View>
          ))}
        </View>

        {/* ── Tocando agora ── */}
        {evento.nowPlaying && (
          <View style={s.tocandoCard}>
            <View style={{ flex: 1 }}>
              <Text style={s.tocandoLabel}>TOCANDO AGORA</Text>
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

        {/* ── Avaliações ── */}
        <RatingSection
          evento={evento}
          userRating={getEventRatings(eventId)}
          onVote={submitRating}
          canVote={canVoteOnEvent(eventId)}
          isOwner={currentUser?.role === 'business'}
        />

        {/* ── Cupons ── */}
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
                    {cupom.icon ? <Text style={s.cupomBandaIcon}>{cupom.icon}</Text> : null}
                    <View style={{ flex: 1 }}>
                      <Text style={s.cupomBandaTipo}>{cupom.typeLabel}</Text>
                      <Text style={s.cupomBandaTitulo}>{cupom.title}</Text>
                    </View>
                    {resgatado && (
                      <View style={s.resgatadoBadge}>
                        <Text style={s.resgatadoTexto}>OK</Text>
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
                          {isProximo ? "Resgatar →" : "Vá ao local"}
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

        {/* ── Feed do evento ── */}
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
                        <Text style={s.verificadoTexto}>No local</Text>
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
  hero: { height: 160, justifyContent: "flex-end" },
  backButton: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  heroContent: { padding: 16 },
  heroFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  precoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.3)",
  },
  precoBadgeFree: {
    backgroundColor: COLORS.success + "33",
    borderColor: COLORS.success + "66",
  },
  precoTexto: { fontSize: 12, fontWeight: "800", color: "#fff" },
  infoStrip: {
    flexDirection: "row",
    alignItems: "stretch",
    marginHorizontal: 12,
    marginTop: 10,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  infoItem: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 2,
  },
  infoItemSep: { borderRightWidth: 0.5, borderRightColor: COLORS.border },
  infoItemValor: { fontSize: 11, fontWeight: "700", color: COLORS.text, textAlign: "center" },
  infoItemLabel: { fontSize: 9, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.3, textAlign: "center" },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 12,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  addressTexto: { flex: 1, fontSize: 13, color: COLORS.textSub },
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
    fontSize: 9,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1,
  },
  heroNome: {
    fontSize: 20,
    fontWeight: "900",
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroVenue: { fontSize: 13, color: "rgba(255,255,255,0.8)" },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: 12,
    gap: 8,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    minWidth: "30%",
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
    marginTop: 16,
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
