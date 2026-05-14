import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { COLORS, RADIUS } from "../utils/theme";
import { HEATMAP_POINTS } from "../data/mockData";

const { width, height } = Dimensions.get("window");
const MAP_H = height * 0.58;

const FILTROS_VIBE = [
  { key: "todos", label: "Todos" },
  { key: "party", label: "Agitado" },
  { key: "chill", label: "Tranquilo" },
  { key: "intense", label: "Intenso" },
];

const LINHA_TEMPO = [
  { key: "agora", label: "agora", intensidade: 0.85 },
  { key: "-1h", label: "-1h", intensidade: 0.55 },
  { key: "-2h", label: "-2h", intensidade: 0.35 },
];

function PontoCalor({ point, onPress }) {
  const px = point.x * (width - 32);
  const py = point.y * (MAP_H - 60);
  const tamanho = 40 + point.intensity * 60;
  const alpha = Math.floor(point.intensity * 180)
    .toString(16)
    .padStart(2, "0");
  const cor =
    point.intensity > 0.8
      ? "#FF4500"
      : point.intensity > 0.6
        ? "#E83B5C"
        : "#B8296E";

  return (
    <TouchableOpacity
      style={[
        styles.pontoCalor,
        {
          left: px - tamanho / 2,
          top: py - tamanho / 2,
          width: tamanho,
          height: tamanho,
          borderRadius: tamanho / 2,
          backgroundColor: cor + alpha,
          shadowColor: cor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: tamanho / 2,
          elevation: 8,
        },
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.nucleoCalor,
          {
            width: tamanho * 0.35,
            height: tamanho * 0.35,
            borderRadius: tamanho * 0.175,
            backgroundColor: cor,
          },
        ]}
      />
    </TouchableOpacity>
  );
}

function AnelLinhaTempo({ intensidade, label, ativo }) {
  const cor =
    intensidade > 0.7
      ? COLORS.primary
      : intensidade > 0.4
        ? COLORS.purple
        : "#3B82F6";
  const tamanho = 48;
  return (
    <View style={styles.itemLinhaTempo}>
      <Text style={[styles.labelLinhaTempo, ativo && { color: COLORS.text }]}>
        {label}
      </Text>
      <View
        style={[
          styles.anelLinhaTempo,
          {
            width: tamanho,
            height: tamanho,
            borderRadius: tamanho / 2,
            borderColor: cor,
            borderWidth: 3,
            backgroundColor: cor + "22",
          },
        ]}
      >
        <View
          style={[
            styles.nucleoAnel,
            {
              width: tamanho * 0.5,
              height: tamanho * 0.5,
              borderRadius: tamanho * 0.25,
              backgroundColor: cor,
            },
          ]}
        />
      </View>
    </View>
  );
}

