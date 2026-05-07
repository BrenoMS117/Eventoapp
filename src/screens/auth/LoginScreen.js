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

const DEMO_ACCOUNTS = [
  {
    label: "Usuário",
    email: "joao@email.com",
    password: "123456",
    icon: "👤",
    color: COLORS.primary,
  },
  {
    label: "Estabelecimento",
    email: "beco@email.com",
    password: "123456",
    icon: "🏢",
    color: COLORS.purple,
  },
];

export default function LoginScreen({ navigation }) {
  const { login, authError, setAuthError, authLoading } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  function getErr(f) {
    return touched[f] ? errors[f] : "";
  }

  function touch(f, val) {
    setTouched((p) => ({ ...p, [f]: true }));
    if (f === "email")
      setErrors((p) => ({ ...p, email: validate.email(val ?? email) }));
    if (f === "password")
      setErrors((p) => ({
        ...p,
        password: validate.password(val ?? password),
      }));
  }

  function validateAll() {
    const e = {
      email: validate.email(email),
      password: validate.password(password),
    };
    setErrors(e);
    setTouched({ email: true, password: true });
    return !e.email && !e.password;
  }

  async function handleLogin() {
    setAuthError("");
    if (!validateAll()) return;
    await login(email.trim(), password);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <View style={styles.logoCircle}>
              <Text style={{ fontSize: 36 }}>🗺</Text>
            </View>
            <Text style={styles.heroTitle}>EventApp</Text>
            <Text style={styles.heroSub}>
              Descubra eventos ao vivo perto de você
            </Text>
          </View>

          {/* Demo cards */}
          <View style={{ padding: 16, paddingBottom: 8 }}>
            <Text style={styles.demoLabel}>Acesso rápido para testar</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {DEMO_ACCOUNTS.map((acc) => (
                <TouchableOpacity
                  key={acc.email}
                  style={[styles.demoCard, { borderColor: acc.color + "55" }]}
                  onPress={() => {
                    setEmail(acc.email);
                    setPassword(acc.password);
                    setErrors({});
                    setTouched({});
                    setAuthError("");
                  }}
                >
                  <Text style={{ fontSize: 24, marginBottom: 4 }}>
                    {acc.icon}
                  </Text>
                  <Text
                    style={[
                      { fontSize: 12, fontWeight: "600", marginBottom: 2 },
                      { color: acc.color },
                    ]}
                  >
                    {acc.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      color: COLORS.textMuted,
                      textAlign: "center",
                    }}
                  >
                    {acc.email}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ padding: 16 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: COLORS.text,
                marginBottom: 16,
              }}
            >
              Entrar na sua conta
            </Text>

            {authError ? (
              <View style={styles.errorBanner}>
                <Ionicons
                  name="alert-circle-outline"
                  size={16}
                  color={COLORS.danger}
                />
                <Text style={{ fontSize: 13, color: COLORS.danger, flex: 1 }}>
                  {authError}
                </Text>
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
                touch("email", v);
              }}
              error={getErr("email")}
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <FieldInput
              label="Senha"
              required
              icon="lock-closed-outline"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setAuthError("");
                touch("password", v);
              }}
              error={getErr("password")}
              placeholder="••••••"
              secureTextEntry={!showPass}
              onToggleSecure={() => setShowPass((v) => !v)}
            />

            <TouchableOpacity
              style={[styles.loginBtn, authLoading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={authLoading}
            >
              {authLoading ? (
                <Text style={styles.loginBtnText}>Entrando...</Text>
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={18} color="#fff" />
                  <Text style={styles.loginBtnText}>Entrar</Text>
                </>
              )}
            </TouchableOpacity>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginVertical: 20,
              }}
            >
              <View
                style={{ flex: 1, height: 0.5, backgroundColor: COLORS.border }}
              />
              <Text style={{ fontSize: 13, color: COLORS.textMuted }}>ou</Text>
              <View
                style={{ flex: 1, height: 0.5, backgroundColor: COLORS.border }}
              />
            </View>

            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => {
                setAuthError("");
                setErrors({});
                setTouched({});
                navigation.navigate("Register");
              }}
            >
              <Text
                style={{
                  color: COLORS.primary,
                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                Criar nova conta →
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  hero: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 24,
    backgroundColor: COLORS.primaryDark,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  heroSub: { fontSize: 14, color: "#9FE1CB", marginTop: 4 },
  demoLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  demoCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 12,
    alignItems: "center",
    borderWidth: 1.5,
    ...SHADOW.sm,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 12,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
    ...SHADOW.sm,
  },
  loginBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  registerBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
});
