import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { COLORS, RADIUS, SHADOW } from "../utils/theme";

// ─────────────────────────────────────────────────────────────────────────────
// QRCode — visual representation (same pattern as CouponDetailScreen)
// ─────────────────────────────────────────────────────────────────────────────
function QRCodeDisplay({ code, color }) {
  return (
    <View style={[qr.wrap, { borderColor: color }]}>
      <View style={qr.grid}>
        {[0, 1, 2, 3, 4, 5, 6].map((row) => (
          <View key={row} style={{ flexDirection: "row", gap: 2 }}>
            {[0, 1, 2, 3, 4, 5, 6].map((col) => {
              const isCorner =
                (row < 2 && col < 2) ||
                (row < 2 && col > 4) ||
                (row > 4 && col < 2);
              const filled = isCorner || Math.sin(row * col + 2.3) > 0.05;
              return (
                <View
                  key={col}
                  style={[
                    qr.cell,
                    { backgroundColor: filled ? color : "transparent" },
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
      <Text style={[qr.code, { color }]}>{code}</Text>
    </View>
  );
}

const qr = StyleSheet.create({
  wrap: {
    borderWidth: 2, borderRadius: RADIUS.lg,
    padding: 12, alignItems: "center",
    backgroundColor: COLORS.bgCard,
  },
  grid: { gap: 2, marginBottom: 8 },
  cell: { width: 9, height: 9, borderRadius: 1.5 },
  code: { fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
});

// ─────────────────────────────────────────────────────────────────────────────
// RedemptionCard — shows a single past redemption with its QR code
// ─────────────────────────────────────────────────────────────────────────────
function RedemptionCard({ coupon, qrCode, redeemedAt }) {
  const [expanded, setExpanded] = useState(false);
  const dateStr = redeemedAt
    ? new Date(redeemedAt).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
      })
    : "";

  return (
    <TouchableOpacity
      style={[rc.card, { borderColor: (coupon?.highlightColor ?? COLORS.primary) + "55" }]}
      onPress={() => setExpanded((v) => !v)}
      activeOpacity={0.85}
    >
      <View style={rc.header}>
        <View style={[rc.iconWrap, { backgroundColor: (coupon?.highlightColor ?? COLORS.primary) + "33" }]}>
          <Text style={{ fontSize: 20 }}>{coupon?.icon ?? "🎟"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={rc.title} numberOfLines={1}>
            {coupon?.title ?? "Cupom"}
          </Text>
          <Text style={rc.venue} numberOfLines={1}>
            {coupon?.venue ?? ""}{dateStr ? ` · ${dateStr}` : ""}
          </Text>
        </View>
        <View style={rc.statusBadge}>
          <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
          <Text style={rc.statusText}>Resgatado</Text>
        </View>
      </View>

      {expanded && qrCode ? (
        <View style={rc.qrSection}>
          <QRCodeDisplay code={qrCode} color={coupon?.highlightColor ?? COLORS.primary} />
          <Text style={rc.qrHint}>Apresente ao atendente</Text>
        </View>
      ) : (
        <Text style={rc.expandHint}>
          {expanded ? "▲ Recolher" : "▼ Ver QR Code"}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const rc = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    marginBottom: 10, padding: 12,
    borderWidth: 1.5, overflow: "hidden",
  },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconWrap: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    justifyContent: "center", alignItems: "center",
  },
  title: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  venue: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: COLORS.success + "22",
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  statusText: { fontSize: 11, fontWeight: "700", color: COLORS.success },
  qrSection: { alignItems: "center", marginTop: 12 },
  qrHint: { fontSize: 11, color: COLORS.textSub, marginTop: 6 },
  expandHint: {
    fontSize: 11, color: COLORS.primary, textAlign: "center",
    marginTop: 8, fontWeight: "600",
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// CouponCard — horizontal card in the "Meus Cupons" carousel
// ─────────────────────────────────────────────────────────────────────────────
function CouponCard({ coupon, redeemed, onPress }) {
  const esgotado = coupon.remainingQty === 0;
  return (
    <TouchableOpacity
      style={[cc.card, redeemed && { opacity: 0.6 }]}
      onPress={onPress}
      activeOpacity={0.88}
      disabled={esgotado && !redeemed}
    >
      <View style={[cc.band, { backgroundColor: coupon.gradient[0] }]}>
        <Text style={cc.icon}>{coupon.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={cc.typeLabel}>{coupon.typeLabel}</Text>
          <Text style={cc.title}>{coupon.title}</Text>
        </View>
        <View style={cc.tear}>
          <Text style={cc.tearText}>CUPOM</Text>
        </View>
      </View>
      {redeemed ? (
        <View style={cc.redeemedBanner}>
          <Ionicons name="checkmark-circle" size={13} color={COLORS.success} />
          <Text style={cc.redeemedText}>Resgatado</Text>
        </View>
      ) : esgotado ? (
        <View style={cc.soldOutBanner}>
          <Text style={cc.soldOutText}>Esgotado</Text>
        </View>
      ) : (
        <View style={cc.stockRow}>
          <Text style={cc.stockText}>
            {coupon.remainingQty}/{coupon.totalQty} restantes
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const cc = StyleSheet.create({
  card: {
    width: 220, backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl, overflow: "hidden",
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  band: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, minHeight: 76 },
  icon: { fontSize: 26 },
  typeLabel: { fontSize: 9, color: "rgba(255,255,255,0.7)", fontWeight: "700", textTransform: "uppercase", marginBottom: 2 },
  title: { fontSize: 14, fontWeight: "900", color: "#fff" },
  tear: {
    width: 20, alignItems: "center",
    borderLeftWidth: 1.5, borderLeftColor: "rgba(255,255,255,0.25)",
    borderStyle: "dashed", paddingLeft: 4, height: 50, justifyContent: "center",
  },
  tearText: { fontSize: 7, color: "rgba(255,255,255,0.5)", transform: [{ rotate: "90deg" }], letterSpacing: 2 },
  redeemedBanner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 8 },
  redeemedText: { fontSize: 12, color: COLORS.success, fontWeight: "600" },
  soldOutBanner: { paddingVertical: 8, alignItems: "center" },
  soldOutText: { fontSize: 12, color: COLORS.textMuted },
  stockRow: { paddingHorizontal: 12, paddingVertical: 8 },
  stockText: { fontSize: 11, color: COLORS.textMuted },
});

// ─────────────────────────────────────────────────────────────────────────────
// RewardsScreen
// ─────────────────────────────────────────────────────────────────────────────
export default function RewardsScreen({ navigation }) {
  const {
    coupons,
    isCouponRedeemed,
    redemptionMap,
    currentUser,
    logout,
    updateProfile,
    updatePassword,
  } = useApp();

  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [editName, setEditName]         = useState("");
  const [editAvatar, setEditAvatar]     = useState("");
  const [newPassword, setNewPassword]   = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPwd, setShowNewPwd]     = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  function openProfileModal() {
    setEditName(currentUser?.name || "");
    setEditAvatar(currentUser?.avatar || "");
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPwd(false);
    setShowConfirmPwd(false);
    setProfileModalVisible(true);
  }

  async function handleSaveProfile() {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      Alert.alert("Atenção", "O nome não pode ficar vazio.");
      return;
    }
    // Validação de senha apenas se o usuário preencheu
    if (newPassword) {
      if (newPassword.length < 6) {
        Alert.alert("Atenção", "A nova senha deve ter pelo menos 6 caracteres.");
        return;
      }
      if (newPassword !== confirmPassword) {
        Alert.alert("Atenção", "As senhas não coincidem.");
        return;
      }
    }

    setSavingProfile(true);

    // Atualiza nome/avatar
    const profileResult = await updateProfile({
      name: trimmedName,
      avatar: editAvatar.trim() || trimmedName.slice(0, 2).toUpperCase(),
    });

    // Atualiza senha (somente se preenchida)
    const passwordResult = newPassword
      ? await updatePassword(newPassword)
      : { error: null };

    setSavingProfile(false);

    const error = profileResult.error || passwordResult.error;
    if (error) {
      Alert.alert("Erro", error);
    } else {
      setProfileModalVisible(false);
    }
  }

  const redeemedList = Object.values(redemptionMap).sort(
    (a, b) => new Date(b.redeemedAt) - new Date(a.redeemedAt),
  );

  function handleLogout() {
    if (Platform.OS === "web") {
      if (window.confirm("Deseja sair?")) logout();
    } else {
      Alert.alert("Sair", "Deseja sair?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Sair", onPress: logout },
      ]);
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="pulse" size={18} color={COLORS.primary} />
          <Text style={s.logo}>LiveVibe</Text>
        </View>
        <Text style={s.headerTitle}>Cupons & Resgates</Text>
        <TouchableOpacity style={s.iconBtn} onPress={openProfileModal}>
          <Ionicons name="person-circle-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
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
          <Ionicons name="exit-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={s.profileCard}>
          <View style={s.profileAvatar}>
            <Text style={s.profileAvatarText}>{currentUser?.avatar || "U"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.profileName}>{currentUser?.name || "Usuário"}</Text>
            <Text style={s.profileSub}>{currentUser?.email || ""}</Text>
          </View>
          <View style={s.statsChip}>
            <Text style={s.statsChipNum}>{redeemedList.length}</Text>
            <Text style={s.statsChipLabel}>resgates</Text>
          </View>
        </View>

        {/* My Coupons — horizontal scroll */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Cupons Disponíveis</Text>
          {coupons.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🎟</Text>
              <Text style={s.emptyText}>Nenhum cupom disponível no momento</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 16 }}
            >
              {coupons.map((c) => (
                <CouponCard
                  key={c.id}
                  coupon={c}
                  redeemed={isCouponRedeemed(c.id)}
                  onPress={() => navigation?.navigate?.("CouponDetail", { couponId: c.id })}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Redemption history */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Histórico de Resgates</Text>
            {redeemedList.length > 0 && (
              <View style={s.countBadge}>
                <Text style={s.countBadgeText}>{redeemedList.length}</Text>
              </View>
            )}
          </View>
          {redeemedList.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🎫</Text>
              <Text style={s.emptyText}>Nenhum resgate ainda</Text>
              <Text style={s.emptySubText}>
                Vá a um evento e resgate cupons para vê-los aqui
              </Text>
            </View>
          ) : (
            redeemedList.map((r) => {
              const coupon = coupons.find((c) => c.id === r.couponId);
              return (
                <RedemptionCard
                  key={r.couponId}
                  coupon={coupon}
                  qrCode={r.qrCode}
                  redeemedAt={r.redeemedAt}
                />
              );
            })
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <Modal
        visible={profileModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            style={pm.overlay}
            activeOpacity={1}
            onPress={() => setProfileModalVisible(false)}
          >
            <TouchableOpacity activeOpacity={1} style={pm.sheet}>
              {/* Cabeçalho */}
              <View style={pm.sheetHeader}>
                <Text style={pm.sheetTitle}>Editar Perfil</Text>
                <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                  <Ionicons name="close" size={22} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Preview do avatar */}
              <View style={pm.avatarPreview}>
                <Text style={pm.avatarPreviewText}>
                  {editAvatar || editName.slice(0, 2).toUpperCase() || "U"}
                </Text>
              </View>

              {/* Campo nome */}
              <Text style={pm.label}>Nome</Text>
              <TextInput
                style={pm.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Seu nome"
                placeholderTextColor={COLORS.textMuted}
                autoCorrect={false}
              />

              {/* Campo avatar */}
              <Text style={pm.label}>Iniciais (até 2 letras)</Text>
              <TextInput
                style={pm.input}
                value={editAvatar}
                onChangeText={(v) => setEditAvatar(v.slice(0, 2).toUpperCase())}
                placeholder="Ex: AB"
                placeholderTextColor={COLORS.textMuted}
                maxLength={2}
                autoCapitalize="characters"
              />

              {/* Divisor */}
              <View style={pm.divider} />
              <Text style={pm.sectionLabel}>Alterar Senha</Text>
              <Text style={pm.sectionHint}>Deixe em branco para não alterar</Text>

              {/* Nova senha */}
              <Text style={pm.label}>Nova Senha</Text>
              <View style={pm.inputRow}>
                <TextInput
                  style={[pm.input, { flex: 1, marginBottom: 0, borderWidth: 0, borderRadius: 0 }]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showNewPwd}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={pm.eyeBtn} onPress={() => setShowNewPwd(v => !v)}>
                  <Ionicons
                    name={showNewPwd ? "eye-off-outline" : "eye-outline"}
                    size={20} color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {/* Confirmar senha */}
              <Text style={[pm.label, { marginTop: 12 }]}>Confirmar Nova Senha</Text>
              <View style={pm.inputRow}>
                <TextInput
                  style={[pm.input, { flex: 1, marginBottom: 0, borderWidth: 0, borderRadius: 0 }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repita a nova senha"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showConfirmPwd}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={pm.eyeBtn} onPress={() => setShowConfirmPwd(v => !v)}>
                  <Ionicons
                    name={showConfirmPwd ? "eye-off-outline" : "eye-outline"}
                    size={20} color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {/* Botão salvar */}
              <TouchableOpacity
                style={[pm.saveBtn, savingProfile && { opacity: 0.7 }]}
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={pm.saveBtnText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 10, gap: 8,
  },
  logo: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  headerTitle: { flex: 1, fontSize: 14, fontWeight: "700", color: COLORS.text, textAlign: "center" },
  iconBtn: { padding: 4 },

  // Profile card
  profileCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: COLORS.bgCard, marginHorizontal: 16, marginBottom: 6,
    borderRadius: RADIUS.xl, padding: 16,
    borderWidth: 0.5, borderColor: COLORS.border, ...SHADOW.sm,
  },
  profileAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.primary + "44",
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: COLORS.primary,
  },
  profileAvatarText: { fontSize: 18, fontWeight: "800", color: COLORS.primary },
  profileName: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  profileSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  statsChip: {
    alignItems: "center", backgroundColor: COLORS.primary + "22",
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 0.5, borderColor: COLORS.primary + "55",
  },
  statsChipNum: { fontSize: 18, fontWeight: "900", color: COLORS.primary },
  statsChipLabel: { fontSize: 10, color: COLORS.primary, fontWeight: "600" },

  // Sections
  section: { paddingLeft: 16, marginTop: 20, marginBottom: 4 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, paddingRight: 16 },
  sectionTitle: {
    fontSize: 12, fontWeight: "800", color: COLORS.textMuted,
    textTransform: "uppercase", letterSpacing: 0.8,
  },
  countBadge: {
    backgroundColor: COLORS.primary + "22",
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: RADIUS.full, borderWidth: 0.5,
    borderColor: COLORS.primary + "55",
  },
  countBadgeText: { fontSize: 11, fontWeight: "700", color: COLORS.primary },

  // Empty states
  emptyState: {
    alignItems: "center", paddingVertical: 24,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    borderWidth: 0.5, borderColor: COLORS.border, marginRight: 16,
  },
  emptyText: { fontSize: 14, color: COLORS.textSub, fontWeight: "500" },
  emptySubText: { fontSize: 12, color: COLORS.textMuted, marginTop: 4, textAlign: "center", paddingHorizontal: 20 },
});

// ─── Estilos do modal de perfil ───────────────────────────────────────────────
const pm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    ...SHADOW.md,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 17, fontWeight: "800", color: COLORS.text },

  avatarPreview: {
    alignSelf: "center",
    width: 72, height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary + "33",
    borderWidth: 2, borderColor: COLORS.primary,
    justifyContent: "center", alignItems: "center",
    marginBottom: 24,
  },
  avatarPreviewText: { fontSize: 26, fontWeight: "900", color: COLORS.primary },

  label: {
    fontSize: 12, fontWeight: "700",
    color: COLORS.textMuted, textTransform: "uppercase",
    letterSpacing: 0.7, marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: COLORS.text,
    marginBottom: 16,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20,
  },
  sectionLabel: {
    fontSize: 14, fontWeight: "800", color: COLORS.text, marginBottom: 2,
  },
  sectionHint: {
    fontSize: 12, color: COLORS.textMuted, marginBottom: 14,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bg,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    marginBottom: 0,
    overflow: "hidden",
  },
  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  saveBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },
});
