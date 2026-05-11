import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';
import { validate } from '../utils/validation';

const CATEGORIES = [
  { key: 'rave', label: 'Rave', icon: '🎧' },
  { key: 'concert', label: 'Concert', icon: '🎸' },
  { key: 'festival', label: 'Festival', icon: '🎪' },
  { key: 'art', label: 'Art Basel', icon: '🎨' },
  { key: 'electro', label: 'Electro', icon: '⚡' },
  { key: 'bar', label: 'Bar', icon: '🍺' },
  { key: 'teatro', label: 'Teatro', icon: '🎭' },
  { key: 'cultura', label: 'Cultura', icon: '🏛' },
];

const GRADIENT_PRESETS = [
  { colors: ['#E83B5C', '#7B2FBE'], label: 'Brand' },
  { colors: ['#B8296E', '#26215C'], label: 'Purple' },
  { colors: ['#FF4500', '#E83B5C'], label: 'Fire' },
  { colors: ['#1E40AF', '#3B82F6'], label: 'Blue' },
  { colors: ['#059669', '#10B981'], label: 'Green' },
  { colors: ['#8E44AD', '#5B2C6F'], label: 'Violet' },
];

const AGE_OPTIONS = ['Livre', '14+', '16+', '18+'];
const STEPS = ['Básico', 'Local', 'Detalhes', 'Revisar'];

