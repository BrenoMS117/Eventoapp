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
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { COLORS, RADIUS, SHADOW } from "../utils/theme";
import { PostPhotoSelector } from "../components/ImageCarousel";

const { width } = Dimensions.get("window");
const CARD_W = (width - 48) / 2;

const TIPOS_POST = [
  { key: "geral", label: "Geral", icon: "💬" },
  { key: "lotacao", label: "Lotação", icon: "👥" },
  { key: "dica", label: "Dica", icon: "💡" },
  { key: "alerta", label: "Alerta", icon: "⚡" },
  { key: "acessibilidade", label: "Acesso", icon: "♿" },
];

const COR_HEAT = {
  BLAZING: "#FF4500",
  HOT: "#E83B5C",
  WARM: "#F59E0B",
  COOL: "#3B82F6",
};

function PostCard({ post, onLike }) {
  const corHeat = COR_HEAT[post.heatLevel] || COLORS.primary;
  const temFotos = post.photos?.length > 0;
  return (
    <View style={s.postCard}>
      {post.heatLevel && (
        <View style={[s.heatTag, { backgroundColor: corHeat }]}>
          <Text style={s.heatTagTexto}>NÍVEL: {post.heatLevel} 🔥</Text>
        </View>
      )}
      {/* Área visual — foto ou ícone */}
      {temFotos ? (
        <Image
          source={{ uri: post.photos[0] }}
          style={s.postImagem}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[s.postAreaVazia, { backgroundColor: post.user.color + "33" }]}
        >
          <Text style={{ fontSize: 32 }}>
            {post.type === "alerta" ? "⚡" : post.type === "dica" ? "💡" : "🎵"}
          </Text>
          {post.photos?.length > 1 && (
            <View style={s.maisIcones}>
              <Text style={s.maisIconesTexto}>+{post.photos.length - 1}</Text>
            </View>
          )}
        </View>
      )}
      <View style={s.postRodape}>
        <View style={s.postUsuario}>
          <View style={[s.avatar, { backgroundColor: post.user.color }]}>
            <Text style={s.avatarTexto}>{post.user.initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.usuarioNome}>{post.user.name}</Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Ionicons
                name="location-outline"
                size={10}
                color={COLORS.textMuted}
              />
              <Text style={s.usuarioLocal} numberOfLines={1}>
                {post.eventName}
              </Text>
            </View>
          </View>
          <TouchableOpacity>
            <Ionicons name="location" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        {post.text ? (
          <Text style={s.postTexto} numberOfLines={2}>
            {post.text}
          </Text>
        ) : null}
        <View style={s.postAcoes}>
          <TouchableOpacity style={s.acaoBtn} onPress={() => onLike(post.id)}>
            <View style={s.acaoBolha}>
              <Text style={{ fontSize: 16 }}>❤️</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={s.acaoBtn}>
            <View style={s.acaoBolha}>
              <Text style={{ fontSize: 16 }}>⭐</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={s.acaoBtn}>
            <View
              style={[s.acaoBolha, { backgroundColor: COLORS.primary + "33" }]}
            >
              <Text style={{ fontSize: 16 }}>🔥</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const { feedPosts, events, addFeedPost, likePost, nearbyEventIds, logout } =
    useApp();
  const [compondo, setCompondo] = useState(false);
  const [novoTexto, setNovoTexto] = useState("");
  const [fotosPost, setFotosPost] = useState([]);
  const [erroTexto, setErroTexto] = useState("");
  const [eventoSelecionado, setEventoSelecionado] = useState(null);
  const [erroEvento, setErroEvento] = useState("");
  const [tipoSelecionado, setTipoSelecionado] = useState("geral");

  function publicar() {
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

    addFeedPost({
      eventId: eventoSelecionado.id,
      eventName: eventoSelecionado.name,
      text: novoTexto.trim(),
      photos: fotosPost,
      tag: `#${TIPOS_POST.find((t) => t.key === tipoSelecionado)?.label || "Geral"}`,
      type: tipoSelecionado,
    });
    setNovoTexto("");
    setFotosPost([]);
    setCompondo(false);
    setEventoSelecionado(null);
    setTipoSelecionado("geral");
    setErroTexto("");
    setErroEvento("");
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="pulse" size={18} color={COLORS.primary} />
          <Text style={s.logo}>LiveVibe</Text>
        </View>
        <Text style={s.headerTitulo}>Comunidade</Text>
        <View style={{ flexDirection: "row", gap: 4 }}>
          <TouchableOpacity
            style={s.publicarBtn}
            onPress={() => setCompondo((v) => !v)}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={s.publicarBtnTexto}>Postar</Text>
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

      {/* Compositor */}
      {compondo && (
        <View style={s.compositor}>
          <Text style={s.compositorLabel}>Evento</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 4 }}
          >
            {events
              .filter((e) => e.isLive || nearbyEventIds.includes(e.id))
              .map((e) => (
                <TouchableOpacity
                  key={e.id}
                  style={[
                    s.eventoChip,
                    eventoSelecionado?.id === e.id && s.eventoChipOn,
                  ]}
                  onPress={() => {
                    setEventoSelecionado(e);
                    setErroEvento("");
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
          {erroEvento ? (
            <Text style={s.erroTexto}>{erroEvento}</Text>
          ) : (
            <View style={{ height: 8 }} />
          )}

          <Text style={s.compositorLabel}>Tipo</Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 6,
              marginBottom: 10,
            }}
          >
            {TIPOS_POST.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[s.tipoChip, tipoSelecionado === t.key && s.tipoChipOn]}
                onPress={() => setTipoSelecionado(t.key)}
              >
                <Text
                  style={[
                    s.tipoChipTexto,
                    tipoSelecionado === t.key && { color: "#fff" },
                  ]}
                >
                  {t.icon} {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={[
              s.compositorInput,
              erroTexto && { borderColor: COLORS.danger },
            ]}
            placeholder="O que está acontecendo agora? (mín. 3 caracteres)"
            placeholderTextColor={COLORS.textMuted}
            value={novoTexto}
            onChangeText={(v) => {
              setNovoTexto(v);
              setErroTexto("");
            }}
            multiline
            autoFocus
            maxLength={280}
          />
          {erroTexto ? <Text style={s.erroTexto}>{erroTexto}</Text> : null}
          <Text style={s.charCount}>{novoTexto.length}/280</Text>

          {/* Seletor de fotos */}
          <PostPhotoSelector
            photos={fotosPost}
            onAdd={(uri) => setFotosPost((prev) => [...prev, uri])}
            onRemove={(idx) =>
              setFotosPost((prev) => prev.filter((_, i) => i !== idx))
            }
          />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              gap: 10,
              marginTop: 10,
            }}
          >
            <TouchableOpacity
              style={s.cancelarBtn}
              onPress={() => {
                setCompondo(false);
                setErroTexto("");
                setErroEvento("");
                setFotosPost([]);
              }}
            >
              <Text style={{ fontSize: 14, color: COLORS.textSub }}>
                Cancelar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.submitBtn} onPress={publicar}>
              <Text style={{ fontSize: 14, color: "#fff", fontWeight: "700" }}>
                Publicar →
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text
          style={[s.secaoTitulo, { paddingHorizontal: 16, marginBottom: 14 }]}
        >
          Feed da Comunidade
        </Text>
        <View style={s.postsGrid}>
          {feedPosts.map((post) => (
            <View key={post.id} style={s.postWrapper}>
              <PostCard post={post} onLike={likePost} />
            </View>
          ))}
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
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },
  iconBtn: { padding: 4 },
  publicarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  publicarBtnTexto: { fontSize: 13, color: "#fff", fontWeight: "700" },
  compositor: {
    backgroundColor: COLORS.bgCard,
    padding: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  compositorLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  eventoChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.bgOverlay,
    borderRadius: RADIUS.full,
    marginRight: 8,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  eventoChipOn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  eventoChipTexto: { fontSize: 12, color: COLORS.textSub, fontWeight: "500" },
  tipoChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: COLORS.bgOverlay,
    borderRadius: RADIUS.full,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  tipoChipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tipoChipTexto: { fontSize: 12, color: COLORS.textSub },
  compositorInput: {
    backgroundColor: COLORS.bgOverlay,
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  erroTexto: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 4,
    marginBottom: 4,
  },
  charCount: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: "right",
    marginTop: 4,
  },
  cancelarBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  secaoTitulo: { fontSize: 20, fontWeight: "800", color: COLORS.text },
  postsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 14,
  },
  postWrapper: { width: CARD_W },
  postCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  heatTag: { paddingHorizontal: 10, paddingVertical: 6 },
  heatTagTexto: {
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
  },
  postImagem: { height: 150, width: "100%" },
  postAreaVazia: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  maisIcones: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  maisIconesTexto: { fontSize: 10, color: "#fff", fontWeight: "700" },
  postRodape: { padding: 10 },
  postUsuario: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarTexto: { fontSize: 11, fontWeight: "700", color: "#fff" },
  usuarioNome: { fontSize: 12, fontWeight: "700", color: COLORS.text },
  usuarioLocal: { fontSize: 10, color: COLORS.textMuted },
  postTexto: {
    fontSize: 12,
    color: COLORS.textSub,
    lineHeight: 17,
    marginBottom: 8,
  },
  postAcoes: { flexDirection: "row", gap: 6 },
  acaoBtn: {},
  acaoBolha: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.bgOverlay,
    justifyContent: "center",
    alignItems: "center",
  },
});
