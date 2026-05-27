import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../context/AppContext";
import { COLORS, RADIUS, SHADOW } from "../../utils/theme";
import { FieldInput } from "../../components/FieldInput";
import { validate } from "../../utils/validation";

const BENEFICIOS = {
  user: [
    "Explore eventos ao vivo perto de você",
    "Veja lotação, fila e nível de vibe em tempo real",
    "Participe do feed social da comunidade",
    "Resgate cupons exclusivos nos locais",
  ],
  business: [
    "Crie e gerencie seus eventos com fotos",
    "Publique cupons: drinques, comida, experiências VIP",
    "Anuncie atualizações ao vivo para usuários próximos",
    "Veja métricas de check-in e avaliações",
  ],
};

export default function RegisterScreen({ navigation }) {
  const { register, authError, setAuthError, authLoading } = useApp();
  const [perfil, setPerfil] = useState("user");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [nomeEstabelecimento, setNomeEstabelecimento] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erros, setErros] = useState({});
  const [tocados, setTocados] = useState({});

  function getErro(f) {
    return tocados[f] ? erros[f] : "";
  }

  function tocarCampo(f, val) {
    const v =
      val !== undefined
        ? val
        : { nome, email, senha, confirmarSenha, nomeEstabelecimento }[f];
    setTocados((p) => ({ ...p, [f]: true }));
    setErros((p) => ({ ...p, [f]: obterValidacao(f, v) }));
  }

  function obterValidacao(f, v) {
    if (f === "nome") return validate.minLength(v, 3, "Nome");
    if (f === "email") return validate.email(v);
    if (f === "senha") return validate.password(v);
    if (f === "confirmarSenha") return validate.confirmPassword(v, senha);
    if (f === "nomeEstabelecimento" && perfil === "business")
      return validate.required(v, "Nome do estabelecimento");
    return "";
  }

  function validarTudo() {
    const campos = [
      "nome",
      "email",
      "senha",
      "confirmarSenha",
      ...(perfil === "business" ? ["nomeEstabelecimento"] : []),
    ];
    const vals = { nome, email, senha, confirmarSenha, nomeEstabelecimento };
    const e = {};
    campos.forEach((f) => {
      e[f] = obterValidacao(f, vals[f]);
    });
    setErros(e);
    setTocados(Object.fromEntries(campos.map((f) => [f, true])));
    return !Object.values(e).some(Boolean);
  }

  async function handleCadastrar() {
    setAuthError("");
    if (!validarTudo()) return;
    await register({
      name: nome.trim(),
      email: email.trim(),
      password: senha,
      role: perfil,
      venueName: nomeEstabelecimento.trim(),
    });
  }

  const corAcento = perfil === "business" ? COLORS.purple : COLORS.primary;

  return (
    <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[s.header, { borderBottomColor: corAcento + "44" }]}>
            <TouchableOpacity
              onPress={() => {
                setAuthError("");
                setErros({});
                setTocados({});
                navigation.goBack();
              }}
              style={s.voltarBtn}
            >
              <Ionicons name="chevron-back" size={20} color={COLORS.text} />
            </TouchableOpacity>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Ionicons name="pulse" size={18} color={COLORS.primary} />
              <Text style={s.logo}>LiveVibe</Text>
            </View>
            <Text style={s.headerTitulo}>Criar Conta</Text>
          </View>

          <View style={s.corpo}>
            <Text style={s.secaoLabel}>Você é...</Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
              {[
                {
                  key: "user",
                  label: "Usuário",
                  cor: COLORS.primary,
                },
                {
                  key: "business",
                  label: "Estabelecimento",
                  cor: COLORS.purple,
                },
              ].map((p) => (
                <TouchableOpacity
                  key={p.key}
                  style={[
                    s.perfilCard,
                    perfil === p.key && {
                      borderColor: p.cor,
                      backgroundColor: p.cor + "18",
                    },
                  ]}
                  onPress={() => {
                    setPerfil(p.key);
                    setErros((prev) => ({ ...prev, nomeEstabelecimento: "" }));
                  }}
                >
                  <Text
                    style={[
                      s.perfilLabel,
                      perfil === p.key && { color: p.cor },
                    ]}
                  >
                    {p.label}
                  </Text>
                  {perfil === p.key && (
                    <View style={[s.perfilCheck, { backgroundColor: p.cor }]}>
                      <Ionicons name="checkmark" size={10} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={[s.beneficiosCard, { borderColor: corAcento + "55" }]}>
              {BENEFICIOS[perfil].map((item, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={corAcento}
                    style={{ marginTop: 1 }}
                  />
                  <Text style={s.beneficioTexto}>{item}</Text>
                </View>
              ))}
            </View>

            {authError ? (
              <View style={s.erroBanner}>
                <Ionicons
                  name="alert-circle-outline"
                  size={16}
                  color={COLORS.danger}
                />
                <Text style={s.erroTexto}>{authError}</Text>
              </View>
            ) : null}

            <Text style={s.secaoLabel}>Seus dados</Text>

            <FieldInput
              label={
                perfil === "business" ? "Nome do responsável" : "Nome completo"
              }
              required
              icon="person-outline"
              value={nome}
              onChangeText={(v) => {
                setNome(v);
                tocarCampo("nome", v);
              }}
              error={getErro("nome")}
              placeholder="Seu nome"
              autoCapitalize="words"
            />

            {perfil === "business" && (
              <FieldInput
                label="Nome do estabelecimento"
                required
                icon="business-outline"
                value={nomeEstabelecimento}
                onChangeText={(v) => {
                  setNomeEstabelecimento(v);
                  tocarCampo("nomeEstabelecimento", v);
                }}
                error={getErro("nomeEstabelecimento")}
                placeholder="Ex: Club D"
                autoCapitalize="words"
              />
            )}

            <FieldInput
              label="E-mail"
              required
              icon="mail-outline"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setAuthError("");
                tocarCampo("email", v);
              }}
              error={getErro("email")}
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <FieldInput
              label="Senha"
              required
              icon="lock-closed-outline"
              value={senha}
              onChangeText={(v) => {
                setSenha(v);
                tocarCampo("senha", v);
                if (tocados.confirmarSenha)
                  setErros((p) => ({
                    ...p,
                    confirmarSenha: validate.confirmPassword(confirmarSenha, v),
                  }));
              }}
              error={getErro("senha")}
              placeholder="Mínimo 6 caracteres"
              secureTextEntry={!mostrarSenha}
              onToggleSecure={() => setMostrarSenha((v) => !v)}
              hint="Mín. 6 caracteres"
            />

            <FieldInput
              label="Confirmar senha"
              required
              icon="lock-closed-outline"
              value={confirmarSenha}
              onChangeText={(v) => {
                setConfirmarSenha(v);
                tocarCampo("confirmarSenha", v);
              }}
              error={getErro("confirmarSenha")}
              placeholder="••••••"
              secureTextEntry={!mostrarSenha}
            />

            <TouchableOpacity
              style={[
                s.cadastrarBtn,
                { backgroundColor: corAcento },
                authLoading && { opacity: 0.7 },
              ]}
              onPress={handleCadastrar}
              disabled={authLoading}
            >
              <Text style={s.cadastrarBtnTexto}>
                {authLoading ? "Criando conta..." : "Criar minha conta"}
              </Text>
              {!authLoading && (
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                alignItems: "center",
                marginTop: 16,
                paddingVertical: 8,
              }}
              onPress={() => {
                setAuthError("");
                setErros({});
                setTocados({});
                navigation.goBack();
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: COLORS.primary,
                  fontWeight: "600",
                }}
              >
                Já tenho conta — Entrar
              </Text>
            </TouchableOpacity>

            <View style={{ height: 32 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 0.5,
  },
  voltarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgOverlay,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  headerTitulo: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  corpo: { padding: 16 },
  secaoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },
  perfilCard: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
    position: "relative",
  },
  perfilLabel: { fontSize: 12, fontWeight: "700", color: COLORS.text },
  perfilCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  beneficiosCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
  },
  beneficioTexto: {
    fontSize: 12,
    color: COLORS.textSub,
    flex: 1,
    lineHeight: 17,
  },
  erroBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.danger + "22",
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: COLORS.danger + "55",
  },
  erroTexto: { fontSize: 13, color: COLORS.danger, flex: 1 },
  cadastrarBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: RADIUS.full,
    height: 54,
    marginTop: 8,
    ...SHADOW.glow,
  },
  cadastrarBtnTexto: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
