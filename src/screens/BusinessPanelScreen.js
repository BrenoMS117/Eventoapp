import React, { useState } from "react";
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
import { PhotoManager } from "../components/ImageCarousel";

const OPCOES_LOTACAO = [
  { key: "tranquilo", icon: "🟢", label: "Tranquilo", cor: COLORS.success },
  { key: "moderado", icon: "🟡", label: "Moderado", cor: COLORS.warning },
  { key: "cheio", icon: "🔥", label: "Cheio", cor: COLORS.primary },
  { key: "lotado", icon: "🚨", label: "Lotado", cor: COLORS.danger },
];

const ANUNCIOS = [
  {
    icon: "🎤",
    label: "Novo artista",
    msg: "Um novo artista vai subir ao palco em breve!",
  },
  {
    icon: "⬇️",
    label: "Fila diminuiu",
    msg: "A fila diminuiu! Ótima hora para vir 🎉",
  },
  {
    icon: "🎁",
    label: "Promoção",
    msg: "2 drinks pelo preço de 1 até meia-noite!",
  },
  {
    icon: "⚠️",
    label: "Aviso",
    msg: "Estamos quase lotados! Reserve seu lugar.",
  },
];

export default function BusinessPanelScreen({ navigation }) {
  const {
    businessStats,
    coupons,
    currentUser,
    logout,
    events,
    addEventPhoto,
    removeEventPhoto,
  } = useApp();
  const [statusLotacao, setStatusLotacao] = useState("moderado");
  const [secaoFotos, setSecaoFotos] = useState(false);

  const meusCupons = coupons.filter(
    (c) => c.eventId === businessStats.activeEventId,
  );
  const eventoAtivo = events.find((e) => e.id === businessStats.activeEventId);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="pulse" size={18} color={COLORS.primary} />
          <Text style={s.logo}>LiveVibe</Text>
        </View>
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 8,
          }}
        >
          <TouchableOpacity
            style={s.novoEventoBtn}
            onPress={() => navigation.navigate("NewEvent")}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={s.novoEventoTexto}>Novo Evento</Text>
          </TouchableOpacity>
          <View style={s.liveChip}>
            <View style={[s.liveDot, { backgroundColor: "#4ade80" }]} />
            <Text style={s.liveChipTexto}>Ao vivo</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Usuário + sair */}
        <View style={s.usuarioCard}>
          <View style={s.usuarioAvatar}>
            <Text style={s.usuarioAvatarTexto}>
              {currentUser?.avatar || "B"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.usuarioNome}>
              {currentUser?.name || "Estabelecimento"}
            </Text>
            <Text style={s.usuarioEmail}>{currentUser?.email || ""}</Text>
          </View>
          <TouchableOpacity
            style={s.sairBtn}
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
            <Ionicons name="log-out-outline" size={16} color={COLORS.danger} />
            <Text style={s.sairTexto}>Sair</Text>
          </TouchableOpacity>
        </View>

        {/* Evento ativo */}
        <View style={s.eventoAtivoBanner}>
          <View style={[s.ativoDot, { backgroundColor: COLORS.success }]} />
          <Text style={s.eventoAtivoTexto}>
            {businessStats.activeEventName}
          </Text>
          <TouchableOpacity onPress={() => setSecaoFotos((v) => !v)}>
            <View style={s.fotosBtnSmall}>
              <Ionicons
                name="images-outline"
                size={14}
                color={COLORS.primary}
              />
              <Text style={s.fotosBtnSmallTexto}>Fotos</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Gerenciar fotos do evento */}
        {secaoFotos && eventoAtivo && (
          <View style={s.fotosSecao}>
            <Text style={s.secaoTitulo}>Fotos do Evento</Text>
            <Text style={s.fotosSubtitulo}>
              A primeira foto será usada como capa nos cards
            </Text>
            <PhotoManager
              photos={eventoAtivo.photos || []}
              onAdd={(uri) => addEventPhoto(eventoAtivo.id, uri)}
              onRemove={(idx) => removeEventPhoto(eventoAtivo.id, idx)}
              maxPhotos={8}
            />
          </View>
        )}

        {/* Métricas */}
        <View style={s.metricsGrid}>
          {[
            {
              icon: "👥",
              label: "Presentes",
              valor: businessStats.checkedIn.toLocaleString(),
              sub: businessStats.checkedInChange,
              cor: COLORS.primaryLight,
            },
            {
              icon: "⭐",
              label: "Avaliação",
              valor: businessStats.rating,
              sub: `${businessStats.reviewsToday} avaliações`,
              cor: COLORS.gold,
            },
            {
              icon: "🎟",
              label: "Resgatados",
              valor: businessStats.couponsRedeemed,
              sub: `/ ${businessStats.couponsTotal}`,
              cor: COLORS.purpleLight,
            },
            {
              icon: "🔥",
              label: "Nível",
              valor: businessStats.heatLevel || "WARM",
              cor: COLORS.primary,
            },
          ].map((m) => (
            <View key={m.label} style={s.metricCard}>
              <Text style={s.metricIcon}>{m.icon}</Text>
              <Text style={[s.metricValor, { color: m.cor }]}>{m.valor}</Text>
              <Text style={s.metricLabel}>{m.label}</Text>
              {m.sub && <Text style={s.metricSub}>{m.sub}</Text>}
            </View>
          ))}
        </View>

        {/* Controle de lotação */}
        <View style={s.secao}>
          <Text style={s.secaoTitulo}>Status de Lotação</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {OPCOES_LOTACAO.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  s.lotacaoBtn,
                  statusLotacao === opt.key && {
                    borderColor: opt.cor,
                    backgroundColor: opt.cor + "22",
                  },
                ]}
                onPress={() => {
                  setStatusLotacao(opt.key);
                  Alert.alert("✅ Atualizado", `Lotação: ${opt.label}`);
                }}
              >
                <Text style={{ fontSize: 18, marginBottom: 2 }}>
                  {opt.icon}
                </Text>
                <Text
                  style={[
                    s.lotacaoLabel,
                    statusLotacao === opt.key && {
                      color: opt.cor,
                      fontWeight: "700",
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Anunciar ao vivo */}
        <View style={s.secao}>
          <Text style={s.secaoTitulo}>Anunciar ao Vivo</Text>
          {ANUNCIOS.map((a, i) => (
            <TouchableOpacity
              key={i}
              style={s.anuncioCard}
              onPress={() => Alert.alert("📢 Enviado!", `"${a.msg}"`)}
            >
              <Text style={s.anuncioIcon}>{a.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.anuncioLabel}>{a.label}</Text>
                <Text style={s.anuncioMsg} numberOfLines={1}>
                  {a.msg}
                </Text>
              </View>
              <Ionicons name="send-outline" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Cupons */}
        <View style={s.secao}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={s.secaoTitulo}>Meus Cupons</Text>
            <TouchableOpacity
              style={s.addBtn}
              onPress={() => navigation.navigate("AddCoupon")}
            >
              <Ionicons name="add" size={14} color="#fff" />
              <Text style={s.addBtnTexto}>Novo</Text>
            </TouchableOpacity>
          </View>
          {meusCupons.length === 0 ? (
            <TouchableOpacity
              style={s.vazioCard}
              onPress={() => navigation.navigate("AddCoupon")}
            >
              <Text style={{ fontSize: 36, marginBottom: 8 }}>🎟</Text>
              <Text style={s.vazioTitulo}>Criar primeiro cupom</Text>
              <Text style={s.vazioSub}>
                Atraia mais clientes com cupons exclusivos
              </Text>
            </TouchableOpacity>
          ) : (
            meusCupons.map((c) => (
              <View key={c.id} style={s.cupomRow}>
                <View
                  style={[s.cupomDot, { backgroundColor: c.highlightColor }]}
                >
                  <Text style={{ fontSize: 18 }}>{c.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={s.cupomTitulo} numberOfLines={1}>
                      {c.title}
                    </Text>
                    <View
                      style={[
                        s.cupomTipoBadge,
                        { backgroundColor: c.highlightColor + "33" },
                      ]}
                    >
                      <Text
                        style={[s.cupomTipoTexto, { color: c.highlightColor }]}
                      >
                        {c.typeLabel}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginTop: 4,
                    }}
                  >
                    <Text style={s.cupomQtd}>
                      {c.remainingQty}/{c.totalQty} restantes
                    </Text>
                    <Text style={{ fontSize: 11, color: COLORS.success }}>
                      {c.totalQty - c.remainingQty} resgatados
                    </Text>
                  </View>
                  <View style={s.progressBg}>
                    <View
                      style={[
                        s.progressFill,
                        {
                          width: `${(c.remainingQty / c.totalQty) * 100}%`,
                          backgroundColor: c.highlightColor,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Avaliações recentes */}
        <View style={s.secao}>
          <Text style={s.secaoTitulo}>Avaliações Recentes</Text>
          {businessStats.recentReviews.map((r, i) => (
            <View key={i} style={s.avaliacaoCard}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <Text style={s.avaliacaoUsuario}>{r.user}</Text>
                <Text style={{ fontSize: 12 }}>{"⭐".repeat(r.stars)}</Text>
                <Text style={s.avaliacaoTempo}>{r.time}</Text>
              </View>
              <Text style={s.avaliacaoTexto}>{r.text}</Text>
            </View>
          ))}
        </View>

        {/* Impulsionar */}
        <View style={s.impulsionarCard}>
          <Text style={s.impulsionarTitulo}>⚡ Impulsionar Visibilidade</Text>
          <Text style={s.impulsionarSub}>
            Destaque seu evento no topo do feed para +2.300 usuários próximos
          </Text>
          <TouchableOpacity
            style={s.impulsionarBtn}
            onPress={() =>
              Alert.alert("Em breve", "Planos em desenvolvimento!")
            }
          >
            <Text style={s.impulsionarBtnTexto}>Ver planos →</Text>
          </TouchableOpacity>
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
  novoEventoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  novoEventoTexto: { color: "#fff", fontSize: 12, fontWeight: "700" },
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveChipTexto: { fontSize: 12, color: COLORS.text, fontWeight: "600" },
  usuarioCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  usuarioAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + "33",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.primary + "66",
  },
  usuarioAvatarTexto: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primary,
  },
  usuarioNome: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  usuarioEmail: { fontSize: 12, color: COLORS.textMuted },
  sairBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.danger + "22",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 0.5,
    borderColor: COLORS.danger + "44",
  },
  sairTexto: { fontSize: 13, color: COLORS.danger, fontWeight: "700" },
  eventoAtivoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.primary + "18",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  ativoDot: { width: 8, height: 8, borderRadius: 4 },
  eventoAtivoTexto: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },
  fotosBtnSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary + "22",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  fotosBtnSmallTexto: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600",
  },
  fotosSecao: {
    backgroundColor: COLORS.bgCard,
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  fotosSubtitulo: { fontSize: 12, color: COLORS.textMuted, marginBottom: 12 },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 8,
  },
  metricCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  metricIcon: { fontSize: 18, marginBottom: 6 },
  metricValor: { fontSize: 22, fontWeight: "800" },
  metricLabel: { fontSize: 12, color: COLORS.textSub, marginTop: 2 },
  metricSub: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: "500",
    marginTop: 2,
  },
  secao: { paddingHorizontal: 12, marginTop: 20 },
  secaoTitulo: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  lotacaoBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  lotacaoLabel: { fontSize: 10, color: COLORS.textMuted },
  anuncioCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  anuncioIcon: { fontSize: 22 },
  anuncioLabel: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  anuncioMsg: { fontSize: 12, color: COLORS.textSub },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  addBtnTexto: { fontSize: 12, color: "#fff", fontWeight: "700" },
  vazioCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: 24,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: "dashed",
  },
  vazioTitulo: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  vazioSub: { fontSize: 13, color: COLORS.textSub, textAlign: "center" },
  cupomRow: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    marginBottom: 8,
    padding: 12,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  cupomDot: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
  },
  cupomTitulo: { fontSize: 13, fontWeight: "700", color: COLORS.text, flex: 1 },
  cupomTipoBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  cupomTipoTexto: { fontSize: 9, fontWeight: "700" },
  cupomQtd: { fontSize: 11, color: COLORS.textMuted },
  progressBg: {
    height: 4,
    backgroundColor: COLORS.bgOverlay,
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 6,
  },
  progressFill: { height: "100%", borderRadius: 2 },
  avaliacaoCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  avaliacaoUsuario: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  avaliacaoTempo: { fontSize: 11, color: COLORS.textMuted, marginLeft: "auto" },
  avaliacaoTexto: { fontSize: 13, color: COLORS.textSub },
  impulsionarCard: {
    backgroundColor: COLORS.primary + "18",
    borderRadius: RADIUS.xl,
    margin: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.primary + "55",
  },
  impulsionarTitulo: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primaryLight,
    marginBottom: 6,
  },
  impulsionarSub: {
    fontSize: 13,
    color: COLORS.textSub,
    lineHeight: 19,
    marginBottom: 14,
  },
  impulsionarBtn: {
    backgroundColor: COLORS.primary,
    alignSelf: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
  },
  impulsionarBtnTexto: { color: "#fff", fontWeight: "800", fontSize: 13 },
});
