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

const CONTAS_DEMO = [
  {
    label: "Usuário",
    email: "dantas@dantas.com",
    password: "123456",
    icon: "👤",
    cor: COLORS.primary,
  },
  {
    label: "Estabelecimento",
    email: "claudio@gmail.com",
    password: "123456",
    icon: "🏢",
    cor: COLORS.purple,
  },
];

export default function LoginScreen({ navigation }) {
  const { login, authError, setAuthError, authLoading } = useApp();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erros, setErros] = useState({});
  const [tocados, setTocados] = useState({});

  function getErro(f) {
    return tocados[f] ? erros[f] : "";
  }

  function tocar(f, val) {
    setTocados((p) => ({ ...p, [f]: true }));
    if (f === "email")
      setErros((p) => ({ ...p, email: validate.email(val ?? email) }));
    if (f === "senha")
      setErros((p) => ({ ...p, senha: validate.password(val ?? senha) }));
  }

  function validarTudo() {
    const e = { email: validate.email(email), senha: validate.password(senha) };
    setErros(e);
    setTocados({ email: true, senha: true });
    return !e.email && !e.senha;
  }

  async function handleEntrar() {
    setAuthError("");
    if (!validarTudo()) return;
    await login(email.trim(), senha);
  }

  return (
    <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero */}
          <View style={s.hero}>
            <View style={s.logoCircle}>
              <View style={s.logoCircleInner}>
                <Ionicons name="pulse" size={32} color={COLORS.primary} />
              </View>
            </View>
            <Text style={s.logoNome}>LiveVibe</Text>
            <Text style={s.logoSlogan}>Sinta o pulso da cidade</Text>
          </View>

          {/* Acesso rápido demo */}
          <View style={s.demoSecao}>
            <Text style={s.demoLabel}>Acesso rápido para testar</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {CONTAS_DEMO.map((d) => (
                <TouchableOpacity
                  key={d.email}
                  style={[s.demoCard, { borderColor: d.cor + "66" }]}
                  onPress={() => {
                    setEmail(d.email);
                    setSenha(d.password);
                    setErros({});
                    setTocados({});
                    setAuthError("");
                  }}
                >
                  <Text style={{ fontSize: 24, marginBottom: 4 }}>
                    {d.icon}
                  </Text>
                  <Text style={[s.demoCardLabel, { color: d.cor }]}>
                    {d.label}
                  </Text>
                  <Text style={s.demoCardEmail}>{d.email}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Formulário */}
          <View style={s.form}>
            <Text style={s.formTitulo}>Entrar na sua conta</Text>

            {authError ? (
              <View style={s.erroBanner}>
                <Ionicons
                  name="alert-circle-outline"
                  size={16}
                  color={COLORS.danger}
                />
                <Text style={s.erroBannerTexto}>{authError}</Text>
              </View>
            ) : null}

            <FieldInput
              label="E-mail"
              required
              icon="mail-outline"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setAuthError("");
                tocar("email", v);
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
                setAuthError("");
                tocar("senha", v);
              }}
              error={getErro("senha")}
              placeholder="••••••"
              secureTextEntry={!mostrarSenha}
              onToggleSecure={() => setMostrarSenha((v) => !v)}
            />

            <TouchableOpacity
              style={[s.entrarBtn, authLoading && { opacity: 0.7 }]}
              onPress={handleEntrar}
              disabled={authLoading}
            >
              <Text style={s.entrarBtnTexto}>
                {authLoading ? "Entrando..." : "Entrar"}
              </Text>
              {!authLoading && (
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              )}
            </TouchableOpacity>

            <View style={s.divisor}>
              <View style={s.divisorLinha} />
              <Text style={s.divisorTexto}>ou</Text>
              <View style={s.divisorLinha} />
            </View>

            <TouchableOpacity
              style={s.cadastrarBtn}
              onPress={() => {
                setAuthError("");
                setErros({});
                setTocados({});
                navigation.navigate("Register");
              }}
            >
              <Text style={s.cadastrarBtnTexto}>Criar nova conta →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  hero: {
    alignItems: "center",
    paddingTop: 48,
    paddingBottom: 32,
    backgroundColor: COLORS.bgCard,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primary + "22",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + "44",
  },
  logoCircleInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: COLORS.primary + "33",
    justifyContent: "center",
    alignItems: "center",
  },
  logoNome: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: 1,
    marginBottom: 6,
  },
  logoSlogan: { fontSize: 14, color: COLORS.textSub },
  demoSecao: { padding: 20 },
  demoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  demoCard: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: 14,
    alignItems: "center",
    borderWidth: 1.5,
    ...SHADOW.sm,
  },
  demoCardLabel: { fontSize: 13, fontWeight: "700", marginBottom: 4 },
  demoCardEmail: { fontSize: 10, color: COLORS.textMuted, textAlign: "center" },
  form: { paddingHorizontal: 20, paddingBottom: 20 },
  formTitulo: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 16,
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
  erroBannerTexto: { fontSize: 13, color: COLORS.danger, flex: 1 },
  entrarBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    height: 54,
    marginTop: 4,
    ...SHADOW.glow,
  },
  entrarBtnTexto: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  divisor: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 20,
  },
  divisorLinha: { flex: 1, height: 0.5, backgroundColor: COLORS.border },
  divisorTexto: { fontSize: 13, color: COLORS.textMuted },
  cadastrarBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.primary + "66",
    borderRadius: RADIUS.full,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  cadastrarBtnTexto: { color: COLORS.primary, fontSize: 15, fontWeight: "700" },
});
