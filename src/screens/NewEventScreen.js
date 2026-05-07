import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { COLORS, RADIUS, SHADOW } from "../utils/theme";
import { FieldInput } from "../components/FieldInput";
import { validate } from "../utils/validation";

const CATEGORIES = [
  { key: "show", label: "Show", icon: "🎸" },
  { key: "festa", label: "Festa", icon: "🎉" },
  { key: "bar", label: "Bar", icon: "🍺" },
  { key: "cultura", label: "Cultura", icon: "🎨" },
  { key: "teatro", label: "Teatro", icon: "🎭" },
  { key: "esporte", label: "Esporte", icon: "⚽" },
  { key: "gastronomia", label: "Gastro", icon: "🍕" },
  { key: "musica", label: "Música", icon: "🎵" },
];

const GRADIENTS = [
  { colors: ["#1D9E75", "#085041"], label: "Verde" },
  { colors: ["#533AB7", "#26215C"], label: "Roxo" },
  { colors: ["#D85A30", "#4A1B0C"], label: "Laranja" },
  { colors: ["#378ADD", "#0C447C"], label: "Azul" },
  { colors: ["#C0392B", "#7B241C"], label: "Vermelho" },
  { colors: ["#8E44AD", "#5B2C6F"], label: "Violeta" },
];

const STEPS = ["Básico", "Local", "Detalhes", "Revisar"];
const AGE_OPTIONS = ["Livre", "14+", "16+", "18+"];

