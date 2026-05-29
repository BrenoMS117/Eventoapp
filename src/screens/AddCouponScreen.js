import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { CouponSchema } from "../validation/CouponSchema";
import { COLORS, RADIUS, SHADOW } from "../utils/theme";

const TIPOS_CUPOM = [
  { key: "bebida",      label: "Drinque Grátis",  cor: "#E83B5C" },
  { key: "comida",      label: "Comida Grátis",   cor: "#D85A30" },
  { key: "desconto",    label: "Desconto",        cor: "#F59E0B" },
  { key: "experiencia", label: "Experiência VIP", cor: "#7B2FBE" },
  { key: "brinde",      label: "Brinde",          cor: "#059669" },
  { key: "acesso",      label: "Acesso Especial", cor: "#0C447C" },
];

const RESTRICAO_USUARIO = [
  { key: "all", label: "Todos" },
  { key: "user", label: "Apenas usuários" },
];

export default function AddCouponScreen({ navigation }) {
  const { addCoupon, businessStats, events, currentUser } = useApp();
  const [etapa, setEtapa] = useState(1);
  const [publicando, setPublicando] = useState(false);
  const [tipoSelecionado, setTipoSelecionado] = useState(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [quantidade, setQuantidade] = useState("50");
  const [maxPerUser, setMaxPerUser] = useState(1);
  const [userTypeRestriction, setUserTypeRestriction] = useState("all");

  function formatarEncerramentoEvento(endsAt) {
    if (!endsAt) return 'Fim do evento';
    if (/^\d{1,2}:\d{2}$/.test(String(endsAt))) return endsAt;
    const d = new Date(endsAt);
    if (isNaN(d.getTime())) return String(endsAt);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  const eventoAtivo =
    events.find((e) => e.ownerId === currentUser?.id && e.isLive) ??
    (businessStats.activeEventId
      ? events.find((e) => e.id === businessStats.activeEventId)
      : null);

  useEffect(() => {
    if (!eventoAtivo) {
      Alert.alert(
        'Nenhum evento ao vivo',
        'Inicie um evento antes de criar cupons. Os cupons são vinculados ao evento em andamento.',
        [{ text: 'Entendi', onPress: () => navigation.goBack() }],
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  async function publicar() {
    if (!eventoAtivo) {
      Alert.alert('Nenhum evento ao vivo', 'Inicie um evento antes de criar cupons.');
      return;
    }
    const tipoInfo = TIPOS_CUPOM.find((t) => t.key === tipoSelecionado);
    const dto = CouponSchema.toDTO(
      {
        eventId: eventoAtivo.id,
        eventName: eventoAtivo.name,
        venue: eventoAtivo.venue || businessStats.venueName,
        type: tipoSelecionado,
        title: titulo,
        description: descricao,
        conditions: '',
        totalQty: quantidade,
        expiresAt: eventoAtivo.endsAt ?? null,
        redemptionRules: { maxPerUser, userTypeRestriction },
      },
      tipoInfo,
    );

    const { isValid, errors } = CouponSchema.validate(dto);
    if (!isValid) {
      Alert.alert('Dados inválidos', Object.values(errors)[0]);
      return;
    }

    setPublicando(true);
    const result = await addCoupon(dto);
    setPublicando(false);

    if (result.error) {
      Alert.alert(
        'Erro ao publicar',
        result.error?.message ?? 'Não foi possível salvar o cupom. Tente novamente.',
      );
      return;
    }

    if (Platform.OS === 'web') {
      window.alert(`Cupom "${titulo}" publicado com sucesso!`);
      navigation.goBack();
    } else {
      Alert.alert(
        'Cupom publicado!',
        `"${titulo}" foi enviado para usuários próximos!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    }
  }

  const tipoInfo = TIPOS_CUPOM.find((t) => t.key === tipoSelecionado);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
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

              <View style={s.regrasTitulo}>
                <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.primary} />
                <Text style={s.regrasTituloTexto}>Regras de Resgate</Text>
              </View>

              <Text style={s.fieldLabel}>Limite por usuário</Text>
              <View style={s.qtdRow}>
                <TouchableOpacity
                  style={s.qtdBtn}
                  onPress={() => setMaxPerUser((n) => Math.max(1, n - 1))}
                >
                  <Text style={s.qtdBtnTexto}>−</Text>
                </TouchableOpacity>
                <View style={[s.qtdInput, { justifyContent: "center", alignItems: "center" }]}>
                  <Text style={{ fontSize: 20, fontWeight: "800", color: COLORS.text }}>
                    {maxPerUser}
                  </Text>
                </View>
                <TouchableOpacity
                  style={s.qtdBtn}
                  onPress={() => setMaxPerUser((n) => Math.min(10, n + 1))}
                >
                  <Text style={s.qtdBtnTexto}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>
                {maxPerUser === 1
                  ? "Cada usuário pode resgatar 1 vez"
                  : `Cada usuário pode resgatar até ${maxPerUser} vezes`}
              </Text>

              <Text style={s.fieldLabel}>Quem pode resgatar?</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {RESTRICAO_USUARIO.map((opt) => {
                  const ativo = userTypeRestriction === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[s.restricaoBtn, ativo && s.restricaoBtnAtivo]}
                      onPress={() => setUserTypeRestriction(opt.key)}
                    >
                      <Text style={[s.restricaoBtnTexto, ativo && s.restricaoBtnTextoAtivo]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
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
                      {eventoAtivo?.venue || businessStats.venueName}
                    </Text>
                    {eventoAtivo?.endsAt && (
                      <Text style={{ fontSize: 11, color: COLORS.textMuted }}>
                        Até {formatarEncerramentoEvento(eventoAtivo.endsAt)}
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
                      Você está no local — Resgatar →
                    </Text>
                  </View>
                </View>
              </View>

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

              {[
                {
                  etapa: 1,
                  titulo: 'Tipo',
                  rows: [["Tipo", tipoInfo.label]],
                },
                {
                  etapa: 2,
                  titulo: 'Detalhes',
                  rows: [
                    ["Título", titulo],
                    ["Quantidade", `${quantidade} unidades`],
                    ["Validade", formatarEncerramentoEvento(eventoAtivo?.endsAt)],
                    ["Limite/usuário", `${maxPerUser} resgate${maxPerUser > 1 ? "s" : ""}`],
                    ["Acesso", RESTRICAO_USUARIO.find((r) => r.key === userTypeRestriction)?.label ?? "Todos"],
                  ],
                },
              ].map((secao) => (
                <View key={secao.titulo} style={[s.resumoCard, { marginBottom: 8 }]}>
                  <View style={s.resumoSecaoHeader}>
                    <Text style={s.resumoSecaoTitulo}>{secao.titulo}</Text>
                    <TouchableOpacity onPress={() => setEtapa(secao.etapa)}>
                      <Text style={s.resumoEditarBtn}>Editar</Text>
                    </TouchableOpacity>
                  </View>
                  {secao.rows.map(([label, val]) => (
                    <View key={label} style={s.resumoRow}>
                      <Text style={s.resumoLabel}>{label}</Text>
                      <Text style={s.resumoVal} numberOfLines={1}>{val}</Text>
                    </View>
                  ))}
                </View>
              ))}
              <View style={s.resumoCard}>
                <View style={s.resumoRow}>
                  <Text style={s.resumoLabel}>Evento</Text>
                  <Text style={s.resumoVal} numberOfLines={1}>
                    {eventoAtivo?.name ?? '—'}
                  </Text>
                </View>
                <View style={s.resumoRow}>
                  <Text style={s.resumoLabel}>Status</Text>
                  <Text style={[s.resumoVal, { color: eventoAtivo?.isLive ? '#4ade80' : COLORS.textMuted }]}>
                    {eventoAtivo?.isLive ? 'Ao vivo' : 'Não iniciado'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>

        <View style={s.bottomBar}>
          {etapa < 3 ? (
            <TouchableOpacity style={s.proximoBtn} onPress={avancar}>
              <Text style={s.proximoBtnTexto}>Continuar →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.publicarBtn, publicando && { opacity: 0.7 }]}
              onPress={publicar}
              disabled={publicando}
            >
              {publicando ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#fff" />
                  <Text style={s.publicarBtnTexto}>Publicar cupom agora</Text>
                </>
              )}
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
    alignItems: "center",
    justifyContent: "center",
    minHeight: 64,
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
  restricaoBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  restricaoBtnAtivo: {
    backgroundColor: COLORS.primary + "22",
    borderColor: COLORS.primary,
  },
  restricaoBtnTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSub,
  },
  restricaoBtnTextoAtivo: {
    color: COLORS.primary,
    fontWeight: "800",
  },
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
  regrasTitulo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 22,
    marginBottom: 4,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  regrasTituloTexto: { fontSize: 14, fontWeight: "700", color: COLORS.primary },
  resumoSecaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bgOverlay,
  },
  resumoSecaoTitulo: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resumoEditarBtn: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
});
