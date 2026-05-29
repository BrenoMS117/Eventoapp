import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  Alert,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { useNotifications } from "../hooks/useNotifications";
import { eventsService } from "../services/eventsService";
import { COLORS, RADIUS } from "../utils/theme";
import NotificationsModal from "./NotificationsModal";

const { width } = Dimensions.get("window");
const CARD_W = width * 0.68;

function fmtData(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", weekday: "short" });
}
function fmtHora(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
function isGratuito(price) {
  if (price === null || price === undefined || price === "" || price === "Gratuito") return true;
  const n = parseFloat(String(price).replace(",", "."));
  return isNaN(n) || n === 0;
}
function fmtPreco(price) {
  if (isGratuito(price)) return "Gratuito";
  const n = parseFloat(String(price).replace(",", "."));
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const CATEGORIAS = [
  { key: "todos",    label: "Todos"       },
  { key: "art",      label: "Arte"        },
  { key: "bar",      label: "Bar"         },
  { key: "cultura",  label: "Cultura"     },
  { key: "electro",  label: "Eletrônico"  },
  { key: "festival", label: "Festival"    },
  { key: "rave",     label: "Rave"        },
  { key: "concert",  label: "Show"        },
  { key: "teatro",   label: "Teatro"      },
];


export default function ExploreScreen({ navigation }) {
  const { logout } = useApp();
  const { unreadCount } = useNotifications();
  const [cat, setCat] = useState("todos");
  const [busca, setBusca] = useState("");
  const [filtrados, setFiltrados] = useState([]);
  const [notifVisible, setNotifVisible] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchFiltered, busca ? 400 : 0);
    return () => clearTimeout(debounceRef.current);
  }, [busca, cat]);

  async function fetchFiltered() {
    const result = await eventsService.search(busca.trim(), cat);
    if (result.data) setFiltrados(result.data);
  }

  const heroEvento = filtrados.find((e) => e.isLive) || filtrados[0];

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="pulse" size={20} color={COLORS.primary} />
          <Text style={s.logo}>LiveVibe</Text>
        </View>
        <TouchableOpacity style={s.iconBtn} onPress={() => setNotifVisible(true)}>
          <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
          {unreadCount > 0 && (
            <View style={s.notifBadge}>
              <Text style={s.notifBadgeText}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <NotificationsModal visible={notifVisible} onClose={() => setNotifVisible(false)} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 16,
            marginBottom: 12,
          }}
        >
          <Text style={s.titulo}>Explorar Eventos</Text>
        </View>

        <View style={s.buscaBox}>
          <Ionicons
            name="search-outline"
            size={16}
            color={COLORS.textMuted}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={s.buscaInput}
            placeholder="Buscar eventos, locais, artistas..."
            placeholderTextColor={COLORS.textMuted}
            value={busca}
            onChangeText={setBusca}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.cats}
        >
          {CATEGORIAS.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[s.catPill, cat === c.key && s.catPillOn]}
              onPress={() => setCat(c.key)}
            >
              <Text style={[s.catTexto, cat === c.key && s.catTextoOn]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Destaque ── */}
        {heroEvento && (
          <View style={{ marginHorizontal: 16, marginBottom: 6 }}>
            <TouchableOpacity
              style={s.hero}
              onPress={() =>
                navigation.navigate("EventDetail", { eventId: heroEvento.id })
              }
              activeOpacity={0.92}
            >
              {heroEvento.coverPhoto ? (
                <Image
                  source={{ uri: heroEvento.coverPhoto }}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    { backgroundColor: heroEvento.gradient[0] },
                  ]}
                />
              )}
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: "rgba(0,0,0,0.5)" },
                ]}
              />
              <View style={s.heroContent}>
                {heroEvento.isLive && (
                  <View style={s.liveBadge}>
                    <View style={s.liveDot} />
                    <Text style={s.liveTexto}>AO VIVO</Text>
                  </View>
                )}
                <Text style={s.heroNome}>{heroEvento.name}</Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  <View
                    style={[
                      s.capDot,
                      {
                        backgroundColor:
                          heroEvento.capacityPct > 80
                            ? "#FF4500"
                            : COLORS.success,
                      },
                    ]}
                  />
                  <Text
                    style={{ fontSize: 12, color: "#fff", fontWeight: "600" }}
                  >
                    {heroEvento.capacityPct}% LOTAÇÃO
                  </Text>

                </View>
                <TouchableOpacity style={s.ingressoBtn}>
                  <Text style={s.ingressoBtnTexto}>VER DETALHES</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
                marginTop: 10,
              }}
            >
            </View>
          </View>
        )}

        {/* ── Cartões ── */}
        <View style={{ marginTop: 4 }}>
          <Text style={[s.secaoTitulo, { marginLeft: 16 }]}>
            Acontecendo Agora
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          >
            {filtrados.map((e) => {
              return (
                <TouchableOpacity
                  key={e.id}
                  style={s.eventoCard}
                  onPress={() =>
                    navigation.navigate("EventDetail", { eventId: e.id })
                  }
                  activeOpacity={0.88}
                >
                  <View style={s.eventoCardTopo}>
                    {e.coverPhoto ? (
                      <Image
                        source={{ uri: e.coverPhoto }}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={[
                          StyleSheet.absoluteFillObject,
                          { backgroundColor: e.gradient[0] + "CC" },
                        ]}
                      />
                    )}
                    <View
                      style={[
                        StyleSheet.absoluteFillObject,
                        { backgroundColor: "rgba(0,0,0,0.25)" },
                      ]}
                    />
                    {e.isLive && (
                      <View style={s.liveSmall}>
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "800",
                            color: "#fff",
                          }}
                        >
                          Ao Vivo
                        </Text>
                      </View>
                    )}
                    {(e.photos?.length || 0) > 0 && (
                      <View style={s.photoCount}>
                        <Ionicons
                          name="images-outline"
                          size={10}
                          color="#fff"
                        />
                        <Text style={s.photoCountTexto}>{e.photos.length}</Text>
                      </View>
                    )}
                  </View>
                  <View style={s.eventoCardCorpo}>
                    <Text style={s.eventoCardNome} numberOfLines={1}>
                      {e.name}
                    </Text>
                    <Text style={s.eventoCardSub} numberOfLines={1}>
                      {e.venue}
                    </Text>

                    <View style={s.cardDivider} />

                    {/* Data e horário */}
                    {e.startsAt && (
                      <View style={s.cardInfoRow}>
                        <Ionicons name="time-outline" size={13} color={COLORS.primary} />
                        <Text style={s.cardInfoTexto}>
                          {fmtData(e.startsAt)} · {fmtHora(e.startsAt)}
                          {e.endsAt ? ` – ${fmtHora(e.endsAt)}` : ""}
                        </Text>
                      </View>
                    )}

                    {/* Preço + faixa etária + categoria */}
                    <View style={s.cardFooterRow}>
                      <View style={[s.precoBadge, isGratuito(e.price) && s.precoBadgeFree]}>
                        <Text style={[s.precoTexto, isGratuito(e.price) && s.precoTextoFree]}>
                          {fmtPreco(e.price)}
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
                        {e.ageRestriction && (
                          <View style={s.ageBadge}>
                            <Text style={s.ageTexto}>{e.ageRestriction}</Text>
                          </View>
                        )}
                        {e.categoryLabel && (
                          <Text style={s.catTagTexto} numberOfLines={1}>{e.categoryLabel}</Text>
                        )}
                      </View>
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

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  logo: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  iconBtn: { padding: 6, position: "relative" },
  notifBadge: {
    position: "absolute", top: 2, right: 2,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    minWidth: 16, height: 16,
    justifyContent: "center", alignItems: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: COLORS.bg,
  },
  notifBadgeText: { fontSize: 9, fontWeight: "800", color: "#fff" },
  titulo: { fontSize: 22, fontWeight: "800", color: COLORS.text },
  filtroPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgElevated,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  buscaBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgCard,
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  buscaInput: { flex: 1, fontSize: 14, color: COLORS.text },
  cats: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  catPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  catPillOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catTexto: { fontSize: 13, color: COLORS.textSub, fontWeight: "500" },
  catTextoOn: { color: "#fff", fontWeight: "700" },
  hero: {
    height: 220,
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  heroContent: { padding: 18 },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.danger,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  liveTexto: {
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1,
  },
  heroNome: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  capDot: { width: 8, height: 8, borderRadius: 4 },
  ingressoBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
    alignSelf: "flex-start",
  },
  ingressoBtnTexto: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.bg,
    letterSpacing: 0.5,
  },
  dot: {
    width: 20,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  dotAtivo: { backgroundColor: COLORS.primary, width: 32 },
  secaoTitulo: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 12,
  },
  eventoCard: {
    width: CARD_W,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  eventoCardTopo: {
    height: 110,
    position: "relative",
    justifyContent: "flex-end",
    padding: 8,
  },
  liveSmall: {
    backgroundColor: COLORS.danger + "EE",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    alignSelf: "flex-start",
  },
  photoCount: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  photoCountTexto: { fontSize: 10, color: "#fff", fontWeight: "600" },
  eventoCardCorpo: { padding: 12 },
  eventoCardNome: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.text,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  eventoCardSub: { fontSize: 12, color: COLORS.textSub, marginBottom: 6 },
  cardDivider: {
    height: 0.5,
    backgroundColor: COLORS.border,
    marginBottom: 8,
  },
  cardInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 8,
  },
  cardInfoTexto: { fontSize: 12, color: COLORS.textSub, fontWeight: "500", flex: 1 },
  cardFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  precoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary + "22",
    borderWidth: 0.5,
    borderColor: COLORS.primary + "55",
  },
  precoBadgeFree: {
    backgroundColor: COLORS.success + "22",
    borderColor: COLORS.success + "55",
  },
  precoTexto: { fontSize: 12, fontWeight: "800", color: COLORS.primary },
  precoTextoFree: { color: COLORS.success },
  ageBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgElevated,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  ageTexto: { fontSize: 11, fontWeight: "700", color: COLORS.textSub },
  catTagTexto: { fontSize: 11, color: COLORS.textMuted },
});
