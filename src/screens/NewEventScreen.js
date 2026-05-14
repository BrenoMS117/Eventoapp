import React, { useState } from "react";
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
import { validate } from "../utils/validation";
import { PhotoManager } from "../components/ImageCarousel";

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

function IndicadorEtapa({ atual }) {
  return (
    <View style={s.etapaRow}>
      {ETAPAS.map((label, i) => {
        const feito = i < atual;
        const ativo = i === atual;
        const cor = feito
          ? COLORS.success
          : ativo
            ? COLORS.primary
            : COLORS.textMuted;
        return (
          <React.Fragment key={label}>
            <View style={s.etapaItem}>
              <View
                style={[
                  s.etapaDot,
                  {
                    backgroundColor: feito
                      ? COLORS.success
                      : ativo
                        ? COLORS.primary
                        : COLORS.bgOverlay,
                    borderColor: cor,
                  },
                ]}
              >
                {feito ? (
                  <Ionicons name="checkmark" size={10} color="#fff" />
                ) : (
                  <Text
                    style={[
                      s.etapaDotNum,
                      { color: ativo ? "#fff" : COLORS.textMuted },
                    ]}
                  >
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text style={[s.etapaLabel, { color: cor }]}>{label}</Text>
            </View>
            {i < ETAPAS.length - 1 && (
              <View
                style={[
                  s.etapaLinha,
                  {
                    backgroundColor: feito ? COLORS.success : COLORS.bgOverlay,
                  },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

export default function NewEventScreen({ navigation }) {
  const { addEvent, currentUser } = useApp();
  const [etapa, setEtapa] = useState(0);

  // Etapa 0 — Básico
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [data, setData] = useState("");
  const [horarioInicio, setHorarioInicio] = useState("");
  const [horarioFim, setHorarioFim] = useState("");

  // Etapa 1 — Local
  const [venue, setVenue] = useState(currentUser?.venueName || "");
  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("São Paulo");

  // Etapa 2 — Fotos
  const [fotos, setFotos] = useState([]);

  // Etapa 3 — Detalhes
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [entrada_gratis, setEntradaGratis] = useState(false);
  const [acessivel, setAcessivel] = useState(false);
  const [notasAcessibilidade, setNotasAcessibilidade] = useState("");
  const [artista, setArtista] = useState("");
  const [faixaEtaria, setFaixaEtaria] = useState("Livre");
  const [gradienteIdx, setGradienteIdx] = useState(0);

  const [erros, setErros] = useState({});
  const [tocados, setTocados] = useState({});

  function getErro(f) {
    return tocados[f] ? erros[f] : "";
  }

  function setErro(f, val) {
    setTocados((p) => ({ ...p, [f]: true }));
    setErros((p) => ({ ...p, [f]: validarCampo(f, val) }));
  }

  function validarCampo(f, v) {
    const vals = {
      nome,
      categoria,
      data,
      horarioInicio,
      horarioFim,
      endereco,
      preco,
    };
    const val = v !== undefined ? v : vals[f];
    if (f === "nome") return validate.minLength(val, 3, "Nome do evento");
    if (f === "categoria") return val ? "" : "Selecione uma categoria.";
    if (f === "data") return validate.date(val);
    if (f === "horarioInicio") return validate.time(val);
    if (f === "horarioFim") return val ? validate.time(val) : "";
    if (f === "endereco") return validate.required(val, "Endereço");
    if (f === "preco" && !entrada_gratis)
      return validate.required(val, "Valor da entrada");
    return "";
  }

  function validarEtapa(e) {
    const camposPorEtapa = {
      0: ["nome", "categoria", "data", "horarioInicio", "horarioFim"],
      1: ["endereco"],
      2: [],
      3: entrada_gratis ? [] : ["preco"],
    };
    const campos = camposPorEtapa[e] || [];
    const novosErros = {};
    campos.forEach((f) => {
      novosErros[f] = validarCampo(f);
    });
    setErros((p) => ({ ...p, ...novosErros }));
    setTocados((p) => ({
      ...p,
      ...Object.fromEntries(campos.map((f) => [f, true])),
    }));
    return !Object.values(novosErros).some(Boolean);
  }

  function avancar() {
    if (!validarEtapa(etapa)) return;
    setEtapa((s) => s + 1);
  }

  function publicar() {
    const catInfo = CATEGORIAS.find((c) => c.key === categoria);
    addEvent({
      name: nome.trim(),
      venue: venue.trim() || currentUser?.venueName || "Meu estabelecimento",
      address: `${endereco.trim()}${bairro ? ` - ${bairro.trim()}` : ""}`,
      category: categoria,
      categoryLabel: catInfo?.label || categoria,
      startsAt: horarioInicio,
      endsAt: horarioFim || null,
      price: entrada_gratis ? "Gratuito" : preco.trim(),
      accessible: acessivel,
      accessibilityNotes: acessivel ? notasAcessibilidade.trim() : null,
      nowPlaying: null,
      nextAct: artista.trim() || null,
      description: descricao.trim(),
      distanceKm: 0.5,
      gradient: GRADIENTES[gradienteIdx].colors,
      ageRestriction: faixaEtaria,
      vibeMeter: 50,
      vibeLabel: "Moderado",
      heatLevel: null,
      capacityPct: 0,
      photos: fotos,
      coverPhoto: fotos[0] || null,
    });
    Alert.alert(
      "🚀 Evento publicado!",
      `"${nome}" está no ar! Usuários próximos já podem visualizá-lo.`,
      [{ text: "Ótimo!", onPress: () => navigation.goBack() }],
    );
  }

  const catInfo = CATEGORIAS.find((c) => c.key === categoria);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <TouchableOpacity
          style={s.voltarBtn}
          onPress={() =>
            etapa > 0 ? setEtapa((s) => s - 1) : navigation.goBack()
          }
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
        <View
          style={[
            s.progressFill,
            { width: `${((etapa + 1) / ETAPAS.length) * 100}%` },
          ]}
        />
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
              <TextInput
                style={[s.input, getErro("nome") && s.inputErro]}
                placeholder="Ex: FESTIVAL OF LIGHTS"
                placeholderTextColor={COLORS.textMuted}
                value={nome}
                onChangeText={(v) => {
                  setNome(v);
                  setErro("nome", v);
                }}
                maxLength={60}
                autoCapitalize="characters"
              />
              {getErro("nome") ? (
                <Text style={s.erroTexto}>{getErro("nome")}</Text>
              ) : null}
              <Text style={s.charCount}>{nome.length}/60</Text>

              <Text style={s.fieldLabel}>
                Categoria <Text style={{ color: COLORS.primary }}>*</Text>
              </Text>
              {getErro("categoria") ? (
                <Text style={s.erroTexto}>{getErro("categoria")}</Text>
              ) : null}
              <View style={s.categoriaGrid}>
                {CATEGORIAS.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[s.catBtn, categoria === cat.key && s.catBtnAtivo]}
                    onPress={() => {
                      setCategoria(cat.key);
                      setErro("categoria", cat.key);
                    }}
                  >
                    <Text style={s.catBtnIcon}>{cat.icon}</Text>
                    <Text
                      style={[
                        s.catBtnLabel,
                        categoria === cat.key && {
                          color: COLORS.primary,
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {cat.label}
                    </Text>
                    {categoria === cat.key && (
                      <View style={s.catCheck}>
                        <Ionicons name="checkmark" size={8} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.fieldLabel}>
                Data <Text style={{ color: COLORS.primary }}>*</Text>
              </Text>
              <View style={[s.inputRow, getErro("data") && s.inputRowErro]}>
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
                  value={data}
                  onChangeText={(v) => {
                    setData(v);
                    setErro("data", v);
                  }}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              {getErro("data") ? (
                <Text style={s.erroTexto}>{getErro("data")}</Text>
              ) : null}

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>
                    Início <Text style={{ color: COLORS.primary }}>*</Text>
                  </Text>
                  <View
                    style={[
                      s.inputRow,
                      getErro("horarioInicio") && s.inputRowErro,
                    ]}
                  >
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
                      value={horarioInicio}
                      onChangeText={(v) => {
                        setHorarioInicio(v);
                        setErro("horarioInicio", v);
                      }}
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                  {getErro("horarioInicio") ? (
                    <Text style={s.erroTexto}>{getErro("horarioInicio")}</Text>
                  ) : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>Término</Text>
                  <View
                    style={[
                      s.inputRow,
                      getErro("horarioFim") && s.inputRowErro,
                    ]}
                  >
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
                      value={horarioFim}
                      onChangeText={(v) => {
                        setHorarioFim(v);
                        setErro("horarioFim", v);
                      }}
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ETAPA 1 — Local */}
          {etapa === 1 && (
            <View style={s.etapaConteudo}>
              <Text style={s.etapaTitulo}>Local do Evento</Text>
              {[
                {
                  label: "Nome do local",
                  icon: "business-outline",
                  value: venue,
                  onChange: setVenue,
                  placeholder: currentUser?.venueName || "Ex: Club D",
                  caps: "words",
                },
                {
                  label: "Endereço *",
                  icon: "location-outline",
                  value: endereco,
                  onChange: (v) => {
                    setEndereco(v);
                    setErro("endereco", v);
                  },
                  placeholder: "Rua, número",
                  erro: getErro("endereco"),
                  caps: "words",
                },
                {
                  label: "Bairro",
                  icon: "map-outline",
                  value: bairro,
                  onChange: setBairro,
                  placeholder: "Ex: Vila Madalena",
                  caps: "words",
                },
                {
                  label: "Cidade",
                  icon: "pin-outline",
                  value: cidade,
                  onChange: setCidade,
                  placeholder: "São Paulo",
                  caps: "words",
                },
              ].map((f) => (
                <View key={f.label}>
                  <Text style={s.fieldLabel}>{f.label}</Text>
                  <View style={[s.inputRow, f.erro && s.inputRowErro]}>
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
                      value={f.value}
                      onChangeText={f.onChange}
                      autoCapitalize={f.caps}
                    />
                  </View>
                  {f.erro ? <Text style={s.erroTexto}>{f.erro}</Text> : null}
                </View>
              ))}
            </View>
          )}

          {/* ETAPA 2 — Fotos */}
          {etapa === 2 && (
            <View style={s.etapaConteudo}>
              <Text style={s.etapaTitulo}>Fotos do Evento</Text>
              <Text style={s.etapaSub}>
                Adicione fotos para atrair mais participantes. A primeira foto
                será usada como capa nos cards.
              </Text>
              <PhotoManager
                photos={fotos}
                onAdd={(uri) => setFotos((prev) => [...prev, uri])}
                onRemove={(idx) =>
                  setFotos((prev) => prev.filter((_, i) => i !== idx))
                }
                maxPhotos={8}
              />
              <View style={s.fotoDicaCard}>
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color={COLORS.primary}
                />
                <Text style={s.fotoDicaTexto}>
                  Eventos com fotos recebem até 3x mais visualizações. Use fotos
                  em formato paisagem (16:9) para melhor resultado.
                </Text>
              </View>
            </View>
          )}

          {/* ETAPA 3 — Detalhes */}
          {etapa === 3 && (
            <View style={s.etapaConteudo}>
              <Text style={s.etapaTitulo}>Detalhes do Evento</Text>

              <Text style={s.fieldLabel}>Descrição</Text>
              <TextInput
                style={[s.input, s.inputMulti]}
                placeholder="Descreva o evento, atrações, ambiente..."
                placeholderTextColor={COLORS.textMuted}
                value={descricao}
                onChangeText={setDescricao}
                multiline
                maxLength={300}
              />
              <Text style={s.charCount}>{descricao.length}/300</Text>

              <Text style={s.fieldLabel}>Artista / Atração principal</Text>
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
                  value={artista}
                  onChangeText={setArtista}
                  autoCapitalize="words"
                />
              </View>

              <View style={s.switchCard}>
                <View>
                  <Text style={s.switchLabel}>Entrada gratuita</Text>
                  <Text style={s.switchSub}>Sem cobrança de ingresso</Text>
                </View>
                <Switch
                  value={entrada_gratis}
                  onValueChange={(v) => {
                    setEntradaGratis(v);
                    if (v) setErros((p) => ({ ...p, preco: "" }));
                  }}
                  trackColor={{ false: COLORS.bgOverlay, true: COLORS.primary }}
                  thumbColor="#fff"
                />
              </View>

              {!entrada_gratis && (
                <>
                  <Text style={s.fieldLabel}>
                    Valor da entrada{" "}
                    <Text style={{ color: COLORS.primary }}>*</Text>
                  </Text>
                  <View
                    style={[s.inputRow, getErro("preco") && s.inputRowErro]}
                  >
                    <Text
                      style={[
                        s.inputRowIcon,
                        { fontSize: 14, color: COLORS.textMuted },
                      ]}
                    >
                      R$
                    </Text>
                    <TextInput
                      style={s.inputInner}
                      placeholder="80,00"
                      placeholderTextColor={COLORS.textMuted}
                      value={preco}
                      onChangeText={(v) => {
                        setPreco(v);
                        setErro("preco", v);
                      }}
                      keyboardType="numeric"
                    />
                  </View>
                  {getErro("preco") ? (
                    <Text style={s.erroTexto}>{getErro("preco")}</Text>
                  ) : null}
                </>
              )}

              <Text style={s.fieldLabel}>Faixa etária</Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                {FAIXAS_ETARIAS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[s.faixaBtn, faixaEtaria === opt && s.faixaBtnAtivo]}
                    onPress={() => setFaixaEtaria(opt)}
                  >
                    <Text
                      style={[
                        s.faixaBtnTexto,
                        faixaEtaria === opt && { color: "#fff" },
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={s.switchCard}>
                <View>
                  <Text style={s.switchLabel}>♿ Acessível</Text>
                  <Text style={s.switchSub}>Rampa, banheiro adaptado etc.</Text>
                </View>
                <Switch
                  value={acessivel}
                  onValueChange={setAcessivel}
                  trackColor={{ false: COLORS.bgOverlay, true: COLORS.primary }}
                  thumbColor="#fff"
                />
              </View>

              {acessivel && (
                <>
                  <Text style={s.fieldLabel}>Detalhes de acessibilidade</Text>
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
                      value={notasAcessibilidade}
                      onChangeText={setNotasAcessibilidade}
                    />
                  </View>
                </>
              )}

              <Text style={s.fieldLabel}>Cor do card</Text>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                {GRADIENTES.map((g, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      s.gradDot,
                      { backgroundColor: g.colors[0] },
                      gradienteIdx === i && s.gradDotAtivo,
                    ]}
                    onPress={() => setGradienteIdx(i)}
                  >
                    {gradienteIdx === i && (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ETAPA 4 — Revisar */}
          {etapa === 4 && (
            <View style={s.etapaConteudo}>
              <Text style={s.etapaTitulo}>Revisar e Publicar</Text>
              <View style={s.previewCard}>
                <View
                  style={[
                    s.previewBanner,
                    { backgroundColor: GRADIENTES[gradienteIdx].colors[0] },
                  ]}
                >
                  <View
                    style={[
                      StyleSheet.absoluteFillObject,
                      {
                        backgroundColor: GRADIENTES[gradienteIdx].colors[1],
                        opacity: 0.5,
                      },
                    ]}
                  />
                  <Text style={s.previewBannerData}>
                    📅 {data} às {horarioInicio}
                    {horarioFim ? ` — ${horarioFim}` : ""}
                  </Text>
                  <Text style={s.previewBannerCat}>
                    {catInfo?.icon} {catInfo?.label}
                  </Text>
                </View>
                <View style={s.previewCorpo}>
                  <Text style={s.previewNome}>{nome || "Nome do evento"}</Text>
                  <Text style={s.previewVenue}>
                    📍 {venue || "Local"}
                    {bairro ? ` · ${bairro}` : ""}
                  </Text>
                  {descricao ? (
                    <Text style={s.previewDesc} numberOfLines={2}>
                      {descricao}
                    </Text>
                  ) : null}
                  {fotos.length > 0 && (
                    <View style={s.previewFotoBadge}>
                      <Ionicons
                        name="images-outline"
                        size={12}
                        color={COLORS.primary}
                      />
                      <Text style={s.previewFotoBadgeTexto}>
                        {fotos.length} foto{fotos.length > 1 ? "s" : ""}{" "}
                        adicionada{fotos.length > 1 ? "s" : ""}
                      </Text>
                    </View>
                  )}
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 6,
                      marginTop: 8,
                    }}
                  >
                    <View style={s.previewPill}>
                      <Text style={s.previewPillTexto}>
                        {entrada_gratis ? "🎟 Gratuito" : `🎟 R$ ${preco}`}
                      </Text>
                    </View>
                    {acessivel && (
                      <View
                        style={[
                          s.previewPill,
                          { backgroundColor: COLORS.success + "22" },
                        ]}
                      >
                        <Text
                          style={[
                            s.previewPillTexto,
                            { color: COLORS.success },
                          ]}
                        >
                          ♿ Acessível
                        </Text>
                      </View>
                    )}
                    <View style={s.previewPill}>
                      <Text style={s.previewPillTexto}>🔞 {faixaEtaria}</Text>
                    </View>
                    {artista ? (
                      <View
                        style={[
                          s.previewPill,
                          { backgroundColor: COLORS.primary + "22" },
                        ]}
                      >
                        <Text
                          style={[
                            s.previewPillTexto,
                            { color: COLORS.primary },
                          ]}
                        >
                          🎤 {artista}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>

              <View style={s.resumoCard}>
                {[
                  ["Evento", nome],
                  [
                    "Categoria",
                    catInfo ? `${catInfo.icon} ${catInfo.label}` : "—",
                  ],
                  ["Data", data],
                  [
                    "Horário",
                    `${horarioInicio}${horarioFim ? ` – ${horarioFim}` : ""}`,
                  ],
                  ["Endereço", `${endereco}${bairro ? `, ${bairro}` : ""}`],
                  ["Entrada", entrada_gratis ? "Gratuito" : `R$ ${preco}`],
                  ["Faixa etária", faixaEtaria],
                  [
                    "Acessível",
                    acessivel
                      ? `Sim${notasAcessibilidade ? ` — ${notasAcessibilidade}` : ""}`
                      : "Não",
                  ],
                  [
                    "Fotos",
                    `${fotos.length} foto${fotos.length !== 1 ? "s" : ""}`,
                  ],
                ].map(([label, val]) => (
                  <View key={label} style={s.resumoRow}>
                    <Text style={s.resumoLabel}>{label}</Text>
                    <Text style={s.resumoVal} numberOfLines={2}>
                      {val || "—"}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={s.notifCard}>
                <Ionicons
                  name="notifications"
                  size={18}
                  color={COLORS.primary}
                />
                <Text style={s.notifTexto}>
                  Usuários próximos serão notificados assim que o evento for
                  publicado.
                </Text>
              </View>
            </View>
          )}
          <View style={{ height: 20 }} />
        </ScrollView>

        <View style={s.bottomBar}>
          {etapa < 4 ? (
            <TouchableOpacity style={s.proximoBtn} onPress={avancar}>
              <Text style={s.proximoBtnTexto}>Continuar →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.publicarBtn} onPress={publicar}>
              <Ionicons name="rocket-outline" size={20} color="#fff" />
              <Text style={s.publicarBtnTexto}>Publicar evento agora</Text>
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
  headerTitulo: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
  },
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
  etapaTitulo: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 6,
  },
  etapaSub: {
    fontSize: 14,
    color: COLORS.textSub,
    marginBottom: 16,
    lineHeight: 20,
  },
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
  inputErro: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.danger + "11",
  },
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
  inputRowErro: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.danger + "11",
  },
  inputRowIcon: { marginRight: 8 },
  inputInner: { flex: 1, fontSize: 15, color: COLORS.text },
  charCount: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: "right",
    marginTop: 4,
  },
  erroTexto: { fontSize: 12, color: COLORS.danger, marginTop: 4 },
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
  catBtnAtivo: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "18",
  },
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
  fotoDicaTexto: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primaryLight,
    lineHeight: 18,
  },
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
  faixaBtnAtivo: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
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
  previewBanner: {
    height: 100,
    justifyContent: "flex-end",
    padding: 14,
    position: "relative",
  },
  previewBannerData: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 3,
  },
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
  previewFotoBadgeTexto: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "600",
  },
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
  resumoVal: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    flex: 0.6,
    textAlign: "right",
  },
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
  notifTexto: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primaryLight,
    lineHeight: 18,
  },
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
});
