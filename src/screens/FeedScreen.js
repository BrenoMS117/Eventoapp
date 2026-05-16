import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  Alert,
  Image,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { useFeed } from "../hooks/useFeed";
import { COLORS, RADIUS, SHADOW } from "../utils/theme";
import { PostPhotoSelector } from "../components/ImageCarousel";

const { width } = Dimensions.get("window");
const CARD_W = (width - 48) / 2;

const TIPOS_POST = [
  { key: "geral",          label: "Geral",    icon: "💬" },
  { key: "lotacao",        label: "Lotação",  icon: "👥" },
  { key: "dica",           label: "Dica",     icon: "💡" },
  { key: "alerta",         label: "Alerta",   icon: "⚡" },
  { key: "acessibilidade", label: "Acesso",   icon: "♿" },
];

// ─────────────────────────────────────────────────────────────────────────────
// PostDetailModal — view expandida com like/dislike e TTL
// ─────────────────────────────────────────────────────────────────────────────
function PostDetailModal({ post, visible, onClose, onLike, onDislike, getTimeLeft }) {
  if (!post) return null;
  const timeLeft = getTimeLeft(post);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={s.modalOverlay}>
        <View style={s.modalCard}>
          {/* Handle bar */}
          <View style={s.modalHandle} />

          {/* Header */}
          <View style={s.modalHeader}>
            <View style={[s.modalAvatar, { backgroundColor: post.user.color }]}>
              <Text style={[s.modalAvatarTexto, { color: post.user.textColor }]}>
                {post.user.initials}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.modalNome}>{post.user.name}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="location-outline" size={11} color={COLORS.primary} />
                <Text style={s.modalEvento} numberOfLines={1}>{post.eventName}</Text>
                {post.verified && (
                  <Ionicons name="checkmark-circle" size={13} color={COLORS.success} />
                )}
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={s.modalCloseBtn}>
              <Ionicons name="close" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Foto */}
            {post.photos?.length > 0 && (
              <Image
                source={{ uri: post.photos[0] }}
                style={s.modalImagem}
                resizeMode="cover"
              />
            )}

            {/* Tipo + texto */}
            <View style={s.modalCorpo}>
              {post.tag && (
                <View style={s.modalTagChip}>
                  <Text style={s.modalTagTexto}>{post.tag}</Text>
                </View>
              )}
              {post.text ? (
                <Text style={s.modalTexto}>{post.text}</Text>
              ) : null}

              {/* Metadados */}
              <View style={s.modalMeta}>
                <Text style={s.modalTempo}>{post.time}</Text>
                {timeLeft && (
                  <View style={s.ttlChip}>
                    <Ionicons name="time-outline" size={11} color={COLORS.warning} />
                    <Text style={s.ttlTexto}>{timeLeft}</Text>
                  </View>
                )}
              </View>

              {/* Like / Dislike */}
              <View style={s.modalAcoes}>
                <TouchableOpacity
                  style={s.modalAcaoBtn}
                  onPress={() => { onLike(post.id); onClose(); }}
                >
                  <Text style={{ fontSize: 22 }}>❤️</Text>
                  <Text style={s.modalAcaoCount}>{post.likes}</Text>
                  <Text style={s.modalAcaoLabel}>Curtir</Text>
                </TouchableOpacity>

                <View style={s.modalAcaoDivider} />

                <TouchableOpacity
                  style={s.modalAcaoBtn}
                  onPress={() => { onDislike(post.id); onClose(); }}
                >
                  <Text style={{ fontSize: 22 }}>👎</Text>
                  <Text style={s.modalAcaoCount}>{post.dislikes ?? 0}</Text>
                  <Text style={s.modalAcaoLabel}>Não curtir</Text>
                </TouchableOpacity>

                <View style={s.modalAcaoDivider} />

                <View style={s.modalAcaoBtn}>
                  <Text style={{ fontSize: 22 }}>💬</Text>
                  <Text style={s.modalAcaoCount}>{post.replies}</Text>
                  <Text style={s.modalAcaoLabel}>Respostas</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PostCard — card compacto no grid
