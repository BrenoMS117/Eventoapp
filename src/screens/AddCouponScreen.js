import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { COLORS, RADIUS, SHADOW } from "../utils/theme";

const COUPON_TYPES = [
  {
    key: "bebida",
    icon: "🍹",
    label: "Bebida Grátis",
    desc: "Uma bebida do cardápio",
    color: "#1D9E75",
  },
  {
    key: "comida",
    icon: "🍕",
    label: "Comida Grátis",
    desc: "Um item do cardápio de comidas",
    color: "#D85A30",
  },
  {
    key: "desconto",
    icon: "🎟",
    label: "Desconto",
    desc: "Porcentagem ou valor de desconto",
    color: "#BA7517",
  },
  {
    key: "experiencia",
    icon: "🎧",
    label: "Experiência",
    desc: "Autógrafo, foto, acesso VIP etc.",
    color: "#533AB7",
  },
  {
    key: "brinde",
    icon: "🎁",
    label: "Brinde",
    desc: "Item especial como lembrança",
    color: "#D85A30",
  },
  {
    key: "acesso",
    icon: "🚪",
    label: "Acesso Especial",
    desc: "Área VIP, backstage etc.",
    color: "#0C447C",
  },
];

const EXPIRY_OPTIONS = [
  { key: null, label: "Sem validade" },
  { key: "00:00", label: "Meia-noite" },
  { key: "01:00", label: "01:00" },
  { key: "02:00", label: "02:00" },
  { key: "23:00", label: "23:00" },
  { key: "22:00", label: "22:00" },
];