export default function NewEventScreen({ navigation }) {
  const { addEvent, currentUser } = useApp();
  const [step, setStep] = useState(0);

  // Step 0
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Step 1
  const [venue, setVenue] = useState(currentUser?.venueName || "");
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("São Paulo");

  // Step 2
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [freeEntry, setFreeEntry] = useState(false);
  const [accessible, setAccessible] = useState(false);
  const [accessibilityNotes, setAccessibilityNotes] = useState("");
  const [artist, setArtist] = useState("");
  const [ageRestriction, setAgeRestriction] = useState("Livre");
  const [selectedGradient, setSelectedGradient] = useState(0);

  // Errors & touched per step
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  function getErr(f) {
    return touched[f] ? errors[f] : "";
  }

  function touch(f, val) {
    setTouched((p) => ({ ...p, [f]: true }));
    setErrors((p) => ({ ...p, [f]: getFieldValidation(f, val) }));
  }

  function getFieldValidation(f, val) {
    const v =
      val !== undefined
        ? val
        : { name, category, date, startTime, address, price }[f];
    if (f === "name") return validate.minLength(v, 3, "Nome do evento");
    if (f === "category") return v ? "" : "Selecione uma categoria.";
    if (f === "date") return validate.date(v);
    if (f === "startTime") return validate.time(v);
    if (f === "endTime") return v ? validate.time(v) : ""; // opcional
    if (f === "address") return validate.required(v, "Endereço");
    if (f === "price" && !freeEntry) return validate.required(v, "Valor");
    return "";
  }

  function validateStep0() {
    const e = {
      name: getFieldValidation("name", name),
      category: getFieldValidation("category", category),
      date: getFieldValidation("date", date),
      startTime: getFieldValidation("startTime", startTime),
      endTime: getFieldValidation("endTime", endTime),
    };
    setErrors((p) => ({ ...p, ...e }));
    setTouched((p) => ({
      ...p,
      name: true,
      category: true,
      date: true,
      startTime: true,
      endTime: true,
    }));
    return !Object.values(e).some(Boolean);
  }

  function validateStep1() {
    const e = { address: getFieldValidation("address", address) };
    setErrors((p) => ({ ...p, ...e }));
    setTouched((p) => ({ ...p, address: true }));
    return !e.address;
  }

  function validateStep2() {
    if (!freeEntry && !price.trim()) {
      setErrors((p) => ({
        ...p,
        price: 'Informe o valor ou marque "Entrada gratuita".',
      }));
      setTouched((p) => ({ ...p, price: true }));
      return false;
    }
    return true;
  }

  function handleNext() {
    if (step === 0 && !validateStep0()) return;
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => s + 1);
  }

  function handleSubmit() {
    const catInfo = CATEGORIES.find((c) => c.key === category);
    addEvent({
      name: name.trim(),
      venue: venue.trim() || currentUser?.venueName || "Meu estabelecimento",
      address: `${address.trim()}${neighborhood ? ` - ${neighborhood.trim()}` : ""}`,
      category,
      categoryLabel: catInfo?.label || category,
      startsAt: startTime,
      endsAt: endTime || null,
      price: freeEntry ? "Gratuito" : price.trim(),
      accessible,
      accessibilityNotes: accessible ? accessibilityNotes.trim() : null,
      nowPlaying: null,
      nextAct: artist.trim() || null,
      description: description.trim(),
      distanceKm: 0.5,
      gradient: GRADIENTS[selectedGradient].colors,
      ageRestriction,
    });
    Alert.alert(
      "🎉 Evento criado!",
      `"${name}" foi publicado. Usuários próximos já podem visualizá-lo!`,
      [{ text: "Ótimo!", onPress: () => navigation.goBack() }],
    );
  }

  const catInfo = CATEGORIES.find((c) => c.key === category);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            step > 0 ? setStep((s) => s - 1) : navigation.goBack()
          }
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo evento</Text>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>
            {step + 1}/{STEPS.length}
          </Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${((step + 1) / STEPS.length) * 100}%` },
          ]}
        />
      </View>

      <View style={styles.stepTabs}>
        {STEPS.map((s, i) => (
          <View key={s} style={styles.stepTab}>
            <View
              style={[
                styles.stepDot,
                i <= step && styles.stepDotActive,
                i < step && styles.stepDotDone,
              ]}
            >
              {i < step ? (
                <Ionicons name="checkmark" size={10} color="#fff" />
              ) : (
                <Text
                  style={[styles.stepDotText, i === step && { color: "#fff" }]}
                >
                  {i + 1}
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                i === step && { color: COLORS.primary, fontWeight: "600" },
              ]}
            >
              {s}
            </Text>
          </View>
        ))}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* STEP 0 */}
          {step === 0 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Informações básicas</Text>

              <FieldInput
                label="Nome do evento"
                required
                icon="megaphone-outline"
                value={name}
                onChangeText={(v) => {
                  setName(v);
                  touch("name", v);
                }}
                error={getErr("name")}
                placeholder="Ex: Jazz no Beco do Batman"
                maxLength={60}
                autoCapitalize="words"
              />

              <Text style={styles.fieldLabel}>
                Categoria <Text style={{ color: COLORS.danger }}>*</Text>
              </Text>
              {getErr("category") ? (
                <Text style={styles.inlineError}>{getErr("category")}</Text>
              ) : null}
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.categoryBtn,
                      category === cat.key && styles.categoryBtnActive,
                    ]}
                    onPress={() => {
                      setCategory(cat.key);
                      touch("category", cat.key);
                    }}
                  >
                    <Text style={styles.categoryBtnIcon}>{cat.icon}</Text>
                    <Text
                      style={[
                        styles.categoryBtnLabel,
                        category === cat.key && {
                          color: COLORS.primary,
                          fontWeight: "600",
                        },
                      ]}
                    >
                      {cat.label}
                    </Text>
                    {category === cat.key && (
                      <View style={styles.categoryCheck}>
                        <Ionicons name="checkmark" size={8} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <FieldInput
                label="Data"
                required
                icon="calendar-outline"
                value={date}
                onChangeText={(v) => {
                  setDate(v);
                  touch("date", v);
                }}
                error={getErr("date")}
                placeholder="DD/MM/AAAA"
                keyboardType="numbers-and-punctuation"
                autoCapitalize="none"
                hint="Formato: DD/MM/AAAA"
              />

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <FieldInput
                    label="Início"
                    required
                    icon="time-outline"
                    value={startTime}
                    onChangeText={(v) => {
                      setStartTime(v);
                      touch("startTime", v);
                    }}
                    error={getErr("startTime")}
                    placeholder="20:00"
                    keyboardType="numbers-and-punctuation"
                    autoCapitalize="none"
                    hint="HH:MM"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <FieldInput
                    label="Término"
                    icon="time-outline"
                    value={endTime}
                    onChangeText={(v) => {
                      setEndTime(v);
                      touch("endTime", v);
                    }}
                    error={getErr("endTime")}
                    placeholder="02:00"
                    keyboardType="numbers-and-punctuation"
                    autoCapitalize="none"
                    hint="Opcional"
                  />
                </View>
              </View>
            </View>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Local do evento</Text>

              <FieldInput
                label="Nome do local"
                icon="business-outline"
                value={venue}
                onChangeText={setVenue}
                placeholder={currentUser?.venueName || "Nome do bar/venue"}
                autoCapitalize="words"
              />

              <FieldInput
                label="Endereço"
                required
                icon="location-outline"
                value={address}
                onChangeText={(v) => {
                  setAddress(v);
                  touch("address", v);
                }}
                error={getErr("address")}
                placeholder="Rua, número"
                autoCapitalize="words"
              />

              <FieldInput
                label="Bairro"
                icon="map-outline"
                value={neighborhood}
                onChangeText={setNeighborhood}
                placeholder="Ex: Vila Madalena"
                autoCapitalize="words"
              />

              <FieldInput
                label="Cidade"
                icon="pin-outline"
                value={city}
                onChangeText={setCity}
                placeholder="São Paulo"
                autoCapitalize="words"
              />
            </View>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Detalhes do evento</Text>

              <FieldInput
                label="Descrição"
                icon="document-text-outline"
                value={description}
                onChangeText={setDescription}
                placeholder="Descreva o evento, atrações..."
                multiline
                maxLength={300}
                hint={`${description.length}/300`}
              />

              <FieldInput
                label="Artista / Atração principal"
                icon="musical-notes-outline"
                value={artist}
                onChangeText={setArtist}
                placeholder="Ex: DJ Alok, Banda X..."
                autoCapitalize="words"
              />

              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchLabel}>Entrada gratuita</Text>
                  <Text style={styles.switchSub}>Sem cobrança de ingresso</Text>
                </View>
                <Switch
                  value={freeEntry}
                  onValueChange={(v) => {
                    setFreeEntry(v);
                    if (v) setErrors((p) => ({ ...p, price: "" }));
                  }}
                  trackColor={{ true: COLORS.primary }}
                  thumbColor="#fff"
                />
              </View>

              {!freeEntry && (
                <FieldInput
                  label="Valor da entrada"
                  required
                  icon="cash-outline"
                  value={price}
                  onChangeText={(v) => {
                    setPrice(v);
                    touch("price", v);
                  }}
                  error={getErr("price")}
                  placeholder="Ex: R$ 30,00"
                  keyboardType="numeric"
                  autoCapitalize="none"
                />
              )}

              <Text style={styles.fieldLabel}>Faixa etária</Text>
              <View style={styles.ageRow}>
                {AGE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.ageBtn,
                      ageRestriction === opt && styles.ageBtnActive,
                    ]}
                    onPress={() => setAgeRestriction(opt)}
                  >
                    <Text
                      style={[
                        styles.ageBtnText,
                        ageRestriction === opt && { color: "#fff" },
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchLabel}>♿ Acessível</Text>
                  <Text style={styles.switchSub}>
                    Rampa, banheiro adaptado etc.
                  </Text>
                </View>
                <Switch
                  value={accessible}
                  onValueChange={setAccessible}
                  trackColor={{ true: COLORS.primary }}
                  thumbColor="#fff"
                />
              </View>

              {accessible && (
                <FieldInput
                  label="Detalhes de acessibilidade"
                  icon="accessibility-outline"
                  value={accessibilityNotes}
                  onChangeText={setAccessibilityNotes}
                  placeholder="Ex: Rampa lateral + banheiro adaptado"
                  autoCapitalize="sentences"
                />
              )}

              <Text style={styles.fieldLabel}>Cor do card</Text>
              <View style={styles.gradientRow}>
                {GRADIENTS.map((g, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.gradientDot,
                      { backgroundColor: g.colors[0] },
                      selectedGradient === i && styles.gradientDotActive,
                    ]}
                    onPress={() => setSelectedGradient(i)}
                  >
                    {selectedGradient === i && (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* STEP 3 - Review */}
          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Revisar e publicar</Text>
              <View style={styles.previewCard}>
                <View
                  style={[
                    styles.previewBanner,
                    { backgroundColor: GRADIENTS[selectedGradient].colors[0] },
                  ]}
                >
                  <Text style={styles.previewBannerDate}>
                    📅 {date} às {startTime}
                    {endTime ? ` — ${endTime}` : ""}
                  </Text>
                  <Text style={styles.previewBannerCat}>
                    {catInfo?.icon} {catInfo?.label}
                  </Text>
                </View>
                <View style={{ padding: 14 }}>
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: "700",
                      color: COLORS.text,
                      marginBottom: 4,
                    }}
                  >
                    {name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: COLORS.textSecondary,
                      marginBottom: 8,
                    }}
                  >
                    📍 {venue || "Local"}
                    {neighborhood ? ` · ${neighborhood}` : ""}
                  </Text>
                  {description ? (
                    <Text
                      style={{
                        fontSize: 13,
                        color: COLORS.textSecondary,
                        lineHeight: 18,
                        marginBottom: 10,
                      }}
                      numberOfLines={3}
                    >
                      {description}
                    </Text>
                  ) : null}
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}
                  >
                    <View style={styles.previewPill}>
                      <Text style={styles.previewPillText}>
                        {freeEntry ? "🎟 Gratuito" : `🎟 ${price}`}
                      </Text>
                    </View>
                    {accessible && (
                      <View
                        style={[
                          styles.previewPill,
                          { backgroundColor: COLORS.primaryLight },
                        ]}
                      >
                        <Text
                          style={[
                            styles.previewPillText,
                            { color: COLORS.primaryDark },
                          ]}
                        >
                          ♿ Acessível
                        </Text>
                      </View>
                    )}
                    <View style={styles.previewPill}>
                      <Text style={styles.previewPillText}>
                        🔞 {ageRestriction}
                      </Text>
                    </View>
                    {artist ? (
                      <View
                        style={[
                          styles.previewPill,
                          { backgroundColor: COLORS.purpleLight },
                        ]}
                      >
                        <Text
                          style={[
                            styles.previewPillText,
                            { color: COLORS.purple },
                          ]}
                        >
                          🎤 {artist}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>

              <View style={styles.summaryCard}>
                {[
                  ["Evento", name],
                  ["Categoria", `${catInfo?.icon} ${catInfo?.label}`],
                  ["Data", date],
                  ["Horário", `${startTime}${endTime ? ` – ${endTime}` : ""}`],
                  [
                    "Endereço",
                    `${address}${neighborhood ? `, ${neighborhood}` : ""}`,
                  ],
                  ["Entrada", freeEntry ? "Gratuito" : price],
                  ["Faixa etária", ageRestriction],
                  [
                    "Acessível",
                    accessible
                      ? `Sim${accessibilityNotes ? ` — ${accessibilityNotes}` : ""}`
                      : "Não",
                  ],
                ].map(([label, val]) => (
                  <View key={label} style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{label}</Text>
                    <Text style={styles.summaryValue} numberOfLines={2}>
                      {val || "—"}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.notifInfo}>
                <Ionicons
                  name="notifications"
                  size={18}
                  color={COLORS.primary}
                />
                <Text
                  style={{
                    flex: 1,
                    fontSize: 13,
                    color: COLORS.primaryDark,
                    lineHeight: 18,
                  }}
                >
                  Usuários próximos serão notificados assim que o evento for
                  publicado.
                </Text>
              </View>
            </View>
          )}
          <View style={{ height: 20 }} />
        </ScrollView>

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
  header: {
    backgroundColor: COLORS.primaryDark,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 14,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    marginLeft: 10,
    fontSize: 17,
    fontWeight: "600",
    color: "#fff",
  },
  stepBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  stepBadgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  progressBar: { height: 3, backgroundColor: COLORS.border },
  progressFill: { height: "100%", backgroundColor: COLORS.primary },
  stepTabs: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  stepTab: { flex: 1, alignItems: "center", gap: 4 },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  stepDotActive: { backgroundColor: COLORS.primary },
  stepDotDone: { backgroundColor: COLORS.success },
  stepDotText: { fontSize: 11, fontWeight: "700", color: COLORS.textMuted },
  stepLabel: { fontSize: 10, color: COLORS.textMuted },
  stepContent: { padding: 16 },
  stepTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginTop: 4,
  },
  inlineError: { fontSize: 12, color: COLORS.danger, marginBottom: 6 },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  categoryBtn: {
    width: "22%",
    aspectRatio: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    position: "relative",
  },
  categoryBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight + "88",
  },
  categoryBtnIcon: { fontSize: 22 },
  categoryBtnLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: 3 },
  categoryCheck: {
    position: "absolute",
    top: 3,
    right: 3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  switchLabel: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  switchSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  ageRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  ageBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  ageBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  ageBtnText: { fontSize: 13, color: COLORS.text, fontWeight: "500" },
  gradientRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  gradientDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  gradientDotActive: { borderWidth: 3, borderColor: COLORS.text },
  previewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: COLORS.border,
    marginBottom: 14,
    ...SHADOW.md,
  },
  previewBanner: { padding: 14 },
  previewBannerDate: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 4,
  },
  previewBannerCat: { fontSize: 13, color: "#fff", fontWeight: "600" },
  previewPill: {
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  previewPillText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    overflow: "hidden",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  summaryLabel: { fontSize: 13, color: COLORS.textSecondary, flex: 0.4 },
  summaryValue: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    flex: 0.6,
    textAlign: "right",
  },
  notifInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    padding: 12,
  },
  bottomBar: {
    padding: 14,
    backgroundColor: COLORS.surface,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  nextBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 15,
    alignItems: "center",
  },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  publishBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 15,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  publishBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
