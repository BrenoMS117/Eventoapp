import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { COLORS, RADIUS, SHADOW } from "../utils/theme";

const FILTERS = ["Todos", "Shows", "Festas", "Bares", "Cultura"];

function CrowdBar({ level }) {
  const color =
    level >= 85 ? COLORS.danger : level >= 60 ? COLORS.warning : COLORS.success;
  return (
    <View style={styles.crowdBarBg}>
      <View
        style={[
          styles.crowdBarFill,
          { width: `${level}%`, backgroundColor: color },
        ]}
      />
    </View>
  );
}

function Pill({ icon, label, color, text }) {
  return (
    <View style={[styles.pill, { backgroundColor: color }]}>
      <Text style={[styles.pillText, { color: text }]}>
        {icon} {label}
      </Text>
    </View>
  );
}

function CrowdPill({ level }) {
  if (level >= 85)
    return (
      <Pill
        icon="🚨"
        label="Lotado"
        color={COLORS.dangerLight}
        text={COLORS.danger}
      />
    );
  if (level >= 60)
    return (
      <Pill
        icon="🔥"
        label={`${level}% cheio`}
        color={COLORS.warningLight}
        text={COLORS.warning}
      />
    );
  return (
    <Pill
      icon="🟢"
      label="Tranquilo"
      color={COLORS.successLight}
      text={COLORS.success}
    />
  );
}

function EventCard({ event, onPress }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.cardBanner, { backgroundColor: event.gradient[0] }]}>
        <View style={styles.bannerRow}>
          {event.isLive ? (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>
                AO VIVO · {event.checkedInCount.toLocaleString()} aqui
              </Text>
            </View>
          ) : (
            <View style={styles.liveBadge}>
              <Ionicons name="time-outline" size={11} color="#fff" />
              <Text style={styles.liveBadgeText}>
                {" "}
                Começa às {event.startsAt}
              </Text>
            </View>
          )}
          {event.couponsCount > 0 && (
            <View style={styles.couponBadge}>
              <Text style={styles.couponBadgeText}>
                🎟 {event.couponsCount} cupons
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.bannerCategory}>{event.categoryLabel}</Text>
      </View>
      <View style={styles.cardInfo}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName} numberOfLines={1}>
              {event.name}
            </Text>
            <Text style={styles.cardMeta}>
              📍 {event.address.split(" - ")[1] || event.venue} ·{" "}
              {event.distanceKm}km
            </Text>
          </View>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>⭐ {event.rating}</Text>
          </View>
        </View>
        <CrowdBar level={event.crowdLevel} />
        <View style={styles.pillRow}>
          <CrowdPill level={event.crowdLevel} />
          {event.queueMinutes > 0 && (
            <Pill
              icon="⏱"
              label={`Fila ~${event.queueMinutes}min`}
              color={COLORS.warningLight}
              text={COLORS.warning}
            />
          )}
          {event.accessible && (
            <Pill
              icon="♿"
              label="Acessível"
              color={COLORS.primaryLight}
              text={COLORS.primaryDark}
            />
          )}
          {event.nowPlaying && (
            <Pill
              icon="🎵"
              label={event.nowPlaying.slice(0, 18)}
              color={COLORS.purpleLight}
              text={COLORS.purple}
            />
          )}
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.priceText}>{event.price}</Text>
          <Text style={styles.endsText}>
            {event.isLive ? `Até ${event.endsAt}` : `Hoje às ${event.startsAt}`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ExploreScreen({ navigation }) {
  const { events, selectedEventFilter, setSelectedEventFilter } = useApp();
  const [search, setSearch] = useState("");

  const filtered = events.filter((e) => {
    const matchFilter =
      selectedEventFilter === "Todos" ||
      (selectedEventFilter === "Shows" && e.category === "show") ||
      (selectedEventFilter === "Festas" && e.category === "festa") ||
      (selectedEventFilter === "Bares" && e.category === "bar") ||
      (selectedEventFilter === "Cultura" && e.category === "cultura");
    const matchSearch =
      !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.venue.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const liveEvents = filtered.filter((e) => e.isLive);
  const upcomingEvents = filtered.filter((e) => !e.isLive);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🗺 Perto de você</Text>
          <Text style={styles.headerSub}>
            São Paulo · {liveEvents.length} ao vivo agora
          </Text>
        </View>
        <TouchableOpacity style={styles.headerBtn}>
          <Ionicons name="notifications-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.searchWrapper}>
        <Ionicons
          name="search-outline"
          size={16}
          color={COLORS.textMuted}
          style={{ marginRight: 8 }}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar evento, local, artista..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterBtn,
              selectedEventFilter === f && styles.filterBtnActive,
            ]}
            onPress={() => setSelectedEventFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                selectedEventFilter === f && styles.filterTextActive,
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {liveEvents.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Ao vivo agora</Text>
            {liveEvents.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                onPress={() =>
                  navigation.navigate("EventDetail", { eventId: e.id })
                }
              />
            ))}
          </>
        )}
        {upcomingEvents.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Mais tarde hoje</Text>
            {upcomingEvents.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                onPress={() =>
                  navigation.navigate("EventDetail", { eventId: e.id })
                }
              />
            ))}
          </>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#fff" },
  headerSub: { fontSize: 12, color: "#9FE1CB", marginTop: 2 },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    margin: 12,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  searchInput: { flex: 1, height: 40, fontSize: 14, color: COLORS.text },
  filtersScroll: { maxHeight: 44 },
  filtersContent: { paddingHorizontal: 12, gap: 8, alignItems: "center" },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: { fontSize: 13, color: COLORS.textSecondary },
  filterTextActive: { color: "#fff", fontWeight: "600" },
  scroll: { flex: 1 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginHorizontal: 12,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  cardBanner: { height: 90, padding: 10, justifyContent: "space-between" },
  bannerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.live,
    marginRight: 5,
  },
  liveBadgeText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  couponBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  couponBadgeText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  bannerCategory: { color: "rgba(255,255,255,0.8)", fontSize: 11 },
  cardInfo: { padding: 12 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardName: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  cardMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  ratingBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    marginLeft: 8,
  },
  ratingText: { fontSize: 12, color: COLORS.primaryDark, fontWeight: "600" },
  crowdBarBg: {
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  crowdBarFill: { height: "100%", borderRadius: 4 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: 8 },
  pill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: RADIUS.full },
  pillText: { fontSize: 11, fontWeight: "500" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceText: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  endsText: { fontSize: 12, color: COLORS.textSecondary },
});
