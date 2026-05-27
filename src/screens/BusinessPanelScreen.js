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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { usePermissions } from "../hooks/usePermissions";
import { COLORS, RADIUS, SHADOW } from "../utils/theme";
import { PhotoManager } from "../components/ImageCarousel";

// ─── Design tokens — mapeados para o tema global do app ───────────────────────
const D = {
  bg:           COLORS.bg,
  card:         COLORS.bgCard,
  card2:        COLORS.bgElevated,
  primary:      COLORS.primary,
  primaryLight: COLORS.primaryLight,
  text:         COLORS.text,
  textSub:      COLORS.textSub,
  border:       COLORS.border,
  borderAccent: COLORS.primaryLight,
};

const CROWD_STATUS = [
  { key: 'tranquilo', label: 'Tranquilo', level: 15 },
  { key: 'moderado',  label: 'Moderado',  level: 45 },
  { key: 'cheio',     label: 'Cheio',     level: 75 },
  { key: 'lotado',    label: 'Lotado',    level: 95 },
];

const ANUNCIOS = [
  { type: 'new_artist', label: "Novo artista",  title: "Novo artista a caminho!",   msg: "Um novo artista irá se apresentar em breve" },
  { type: 'queue_down', label: "Fila diminuiu", title: "A fila diminuiu!",           msg: "A entrada está mais rápida neste momento" },
  { type: 'promo',      label: "Promoção",      title: "Promoção especial!",         msg: "2 drinks pelo preço de 1 até meia-noite!" },
  { type: 'warning',    label: "Aviso",         title: "Aviso importante",           msg: "Estamos quase lotados" },
];

// ─── Utilitários ─────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function formatStartLabel(startsAt) {
  if (!startsAt) return null;
  const d = new Date(startsAt);
  if (isNaN(d.getTime())) return { label: `Início: ${startsAt}`, legacy: true };
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const label = isToday
    ? `Hoje às ${time}`
    : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + ` às ${time}`;
  const isPast = d.getTime() <= now.getTime();
  return { label: isPast ? `Iniciando às ${time}…` : label, legacy: false, isPast };
}

// ─── CrowdGauge ──────────────────────────────────────────────────────────────

function CrowdGauge({ eventoAtivo, meusEventos }) {
  const level = eventoAtivo.crowdLevel ?? 0;
  const count = eventoAtivo.checkedInCount ?? 0;
  const cap   = eventoAtivo.maxCapacity;

  const barColor =
    level >= 85 ? COLORS.danger
    : level >= 60 ? COLORS.warning
    : level >= 30 ? COLORS.primary
    : COLORS.success;

  const pastEventsCrowd = meusEventos.filter((e) => !e.isLive && (e.crowdLevel ?? 0) > 0);
  const avgLevel = pastEventsCrowd.length > 0
    ? Math.round(pastEventsCrowd.reduce((a, e) => a + (e.crowdLevel ?? 0), 0) / pastEventsCrowd.length)
    : null;
  const delta = avgLevel !== null ? level - avgLevel : null;
  const deltaLabel = delta !== null
    ? delta > 0 ? `▲ +${delta}% acima da média`
    : delta < 0 ? `▼ ${Math.abs(delta)}% abaixo da média`
    : '→ Na média histórica'
    : null;
  const deltaColor = delta !== null ? (delta >= 0 ? COLORS.success : COLORS.warning) : COLORS.textMuted;

  return (
    <View style={cg.root}>
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
      {deltaLabel && (
        <View style={cg.deltaRow}>
          <View style={cg.deltaBar}>
            {avgLevel !== null && <View style={[cg.deltaAvgMarker, { left: `${avgLevel}%` }]} />}
            <View style={[cg.deltaFill, { width: `${Math.max(2, level)}%`, backgroundColor: barColor + '66' }]} />
          </View>
          <Text style={[cg.deltaLabel, { color: deltaColor }]}>{deltaLabel}</Text>
          {avgLevel !== null && (
            <Text style={cg.avgLabel}>Média dos seus eventos: {avgLevel}%</Text>
          )}
        </View>
      )}
    </View>
  );
}

const cg = StyleSheet.create({
  root: { backgroundColor: D.card2, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 0.5, borderColor: D.border },
  gaugeRow: { flexDirection: 'row', alignItems: 'center' },
  bigPct: { fontSize: 36, fontWeight: '900', lineHeight: 40, width: 76 },
  crowdLabel: { fontSize: 13, fontWeight: '700', color: D.text, marginBottom: 8 },
  barBg: { height: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 5, overflow: 'hidden', marginBottom: 6 },
  barFill: { height: '100%', borderRadius: 5 },
  countText: { fontSize: 12, color: D.textSub },
  deltaRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: D.border },
  deltaBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 8, position: 'relative' },
  deltaFill: { height: '100%', borderRadius: 3 },
  deltaAvgMarker: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  deltaLabel: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  avgLabel: { fontSize: 11, color: D.textSub },
});

// ─── FeaturedRatingCard ──────────────────────────────────────────────────────

function FeaturedRatingCard({ featured, totalVotes }) {
  if (!featured) {
    return (
      <View style={fr.empty}>
        <Text style={fr.emptyText}>Aguardando avaliações do público…</Text>
      </View>
    );
  }
  return (
    <View style={[fr.card, { borderColor: featured.cor + '44' }]}>
      <View style={fr.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={fr.categoryLabel}>MAIS VOTADO</Text>
          <Text style={[fr.categoryName, { color: featured.cor }]}>{featured.label}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[fr.pct, { color: featured.cor }]}>{featured.pct}%</Text>
          <Text style={fr.votesCount}>{featured.votes}/{totalVotes}</Text>
        </View>
      </View>
      <View style={fr.barBg}>
        <View style={[fr.barFill, { width: `${featured.pct}%`, backgroundColor: featured.cor }]} />
      </View>
    </View>
  );
}

const fr = StyleSheet.create({
  card: { backgroundColor: D.card, borderRadius: 16, padding: 14, borderWidth: 1, marginBottom: 10 },
  empty: { backgroundColor: D.card, borderRadius: 16, padding: 14, borderWidth: 0.5, borderColor: D.border, marginBottom: 10, alignItems: 'center' },
  emptyText: { fontSize: 13, color: D.textSub },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  bigIcon: { fontSize: 34 },
  categoryLabel: { fontSize: 10, fontWeight: '700', color: D.textSub, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  categoryName: { fontSize: 18, fontWeight: '900' },
  pct: { fontSize: 26, fontWeight: '900', lineHeight: 28 },
  votesCount: { fontSize: 11, color: D.textSub },
  barBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
});

// ─── OwnerCard ───────────────────────────────────────────────────────────────

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
    setNewPassword(""); setConfirmPassword("");
    setShowNewPwd(false); setShowConfirmPwd(false);
    setModalVisible(true);
  }

  async function handleSave() {
    const trimmedName  = editName.trim();
    const trimmedVenue = editVenueName.trim();
    if (!trimmedName)  { Alert.alert("Atenção", "O nome não pode ficar vazio."); return; }
    if (!trimmedVenue) { Alert.alert("Atenção", "O nome do estabelecimento não pode ficar vazio."); return; }
    if (newPassword) {
      if (newPassword.length < 6) { Alert.alert("Atenção", "A nova senha deve ter pelo menos 6 caracteres."); return; }
      if (newPassword !== confirmPassword) { Alert.alert("Atenção", "As senhas não coincidem."); return; }
    }
    setSaving(true);
    const profileResult = await updateProfile({ name: trimmedName, avatar: editAvatar.trim() || trimmedName.slice(0, 2).toUpperCase(), venueName: trimmedVenue });
    const passwordResult = newPassword ? await updatePassword(newPassword) : { error: null };
    setSaving(false);
    const error = profileResult.error || passwordResult.error;
    if (error) Alert.alert("Erro", error);
    else setModalVisible(false);
  }

  return (
    <>
      <View style={s.usuarioCard}>
        <View style={s.usuarioAvatar}>
          <Text style={s.usuarioAvatarTexto}>{currentUser?.avatar || "B"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.usuarioNome}>{currentUser?.name || "Estabelecimento"}</Text>
          <Text style={s.usuarioEmail}>{currentUser?.venueName ? currentUser.venueName : currentUser?.email || ""}</Text>
        </View>
        <TouchableOpacity style={s.editProfileBtn} onPress={openModal}>
          <Ionicons name="person-circle-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={s.sairBtn} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={16} color={COLORS.danger} />
          <Text style={s.sairTexto}>Sair</Text>
        </TouchableOpacity>
      </View>
      <EditProfileModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        editName={editName} setEditName={setEditName}
        editAvatar={editAvatar} setEditAvatar={setEditAvatar}
        editVenueName={editVenueName} setEditVenueName={setEditVenueName}
        newPassword={newPassword} setNewPassword={setNewPassword}
        confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
        showNewPwd={showNewPwd} setShowNewPwd={setShowNewPwd}
        showConfirmPwd={showConfirmPwd} setShowConfirmPwd={setShowConfirmPwd}
        saving={saving} onSave={handleSave}
      />
    </>
  );
}

