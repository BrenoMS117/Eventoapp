import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, RADIUS, SHADOW } from '../../utils/theme';

// Demo accounts shown on screen
const DEMO_ACCOUNTS = [
  { label: 'Usuário comum', email: 'joao@email.com', password: '123456', icon: '👤', color: COLORS.primary },
  { label: 'Estabelecimento', email: 'beco@email.com', password: '123456', icon: '🏢', color: COLORS.purple },
];

export default function LoginScreen({ navigation }) {
  const { login, authError, setAuthError } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setAuthError('Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const ok = login(email.trim(), password);
      if (!ok) setLoading(false);
    }, 600);
  }

  function fillDemo(account) {
    setEmail(account.email);
    setPassword(account.password);
    setAuthError('');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.hero}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🗺</Text>
            </View>
            <Text style={styles.heroTitle}>EventApp</Text>
            <Text style={styles.heroSub}>Descubra eventos ao vivo perto de você</Text>
          </View>

          {/* Demo accounts */}
          <View style={styles.demoSection}>
            <Text style={styles.demoLabel}>Acesso rápido para testar</Text>
            <View style={styles.demoRow}>
              {DEMO_ACCOUNTS.map(acc => (
                <TouchableOpacity key={acc.email} style={[styles.demoCard, { borderColor: acc.color + '55' }]} onPress={() => fillDemo(acc)}>
                  <Text style={styles.demoIcon}>{acc.icon}</Text>
                  <Text style={[styles.demoCardLabel, { color: acc.color }]}>{acc.label}</Text>
                  <Text style={styles.demoCardEmail}>{acc.email}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Entrar na sua conta</Text>

            {authError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color={COLORS.danger} />
                <Text style={styles.errorText}>{authError}</Text>
              </View>
            ) : null}

            <Text style={styles.fieldLabel}>E-mail</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="seu@email.com"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={t => { setEmail(t); setAuthError(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={styles.fieldLabel}>Senha</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={t => { setPassword(t); setAuthError(''); }}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)} style={styles.eyeBtn}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading
                ? <Text style={styles.loginBtnText}>Entrando...</Text>
                : <><Ionicons name="log-in-outline" size={18} color="#fff" /><Text style={styles.loginBtnText}>Entrar</Text></>
              }
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.registerBtn} onPress={() => { setAuthError(''); navigation.navigate('Register'); }}>
              <Text style={styles.registerBtnText}>Criar nova conta →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, paddingBottom: 32 },
  hero: { alignItems: 'center', paddingTop: 40, paddingBottom: 24, backgroundColor: COLORS.primaryDark },
  logoCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  logoEmoji: { fontSize: 36 },
  heroTitle: { fontSize: 28, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  heroSub: { fontSize: 14, color: '#9FE1CB', marginTop: 4 },
  demoSection: { padding: 16, paddingBottom: 8 },
  demoLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  demoRow: { flexDirection: 'row', gap: 10 },
  demoCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 12, alignItems: 'center', borderWidth: 1.5, ...SHADOW.sm },
  demoIcon: { fontSize: 24, marginBottom: 4 },
  demoCardLabel: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  demoCardEmail: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center' },
  form: { padding: 16 },
  formTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.dangerLight, borderRadius: RADIUS.md, padding: 10, marginBottom: 12 },
  errorText: { fontSize: 13, color: COLORS.danger, flex: 1 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14, paddingHorizontal: 12, height: 50 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: COLORS.text },
  eyeBtn: { padding: 4 },
  loginBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4, ...SHADOW.sm },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 20 },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: COLORS.border },
  dividerText: { fontSize: 13, color: COLORS.textMuted },
  registerBtn: { borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: RADIUS.lg, height: 52, alignItems: 'center', justifyContent: 'center' },
  registerBtnText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
});