// ─────────────────────────────────────────────────────────────────────────────
function PostCard({ post, onPress, onLike, onDislike }) {
  const temFotos = post.photos?.length > 0;
  return (
    <TouchableOpacity
      style={s.postCard}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {temFotos ? (
        <Image source={{ uri: post.photos[0] }} style={s.postImagem} resizeMode="cover" />
      ) : (
        <View style={[s.postAreaVazia, { backgroundColor: post.user.color + "33" }]}>
          <Text style={{ fontSize: 30 }}>
            {post.type === "alerta" ? "⚡" : post.type === "dica" ? "💡" : "🎵"}
          </Text>
        </View>
      )}

      <View style={s.postRodape}>
        <View style={s.postUsuario}>
          <View style={[s.avatar, { backgroundColor: post.user.color }]}>
            <Text style={[s.avatarTexto, { color: post.user.textColor }]}>
              {post.user.initials}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.usuarioNome}>{post.user.name}</Text>
            <Text style={s.usuarioLocal} numberOfLines={1}>{post.eventName}</Text>
          </View>
        </View>

        {post.text ? (
          <Text style={s.postTexto} numberOfLines={2}>{post.text}</Text>
        ) : null}

        <View style={s.postAcoes}>
          <TouchableOpacity
            style={s.acaoBtn}
            onPress={(e) => { e.stopPropagation?.(); onLike(post.id); }}
          >
            <View style={s.acaoBolha}>
              <Text style={{ fontSize: 13 }}>❤️</Text>
              <Text style={s.acaoCount}>{post.likes}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.acaoBtn}
            onPress={(e) => { e.stopPropagation?.(); onDislike(post.id); }}
          >
            <View style={s.acaoBolha}>
              <Text style={{ fontSize: 13 }}>👎</Text>
              <Text style={s.acaoCount}>{post.dislikes ?? 0}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AtEventBanner — faixa que mostra em qual evento o usuário está
