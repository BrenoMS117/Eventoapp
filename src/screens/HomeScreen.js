import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Alert,
  Platform,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useNearbyEvents } from '../hooks/useNearbyEvents';
import { useNotifications } from '../hooks/useNotifications';
import NotificationsModal from './NotificationsModal';
import { COLORS, RADIUS, SHADOW } from '../utils/theme';

const { width } = Dimensions.get('window');
const HERO_H   = 260;
const CARD_W   = width * 0.60;
const CARD_H   = 200;
const LIVE_W   = width * 0.50;

// ─── Utilitários ─────────────────────────────────────────────────────────────

const CATEGORY_ICON = {
  rave:     'musical-notes',
  concert:  'mic',
  art:      'color-palette',
  electro:  'headset',
  festival: 'flag',
};

function categoryIcon(cat) {
  return CATEGORY_ICON[cat] ?? 'calendar';
}

function formatDist(km) {
  if (km == null) return null;
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function formatTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
}

// ─── LiveBadge ───────────────────────────────────────────────────────────────

function LiveBadge() {
  return (
    <View style={s.liveBadge}>
      <View style={s.liveDot} />
      <Text style={s.liveText}>AO VIVO</Text>
    </View>
  );
}

// ─── HeroCard ────────────────────────────────────────────────────────────────

function HeroCard({ event, distanceKm, onPress }) {
  const bgColor = Array.isArray(event.gradient) ? event.gradient[0] : COLORS.bgElevated;
  const dist    = formatDist(distanceKm);

  return (
    <TouchableOpacity style={s.heroCard} onPress={onPress} activeOpacity={0.92}>
      {event.coverPhoto ? (
        <Image source={{ uri: event.coverPhoto }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor }]} />
      )}

      <View style={s.heroOverlay} />

      <View style={s.heroContent}>
        <View style={s.heroTopRow}>
          {event.isLive && <LiveBadge />}
          {event.categoryLabel ? (
            <View style={s.catChip}>
              <Ionicons name={categoryIcon(event.category)} size={11} color={COLORS.textSub} />
              <Text style={s.catChipText}>{event.categoryLabel}</Text>
            </View>
          ) : null}
        </View>

        <Text style={s.heroName} numberOfLines={2}>{event.name}</Text>

        <View style={s.heroMeta}>
          <Ionicons name="location-outline" size={13} color={COLORS.primaryLight} />
          <Text style={s.heroVenue} numberOfLines={1}>{event.venue}</Text>
          {dist && (
            <View style={s.heroDist}>
              <Text style={s.heroDistText}>{dist}</Text>
            </View>
          )}
        </View>

        {event.startsAt && (
          <View style={s.heroTimeRow}>
            <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
            <Text style={s.heroTimeText}>
              {formatDate(event.startsAt)} · {formatTime(event.startsAt)}
            </Text>
          </View>
        )}

        <TouchableOpacity style={s.heroBtn} onPress={onPress}>
          <Text style={s.heroBtnText}>Ver detalhes</Text>
          <Ionicons name="arrow-forward" size={14} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── CarouselCard ─────────────────────────────────────────────────────────────