function StepIndicator({ current }) {
  return (
    <View style={s.stepRow}>
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const color = done ? COLORS.success : active ? COLORS.primary : COLORS.textMuted;
        return (
          <React.Fragment key={label}>
            <View style={s.stepItem}>
              <View style={[s.stepDot, { backgroundColor: done ? COLORS.success : active ? COLORS.primary : COLORS.bgOverlay, borderColor: color }]}>
                {done
                  ? <Ionicons name="checkmark" size={10} color="#fff" />
                  : <Text style={[s.stepDotNum, { color: active ? '#fff' : COLORS.textMuted }]}>{i + 1}</Text>}
              </View>
              <Text style={[s.stepLabel, { color }]}>{label}</Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={[s.stepLine, { backgroundColor: done ? COLORS.success : COLORS.bgOverlay }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function Field({ label, required, children, error, hint }) {
  return (
    <View style={s.fieldWrap}>
      {label ? (
        <View style={s.fieldLabelRow}>
          <Text style={s.fieldLabel}>
            {label}{required ? <Text style={{ color: COLORS.primary }}> *</Text> : ''}
          </Text>
          {hint ? <Text style={s.fieldHint}>{hint}</Text> : null}
        </View>
      ) : null}
      {children}
      {error ? (
        <View style={s.fieldError}>
          <Ionicons name="alert-circle" size={12} color={COLORS.danger} />
          <Text style={s.fieldErrorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

function TextBox({ error, ...props }) {
  return (
    <TextInput
      {...props}
      style={[s.input, error && s.inputError, props.multiline && s.inputMulti, props.style]}
      placeholderTextColor={COLORS.textMuted}
    />
  );
}

export default function NewEventScreen({ navigation }) {
  const { addEvent, currentUser } = useApp();
  const [step, setStep] = useState(0);

  // Step 0 — Basic
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Step 1 — Location
  const [venue, setVenue] = useState(currentUser?.venueName || '');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('São Paulo');

  // Step 2 — Details
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [freeEntry, setFreeEntry] = useState(false);
  const [accessible, setAccessible] = useState(false);
  const [accessibilityNotes, setAccessibilityNotes] = useState('');
  const [artist, setArtist] = useState('');
  const [ageRestriction, setAgeRestriction] = useState('Livre');
  const [gradientIdx, setGradientIdx] = useState(0);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  function getErr(f) { return touched[f] ? errors[f] : ''; }

  function setErr(f, val) {
    setTouched(p => ({ ...p, [f]: true }));
    setErrors(p => ({ ...p, [f]: getValidation(f, val) }));
  }

  function getValidation(f, v) {
    const vals = { name, category, date, startTime, endTime, address, price };
    const val = v !== undefined ? v : vals[f];
    if (f === 'name') return validate.minLength(val, 3, 'Nome do evento');
    if (f === 'category') return val ? '' : 'Selecione uma categoria.';
    if (f === 'date') return validate.date(val);
    if (f === 'startTime') return validate.time(val);
    if (f === 'endTime') return val ? validate.time(val) : '';
    if (f === 'address') return validate.required(val, 'Endereço');
    if (f === 'price' && !freeEntry) return validate.required(val, 'Valor da entrada');
    return '';
  }

  function validateStep(s) {
    const fieldsByStep = {
      0: ['name', 'category', 'date', 'startTime', 'endTime'],
      1: ['address'],
      2: freeEntry ? [] : ['price'],
    };
    const fields = fieldsByStep[s] || [];
    const e = {};
    fields.forEach(f => { e[f] = getValidation(f); });
    setErrors(prev => ({ ...prev, ...e }));
    setTouched(prev => ({ ...prev, ...Object.fromEntries(fields.map(f => [f, true])) }));
    return !Object.values(e).some(Boolean);
  }

  function handleNext() {
    if (!validateStep(step)) return;
    setStep(s => s + 1);
  }

  function handleSubmit() {
    const catInfo = CATEGORIES.find(c => c.key === category);
    addEvent({
      name: name.trim(),
      venue: venue.trim() || currentUser?.venueName || 'Meu estabelecimento',
      address: `${address.trim()}${neighborhood ? ` - ${neighborhood.trim()}` : ''}`,
      category,
      categoryLabel: catInfo?.label || category,
      startsAt: startTime,
      endsAt: endTime || null,
      price: freeEntry ? 'Gratuito' : price.trim(),
      accessible,
      accessibilityNotes: accessible ? accessibilityNotes.trim() : null,
      nowPlaying: null,
      nextAct: artist.trim() || null,
      description: description.trim(),
      distanceKm: 0.5,
      gradient: GRADIENT_PRESETS[gradientIdx].colors,
      ageRestriction,
      vibeMeter: 50,
      vibeLabel: 'Moderate',
      heatLevel: null,
      capacityPct: 0,
    });
    Alert.alert('🚀 Evento publicado!',
      `"${name}" está no ar! Usuários próximos já podem visualizá-lo.`,
      [{ text: 'Ótimo!', onPress: () => navigation.goBack() }]
    );
  }

  const catInfo = CATEGORIES.find(c => c.key === category);
  const gradPreset = GRADIENT_PRESETS[gradientIdx];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => step > 0 ? setStep(s => s - 1) : navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Novo Evento</Text>
        <View style={s.stepBadge}>
          <Text style={s.stepBadgeText}>{step + 1}/{STEPS.length}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${((step + 1) / STEPS.length) * 100}%` }]} />
      </View>

      {/* Step indicators */}
      <View style={s.stepIndicatorWrap}>
        <StepIndicator current={step} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── STEP 0: Basic ── */}
          {step === 0 && (
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>Informações básicas</Text>

              <Field label="Nome do evento" required error={getErr('name')}>
                <TextBox
                  placeholder="Ex: FESTIVAL OF LIGHTS"
                  value={name}
                  onChangeText={v => { setName(v); setErr('name', v); }}
                  error={getErr('name')}
                  maxLength={60}
                  autoCapitalize="characters"
                />
                <Text style={s.charCount}>{name.length}/60</Text>
              </Field>

              <Field label="Categoria" required error={getErr('category')}>
                <View style={s.categoryGrid}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity key={cat.key}
                      style={[s.catBtn, category === cat.key && s.catBtnActive]}
                      onPress={() => { setCategory(cat.key); setErr('category', cat.key); }}>
                      <Text style={s.catBtnIcon}>{cat.icon}</Text>
                      <Text style={[s.catBtnLabel, category === cat.key && { color: COLORS.primary, fontWeight: '700' }]}>{cat.label}</Text>
                      {category === cat.key && (
                        <View style={s.catCheck}>
                          <Ionicons name="checkmark" size={8} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </Field>

              <Field label="Data" required error={getErr('date')} hint="DD/MM/AAAA">
                <View style={s.inputRow}>
                  <Ionicons name="calendar-outline" size={17} color={COLORS.textMuted} style={s.inputRowIcon} />
                  <TextInput style={[s.inputInner, getErr('date') && s.inputError]} placeholder="25/12/2025" placeholderTextColor={COLORS.textMuted} value={date} onChangeText={v => { setDate(v); setErr('date', v); }} keyboardType="numbers-and-punctuation" />
                </View>
              </Field>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Field label="Início" required error={getErr('startTime')} hint="HH:MM">
                    <View style={s.inputRow}>
                      <Ionicons name="time-outline" size={17} color={COLORS.textMuted} style={s.inputRowIcon} />
                      <TextInput style={[s.inputInner, getErr('startTime') && s.inputError]} placeholder="21:00" placeholderTextColor={COLORS.textMuted} value={startTime} onChangeText={v => { setStartTime(v); setErr('startTime', v); }} keyboardType="numbers-and-punctuation" />
                    </View>
                  </Field>
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Término" error={getErr('endTime')} hint="Opcional">
                    <View style={s.inputRow}>
                      <Ionicons name="time-outline" size={17} color={COLORS.textMuted} style={s.inputRowIcon} />
                      <TextInput style={[s.inputInner, getErr('endTime') && s.inputError]} placeholder="04:00" placeholderTextColor={COLORS.textMuted} value={endTime} onChangeText={v => { setEndTime(v); setErr('endTime', v); }} keyboardType="numbers-and-punctuation" />
                    </View>
                  </Field>
                </View>
              </View>
            </View>
          )}

          {/* ── STEP 1: Location ── */}
          {step === 1 && (
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>Local do evento</Text>

              <Field label="Nome do local">
                <View style={s.inputRow}>
                  <Ionicons name="business-outline" size={17} color={COLORS.textMuted} style={s.inputRowIcon} />
                  <TextInput style={s.inputInner} placeholder={currentUser?.venueName || 'Ex: Club D'} placeholderTextColor={COLORS.textMuted} value={venue} onChangeText={setVenue} autoCapitalize="words" />
                </View>
              </Field>

              <Field label="Endereço" required error={getErr('address')}>
                <View style={[s.inputRow, getErr('address') && s.inputRowError]}>
                  <Ionicons name="location-outline" size={17} color={COLORS.textMuted} style={s.inputRowIcon} />
                  <TextInput style={s.inputInner} placeholder="Rua, número" placeholderTextColor={COLORS.textMuted} value={address} onChangeText={v => { setAddress(v); setErr('address', v); }} autoCapitalize="words" />
                </View>
              </Field>

              <Field label="Bairro">
                <View style={s.inputRow}>
                  <Ionicons name="map-outline" size={17} color={COLORS.textMuted} style={s.inputRowIcon} />
                  <TextInput style={s.inputInner} placeholder="Ex: Vila Madalena" placeholderTextColor={COLORS.textMuted} value={neighborhood} onChangeText={setNeighborhood} autoCapitalize="words" />
                </View>
              </Field>

              <Field label="Cidade">
                <View style={s.inputRow}>
                  <Ionicons name="pin-outline" size={17} color={COLORS.textMuted} style={s.inputRowIcon} />
                  <TextInput style={s.inputInner} placeholder="São Paulo" placeholderTextColor={COLORS.textMuted} value={city} onChangeText={setCity} autoCapitalize="words" />
                </View>
              </Field>
            </View>
          )}

          {/* ── STEP 2: Details ── */}
          {step === 2 && (
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>Detalhes do evento</Text>

              <Field label="Descrição" hint={`${description.length}/300`}>
                <TextBox
                  placeholder="Descreva o evento, atrações, ambiente..."
                  value={description} onChangeText={setDescription}
                  multiline maxLength={300}
                />
              </Field>

              <Field label="Artista / Atração principal">
                <View style={s.inputRow}>
                  <Ionicons name="musical-notes-outline" size={17} color={COLORS.textMuted} style={s.inputRowIcon} />
                  <TextInput style={s.inputInner} placeholder="Ex: DJ Alok, Banda X..." placeholderTextColor={COLORS.textMuted} value={artist} onChangeText={setArtist} autoCapitalize="words" />
                </View>
              </Field>

              <View style={s.switchCard}>
                <View>
                  <Text style={s.switchLabel}>Entrada gratuita</Text>
                  <Text style={s.switchSub}>Sem cobrança de ingresso</Text>
                </View>
                <Switch value={freeEntry} onValueChange={v => { setFreeEntry(v); if (v) setErrors(p => ({ ...p, price: '' })); }} trackColor={{ false: COLORS.bgOverlay, true: COLORS.primary }} thumbColor="#fff" />
              </View>

              {!freeEntry && (
                <Field label="Valor da entrada" required error={getErr('price')}>
                  <View style={[s.inputRow, getErr('price') && s.inputRowError]}>
                    <Text style={[s.inputRowIcon, { fontSize: 14, color: COLORS.textMuted }]}>R$</Text>
                    <TextInput style={s.inputInner} placeholder="80,00" placeholderTextColor={COLORS.textMuted} value={price} onChangeText={v => { setPrice(v); setErr('price', v); }} keyboardType="numeric" />
                  </View>
                </Field>
              )}

              <Field label="Faixa etária">
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {AGE_OPTIONS.map(opt => (
                    <TouchableOpacity key={opt}
                      style={[s.ageBtn, ageRestriction === opt && s.ageBtnActive]}
                      onPress={() => setAgeRestriction(opt)}>
                      <Text style={[s.ageBtnText, ageRestriction === opt && { color: '#fff' }]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Field>

              <View style={s.switchCard}>
                <View>
                  <Text style={s.switchLabel}>♿ Acessível</Text>
                  <Text style={s.switchSub}>Rampa, banheiro adaptado etc.</Text>
                </View>
                <Switch value={accessible} onValueChange={setAccessible} trackColor={{ false: COLORS.bgOverlay, true: COLORS.primary }} thumbColor="#fff" />
              </View>

              {accessible && (
                <Field label="Detalhes de acessibilidade">
                  <View style={s.inputRow}>
                    <Ionicons name="accessibility-outline" size={17} color={COLORS.textMuted} style={s.inputRowIcon} />
                    <TextInput style={s.inputInner} placeholder="Ex: Rampa lateral + banheiro adaptado" placeholderTextColor={COLORS.textMuted} value={accessibilityNotes} onChangeText={setAccessibilityNotes} />
                  </View>
                </Field>
              )}

              <Field label="Cor do card">
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  {GRADIENT_PRESETS.map((g, i) => (
                    <TouchableOpacity key={i}
                      style={[s.gradDot, { backgroundColor: g.colors[0] }, gradientIdx === i && s.gradDotActive]}
                      onPress={() => setGradientIdx(i)}>
                      {gradientIdx === i && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </TouchableOpacity>
                  ))}
                </View>
              </Field>
            </View>
          )}

          {/* ── STEP 3: Review ── */}
          {step === 3 && (
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>Revisar e publicar</Text>

              {/* Preview card */}
              <View style={s.previewCard}>
                <View style={[s.previewBanner, { backgroundColor: gradPreset.colors[0] }]}>
                  <View style={[s.previewBannerOverlay, { backgroundColor: gradPreset.colors[1], opacity: 0.5 }]} />
                  <Text style={s.previewBannerDate}>📅 {date} às {startTime}{endTime ? ` — ${endTime}` : ''}</Text>
                  <Text style={s.previewBannerCat}>{catInfo?.icon} {catInfo?.label}</Text>
                </View>
                <View style={s.previewBody}>
                  <Text style={s.previewName}>{name || 'Nome do evento'}</Text>
                  <Text style={s.previewVenue}>📍 {venue || 'Local'}{neighborhood ? ` · ${neighborhood}` : ''}</Text>
                  {description ? <Text style={s.previewDesc} numberOfLines={2}>{description}</Text> : null}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    <View style={s.previewPill}><Text style={s.previewPillText}>{freeEntry ? '🎟 Gratuito' : `🎟 R$ ${price}`}</Text></View>
                    {accessible && <View style={[s.previewPill, { backgroundColor: COLORS.success + '22' }]}><Text style={[s.previewPillText, { color: COLORS.success }]}>♿ Acessível</Text></View>}
                    <View style={s.previewPill}><Text style={s.previewPillText}>🔞 {ageRestriction}</Text></View>
                    {artist ? <View style={[s.previewPill, { backgroundColor: COLORS.primary + '22' }]}><Text style={[s.previewPillText, { color: COLORS.primary }]}>🎤 {artist}</Text></View> : null}
                  </View>
                </View>
              </View>

              {/* Summary list */}
              <View style={s.summaryCard}>
                {[
                  ['Evento', name],
                  ['Categoria', catInfo ? `${catInfo.icon} ${catInfo.label}` : '—'],
                  ['Data', date],
                  ['Horário', `${startTime}${endTime ? ` – ${endTime}` : ''}`],
                  ['Endereço', `${address}${neighborhood ? `, ${neighborhood}` : ''}`],
                  ['Entrada', freeEntry ? 'Gratuito' : `R$ ${price}`],
                  ['Faixa etária', ageRestriction],
                  ['Acessível', accessible ? `Sim${accessibilityNotes ? ` — ${accessibilityNotes}` : ''}` : 'Não'],
                ].map(([label, val]) => (
                  <View key={label} style={s.summaryRow}>
                    <Text style={s.summaryLabel}>{label}</Text>
                    <Text style={s.summaryValue} numberOfLines={2}>{val || '—'}</Text>
                  </View>
                ))}
              </View>

              {/* Notification card */}
              <View style={s.notifCard}>
                <Ionicons name="notifications" size={18} color={COLORS.primary} />
                <Text style={s.notifText}>Usuários próximos serão notificados assim que o evento for publicado no LiveVibe.</Text>
              </View>
            </View>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Bottom CTA */}
        <View style={s.bottomBar}>
          {step < 3 ? (
            <TouchableOpacity style={s.nextBtn} onPress={handleNext}>
              <Text style={s.nextBtnText}>Continuar →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.publishBtn} onPress={handleSubmit}>
              <Ionicons name="rocket-outline" size={20} color="#fff" />
              <Text style={s.publishBtnText}>Publicar evento agora</Text>
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
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 14, gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.bgCard, justifyContent: 'center', alignItems: 'center',
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.text },
  stepBadge: {
    backgroundColor: COLORS.primary + '22', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: RADIUS.full, borderWidth: 0.5, borderColor: COLORS.primary + '55',
  },
  stepBadgeText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },

  progressBar: { height: 3, backgroundColor: COLORS.bgOverlay },
  progressFill: { height: '100%', backgroundColor: COLORS.primary },

  stepIndicatorWrap: {
    backgroundColor: COLORS.bgCard,
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center' },
  stepItem: { alignItems: 'center', gap: 4 },
  stepDot: {
    width: 24, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5,
  },
  stepDotNum: { fontSize: 11, fontWeight: '800' },
  stepLabel: { fontSize: 10, fontWeight: '600' },
  stepLine: { flex: 1, height: 1.5, marginHorizontal: 4, marginBottom: 14 },

  stepContent: { padding: 16 },
  stepTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 18 },

  fieldWrap: { marginBottom: 16 },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSub },
  fieldHint: { fontSize: 11, color: COLORS.textMuted },
  fieldError: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  fieldErrorText: { fontSize: 12, color: COLORS.danger },

  input: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: 13,
    fontSize: 15, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border,
  },
  inputError: { borderColor: COLORS.danger, backgroundColor: COLORS.danger + '11' },
  inputMulti: { minHeight: 90, textAlignVertical: 'top' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    paddingHorizontal: 12, height: 50,
    borderWidth: 1, borderColor: COLORS.border,
  },
  inputRowError: { borderColor: COLORS.danger, backgroundColor: COLORS.danger + '11' },
  inputRowIcon: { marginRight: 8 },
  inputInner: { flex: 1, fontSize: 15, color: COLORS.text },
  charCount: { fontSize: 11, color: COLORS.textMuted, textAlign: 'right', marginTop: 4 },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: {
    width: '22%', aspectRatio: 1,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: COLORS.border, position: 'relative',
  },
  catBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '18' },
  catBtnIcon: { fontSize: 22 },
  catBtnLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 3 },
  catCheck: {
    position: 'absolute', top: 4, right: 4,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
  },

  switchCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 14,
    marginBottom: 16, borderWidth: 0.5, borderColor: COLORS.border,
  },
  switchLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  switchSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  ageBtn: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: RADIUS.full, backgroundColor: COLORS.bgCard,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  ageBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  ageBtnText: { fontSize: 13, color: COLORS.textSub, fontWeight: '600' },

  gradDot: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
  },
  gradDotActive: { borderWidth: 3, borderColor: COLORS.text },

  // Preview
  previewCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    overflow: 'hidden', borderWidth: 0.5, borderColor: COLORS.border,
    marginBottom: 14, ...SHADOW.md,
  },
  previewBanner: { height: 100, justifyContent: 'flex-end', padding: 14, position: 'relative' },
  previewBannerOverlay: { ...StyleSheet.absoluteFillObject },
  previewBannerDate: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 3 },
  previewBannerCat: { fontSize: 14, fontWeight: '800', color: '#fff' },
  previewBody: { padding: 14 },
  previewName: { fontSize: 18, fontWeight: '900', color: COLORS.text, textTransform: 'uppercase', marginBottom: 4 },
  previewVenue: { fontSize: 13, color: COLORS.textSub, marginBottom: 4 },
  previewDesc: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },
  previewPill: { backgroundColor: COLORS.bgOverlay, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  previewPillText: { fontSize: 11, color: COLORS.textSub, fontWeight: '500' },

  // Summary
  summaryCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 0.5, borderColor: COLORS.border, overflow: 'hidden', marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: 12, borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  summaryLabel: { fontSize: 13, color: COLORS.textMuted, flex: 0.4 },
  summaryValue: { fontSize: 13, fontWeight: '600', color: COLORS.text, flex: 0.6, textAlign: 'right' },

  notifCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: COLORS.primary + '18', borderRadius: RADIUS.lg,
    padding: 14, borderWidth: 0.5, borderColor: COLORS.primary + '44',
  },
  notifText: { flex: 1, fontSize: 13, color: COLORS.primaryLight, lineHeight: 18 },

  bottomBar: {
    padding: 14, backgroundColor: COLORS.bgCard,
    borderTopWidth: 0.5, borderTopColor: COLORS.border,
  },
  nextBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingVertical: 16, alignItems: 'center', ...SHADOW.glow,
  },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  publishBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingVertical: 16, ...SHADOW.glow,
  },
  publishBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
