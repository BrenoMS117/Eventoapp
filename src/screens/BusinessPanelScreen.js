import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { usePermissions } from "../hooks/usePermissions";
import { COLORS, RADIUS, SHADOW } from "../utils/theme";
import { PhotoManager } from "../components/ImageCarousel";
import { RATING_MAP } from "../services/ratings/ratingDefinitions";

// ─────────────────────────────────────────────────────────────────────────────
// CrowdGauge — owner real-time crowd panel with historical comparison
// ─────────────────────────────────────────────────────────────────────────────

function CrowdGauge({ eventoAtivo, meusEventos }) {
  const level = eventoAtivo.crowdLevel ?? 0;
  const count = eventoAtivo.checkedInCount ?? 0;
  const cap   = eventoAtivo.maxCapacity;

  const barColor =
    level >= 85 ? COLORS.danger
    : level >= 60 ? COLORS.warning
    : level >= 30 ? COLORS.primary
    : COLORS.success;

  // Historical average across all non-active events that have crowd data
  const pastEventsCrowd = meusEventos
    .filter((e) => !e.isLive && (e.crowdLevel ?? 0) > 0);
  const avgLevel = pastEventsCrowd.length > 0
    ? Math.round(pastEventsCrowd.reduce((a, e) => a + (e.crowdLevel ?? 0), 0) / pastEventsCrowd.length)
    : null;

  const delta = avgLevel !== null ? level - avgLevel : null;
  const deltaLabel = delta !== null
    ? delta > 0
      ? `▲ +${delta}% acima da média`
      : delta < 0
        ? `▼ ${Math.abs(delta)}% abaixo da média`
        : '→ Na média histórica'
    : null;
  const deltaColor = delta !== null ? (delta >= 0 ? COLORS.success : COLORS.warning) : COLORS.textMuted;

  return (
    <View style={cg.root}>
      <Text style={cg.sectionLabel}>LOTAÇÃO EM TEMPO REAL</Text>

      {/* Big percentage + bar */}
      <View style={cg.gaugeRow}>
        <Text style={[cg.bigPct, { color: barColor }]}>{level}%</Text>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={cg.crowdLabel}>{eventoAtivo.crowdLabel ?? 'Aguardando'}</Text>
          <View style={cg.barBg}>
            <View style={[cg.barFill, { width: `${Math.max(2, level)}%`, backgroundColor: barColor }]} />
          </View>
          <Text style={cg.countText}>
            {cap ? `${count} / ${cap} pessoas` : `${count} ${count === 1 ? 'pessoa presente' : 'pessoas presentes'}`}
          </Text>
        </View>
      </View>

      {/* Historical comparison */}
      {deltaLabel && (
        <View style={cg.deltaRow}>
          <View style={cg.deltaBar}>
            {avgLevel !== null && (
              <View style={[cg.deltaAvgMarker, { left: `${avgLevel}%` }]} />
            )}
            <View style={[cg.deltaFill, { width: `${Math.max(2, level)}%`, backgroundColor: barColor + '66' }]} />
          </View>
          <Text style={[cg.deltaLabel, { color: deltaColor }]}>
            {deltaLabel}
          </Text>
          {avgLevel !== null && (
            <Text style={cg.avgLabel}>Média dos seus eventos: {avgLevel}%</Text>
          )}
        </View>
      )}
    </View>
  );
}

const cg = StyleSheet.create({
  root: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
  },
  gaugeRow: { flexDirection: 'row', alignItems: 'center' },
  bigPct: { fontSize: 44, fontWeight: '900', lineHeight: 48, width: 88 },
  crowdLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  barBg: {
    height: 14, backgroundColor: COLORS.bgOverlay,
    borderRadius: 7, overflow: 'hidden', marginBottom: 6,
  },
  barFill: { height: '100%', borderRadius: 7 },
  countText: { fontSize: 12, color: COLORS.textSub },
  deltaRow: { marginTop: 14, paddingTop: 14, borderTopWidth: 0.5, borderTopColor: COLORS.border },
  deltaBar: {
    height: 8, backgroundColor: COLORS.bgOverlay,
    borderRadius: 4, overflow: 'hidden', marginBottom: 8, position: 'relative',
  },
  deltaFill: { height: '100%', borderRadius: 4 },
  deltaAvgMarker: {
    position: 'absolute', top: 0, bottom: 0, width: 2,
    backgroundColor: COLORS.textMuted,
  },
  deltaLabel: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  avgLabel: { fontSize: 11, color: COLORS.textMuted },
});

