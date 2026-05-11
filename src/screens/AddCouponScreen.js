import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

const COUPON_TYPES = [
  { key: 'bebida', icon: '🥃', label: 'Free Shot', color: '#E83B5C' },
  { key: 'comida', icon: '🍕', label: 'Comida Grátis', color: '#D85A30' },
  { key: 'desconto', icon: '🎟', label: 'Desconto', color: '#F59E0B' },
  { key: 'experiencia', icon: '⭐', label: 'Experiência VIP', color: '#7B2FBE' },
  { key: 'brinde', icon: '🎁', label: 'Brinde', color: '#059669' },
  { key: 'acesso', icon: '🚪', label: 'Acesso Especial', color: '#0C447C' },
];

const EXPIRY_OPTIONS = [
  { key: null, label: 'Sem validade' },
  { key: '00:00', label: 'Meia-noite' },
  { key: '01:00', label: '01:00' },
  { key: '02:00', label: '02:00' },
  { key: '22:00', label: '22:00' },
  { key: '23:00', label: '23:00' },
];

export default function AddCouponScreen({ navigation }) {
  const { addCoupon, businessStats } = useApp();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [conditions, setConditions] = useState('');
  const [qty, setQty] = useState('50');
  const [expiresAt, setExpiresAt] = useState(null);

  function handleNext() {
    if (step === 1 && !selectedType) { Alert.alert('Selecione um tipo de cupom'); return; }
    if (step === 2) {
      if (!title.trim()) { Alert.alert('Adicione um título'); return; }
      if (!description.trim()) { Alert.alert('Adicione uma descrição'); return; }
      if (!qty || parseInt(qty) < 1) { Alert.alert('Quantidade inválida'); return; }
    }
    if (step < 3) setStep(step + 1);
  }

  function handleSubmit() {
    const typeInfo = COUPON_TYPES.find(t => t.key === selectedType);
    addCoupon({
      eventId: businessStats.activeEventId,
      eventName: businessStats.activeEventName,
      venue: businessStats.venueName,
      type: selectedType,
      typeLabel: typeInfo.label,
      icon: typeInfo.icon,
      title: title.trim(),
      description: description.trim(),
      conditions: conditions.trim() || 'Válido apenas hoje. Um por pessoa.',
      expiresAt,
      totalQty: parseInt(qty),
      timerSeconds: 0,
      gradient: [typeInfo.color, typeInfo.color + '88'],
      highlightColor: typeInfo.color,
    });
    Alert.alert('🎉 Cupom publicado!', `"${title}" foi enviado para usuários próximos!`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]);
  }

  const typeInfo = COUPON_TYPES.find(t => t.key === selectedType);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Criar Cupom</Text>
        <View style={s.stepBadge}>
          <Text style={s.stepBadgeText}>{step}/3</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${(step / 3) * 100}%` }]} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* STEP 1 — Type */}
          {step === 1 && (
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>Que tipo de cupom?</Text>
              <Text style={s.stepSub}>Escolha o que você quer oferecer</Text>
              <View style={s.typesGrid}>
                {COUPON_TYPES.map(t => (
                  <TouchableOpacity key={t.key}
                    style={[s.typeCard, selectedType === t.key && { borderColor: t.color, backgroundColor: t.color + '18' }]}
                    onPress={() => setSelectedType(t.key)}>
                    <View style={[s.typeIconCircle, { backgroundColor: t.color + '33' }]}>
                      <Text style={s.typeIcon}>{t.icon}</Text>
                    </View>
                    <Text style={[s.typeLabel, selectedType === t.key && { color: t.color }]}>{t.label}</Text>
                    {selectedType === t.key && (
                      <View style={[s.typeCheck, { backgroundColor: t.color }]}>
                        <Ionicons name="checkmark" size={11} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* STEP 2 — Details */}
          {step === 2 && typeInfo && (
            <View style={s.stepContent}>
              <View style={[s.typePreviewRow, { backgroundColor: typeInfo.color + '22', borderColor: typeInfo.color + '55' }]}>
                <Text style={{ fontSize: 28, marginRight: 10 }}>{typeInfo.icon}</Text>
                <Text style={[s.typePreviewLabel, { color: typeInfo.color }]}>{typeInfo.label}</Text>
              </View>

              <Text style={s.fieldLabel}>Título *</Text>
              <TextInput style={s.input} placeholder="Ex: Free Shot para Vibbers Gold" placeholderTextColor={COLORS.textMuted} value={title} onChangeText={setTitle} maxLength={60} />
              <Text style={s.charCount}>{title.length}/60</Text>

              <Text style={s.fieldLabel}>Descrição *</Text>
              <TextInput style={[s.input, s.inputMulti]} placeholder="Descreva o que o cliente vai receber..." placeholderTextColor={COLORS.textMuted} value={description} onChangeText={setDescription} multiline maxLength={200} />
              <Text style={s.charCount}>{description.length}/200</Text>

              <Text style={s.fieldLabel}>Condições (opcional)</Text>
              <TextInput style={s.input} placeholder="Ex: Válido 1 por CPF. Não cumulativo." placeholderTextColor={COLORS.textMuted} value={conditions} onChangeText={setConditions} maxLength={150} />

              <Text style={s.fieldLabel}>Quantidade *</Text>
              <View style={s.qtyRow}>
                <TouchableOpacity style={s.qtyBtn} onPress={() => setQty(q => String(Math.max(1, parseInt(q || '1') - 5)))}>
                  <Text style={s.qtyBtnText}>−5</Text>
                </TouchableOpacity>
                <TextInput style={s.qtyInput} value={qty} onChangeText={setQty} keyboardType="number-pad" maxLength={4} />
                <TouchableOpacity style={s.qtyBtn} onPress={() => setQty(q => String(parseInt(q || '0') + 5))}>
                  <Text style={s.qtyBtnText}>+5</Text>
                </TouchableOpacity>
              </View>

              <Text style={s.fieldLabel}>Validade</Text>
              <View style={s.expiryGrid}>
                {EXPIRY_OPTIONS.map(opt => (
                  <TouchableOpacity key={String(opt.key)}
                    style={[s.expiryBtn, expiresAt === opt.key && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}
                    onPress={() => setExpiresAt(opt.key)}>
                    <Text style={[s.expiryText, expiresAt === opt.key && { color: '#fff' }]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* STEP 3 — Preview & confirm */}
          {step === 3 && typeInfo && (
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>Confirme o cupom</Text>
              <Text style={s.stepSub}>É assim que os usuários vão ver</Text>

              {/* Preview */}
              <View style={s.previewCard}>
                <View style={[s.previewBand, { backgroundColor: typeInfo.color }]}>
                  <Text style={{ fontSize: 26, marginRight: 10 }}>{typeInfo.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 }}>{typeInfo.label}</Text>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: '#fff' }}>{title}</Text>
                  </View>
                  <View style={{ alignItems: 'center', gap: 4 }}>
                    <View style={s.previewNearbyDot} />
                    <Text style={{ fontSize: 9, color: '#fff' }}>Perto</Text>
                  </View>
                </View>
                <View style={s.previewBody}>
                  <Text style={{ fontSize: 13, color: COLORS.textSub, marginBottom: 8, lineHeight: 18 }}>{description}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 11, color: COLORS.textMuted }}>📍 {businessStats.venueName}</Text>
                    {expiresAt && <Text style={{ fontSize: 11, color: COLORS.textMuted }}>⏱ Até {expiresAt}</Text>}
                  </View>
                  <Text style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 5 }}>{qty}/{qty} disponíveis</Text>
                  <View style={s.previewProgress}>
                    <View style={[s.previewProgressFill, { backgroundColor: typeInfo.color, width: '100%' }]} />
                  </View>
                  <View style={s.previewCTA}>
                    <Text style={[s.previewCTAText, { color: typeInfo.color }]}>🎯 Você está no local — Resgatar →</Text>
                  </View>
                </View>
              </View>

              {/* Notification info */}
              <View style={s.notifCard}>
                <Ionicons name="notifications" size={18} color={COLORS.primary} />
                <Text style={s.notifText}>Usuários próximos serão notificados instantaneamente após a publicação.</Text>
              </View>

              {/* Summary */}
              <View style={s.summaryCard}>
                {[
                  ['Tipo', `${typeInfo.icon} ${typeInfo.label}`],
                  ['Título', title],
                  ['Quantidade', `${qty} unidades`],
                  ['Validade', expiresAt || 'Sem limite'],
                  ['Evento', businessStats.activeEventName],
                ].map(([label, val]) => (
                  <View key={label} style={s.summaryRow}>
                    <Text style={s.summaryLabel}>{label}</Text>
                    <Text style={s.summaryValue} numberOfLines={1}>{val}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>

        <View style={s.bottomBar}>
          {step < 3
            ? <TouchableOpacity style={s.nextBtn} onPress={handleNext}>
                <Text style={s.nextBtnText}>Continuar →</Text>
              </TouchableOpacity>
            : <TouchableOpacity style={s.publishBtn} onPress={handleSubmit}>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={s.publishBtnText}>Publicar cupom agora</Text>
              </TouchableOpacity>
          }
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 14, gap: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.bgCard, justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: COLORS.border },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.text },
  stepBadge: { backgroundColor: COLORS.primary + '22', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, borderWidth: 0.5, borderColor: COLORS.primary + '55' },
  stepBadgeText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  progressBar: { height: 3, backgroundColor: COLORS.bgOverlay },
  progressFill: { height: '100%', backgroundColor: COLORS.primary },
  stepContent: { padding: 16 },
  stepTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  stepSub: { fontSize: 14, color: COLORS.textSub, marginBottom: 18 },
  typesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeCard: { width: '47%', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl, padding: 14, borderWidth: 1.5, borderColor: COLORS.border, position: 'relative' },
  typeIconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  typeIcon: { fontSize: 24 },
  typeLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  typeCheck: { position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  typePreviewRow: { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.lg, padding: 14, marginBottom: 16, borderWidth: 1.5 },
  typePreviewLabel: { fontSize: 15, fontWeight: '800' },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSub, marginBottom: 8, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: 13, fontSize: 14, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: COLORS.textMuted, textAlign: 'right', marginTop: 4 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { width: 52, height: 48, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  qtyInput: { flex: 1, height: 48, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, textAlign: 'center', fontSize: 20, fontWeight: '800', color: COLORS.text },
  expiryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  expiryBtn: { paddingHorizontal: 14, paddingVertical: 9, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  expiryText: { fontSize: 13, color: COLORS.text },
  previewCard: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 0.5, borderColor: COLORS.border, marginBottom: 14 },
  previewBand: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14 },
  previewNearbyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' },
  previewBody: { padding: 14 },
  previewProgress: { height: 4, backgroundColor: COLORS.bgOverlay, borderRadius: 2, overflow: 'hidden', marginBottom: 10 },
  previewProgressFill: { height: '100%', borderRadius: 2 },
  previewCTA: { paddingTop: 10, borderTopWidth: 0.5, borderTopColor: COLORS.border },
  previewCTAText: { fontSize: 13, fontWeight: '700' },
  notifCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: COLORS.primary + '18', borderRadius: RADIUS.lg, padding: 14, marginBottom: 14, borderWidth: 0.5, borderColor: COLORS.primary + '44' },
  notifText: { flex: 1, fontSize: 13, color: COLORS.primaryLight, lineHeight: 18 },
  summaryCard: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 0.5, borderColor: COLORS.border, overflow: 'hidden' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 13, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  summaryLabel: { fontSize: 13, color: COLORS.textSub },
  summaryValue: { fontSize: 13, fontWeight: '700', color: COLORS.text, flex: 1, textAlign: 'right' },
  bottomBar: { padding: 14, backgroundColor: COLORS.bgCard, borderTopWidth: 0.5, borderTopColor: COLORS.border },
  nextBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingVertical: 16, alignItems: 'center', ...SHADOW.glow },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  publishBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingVertical: 16, ...SHADOW.glow },
  publishBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