export default function AddCouponScreen({ navigation }) {
  const { addCoupon, businessStats, events } = useApp();
  const [step, setStep] = useState(1); // 1: type, 2: details, 3: confirm
  const [selectedType, setSelectedType] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [conditions, setConditions] = useState("");
  const [qty, setQty] = useState("50");
  const [expiresAt, setExpiresAt] = useState(null);

  function handleNext() {
    if (step === 1 && !selectedType) {
      Alert.alert("Selecione um tipo de cupom");
      return;
    }
    if (step === 2) {
      if (!title.trim()) {
        Alert.alert("Adicione um título");
        return;
      }
      if (!description.trim()) {
        Alert.alert("Adicione uma descrição");
        return;
      }
      if (!qty || parseInt(qty) < 1) {
        Alert.alert("Adicione uma quantidade válida");
        return;
      }
    }
    if (step < 3) setStep(step + 1);
  }

  function handleSubmit() {
    const typeInfo = COUPON_TYPES.find((t) => t.key === selectedType);
    const newCoupon = {
      eventId: businessStats.activeEventId,
      eventName: businessStats.activeEventName,
      venue: businessStats.venueName,
      type: selectedType,
      typeLabel: typeInfo.label,
      icon: typeInfo.icon,
      title: title.trim(),
      description: description.trim(),
      conditions: conditions.trim() || "Válido apenas hoje. Um por pessoa.",
      expiresAt,
      totalQty: parseInt(qty),
      isNearby: true,
      gradient: [typeInfo.color, typeInfo.color + "AA"],
      highlightColor: typeInfo.color,
    };

    addCoupon(newCoupon);
    Alert.alert(
      "🎉 Cupom criado!",
      `"${title}" foi publicado. Usuários próximos serão notificados imediatamente.`,
      [{ text: "OK", onPress: () => navigation.goBack() }],
    );
  }

  const typeInfo = COUPON_TYPES.find((t) => t.key === selectedType);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (step > 1 ? setStep(step - 1) : navigation.goBack())}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Criar cupom</Text>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>{step}/3</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View
          style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]}
        />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* STEP 1: Choose type */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Que tipo de cupom?</Text>
              <Text style={styles.stepSub}>
                Escolha o que você quer oferecer aos seus clientes
              </Text>
              <View style={styles.typesGrid}>
                {COUPON_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.key}
                    style={[
                      styles.typeCard,
                      selectedType === t.key && {
                        borderColor: t.color,
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => setSelectedType(t.key)}
                  >
                    <View
                      style={[
                        styles.typeIconCircle,
                        { backgroundColor: t.color + "22" },
                      ]}
                    >
                      <Text style={styles.typeIcon}>{t.icon}</Text>
                    </View>
                    <Text
                      style={[
                        styles.typeLabel,
                        selectedType === t.key && { color: t.color },
                      ]}
                    >
                      {t.label}
                    </Text>
                    <Text style={styles.typeDesc}>{t.desc}</Text>
                    {selectedType === t.key && (
                      <View
                        style={[styles.typeCheck, { backgroundColor: t.color }]}
                      >
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* STEP 2: Details */}
          {step === 2 && typeInfo && (
            <View style={styles.stepContent}>
              <View
                style={[
                  styles.typePreview,
                  {
                    backgroundColor: typeInfo.color + "18",
                    borderColor: typeInfo.color + "44",
                  },
                ]}
              >
                <Text style={styles.typePreviewIcon}>{typeInfo.icon}</Text>
                <Text
                  style={[styles.typePreviewLabel, { color: typeInfo.color }]}
                >
                  {typeInfo.label}
                </Text>
              </View>

              <Text style={styles.fieldLabel}>Título do cupom *</Text>
              <TextInput
                style={styles.input}
                placeholder={`Ex: ${typeInfo.key === "bebida" ? "Caipirinha grátis para quem chegar até meia-noite" : typeInfo.key === "experiencia" ? "Foto + autógrafo com o artista" : "Descrição do cupom"}`}
                placeholderTextColor={COLORS.textMuted}
                value={title}
                onChangeText={setTitle}
                maxLength={60}
              />
              <Text style={styles.charCount}>{title.length}/60</Text>

              <Text style={styles.fieldLabel}>Descrição detalhada *</Text>
              <TextInput
                style={[styles.input, styles.inputMulti]}
                placeholder="Explique o que o cliente vai receber e como funciona..."
                placeholderTextColor={COLORS.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={200}
              />
              <Text style={styles.charCount}>{description.length}/200</Text>

              <Text style={styles.fieldLabel}>Condições (opcional)</Text>
              <TextInput
                style={[styles.input, styles.inputMulti]}
                placeholder="Ex: Válido 1 por CPF. Não cumulativo com outras promoções."
                placeholderTextColor={COLORS.textMuted}
                value={conditions}
                onChangeText={setConditions}
                multiline
                maxLength={150}
              />

              <Text style={styles.fieldLabel}>Quantidade disponível *</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() =>
                    setQty((q) => String(Math.max(1, parseInt(q || "1") - 5)))
                  }
                >
                  <Text style={styles.qtyBtnText}>−5</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.qtyInput}
                  value={qty}
                  onChangeText={setQty}
                  keyboardType="number-pad"
                  maxLength={4}
                />
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQty((q) => String(parseInt(q || "0") + 5))}
                >
                  <Text style={styles.qtyBtnText}>+5</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>Validade</Text>
              <View style={styles.expiryGrid}>
                {EXPIRY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={String(opt.key)}
                    style={[
                      styles.expiryBtn,
                      expiresAt === opt.key && {
                        backgroundColor: COLORS.primary,
                        borderColor: COLORS.primary,
                      },
                    ]}
                    onPress={() => setExpiresAt(opt.key)}
                  >
                    <Text
                      style={[
                        styles.expiryBtnText,
                        expiresAt === opt.key && { color: "#fff" },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* STEP 3: Preview & Confirm */}
          {step === 3 && typeInfo && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Confirme seu cupom</Text>
              <Text style={styles.stepSub}>
                É assim que os usuários vão ver
              </Text>

              {/* Preview card */}
              <View style={styles.previewCard}>
                <View
                  style={[
                    styles.previewBand,
                    { backgroundColor: typeInfo.color },
                  ]}
                >
                  <Text style={styles.previewIcon}>{typeInfo.icon}</Text>
                  <View>
                    <Text style={styles.previewBandType}>{typeInfo.label}</Text>
                    <Text style={styles.previewBandEvent}>
                      {businessStats.activeEventName}
                    </Text>
                  </View>
                  <View style={[styles.nearbyPill]}>
                    <View style={styles.nearbyDot} />
                    <Text style={styles.nearbyText}>Perto</Text>
                  </View>
                </View>
                <View style={styles.previewBody}>
                  <Text style={styles.previewTitle}>{title}</Text>
                  <Text style={styles.previewDesc}>{description}</Text>
                  <View style={styles.previewMeta}>
                    <Text style={styles.previewMetaText}>
                      📍 {businessStats.venueName}
                    </Text>
                    {expiresAt && (
                      <Text style={styles.previewMetaText}>
                        ⏱ Até {expiresAt}
                      </Text>
                    )}
                  </View>
                  <View style={styles.previewQty}>
                    <Text style={styles.previewQtyText}>
                      {qty}/{qty} disponíveis
                    </Text>
                  </View>
                  <View style={styles.progressBg}>
                    <View
                      style={[
                        styles.progressFill2,
                        { width: "100%", backgroundColor: typeInfo.color },
                      ]}
                    />
                  </View>
                  <View style={styles.previewAction}>
                    <Text
                      style={[
                        styles.previewActionText,
                        { color: typeInfo.color },
                      ]}
                    >
                      🎯 Você está no local — Resgatar agora →
                    </Text>
                  </View>
                </View>
              </View>

              {/* Notification info */}
              <View style={styles.notifInfo}>
                <Ionicons
                  name="notifications"
                  size={18}
                  color={COLORS.primary}
                />
                <Text style={styles.notifText}>
                  Usuários próximos serão notificados assim que o cupom for
                  publicado
                </Text>
              </View>

              {/* Summary */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tipo</Text>
                  <Text style={styles.summaryValue}>
                    {typeInfo.icon} {typeInfo.label}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Quantidade</Text>
                  <Text style={styles.summaryValue}>{qty} unidades</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Validade</Text>
                  <Text style={styles.summaryValue}>
                    {expiresAt || "Sem limite"}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Evento</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { flex: 1, textAlign: "right" },
                    ]}
                    numberOfLines={1}
                  >
                    {businessStats.activeEventName}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Bottom CTA */}
        <View style={styles.bottomBar}>
          {step < 3 ? (
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>Continuar →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.publishBtn} onPress={handleSubmit}>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.publishBtnText}>Publicar cupom agora</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primaryDark,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 14,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    marginLeft: 10,
    fontSize: 17,
    fontWeight: "600",
    color: "#fff",
  },
  stepIndicator: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  stepText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  progressBar: { height: 3, backgroundColor: COLORS.border },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    transition: "0.3s",
  },
  scroll: { flex: 1 },
  stepContent: { padding: 16 },
  stepTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  stepSub: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 20 },
  typesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  typeCard: {
    width: "47%",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    position: "relative",
    ...SHADOW.sm,
  },
  typeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  typeIcon: { fontSize: 22 },
  typeLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 3,
  },
  typeDesc: { fontSize: 11, color: COLORS.textSecondary, lineHeight: 15 },
  typeCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: "absolute",
    top: 10,
    right: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  typePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
  },
  typePreviewIcon: { fontSize: 28 },
  typePreviewLabel: { fontSize: 14, fontWeight: "600" },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  inputMulti: { minHeight: 80, textAlignVertical: "top" },
  charCount: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: "right",
    marginTop: 4,
  },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  qtyBtn: {
    width: 50,
    height: 44,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyBtnText: { fontSize: 16, fontWeight: "600", color: COLORS.primary },
  qtyInput: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  expiryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  expiryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  expiryBtnText: { fontSize: 13, color: COLORS.text },
  previewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: COLORS.border,
    marginBottom: 14,
    ...SHADOW.md,
  },
  previewBand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  previewIcon: { fontSize: 26 },
  previewBandType: {
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  previewBandEvent: { fontSize: 12, color: "#fff", fontWeight: "500" },
  nearbyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginLeft: "auto",
  },
  nearbyDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#4ade80",
  },
  nearbyText: { fontSize: 10, color: "#fff", fontWeight: "600" },
  previewBody: { padding: 14 },
  previewTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  previewDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  previewMeta: { flexDirection: "row", gap: 14, marginBottom: 8 },
  previewMetaText: { fontSize: 11, color: COLORS.textMuted },
  previewQty: { marginBottom: 4 },
  previewQtyText: { fontSize: 11, color: COLORS.textSecondary },
  progressBg: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill2: { height: "100%", borderRadius: 2 },
  previewAction: {
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  previewActionText: { fontSize: 13, fontWeight: "600" },
  notifInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 14,
  },
  notifText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primaryDark,
    lineHeight: 18,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  summaryLabel: { fontSize: 13, color: COLORS.textSecondary },
  summaryValue: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  bottomBar: {
    padding: 14,
    backgroundColor: COLORS.surface,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  nextBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 15,
    alignItems: "center",
  },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  publishBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 15,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  publishBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
