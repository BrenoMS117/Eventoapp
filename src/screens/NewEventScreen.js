import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  View,
  Text,
  TextInput,
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
import { PhotoManager } from "../components/ImageCarousel";
import { geoService } from "../services/geo/GeoService";
import { EventSchema, validateDate, validateEndTime, isOvernight } from "../validation/EventSchema";

const CATEGORIAS = [
  { key: "rave", label: "Rave", icon: "🎧" },
  { key: "concert", label: "Show", icon: "🎸" },
  { key: "festival", label: "Festival", icon: "🎪" },
  { key: "art", label: "Arte", icon: "🎨" },
  { key: "electro", label: "Eletrônico", icon: "⚡" },
  { key: "bar", label: "Bar", icon: "🍺" },
  { key: "teatro", label: "Teatro", icon: "🎭" },
  { key: "cultura", label: "Cultura", icon: "🏛" },
];

const GRADIENTES = [
  { colors: ["#E83B5C", "#7B2FBE"] },
  { colors: ["#B8296E", "#26215C"] },
  { colors: ["#FF4500", "#E83B5C"] },
  { colors: ["#1E40AF", "#3B82F6"] },
  { colors: ["#059669", "#10B981"] },
  { colors: ["#8E44AD", "#5B2C6F"] },
];

const FAIXAS_ETARIAS = ["Livre", "14+", "16+", "18+"];
const ETAPAS = ["Básico", "Local", "Fotos", "Detalhes", "Revisar"];

