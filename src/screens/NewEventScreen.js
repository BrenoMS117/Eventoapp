import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

const CATEGORIES = [
  { key: 'show', label: 'Show', icon: '🎸' },
  { key: 'festa', label: 'Festa', icon: '🎉' },
  { key: 'bar', label: 'Bar', icon: '🍺' },
  { key: 'cultura', label: 'Cultura', icon: '🎨' },
  { key: 'teatro', label: 'Teatro', icon: '🎭' },
  { key: 'esporte', label: 'Esporte', icon: '⚽' },
  { key: 'gastronomia', label: 'Gastro', icon: '🍕' },
  { key: 'musica', label: 'Música', icon: '🎵' },
];

const STEPS = ['Básico', 'Local', 'Detalhes', 'Revisar'];

export default function NewEventScreen({ navigation }) {
  const { addEvent, currentUser } = useApp();
  const [step, setStep] = useState(0);

  // Step 0 - Basic info
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Step 1 - Location
  const [venue, setVenue] = useState(currentUser?.venueName || '');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('São Paulo');

  // Step 2 - Details
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [freeEntry, setFreeEntry] = useState(false);
  const [accessible, setAccessible] = useState(false);
  const [accessibilityNotes, setAccessibilityNotes] = useState('');
  const [artist, setArtist] = useState('');
  const [ageRestriction, setAgeRestriction] = useState('');

  const AGE_OPTIONS = ['Livre', '14+', '16+', '18+'];

  const GRADIENTS = [
    { colors: ['#1D9E75', '#085041'], label: 'Verde' },
    { colors: ['#533AB7', '#26215C'], label: 'Roxo' },
    { colors: ['#D85A30', '#4A1B0C'], label: 'Laranja' },
    { colors: ['#378ADD', '#0C447C'], label: 'Azul' },
    { colors: ['#C0392B', '#7B241C'], label: 'Vermelho' },
    { colors: ['#8E44AD', '#5B2C6F'], label: 'Violeta' },
  ];
  const [selectedGradient, setSelectedGradient] = useState(0);

  function validateStep() {
    if (step === 0) {
      if (!name.trim()) { Alert.alert('Campo obrigatório', 'Informe o nome do evento.'); return false; }
      if (!category) { Alert.alert('Campo obrigatório', 'Selecione uma categoria.'); return false; }
      if (!date.trim()) { Alert.alert('Campo obrigatório', 'Informe a data do evento.'); return false; }
      if (!startTime.trim()) { Alert.alert('Campo obrigatório', 'Informe o horário de início.'); return false; }
    }
    if (step === 1) {
      if (!address.trim()) { Alert.alert('Campo obrigatório', 'Informe o endereço.'); return false; }
    }
    return true;
  }

  function handleNext() {
    if (!validateStep()) return;
    if (step < 3) setStep(s => s + 1);
  }

  function handleSubmit() {
    const catInfo = CATEGORIES.find(c => c.key === category);
    const newEvent = {
      name: name.trim(),
      venue: venue.trim() || currentUser?.venueName || 'Meu estabelecimento',
      address: `${address.trim()}${neighborhood ? ` - ${neighborhood.trim()}` : ''}`,
      category,
      categoryLabel: catInfo?.label || category,
      startsAt: startTime,
      endsAt: endTime || null,
      price: freeEntry ? 'Gratuito' : price.trim() || 'A confirmar',
      accessible,
      accessibilityNotes: accessible ? accessibilityNotes.trim() : null,
      nowPlaying: null,
      nextAct: artist.trim() || null,
      description: description.trim(),
      distanceKm: 0.5,
      gradient: GRADIENTS[selectedGradient].colors,
      ageRestriction: ageRestriction || 'Livre',
    };

    addEvent(newEvent);
    Alert.alert(
      '🎉 Evento criado!',
      `"${name}" foi publicado com sucesso. Usuários próximos já podem visualizá-lo!`,
      [{ text: 'Ótimo!', onPress: () => navigation.goBack() }]
    );
  }

  const catInfo = CATEGORIES.find(c => c.key === category);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 0 ? setStep(s => s - 1) : navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo evento</Text>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>{step + 1}/{STEPS.length}</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((step + 1) / STEPS.length) * 100}%` }]} />
      </View>

      {/* Step tabs */}
      <View style={styles.stepTabs}>
        {STEPS.map((s, i) => (
          <View key={s} style={styles.stepTab}>
            <View style={[styles.stepDot, i <= step && styles.stepDotActive, i < step && styles.stepDotDone]}>
              {i < step
                ? <Ionicons name="checkmark" size={10} color="#fff" />
                : <Text style={[styles.stepDotText, i === step && { color: '#fff' }]}>{i + 1}</Text>
              }
            </View>
            <Text style={[styles.stepLabel, i === step && { color: COLORS.primary, fontWeight: '600' }]}>{s}</Text>
          </View>
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* STEP 0 - Basic */}
          {step === 0 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Informações básicas</Text>

              <Text style={styles.fieldLabel}>Nome do evento *</Text>
              <TextInput style={styles.input} placeholder="Ex: Jazz no Beco do Batman" placeholderTextColor={COLORS.textMuted} value={name} onChangeText={setName} maxLength={60} />
              <Text style={styles.charCount}>{name.length}/60</Text>

              <Text style={styles.fieldLabel}>Categoria *</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.categoryBtn, category === cat.key && styles.categoryBtnActive]}
                    onPress={() => setCategory(cat.key)}
                  >
                    <Text style={styles.categoryBtnIcon}>{cat.icon}</Text>
                    <Text style={[styles.categoryBtnLabel, category === cat.key && { color: COLORS.primary, fontWeight: '600' }]}>{cat.label}</Text>
                    {category === cat.key && <View style={styles.categoryCheck}><Ionicons name="checkmark" size={8} color="#fff" /></View>}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Data *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="calendar-outline" size={17} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput style={styles.inputInner} placeholder="Ex: 15/06/2025" placeholderTextColor={COLORS.textMuted} value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" />
              </View>

              <View style={styles.timeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Início *</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="time-outline" size={17} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput style={styles.inputInner} placeholder="20:00" placeholderTextColor={COLORS.textMuted} value={startTime} onChangeText={setStartTime} keyboardType="numbers-and-punctuation" />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Término</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="time-outline" size={17} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput style={styles.inputInner} placeholder="02:00" placeholderTextColor={COLORS.textMuted} value={endTime} onChangeText={setEndTime} keyboardType="numbers-and-punctuation" />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* STEP 1 - Location */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Local do evento</Text>

              <Text style={styles.fieldLabel}>Nome do local</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="business-outline" size={17} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput style={styles.inputInner} placeholder="Nome do bar/venue" placeholderTextColor={COLORS.textMuted} value={venue} onChangeText={setVenue} />
              </View>

              <Text style={styles.fieldLabel}>Endereço *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="location-outline" size={17} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput style={styles.inputInner} placeholder="Rua, número" placeholderTextColor={COLORS.textMuted} value={address} onChangeText={setAddress} />
              </View>

              <Text style={styles.fieldLabel}>Bairro</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="map-outline" size={17} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput style={styles.inputInner} placeholder="Ex: Vila Madalena" placeholderTextColor={COLORS.textMuted} value={neighborhood} onChangeText={setNeighborhood} />
              </View>

              <Text style={styles.fieldLabel}>Cidade</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="pin-outline" size={17} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput style={styles.inputInner} placeholder="São Paulo" placeholderTextColor={COLORS.textMuted} value={city} onChangeText={setCity} />
              </View>
            </View>
          )}

          {/* STEP 2 - Details */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Detalhes do evento</Text>

              <Text style={styles.fieldLabel}>Descrição</Text>
              <TextInput
                style={[styles.input, styles.inputMulti]}
                placeholder="Descreva o evento, o que vai acontecer, atrações..."
                placeholderTextColor={COLORS.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={300}
              />
              <Text style={styles.charCount}>{description.length}/300</Text>

              <Text style={styles.fieldLabel}>Artista / Atração principal</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="musical-notes-outline" size={17} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput style={styles.inputInner} placeholder="Ex: DJ Alok, Banda X..." placeholderTextColor={COLORS.textMuted} value={artist} onChangeText={setArtist} />
              </View>

              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchLabel}>Entrada gratuita</Text>
                  <Text style={styles.switchSub}>Sem cobrança de ingresso</Text>
                </View>
                <Switch value={freeEntry} onValueChange={setFreeEntry} trackColor={{ true: COLORS.primary }} thumbColor="#fff" />
              </View>

              {!freeEntry && (
                <>
                  <Text style={styles.fieldLabel}>Valor da entrada</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={[styles.inputIcon, { fontSize: 15, color: COLORS.textMuted }]}>R$</Text>
                    <TextInput style={styles.inputInner} placeholder="0,00" placeholderTextColor={COLORS.textMuted} value={price} onChangeText={setPrice} keyboardType="numeric" />
                  </View>
                </>
              )}

              <Text style={styles.fieldLabel}>Faixa etária</Text>
              <View style={styles.ageRow}>
                {AGE_OPTIONS.map(opt => (
                  <TouchableOpacity key={opt} style={[styles.ageBtn, ageRestriction === opt && styles.ageBtnActive]} onPress={() => setAgeRestriction(opt)}>
                    <Text style={[styles.ageBtnText, ageRestriction === opt && { color: '#fff' }]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchLabel}>♿ Acessível</Text>
                  <Text style={styles.switchSub}>Rampa, banheiro adaptado etc.</Text>
                </View>
                <Switch value={accessible} onValueChange={setAccessible} trackColor={{ true: COLORS.primary }} thumbColor="#fff" />
              </View>

              {accessible && (
                <>
                  <Text style={styles.fieldLabel}>Detalhes de acessibilidade</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="accessibility-outline" size={17} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput style={styles.inputInner} placeholder="Ex: Rampa lateral + banheiro adaptado" placeholderTextColor={COLORS.textMuted} value={accessibilityNotes} onChangeText={setAccessibilityNotes} />
                  </View>
                </>
              )}

              <Text style={styles.fieldLabel}>Cor do card</Text>
              <View style={styles.gradientRow}>
                {GRADIENTS.map((g, i) => (
                  <TouchableOpacity key={i} style={[styles.gradientDot, { backgroundColor: g.colors[0] }, selectedGradient === i && styles.gradientDotActive]} onPress={() => setSelectedGradient(i)}>
                    {selectedGradient === i && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* STEP 3 - Review */}
          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Revisar e publicar</Text>

              {/* Preview card */}
              <View style={styles.previewCard}>
                <View style={[styles.previewBanner, { backgroundColor: GRADIENTS[selectedGradient].colors[0] }]}>
                  <Text style={styles.previewBannerDate}>📅 {date} às {startTime}{endTime ? ` — ${endTime}` : ''}</Text>
                  <Text style={styles.previewBannerCat}>{catInfo?.icon} {catInfo?.label}</Text>
                </View>
                <View style={styles.previewBody}>
                  <Text style={styles.previewName}>{name || 'Nome do evento'}</Text>
                  <Text style={styles.previewVenue}>📍 {venue || 'Local'}{neighborhood ? ` · ${neighborhood}` : ''}</Text>
                  {description ? <Text style={styles.previewDesc} numberOfLines={3}>{description}</Text> : null}
                  <View style={styles.previewPills}>
                    <View style={styles.previewPill}><Text style={styles.previewPillText}>{freeEntry ? '🎟 Gratuito' : `🎟 ${price || 'A confirmar'}`}</Text></View>
                    {accessible && <View style={[styles.previewPill, { backgroundColor: COLORS.primaryLight }]}><Text style={[styles.previewPillText, { color: COLORS.primaryDark }]}>♿ Acessível</Text></View>}
                    {ageRestriction && <View style={styles.previewPill}><Text style={styles.previewPillText}>🔞 {ageRestriction}</Text></View>}
                    {artist && <View style={[styles.previewPill, { backgroundColor: COLORS.purpleLight }]}><Text style={[styles.previewPillText, { color: COLORS.purple }]}>🎤 {artist}</Text></View>}
                  </View>
                </View>
              </View>

              {/* Summary */}
              <View style={styles.summaryCard}>
                {[
                  { label: 'Evento', value: name },
                  { label: 'Categoria', value: `${catInfo?.icon} ${catInfo?.label}` },
                  { label: 'Data', value: date },
                  { label: 'Horário', value: `${startTime}${endTime ? ` – ${endTime}` : ''}` },
                  { label: 'Local', value: `${address}${neighborhood ? `, ${neighborhood}` : ''}` },
                  { label: 'Entrada', value: freeEntry ? 'Gratuito' : price || 'A confirmar' },
                  { label: 'Faixa etária', value: ageRestriction || 'Livre' },
                  { label: 'Acessível', value: accessible ? `Sim${accessibilityNotes ? ` — ${accessibilityNotes}` : ''}` : 'Não' },
                ].map(row => (
                  <View key={row.label} style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{row.label}</Text>
                    <Text style={styles.summaryValue} numberOfLines={2}>{row.value || '—'}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.notifInfo}>
                <Ionicons name="notifications" size={18} color={COLORS.primary} />
                <Text style={styles.notifText}>Usuários próximos serão notificados assim que o evento for publicado.</Text>
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
              <Ionicons name="rocket-outline" size={18} color="#fff" />
              <Text style={styles.publishBtnText}>Publicar evento agora</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primaryDark, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 14 },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, marginLeft: 10, fontSize: 17, fontWeight: '600', color: '#fff' },
  stepBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  stepBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  progressBar: { height: 3, backgroundColor: COLORS.border },
  progressFill: { height: '100%', backgroundColor: COLORS.primary },
  stepTabs: { flexDirection: 'row', backgroundColor: COLORS.surface, paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  stepTab: { flex: 1, alignItems: 'center', gap: 4 },
  stepDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  stepDotActive: { backgroundColor: COLORS.primary },
  stepDotDone: { backgroundColor: COLORS.success },
  stepDotText: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted },
  stepLabel: { fontSize: 10, color: COLORS.textMuted },
  scroll: { flex: 1 },
  stepContent: { padding: 16 },
  stepTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 18 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 12, fontSize: 14, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
  inputMulti: { minHeight: 90, textAlignVertical: 'top' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, height: 50 },
  inputIcon: { marginRight: 8 },
  inputInner: { flex: 1, fontSize: 14, color: COLORS.text },
  charCount: { fontSize: 11, color: COLORS.textMuted, textAlign: 'right', marginTop: 4 },
  timeRow: { flexDirection: 'row', gap: 10 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryBtn: { width: '22%', aspectRatio: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: COLORS.border, position: 'relative' },
  categoryBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight + '88' },
  categoryBtnIcon: { fontSize: 22 },
  categoryBtnLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: 3 },
  categoryCheck: { position: 'absolute', top: 3, right: 3, width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 14, marginTop: 10, borderWidth: 1, borderColor: COLORS.border },
  switchLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  switchSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  ageRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  ageBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border },
  ageBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  ageBtnText: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  gradientRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  gradientDot: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  gradientDotActive: { borderWidth: 3, borderColor: COLORS.text },
  previewCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 0.5, borderColor: COLORS.border, marginBottom: 14, ...SHADOW.md },
  previewBanner: { padding: 14 },
  previewBannerDate: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: 4 },
  previewBannerCat: { fontSize: 13, color: '#fff', fontWeight: '600' },
  previewBody: { padding: 14 },
  previewName: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  previewVenue: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 },
  previewDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 10 },
  previewPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  previewPill: { backgroundColor: COLORS.surfaceAlt, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  previewPillText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
  summaryCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 0.5, borderColor: COLORS.border, overflow: 'hidden', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 12, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  summaryLabel: { fontSize: 13, color: COLORS.textSecondary, flex: 0.4 },
  summaryValue: { fontSize: 13, fontWeight: '600', color: COLORS.text, flex: 0.6, textAlign: 'right' },
  notifInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.md, padding: 12 },
  notifText: { flex: 1, fontSize: 13, color: COLORS.primaryDark, lineHeight: 18 },
  bottomBar: { padding: 14, backgroundColor: COLORS.surface, borderTopWidth: 0.5, borderTopColor: COLORS.border },
  nextBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 15, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  publishBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
  publishBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});