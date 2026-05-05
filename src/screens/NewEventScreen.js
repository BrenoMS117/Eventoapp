// src/screens/NewEventScreen.js
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

const DEFAULT_GRADIENTS = [
  ['#1D9E75', '#17B890'],
  ['#533AB7', '#7A5CF0'],
  ['#D85A30', '#FF8A4B'],
];

export default function NewEventScreen({ navigation }) {
  const { addEvent, businessStats } = useApp();

  const [name, setName] = useState('');
  const [venue, setVenue] = useState(businessStats?.venueName || '');
  const [address, setAddress] = useState('');
  const [isLive, setIsLive] = useState(true);
  const [checkedInCount, setCheckedInCount] = useState('0');
  const [crowdLevel, setCrowdLevel] = useState('50');
  const [queueMinutes, setQueueMinutes] = useState('0');
  const [rating, setRating] = useState('4.5');
  const [reviewCount, setReviewCount] = useState('0');
  const [nowPlaying, setNowPlaying] = useState('');
  const [nextAct, setNextAct] = useState('');
  const [accessible, setAccessible] = useState(false);
  const [accessibilityNotes, setAccessibilityNotes] = useState('');
  const [gradientIndex, setGradientIndex] = useState(0);

  function handleSubmit() {
    if (!name.trim()) { Alert.alert('Adicione o nome do evento'); return; }
    if (!venue.trim()) { Alert.alert('Adicione o local/venue'); return; }

    const event = {
      name: name.trim(),
      venue: venue.trim(),
      address: address.trim() || `${venue} - Endereço não informado`,
      isLive,
      checkedInCount: parseInt(checkedInCount) || 0,
      crowdLevel: Math.min(100, Math.max(0, parseInt(crowdLevel) || 0)),
      queueMinutes: parseInt(queueMinutes) || 0,
      rating: parseFloat(rating) || 0,
      reviewCount: parseInt(reviewCount) || 0,
      nowPlaying: nowPlaying.trim(),
      nextAct: nextAct.trim(),
      accessible,
      accessibilityNotes: accessibilityNotes.trim(),
      gradient: DEFAULT_GRADIENTS[gradientIndex] || DEFAULT_GRADIENTS[0],
      isLiveOverride: isLive,
    };

    addEvent(event);
    Alert.alert('🎉 Evento criado!', `"${event.name}" foi adicionado.`, [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Criar evento</Text>
        <View style={{ width: 34 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Text style={styles.label}>Nome do evento *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ex: Noite do Samba" placeholderTextColor={COLORS.textMuted} />

            <Text style={styles.label}>Local / Venue *</Text>
            <TextInput style={styles.input} value={venue} onChangeText={setVenue} placeholder="Nome do bar / casa" placeholderTextColor={COLORS.textMuted} />

            <Text style={styles.label}>Endereço</Text>
            <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Rua, número, bairro - Cidade" placeholderTextColor={COLORS.textMuted} />

            <Text style={styles.label}>Status ao vivo</Text>
            <View style={styles.row}>
              <TouchableOpacity style={[styles.toggleBtn, isLive && styles.toggleBtnActive]} onPress={() => setIsLive(true)}>
                <Text style={[styles.toggleText, isLive && { color: '#fff' }]}>Ao vivo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, !isLive && styles.toggleBtnActive]} onPress={() => setIsLive(false)}>
                <Text style={[styles.toggleText, !isLive && { color: '#fff' }]}>Inativo</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Pessoas no local</Text>
            <TextInput style={styles.input} value={checkedInCount} onChangeText={setCheckedInCount} keyboardType="number-pad" />

            <Text style={styles.label}>Lotação (0-100)</Text>
            <TextInput style={styles.input} value={crowdLevel} onChangeText={setCrowdLevel} keyboardType="number-pad" />

            <Text style={styles.label}>Tempo médio de fila (min)</Text>
            <TextInput style={styles.input} value={queueMinutes} onChangeText={setQueueMinutes} keyboardType="number-pad" />

            <Text style={styles.label}>Avaliação média</Text>
            <TextInput style={styles.input} value={rating} onChangeText={setRating} keyboardType="decimal-pad" />

            <Text style={styles.label}>Reviews</Text>
            <TextInput style={styles.input} value={reviewCount} onChangeText={setReviewCount} keyboardType="number-pad" />

            <Text style={styles.label}>Tocando agora</Text>
            <TextInput style={styles.input} value={nowPlaying} onChangeText={setNowPlaying} placeholder="Artista / música" />

            <Text style={styles.label}>Próximo ato</Text>
            <TextInput style={styles.input} value={nextAct} onChangeText={setNextAct} placeholder="Próximo artista / atração" />

            <Text style={styles.label}>Acessibilidade</Text>
            <View style={styles.row}>
              <TouchableOpacity style={[styles.toggleBtn, accessible && styles.toggleBtnActive]} onPress={() => setAccessible(true)}>
                <Text style={[styles.toggleText, accessible && { color: '#fff' }]}>Sim</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, !accessible && styles.toggleBtnActive]} onPress={() => setAccessible(false)}>
                <Text style={[styles.toggleText, !accessible && { color: '#fff' }]}>Não</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Notas de acessibilidade</Text>
            <TextInput style={[styles.input, styles.inputMulti]} value={accessibilityNotes} onChangeText={setAccessibilityNotes} multiline />

            <Text style={styles.label}>Paleta / Gradiente</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {DEFAULT_GRADIENTS.map((g, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.gradientSwatch, gradientIndex === i && { borderWidth: 2, borderColor: COLORS.primary }]}
                  onPress={() => setGradientIndex(i)}
                >
                  <View style={{ flex: 1, backgroundColor: g[0], borderTopLeftRadius: 6, borderTopRightRadius: 6 }} />
                  <View style={{ flex: 1, backgroundColor: g[1], borderBottomLeftRadius: 6, borderBottomRightRadius: 6 }} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ height: 20 }} />
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.publishBtn} onPress={handleSubmit}>
            <Ionicons name="save" size={18} color="#fff" />
            <Text style={styles.publishBtnText}>Criar evento</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primaryDark,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingTop: 12, paddingBottom: 14,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { flex: 1, marginLeft: 10, fontSize: 17, fontWeight: '600', color: '#fff' },
  scroll: { flex: 1 },
  content: { padding: 16 },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md, padding: 12,
    fontSize: 14, color: COLORS.text,
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  toggleBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  toggleText: { fontSize: 13, color: COLORS.text },
  gradientSwatch: {
    width: 56, height: 40, borderRadius: 6, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border,
  },
  bottomBar: {
    padding: 14, backgroundColor: COLORS.surface,
    borderTopWidth: 0.5, borderTopColor: COLORS.border,
  },
  publishBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg, paddingVertical: 14,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10,
  },
  publishBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
 