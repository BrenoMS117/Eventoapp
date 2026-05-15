import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { COLORS, RADIUS, SHADOW } from "../utils/theme";

const TIPOS_CUPOM = [
  { key: "bebida", icon: "🥃", label: "Drinque Grátis", cor: "#E83B5C" },
  { key: "comida", icon: "🍕", label: "Comida Grátis", cor: "#D85A30" },
  { key: "desconto", icon: "🎟", label: "Desconto", cor: "#F59E0B" },
  { key: "experiencia", icon: "⭐", label: "Experiência VIP", cor: "#7B2FBE" },
  { key: "brinde", icon: "🎁", label: "Brinde", cor: "#059669" },
  { key: "acesso", icon: "🚪", label: "Acesso Especial", cor: "#0C447C" },
];

const OPCOES_VALIDADE = [
  { key: null, label: "Sem validade" },
  { key: "00:00", label: "Meia-noite" },
  { key: "01:00", label: "01:00" },
  { key: "02:00", label: "02:00" },
  { key: "22:00", label: "22:00" },
  { key: "23:00", label: "23:00" },
];

export default function AddCouponScreen({ navigation }) {
  const { addCoupon, businessStats } = useApp();
  const [etapa, setEtapa] = useState(1);
  const [tipoSelecionado, setTipoSelecionado] = useState(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [condicoes, setCondicoes] = useState("");
  const [quantidade, setQuantidade] = useState("50");
  const [validade, setValidade] = useState(null);

  function avancar() {
    if (etapa === 1 && !tipoSelecionado) {
      Alert.alert("Selecione um tipo de cupom");
      return;
    }
    if (etapa === 2) {
      if (!titulo.trim()) {
        Alert.alert("Adicione um título");
        return;
      }
      if (!descricao.trim()) {
        Alert.alert("Adicione uma descrição");
        return;
      }
      if (!quantidade || parseInt(quantidade) < 1) {
        Alert.alert("Quantidade inválida");
        return;
      }
    }
    if (etapa < 3) setEtapa(etapa + 1);
  }

  function publicar() {
    const tipoInfo = TIPOS_CUPOM.find((t) => t.key === tipoSelecionado);
    addCoupon({
      eventId: businessStats.activeEventId,
      eventName: businessStats.activeEventName,
      venue: businessStats.venueName,
      type: tipoSelecionado,
      typeLabel: tipoInfo.label,
      icon: tipoInfo.icon,
      title: titulo.trim(),
      description: descricao.trim(),
      conditions: condicoes.trim() || "Válido apenas hoje. Um por pessoa.",
      expiresAt: validade,
      totalQty: parseInt(quantidade),
      timerSeconds: validade ? 3600 : 0,
      gradient: [tipoInfo.cor, tipoInfo.cor + "88"],
      highlightColor: tipoInfo.cor,
    });
    if(Platform.OS === 'web'){
    window.alert(`Cupom "${titulo}" publicado com sucesso!`);
    navigation.goBack();
    } else{
      Alert.alert(
      "Cupom publicado!",
      `"${titulo}" foi enviado para usuários próximos!`,
      [{ text: "OK", onPress: () => navigation.goBack() }],
    );
    }
  }

  const tipoInfo = TIPOS_CUPOM.find((t) => t.key === tipoSelecionado);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Cabeçalho */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.voltarBtn}
          onPress={() =>
            etapa > 1 ? setEtapa(etapa - 1) : navigation.goBack()
          }
        >
          <Ionicons name="chevron-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={s.headerTitulo}>Criar Cupom</Text>
        <View style={s.etapaBadge}>
          <Text style={s.etapaBadgeTexto}>{etapa}/3</Text>
        </View>
      </View>

      {/* Barra de progresso */}
      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${(etapa / 3) * 100}%` }]} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ETAPA 1 — Tipo */}
          {etapa === 1 && (
            <View style={s.etapaConteudo}>
              <Text style={s.etapaTitulo}>Que tipo de cupom?</Text>
              <Text style={s.etapaSub}>
                Escolha o que você quer oferecer aos seus clientes
              </Text>
              <View style={s.tiposGrid}>
                {TIPOS_CUPOM.map((t) => (
                  <TouchableOpacity
                    key={t.key}
                    style={[
                      s.tipoCard,
                      tipoSelecionado === t.key && {
                        borderColor: t.cor,
                        backgroundColor: t.cor + "18",
                      },
                    ]}
                    onPress={() => setTipoSelecionado(t.key)}
                  >
                    <View
                      style={[
                        s.tipoIconCircle,
                        { backgroundColor: t.cor + "33" },
                      ]}
                    >
                      <Text style={s.tipoIcon}>{t.icon}</Text>
                    </View>
                    <Text
                      style={[
                        s.tipoLabel,
                        tipoSelecionado === t.key && { color: t.cor },
                      ]}
                    >
                      {t.label}
                    </Text>
                    {tipoSelecionado === t.key && (
                      <View style={[s.tipoCheck, { backgroundColor: t.cor }]}>
                        <Ionicons name="checkmark" size={11} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ETAPA 2 — Detalhes */}
          {etapa === 2 && tipoInfo && (
            <View style={s.etapaConteudo}>
              <View
                style={[
                  s.tipoPreview,
                  {
                    backgroundColor: tipoInfo.cor + "22",
                    borderColor: tipoInfo.cor + "55",
                  },
                ]}
              >
                <Text style={{ fontSize: 28, marginRight: 10 }}>
                  {tipoInfo.icon}
                </Text>
                <Text style={[s.tipoPreviewLabel, { color: tipoInfo.cor }]}>
                  {tipoInfo.label}
                </Text>
              </View>

              <Text style={s.fieldLabel}>
                Título <Text style={{ color: COLORS.primary }}>*</Text>
              </Text>
              <TextInput
                style={s.input}
                placeholder="Ex: Shot Grátis para Vibbers Gold"
                placeholderTextColor={COLORS.textMuted}
                value={titulo}
                onChangeText={setTitulo}
                maxLength={60}
              />
              <Text style={s.charCount}>{titulo.length}/60</Text>

              <Text style={s.fieldLabel}>
                Descrição <Text style={{ color: COLORS.primary }}>*</Text>
              </Text>
              <TextInput
                style={[s.input, s.inputMulti]}
                placeholder="Descreva o que o cliente vai receber..."
                placeholderTextColor={COLORS.textMuted}
                value={descricao}
                onChangeText={setDescricao}
                multiline
                maxLength={200}
              />
              <Text style={s.charCount}>{descricao.length}/200</Text>

              <Text style={s.fieldLabel}>Condições de uso</Text>
              <TextInput
                style={s.input}
                placeholder="Ex: Válido 1 por CPF. Não cumulativo."
                placeholderTextColor={COLORS.textMuted}
                value={condicoes}
                onChangeText={setCondicoes}
                maxLength={150}
              />

              <Text style={s.fieldLabel}>
                Quantidade disponível{" "}
                <Text style={{ color: COLORS.primary }}>*</Text>
              </Text>
              <View style={s.qtdRow}>
                <TouchableOpacity
                  style={s.qtdBtn}
                  onPress={() =>
                    setQuantidade((q) =>
                      String(Math.max(1, parseInt(q || "1") - 5)),
                    )
                  }
                >
                  <Text style={s.qtdBtnTexto}>−5</Text>
                </TouchableOpacity>
                <TextInput
                  style={s.qtdInput}
                  value={quantidade}
                  onChangeText={setQuantidade}
                  keyboardType="number-pad"
                  maxLength={4}
                />
                <TouchableOpacity
                  style={s.qtdBtn}
                  onPress={() =>
                    setQuantidade((q) => String(parseInt(q || "0") + 5))
                  }
                >
                  <Text style={s.qtdBtnTexto}>+5</Text>
                </TouchableOpacity>
              </View>

              <Text style={s.fieldLabel}>Validade</Text>
              <View style={s.validadeGrid}>
                {OPCOES_VALIDADE.map((opt) => (
                  <TouchableOpacity
                    key={String(opt.key)}
                    style={[
                      s.validadeBtn,
                      validade === opt.key && {
                        backgroundColor: COLORS.primary,
                        borderColor: COLORS.primary,
                      },
                    ]}
                    onPress={() => setValidade(opt.key)}
                  >
                    <Text
                      style={[
                        s.validadeBtnTexto,
                        validade === opt.key && { color: "#fff" },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ETAPA 3 — Preview e confirmação */}
          {etapa === 3 && tipoInfo && (
            <View style={s.etapaConteudo}>
              <Text style={s.etapaTitulo}>Confirme o cupom</Text>
              <Text style={s.etapaSub}>
                É assim que os usuários vão visualizar
              </Text>

              {/* Preview */}
              <View style={s.previewCard}>
                <View
                  style={[s.previewBanda, { backgroundColor: tipoInfo.cor }]}
                >
                  <Text style={{ fontSize: 26, marginRight: 10 }}>
                    {tipoInfo.icon}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 10,
                        color: "rgba(255,255,255,0.75)",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        marginBottom: 2,
                      }}
                    >
                      {tipoInfo.label}
                    </Text>
                    <Text
                      style={{ fontSize: 16, fontWeight: "900", color: "#fff" }}
                    >
                      {titulo}
                    </Text>
                  </View>
                  <View style={s.proximoDot}>
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "#4ade80",
                      }}
                    />
                    <Text style={{ fontSize: 9, color: "#fff" }}>Perto</Text>
                  </View>
                </View>
                <View style={s.previewCorpo}>
                  <Text
                    style={{
                      fontSize: 13,
                      color: COLORS.textSub,
                      marginBottom: 8,
                      lineHeight: 18,
                    }}
                  >
                    {descricao}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <Text style={{ fontSize: 11, color: COLORS.textMuted }}>
                      📍 {businessStats.venueName}
                    </Text>
                    {validade && (
                      <Text style={{ fontSize: 11, color: COLORS.textMuted }}>
                        ⏱ Até {validade}
                      </Text>
                    )}
                  </View>
                  <Text
                    style={{
                      fontSize: 11,
                      color: COLORS.textMuted,
                      marginBottom: 5,
                    }}
                  >
                    {quantidade}/{quantidade} disponíveis
                  </Text>
                  <View style={s.previewProgress}>
                    <View
                      style={[
                        s.previewProgressFill,
                        { backgroundColor: tipoInfo.cor, width: "100%" },
                      ]}
                    />
                  </View>
                  <View style={s.previewCTA}>
                    <Text style={[s.previewCTATexto, { color: tipoInfo.cor }]}>
                      🎯 Você está no local — Resgatar →
                    </Text>
                  </View>
                </View>
              </View>

              {/* Aviso de notificação */}
              <View style={s.notifCard}>
                <Ionicons
                  name="notifications"
                  size={18}
                  color={COLORS.primary}
                />
                <Text style={s.notifTexto}>
                  Usuários próximos serão notificados instantaneamente após a
                  publicação.
                </Text>
              </View>

              {/* Resumo */}
              <View style={s.resumoCard}>
                {[
                  ["Tipo", `${tipoInfo.icon} ${tipoInfo.label}`],
                  ["Título", titulo],
                  ["Quantidade", `${quantidade} unidades`],
                  ["Validade", validade || "Sem limite"],
                  ["Evento", businessStats.activeEventName],
                ].map(([label, val]) => (
                  <View key={label} style={s.resumoRow}>
                    <Text style={s.resumoLabel}>{label}</Text>
                    <Text style={s.resumoVal} numberOfLines={1}>
                      {val}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Botão inferior */}
        <View style={s.bottomBar}>
          {etapa < 3 ? (
            <TouchableOpacity style={s.proximoBtn} onPress={avancar}>
              <Text style={s.proximoBtnTexto}>Continuar →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.publicarBtn} onPress={publicar}>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={s.publicarBtnTexto}>Publicar cupom agora</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 10,
  },
  voltarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgCard,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  headerTitulo: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
  },
  etapaBadge: {
    backgroundColor: COLORS.primary + "22",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 0.5,
    borderColor: COLORS.primary + "55",
  },
  etapaBadgeTexto: { color: COLORS.primary, fontSize: 12, fontWeight: "700" },
  progressBar: { height: 3, backgroundColor: COLORS.bgOverlay },
  progressFill: { height: "100%", backgroundColor: COLORS.primary },
  etapaConteudo: { padding: 16 },
  etapaTitulo: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 4,
  },
  etapaSub: { fontSize: 14, color: COLORS.textSub, marginBottom: 18 },
  tiposGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tipoCard: {
    width: "47%",
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    position: "relative",
  },
  tipoIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  tipoIcon: { fontSize: 24 },
  tipoLabel: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  tipoCheck: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  tipoPreview: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
  },
  tipoPreviewLabel: { fontSize: 15, fontWeight: "800" },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSub,
    marginBottom: 8,
    marginTop: 14,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: 13,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputMulti: { minHeight: 80, textAlignVertical: "top" },
  charCount: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: "right",
    marginTop: 4,
  },
  qtdRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  qtdBtn: {
    width: 52,
    height: 48,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  qtdBtnTexto: { fontSize: 18, fontWeight: "700", color: COLORS.primary },
  qtdInput: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },
  validadeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  validadeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  validadeBtnTexto: { fontSize: 13, color: COLORS.text },
  previewCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  previewBanda: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  proximoDot: { alignItems: "center", gap: 3 },
  previewCorpo: { padding: 14 },
  previewProgress: {
    height: 4,
    backgroundColor: COLORS.bgOverlay,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 10,
  },
  previewProgressFill: { height: "100%", borderRadius: 2 },
  previewCTA: {
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  previewCTATexto: { fontSize: 13, fontWeight: "700" },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: COLORS.primary + "18",
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: COLORS.primary + "44",
  },
  notifTexto: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primaryLight,
    lineHeight: 18,
  },
  resumoCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  resumoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 13,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  resumoLabel: { fontSize: 13, color: COLORS.textSub },
  resumoVal: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    flex: 1,
    textAlign: "right",
  },
  bottomBar: {
    padding: 14,
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  proximoBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 16,
    alignItems: "center",
    ...SHADOW.glow,
  },
  proximoBtnTexto: { color: "#fff", fontSize: 16, fontWeight: "800" },
  publicarBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 16,
    ...SHADOW.glow,
  },
  publicarBtnTexto: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
