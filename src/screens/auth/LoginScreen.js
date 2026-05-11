import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, RADIUS, SHADOW } from '../../utils/theme';
import { FieldInput } from '../../components/FieldInput';
import { validate } from '../../utils/validation';

const DEMO = [
  { label: 'Usuário', email: 'joao@email.com', password: '123456', icon: '👤', color: COLORS.primary },
  { label: 'Estabelecimento', email: 'beco@email.com', password: '123456', icon: '🏢', color: COLORS.purple },
];

export default function LoginScreen({ navigation }) {
  const { login, authError, setAuthError, authLoading } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  function getErr(f) { return touched[f] ? errors[f] : ''; }

  function touch(f, val) {
    setTouched(p => ({ ...p, [f]: true }));
    if (f === 'email') setErrors(p => ({ ...p, email: validate.email(val ?? email) }));
    if (f === 'password') setErrors(p => ({ ...p, password: validate.password(val ?? password) }));
  }

  function validateAll() {
    const e = { email: validate.email(email), password: validate.password(password) };
    setErrors(e); setTouched({ email: true, password: true });
    return !e.email && !e.password;
  }

  async function handleLogin() {
    setAuthError('');
    if (!validateAll()) return;
    await login(email.trim(), password);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Animated header */}
          <View style={s.heroSection}>
            {/* Pulse icon */}
            <View style={s.pulseRing}>
              <View style={s.pulseRingInner}>
                <Ionicons name="pulse" size={32} color={COLORS.primary} />
              </View>
            </View>
            <Text style={s.brandName}>LiveVibe</Text>
            <Text style={s.brandTagline}>Feel the pulse of the city</Text>
          </View>

          {/* Demo quick access */}
          <View style={s.demoSection}>
            <Text style={s.demoLabel}>Quick Access</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {DEMO.map(d => (
                <TouchableOpacity key={d.email}
                  style={[s.demoCard, { borderColor: d.color + '66' }]}
                  onPress={() => { setEmail(d.email); setPassword(d.password); setErrors({}); setTouched({}); setAuthError(''); }}>
                  <Text style={{ fontSize: 24, marginBottom: 4 }}>{d.icon}</Text>
                  <Text style={[s.demoCardLabel, { color: d.color }]}>{d.label}</Text>
                  <Text style={s.demoCardEmail}>{d.email}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Form */}
          <View style={s.form}>
            <Text style={s.formTitle}>Sign In</Text>

            {authError ? (
              <View style={s.errBanner}>
                <Ionicons name="alert-circle-outline" size={16} color={COLORS.danger} />
                <Text style={s.errBannerText}>{authError}</Text>
              </View>
            ) : null}

            <FieldInput label="E-mail" required icon="mail-outline" value={email}
              onChangeText={v => { setEmail(v); setAuthError(''); touch('email', v); }}
              error={getErr('email')} placeholder="your@email.com"
              keyboardType="email-address" autoCapitalize="none" />

            <FieldInput label="Senha" required icon="lock-closed-outline" value={password}
              onChangeText={v => { setPassword(v); setAuthError(''); touch('password', v); }}
              error={getErr('password')} placeholder="••••••"
              secureTextEntry={!showPass} onToggleSecure={() => setShowPass(v => !v)} />

            <TouchableOpacity style={[s.loginBtn, authLoading && { opacity: 0.7 }]} onPress={handleLogin} disabled={authLoading}>
              <Text style={s.loginBtnText}>{authLoading ? 'Entrando...' : 'Sign In'}</Text>
              {!authLoading && <Ionicons name="arrow-forward" size={18} color="#fff" />}
            </TouchableOpacity>

            <View style={s.divider}>
              <View style={s.divLine} />
              <Text style={s.divText}>ou</Text>
              <View style={s.divLine} />
            </View>

            <TouchableOpacity style={s.registerBtn} onPress={() => { setAuthError(''); setErrors({}); setTouched({}); navigation.navigate('Register'); }}>
              <Text style={s.registerBtnText}>Criar nova conta →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  heroSection: { alignItems: 'center', paddingTop: 48, paddingBottom: 32, backgroundColor: COLORS.bgCard, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  pulseRing: { width: 88, height: 88, borderRadius: 44, backgroundColor: COLORS.primary + '22', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: COLORS.primary + '44' },
  pulseRingInner: { width: 66, height: 66, borderRadius: 33, backgroundColor: COLORS.primary + '33', justifyContent: 'center', alignItems: 'center' },
  brandName: { fontSize: 32, fontWeight: '900', color: COLORS.text, letterSpacing: 1, marginBottom: 6 },
  brandTagline: { fontSize: 14, color: COLORS.textSub, fontWeight: '400' },
  demoSection: { padding: 20 },
  demoLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  demoCard: { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl, padding: 14, alignItems: 'center', borderWidth: 1.5, ...SHADOW.sm },
  demoCardLabel: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  demoCardEmail: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center' },
  form: { paddingHorizontal: 20, paddingBottom: 20 },
  formTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  errBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.danger + '22', borderRadius: RADIUS.md, padding: 10, marginBottom: 12, borderWidth: 0.5, borderColor: COLORS.danger + '55' },
  errBannerText: { fontSize: 13, color: COLORS.danger, flex: 1 },
  loginBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: RADIUS.full, height: 54, marginTop: 4, ...SHADOW.glow },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  divLine: { flex: 1, height: 0.5, backgroundColor: COLORS.border },
  divText: { fontSize: 13, color: COLORS.textMuted },
  registerBtn: { borderWidth: 1.5, borderColor: COLORS.primary + '66', borderRadius: RADIUS.full, height: 54, alignItems: 'center', justifyContent: 'center' },
  registerBtnText: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },
});