// ─────────────────────────────────────────────────────────────────────────────
function AtEventBanner({ event }) {
  if (!event) return null;
  return (
    <View style={s.atEventBanner}>
      <View style={s.atEventDot} />
      <Ionicons name="location" size={13} color={COLORS.primary} />
      <Text style={s.atEventTexto} numberOfLines={1}>
        Você está em <Text style={{ fontWeight: "800" }}>{event.name}</Text>
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FeedScreen principal
// ─────────────────────────────────────────────────────────────────────────────
export default function FeedScreen() {
  const { events, nearbyEventIds, logout } = useApp();
  const { posts, currentEvent, contextLabel, canPost, submitPost, likePost, dislikePost, getTimeLeft } = useFeed();

  const [compondo, setCompondo]             = useState(false);
  const [novoTexto, setNovoTexto]           = useState("");
  const [fotosPost, setFotosPost]           = useState([]);
  const [erroTexto, setErroTexto]           = useState("");
  const [erroEvento, setErroEvento]         = useState("");
  const [erroGeo, setErroGeo]               = useState("");
  const [eventoSelecionado, setEventoSelecionado] = useState(null);
  const [tipoSelecionado, setTipoSelecionado]     = useState("geral");
  const [selectedPost, setSelectedPost]     = useState(null);
  const [publicando, setPublicando]         = useState(false);

  const eventosFiltro = events.filter(
    (e) => e.isLive || nearbyEventIds.includes(e.id),
  );

  async function publicar() {
    let valido = true;
    if (!novoTexto.trim() || novoTexto.trim().length < 3) {
      setErroTexto("Mínimo 3 caracteres.");
      valido = false;
    }
    if (!eventoSelecionado) {
      setErroEvento("Selecione um evento.");
      valido = false;
    }
    if (!valido) return;

    setPublicando(true);
    const result = await submitPost({
      event: eventoSelecionado,
      text: novoTexto.trim(),
      photos: fotosPost,
      tag: `#${TIPOS_POST.find((t) => t.key === tipoSelecionado)?.label || "Geral"}`,
      type: tipoSelecionado,
    });
    setPublicando(false);

    if (!result.success) {
      setErroGeo(result.error ?? "Não foi possível publicar.");
      return;
    }

    setNovoTexto("");
    setFotosPost([]);
    setCompondo(false);
    setEventoSelecionado(null);
    setTipoSelecionado("geral");
    setErroTexto("");
    setErroEvento("");
    setErroGeo("");
  }

  function cancelar() {
    setCompondo(false);
    setErroTexto("");
    setErroEvento("");
    setErroGeo("");
    setFotosPost([]);
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="pulse" size={18} color={COLORS.primary} />
          <Text style={s.logo}>LiveVibe</Text>
        </View>
        <Text style={s.headerTitulo}>Comunidade</Text>
        <View style={{ flexDirection: "row", gap: 4 }}>
          {canPost && (
            <TouchableOpacity
              style={s.publicarBtn}
              onPress={() => setCompondo((v) => !v)}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={s.publicarBtnTexto}>Postar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => {
              if (Platform.OS === "web") {
                if (window.confirm("Deseja sair?")) logout();
              } else {
                Alert.alert("Sair", "Deseja sair?", [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Sair", onPress: logout },
                ]);
              }
            }}
          >
            <Ionicons name="person-circle-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Faixa "você está em..." */}
      <AtEventBanner event={currentEvent} />

      {/* Compositor */}
      {compondo && canPost && (
        <View style={s.compositor}>
          {/* Erro de geofence */}
          {erroGeo ? (
            <View style={s.erroGeoCard}>
              <Ionicons name="location-outline" size={16} color={COLORS.danger} />
              <Text style={s.erroGeoTexto}>{erroGeo}</Text>
            </View>
          ) : null}

          <Text style={s.compositorLabel}>Evento</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 4 }}
          >
            {eventosFiltro.map((e) => (
              <TouchableOpacity
                key={e.id}
                style={[
                  s.eventoChip,
                  eventoSelecionado?.id === e.id && s.eventoChipOn,
                ]}
                onPress={() => {
                  setEventoSelecionado(e);
                  setErroEvento("");
                  setErroGeo("");
                }}
              >
                <Text
                  style={[
                    s.eventoChipTexto,
                    eventoSelecionado?.id === e.id && { color: "#fff" },
                  ]}
                  numberOfLines={1}
                >
                  {e.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {erroEvento ? <Text style={s.erroTexto}>{erroEvento}</Text> : <View style={{ height: 8 }} />}

          <Text style={s.compositorLabel}>Tipo</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {TIPOS_POST.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[s.tipoChip, tipoSelecionado === t.key && s.tipoChipOn]}
                onPress={() => setTipoSelecionado(t.key)}
              >
                <Text style={[s.tipoChipTexto, tipoSelecionado === t.key && { color: "#fff" }]}>
                  {t.icon} {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={[s.compositorInput, erroTexto && { borderColor: COLORS.danger }]}
            placeholder="O que está acontecendo agora? (mín. 3 caracteres)"
            placeholderTextColor={COLORS.textMuted}
            value={novoTexto}
            onChangeText={(v) => { setNovoTexto(v); setErroTexto(""); }}
            multiline
            autoFocus
            maxLength={280}
          />
          {erroTexto ? <Text style={s.erroTexto}>{erroTexto}</Text> : null}
          <Text style={s.charCount}>{novoTexto.length}/280</Text>

          <PostPhotoSelector
            photos={fotosPost}
            onAdd={(uri) => setFotosPost((prev) => [...prev, uri])}
            onRemove={(idx) => setFotosPost((prev) => prev.filter((_, i) => i !== idx))}
          />

          <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
            <TouchableOpacity style={s.cancelarBtn} onPress={cancelar}>
              <Text style={{ fontSize: 14, color: COLORS.textSub }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.submitBtn, publicando && { opacity: 0.6 }]}
              onPress={publicar}
              disabled={publicando}
            >
              <Text style={{ fontSize: 14, color: "#fff", fontWeight: "700" }}>
                {publicando ? "Publicando..." : "Publicar →"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Feed */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Label de contexto geográfico */}
        <View style={s.contextBar}>
          <Ionicons name="navigate-circle-outline" size={14} color={COLORS.primary} />
          <Text style={s.contextLabel}>{contextLabel}</Text>
        </View>

        {posts.length === 0 ? (
          <View style={s.vazioCard}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>📍</Text>
            <Text style={s.vazioTitulo}>Nenhum post por aqui</Text>
            <Text style={s.vazioSub}>
              {canPost
                ? "Seja o primeiro a postar sobre o evento onde você está!"
                : "Não há posts dos seus eventos no momento."}
            </Text>
          </View>
        ) : (
          <View style={s.postsGrid}>
            {posts.map((post) => (
              <View key={post.id} style={s.postWrapper}>
                <PostCard
                  post={post}
                  onPress={() => setSelectedPost(post)}
                  onLike={likePost}
                  onDislike={dislikePost}
                />
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Modal de detalhes */}
      <PostDetailModal
        post={selectedPost}
        visible={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        onLike={likePost}
        onDislike={dislikePost}
        getTimeLeft={getTimeLeft}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
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
    flex: 1, fontSize: 16, fontWeight: "700", color: COLORS.text, textAlign: "center",
  },
  iconBtn: { padding: 4 },
  publicarBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  publicarBtnTexto: { fontSize: 13, color: "#fff", fontWeight: "700" },

  // At-event banner
  atEventBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: COLORS.primary + "18",
    paddingHorizontal: 16, paddingVertical: 7,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.primary + "44",
  },
  atEventDot: {
    width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.primary,
  },
  atEventTexto: { fontSize: 12, color: COLORS.text },

  // Context bar
  contextBar: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  contextLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: "600" },

  // Compositor
  compositor: {
    backgroundColor: COLORS.bgCard, padding: 14,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  compositorLabel: {
    fontSize: 10, fontWeight: "700", color: COLORS.textMuted,
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8,
  },
  erroGeoCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: COLORS.danger + "18", borderRadius: RADIUS.md,
    padding: 10, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.danger + "44",
  },
  erroGeoTexto: { flex: 1, fontSize: 12, color: COLORS.danger, lineHeight: 17 },
  eventoChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: COLORS.bgOverlay, borderRadius: RADIUS.full,
    marginRight: 8, borderWidth: 0.5, borderColor: COLORS.border,
  },
  eventoChipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  eventoChipTexto: { fontSize: 12, color: COLORS.textSub, fontWeight: "500" },
  tipoChip: {
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: COLORS.bgOverlay, borderRadius: RADIUS.full,
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  tipoChipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tipoChipTexto: { fontSize: 12, color: COLORS.textSub },
  compositorInput: {
    backgroundColor: COLORS.bgOverlay, borderRadius: RADIUS.md,
    padding: 12, fontSize: 14, color: COLORS.text,
    minHeight: 80, textAlignVertical: "top",
    borderWidth: 1, borderColor: COLORS.border,
  },
  erroTexto: { fontSize: 12, color: COLORS.danger, marginTop: 4, marginBottom: 4 },
  charCount: { fontSize: 11, color: COLORS.textMuted, textAlign: "right", marginTop: 4 },
  cancelarBtn: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: RADIUS.md,
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  submitBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: 20,
    paddingVertical: 9, borderRadius: RADIUS.md,
  },

  // Grid
  postsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 14 },
  postWrapper: { width: CARD_W },

  // PostCard
  postCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    overflow: "hidden", borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW.sm,
  },
  postImagem: { height: 140, width: "100%" },
  postAreaVazia: { height: 140, justifyContent: "center", alignItems: "center" },
  postRodape: { padding: 10 },
  postUsuario: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  avatar: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  avatarTexto: { fontSize: 10, fontWeight: "700" },
  usuarioNome: { fontSize: 11, fontWeight: "700", color: COLORS.text },
  usuarioLocal: { fontSize: 10, color: COLORS.textMuted },
  postTexto: { fontSize: 11, color: COLORS.textSub, lineHeight: 16, marginBottom: 8 },
  postAcoes: { flexDirection: "row", gap: 6 },
  acaoBtn: {},
  acaoBolha: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 7, paddingVertical: 5,
    backgroundColor: COLORS.bgOverlay, borderRadius: 8,
  },
  acaoCount: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600" },

  // Vazio
  vazioCard: {
    alignItems: "center", padding: 40, marginTop: 20,
  },
  vazioTitulo: { fontSize: 16, fontWeight: "700", color: COLORS.text, marginBottom: 8 },
  vazioSub: { fontSize: 13, color: COLORS.textSub, textAlign: "center", lineHeight: 19 },

  // PostDetailModal
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: COLORS.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: "85%", paddingBottom: 32,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border,
    alignSelf: "center", marginTop: 10, marginBottom: 6,
  },
  modalHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  modalAvatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: "center", alignItems: "center",
  },
  modalAvatarTexto: { fontSize: 16, fontWeight: "800" },
  modalNome: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  modalEvento: { fontSize: 12, color: COLORS.textMuted },
  modalCloseBtn: { padding: 6 },
  modalImagem: { width: "100%", height: 220 },
  modalCorpo: { padding: 16 },
  modalTagChip: {
    alignSelf: "flex-start", backgroundColor: COLORS.primary + "22",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, marginBottom: 10,
  },
  modalTagTexto: { fontSize: 11, color: COLORS.primaryLight, fontWeight: "700" },
  modalTexto: { fontSize: 15, color: COLORS.text, lineHeight: 22, marginBottom: 14 },
  modalMeta: {
    flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20,
  },
  modalTempo: { fontSize: 12, color: COLORS.textMuted },
  ttlChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: COLORS.warning + "22", paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  ttlTexto: { fontSize: 11, color: COLORS.warning, fontWeight: "600" },
  modalAcoes: {
    flexDirection: "row", backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl, overflow: "hidden",
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  modalAcaoBtn: {
    flex: 1, alignItems: "center", paddingVertical: 16, gap: 4,
  },
  modalAcaoCount: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  modalAcaoLabel: { fontSize: 11, color: COLORS.textMuted },
  modalAcaoDivider: { width: 0.5, backgroundColor: COLORS.border },
});
