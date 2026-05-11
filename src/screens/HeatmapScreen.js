import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS } from '../utils/theme';
import { HEATMAP_POINTS } from '../data/mockData';

const { width, height } = Dimensions.get('window');
const MAP_H = height * 0.58;

const VIBE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'party', label: 'Party' },
  { key: 'chill', label: 'Chill' },
  { key: 'intense', label: 'Intense' },
];

const TIMELINE = [
  { key: 'now', label: 'now', angle: 0.8 },
  { key: '-1h', label: '-1h', angle: 0.5 },
  { key: '-2h', label: '-2h', angle: 0.3 },
];

// Simulates a heat point on the map
function HeatPoint({ point, onPress }) {
  const px = point.x * (width - 32);
  const py = point.y * (MAP_H - 60);
  const size = 40 + point.intensity * 60;
  const alpha = Math.floor(point.intensity * 180).toString(16).padStart(2, '0');
  const color = point.intensity > 0.8 ? '#FF4500' : point.intensity > 0.6 ? '#E83B5C' : '#B8296E';

  return (
    <TouchableOpacity
      style={[styles.heatPoint, {
        left: px - size / 2,
        top: py - size / 2,
        width: size, height: size,
        borderRadius: size / 2,
        backgroundColor: color + alpha,
        // inner glow
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: size / 2,
        elevation: 8,
      }]}
      onPress={onPress}
    >
      {/* Inner hot core */}
      <View style={[styles.heatCore, {
        width: size * 0.35, height: size * 0.35, borderRadius: size * 0.175,
        backgroundColor: color,
      }]} />
    </TouchableOpacity>
  );
}

// Timeline ring indicator
function TimelineRing({ intensity, label, isActive }) {
  const color = intensity > 0.7 ? COLORS.primary : intensity > 0.4 ? COLORS.purple : '#3B82F6';
  const size = 48;
  return (
    <View style={styles.timelineItem}>
      <Text style={[styles.timelineLabel, isActive && { color: COLORS.text }]}>{label}</Text>
      <View style={[styles.timelineRing, {
        width: size, height: size, borderRadius: size / 2,
        borderColor: color, borderWidth: 3,
        backgroundColor: color + '22',
      }]}>
        <View style={[styles.timelineCore, {
          width: size * 0.5, height: size * 0.5, borderRadius: size * 0.25,
          backgroundColor: color,
        }]} />
      </View>
    </View>
  );
}