// ─── ProfileHeader ───────────────────────────────────────────────────────────

function ProfileHeader({ currentUser, onLogout }) {
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
    setNewPassword(""); setConfirmPassword("");
    setShowNewPwd(false); setShowConfirmPwd(false);
    setModalVisible(true);
  }

  async function handleSave() {
    const trimmedName  = editName.trim();
    const trimmedVenue = editVenueName.trim();
    if (!trimmedName)  { Alert.alert("Atenção", "O nome não pode ficar vazio."); return; }
    if (!trimmedVenue) { Alert.alert("Atenção", "O nome do estabelecimento não pode ficar vazio."); return; }
    if (newPassword) {
      if (newPassword.length < 6) { Alert.alert("Atenção", "A nova senha deve ter pelo menos 6 caracteres."); return; }
      if (newPassword !== confirmPassword) { Alert.alert("Atenção", "As senhas não coincidem."); return; }
    }
    setSaving(true);
    const profileResult = await updateProfile({ name: trimmedName, avatar: editAvatar.trim() || trimmedName.slice(0, 2).toUpperCase(), venueName: trimmedVenue });
    const passwordResult = newPassword ? await updatePassword(newPassword) : { error: null };
    setSaving(false);
    const error = profileResult.error || passwordResult.error;
    if (error) Alert.alert("Erro", error);
    else setModalVisible(false);
  }

  const handle = currentUser?.name
    ? '@' + currentUser.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    : '@usuario';

  return (
    <>
      <View style={nd.profileSection}>
        <TouchableOpacity style={nd.avatarBorder} onPress={openModal} activeOpacity={0.8}>
          <View style={nd.avatarInner}>
            <Text style={nd.avatarText}>{currentUser?.avatar || "B"}</Text>
          </View>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={nd.profileName}>{currentUser?.name || "Estabelecimento"}</Text>
          <Text style={nd.profileHandle}>{handle}</Text>
        </View>
        <TouchableOpacity style={nd.sairBtnNew} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={14} color={D.primary} />
          <Text style={nd.sairTextNew}>Sair</Text>
        </TouchableOpacity>
      </View>
      <EditProfileModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        editName={editName} setEditName={setEditName}
        editAvatar={editAvatar} setEditAvatar={setEditAvatar}
        editVenueName={editVenueName} setEditVenueName={setEditVenueName}
        newPassword={newPassword} setNewPassword={setNewPassword}
        confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
        showNewPwd={showNewPwd} setShowNewPwd={setShowNewPwd}
        showConfirmPwd={showConfirmPwd} setShowConfirmPwd={setShowConfirmPwd}
        saving={saving} onSave={handleSave}
      />
    </>
  );
}

// ─── EditProfileModal ─────────────────────────────────────────────────────────

