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

export default function RegisterScreen({ navigation }) {
  const { register, authError, setAuthError, authLoading } = useApp();
  const [role, setRole] = useState("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [venueName, setVenueName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  function getErr(f) {
    return touched[f] ? errors[f] : "";
  }

  function touchField(f, val) {
    const v =
      val !== undefined
        ? val
        : { name, email, password, confirmPassword, venueName }[f];
    setTouched((p) => ({ ...p, [f]: true }));
    setErrors((p) => ({ ...p, [f]: getValidation(f, v) }));
  }

  function getValidation(f, v) {
    if (f === "name") return validate.minLength(v, 3, "Nome");
    if (f === "email") return validate.email(v);
    if (f === "password") return validate.password(v);
    if (f === "confirmPassword") return validate.confirmPassword(v, password);
    if (f === "venueName" && role === "business")
      return validate.required(v, "Nome do estabelecimento");
    return "";
  }

  function validateAll() {
    const fields = ["name", "email", "password", "confirmPassword"];
    if (role === "business") fields.push("venueName");
    const e = {};
    const vals = { name, email, password, confirmPassword, venueName };
    fields.forEach((f) => {
      e[f] = getValidation(f, vals[f]);
    });
    setErrors(e);
    setTouched(Object.fromEntries(fields.map((f) => [f, true])));
    return !Object.values(e).some(Boolean);
  }

  async function handleRegister() {
    setAuthError("");
    if (!validateAll()) return;
    await register({
      name: name.trim(),
      email: email.trim(),
      password,
      role,
      venueName: venueName.trim(),
    });
  }

  const BENEFITS = {
    user: [
      "Explorar eventos ao vivo perto de você",
      "Ver lotação e fila em tempo real",
      "Participar do feed social dos eventos",
      "Resgatar cupons exclusivos nos locais",
    ],
    business: [
      "Criar e gerenciar seus eventos",
      "Publicar cupons: bebida, comida, experiências",
      "Anunciar atualizações ao vivo",
      "Ver métricas de check-ins e avaliações",
    ],
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                setAuthError("");
                setErrors({});
                setTouched({});
                navigation.goBack();
              }}
              style={styles.backBtn}
            >
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Criar conta</Text>
          </View>

          <View style={{ padding: 16 }}>
            {/* Role selector */}
            <Text style={styles.sectionLabel}>Você é...</Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
              {[
                {
                  key: "user",
                  icon: "👤",
                  label: "Usuário",
                  desc: "Busco eventos",
                  color: COLORS.primary,
                },
                {
                  key: "business",
                  icon: "🏢",
                  label: "Estabelecimento",
                  desc: "Promovo eventos",
                  color: COLORS.purple,
                },
              ].map((r) => (
                <TouchableOpacity
                  key={r.key}
                  style={[
                    styles.roleCard,
                    role === r.key && {
                      borderColor: r.color,
                      backgroundColor: r.color + "18",
                    },
                  ]}
                  onPress={() => {
                    setRole(r.key);
                    setErrors((p) => ({ ...p, venueName: "" }));
                  }}
                >
                  <Text style={{ fontSize: 28, marginBottom: 6 }}>
                    {r.icon}
                  </Text>
                  <Text
                    style={[
                      { fontSize: 13, fontWeight: "700", marginBottom: 4 },
                      role === r.key && { color: r.color },
                    ]}
                  >
                    {r.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: COLORS.textSecondary,
                      textAlign: "center",
                    }}
                  >
                    {r.desc}
                  </Text>
                  {role === r.key && (
                    <View
                      style={[styles.roleCheck, { backgroundColor: r.color }]}
                    >
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Benefits */}
            <View
              style={[
                styles.benefitsCard,
                {
                  borderColor:
                    (role === "business" ? COLORS.purple : COLORS.primary) +
                    "55",
                },
              ]}
            >
              <Text
                style={[
                  styles.benefitsTitle,
                  {
                    color: role === "business" ? COLORS.purple : COLORS.primary,
                  },
                ]}
              >
                O que você pode fazer:
              </Text>
              {BENEFITS[role].map((item, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 6,
                    marginBottom: 5,
                  }}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={role === "business" ? COLORS.purple : COLORS.primary}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      color: COLORS.textSecondary,
                      flex: 1,
                      lineHeight: 17,
                    }}
                  >
                    {item}
                  </Text>
                </View>
              ))}
            </View>

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

            <Text style={styles.sectionLabel}>Seus dados</Text>

            <FieldInput
              label={
                role === "business" ? "Nome do responsável" : "Nome completo"
              }
              required
              icon="person-outline"
              value={name}
              onChangeText={(v) => {
                setName(v);
                touchField("name", v);
              }}
              error={getErr("name")}
              placeholder="Seu nome completo"
              autoCapitalize="words"
            />

            {role === "business" && (
              <FieldInput
                label="Nome do estabelecimento"
                required
                icon="business-outline"
                value={venueName}
                onChangeText={(v) => {
                  setVenueName(v);
                  touchField("venueName", v);
                }}
                error={getErr("venueName")}
                placeholder="Ex: Bar do Zé"
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
                touchField("email", v);
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
                touchField("password", v);
                if (touched.confirmPassword)
                  setErrors((p) => ({
                    ...p,
                    confirmPassword: validate.confirmPassword(
                      confirmPassword,
                      v,
                    ),
                  }));
              }}
              error={getErr("password")}
              placeholder="Mínimo 6 caracteres"
              secureTextEntry={!showPass}
              onToggleSecure={() => setShowPass((v) => !v)}
              hint="Mín. 6 caracteres"
            />

            <FieldInput
              label="Confirmar senha"
              required
              icon="lock-closed-outline"
              value={confirmPassword}
              onChangeText={(v) => {
                setConfirmPassword(v);
                touchField("confirmPassword", v);
              }}
              error={getErr("confirmPassword")}
              placeholder="••••••"
              secureTextEntry={!showPass}
            />

            <TouchableOpacity
              style={[
                styles.registerBtn,
                {
                  backgroundColor:
                    role === "business" ? COLORS.purple : COLORS.primary,
                },
                authLoading && { opacity: 0.7 },
              ]}
              onPress={handleRegister}
              disabled={authLoading}
            >
              {authLoading ? (
                <Text
                  style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}
                >
                  Criando conta...
                </Text>
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={18} color="#fff" />
                  <Text
                    style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}
                  >
                    {" "}
                    Criar minha conta
                  </Text>
                </>
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
                setErrors({});
                setTouched({});
                navigation.goBack();
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: COLORS.primary,
                  fontWeight: "500",
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primaryDark,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 10,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#fff" },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 6,
  },
  roleCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
    position: "relative",
    ...SHADOW.sm,
  },
  roleCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  benefitsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    ...SHADOW.sm,
  },
  benefitsTitle: { fontSize: 12, fontWeight: "700", marginBottom: 8 },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 12,
  },
  registerBtn: {
    borderRadius: RADIUS.lg,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    ...SHADOW.sm,
  },
});
