import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { key: 'todos', label: 'All Events' },
  { key: 'rave', label: 'Rave' },
  { key: 'concert', label: 'Concert' },
  { key: 'art', label: 'Art Basel' },
  { key: 'electro', label: 'Electro Events' },
  { key: 'festival', label: 'Festival' },
];

const HEAT_COLORS = {
  BLAZING: '#FF4500', HOT: '#E83B5C', WARM: '#F59E0B', COOL: '#3B82F6',
};

function VibeMeter({ value }) {
  const color = value > 70 ? COLORS.primary : value > 40 ? COLORS.purple : '#3B82F6';
  return (
    <View>
      <View style={s.vmBg}>
        <View style={[s.vmFill, { width: `${Math.max(2, value)}%`, backgroundColor: color }]} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
        <Text style={s.vmLabel}>Chill</Text>
        <Text style={s.vmLabel}>Intense</Text>
      </View>
    </View>
  );
}

export default function ExploreScreen({ navigation }) {
  const { events, logout } = useApp();
  const [cat, setCat] = useState('todos');
  const [search, setSearch] = useState('');

  const filtered = events.filter(e => {
    const matchCat = cat === 'todos' || e.category === cat;
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const heroEvent = filtered.find(e => e.isLive) || filtered[0];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="pulse" size={20} color={COLORS.primary} />
          <Text style={s.logo}>LiveVibe</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <TouchableOpacity style={s.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
            <View style={s.notifDot} />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={() => Alert.alert('Sair?', '', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sair', onPress: logout }])}>
            <Ionicons name="person-circle-outline" size={26} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Page title */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
          <Text style={s.pageTitle}>Explore Events</Text>
          <View style={s.filterPill}>
            <Ionicons name="options-outline" size={14} color={COLORS.text} />
            <Text style={{ fontSize: 12, color: COLORS.text, fontWeight: '600', marginLeft: 4 }}>Filter</Text>
          </View>
        </View>

        {/* Search */}
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
          <TextInput style={s.searchInput} placeholder="Search events, venues, artists..."
            placeholderTextColor={COLORS.textMuted} value={search} onChangeText={setSearch} />
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cats}>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c.key} style={[s.catPill, cat === c.key && s.catPillOn]} onPress={() => setCat(c.key)}>
              <Text style={[s.catText, cat === c.key && s.catTextOn]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Hero */}
        {heroEvent && (
          <View style={{ marginHorizontal: 16, marginBottom: 6 }}>
            <TouchableOpacity style={s.hero} onPress={() => navigation.navigate('EventDetail', { eventId: heroEvent.id })} activeOpacity={0.92}>
              <View style={[s.heroBg, { backgroundColor: heroEvent.gradient[0] }]} />
              <View style={[s.heroBg, { backgroundColor: heroEvent.gradient[1], opacity: 0.5 }]} />
              <View style={s.heroOverlay} />
              <View style={s.heroContent}>
                {heroEvent.isLive && (
                  <View style={s.liveBadge}>
                    <View style={s.liveDot} />
                    <Text style={s.liveText}>LIVE</Text>
                  </View>
                )}
                <Text style={s.heroName}>{heroEvent.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <View style={[s.capDot, { backgroundColor: heroEvent.capacityPct > 80 ? '#FF4500' : COLORS.success }]} />
                  <Text style={{ fontSize: 12, color: '#fff', fontWeight: '600' }}>{heroEvent.capacityPct}% CAPACITY</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: HEAT_COLORS[heroEvent.heatLevel] || '#fff' }}>
                    | {heroEvent.vibeLabel?.toUpperCase()}
                  </Text>
                </View>
                <TouchableOpacity style={s.ticketBtn}>
                  <Text style={s.ticketBtnText}>BUY TICKETS</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
            {/* Dots */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 }}>
              {filtered.slice(0, 3).map((_, i) => (
                <View key={i} style={[s.dot, i === 0 && s.dotActive]} />
              ))}
            </View>
          </View>
        )}

        {/* Live Now cards */}
        <View style={{ marginTop: 4 }}>
          <Text style={[s.sectionTitle, { marginLeft: 16 }]}>Live Now</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
            {filtered.map(e => {
              const hc = HEAT_COLORS[e.heatLevel] || COLORS.primary;
              return (
                <TouchableOpacity key={e.id} style={s.eventCard}
                  onPress={() => navigation.navigate('EventDetail', { eventId: e.id })} activeOpacity={0.88}>
                  <View style={[s.eventCardTop, { backgroundColor: e.gradient[0] + 'CC' }]}>
                    {e.isLive && (
                      <View style={s.liveSmall}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>Live Now</Text>
                      </View>
                    )}
                  </View>
                  <View style={s.eventCardBody}>
                    <Text style={s.eventCardName} numberOfLines={1}>{e.name}</Text>
                    <Text style={s.eventCardSub} numberOfLines={1}>{e.venue}</Text>
                    <Text style={s.vmLabelText}>Vibe Meter</Text>
                    <VibeMeter value={e.vibeMeter} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="people-outline" size={11} color={COLORS.textSub} />
                        <Text style={s.attendText}>{e.checkedInCount} attendance</Text>
                      </View>
                      {e.heatLevel && (
                        <View style={[s.heatBadge, { borderColor: hc + '55', backgroundColor: hc + '22' }]}>
                          <Text style={[s.heatText, { color: hc }]}>{e.heatLevel}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_W = width * 0.68;
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  logo: { fontSize: 18, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
  iconBtn: { padding: 6, position: 'relative' },
  notifDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, position: 'absolute', top: 6, right: 4, borderWidth: 1.5, borderColor: COLORS.bg },
  pageTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  filterPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgElevated, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 0.5, borderColor: COLORS.border },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgCard, marginHorizontal: 16, marginBottom: 14, borderRadius: RADIUS.lg, paddingHorizontal: 14, height: 44, borderWidth: 0.5, borderColor: COLORS.border },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
  cats: { paddingHorizontal: 16, gap: 8, alignItems: 'center', marginBottom: 16 },
  catPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.bgCard, borderWidth: 0.5, borderColor: COLORS.border },
  catPillOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catText: { fontSize: 13, color: COLORS.textSub, fontWeight: '500' },
  catTextOn: { color: '#fff', fontWeight: '700' },
  hero: { height: 220, borderRadius: RADIUS.xl, overflow: 'hidden', justifyContent: 'flex-end' },
  heroBg: { ...StyleSheet.absoluteFillObject },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  heroContent: { padding: 18 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.danger, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, alignSelf: 'flex-start', marginBottom: 8 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveText: { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  heroName: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
  capDot: { width: 8, height: 8, borderRadius: 4 },
  ticketBtn: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 9, borderRadius: RADIUS.full, alignSelf: 'flex-start' },
  ticketBtnText: { fontSize: 12, fontWeight: '900', color: COLORS.bg, letterSpacing: 0.5 },
  dot: { width: 20, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  dotActive: { backgroundColor: COLORS.primary, width: 32 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  eventCard: { width: CARD_W, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 0.5, borderColor: COLORS.border },
  eventCardTop: { height: 110, justifyContent: 'flex-end', padding: 8 },
  liveSmall: { backgroundColor: COLORS.danger + 'EE', paddingHorizontal: 10, paddingVertical: 3, borderRadius: RADIUS.full, alignSelf: 'flex-start' },
  eventCardBody: { padding: 12 },
  eventCardName: { fontSize: 14, fontWeight: '900', color: COLORS.text, textTransform: 'uppercase', marginBottom: 2 },
  eventCardSub: { fontSize: 12, color: COLORS.textSub, marginBottom: 8 },
  vmLabelText: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
  vmBg: { height: 6, backgroundColor: COLORS.bgOverlay, borderRadius: 3, overflow: 'hidden', marginBottom: 3 },
  vmFill: { height: '100%', borderRadius: 3 },
  vmLabel: { fontSize: 9, color: COLORS.textMuted },
  attendText: { fontSize: 11, color: COLORS.textSub },
  heatBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full, borderWidth: 0.5 },
  heatText: { fontSize: 10, fontWeight: '700' },
});