export default function HeatmapScreen() {
  const { events } = useApp();
  const [vibeFilter, setVibeFilter] = useState('all');
  const [timeline, setTimeline] = useState('now');
  const [selectedPoint, setSelectedPoint] = useState(null);

  // Top event popup
  const topEvent = events.find(e => e.isLive && e.capacityPct > 80) || events[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="pulse" size={18} color={COLORS.primary} />
          <Text style={styles.logo}>LiveVibe</Text>
        </View>
        <Text style={styles.headerTitle}>Urban Heatmap</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={20} color={COLORS.text} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="person-circle-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Vibe filter chips */}
      <View style={styles.vibeFilterWrap}>
        <View style={styles.vibeFilterCard}>
          <Text style={styles.vibeFilterTitle}>Vibe Filter</Text>
          <View style={styles.vibeFilterRow}>
            {VIBE_FILTERS.map(f => (
              <TouchableOpacity key={f.key}
                style={[styles.vibePill, vibeFilter === f.key && styles.vibePillActive]}
                onPress={() => setVibeFilter(f.key)}>
                <Text style={[styles.vibePillText, vibeFilter === f.key && styles.vibePillTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Map area */}
      <View style={styles.mapContainer}>
        {/* Dark map base */}
        <View style={styles.mapBase}>
          {/* Grid lines to simulate map */}
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={`h${i}`} style={[styles.mapLine, styles.mapLineH, { top: `${(i + 1) * 11}%` }]} />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={`v${i}`} style={[styles.mapLine, styles.mapLineV, { left: `${(i + 1) * 14}%` }]} />
          ))}

          {/* River simulation */}
          <View style={styles.river} />

          {/* Heat points */}
          {HEATMAP_POINTS.map(point => (
            <HeatPoint
              key={point.id}
              point={point}
              onPress={() => setSelectedPoint(selectedPoint?.id === point.id ? null : point)}
            />
          ))}

          {/* Top event popup */}
          {!selectedPoint && (
            <View style={styles.topEventPopup}>
              <View style={styles.topEventBadge}>
                <Ionicons name="star" size={10} color="#fff" />
                <Text style={styles.topEventBadgeText}>TOP EVENT</Text>
              </View>
              <View style={styles.topEventCard}>
                <View style={styles.topEventAvatar}>
                  <Text style={{ fontSize: 14 }}>🎵</Text>
                </View>
                <View>
                  <Text style={styles.topEventName}>{topEvent?.nowPlaying || 'hana037'}</Text>
                  <Text style={styles.topEventRole}>Artist</Text>
                </View>
              </View>
            </View>
          )}

          {/* Selected point info */}
          {selectedPoint && (
            <View style={[styles.topEventPopup, { top: selectedPoint.y * (MAP_H - 80) - 80 }]}>
              <View style={styles.topEventCard}>
                <Ionicons name="location" size={16} color={COLORS.primary} />
                <View>
                  <Text style={styles.topEventName}>{selectedPoint.label}</Text>
                  <Text style={styles.topEventRole}>
                    {Math.round(selectedPoint.intensity * 100)}% activity
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedPoint(null)} style={{ marginLeft: 8 }}>
                  <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Vibration Level legend */}
        <View style={styles.vibrationCard}>
          <Text style={styles.vibrationTitle}>Vibration Level</Text>
          <View style={styles.vibrationBar}>
            {/* Party → Chill → Intense gradient */}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.vibrationLabel}>Party</Text>
            <Text style={styles.vibrationLabel}>Chill</Text>
            <Text style={styles.vibrationLabel}>Intense</Text>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Timeline</Text>
          <View style={styles.timelineRow}>
            {TIMELINE.map(t => (
              <TouchableOpacity key={t.key} onPress={() => setTimeline(t.key)}>
                <TimelineRing
                  intensity={t.key === 'now' ? 0.85 : t.key === '-1h' ? 0.55 : 0.35}
                  label={t.label}
                  isActive={timeline === t.key}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  logo: { fontSize: 16, fontWeight: '900', color: COLORS.text },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  iconBtn: { padding: 4, position: 'relative' },
  notifDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.primary, position: 'absolute', top: 4, right: 2, borderWidth: 1, borderColor: COLORS.bg },

  vibeFilterWrap: { paddingHorizontal: 16, marginBottom: 8 },
  vibeFilterCard: { backgroundColor: COLORS.bgCard + 'EE', borderRadius: RADIUS.lg, padding: 12, borderWidth: 0.5, borderColor: COLORS.border },
  vibeFilterTitle: { fontSize: 12, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: 8 },
  vibeFilterRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  vibePill: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: RADIUS.full, backgroundColor: COLORS.bgOverlay, borderWidth: 0.5, borderColor: COLORS.border },
  vibePillActive: { backgroundColor: COLORS.primary + '33', borderColor: COLORS.primary },
  vibePillText: { fontSize: 13, color: COLORS.textSub, fontWeight: '500' },
  vibePillTextActive: { color: COLORS.primaryLight, fontWeight: '700' },

  mapContainer: { flex: 1, position: 'relative' },
  mapBase: {
    flex: 1,
    backgroundColor: '#111827',
    margin: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  mapLine: { position: 'absolute', backgroundColor: '#1F2A3C' },
  mapLineH: { left: 0, right: 0, height: 1 },
  mapLineV: { top: 0, bottom: 0, width: 1 },

  river: {
    position: 'absolute',
    width: width * 0.65,
    height: 28,
    backgroundColor: '#1A3A5C',
    borderRadius: 14,
    top: '52%',
    left: '15%',
    transform: [{ rotate: '-8deg' }],
  },

  heatPoint: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heatCore: {},

  topEventPopup: {
    position: 'absolute',
    top: '22%',
    right: '10%',
    zIndex: 10,
  },
  topEventBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: RADIUS.full, alignSelf: 'flex-end', marginBottom: 4,
  },
  topEventBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  topEventCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.bgCard + 'F0',
    borderRadius: RADIUS.lg, padding: 10,
    borderWidth: 0.5, borderColor: COLORS.border,
    minWidth: 140,
  },
  topEventAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.bgOverlay,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.primary,
  },
  topEventName: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  topEventRole: { fontSize: 11, color: COLORS.textSub },

  vibrationCard: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    backgroundColor: COLORS.bgCard + 'F0',
    borderRadius: RADIUS.lg, padding: 12,
    borderWidth: 0.5, borderColor: COLORS.border,
    width: 180,
  },
  vibrationTitle: { fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  vibrationBar: {
    height: 8, borderRadius: 4, marginBottom: 4,
    backgroundColor: COLORS.primary,
    // simulated gradient via background
  },
  vibrationLabel: { fontSize: 10, color: COLORS.textMuted },

  timelineCard: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    backgroundColor: COLORS.bgCard + 'F0',
    borderRadius: RADIUS.lg, padding: 12,
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  timelineTitle: { fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 10, textAlign: 'center' },
  timelineRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  timelineItem: { alignItems: 'center', gap: 4 },
  timelineLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
  timelineRing: { justifyContent: 'center', alignItems: 'center' },
  timelineCore: {},
});
