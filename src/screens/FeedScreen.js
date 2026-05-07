import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { COLORS, RADIUS, SHADOW } from "../utils/theme";
import { validate } from "../utils/validation";

const POST_TYPES = [
  { key: "geral", label: "Geral", icon: "💬" },
  { key: "lotacao", label: "Lotação", icon: "👥" },
  { key: "dica", label: "Dica", icon: "💡" },
  { key: "alerta", label: "Alerta", icon: "⚠️" },
  { key: "acessibilidade", label: "Acessib.", icon: "♿" },
];

const TYPE_COLORS = {
  geral: { bg: COLORS.primaryLight, text: COLORS.primaryDark },
  lotacao: { bg: COLORS.warningLight, text: COLORS.warning },
  dica: { bg: "#E6F1FB", text: "#0C447C" },
  alerta: { bg: COLORS.dangerLight, text: COLORS.danger },
  acessibilidade: { bg: COLORS.primaryLight, text: COLORS.primaryDark },
};

function PostCard({ post, onLike }) {
  const typeColor = TYPE_COLORS[post.type] || TYPE_COLORS.geral;
  return (
    <View style={styles.postCard}>
      <View style={styles.postLeft}>
        <View style={[styles.avatar, { backgroundColor: post.user.color }]}>
          <Text style={[styles.avatarText, { color: post.user.textColor }]}>
            {post.user.initials}
          </Text>
        </View>
        {post.verified && (
          <View style={styles.verifiedDot}>
            <Ionicons name="checkmark" size={8} color="#fff" />
          </View>
        )}
      </View>
      <View style={styles.postBody}>
        <View style={styles.postHeader}>
          <Text style={styles.postName}>{post.user.name}</Text>
          {post.verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>📍 No local</Text>
            </View>
          )}
          <Text style={styles.postTime}>{post.time}</Text>
        </View>
        <Text style={styles.postEventName}>{post.eventName}</Text>
        <Text style={styles.postText}>{post.text}</Text>
        <View style={styles.postFooter}>
          <View style={[styles.typeBadge, { backgroundColor: typeColor.bg }]}>
            <Text style={[styles.typeBadgeText, { color: typeColor.text }]}>
              {POST_TYPES.find((t) => t.key === post.type)?.icon} {post.tag}
            </Text>
          </View>
          <View style={styles.postActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onLike(post.id)}
            >
              <Ionicons
                name="heart-outline"
                size={14}
                color={COLORS.textSecondary}
              />
              <Text style={styles.actionText}>{post.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons
                name="chatbubble-outline"
                size={14}
                color={COLORS.textSecondary}
              />
              <Text style={styles.actionText}>{post.replies}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const {
    feedPosts,
    events,
    addFeedPost,
    likePost,
    nearbyEventIds,
    currentUser,
    logout,
  } = useApp();
  const [composing, setComposing] = useState(false);
  const [newText, setNewText] = useState("");
  const [textError, setTextError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventError, setEventError] = useState("");
  const [selectedType, setSelectedType] = useState("geral");

  const sortedPosts = [...feedPosts].sort((a, b) => a.timeAgo - b.timeAgo);

  function validatePost() {
    let valid = true;
    const tErr = validate.minLength(newText, 3, "Post");
    setTextError(tErr);
    if (tErr) valid = false;
    if (!selectedEvent) {
      setEventError("Selecione o evento.");
      valid = false;
    } else setEventError("");
    return valid;
  }

  function submitPost() {
    if (!validatePost()) return;
    addFeedPost({
      eventId: selectedEvent.id,
      eventName: selectedEvent.name,
      text: newText.trim(),
      tag: `#${POST_TYPES.find((t) => t.key === selectedType)?.label || "Geral"}`,
      type: selectedType,
    });
    setNewText("");
    setComposing(false);
    setSelectedEvent(null);
    setSelectedType("geral");
    setTextError("");
    setEventError("");
  }

  function handleLogout() {
    Alert.alert("Sair da conta", "Deseja realmente sair?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: () => logout() },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>📡 Feed ao vivo</Text>
          <Text style={styles.headerSub}>{feedPosts.length} posts agora</Text>
        </View>
        <TouchableOpacity
          style={styles.composeBtn}
          onPress={() => setComposing(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.composeBtnText}>Postar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons
            name="log-out-outline"
            size={20}
            color="rgba(255,255,255,0.8)"
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {composing && (
          <View style={styles.composer}>
            <Text style={styles.composerLabel}>Selecione o evento</Text>
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
                      styles.eventChip,
                      selectedEvent?.id === e.id && styles.eventChipSelected,
                    ]}
                    onPress={() => {
                      setSelectedEvent(e);
                      setEventError("");
                    }}
                  >
                    <Text
                      style={[
                        styles.eventChipText,
                        selectedEvent?.id === e.id && { color: "#fff" },
                      ]}
                      numberOfLines={1}
                    >
                      {e.name}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
            {eventError ? (
              <Text style={styles.inlineError}>{eventError}</Text>
            ) : (
              <View style={{ height: 10 }} />
            )}

            <Text style={styles.composerLabel}>Tipo</Text>
            <View style={styles.typeRow}>
              {POST_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    styles.typeBtn,
                    selectedType === t.key && styles.typeBtnActive,
                  ]}
                  onPress={() => setSelectedType(t.key)}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      selectedType === t.key && { color: "#fff" },
                    ]}
                  >
                    {t.icon} {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[
                styles.composerInput,
                textError && styles.composerInputError,
              ]}
              placeholder="O que está acontecendo agora? (mín. 3 caracteres)"
              placeholderTextColor={COLORS.textMuted}
              value={newText}
              onChangeText={(v) => {
                setNewText(v);
                setTextError(validate.minLength(v, 3, "Post"));
              }}
              multiline
              autoFocus
              maxLength={280}
            />
            {textError ? (
              <Text style={styles.inlineError}>{textError}</Text>
            ) : null}
            <Text style={styles.charCount}>{newText.length}/280</Text>

            <View style={styles.composerActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setComposing(false);
                  setTextError("");
                  setEventError("");
                }}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.postBtn} onPress={submitPost}>
                <Text style={styles.postBtnText}>Publicar →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {sortedPosts.map((post) => (
            <PostCard key={post.id} post={post} onLike={likePost} />
          ))}
          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#fff" },
  headerSub: { fontSize: 12, color: "#9FE1CB", marginTop: 2 },
  composeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  composeBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  composer: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    padding: 14,
  },
  composerLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  eventChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.full,
    marginRight: 8,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    maxWidth: 180,
  },
  eventChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  eventChipText: { fontSize: 12, color: COLORS.text, fontWeight: "500" },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  typeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.full,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  typeBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeBtnText: { fontSize: 12, color: COLORS.text },
  composerInput: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  composerInputError: {
    borderColor: COLORS.danger,
    backgroundColor: "#FFF8F8",
  },
  inlineError: {
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
  composerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  cancelBtnText: { fontSize: 14, color: COLORS.textSecondary },
  postBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  postBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  scroll: { flex: 1 },
  postCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: RADIUS.lg,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  postLeft: { alignItems: "center", position: "relative" },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 13, fontWeight: "600" },
  verifiedDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: -2,
    right: -2,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },
  postBody: { flex: 1 },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  postName: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  verifiedBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  verifiedText: { fontSize: 9, color: COLORS.primaryDark, fontWeight: "600" },
  postTime: { fontSize: 11, color: COLORS.textMuted, marginLeft: "auto" },
  postEventName: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "500",
    marginBottom: 4,
  },
  postText: { fontSize: 13, color: COLORS.text, lineHeight: 19 },
  postFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  typeBadgeText: { fontSize: 10, fontWeight: "600" },
  postActions: { flexDirection: "row", gap: 12 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  actionText: { fontSize: 12, color: COLORS.textSecondary },
});