function maskDate(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function maskTime(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function IndicadorEtapa({ atual }) {
  return (
    <View style={s.etapaRow}>
      {ETAPAS.map((label, i) => {
        const feito = i < atual;
        const ativo = i === atual;
        const cor = feito ? COLORS.success : ativo ? COLORS.primary : COLORS.textMuted;
        return (
          <React.Fragment key={label}>
            <View style={s.etapaItem}>
              <View
                style={[
                  s.etapaDot,
                  {
                    backgroundColor: feito ? COLORS.success : ativo ? COLORS.primary : COLORS.bgOverlay,
                    borderColor: cor,
                  },
                ]}
              >
                {feito ? (
                  <Ionicons name="checkmark" size={10} color="#fff" />
                ) : (
                  <Text style={[s.etapaDotNum, { color: ativo ? "#fff" : COLORS.textMuted }]}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text style={[s.etapaLabel, { color: cor }]}>{label}</Text>
            </View>
            {i < ETAPAS.length - 1 && (
              <View
                style={[s.etapaLinha, { backgroundColor: feito ? COLORS.success : COLORS.bgOverlay }]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

export default function NewEventScreen({ navigation }) {
  const { addEvent, addEventPhoto, currentUser } = useApp();
  const [etapa, setEtapa] = useState(0);
  const [fotos, setFotos] = useState([]);
  const [publicando, setPublicando] = useState(false);
  const [geoCoords, setGeoCoords] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('idle');

  const {
    control,
    watch,
    trigger,
    getValues,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nome: "",
      categoria: "",
      data: "",
      horarioInicio: "",
      horarioFim: "",
      venue: currentUser?.venueName || "",
      endereco: "",
      bairro: "",
      cidade: "São Paulo",
      descricao: "",
      preco: "",
      entrada_gratis: false,
      acessivel: false,
      notasAcessibilidade: "",
      artista: "",
      faixaEtaria: "Livre",
      gradienteIdx: 0,
    },
  });

  const nome = watch("nome");
  const descricao = watch("descricao");
  const categoria = watch("categoria");
  const gradienteIdx = watch("gradienteIdx");
  const entrada_gratis = watch("entrada_gratis");
  const acessivel = watch("acessivel");

  const camposPorEtapa = {
    0: ["nome", "categoria", "data", "horarioInicio"],
    1: ["endereco"],
    2: [],
    3: entrada_gratis ? [] : ["preco"],
  };

  async function avancar() {
    const valid = await trigger(camposPorEtapa[etapa]);
    if (valid) setEtapa((s) => s + 1);
  }

  async function handleUseCurrentLocation() {
    setGpsStatus('loading');
    const { coords, error } = await geoService.getPosition();
    if (!coords) {
      setGpsStatus('error');
      return;
    }
    setGeoCoords(coords);
    const address = await geoService.reverseGeocodeCoords(coords);
    if (address) {
      if (address.street) setValue('endereco', address.street);
      if (address.district) setValue('bairro', address.district);
      if (address.city) setValue('cidade', address.city);
    }
    setGpsStatus('found');
  }

  async function publicar() {
    const v = getValues();
    const { isValid, errors: schemaErrors } = EventSchema.validate({
      name: v.nome,
      category: v.categoria,
      date: v.data,
      startsAt: v.horarioInicio,
      endsAt: v.horarioFim,
      address: v.endereco,
      isFree: v.entrada_gratis,
      price: v.preco,
    });
    if (!isValid) {
      Alert.alert("Verifique os dados", Object.values(schemaErrors)[0]);
      return;
    }

    setPublicando(true);
    try {
      const catInfo = CATEGORIAS.find((c) => c.key === v.categoria);
      const created = await addEvent({
        name: v.nome.trim(),
        venue: v.venue.trim() || currentUser?.venueName || "Meu estabelecimento",
        address: `${v.endereco.trim()}${v.bairro ? ` - ${v.bairro.trim()}` : ""}`,
        category: v.categoria,
        categoryLabel: catInfo?.label || v.categoria,
        startsAt: v.horarioInicio,
        endsAt: v.horarioFim || null,
        price: v.entrada_gratis ? "Gratuito" : v.preco.trim(),
        accessible: v.acessivel,
        accessibilityNotes: v.acessivel ? v.notasAcessibilidade.trim() : null,
        nowPlaying: null,
        nextAct: v.artista.trim() || null,
        description: v.descricao.trim(),
        distanceKm: 0.5,
        gradient: GRADIENTES[v.gradienteIdx].colors,
        ageRestriction: v.faixaEtaria,
        lat: geoCoords?.lat ?? null,
        lng: geoCoords?.lng ?? null,
      });

      if (!created) {
        Alert.alert("Erro", "Não foi possível publicar o evento. Verifique sua conexão e tente novamente.");
        return;
      }

      // Upload photos sequentially after the event is created.
      for (const uri of fotos) {
        await addEventPhoto(created.id, uri);
      }

      if (Platform.OS === "web") {
        window.alert(`Evento "${v.nome}" publicado com sucesso!`);
        navigation.goBack();
      } else {
        Alert.alert(
          "🚀 Evento publicado!",
          `"${v.nome}" está no ar! Usuários próximos já podem visualizá-lo.`,
          [{ text: "Ótimo!", onPress: () => navigation.goBack() }],
        );
      }
    } finally {
      setPublicando(false);
    }
  }

  const catInfo = CATEGORIAS.find((c) => c.key === categoria);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <TouchableOpacity
          style={s.voltarBtn}
          onPress={() => (etapa > 0 ? setEtapa((s) => s - 1) : navigation.goBack())}
        >
          <Ionicons name="chevron-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={s.headerTitulo}>Novo Evento</Text>
        <View style={s.etapaBadge}>
          <Text style={s.etapaBadgeTexto}>
            {etapa + 1}/{ETAPAS.length}
          </Text>
        </View>
      </View>

      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${((etapa + 1) / ETAPAS.length) * 100}%` }]} />
      </View>

      <View style={s.indicadorWrap}>
        <IndicadorEtapa atual={etapa} />
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
          {/* ETAPA 0 — Básico */}
          {etapa === 0 && (
            <View style={s.etapaConteudo}>
              <Text style={s.etapaTitulo}>Informações Básicas</Text>

              <Text style={s.fieldLabel}>
                Nome do evento <Text style={{ color: COLORS.primary }}>*</Text>
              </Text>
              <Controller
                control={control}
                name="nome"
                rules={{
                  validate: (v) =>
                    v.trim().length >= 3 || "Nome precisa ter ao menos 3 caracteres.",
                }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[s.input, errors.nome && s.inputErro]}
                    placeholder="Ex: FESTIVAL OF LIGHTS"
                    placeholderTextColor={COLORS.textMuted}
                    value={value}
                    onChangeText={onChange}
                    maxLength={60}
                    autoCapitalize="characters"
                  />
                )}
              />
              {errors.nome && <Text style={s.erroTexto}>{errors.nome.message}</Text>}
              <Text style={s.charCount}>{nome.length}/60</Text>

              <Text style={s.fieldLabel}>
                Categoria <Text style={{ color: COLORS.primary }}>*</Text>
              </Text>
              {errors.categoria && (
                <Text style={s.erroTexto}>{errors.categoria.message}</Text>
              )}
              <Controller
                control={control}
                name="categoria"
                rules={{ validate: (v) => !!v || "Selecione uma categoria." }}
                render={({ field: { onChange, value } }) => (
                  <View style={s.categoriaGrid}>
                    {CATEGORIAS.map((cat) => (
                      <TouchableOpacity
                        key={cat.key}
                        style={[s.catBtn, value === cat.key && s.catBtnAtivo]}
                        onPress={() => onChange(cat.key)}
                      >
                        <Text style={s.catBtnIcon}>{cat.icon}</Text>
                        <Text
                          style={[
                            s.catBtnLabel,
                            value === cat.key && { color: COLORS.primary, fontWeight: "700" },
                          ]}
                        >
                          {cat.label}
                        </Text>
                        {value === cat.key && (
                          <View style={s.catCheck}>
                            <Ionicons name="checkmark" size={8} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />

              <Text style={s.fieldLabel}>
                Data <Text style={{ color: COLORS.primary }}>*</Text>
              </Text>
              <Controller
                control={control}
                name="data"
                rules={{
                  validate: (v) => validateDate(v),
                }}
                render={({ field: { onChange, value } }) => (
                  <View style={[s.inputRow, errors.data && s.inputRowErro]}>
                    <Ionicons
                      name="calendar-outline"
                      size={17}
                      color={COLORS.textMuted}
                      style={s.inputRowIcon}
                    />
                    <TextInput
                      style={s.inputInner}
                      placeholder="DD/MM/AAAA"
                      placeholderTextColor={COLORS.textMuted}
                      value={value}
                      onChangeText={(raw) => onChange(maskDate(raw))}
                      keyboardType="number-pad"
                    />
                  </View>
                )}
              />
              {errors.data && <Text style={s.erroTexto}>{errors.data.message}</Text>}

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>
                    Início <Text style={{ color: COLORS.primary }}>*</Text>
                  </Text>
                  <Controller
                    control={control}
                    name="horarioInicio"
                    rules={{
                      validate: (v) =>
                        /^([01]\d|2[0-3]):([0-5]\d)$/.test(v.trim()) ||
                        "Formato: HH:MM (ex: 20:00).",
                    }}
                    render={({ field: { onChange, value } }) => (
                      <View style={[s.inputRow, errors.horarioInicio && s.inputRowErro]}>
                        <Ionicons
                          name="time-outline"
                          size={17}
                          color={COLORS.textMuted}
                          style={s.inputRowIcon}
                        />
                        <TextInput
                          style={s.inputInner}
                          placeholder="21:00"
                          placeholderTextColor={COLORS.textMuted}
                          value={value}
                          onChangeText={(raw) => { onChange(maskTime(raw)); trigger('horarioFim'); }}
                          keyboardType="number-pad"
                        />
                      </View>
                    )}
                  />
                  {errors.horarioInicio && (
                    <Text style={s.erroTexto}>{errors.horarioInicio.message}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>Término</Text>
                  <Controller
                    control={control}
                    name="horarioFim"
                    rules={{
                      validate: (v) => validateEndTime(v, getValues('horarioInicio')),
                    }}
                    render={({ field: { onChange, value } }) => (
                      <View style={[s.inputRow, errors.horarioFim && s.inputRowErro]}>
                        <Ionicons
                          name="time-outline"
                          size={17}
                          color={COLORS.textMuted}
                          style={s.inputRowIcon}
                        />
                        <TextInput
                          style={s.inputInner}
                          placeholder="04:00"
                          placeholderTextColor={COLORS.textMuted}
                          value={value}
                          onChangeText={(raw) => onChange(maskTime(raw))}
                          keyboardType="number-pad"
                        />
                      </View>
                    )}
                  />
                  {errors.horarioFim && (
                    <Text style={s.erroTexto}>{errors.horarioFim.message}</Text>
                  )}
                  {!errors.horarioFim && isOvernight(watch('horarioInicio'), watch('horarioFim')) && (
                    <Text style={s.diaSegTexto}>Término no dia seguinte</Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* ETAPA 1 — Local */}
          {etapa === 1 && (
            <View style={s.etapaConteudo}>
              <Text style={s.etapaTitulo}>Local do Evento</Text>

              <TouchableOpacity
                style={[s.geoBtn, { marginBottom: 4 }, gpsStatus === 'found' && s.geoBtnOk]}
                onPress={handleUseCurrentLocation}
                disabled={gpsStatus === 'loading'}
              >
                {gpsStatus === 'loading' ? (
                  <Text style={s.geoBtnTexto}>Obtendo localização GPS...</Text>
                ) : gpsStatus === 'found' ? (
                  <>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                    <Text style={[s.geoBtnTexto, { color: COLORS.success }]}>GPS: endereço preenchido</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="locate-outline" size={16} color={COLORS.primary} />
                    <Text style={s.geoBtnTexto}>Usar minha localização atual</Text>
                  </>
                )}
              </TouchableOpacity>
              {gpsStatus === 'error' && (
                <Text style={[s.erroTexto, { marginBottom: 8 }]}>
                  Não foi possível obter GPS. Preencha o endereço manualmente.
                </Text>
              )}

              {[
                {
                  name: "venue",
                  label: "Nome do local",
                  icon: "business-outline",
                  placeholder: currentUser?.venueName || "Ex: Club D",
                  caps: "words",
                  rules: {},
                },
                {
                  name: "endereco",
                  label: "Endereço *",
                  icon: "location-outline",
                  placeholder: "Rua, número",
                  caps: "words",
                  rules: { validate: (v) => !!v.trim() || "Endereço é obrigatório." },
                },
                {
                  name: "bairro",
                  label: "Bairro",
                  icon: "map-outline",
                  placeholder: "Ex: Vila Madalena",
                  caps: "words",
                  rules: {},
                },
                {
                  name: "cidade",
                  label: "Cidade",
                  icon: "pin-outline",
                  placeholder: "São Paulo",
                  caps: "words",
                  rules: {},
                },
              ].map((f) => (
                <View key={f.name}>
                  <Text style={s.fieldLabel}>{f.label}</Text>
                  <Controller
                    control={control}
                    name={f.name}
                    rules={f.rules}
                    render={({ field: { onChange, value } }) => (
                      <View style={[s.inputRow, errors[f.name] && s.inputRowErro]}>
                        <Ionicons
                          name={f.icon}
                          size={17}
                          color={COLORS.textMuted}
                          style={s.inputRowIcon}
                        />
                        <TextInput
                          style={s.inputInner}
                          placeholder={f.placeholder}
                          placeholderTextColor={COLORS.textMuted}
                          value={value}
                          onChangeText={onChange}
                          autoCapitalize={f.caps}
                        />
                      </View>
                    )}
                  />
                  {errors[f.name] && (
                    <Text style={s.erroTexto}>{errors[f.name].message}</Text>
                  )}
                </View>
              ))}

            </View>
          )}

          {/* ETAPA 2 — Fotos */}
          {etapa === 2 && (
            <View style={s.etapaConteudo}>
              <Text style={s.etapaTitulo}>Fotos do Evento</Text>
              <Text style={s.etapaSub}>
                Adicione fotos para atrair mais participantes. A primeira foto será usada como capa
                nos cards.
              </Text>
              <PhotoManager
                photos={fotos}
                onAdd={(uri) => setFotos((prev) => [...prev, uri])}
                onRemove={(idx) => setFotos((prev) => prev.filter((_, i) => i !== idx))}
                maxPhotos={8}
              />
              <View style={s.fotoDicaCard}>
                <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
                <Text style={s.fotoDicaTexto}>
                  Eventos com fotos recebem até 3x mais visualizações. Use fotos em formato
                  paisagem (16:9) para melhor resultado.
                </Text>
              </View>
            </View>
          )}

          {/* ETAPA 3 — Detalhes */}
          {etapa === 3 && (
            <View style={s.etapaConteudo}>
              <Text style={s.etapaTitulo}>Detalhes do Evento</Text>

              <Text style={s.fieldLabel}>Descrição</Text>
              <Controller
                control={control}
                name="descricao"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[s.input, s.inputMulti]}
                    placeholder="Descreva o evento, atrações, ambiente..."
                    placeholderTextColor={COLORS.textMuted}
                    value={value}
                    onChangeText={onChange}
                    multiline
                    maxLength={300}
                  />
                )}
              />
              <Text style={s.charCount}>{descricao.length}/300</Text>

              <Text style={s.fieldLabel}>Artista / Atração principal</Text>
              <Controller
                control={control}
                name="artista"
                render={({ field: { onChange, value } }) => (
                  <View style={s.inputRow}>
                    <Ionicons
                      name="musical-notes-outline"
                      size={17}
                      color={COLORS.textMuted}
                      style={s.inputRowIcon}
                    />
                    <TextInput
                      style={s.inputInner}
                      placeholder="Ex: DJ Alok, Banda X..."
                      placeholderTextColor={COLORS.textMuted}
                      value={value}
                      onChangeText={onChange}
                      autoCapitalize="words"
                    />
                  </View>
                )}
              />

              <View style={s.switchCard}>
                <View>
                  <Text style={s.switchLabel}>Entrada gratuita</Text>
                  <Text style={s.switchSub}>Sem cobrança de ingresso</Text>
                </View>
                <Controller
                  control={control}
                  name="entrada_gratis"
                  render={({ field: { onChange, value } }) => (
                    <Switch
                      value={value}
                      onValueChange={onChange}
                      trackColor={{ false: COLORS.bgOverlay, true: COLORS.primary }}
                      thumbColor="#fff"
                    />
                  )}
                />
              </View>

              {!entrada_gratis && (
                <>
                  <Text style={s.fieldLabel}>
                    Valor da entrada <Text style={{ color: COLORS.primary }}>*</Text>
                  </Text>
                  <Controller
                    control={control}
                    name="preco"
                    rules={{
                      validate: (v) =>
                        entrada_gratis || !!v.trim() || "Valor da entrada é obrigatório.",
                    }}
                    render={({ field: { onChange, value } }) => (
                      <View style={[s.inputRow, errors.preco && s.inputRowErro]}>
                        <Text style={[s.inputRowIcon, { fontSize: 14, color: COLORS.textMuted }]}>
                          R$
                        </Text>
                        <TextInput
                          style={s.inputInner}
                          placeholder="80,00"
                          placeholderTextColor={COLORS.textMuted}
                          value={value}
                          onChangeText={onChange}
                          keyboardType="numeric"
                        />
                      </View>
                    )}
                  />
                  {errors.preco && <Text style={s.erroTexto}>{errors.preco.message}</Text>}
                </>
              )}

              <Text style={s.fieldLabel}>Faixa etária</Text>
              <Controller
                control={control}
                name="faixaEtaria"
                render={({ field: { onChange, value } }) => (
                  <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                    {FAIXAS_ETARIAS.map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        style={[s.faixaBtn, value === opt && s.faixaBtnAtivo]}
                        onPress={() => onChange(opt)}
                      >
                        <Text style={[s.faixaBtnTexto, value === opt && { color: "#fff" }]}>
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />

              <View style={s.switchCard}>
                <View>
                  <Text style={s.switchLabel}>♿ Acessível</Text>
                  <Text style={s.switchSub}>Rampa, banheiro adaptado etc.</Text>
                </View>
                <Controller
                  control={control}
                  name="acessivel"
                  render={({ field: { onChange, value } }) => (
                    <Switch
                      value={value}
                      onValueChange={onChange}
                      trackColor={{ false: COLORS.bgOverlay, true: COLORS.primary }}
                      thumbColor="#fff"
                    />
                  )}
                />
              </View>

              {acessivel && (
                <>
                  <Text style={s.fieldLabel}>Detalhes de acessibilidade</Text>
                  <Controller
                    control={control}
                    name="notasAcessibilidade"
                    render={({ field: { onChange, value } }) => (
                      <View style={s.inputRow}>
                        <Ionicons
                          name="accessibility-outline"
                          size={17}
                          color={COLORS.textMuted}
                          style={s.inputRowIcon}
                        />
                        <TextInput
                          style={s.inputInner}
                          placeholder="Ex: Rampa lateral + banheiro adaptado"
                          placeholderTextColor={COLORS.textMuted}
                          value={value}
                          onChangeText={onChange}
                        />
                      </View>
                    )}
                  />
                </>
              )}

              <Text style={s.fieldLabel}>Cor do card</Text>
              <Controller
                control={control}
                name="gradienteIdx"
                render={({ field: { onChange, value } }) => (
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                    {GRADIENTES.map((g, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[
                          s.gradDot,
                          { backgroundColor: g.colors[0] },
                          value === i && s.gradDotAtivo,
                        ]}
                        onPress={() => onChange(i)}
                      >
                        {value === i && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
            </View>
          )}

          {/* ETAPA 4 — Revisar */}
          {etapa === 4 && (() => {
            const v = getValues();
            const catInfoR = CATEGORIAS.find((c) => c.key === v.categoria);
            return (
              <View style={s.etapaConteudo}>
                <Text style={s.etapaTitulo}>Revisar e Publicar</Text>
                <View style={s.previewCard}>
                  <View
                    style={[
                      s.previewBanner,
                      { backgroundColor: GRADIENTES[v.gradienteIdx].colors[0] },
                    ]}
                  >
                    <View
                      style={[
                        StyleSheet.absoluteFillObject,
                        { backgroundColor: GRADIENTES[v.gradienteIdx].colors[1], opacity: 0.5 },
                      ]}
                    />
                    <Text style={s.previewBannerData}>
                      📅 {v.data} às {v.horarioInicio}
                      {v.horarioFim ? ` — ${v.horarioFim}` : ""}
                    </Text>
                    <Text style={s.previewBannerCat}>
                      {catInfoR?.icon} {catInfoR?.label}
                    </Text>
                  </View>
                  <View style={s.previewCorpo}>
                    <Text style={s.previewNome}>{v.nome || "Nome do evento"}</Text>
                    <Text style={s.previewVenue}>
                      📍 {v.venue || "Local"}
                      {v.bairro ? ` · ${v.bairro}` : ""}
                    </Text>
                    {v.descricao ? (
                      <Text style={s.previewDesc} numberOfLines={2}>
                        {v.descricao}
                      </Text>
                    ) : null}
                    {fotos.length > 0 && (
                      <View style={s.previewFotoBadge}>
                        <Ionicons name="images-outline" size={12} color={COLORS.primary} />
                        <Text style={s.previewFotoBadgeTexto}>
                          {fotos.length} foto{fotos.length > 1 ? "s" : ""} adicionada
                          {fotos.length > 1 ? "s" : ""}
                        </Text>
                      </View>
                    )}
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                      <View style={s.previewPill}>
                        <Text style={s.previewPillTexto}>
                          {v.entrada_gratis ? "🎟 Gratuito" : `🎟 R$ ${v.preco}`}
                        </Text>
                      </View>
                      {v.acessivel && (
                        <View style={[s.previewPill, { backgroundColor: COLORS.success + "22" }]}>
                          <Text style={[s.previewPillTexto, { color: COLORS.success }]}>
                            ♿ Acessível
                          </Text>
                        </View>
                      )}
                      <View style={s.previewPill}>
                        <Text style={s.previewPillTexto}>🔞 {v.faixaEtaria}</Text>
                      </View>
                      {v.artista ? (
                        <View style={[s.previewPill, { backgroundColor: COLORS.primary + "22" }]}>
                          <Text style={[s.previewPillTexto, { color: COLORS.primary }]}>
                            🎤 {v.artista}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>

                {[
                  {
                    step: 0,
                    titulo: 'Básico',
                    rows: [
                      ["Evento", v.nome],
                      ["Categoria", catInfoR ? `${catInfoR.icon} ${catInfoR.label}` : "—"],
                      ["Data", v.data],
                      ["Horário", `${v.horarioInicio}${v.horarioFim ? ` – ${v.horarioFim}` : ""}`],
                    ],
                  },
                  {
                    step: 1,
                    titulo: 'Local',
                    rows: [
                      ["Endereço", `${v.endereco}${v.bairro ? `, ${v.bairro}` : ""}${v.cidade ? ` — ${v.cidade}` : ""}`],
                    ],
                  },
                  {
                    step: 2,
                    titulo: 'Fotos',
                    rows: [["Fotos", `${fotos.length} foto${fotos.length !== 1 ? "s" : ""}`]],
                  },
                  {
                    step: 3,
                    titulo: 'Detalhes',
                    rows: [
                      ["Entrada", v.entrada_gratis ? "Gratuito" : `R$ ${v.preco}`],
                      ["Faixa etária", v.faixaEtaria],
                      ["Acessível", v.acessivel ? `Sim${v.notasAcessibilidade ? ` — ${v.notasAcessibilidade}` : ""}` : "Não"],
                    ],
                  },
                ].map((secao) => (
                  <View key={secao.titulo} style={[s.resumoCard, { marginBottom: 8 }]}>
                    <View style={s.resumoSecaoHeader}>
                      <Text style={s.resumoSecaoTitulo}>{secao.titulo}</Text>
                      <TouchableOpacity onPress={() => setEtapa(secao.step)}>
                        <Text style={s.resumoEditarBtn}>Editar</Text>
                      </TouchableOpacity>
                    </View>
                    {secao.rows.map(([label, val]) => (
                      <View key={label} style={s.resumoRow}>
                        <Text style={s.resumoLabel}>{label}</Text>
                        <Text style={s.resumoVal} numberOfLines={2}>{val || "—"}</Text>
                      </View>
                    ))}
                  </View>
                ))}

                <View style={s.notifCard}>
                  <Ionicons name="notifications" size={18} color={COLORS.primary} />
                  <Text style={s.notifTexto}>
                    Usuários próximos serão notificados assim que o evento for publicado.
                  </Text>
                </View>
              </View>
            );
          })()}

          <View style={{ height: 20 }} />
        </ScrollView>

        <View style={s.bottomBar}>
          {etapa < 4 ? (
            <TouchableOpacity style={s.proximoBtn} onPress={avancar}>
              <Text style={s.proximoBtnTexto}>Continuar →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.publicarBtn, publicando && { opacity: 0.6 }]}
              onPress={publicar}
              disabled={publicando}
            >
              <Ionicons name="rocket-outline" size={20} color="#fff" />
              <Text style={s.publicarBtnTexto}>
                {publicando
                  ? fotos.length > 0
                    ? 'Enviando fotos...'
                    : 'Publicando...'
                  : 'Publicar evento agora'}
              </Text>
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 10,
  },
  voltarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgCard,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  headerTitulo: { flex: 1, fontSize: 17, fontWeight: "700", color: COLORS.text },
  etapaBadge: {
    backgroundColor: COLORS.primary + "22",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 0.5,
    borderColor: COLORS.primary + "55",
  },
  etapaBadgeTexto: { color: COLORS.primary, fontSize: 12, fontWeight: "700" },
  progressBar: { height: 3, backgroundColor: COLORS.bgOverlay },
  progressFill: { height: "100%", backgroundColor: COLORS.primary },
  indicadorWrap: {
    backgroundColor: COLORS.bgCard,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  etapaRow: { flexDirection: "row", alignItems: "center" },
  etapaItem: { alignItems: "center", gap: 4 },
  etapaDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
  },
  etapaDotNum: { fontSize: 11, fontWeight: "800" },
  etapaLabel: { fontSize: 9, fontWeight: "600" },
  etapaLinha: { flex: 1, height: 1.5, marginHorizontal: 3, marginBottom: 14 },
  etapaConteudo: { padding: 16 },
  etapaTitulo: { fontSize: 20, fontWeight: "800", color: COLORS.text, marginBottom: 6 },
  etapaSub: { fontSize: 14, color: COLORS.textSub, marginBottom: 16, lineHeight: 20 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSub,
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: 13,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputErro: { borderColor: COLORS.danger, backgroundColor: COLORS.danger + "11" },
  inputMulti: { minHeight: 90, textAlignVertical: "top" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputRowErro: { borderColor: COLORS.danger, backgroundColor: COLORS.danger + "11" },
  inputRowIcon: { marginRight: 8 },
  inputInner: { flex: 1, fontSize: 15, color: COLORS.text },
  charCount: { fontSize: 11, color: COLORS.textMuted, textAlign: "right", marginTop: 4 },
  erroTexto: { fontSize: 12, color: COLORS.danger, marginTop: 4 },
  diaSegTexto: { fontSize: 12, color: COLORS.warning, marginTop: 4 },
  categoriaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catBtn: {
    width: "22%",
    aspectRatio: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    position: "relative",
  },
  catBtnAtivo: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "18" },
  catBtnIcon: { fontSize: 22 },
  catBtnLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 3 },
  catCheck: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  fotoDicaCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: COLORS.primary + "18",
    borderRadius: RADIUS.lg,
    padding: 14,
    marginTop: 16,
    borderWidth: 0.5,
    borderColor: COLORS.primary + "44",
  },
  fotoDicaTexto: { flex: 1, fontSize: 13, color: COLORS.primaryLight, lineHeight: 18 },
  switchCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  switchLabel: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  switchSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  faixaBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  faixaBtnAtivo: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  faixaBtnTexto: { fontSize: 13, color: COLORS.textSub, fontWeight: "600" },
  gradDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  gradDotAtivo: { borderWidth: 3, borderColor: COLORS.text },
  previewCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: COLORS.border,
    marginBottom: 14,
    ...SHADOW.md,
  },
  previewBanner: { height: 100, justifyContent: "flex-end", padding: 14, position: "relative" },
  previewBannerData: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 3 },
  previewBannerCat: { fontSize: 14, fontWeight: "800", color: "#fff" },
  previewCorpo: { padding: 14 },
  previewNome: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  previewVenue: { fontSize: 13, color: COLORS.textSub, marginBottom: 4 },
  previewDesc: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },
  previewFotoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.primary + "22",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  previewFotoBadgeTexto: { fontSize: 11, color: COLORS.primary, fontWeight: "600" },
  previewPill: {
    backgroundColor: COLORS.bgOverlay,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  previewPillTexto: { fontSize: 11, color: COLORS.textSub, fontWeight: "500" },
  resumoCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    overflow: "hidden",
    marginBottom: 12,
  },
  resumoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  resumoLabel: { fontSize: 13, color: COLORS.textMuted, flex: 0.4 },
  resumoVal: { fontSize: 13, fontWeight: "600", color: COLORS.text, flex: 0.6, textAlign: "right" },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: COLORS.primary + "18",
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 0.5,
    borderColor: COLORS.primary + "44",
  },
  notifTexto: { flex: 1, fontSize: 13, color: COLORS.primaryLight, lineHeight: 18 },
  bottomBar: {
    padding: 14,
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  proximoBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 16,
    alignItems: "center",
  },
  proximoBtnTexto: { color: "#fff", fontSize: 16, fontWeight: "800" },
  publicarBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 16,
  },
  publicarBtnTexto: { color: "#fff", fontSize: 16, fontWeight: "800" },
  geoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 13,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "18",
  },
  geoBtnOk: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success + "18",
  },
  geoBtnTexto: { fontSize: 14, fontWeight: "600", color: COLORS.primary },
  resumoSecaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bgOverlay,
  },
  resumoSecaoTitulo: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resumoEditarBtn: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
});