function CarouselCard({ event, distanceKm, onPress }) {
  const bgColor = Array.isArray(event.gradient) ? event.gradient[0] : COLORS.bgElevated;
  const dist    = formatDist(distanceKm);

  return (
    <TouchableOpacity style={s.carCard} onPress={onPress} activeOpacity={0.88}>
      {event.coverPhoto ? (
        <Image source={{ uri: event.coverPhoto }} style={s.carImage} resizeMode="cover" />
      ) : (
        <View style={[s.carImage, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name={categoryIcon(event.category)} size={36} color="rgba(255,255,255,0.4)" />
        </View>
      )}

      <View style={s.carOverlay} />

      <View style={s.carBadgeRow}>
        {event.isLive && <LiveBadge />}
        {dist && (
          <View style={s.distBadge}>
            <Ionicons name="navigate-outline" size={9} color={COLORS.text} />
            <Text style={s.distBadgeText}>{dist}</Text>
          </View>
        )}
      </View>

      <View style={s.carInfo}>
        <Text style={s.carName} numberOfLines={2}>{event.name}</Text>
        <Text style={s.carVenue} numberOfLines={1}>{event.venue}</Text>
        {event.startsAt && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Ionicons name="time-outline" size={10} color={COLORS.textMuted} />
            <Text style={s.carTime}>{formatTime(event.startsAt)}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── LiveEventRow ─────────────────────────────────────────────────────────────

function LiveEventRow({ event, distanceKm, onPress }) {
  const bgColor = Array.isArray(event.gradient) ? event.gradient[0] : COLORS.bgElevated;
  const dist    = formatDist(distanceKm);

  return (
    <TouchableOpacity style={s.liveCard} onPress={onPress} activeOpacity={0.88}>
      {event.coverPhoto ? (
        <Image source={{ uri: event.coverPhoto }} style={s.liveThumb} resizeMode="cover" />
      ) : (
        <View style={[s.liveThumb, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name={categoryIcon(event.category)} size={24} color="rgba(255,255,255,0.5)" />
        </View>
      )}
      <View style={s.liveCardBody}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <LiveBadge />
          {event.categoryLabel && (
            <Text style={s.liveCardCat}>{event.categoryLabel}</Text>
          )}
        </View>
        <Text style={s.liveCardName} numberOfLines={1}>{event.name}</Text>
        <Text style={s.liveCardVenue} numberOfLines={1}>{event.venue}</Text>
        {dist && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
            <Ionicons name="navigate-outline" size={10} color={COLORS.primary} />
            <Text style={s.liveCardDist}>{dist}</Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

function SectionHeader({ title, onMore }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {onMore && (
        <TouchableOpacity onPress={onMore} style={s.moreBtn}>
          <Text style={s.moreBtnText}>Ver todos</Text>
          <Ionicons name="chevron-forward" size={13} color={COLORS.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── EmptyNearby ─────────────────────────────────────────────────────────────

function EmptyNearby({ hasCoords }) {
  return (
    <View style={s.emptyCard}>
      <Text style={s.emptyTitle}>
        {hasCoords ? 'Nenhum evento próximo' : 'Localizando você…'}
      </Text>
      <Text style={s.emptySub}>
        {hasCoords
          ? 'Não encontramos eventos no seu raio agora. Tente explorar todos.'
          : 'Aguardando o GPS para personalizar sua home.'}
      </Text>
    </View>
  );
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }) {
  const { currentUser, logout } = useApp();
  const { heroEvent, nearbyEvents, liveEvents, distances, geoLabel, hasCoords } = useNearbyEvents();
  const { unreadCount } = useNotifications();
  const [notifVisible, setNotifVisible] = useState(false);

  const firstName = currentUser?.name?.split(' ')[0] ?? 'você';

  function goToEvent(event) {
    navigation.navigate('EventDetail', { eventId: event.id });
  }

  function goToExplore() {
    navigation.navigate('Explore');
  }

  function handleLogout() {
    if (Platform.OS === 'web') {
      if (window.confirm('Deseja sair?')) logout();
    } else {
      Alert.alert('Sair', 'Deseja sair?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', onPress: logout },
      ]);
    }
  }

  const carouselEvents = heroEvent
    ? nearbyEvents.filter((e) => e.id !== heroEvent.id)
    : nearbyEvents;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* ── Cabeçalho ── */}
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
            <Ionicons name="pulse" size={20} color={COLORS.primary} />
            <Text style={s.logo}>LiveVibe</Text>
          </View>
          <Text style={s.greeting}>Olá, {firstName}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <TouchableOpacity style={s.iconBtn} onPress={() => setNotifVisible(true)}>
              <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
              {unreadCount > 0 && (
                <View style={s.notifBadge}>
                  <Text style={s.notifBadgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={s.iconBtn} onPress={goToExplore}>
              <Ionicons name="search-outline" size={22} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <NotificationsModal visible={notifVisible} onClose={() => setNotifVisible(false)} />

      {/* ── Barra de status GPS ── */}
      <View style={s.geoBar}>
        <Ionicons
          name={hasCoords ? 'navigate-circle' : 'navigate-circle-outline'}
          size={13}
          color={hasCoords ? COLORS.primary : COLORS.textMuted}
        />
        <Text style={[s.geoLabel, !hasCoords && { color: COLORS.textMuted }]}>
          {geoLabel}
        </Text>
        {!hasCoords && (
          <View style={s.gpsPulseDot} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Destaque ── */}
        {heroEvent ? (
          <View style={{ paddingHorizontal: 16, marginTop: 12, marginBottom: 8 }}>
            <SectionHeader
              title="Em destaque"
              onMore={goToExplore}
            />
            <HeroCard
              event={heroEvent}
              distanceKm={distances.get(heroEvent.id)}
              onPress={() => goToEvent(heroEvent)}
            />
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
            <EmptyNearby hasCoords={hasCoords} />
          </View>
        )}

        {/* ── Próximos de você ── */}
        {(carouselEvents.length > 0 || nearbyEvents.length > 0) && (
          <View style={{ marginTop: 16 }}>
            <View style={{ paddingHorizontal: 16 }}>
              <SectionHeader
                title="Próximos de você"
                onMore={goToExplore}
              />
            </View>

            {carouselEvents.length > 0 ? (
              <FlatList
                data={carouselEvents}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
                ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                renderItem={({ item }) => (
                  <CarouselCard
                    event={item}
                    distanceKm={distances.get(item.id)}
                    onPress={() => goToEvent(item)}
                  />
                )}
              />
            ) : (
              <View style={{ paddingHorizontal: 16 }}>
                <EmptyNearby hasCoords={hasCoords} />
              </View>
            )}
          </View>
        )}

        {/* ── Ao vivo agora ── */}
        {liveEvents.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
            <SectionHeader title="Ao vivo agora" />
            {liveEvents.map((event) => (
              <LiveEventRow
                key={event.id}
                event={event}
                distanceKm={distances.get(event.id)}
                onPress={() => goToEvent(event)}
              />
            ))}
          </View>
        )}

        {/* ── Explorar todos ── */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <TouchableOpacity style={s.exploreAllBtn} onPress={goToExplore}>
            <Ionicons name="compass-outline" size={18} color={COLORS.primary} />
            <Text style={s.exploreAllText}>Explorar todos os eventos</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  logo: { fontSize: 16, fontWeight: '900', color: COLORS.text },
  greeting: { flex: 1, fontSize: 13, color: COLORS.textSub, textAlign: 'center' },
  iconBtn: { padding: 4, position: 'relative' },
  notifBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 8, minWidth: 16, height: 16,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },

  geoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  geoLabel: { flex: 1, fontSize: 11, fontWeight: '600', color: COLORS.primary },
  gpsPulseDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: COLORS.textMuted,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  moreBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  moreBtnText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.live,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff' },
  liveText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  // ── Card de destaque ──
  heroCard: {
    height: HERO_H,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOW.md,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 18,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  catChipText: { fontSize: 10, color: COLORS.textSub },
  heroName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 28,
    marginBottom: 8,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  heroVenue: { flex: 1, fontSize: 13, color: COLORS.textSub },
  heroDist: {
    backgroundColor: COLORS.primary + 'CC',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  heroDistText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  heroTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 14,
  },
  heroTimeText: { fontSize: 11, color: COLORS.textMuted },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
  },
  heroBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // ── Card do carrossel ──
  carCard: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  carImage: { width: CARD_W, height: CARD_H },
  carOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.50)',
  },
  carBadgeRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginLeft: 'auto',
  },
  distBadgeText: { fontSize: 10, color: COLORS.text, fontWeight: '600' },
  carInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  carName: { fontSize: 14, fontWeight: '800', color: '#fff', lineHeight: 19, marginBottom: 3 },
  carVenue: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  carTime: { fontSize: 10, color: COLORS.textMuted },

  // ── Linha de evento ao vivo ──
  liveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  liveThumb: { width: 80, height: 80 },
  liveCardBody: { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
  liveCardCat: { fontSize: 10, color: COLORS.textMuted },
  liveCardName: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  liveCardVenue: { fontSize: 11, color: COLORS.textSub },
  liveCardDist: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },

  // ── Estado vazio ──
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  emptySub: { fontSize: 12, color: COLORS.textSub, textAlign: 'center', lineHeight: 18 },

  // ── Botão explorar todos ──
  exploreAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + '66',
    backgroundColor: COLORS.primary + '12',
  },
  exploreAllText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
});