export default function HeatmapScreen() {
  const { events } = useApp();
  const [filtroVibe, setFiltroVibe] = useState("todos");
  const [linhaTempo, setLinhaTempo] = useState("agora");
  const [pontoSelecionado, setPontoSelecionado] = useState(null);

  const eventoDestaque =
    events.find((e) => e.isLive && e.capacityPct > 80) || events[0];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="pulse" size={18} color={COLORS.primary} />
          <Text style={styles.logo}>LiveVibe</Text>
        </View>
        <Text style={styles.headerTitulo}>Mapa de Calor</Text>
        <View style={{ flexDirection: "row", gap: 6 }}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons
              name="notifications-outline"
              size={20}
              color={COLORS.text}
            />
            <View style={styles.notifDot} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons
              name="person-circle-outline"
              size={24}
              color={COLORS.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtro de vibe */}
      <View style={styles.filtroWrap}>
        <View style={styles.filtroCard}>
          <Text style={styles.filtroTitulo}>Filtro de Vibe</Text>
          <View style={styles.filtroRow}>
            {FILTROS_VIBE.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.vibePill,
                  filtroVibe === f.key && styles.vibePillAtivo,
                ]}
                onPress={() => setFiltroVibe(f.key)}
              >
                <Text
                  style={[
                    styles.vibePillTexto,
                    filtroVibe === f.key && styles.vibePillTextoAtivo,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Área do mapa */}
      <View style={styles.mapaContainer}>
        <View style={styles.mapaBase}>
          {/* Linhas de grade */}
          {Array.from({ length: 8 }).map((_, i) => (
            <View
              key={`h${i}`}
              style={[
                styles.linhaGrade,
                styles.linhaH,
                { top: `${(i + 1) * 11}%` },
              ]}
            />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <View
              key={`v${i}`}
              style={[
                styles.linhaGrade,
                styles.linhaV,
                { left: `${(i + 1) * 14}%` },
              ]}
            />
          ))}

          {/* Rio simulado */}
          <View style={styles.rio} />

          {/* Pontos de calor */}
          {HEATMAP_POINTS.map((point) => (
            <PontoCalor
              key={point.id}
              point={point}
              onPress={() =>
                setPontoSelecionado(
                  pontoSelecionado?.id === point.id ? null : point,
                )
              }
            />
          ))}

          {/* Popup evento destaque */}
          {!pontoSelecionado && eventoDestaque && (
            <View style={styles.popupDestaque}>
              <View style={styles.popupDestaqueBadge}>
                <Ionicons name="star" size={10} color="#fff" />
                <Text style={styles.popupDestaqueBadgeTexto}>
                  EVENTO EM DESTAQUE
                </Text>
              </View>
              <View style={styles.popupDestaqueCard}>
                <View style={styles.popupDestaqueAvatar}>
                  <Text style={{ fontSize: 14 }}>🎵</Text>
                </View>
                <View>
                  <Text style={styles.popupDestaqueNome}>
                    {eventoDestaque.nowPlaying || eventoDestaque.name}
                  </Text>
                  <Text style={styles.popupDestaqueRole}>
                    Artista em destaque
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Popup ponto selecionado */}
          {pontoSelecionado && (
            <View
              style={[
                styles.popupDestaque,
                { top: pontoSelecionado.y * (MAP_H - 80) - 80 },
              ]}
            >
              <View style={styles.popupDestaqueCard}>
                <Ionicons name="location" size={16} color={COLORS.primary} />
                <View>
                  <Text style={styles.popupDestaqueNome}>
                    {pontoSelecionado.label}
                  </Text>
                  <Text style={styles.popupDestaqueRole}>
                    {Math.round(pontoSelecionado.intensity * 100)}% de atividade
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setPontoSelecionado(null)}
                  style={{ marginLeft: 8 }}
                >
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Legenda Nível de Vibração */}
        <View style={styles.legendaCard}>
          <Text style={styles.legendaTitulo}>Nível de Vibração</Text>
          <View style={styles.legendaBarra} />
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text style={styles.legendaLabel}>Agitado</Text>
            <Text style={styles.legendaLabel}>Tranquilo</Text>
            <Text style={styles.legendaLabel}>Intenso</Text>
          </View>
        </View>

        {/* Linha do tempo */}
        <View style={styles.linhaTempoCard}>
          <Text style={styles.linhaTempoTitulo}>Linha do Tempo</Text>
          <View style={styles.linhaTempoRow}>
            {LINHA_TEMPO.map((t) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => setLinhaTempo(t.key)}
              >
                <AnelLinhaTempo
                  intensidade={t.intensidade}
                  label={t.label}
                  ativo={linhaTempo === t.key}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  logo: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  headerTitulo: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  iconBtn: { padding: 4, position: "relative" },
  notifDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    position: "absolute",
    top: 4,
    right: 2,
    borderWidth: 1,
    borderColor: COLORS.bg,
  },
  filtroWrap: { paddingHorizontal: 16, marginBottom: 8 },
  filtroCard: {
    backgroundColor: COLORS.bgCard + "EE",
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  filtroTitulo: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 8,
  },
  filtroRow: { flexDirection: "row", justifyContent: "center", gap: 8 },
  vibePill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgOverlay,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  vibePillAtivo: {
    backgroundColor: COLORS.primary + "33",
    borderColor: COLORS.primary,
  },
  vibePillTexto: { fontSize: 13, color: COLORS.textSub, fontWeight: "500" },
  vibePillTextoAtivo: { color: COLORS.primaryLight, fontWeight: "700" },
  mapaContainer: { flex: 1, position: "relative" },
  mapaBase: {
    flex: 1,
    backgroundColor: "#111827",
    overflow: "hidden",
    position: "relative",
  },
  linhaGrade: { position: "absolute", backgroundColor: "#1F2A3C" },
  linhaH: { left: 0, right: 0, height: 1 },
  linhaV: { top: 0, bottom: 0, width: 1 },
  rio: {
    position: "absolute",
    width: width * 0.65,
    height: 28,
    backgroundColor: "#1A3A5C",
    borderRadius: 14,
    top: "52%",
    left: "15%",
    transform: [{ rotate: "-8deg" }],
  },
  pontoCalor: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  nucleoCalor: {},
  popupDestaque: { position: "absolute", top: "22%", right: "10%", zIndex: 10 },
  popupDestaqueBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    alignSelf: "flex-end",
    marginBottom: 4,
  },
  popupDestaqueBadgeTexto: {
    fontSize: 9,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  popupDestaqueCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.bgCard + "F0",
    borderRadius: RADIUS.lg,
    padding: 10,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    minWidth: 150,
  },
  popupDestaqueAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgOverlay,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  popupDestaqueNome: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  popupDestaqueRole: { fontSize: 11, color: COLORS.textSub },
  legendaCard: {
    position: "absolute",
    bottom: 90,
    left: 16,
    backgroundColor: COLORS.bgCard + "F0",
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    width: 180,
  },
  legendaTitulo: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  legendaBarra: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
    backgroundColor: COLORS.primary,
  },
  legendaLabel: { fontSize: 10, color: COLORS.textMuted },
  linhaTempoCard: {
    position: "absolute",
    bottom: 80,
    right: 16,
    backgroundColor: COLORS.bgCard + "F0",
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  linhaTempoTitulo: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 10,
    textAlign: "center",
  },
  linhaTempoRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  itemLinhaTempo: { alignItems: "center", gap: 4 },
  labelLinhaTempo: { fontSize: 11, color: COLORS.textMuted, fontWeight: "500" },
  anelLinhaTempo: { justifyContent: "center", alignItems: "center" },
  nucleoAnel: {},
});
