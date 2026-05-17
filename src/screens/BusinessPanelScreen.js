import React, { useState, useMemo } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { usePermissions } from "../hooks/usePermissions";
import { COLORS, RADIUS, SHADOW } from "../utils/theme";
import { PhotoManager } from "../components/ImageCarousel";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const OPCOES_LOTACAO = [
  { key: "tranquilo", icon: "🟢", label: "Tranquilo", cor: COLORS.success },
  { key: "moderado",  icon: "🟡", label: "Moderado",  cor: COLORS.warning },
  { key: "cheio",     icon: "🔥", label: "Cheio",     cor: COLORS.primary },
  { key: "lotado",    icon: "🚨", label: "Lotado",    cor: COLORS.danger  },
];

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

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────────────────────

function OwnerCard({ currentUser, onLogout }) {
  return (
    <View style={s.usuarioCard}>
      <View style={s.usuarioAvatar}>
        <Text style={s.usuarioAvatarTexto}>{currentUser?.avatar || "B"}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.usuarioNome}>{currentUser?.name || "Estabelecimento"}</Text>
        <Text style={s.usuarioEmail}>{currentUser?.email || ""}</Text>
      </View>
      <TouchableOpacity style={s.sairBtn} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={16} color={COLORS.danger} />
        <Text style={s.sairTexto}>Sair</Text>
      </TouchableOpacity>
    </View>
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
        {meusEventos.length > 1 && (
          <View style={s.secao}>
            <Text style={s.secaoTitulo}>Todos os eventos</Text>
            {meusEventos.map((e) => (
              <View key={e.id} style={s.eventoHistoricoRow}>
                <View style={[s.eventoHistoricoDot, { backgroundColor: e.isLive ? COLORS.success : COLORS.bgOverlay }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.eventoHistoricoNome} numberOfLines={1}>{e.name}</Text>
                  <Text style={s.eventoHistoricoData}>{formatDate(e.startsAt)} · {e.venue}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: e.isLive ? COLORS.success + "22" : COLORS.bgOverlay }]}>
                  <Text style={[s.statusBadgeTexto, { color: e.isLive ? COLORS.success : COLORS.textMuted }]}>
                    {e.isLive ? "Ao vivo" : "Encerrado"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

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
  currentUser, eventoAtivo, businessStats, cuponsDoAtivo,
  onLogout, onCreateEvent, navigation,
  addEventPhoto, removeEventPhoto, updateEventFields, closeEvent,
}) {
  const perms = usePermissions();
  const [statusLotacao, setStatusLotacao] = useState("moderado");
  const [secaoFotos, setSecaoFotos]       = useState(false);
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
          <MetricCard icon="👥" label="Presentes"  valor={businessStats.checkedIn.toLocaleString()} sub={businessStats.checkedInChange} cor={COLORS.primaryLight} />
          <MetricCard icon="⭐" label="Avaliação"  valor={businessStats.rating}  sub={`${businessStats.reviewsToday} avaliações`} cor={COLORS.gold} />
          <MetricCard icon="🎟" label="Resgatados" valor={businessStats.couponsRedeemed} sub={`/ ${businessStats.couponsTotal}`} cor={COLORS.purpleLight} />
          <MetricCard icon="🔥" label="Nível"      valor={businessStats.heatLevel || "WARM"} cor={COLORS.primary} />
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

          {perms.canEditEventField("status") && (
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

        {/* Controle de lotação */}
        <View style={s.secao}>
          <Text style={s.secaoTitulo}>Status de Lotação</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {OPCOES_LOTACAO.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[s.lotacaoBtn, statusLotacao === opt.key && { borderColor: opt.cor, backgroundColor: opt.cor + "22" }]}
                onPress={() => { setStatusLotacao(opt.key); Alert.alert("✅ Atualizado", `Lotação: ${opt.label}`); }}
              >
                <Text style={{ fontSize: 18, marginBottom: 2 }}>{opt.icon}</Text>
                <Text style={[s.lotacaoLabel, statusLotacao === opt.key && { color: opt.cor, fontWeight: "700" }]}>
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

  // Crowd control
  lotacaoBtn: {
    flex: 1, alignItems: "center", paddingVertical: 10,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  lotacaoLabel: { fontSize: 10, color: COLORS.textMuted },

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
});