function EditProfileModal({
  visible, onClose,
  editName, setEditName, editAvatar, setEditAvatar,
  editVenueName, setEditVenueName,
  newPassword, setNewPassword, confirmPassword, setConfirmPassword,
  showNewPwd, setShowNewPwd, showConfirmPwd, setShowConfirmPwd,
  saving, onSave,
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <TouchableOpacity style={bp.overlay} activeOpacity={1} onPress={onClose}>
          <TouchableOpacity activeOpacity={1} style={bp.sheet}>
            <View style={bp.sheetHeader}>
              <Text style={bp.sheetTitle}>Editar Perfil</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={bp.avatarPreview}>
              <Text style={bp.avatarPreviewText}>{editAvatar || editName.slice(0, 2).toUpperCase() || "B"}</Text>
            </View>
            <Text style={bp.label}>Nome</Text>
            <TextInput style={bp.input} value={editName} onChangeText={setEditName} placeholder="Seu nome" placeholderTextColor={COLORS.textMuted} autoCorrect={false} />
            <Text style={bp.label}>Iniciais (até 2 letras)</Text>
            <TextInput style={bp.input} value={editAvatar} onChangeText={(v) => setEditAvatar(v.slice(0, 2).toUpperCase())} placeholder="Ex: AB" placeholderTextColor={COLORS.textMuted} maxLength={2} autoCapitalize="characters" />
            <Text style={bp.label}>Nome do Estabelecimento</Text>
            <TextInput style={bp.input} value={editVenueName} onChangeText={setEditVenueName} placeholder="Ex: Bar do João" placeholderTextColor={COLORS.textMuted} autoCorrect={false} />
            <View style={bp.divider} />
            <Text style={bp.sectionLabel}>Alterar Senha</Text>
            <Text style={bp.sectionHint}>Deixe em branco para não alterar</Text>
            <Text style={bp.label}>Nova Senha</Text>
            <View style={bp.inputRow}>
              <TextInput style={[bp.input, { flex: 1, marginBottom: 0, borderWidth: 0, borderRadius: 0 }]} value={newPassword} onChangeText={setNewPassword} placeholder="Mínimo 6 caracteres" placeholderTextColor={COLORS.textMuted} secureTextEntry={!showNewPwd} autoCorrect={false} autoCapitalize="none" />
              <TouchableOpacity style={bp.eyeBtn} onPress={() => setShowNewPwd(v => !v)}>
                <Ionicons name={showNewPwd ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={[bp.label, { marginTop: 12 }]}>Confirmar Nova Senha</Text>
            <View style={bp.inputRow}>
              <TextInput style={[bp.input, { flex: 1, marginBottom: 0, borderWidth: 0, borderRadius: 0 }]} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repita a nova senha" placeholderTextColor={COLORS.textMuted} secureTextEntry={!showConfirmPwd} autoCorrect={false} autoCapitalize="none" />
              <TouchableOpacity style={bp.eyeBtn} onPress={() => setShowConfirmPwd(v => !v)}>
                <Ionicons name={showConfirmPwd ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[bp.saveBtn, saving && { opacity: 0.7 }]} onPress={onSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={bp.saveBtnText}>Salvar</Text>}
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── MetricCard ──────────────────────────────────────────────────────────────

function MetricCard({ icon, label, valor, sub, cor }) {
  return (
    <View style={s.metricCard}>
      <Text style={[s.metricValor, { color: cor }]}>{valor}</Text>
      <Text style={s.metricLabel}>{label}</Text>
      {sub ? <Text style={s.metricSub}>{sub}</Text> : null}
    </View>
  );
}

// ─── InfoCard ────────────────────────────────────────────────────────────────

function InfoCard({ iconName, value, label, accentBorder }) {
  return (
    <View style={[nd.infoCard, accentBorder && { borderColor: D.borderAccent }]}>
      <Ionicons name={iconName} size={20} color={D.primary} />
      <Text style={nd.infoCardValue}>{value}</Text>
      <Text style={nd.infoCardLabel}>{label}</Text>
    </View>
  );
}

// ─── CouponRow ───────────────────────────────────────────────────────────────

function CouponRow({ c, onPress }) {
  return (
    <TouchableOpacity style={nd.couponRow} onPress={onPress} activeOpacity={0.8}>
      <View style={nd.couponIconWrap}>
        <Ionicons name="ticket-outline" size={18} color={D.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={nd.couponTitle} numberOfLines={1}>{c.title}</Text>
        <Text style={nd.couponQty}>{c.remainingQty}/{c.totalQty} restantes · {c.totalQty - c.remainingQty} resgatados</Text>
        <View style={nd.couponBar}>
          <View style={[nd.couponBarFill, { width: `${(c.remainingQty / c.totalQty) * 100}%` }]} />
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={D.primary} />
    </TouchableOpacity>
  );
}

// ─── EmptyState ──────────────────────────────────────────────────────────────

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
        <Text style={s.emptyTitulo}>Nenhum evento ainda</Text>
        <Text style={s.emptySub}>
          Crie seu primeiro evento para começar a gerenciar ingressos, cupons e a experiência dos seus clientes.
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

// ─── PlansModal ──────────────────────────────────────────────────────────────

const PLANS_DATA = [
  {
    id: 'basic',
    name: 'Básico',
    price: 'R$ 69,90',
    priceRaw: '6990',
    boost: '1x',
    boostLabel: '1x mais visibilidade',
    color: '#8B9CC8',
    features: [
      'Destaque básico no feed',
      'Alcance local padrão',
      '1 evento impulsionado/mês',
      'Suporte por e-mail',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$ 99,90',
    priceRaw: '9990',
    boost: '5x',
    boostLabel: '5x mais visibilidade',
    color: COLORS.primary,
    popular: true,
    features: [
      'Destaque premium no feed',
      'Alcance regional ampliado',
      '3 eventos impulsionados/mês',
      'Suporte prioritário',
      'Analytics avançado',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'R$ 149,90',
    priceRaw: '14990',
    boost: '15x',
    boostLabel: '15x mais visibilidade',
    color: '#F59E0B',
    features: [
      'Destaque máximo no feed',
      'Alcance nacional',
      'Eventos ilimitados',
      'Gerente de conta dedicado',
      'Analytics completo',
      'Badge verificado ✅',
    ],
  },
];

const PAY_METHODS = [
  { id: 'pix',    label: 'PIX',    icon: '❖' },
  { id: 'card',   label: 'Cartão', icon: '💳' },
  { id: 'boleto', label: 'Boleto', icon: '📄' },
];

function PlansModal({ visible, onClose }) {
  const [step, setStep]               = useState('plans'); // 'plans' | 'payment' | 'success'
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [payMethod, setPayMethod]     = useState('pix');
  const [processing, setProcessing]   = useState(false);
  const [cardNumber, setCardNumber]   = useState('');
  const [cardName, setCardName]       = useState('');
  const [cardExpiry, setCardExpiry]   = useState('');
  const [cardCVV, setCardCVV]         = useState('');

  function selectPlan(plan) {
    setSelectedPlan(plan);
    setPayMethod('pix');
    setStep('payment');
  }

  function handlePay() {
    setProcessing(true);
    setTimeout(() => { setProcessing(false); setStep('success'); }, 2200);
  }

  function handleClose() {
    onClose();
    setTimeout(() => {
      setStep('plans'); setSelectedPlan(null); setPayMethod('pix');
      setCardNumber(''); setCardName(''); setCardExpiry(''); setCardCVV('');
    }, 350);
  }

  function fmtCard(t) {
    return t.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  }
  function fmtExpiry(t) {
    const c = t.replace(/\D/g, '').slice(0, 4);
    return c.length >= 2 ? c.slice(0, 2) + '/' + c.slice(2) : c;
  }

  const col = selectedPlan?.color ?? COLORS.primary;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={pm.overlay}>

        {/* ══ STEP 1 — PLANOS ══════════════════════════════════════════════ */}
        {step === 'plans' && (
          <View style={pm.sheet}>
            <View style={pm.handle} />
            <View style={pm.sheetHeader}>
              <View>
                <Text style={pm.sheetTitle}>⚡ Impulsionar Visibilidade</Text>
                <Text style={pm.sheetSub}>Alcance mais pessoas com seu evento</Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={pm.closeBtn}>
                <Ionicons name="close" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
              {PLANS_DATA.map((plan) => (
                <View
                  key={plan.id}
                  style={[pm.planCard, { borderColor: plan.color + (plan.popular ? 'BB' : '44') }]}
                >
                  {plan.popular && (
                    <View style={[pm.popularBadge, { backgroundColor: plan.color }]}>
                      <Text style={pm.popularBadgeText}>⭐ Mais Popular</Text>
                    </View>
                  )}

                  {/* Cabeçalho do plano */}
                  <View style={pm.planCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[pm.planName, { color: plan.color }]}>{plan.name}</Text>
                      <View style={pm.boostRow}>
                        <Text style={[pm.boostMult, { color: plan.color }]}>{plan.boost}</Text>
                        <Text style={pm.boostSuffix}> mais visibilidade</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[pm.planPrice, { color: plan.color }]}>{plan.price}</Text>
                      <Text style={pm.planPeriod}>/mês</Text>
                    </View>
                  </View>

                  {/* Features */}
                  <View style={pm.featuresList}>
                    {plan.features.map((f, i) => (
                      <View key={i} style={pm.featureRow}>
                        <Ionicons name="checkmark-circle" size={14} color={plan.color} />
                        <Text style={pm.featureText}>{f}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Botão Assinar */}
                  <TouchableOpacity
                    style={[pm.planBtn, { backgroundColor: plan.color }]}
                    onPress={() => selectPlan(plan)}
                    activeOpacity={0.85}
                  >
                    <Text style={pm.planBtnText}>Assinar {plan.name}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ══ STEP 2 — PAGAMENTO ═══════════════════════════════════════════ */}
        {step === 'payment' && selectedPlan && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, justifyContent: 'flex-end' }}
          >
            <View style={pm.sheet}>
              <View style={pm.handle} />
              {/* Header */}
              <View style={pm.sheetHeader}>
                <TouchableOpacity onPress={() => setStep('plans')} style={pm.backBtn}>
                  <Ionicons name="arrow-back" size={20} color={COLORS.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={pm.sheetTitle}>Pagamento</Text>
                  <Text style={[pm.sheetSub, { color: col }]}>
                    Plano {selectedPlan.name} · {selectedPlan.price}/mês
                  </Text>
                </View>
                <TouchableOpacity onPress={handleClose} style={pm.closeBtn}>
                  <Ionicons name="close" size={22} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Seletor de método */}
              <View style={pm.methodRow}>
                {PAY_METHODS.map((m) => {
                  const active = payMethod === m.id;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={[pm.methodBtn, active && { borderColor: col, backgroundColor: col + '22' }]}
                      onPress={() => setPayMethod(m.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={pm.methodIcon}>{m.icon}</Text>
                      <Text style={[pm.methodLabel, active && { color: col, fontWeight: '700' }]}>{m.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* PIX ─────────────────────────────────── */}
                {payMethod === 'pix' && (
                  <View style={pm.payContent}>
                    <View style={pm.pixQR}>
                      <Text style={{ fontSize: 56 }}>📱</Text>
                      <Text style={pm.pixQRLabel}>QR Code PIX</Text>
                      <Text style={pm.pixQRSub}>(simulado)</Text>
                    </View>
                    <View style={pm.pixKeyBox}>
                      <Text style={pm.pixKeyLabel}>Chave PIX</Text>
                      <Text style={pm.pixKeyValue}>livevibe@pagamentos.pix</Text>
                      <Text style={pm.pixKeyHint}>Escaneie o QR Code ou copie a chave acima</Text>
                    </View>
                    <View style={pm.totalRow}>
                      <Text style={pm.totalLabel}>Total:</Text>
                      <Text style={[pm.totalValue, { color: col }]}>{selectedPlan.price}</Text>
                    </View>
                  </View>
                )}

                {/* CARTÃO ──────────────────────────────── */}
                {payMethod === 'card' && (
                  <View style={pm.payContent}>
                    {/* Preview do cartão */}
                    <View style={[pm.cardPreview, { borderColor: col + '66' }]}>
                      <Text style={pm.cardPreviewChip}>💳</Text>
                      <Text style={pm.cardPreviewNum}>{cardNumber || '•••• •••• •••• ••••'}</Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                        <Text style={pm.cardPreviewName}>{cardName || 'NOME DO TITULAR'}</Text>
                        <Text style={pm.cardPreviewExp}>{cardExpiry || 'MM/AA'}</Text>
                      </View>
                    </View>
                    <TextInput
                      style={pm.payInput}
                      placeholder="Número do cartão"
                      placeholderTextColor={COLORS.textMuted}
                      value={cardNumber}
                      onChangeText={(t) => setCardNumber(fmtCard(t))}
                      keyboardType="number-pad"
                      maxLength={19}
                    />
                    <TextInput
                      style={pm.payInput}
                      placeholder="Nome no cartão"
                      placeholderTextColor={COLORS.textMuted}
                      value={cardName}
                      onChangeText={(t) => setCardName(t.toUpperCase())}
                      autoCapitalize="characters"
                    />
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TextInput
                        style={[pm.payInput, { flex: 1 }]}
                        placeholder="Validade (MM/AA)"
                        placeholderTextColor={COLORS.textMuted}
                        value={cardExpiry}
                        onChangeText={(t) => setCardExpiry(fmtExpiry(t))}
                        keyboardType="number-pad"
                        maxLength={5}
                      />
                      <TextInput
                        style={[pm.payInput, { flex: 1 }]}
                        placeholder="CVV"
                        placeholderTextColor={COLORS.textMuted}
                        value={cardCVV}
                        onChangeText={(t) => setCardCVV(t.replace(/\D/g, '').slice(0, 3))}
                        keyboardType="number-pad"
                        maxLength={3}
                        secureTextEntry
                      />
                    </View>
                    <View style={pm.totalRow}>
                      <Text style={pm.totalLabel}>Total:</Text>
                      <Text style={[pm.totalValue, { color: col }]}>{selectedPlan.price}</Text>
                    </View>
                  </View>
                )}

                {/* BOLETO ──────────────────────────────── */}
                {payMethod === 'boleto' && (
                  <View style={pm.payContent}>
                    <View style={pm.boletoBox}>
                      <Text style={{ fontSize: 44, marginBottom: 10 }}>📄</Text>
                      <Text style={pm.boletoTitle}>Boleto Bancário</Text>
                      <Text style={pm.boletoBarcode}>
                        {'34191.09008 64513.760957\n38066.480008 4 000' + selectedPlan.priceRaw}
                      </Text>
                      <Text style={pm.boletoHint}>⏰ Vencimento: em 3 dias úteis</Text>
                    </View>
                    <View style={pm.totalRow}>
                      <Text style={pm.totalLabel}>Total:</Text>
                      <Text style={[pm.totalValue, { color: col }]}>{selectedPlan.price}</Text>
                    </View>
                  </View>
                )}

                {/* Botão pagar */}
                <TouchableOpacity
                  style={[pm.payBtn, { backgroundColor: col }, processing && { opacity: 0.65 }]}
                  onPress={handlePay}
                  disabled={processing}
                  activeOpacity={0.85}
                >
                  {processing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={pm.payBtnText}>
                      {payMethod === 'pix'    ? '⚡ Confirmar Pagamento PIX'
                      : payMethod === 'card'  ? '💳 Confirmar Pagamento'
                      :                        '📄 Gerar Boleto'}
                    </Text>
                  )}
                </TouchableOpacity>
                <View style={{ height: 28 }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        )}

        {/* ══ STEP 3 — SUCESSO ═════════════════════════════════════════════ */}
        {step === 'success' && selectedPlan && (
          <View style={pm.sheet}>
            <View style={pm.handle} />
            <View style={pm.successContent}>
              <View style={[pm.successIconCircle, { backgroundColor: col + '22', borderColor: col + '88' }]}>
                <Text style={{ fontSize: 52 }}>🎉</Text>
              </View>
              <Text style={pm.successTitle}>Assinatura Confirmada!</Text>
              <Text style={[pm.successPlan, { color: col }]}>Plano {selectedPlan.name} ativado</Text>
              <Text style={pm.successMsg}>
                Seu evento agora tem{' '}
                <Text style={{ color: col, fontWeight: '800' }}>{selectedPlan.boostLabel}</Text>
                {' '}no feed. Mais pessoas vão descobrir você! 🚀
              </Text>
              <TouchableOpacity
                style={[pm.successBtn, { backgroundColor: col }]}
                onPress={handleClose}
                activeOpacity={0.85}
              >
                <Text style={pm.successBtnText}>Perfeito! ✨</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </View>
    </Modal>
  );
}

// ─── InactivePanel ───────────────────────────────────────────────────────────

function InactivePanel({ currentUser, meusEventos, meusCupons, onLogout, onCreateEvent, navigation }) {
  const [plansVisible, setPlansVisible] = useState(false);
  const ultimoEvento = meusEventos[0];
  const totalCriadosGeral  = meusCupons.length;
  const totalResgatados    = meusCupons.reduce((acc, c) => acc + (c.totalQty - c.remainingQty), 0);
  const totalParticipantes = meusEventos.reduce((acc, e) => acc + (e.checkedInCount ?? 0), 0);
  const mediaAvaliacao = (() => {
    const comRating = meusEventos.filter(e => e.rating > 0);
    if (!comRating.length) return "—";
    return (comRating.reduce((a, e) => a + e.rating, 0) / comRating.length).toFixed(1);
  })();

  return (
    <>
      <PlansModal visible={plansVisible} onClose={() => setPlansVisible(false)} />
      <SafeAreaView style={s.safe} edges={["top"]}>
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
        <View style={s.inativoBanner}>
          <Ionicons name="moon-outline" size={16} color={COLORS.textMuted} />
          <Text style={s.inativoBannerTexto}>Nenhum evento ativo no momento</Text>
        </View>
        <View style={s.secao}>
          <Text style={s.secaoTitulo}>Histórico geral</Text>
          <View style={s.metricsGrid}>
            <MetricCard icon="" label="Eventos" valor={meusEventos.length} cor={COLORS.purpleLight} />
            <MetricCard icon="" label="Participantes" valor={totalParticipantes.toLocaleString()} cor={COLORS.primaryLight} />
            <MetricCard icon="" label="Resgatados" valor={totalResgatados} sub={`/ ${totalCriadosGeral} criados`} cor={COLORS.purpleLight} />
            <MetricCard icon="" label="Avaliação média" valor={mediaAvaliacao} cor={COLORS.gold} />
          </View>
        </View>
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
              {ultimoEvento.startsAt && <Text style={s.ultimoEventoData}>{formatDate(ultimoEvento.startsAt)}</Text>}
              <View style={{ flexDirection: "row", gap: 16, marginTop: 14 }}>
                {[
                  { label: "Cupons criados", valor: meusCupons.filter(c => c.eventId === ultimoEvento.id).length },
                  { label: "Resgatados",     valor: meusCupons.filter(c => c.eventId === ultimoEvento.id).reduce((a, c) => a + (c.totalQty - c.remainingQty), 0) },
                  { label: "Participantes",  valor: ultimoEvento.checkedInCount ?? 0 },
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
                {startInfo && (
                  <View style={[s.inicioChip, startInfo.isPast && { backgroundColor: COLORS.success + '22', borderColor: COLORS.success + '55' }]}>
                    <Ionicons name={startInfo.isPast ? 'hourglass-outline' : 'time-outline'} size={11} color={startInfo.isPast ? COLORS.success : COLORS.primary} />
                    <Text style={[s.inicioChipTexto, startInfo.isPast && { color: COLORS.success }]}>{startInfo.label}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
        <View style={{ paddingHorizontal: 12, marginTop: 24 }}>
          <TouchableOpacity style={s.emptyBtn} onPress={onCreateEvent}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={s.emptyBtnTexto}>Criar Novo Evento</Text>
          </TouchableOpacity>
        </View>
        <View style={s.impulsionarCard}>
          <Text style={s.impulsionarTitulo}>Impulsionar Visibilidade</Text>
          <Text style={s.impulsionarSub}>Destaque seu evento no topo do feed para +2.300 usuários próximos</Text>
          <TouchableOpacity style={s.impulsionarBtn} onPress={() => setPlansVisible(true)}>
            <Text style={s.impulsionarBtnTexto}>Ver planos →</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
    </>
  );
}

// ─── ActivePanel ─────────────────────────────────────────────────────────────

function ActivePanel({
  currentUser, eventoAtivo, businessStats, cuponsDoAtivo, meusEventos,
  onLogout, onCreateEvent, navigation,
  addEventPhoto, removeEventPhoto, updateEventFields, closeEvent,
}) {
  const perms = usePermissions();
  const { subscribeToEventRatings, getEventRatings, sendAnnouncement } = useApp();
  const [secaoFotos, setSecaoFotos]       = useState(false);
  const [plansVisible, setPlansVisible]   = useState(false);

  useEffect(() => {
    if (eventoAtivo?.id) subscribeToEventRatings(eventoAtivo.id);
  }, [eventoAtivo?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const eventRating = getEventRatings(eventoAtivo?.id ?? '');
  const totalVotes  = Object.values(eventRating.counts).reduce((a, b) => a + b, 0);

  const [novoArtista, setNovoArtista]       = useState("");
  const [novoHorarioFim, setNovoHorarioFim] = useState("");
  const [salvando, setSalvando]             = useState(false);
  const [settingCrowd, setSettingCrowd]     = useState(false);
  const [sendingAnuncio, setSendingAnuncio] = useState(null);

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
    if (result.error) Alert.alert("Erro", "Não foi possível salvar. Tente novamente.");
    else { setNovoArtista(""); setNovoHorarioFim(""); Alert.alert("Salvo", "Informações do evento atualizadas."); }
  }

  async function handleCrowdStatus(status) {
    if (settingCrowd) return;
    setSettingCrowd(true);
    await updateEventFields(eventoAtivo.id, { crowdLabel: status.label, crowdLevel: status.level });
    setSettingCrowd(false);
  }

  function handleEncerrarEvento() {
    Alert.alert(
      "Encerrar Evento",
      `Deseja encerrar "${eventoAtivo.name}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Encerrar", style: "destructive", onPress: async () => {
          const result = await closeEvent(eventoAtivo.id);
          if (result.error) Alert.alert("Erro", "Não foi possível encerrar o evento.");
          else Alert.alert("Evento encerrado", `"${eventoAtivo.name}" foi encerrado.`);
        }},
      ],
    );
  }

  async function handleAnuncio(a) {
    if (sendingAnuncio) return;
    setSendingAnuncio(a.type);
    const { error } = await sendAnnouncement(eventoAtivo.id, {
      type:  a.type,
      title: a.title,
      body:  `${eventoAtivo.name}: ${a.msg}`,
      icon:  a.icon,
    });
    setSendingAnuncio(null);
    if (error) {
      Alert.alert("Erro", "Não foi possível enviar o aviso. Tente novamente.");
    } else {
      Alert.alert("Enviado!", `"${a.msg}" foi notificado para usuários próximos.`);
    }
  }

  const currentCrowdKey = CROWD_STATUS.find(
    cs => cs.label.toLowerCase() === (eventoAtivo.crowdLabel ?? '').toLowerCase()
  )?.key ?? null;

  const coverPhoto = eventoAtivo.photos?.[0] ?? null;

  return (
    <SafeAreaView style={nd.safe} edges={["top"]}>

      {/* ── TopAppBar ─────────────────────────────────────────────────── */}
      <View style={nd.topBar}>
        <View style={nd.logoRow}>
          <Ionicons name="pulse" size={18} color={D.primary} />
          <Text style={nd.logoText}>LiveVibe</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <TouchableOpacity style={nd.novoEventoBtn} onPress={onCreateEvent}>
            <Ionicons name="add" size={16} color="#fff" />
          </TouchableOpacity>
          <View style={nd.liveChip}>
            <View style={nd.liveDot} />
            <Text style={nd.liveChipText}>Ao vivo</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: D.bg }}>

        {/* ── Perfil ────────────────────────────────────────────────────── */}
        <ProfileHeader currentUser={currentUser} onLogout={onLogout} />

        {/* ── Área do Evento ── */}
        <View style={nd.venueCard}>
          {coverPhoto ? (
            <Image source={{ uri: coverPhoto }} style={nd.venueBgImage} resizeMode="cover" />
          ) : null}
          <View style={nd.venueOverlay} />
          <View style={nd.venueContent}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={nd.venueName} numberOfLines={2}>{eventoAtivo.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="location" size={12} color={D.primary} />
                <Text style={nd.venueLocation} numberOfLines={1}>{eventoAtivo.venue}</Text>
              </View>
            </View>
            <TouchableOpacity style={nd.addPhotosBtn} onPress={() => setSecaoFotos(v => !v)} activeOpacity={0.8}>
              <Ionicons name="images-outline" size={14} color="#fff" />
              <Text style={nd.addPhotosBtnText}>{"Adicionar\nfotos"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Fotos (colapsível) ────────────────────────────────────────── */}
        {secaoFotos && (
          <View style={nd.fotosSection}>
            <Text style={nd.fotosTitle}>Fotos do Evento</Text>
            <Text style={nd.fotosSub}>A primeira foto será usada como capa nos cards</Text>
            <PhotoManager
              photos={eventoAtivo.photos || []}
              onAdd={(uri) => addEventPhoto(eventoAtivo.id, uri)}
              onRemove={(idx) => removeEventPhoto(eventoAtivo.id, idx)}
              maxPhotos={8}
            />
          </View>
        )}

        {/* ── Métricas ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={nd.infoCardsScroll} contentContainerStyle={nd.infoCardsContent}>
          <InfoCard
            iconName="people"
            value={eventoAtivo.checkedInCount?.toLocaleString() ?? '0'}
            label="pessoas presentes"
          />
          <InfoCard
            iconName="star"
            value={eventoAtivo.rating > 0 ? eventoAtivo.rating.toFixed(1) : '—'}
            label={`Avaliações (${eventoAtivo.reviewCount ?? 0})`}
            accentBorder
          />
          <InfoCard
            iconName="ticket-outline"
            value={cuponsDoAtivo.length}
            label="Cupons ativos"
          />
        </ScrollView>

        {/* ── Status de Lotação ─────────────────────────────────────────── */}
        <View style={nd.section}>
          <Text style={nd.sectionTitle}>Status de Lotação</Text>

          <CrowdGauge eventoAtivo={eventoAtivo} meusEventos={meusEventos} />
          <View style={nd.crowdGrid}>
            {CROWD_STATUS.map((cs) => {
              const isActive = cs.key === currentCrowdKey;
              return (
                <TouchableOpacity
                  key={cs.key}
                  style={[nd.crowdBtn, isActive && nd.crowdBtnActive]}
                  onPress={() => handleCrowdStatus(cs)}
                  disabled={settingCrowd}
                  activeOpacity={0.8}
                >
                  {settingCrowd && isActive
                    ? <ActivityIndicator size="small" color={D.primary} />
                    : <Text style={[nd.crowdBtnText, isActive && nd.crowdBtnTextActive]}>{cs.label}</Text>
                  }
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Percepção do Público ─────────────────────────────────────── */}
        <View style={nd.section}>
          <Text style={nd.sectionTitle}>Percepção do Público</Text>
          <FeaturedRatingCard featured={eventRating.featured} totalVotes={totalVotes} />
        </View>

        {/* ── Gerenciar Evento ─────────────────────────────────────────── */}
        {(perms.canEditEventField("nextAct") || perms.canEditEventField("endsAt") || perms.canEditEventField("closeEvent")) && (
          <View style={nd.section}>
            <Text style={nd.sectionTitle}>Gerenciar Evento</Text>

            {perms.canEditEventField("nextAct") && (
              <View style={nd.editCampo}>
                <Text style={nd.editLabel}>Próximo Artista</Text>
                <Text style={nd.editAtual}>Atual: {eventoAtivo.nextAct || "—"}</Text>
                <TextInput
                  style={nd.editInput}
                  placeholder="Nome do artista ou atração"
                  placeholderTextColor={D.textSub}
                  value={novoArtista}
                  onChangeText={setNovoArtista}
                  maxLength={80}
                />
              </View>
            )}

            {perms.canEditEventField("endsAt") && (
              <View style={nd.editCampo}>
                <Text style={nd.editLabel}>Horário de Término</Text>
                <Text style={nd.editAtual}>Atual: {eventoAtivo.endsAt || "—"}</Text>
                <TextInput
                  style={nd.editInput}
                  placeholder="Ex: 02:00"
                  placeholderTextColor={D.textSub}
                  value={novoHorarioFim}
                  onChangeText={setNovoHorarioFim}
                  maxLength={5}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            )}

            {(perms.canEditEventField("nextAct") || perms.canEditEventField("endsAt")) && (
              <TouchableOpacity style={[nd.salvarBtn, salvando && { opacity: 0.6 }]} onPress={handleSalvarCampos} disabled={salvando}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                <Text style={nd.salvarBtnText}>{salvando ? "Salvando..." : "Salvar alterações"}</Text>
              </TouchableOpacity>
            )}

            {perms.canEditEventField("closeEvent") && (
              <TouchableOpacity
                style={[nd.encerrarBtn, !eventoAtivo.isLive && { opacity: 0.5 }]}
                onPress={handleEncerrarEvento}
                disabled={!eventoAtivo.isLive}
              >
                <Ionicons name="stop-circle-outline" size={16} color={D.primary} />
                <Text style={nd.encerrarBtnText}>{eventoAtivo.isLive ? "Encerrar Evento" : "Evento já encerrado"}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Notificações Rápidas ──────────────────────────────────────── */}
        <View style={nd.section}>
          <Text style={nd.sectionTitle}>Notificações Rápidas</Text>
          <Text style={nd.sectionSub}>Avisos enviados para usuários próximos ao seu evento</Text>
          {ANUNCIOS.map((a, i) => {
            const isSending = sendingAnuncio === a.type;
            const isDisabled = !!sendingAnuncio;
            return (
              <TouchableOpacity
                key={i}
                style={[
                  nd.notifCard,
                  i === ANUNCIOS.length - 1 && { borderColor: D.primary },
                  isDisabled && { opacity: 0.6 },
                ]}
                onPress={() => handleAnuncio(a)}
                disabled={isDisabled}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={nd.notifTitle}>{a.label}</Text>
                  <Text style={nd.notifMsg} numberOfLines={2}>{a.msg}</Text>
                </View>
                {isSending
                  ? <ActivityIndicator size="small" color={D.primary} />
                  : <Ionicons name="send-outline" size={16} color={D.primary} />
                }
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Meus Cupons ──────────────────────────────────────────────── */}
        <View style={nd.section}>
          <View style={nd.sectionHeader}>
            <Text style={nd.sectionTitle}>Meus Cupons</Text>
            <TouchableOpacity onPress={() => navigation.navigate("AddCoupon")}>
              <Text style={nd.linkBtn}>Novo</Text>
            </TouchableOpacity>
          </View>
          {cuponsDoAtivo.length === 0 ? (
            <TouchableOpacity style={nd.vazioCard} onPress={() => navigation.navigate("AddCoupon")}>
              <Text style={nd.vazioTitle}>Criar primeiro cupom</Text>
              <Text style={nd.vazioSub}>Atraia mais clientes com cupons exclusivos</Text>
            </TouchableOpacity>
          ) : (
            cuponsDoAtivo.map((c) => (
              <CouponRow key={c.id} c={c} onPress={() => {}} />
            ))
          )}
        </View>

        {/* ── Avaliações Recentes ──────────────────────────────────────── */}
        {businessStats.recentReviews?.length > 0 && (
          <View style={nd.section}>
            <Text style={nd.sectionTitle}>Avaliações Recentes</Text>
            {businessStats.recentReviews.map((r, i) => (
              <View key={i} style={nd.reviewCard}>
                <View style={nd.reviewHeader}>
                  <Text style={nd.reviewUser}>{r.user}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="star" size={13} color={D.primary} />
                    <Text style={nd.reviewRating}>{r.stars?.toFixed ? r.stars.toFixed(1) : r.stars}</Text>
                  </View>
                </View>
                <Text style={nd.reviewText} numberOfLines={3}>{r.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Card Promocional ── */}
        <View style={nd.promoCard}>
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#1a0a10', borderRadius: 16 }]} />
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: D.primary, opacity: 0.18, borderRadius: 16 }]} />
          <View style={nd.promoContent}>
            <Text style={nd.promoTitle}>{"Alcance mais\npessoas"}</Text>
            <Text style={nd.promoSub}>Aumente a visibilidade do seu local em 50% com nossos planos</Text>
            <TouchableOpacity style={nd.promoBtn} onPress={() => setPlansVisible(true)}>
              <Text style={nd.promoBtnText}>Ver planos</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
      <PlansModal visible={plansVisible} onClose={() => setPlansVisible(false)} />
    </SafeAreaView>
  );
}

// ─── BusinessPanelScreen ─────────────────────────────────────────────────────

export default function BusinessPanelScreen({ navigation }) {
  const {
    events, coupons, currentUser, businessStats, dataLoading,
    logout, addEventPhoto, removeEventPhoto, updateEventFields, closeEvent,
  } = useApp();

  const meusEventos = useMemo(
    () => events.filter((e) => e.ownerId === currentUser?.id).sort((a, b) => new Date(b.startsAt ?? 0) - new Date(a.startsAt ?? 0)),
    [events, currentUser?.id],
  );
  const eventoAtivo  = useMemo(() => meusEventos.find((e) => e.isLive) ?? null, [meusEventos]);
  const meusCupons   = useMemo(() => coupons.filter((c) => meusEventos.some((e) => e.id === c.eventId)), [coupons, meusEventos]);
  const cuponsDoAtivo = useMemo(() => eventoAtivo ? coupons.filter((c) => c.eventId === eventoAtivo.id) : [], [coupons, eventoAtivo]);

  const panelState = (dataLoading && meusEventos.length === 0) ? 'loading'
    : meusEventos.length === 0 ? 'empty'
    : eventoAtivo ? 'active'
    : 'inactive';

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

  if (panelState === 'loading') {
    return (
      <SafeAreaView style={[s.safe, { justifyContent: "center", alignItems: "center" }]} edges={["top"]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textMuted, marginTop: 12, fontSize: 13 }}>Carregando painel…</Text>
      </SafeAreaView>
    );
  }
  if (panelState === 'empty') {
    return <EmptyState currentUser={currentUser} onLogout={handleLogout} onCreateEvent={onCreateEvent} />;
  }
  if (panelState === 'inactive') {
    return <InactivePanel currentUser={currentUser} meusEventos={meusEventos} meusCupons={meusCupons} onLogout={handleLogout} onCreateEvent={onCreateEvent} navigation={navigation} />;
  }
  return (
    <ActivePanel
      currentUser={currentUser} eventoAtivo={eventoAtivo} businessStats={businessStats}
      cuponsDoAtivo={cuponsDoAtivo} meusEventos={meusEventos}
      onLogout={handleLogout} onCreateEvent={onCreateEvent} navigation={navigation}
      addEventPhoto={addEventPhoto} removeEventPhoto={removeEventPhoto}
      updateEventFields={updateEventFields} closeEvent={closeEvent}
    />
  );
}

// ── Estilos compartilhados ────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  logo: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  novoEventoBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.full },
  novoEventoTexto: { color: "#fff", fontSize: 12, fontWeight: "700" },
  usuarioCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: COLORS.bgCard, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  usuarioAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary + "33", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: COLORS.primary + "66" },
  usuarioAvatarTexto: { fontSize: 15, fontWeight: "800", color: COLORS.primary },
  usuarioNome: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  usuarioEmail: { fontSize: 12, color: COLORS.textMuted },
  sairBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: COLORS.danger + "22", paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.full, borderWidth: 0.5, borderColor: COLORS.danger + "44" },
  sairTexto: { fontSize: 13, color: COLORS.danger, fontWeight: "700" },
  editProfileBtn: { padding: 4, marginRight: 4 },
  inativoBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.bgOverlay, paddingHorizontal: 16, paddingVertical: 10 },
  inativoBannerTexto: { fontSize: 13, color: COLORS.textMuted },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, paddingTop: 12, gap: 8 },
  metricCard: { flex: 1, minWidth: "45%", backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 14, borderWidth: 0.5, borderColor: COLORS.border },
  metricIcon: { fontSize: 18, marginBottom: 6 },
  metricValor: { fontSize: 22, fontWeight: "800" },
  metricLabel: { fontSize: 12, color: COLORS.textSub, marginTop: 2 },
  metricSub: { fontSize: 11, color: COLORS.success, fontWeight: "500", marginTop: 2 },
  secao: { paddingHorizontal: 12, marginTop: 20 },
  secaoTitulo: { fontSize: 12, fontWeight: "800", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 },
  ultimoEventoCard: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl, padding: 16, borderWidth: 0.5, borderColor: COLORS.border },
  ultimoEventoNome: { fontSize: 15, fontWeight: "800", color: COLORS.text, flex: 1 },
  ultimoEventoVenue: { fontSize: 12, color: COLORS.textSub },
  ultimoEventoData: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  statusBadgeTexto: { fontSize: 10, fontWeight: "700", color: COLORS.textMuted },
  eventoHistoricoRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 12, marginBottom: 8, borderWidth: 0.5, borderColor: COLORS.border },
  eventoHistoricoDot: { width: 10, height: 10, borderRadius: 5 },
  eventoHistoricoNome: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  eventoHistoricoData: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  inicioChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.primary + "18", paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 0.5, borderColor: COLORS.primary + "44" },
  inicioChipTexto: { fontSize: 11, color: COLORS.primary, fontWeight: "600" },
  emptyRoot: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyIconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primary + "18", justifyContent: "center", alignItems: "center", marginBottom: 20, borderWidth: 1, borderColor: COLORS.primary + "44" },
  emptyTitulo: { fontSize: 20, fontWeight: "800", color: COLORS.text, marginBottom: 10 },
  emptySub: { fontSize: 14, color: COLORS.textSub, textAlign: "center", lineHeight: 21, marginBottom: 28 },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 14, paddingHorizontal: 28, marginBottom: 12, width: "100%", justifyContent: "center", ...SHADOW.glow },
  emptyBtnTexto: { color: "#fff", fontWeight: "800", fontSize: 15 },
  emptyBtnSecundario: { paddingVertical: 10, paddingHorizontal: 20 },
  emptyBtnSecTexto: { fontSize: 13, color: COLORS.textMuted },
  impulsionarCard: { backgroundColor: COLORS.primary + "18", borderRadius: RADIUS.xl, margin: 12, padding: 18, borderWidth: 1, borderColor: COLORS.primary + "55" },
  impulsionarTitulo: { fontSize: 15, fontWeight: "800", color: COLORS.primaryLight, marginBottom: 6 },
  impulsionarSub: { fontSize: 13, color: COLORS.textSub, lineHeight: 19, marginBottom: 14 },
  impulsionarBtn: { backgroundColor: COLORS.primary, alignSelf: "flex-start", paddingHorizontal: 18, paddingVertical: 9, borderRadius: RADIUS.full },
  impulsionarBtnTexto: { color: "#fff", fontWeight: "800", fontSize: 13 },
});

// ── Estilos do painel ativo ───────────────────────────────────────────────────
const nd = StyleSheet.create({
  safe: { flex: 1, backgroundColor: D.bg },

  // ── Barra superior ──
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: D.bg, borderBottomWidth: 0.5, borderBottomColor: D.border },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoText: { fontSize: 22, fontWeight: '800', color: D.primary },
  novoEventoBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: D.primary, justifyContent: 'center', alignItems: 'center' },
  liveChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: D.card, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 0.5, borderColor: D.border },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ade80' },
  liveChipText: { fontSize: 12, color: D.text, fontWeight: '600' },

  // ── Seção de perfil ──
  profileSection: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 20 },
  avatarBorder: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: D.primary + '88', padding: 2, justifyContent: 'center', alignItems: 'center' },
  avatarInner: { width: 48, height: 48, borderRadius: 24, backgroundColor: D.card, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: D.primary },
  profileName: { fontSize: 18, fontWeight: '700', color: D.text, marginBottom: 2 },
  profileHandle: { fontSize: 12, fontWeight: '500', color: D.primary },
  sairBtnNew: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 0.5, borderColor: D.primary + '55' },
  sairTextNew: { fontSize: 13, fontWeight: '600', color: D.primary },

  // ── Card do evento ──
  venueCard: { marginHorizontal: 16, marginBottom: 16, borderRadius: 12, overflow: 'hidden', backgroundColor: D.card, borderWidth: 0.5, borderColor: D.border, minHeight: 140 },
  venueBgImage: { ...StyleSheet.absoluteFillObject },
  venueOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(13,10,20,0.72)' },
  venueContent: { flexDirection: 'row', alignItems: 'flex-end', padding: 20, minHeight: 140 },
  venueName: { fontSize: 28, fontWeight: '700', color: '#fff', lineHeight: 34, marginBottom: 6 },
  venueLocation: { fontSize: 12, fontWeight: '500', color: D.primary, flex: 1 },
  addPhotosBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 10, gap: 4, alignItems: 'center', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.3)', marginLeft: 12 },
  addPhotosBtnText: { fontSize: 10, color: '#fff', fontWeight: '600', textAlign: 'center', lineHeight: 14 },

  // ── Fotos ──
  fotosSection: { backgroundColor: D.card, marginHorizontal: 16, marginBottom: 16, borderRadius: 12, padding: 16, borderWidth: 0.5, borderColor: D.border },
  fotosTitle: { fontSize: 14, fontWeight: '700', color: D.text, marginBottom: 4 },
  fotosSub: { fontSize: 12, color: D.textSub, marginBottom: 12 },

  // ── Métricas ──
  infoCardsScroll: { marginBottom: 4 },
  infoCardsContent: { paddingHorizontal: 16, gap: 12 },
  infoCard: { width: 160, backgroundColor: D.card, borderRadius: 12, padding: 20, borderWidth: 0.5, borderColor: D.border, gap: 10 },
  infoCardValue: { fontSize: 24, fontWeight: '700', color: D.text },
  infoCardLabel: { fontSize: 12, fontWeight: '500', color: D.primary, lineHeight: 16 },

  // ── Seção ──
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 22, fontWeight: '600', color: D.text, marginBottom: 4 },
  sectionSub:   { fontSize: 12, color: D.textSub, marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  linkBtn: { fontSize: 14, fontWeight: '700', color: D.primary },

  // ── Grade de lotação ──
  crowdGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  crowdBtn: { flex: 1, minWidth: '44%', backgroundColor: D.bg, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 12, alignItems: 'center', borderWidth: 0.5, borderColor: D.border },
  crowdBtnActive: { backgroundColor: D.card2, borderColor: D.borderAccent },
  crowdBtnText: { fontSize: 14, fontWeight: '600', color: D.textSub },
  crowdBtnTextActive: { fontWeight: '700', color: D.primary },

  // ── Campos de edição ──
  editCampo: { backgroundColor: D.card2, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: D.border },
  editLabel: { fontSize: 11, fontWeight: '700', color: D.textSub, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  editAtual: { fontSize: 12, color: D.textSub, marginBottom: 10 },
  editInput: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: D.text, borderWidth: 1, borderColor: D.border },
  salvarBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: D.primary, borderRadius: 12, paddingVertical: 12, marginBottom: 10 },
  salvarBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  encerrarBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: D.primary + '18', borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: D.primary + '55' },
  encerrarBtnText: { color: D.primary, fontWeight: '700', fontSize: 14 },

  // ── Notificações ──
  notifCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: D.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: D.border },
  notifIconBg: { width: 36, height: 36, borderRadius: 8, backgroundColor: D.primaryLight + '33', justifyContent: 'center', alignItems: 'center' },
  notifTitle: { fontSize: 15, fontWeight: '700', color: D.text, marginBottom: 2 },
  notifMsg: { fontSize: 12, color: D.textSub, lineHeight: 17 },

  // ── Cupons ──
  couponRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: D.card2, borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 0.5, borderColor: D.border },
  couponIconWrap: { width: 36, height: 36, borderRadius: 8, backgroundColor: D.primary + '22', justifyContent: 'center', alignItems: 'center' },
  couponTitle: { fontSize: 14, fontWeight: '700', color: D.text, marginBottom: 4 },
  couponQty: { fontSize: 11, color: D.textSub, marginBottom: 6 },
  couponBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  couponBarFill: { height: '100%', backgroundColor: D.primary, borderRadius: 2 },
  vazioCard: { backgroundColor: D.card2, borderRadius: 12, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: D.border, borderStyle: 'dashed' },
  vazioTitle: { fontSize: 15, fontWeight: '700', color: D.text, marginBottom: 4 },
  vazioSub: { fontSize: 13, color: D.textSub, textAlign: 'center' },

  // ── Avaliações ──
  reviewCard: { backgroundColor: D.card, borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 0.5, borderColor: D.border, gap: 10 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewUser: { fontSize: 15, fontWeight: '700', color: D.text },
  reviewRating: { fontSize: 14, fontWeight: '600', color: D.primary },
  reviewText: { fontSize: 14, color: D.textSub, lineHeight: 20, fontStyle: 'italic' },

  // ── Card promocional ──
  promoCard: { marginHorizontal: 16, marginBottom: 8, borderRadius: 16, overflow: 'hidden', minHeight: 180, borderWidth: 0.5, borderColor: D.primary + '44' },
  promoContent: { padding: 28, gap: 12 },
  promoTitle: { fontSize: 28, fontWeight: '700', color: '#fff', lineHeight: 34 },
  promoSub: { fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 22 },
  promoBtn: { backgroundColor: '#fff', alignSelf: 'flex-start', paddingHorizontal: 28, paddingVertical: 12, borderRadius: RADIUS.full, marginTop: 6 },
  promoBtnText: { fontSize: 14, fontWeight: '700', color: D.primary },
});

// ── Estilos do modal de planos ────────────────────────────────────────────────
const pm = StyleSheet.create({
  // overlay e sheet base
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'flex-end' },
  sheet:       { backgroundColor: COLORS.bgCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 8, maxHeight: '92%' },
  handle:      { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, marginBottom: 16 },

  // cabeçalho
  sheetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  sheetTitle:  { fontSize: 18, fontWeight: '800', color: COLORS.text },
  sheetSub:    { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  closeBtn:    { padding: 4, marginLeft: 8 },
  backBtn:     { padding: 4 },

  // ── Cards de plano ──
  planCard: {
    backgroundColor: COLORS.bgElevated, borderRadius: 16, padding: 18,
    marginBottom: 14, borderWidth: 1.5, borderColor: COLORS.border,
  },
  planCardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  popularBadge:   { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, marginBottom: 10 },
  popularBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  planName:     { fontSize: 20, fontWeight: '900', marginBottom: 4 },
  boostRow:     { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  boostMult:    { fontSize: 32, fontWeight: '900', lineHeight: 36 },
  boostSuffix:  { fontSize: 13, color: COLORS.textSub, fontWeight: '600' },
  planPrice:    { fontSize: 26, fontWeight: '900', lineHeight: 28 },
  planPeriod:   { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  featuresList: { gap: 8, marginBottom: 16 },
  featureRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText:  { fontSize: 13, color: COLORS.textSub, flex: 1 },
  planBtn:      { borderRadius: 12, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  planBtnText:  { fontSize: 15, fontWeight: '800', color: '#fff' },

  // ── Seletor de método ──
  methodRow:    { flexDirection: 'row', gap: 10, marginBottom: 18 },
  methodBtn:    { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.bgElevated, gap: 3 },
  methodIcon:   { fontSize: 20 },
  methodLabel:  { fontSize: 12, fontWeight: '600', color: COLORS.textSub },

  // ── Conteúdo de pagamento ──
  payContent:   { gap: 12, marginBottom: 16 },

  // PIX
  pixQR:        { backgroundColor: COLORS.bgElevated, borderRadius: 16, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, gap: 6 },
  pixQRLabel:   { fontSize: 15, fontWeight: '700', color: COLORS.text },
  pixQRSub:     { fontSize: 11, color: COLORS.textMuted },
  pixKeyBox:    { backgroundColor: COLORS.bg, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.border, gap: 4 },
  pixKeyLabel:  { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  pixKeyValue:  { fontSize: 15, fontWeight: '700', color: COLORS.text },
  pixKeyHint:   { fontSize: 11, color: COLORS.textMuted },

  // Cartão
  cardPreview:  { backgroundColor: '#1c1028', borderRadius: 14, padding: 18, borderWidth: 1, gap: 10 },
  cardPreviewChip: { fontSize: 20 },
  cardPreviewNum:  { fontSize: 18, fontWeight: '700', color: '#fff', letterSpacing: 2 },
  cardPreviewName: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  cardPreviewExp:  { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  payInput:     { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.text },

  // Boleto
  boletoBox:    { backgroundColor: COLORS.bgElevated, borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, gap: 6 },
  boletoTitle:  { fontSize: 16, fontWeight: '800', color: COLORS.text },
  boletoBarcode:{ fontSize: 11, color: COLORS.textSub, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', lineHeight: 18, marginVertical: 6 },
  boletoHint:   { fontSize: 12, color: COLORS.warning ?? '#F59E0B' },

  // Total
  totalRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: COLORS.border },
  totalLabel:   { fontSize: 14, fontWeight: '600', color: COLORS.textSub },
  totalValue:   { fontSize: 22, fontWeight: '900' },

  // Botão pagar
  payBtn:       { borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  payBtnText:   { fontSize: 15, fontWeight: '800', color: '#fff' },

  // ── Tela de sucesso ──
  successContent:    { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 16, gap: 12 },
  successIconCircle: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', borderWidth: 2, marginBottom: 8 },
  successTitle:      { fontSize: 24, fontWeight: '900', color: COLORS.text, textAlign: 'center' },
  successPlan:       { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  successMsg:        { fontSize: 14, color: COLORS.textSub, textAlign: 'center', lineHeight: 21, marginBottom: 8 },
  successBtn:        { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, marginTop: 4 },
  successBtnText:    { fontSize: 16, fontWeight: '800', color: '#fff' },
});

// ── Estilos do modal de perfil ────────────────────────────────────────────────
const bp = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sheet: { backgroundColor: COLORS.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36, ...SHADOW.md },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  sheetTitle: { fontSize: 17, fontWeight: "800", color: COLORS.text },
  avatarPreview: { alignSelf: "center", width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary + "33", borderWidth: 2, borderColor: COLORS.primary, justifyContent: "center", alignItems: "center", marginBottom: 24 },
  avatarPreviewText: { fontSize: 26, fontWeight: "900", color: COLORS.primary },
  label: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 6 },
  input: { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.text, marginBottom: 16 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 20 },
  sectionLabel: { fontSize: 14, fontWeight: "800", color: COLORS.text, marginBottom: 2 },
  sectionHint: { fontSize: 12, color: COLORS.textMuted, marginBottom: 14 },
  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, marginBottom: 0, overflow: "hidden" },
  eyeBtn: { paddingHorizontal: 12, paddingVertical: 12 },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 14, alignItems: "center", marginTop: 20 },
  saveBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },
});