const ANUNCIOS = [
  { icon: "🎤", label: "Novo artista", msg: "Um novo artista vai subir ao palco em breve!" },
  { icon: "⬇️", label: "Fila diminuiu", msg: "A fila diminuiu! Ótima hora para vir 🎉" },
  { icon: "🎁", label: "Promoção",      msg: "2 drinks pelo preço de 1 até meia-noite!" },
  { icon: "⚠️", label: "Aviso",         msg: "Estamos quase lotados! Reserve seu lugar." },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

/**
 * Formats an event's startsAt for display in InactivePanel.
 *
 * • ISO datetime → "Hoje às 22:00" or "22 mai. às 22:00"
 * • Legacy time-only string ("22:00") → displayed as-is with a ⚠️ hint
 * • null / invalid → null
 */
function formatStartLabel(startsAt) {
  if (!startsAt) return null;
  const d = new Date(startsAt);
  if (isNaN(d.getTime())) {
    // Legacy time-only string
    return { label: `Início: ${startsAt}`, legacy: true };
  }
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const label = isToday
    ? `Hoje às ${time}`
    : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + ` às ${time}`;
  const isPast = d.getTime() <= now.getTime();
  return { label: isPast ? `Iniciando às ${time}…` : label, legacy: false, isPast };
}

// ─────────────────────────────────────────────────────────────────────────────
// FeaturedRatingCard — shows the dominant public perception to the owner
// ─────────────────────────────────────────────────────────────────────────────

function FeaturedRatingCard({ featured, totalVotes }) {
  if (!featured) {
    return (
      <View style={fr.empty}>
        <Text style={fr.emptyText}>
          💬 Aguardando avaliações do público…
        </Text>
      </View>
    );
  }

  return (
    <View style={[fr.card, { borderColor: featured.cor + '44' }]}>
      {/* Top row: icon + name + pct */}
      <View style={fr.topRow}>
        <Text style={fr.bigIcon}>{featured.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={fr.categoryLabel}>MAIS VOTADO</Text>
          <Text style={[fr.categoryName, { color: featured.cor }]}>
            {featured.label}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[fr.pct, { color: featured.cor }]}>{featured.pct}%</Text>
          <Text style={fr.votesCount}>{featured.votes}/{totalVotes}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={fr.barBg}>
        <View
          style={[
            fr.barFill,
            { width: `${featured.pct}%`, backgroundColor: featured.cor },
          ]}
        />
      </View>

    </View>
  );
}

const fr = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 14,
    borderWidth: 1, marginBottom: 10,
  },
  empty: {
    backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 14,
    borderWidth: 0.5, borderColor: COLORS.border, marginBottom: 10,
    alignItems: 'center',
  },
  emptyText: { fontSize: 13, color: COLORS.textMuted },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  bigIcon: { fontSize: 34 },
  categoryLabel: {
    fontSize: 10, fontWeight: '700', color: COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2,
  },
  categoryName: { fontSize: 18, fontWeight: '900' },
  pct: { fontSize: 26, fontWeight: '900', lineHeight: 28 },
  votesCount: { fontSize: 11, color: COLORS.textMuted },
  barBg: {
    height: 8, backgroundColor: COLORS.bgOverlay,
    borderRadius: 4, overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 4 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────────────────────

function OwnerCard({ currentUser, onLogout }) {
  const { updateProfile, updatePassword } = useApp();

  const [modalVisible, setModalVisible]       = useState(false);
  const [editName, setEditName]               = useState("");
  const [editAvatar, setEditAvatar]           = useState("");
  const [editVenueName, setEditVenueName]     = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPwd, setShowNewPwd]           = useState(false);
  const [showConfirmPwd, setShowConfirmPwd]   = useState(false);
  const [saving, setSaving]                   = useState(false);

  function openModal() {
    setEditName(currentUser?.name || "");
    setEditAvatar(currentUser?.avatar || "");
    setEditVenueName(currentUser?.venueName || "");
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPwd(false);
    setShowConfirmPwd(false);
    setModalVisible(true);
  }

  async function handleSave() {
    const trimmedName  = editName.trim();
    const trimmedVenue = editVenueName.trim();
    if (!trimmedName) {
      Alert.alert("Atenção", "O nome não pode ficar vazio.");
      return;
    }
    if (!trimmedVenue) {
      Alert.alert("Atenção", "O nome do estabelecimento não pode ficar vazio.");
      return;
    }
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

    setSaving(true);
    const profileResult = await updateProfile({
      name:      trimmedName,
      avatar:    editAvatar.trim() || trimmedName.slice(0, 2).toUpperCase(),
      venueName: trimmedVenue,
    });
    const passwordResult = newPassword
      ? await updatePassword(newPassword)
      : { error: null };
    setSaving(false);

    const error = profileResult.error || passwordResult.error;
    if (error) {
      Alert.alert("Erro", error);
    } else {
      setModalVisible(false);
    }
  }

  return (
    <>
      <View style={s.usuarioCard}>
        <View style={s.usuarioAvatar}>
          <Text style={s.usuarioAvatarTexto}>{currentUser?.avatar || "B"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.usuarioNome}>{currentUser?.name || "Estabelecimento"}</Text>
          <Text style={s.usuarioEmail}>
            {currentUser?.venueName ? `🏠 ${currentUser.venueName}` : currentUser?.email || ""}
          </Text>
        </View>
        <TouchableOpacity style={s.editProfileBtn} onPress={openModal}>
          <Ionicons name="person-circle-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={s.sairBtn} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={16} color={COLORS.danger} />
          <Text style={s.sairTexto}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* ── Modal de edição de perfil ─────────────────────────────── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            style={bp.overlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <TouchableOpacity activeOpacity={1} style={bp.sheet}>
              {/* Cabeçalho */}
              <View style={bp.sheetHeader}>
                <Text style={bp.sheetTitle}>Editar Perfil</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={22} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Preview avatar */}
              <View style={bp.avatarPreview}>
                <Text style={bp.avatarPreviewText}>
                  {editAvatar || editName.slice(0, 2).toUpperCase() || "B"}
                </Text>
              </View>

              {/* Nome */}
              <Text style={bp.label}>Nome</Text>
              <TextInput
                style={bp.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Seu nome"
                placeholderTextColor={COLORS.textMuted}
                autoCorrect={false}
              />

              {/* Iniciais */}
              <Text style={bp.label}>Iniciais (até 2 letras)</Text>
              <TextInput
                style={bp.input}
                value={editAvatar}
                onChangeText={(v) => setEditAvatar(v.slice(0, 2).toUpperCase())}
                placeholder="Ex: AB"
                placeholderTextColor={COLORS.textMuted}
                maxLength={2}
                autoCapitalize="characters"
              />

              {/* Nome do estabelecimento */}
              <Text style={bp.label}>Nome do Estabelecimento</Text>
              <TextInput
                style={bp.input}
                value={editVenueName}
                onChangeText={setEditVenueName}
                placeholder="Ex: Bar do João"
                placeholderTextColor={COLORS.textMuted}
                autoCorrect={false}
              />

              {/* Divisor senha */}
              <View style={bp.divider} />
              <Text style={bp.sectionLabel}>Alterar Senha</Text>
              <Text style={bp.sectionHint}>Deixe em branco para não alterar</Text>

              {/* Nova senha */}
              <Text style={bp.label}>Nova Senha</Text>
              <View style={bp.inputRow}>
                <TextInput
                  style={[bp.input, { flex: 1, marginBottom: 0, borderWidth: 0, borderRadius: 0 }]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showNewPwd}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={bp.eyeBtn} onPress={() => setShowNewPwd(v => !v)}>
                  <Ionicons name={showNewPwd ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Confirmar senha */}
              <Text style={[bp.label, { marginTop: 12 }]}>Confirmar Nova Senha</Text>
              <View style={bp.inputRow}>
                <TextInput
                  style={[bp.input, { flex: 1, marginBottom: 0, borderWidth: 0, borderRadius: 0 }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repita a nova senha"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showConfirmPwd}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={bp.eyeBtn} onPress={() => setShowConfirmPwd(v => !v)}>
                  <Ionicons name={showConfirmPwd ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Salvar */}
              <TouchableOpacity
                style={[bp.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={bp.saveBtnText}>Salvar</Text>}
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

function MetricCard({ icon, label, valor, sub, cor }) {
  return (
    <View style={s.metricCard}>
      <Text style={s.metricIcon}>{icon}</Text>
      <Text style={[s.metricValor, { color: cor }]}>{valor}</Text>
      <Text style={s.metricLabel}>{label}</Text>
      {sub ? <Text style={s.metricSub}>{sub}</Text> : null}
    </View>
  );
}

function CouponRow({ c }) {
  return (
    <View style={s.cupomRow}>
      <View style={[s.cupomDot, { backgroundColor: c.highlightColor }]}>
        <Text style={{ fontSize: 18 }}>{c.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={s.cupomTitulo} numberOfLines={1}>{c.title}</Text>
          <View style={[s.cupomTipoBadge, { backgroundColor: c.highlightColor + "33" }]}>
            <Text style={[s.cupomTipoTexto, { color: c.highlightColor }]}>{c.typeLabel}</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
          <Text style={s.cupomQtd}>{c.remainingQty}/{c.totalQty} restantes</Text>
          <Text style={{ fontSize: 11, color: COLORS.success }}>
            {c.totalQty - c.remainingQty} resgatados
          </Text>
        </View>
        <View style={s.progressBg}>
          <View style={[s.progressFill, {
            width: `${(c.remainingQty / c.totalQty) * 100}%`,
            backgroundColor: c.highlightColor,
          }]} />
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATE 1 — EmptyState
// Owner exists but never created any event.
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({ currentUser, onLogout, onCreateEvent }) {
  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="pulse" size={18} color={COLORS.primary} />
          <Text style={s.logo}>LiveVibe</Text>
        </View>
      </View>

      <OwnerCard currentUser={currentUser} onLogout={onLogout} />

      <View style={s.emptyRoot}>
        <View style={s.emptyIconWrap}>
          <Text style={{ fontSize: 56 }}>🎪</Text>
        </View>
        <Text style={s.emptyTitulo}>Nenhum evento ainda</Text>
        <Text style={s.emptySub}>
          Crie seu primeiro evento para começar a gerenciar ingressos,
          cupons e a experiência dos seus clientes.
        </Text>
        <TouchableOpacity style={s.emptyBtn} onPress={onCreateEvent}>
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={s.emptyBtnTexto}>Criar Primeiro Evento</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.emptyBtnSecundario} onPress={onLogout}>
          <Text style={s.emptyBtnSecTexto}>Sair da conta</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATE 2 — InactivePanel
// Owner has past events but none is live right now.
// ─────────────────────────────────────────────────────────────────────────────
function InactivePanel({ currentUser, meusEventos, meusCupons, onLogout, onCreateEvent, navigation }) {
  const ultimoEvento = meusEventos[0];

  const totalCriadosGeral  = meusCupons.length;
  const totalResgatados    = meusCupons.reduce((acc, c) => acc + (c.totalQty - c.remainingQty), 0);
  const totalParticipantes = meusEventos.reduce((acc, e) => acc + (e.checkedInCount ?? 0), 0);
  const mediaAvaliacao     = (() => {
    const comRating = meusEventos.filter(e => e.rating > 0);
    if (!comRating.length) return "—";
    const avg = comRating.reduce((a, e) => a + e.rating, 0) / comRating.length;
    return avg.toFixed(1);
  })();

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="pulse" size={18} color={COLORS.primary} />
          <Text style={s.logo}>LiveVibe</Text>
        </View>
        <View style={{ flex: 1, flexDirection: "row", justifyContent: "flex-end" }}>
          <TouchableOpacity style={s.novoEventoBtn} onPress={onCreateEvent}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={s.novoEventoTexto}>Novo Evento</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <OwnerCard currentUser={currentUser} onLogout={onLogout} />

        {/* Sem evento ativo banner */}
        <View style={s.inativoBanner}>
          <Ionicons name="moon-outline" size={16} color={COLORS.textMuted} />
          <Text style={s.inativoBannerTexto}>Nenhum evento ativo no momento</Text>
        </View>

        {/* Resumo do histórico */}
        <View style={s.secao}>
          <Text style={s.secaoTitulo}>Histórico geral</Text>
          <View style={s.metricsGrid}>
            <MetricCard icon="🎪" label="Eventos" valor={meusEventos.length} cor={COLORS.purpleLight} />
            <MetricCard icon="👥" label="Participantes" valor={totalParticipantes.toLocaleString()} cor={COLORS.primaryLight} />
            <MetricCard icon="🎟" label="Resgatados" valor={totalResgatados} sub={`/ ${totalCriadosGeral} criados`} cor={COLORS.purpleLight} />
            <MetricCard icon="⭐" label="Avaliação média" valor={mediaAvaliacao} cor={COLORS.gold} />
          </View>
        </View>

        {/* Último evento */}
        {ultimoEvento && (
          <View style={s.secao}>
            <Text style={s.secaoTitulo}>Último evento</Text>
            <View style={s.ultimoEventoCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <Text style={s.ultimoEventoNome} numberOfLines={1}>{ultimoEvento.name}</Text>
                <View style={[s.statusBadge, { backgroundColor: COLORS.bgOverlay }]}>
                  <Text style={s.statusBadgeTexto}>Encerrado</Text>
                </View>
              </View>
              <Text style={s.ultimoEventoVenue} numberOfLines={1}>
                <Ionicons name="location-outline" size={12} /> {ultimoEvento.venue}
              </Text>
              {ultimoEvento.startsAt && (
                <Text style={s.ultimoEventoData}>{formatDate(ultimoEvento.startsAt)}</Text>
              )}

              <View style={{ flexDirection: "row", gap: 16, marginTop: 14 }}>
                {[
                  { label: "Cupons criados",   valor: meusCupons.filter(c => c.eventId === ultimoEvento.id).length },
                  { label: "Resgatados",        valor: meusCupons.filter(c => c.eventId === ultimoEvento.id).reduce((a, c) => a + (c.totalQty - c.remainingQty), 0) },
                  { label: "Participantes",     valor: ultimoEvento.checkedInCount ?? 0 },
                ].map((stat) => (
                  <View key={stat.label} style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 18, fontWeight: "800", color: COLORS.text }}>{stat.valor}</Text>
                    <Text style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Lista de todos os eventos */}
        <View style={s.secao}>
          <Text style={s.secaoTitulo}>Meus eventos</Text>
          {meusEventos.map((e) => {
            const startInfo = formatStartLabel(e.startsAt);
            return (
              <View key={e.id} style={s.eventoHistoricoRow}>
                <View style={[s.eventoHistoricoDot, { backgroundColor: COLORS.bgOverlay }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.eventoHistoricoNome} numberOfLines={1}>{e.name}</Text>
                  <Text style={s.eventoHistoricoData}>{e.venue}</Text>
                </View>
                {startInfo ? (
                  <View style={[
                    s.inicioChip,
                    startInfo.isPast && { backgroundColor: COLORS.success + '22', borderColor: COLORS.success + '55' },
                  ]}>
                    <Ionicons
                      name={startInfo.isPast ? 'hourglass-outline' : 'time-outline'}
                      size={11}
                      color={startInfo.isPast ? COLORS.success : COLORS.primary}
                    />
                    <Text style={[
                      s.inicioChipTexto,
                      startInfo.isPast && { color: COLORS.success },
                    ]}>
                      {startInfo.label}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        {/* CTA: criar novo evento */}
        <View style={{ paddingHorizontal: 12, marginTop: 24 }}>
          <TouchableOpacity style={s.emptyBtn} onPress={onCreateEvent}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={s.emptyBtnTexto}>Criar Novo Evento</Text>
          </TouchableOpacity>
        </View>

        {/* Impulsionar */}
        <View style={s.impulsionarCard}>
          <Text style={s.impulsionarTitulo}>⚡ Impulsionar Visibilidade</Text>
          <Text style={s.impulsionarSub}>
            Destaque seu evento no topo do feed para +2.300 usuários próximos
          </Text>
          <TouchableOpacity
            style={s.impulsionarBtn}
            onPress={() => Alert.alert("Em breve", "Planos em desenvolvimento!")}
          >
            <Text style={s.impulsionarBtnTexto}>Ver planos →</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATE 3 — ActivePanel
// Owner has at least one live event: full operational dashboard.
// ─────────────────────────────────────────────────────────────────────────────
function ActivePanel({
  currentUser, eventoAtivo, businessStats, cuponsDoAtivo, meusEventos,
  onLogout, onCreateEvent, navigation,
  addEventPhoto, removeEventPhoto, updateEventFields, closeEvent,
}) {
  const perms = usePermissions();
  const { subscribeToEventRatings, getEventRatings } = useApp();
  const [secaoFotos, setSecaoFotos]       = useState(false);

  // Subscribe to real-time ratings for the active event
  useEffect(() => {
    if (eventoAtivo?.id) subscribeToEventRatings(eventoAtivo.id);
  }, [eventoAtivo?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const eventRating = getEventRatings(eventoAtivo?.id ?? '');
  const totalVotes  = Object.values(eventRating.counts).reduce((a, b) => a + b, 0);
  const [novoArtista, setNovoArtista]     = useState("");
  const [novoHorarioFim, setNovoHorarioFim] = useState("");
  const [salvando, setSalvando]           = useState(false);

  async function handleSalvarCampos() {
    const fields = {};
    if (perms.canEditEventField("nextAct") && novoArtista.trim())
      fields.nextAct = novoArtista.trim();
    if (perms.canEditEventField("endsAt") && novoHorarioFim.trim())
      fields.endsAt = novoHorarioFim.trim();
    if (Object.keys(fields).length === 0) return;
    setSalvando(true);
    const result = await updateEventFields(eventoAtivo.id, fields);
    setSalvando(false);
    if (result.error) {
      Alert.alert("Erro", "Não foi possível salvar. Tente novamente.");
    } else {
      setNovoArtista("");
      setNovoHorarioFim("");
      Alert.alert("✅ Salvo", "Informações do evento atualizadas.");
    }
  }

  function handleEncerrarEvento() {
    Alert.alert(
      "Encerrar Evento",
      `Deseja encerrar "${eventoAtivo.name}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Encerrar", style: "destructive",
          onPress: async () => {
            const result = await closeEvent(eventoAtivo.id);
            if (result.error) Alert.alert("Erro", "Não foi possível encerrar o evento.");
            else Alert.alert("Evento encerrado", `"${eventoAtivo.name}" foi encerrado.`);
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="pulse" size={18} color={COLORS.primary} />
          <Text style={s.logo}>LiveVibe</Text>
        </View>
        <View style={{ flex: 1, flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>
          <TouchableOpacity style={s.novoEventoBtn} onPress={onCreateEvent}>
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
        <OwnerCard currentUser={currentUser} onLogout={onLogout} />

        {/* Evento ativo banner */}
        <View style={s.eventoAtivoBanner}>
          <View style={[s.ativoDot, { backgroundColor: COLORS.success }]} />
          <Text style={s.eventoAtivoTexto}>{eventoAtivo.name}</Text>
          <TouchableOpacity onPress={() => setSecaoFotos((v) => !v)}>
            <View style={s.fotosBtnSmall}>
              <Ionicons name="images-outline" size={14} color={COLORS.primary} />
              <Text style={s.fotosBtnSmallTexto}>Fotos</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Fotos do evento */}
        {secaoFotos && (
          <View style={s.fotosSecao}>
            <Text style={s.secaoTitulo}>Fotos do Evento</Text>
            <Text style={s.fotosSubtitulo}>A primeira foto será usada como capa nos cards</Text>
            <PhotoManager
              photos={eventoAtivo.photos || []}
              onAdd={(uri) => addEventPhoto(eventoAtivo.id, uri)}
              onRemove={(idx) => removeEventPhoto(eventoAtivo.id, idx)}
              maxPhotos={8}
            />
          </View>
        )}

        {/* Métricas em tempo real */}
        <View style={s.metricsGrid}>
          <MetricCard icon="👥" label="Presentes"  valor={eventoAtivo.checkedInCount?.toLocaleString() ?? '0'} sub={businessStats.checkedInChange} cor={COLORS.primaryLight} />
          <MetricCard
            icon="⭐" label="Avaliação"
            valor={eventoAtivo.rating > 0 ? eventoAtivo.rating.toFixed(1) : '—'}
            sub={`${eventoAtivo.reviewCount ?? 0} avaliações`}
            cor={COLORS.gold}
          />
          <MetricCard icon="🎟" label="Resgatados" valor={businessStats.couponsRedeemed} sub={`/ ${businessStats.couponsTotal}`} cor={COLORS.purpleLight} />
          <MetricCard icon="🔥" label="Nível"      valor={businessStats.heatLevel || "WARM"} cor={COLORS.primary} />
        </View>

        {/* Característica em destaque (percepção do público) */}
        <View style={s.secao}>
          <Text style={s.secaoTitulo}>Percepção do Público</Text>
          <FeaturedRatingCard featured={eventRating.featured} totalVotes={totalVotes} />
        </View>

        {/* Gerenciar Evento */}
        <View style={s.secao}>
          <Text style={s.secaoTitulo}>Gerenciar Evento</Text>

          {perms.canEditEventField("nextAct") && (
            <View style={s.editCampo}>
              <Text style={s.editLabel}>Próximo Artista</Text>
              <Text style={s.editAtual}>Atual: {eventoAtivo.nextAct || "—"}</Text>
              <TextInput
                style={s.editInput}
                placeholder="Nome do artista ou atração"
                placeholderTextColor={COLORS.textMuted}
                value={novoArtista}
                onChangeText={setNovoArtista}
                maxLength={80}
              />
            </View>
          )}

          {perms.canEditEventField("endsAt") && (
            <View style={s.editCampo}>
              <Text style={s.editLabel}>Horário de Término</Text>
              <Text style={s.editAtual}>Atual: {eventoAtivo.endsAt || "—"}</Text>
              <TextInput
                style={s.editInput}
                placeholder="Ex: 02:00"
                placeholderTextColor={COLORS.textMuted}
                value={novoHorarioFim}
                onChangeText={setNovoHorarioFim}
                maxLength={5}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          )}

          {(perms.canEditEventField("nextAct") || perms.canEditEventField("endsAt")) && (
            <TouchableOpacity
              style={[s.salvarBtn, salvando && { opacity: 0.6 }]}
              onPress={handleSalvarCampos}
              disabled={salvando}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
              <Text style={s.salvarBtnTexto}>{salvando ? "Salvando..." : "Salvar alterações"}</Text>
            </TouchableOpacity>
          )}

          {perms.canEditEventField("closeEvent") && (
            <TouchableOpacity
              style={[s.encerrarBtn, !eventoAtivo.isLive && { opacity: 0.5 }]}
              onPress={handleEncerrarEvento}
              disabled={!eventoAtivo.isLive}
            >
              <Ionicons name="stop-circle-outline" size={16} color={COLORS.danger} />
              <Text style={s.encerrarBtnTexto}>
                {eventoAtivo.isLive ? "Encerrar Evento" : "Evento já encerrado"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Lotação em tempo real */}
        <View style={s.secao}>
          <CrowdGauge eventoAtivo={eventoAtivo} meusEventos={meusEventos} />
        </View>

        {/* Anunciar ao vivo */}
        <View style={s.secao}>
          <Text style={s.secaoTitulo}>Anunciar ao Vivo</Text>
          {ANUNCIOS.map((a, i) => (
            <TouchableOpacity key={i} style={s.anuncioCard} onPress={() => Alert.alert("📢 Enviado!", `"${a.msg}"`)}>
              <Text style={s.anuncioIcon}>{a.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.anuncioLabel}>{a.label}</Text>
                <Text style={s.anuncioMsg} numberOfLines={1}>{a.msg}</Text>
              </View>
              <Ionicons name="send-outline" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Cupons do evento ativo */}
        <View style={s.secao}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={s.secaoTitulo}>Meus Cupons</Text>
            <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate("AddCoupon")}>
              <Ionicons name="add" size={14} color="#fff" />
              <Text style={s.addBtnTexto}>Novo</Text>
            </TouchableOpacity>
          </View>
          {cuponsDoAtivo.length === 0 ? (
            <TouchableOpacity style={s.vazioCard} onPress={() => navigation.navigate("AddCoupon")}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>🎟</Text>
              <Text style={s.vazioTitulo}>Criar primeiro cupom</Text>
              <Text style={s.vazioSub}>Atraia mais clientes com cupons exclusivos</Text>
            </TouchableOpacity>
          ) : (
            cuponsDoAtivo.map((c) => <CouponRow key={c.id} c={c} />)
          )}
        </View>

        {/* Avaliações recentes */}
        <View style={s.secao}>
          <Text style={s.secaoTitulo}>Avaliações Recentes</Text>
          {businessStats.recentReviews.map((r, i) => (
            <View key={i} style={s.avaliacaoCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
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
            onPress={() => Alert.alert("Em breve", "Planos em desenvolvimento!")}
          >
            <Text style={s.impulsionarBtnTexto}>Ver planos →</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BusinessPanelScreen — State Machine Coordinator
//
// Derives panel state from ownership data and delegates rendering to one of
// three sub-components. Adding a new state requires only a new branch here
// and a new component — no conditional logic spreads across the render tree.
//
// Ownership binding: meusEventos filters by ownerId === currentUser.id,
// which mirrors the value stored in events.owner_id on every eventsService.create().
// ─────────────────────────────────────────────────────────────────────────────
export default function BusinessPanelScreen({ navigation }) {
  const {
    events, coupons, currentUser, businessStats, dataLoading,
    logout, addEventPhoto, removeEventPhoto, updateEventFields, closeEvent,
  } = useApp();

  // ── Ownership derivation ──────────────────────────────────────────────────
  const meusEventos = useMemo(
    () => events
      .filter((e) => e.ownerId === currentUser?.id)
      .sort((a, b) => new Date(b.startsAt ?? 0) - new Date(a.startsAt ?? 0)),
    [events, currentUser?.id],
  );

  const eventoAtivo = useMemo(
    () => meusEventos.find((e) => e.isLive) ?? null,
    [meusEventos],
  );

  const meusCupons = useMemo(
    () => coupons.filter((c) => meusEventos.some((e) => e.id === c.eventId)),
    [coupons, meusEventos],
  );

  const cuponsDoAtivo = useMemo(
    () => eventoAtivo ? coupons.filter((c) => c.eventId === eventoAtivo.id) : [],
    [coupons, eventoAtivo],
  );

  // ── State machine ─────────────────────────────────────────────────────────
  // 'loading'  → first data fetch, avoids flashing EmptyState
  // 'empty'    → owner has no events at all
  // 'inactive' → owner has events, none are live right now
  // 'active'   → owner has at least one live event
  const panelState = (dataLoading && meusEventos.length === 0)
    ? 'loading'
    : meusEventos.length === 0
    ? 'empty'
    : eventoAtivo
    ? 'active'
    : 'inactive';

  // ── Common callbacks ──────────────────────────────────────────────────────
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

  const onCreateEvent = () => navigation.navigate("NewEvent");

  // ── Render ────────────────────────────────────────────────────────────────
  if (panelState === 'loading') {
    return (
      <SafeAreaView style={[s.safe, { justifyContent: "center", alignItems: "center" }]} edges={["top"]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textMuted, marginTop: 12, fontSize: 13 }}>Carregando painel…</Text>
      </SafeAreaView>
    );
  }

  if (panelState === 'empty') {
    return (
      <EmptyState
        currentUser={currentUser}
        onLogout={handleLogout}
        onCreateEvent={onCreateEvent}
      />
    );
  }

  if (panelState === 'inactive') {
    return (
      <InactivePanel
        currentUser={currentUser}
        meusEventos={meusEventos}
        meusCupons={meusCupons}
        onLogout={handleLogout}
        onCreateEvent={onCreateEvent}
        navigation={navigation}
      />
    );
  }

  // panelState === 'active'
  return (
    <ActivePanel
      currentUser={currentUser}
      eventoAtivo={eventoAtivo}
      businessStats={businessStats}
      cuponsDoAtivo={cuponsDoAtivo}
      meusEventos={meusEventos}
      onLogout={handleLogout}
      onCreateEvent={onCreateEvent}
      navigation={navigation}
      addEventPhoto={addEventPhoto}
      removeEventPhoto={removeEventPhoto}
      updateEventFields={updateEventFields}
      closeEvent={closeEvent}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 10, gap: 8,
  },
  logo: { fontSize: 16, fontWeight: "900", color: COLORS.text },

  novoEventoBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: COLORS.primary, paddingHorizontal: 12,
    paddingVertical: 7, borderRadius: RADIUS.full,
  },
  novoEventoTexto: { color: "#fff", fontSize: 12, fontWeight: "700" },

  liveChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: COLORS.bgCard, paddingHorizontal: 10,
    paddingVertical: 5, borderRadius: RADIUS.full,
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveChipTexto: { fontSize: 12, color: COLORS.text, fontWeight: "600" },

  // OwnerCard
  usuarioCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: COLORS.bgCard, paddingHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  usuarioAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primary + "33",
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: COLORS.primary + "66",
  },
  usuarioAvatarTexto: { fontSize: 15, fontWeight: "800", color: COLORS.primary },
  usuarioNome: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  usuarioEmail: { fontSize: 12, color: COLORS.textMuted },
  sairBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: COLORS.danger + "22", paddingHorizontal: 12,
    paddingVertical: 7, borderRadius: RADIUS.full,
    borderWidth: 0.5, borderColor: COLORS.danger + "44",
  },
  sairTexto: { fontSize: 13, color: COLORS.danger, fontWeight: "700" },

  // Active event banner
  eventoAtivoBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.primary + "18",
    paddingHorizontal: 16, paddingVertical: 10,
  },
  ativoDot: { width: 8, height: 8, borderRadius: 4 },
  eventoAtivoTexto: { flex: 1, fontSize: 13, fontWeight: "600", color: COLORS.text },
  fotosBtnSmall: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: COLORS.primary + "22", paddingHorizontal: 10,
    paddingVertical: 5, borderRadius: RADIUS.full,
  },
  fotosBtnSmallTexto: { fontSize: 12, color: COLORS.primary, fontWeight: "600" },
  fotosSecao: {
    backgroundColor: COLORS.bgCard, padding: 16,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  fotosSubtitulo: { fontSize: 12, color: COLORS.textMuted, marginBottom: 12 },

  // Inactive banner
  inativoBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.bgOverlay, paddingHorizontal: 16, paddingVertical: 10,
  },
  inativoBannerTexto: { fontSize: 13, color: COLORS.textMuted },

  // Metrics
  metricsGrid: {
    flexDirection: "row", flexWrap: "wrap",
    paddingHorizontal: 12, paddingTop: 12, gap: 8,
  },
  metricCard: {
    flex: 1, minWidth: "45%",
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: 14, borderWidth: 0.5, borderColor: COLORS.border,
  },
  metricIcon: { fontSize: 18, marginBottom: 6 },
  metricValor: { fontSize: 22, fontWeight: "800" },
  metricLabel: { fontSize: 12, color: COLORS.textSub, marginTop: 2 },
  metricSub: { fontSize: 11, color: COLORS.success, fontWeight: "500", marginTop: 2 },

  // Section
  secao: { paddingHorizontal: 12, marginTop: 20 },
  secaoTitulo: {
    fontSize: 12, fontWeight: "800", color: COLORS.textMuted,
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10,
  },

  // Último evento (inactive)
  ultimoEventoCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    padding: 16, borderWidth: 0.5, borderColor: COLORS.border,
  },
  ultimoEventoNome: { fontSize: 15, fontWeight: "800", color: COLORS.text, flex: 1 },
  ultimoEventoVenue: { fontSize: 12, color: COLORS.textSub },
  ultimoEventoData: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },

  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full,
  },
  statusBadgeTexto: { fontSize: 10, fontWeight: "700", color: COLORS.textMuted },

  // Event history list (inactive)
  eventoHistoricoRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: 12, marginBottom: 8,
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  eventoHistoricoDot: { width: 10, height: 10, borderRadius: 5 },
  eventoHistoricoNome: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  eventoHistoricoData: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  inicioChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: COLORS.primary + "18", paddingHorizontal: 10,
    paddingVertical: 5, borderRadius: RADIUS.full,
    borderWidth: 0.5, borderColor: COLORS.primary + "44",
  },
  inicioChipTexto: { fontSize: 11, color: COLORS.primary, fontWeight: "600" },

  // Announce
  anuncioCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: 12, marginBottom: 8,
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  anuncioIcon: { fontSize: 22 },
  anuncioLabel: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  anuncioMsg: { fontSize: 12, color: COLORS.textSub },

  // Coupons
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: COLORS.primary, paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: RADIUS.full,
  },
  addBtnTexto: { fontSize: 12, color: "#fff", fontWeight: "700" },
  vazioCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    padding: 24, alignItems: "center",
    borderWidth: 1.5, borderColor: COLORS.border, borderStyle: "dashed",
  },
  vazioTitulo: { fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 4 },
  vazioSub: { fontSize: 13, color: COLORS.textSub, textAlign: "center" },
  cupomRow: {
    flexDirection: "row", gap: 10,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    marginBottom: 8, padding: 12,
    borderWidth: 0.5, borderColor: COLORS.border, alignItems: "center",
  },
  cupomDot: { width: 44, height: 44, borderRadius: RADIUS.md, justifyContent: "center", alignItems: "center" },
  cupomTitulo: { fontSize: 13, fontWeight: "700", color: COLORS.text, flex: 1 },
  cupomTipoBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: RADIUS.full },
  cupomTipoTexto: { fontSize: 9, fontWeight: "700" },
  cupomQtd: { fontSize: 11, color: COLORS.textMuted },
  progressBg: { height: 4, backgroundColor: COLORS.bgOverlay, borderRadius: 2, overflow: "hidden", marginTop: 6 },
  progressFill: { height: "100%", borderRadius: 2 },

  // Reviews
  avaliacaoCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: 12, marginBottom: 8,
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  avaliacaoUsuario: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  avaliacaoTempo: { fontSize: 11, color: COLORS.textMuted, marginLeft: "auto" },
  avaliacaoTexto: { fontSize: 13, color: COLORS.textSub },

  // Boost
  impulsionarCard: {
    backgroundColor: COLORS.primary + "18",
    borderRadius: RADIUS.xl, margin: 12, padding: 18,
    borderWidth: 1, borderColor: COLORS.primary + "55",
  },
  impulsionarTitulo: { fontSize: 15, fontWeight: "800", color: COLORS.primaryLight, marginBottom: 6 },
  impulsionarSub: { fontSize: 13, color: COLORS.textSub, lineHeight: 19, marginBottom: 14 },
  impulsionarBtn: {
    backgroundColor: COLORS.primary, alignSelf: "flex-start",
    paddingHorizontal: 18, paddingVertical: 9, borderRadius: RADIUS.full,
  },
  impulsionarBtnTexto: { color: "#fff", fontWeight: "800", fontSize: 13 },

  // Manage event fields
  editCampo: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: 12, marginBottom: 10,
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  editLabel: {
    fontSize: 11, fontWeight: "700", color: COLORS.textMuted,
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2,
  },
  editAtual: { fontSize: 12, color: COLORS.textSub, marginBottom: 8 },
  editInput: {
    backgroundColor: COLORS.bgOverlay, borderRadius: RADIUS.md,
    paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 14, color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.border,
  },
  salvarBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingVertical: 11, marginBottom: 10,
  },
  salvarBtnTexto: { color: "#fff", fontWeight: "700", fontSize: 14 },
  encerrarBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, backgroundColor: COLORS.danger + "18",
    borderRadius: RADIUS.md, paddingVertical: 11,
    borderWidth: 1, borderColor: COLORS.danger + "44",
  },
  encerrarBtnTexto: { color: COLORS.danger, fontWeight: "700", fontSize: 14 },

  // EmptyState
  emptyRoot: {
    flex: 1, alignItems: "center", justifyContent: "center", padding: 32,
  },
  emptyIconWrap: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.primary + "18",
    justifyContent: "center", alignItems: "center",
    marginBottom: 20,
    borderWidth: 1, borderColor: COLORS.primary + "44",
  },
  emptyTitulo: { fontSize: 20, fontWeight: "800", color: COLORS.text, marginBottom: 10 },
  emptySub: {
    fontSize: 14, color: COLORS.textSub, textAlign: "center",
    lineHeight: 21, marginBottom: 28,
  },
  emptyBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    paddingVertical: 14, paddingHorizontal: 28, marginBottom: 12,
    width: "100%", justifyContent: "center",
    ...SHADOW.glow,
  },
  emptyBtnTexto: { color: "#fff", fontWeight: "800", fontSize: 15 },
  emptyBtnSecundario: {
    paddingVertical: 10, paddingHorizontal: 20,
  },
  emptyBtnSecTexto: { fontSize: 13, color: COLORS.textMuted },

  editProfileBtn: { padding: 4, marginRight: 4 },
});

// ─── Estilos do modal de perfil (business) ────────────────────────────────────
const bp = StyleSheet.create({
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
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 20,
  },
  sheetTitle: { fontSize: 17, fontWeight: "800", color: COLORS.text },

  avatarPreview: {
    alignSelf: "center",
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.primary + "33",
    borderWidth: 2, borderColor: COLORS.primary,
    justifyContent: "center", alignItems: "center",
    marginBottom: 24,
  },
  avatarPreviewText: { fontSize: 26, fontWeight: "900", color: COLORS.primary },

  label: {
    fontSize: 12, fontWeight: "700", color: COLORS.textMuted,
    textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: COLORS.text,
    marginBottom: 16,
  },

  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 20 },
  sectionLabel: { fontSize: 14, fontWeight: "800", color: COLORS.text, marginBottom: 2 },
  sectionHint:  { fontSize: 12, color: COLORS.textMuted, marginBottom: 14 },

  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.bg,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, marginBottom: 0, overflow: "hidden",
  },
  eyeBtn: { paddingHorizontal: 12, paddingVertical: 12 },

  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    paddingVertical: 14, alignItems: "center", marginTop: 20,
  },
  saveBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },
});
