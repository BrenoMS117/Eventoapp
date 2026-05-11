import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, RADIUS, SHADOW } from '../../utils/theme';
import { FieldInput } from '../../components/FieldInput';
import { validate } from '../../utils/validation';

const BENEFITS = {
  user: ['Explore eventos ao vivo em tempo real', 'Veja lotação, fila e vibe level', 'Feed social com a comunidade', 'Resgate cupons exclusivos'],
  business: ['Crie e gerencie seus eventos', 'Publique cupons e experiências VIP', 'Anuncie atualizações ao vivo', 'Veja métricas de check-in e avaliações'],
};

export default function RegisterScreen({ navigation }) {
  const { register, authError, setAuthError, authLoading } = useApp();
  const [role, setRole] = useState('user');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [venueName, setVenueName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  function getErr(f) { return touched[f] ? errors[f] : ''; }

  function touchField(f, val) {
    const v = val !== undefined ? val : { name, email, password, confirm, venueName }[f];
    setTouched(p => ({ ...p, [f]: true }));
    setErrors(p => ({ ...p, [f]: getVal(f, v) }));
  }

  function getVal(f, v) {
    if (f === 'name') return validate.minLength(v, 3, 'Nome');
    if (f === 'email') return validate.email(v);
    if (f === 'password') return validate.password(v);
    if (f === 'confirm') return validate.confirmPassword(v, password);
    if (f === 'venueName' && role === 'business') return validate.required(v, 'Nome do estabelecimento');
    return '';
  }

  function validateAll() {
    const fields = ['name', 'email', 'password', 'confirm', ...(role === 'business' ? ['venueName'] : [])];
    const vals = { name, email, password, confirm, venueName };
    const e = {};
    fields.forEach(f => { e[f] = getVal(f, vals[f]); });
    setErrors(e); setTouched(Object.fromEntries(fields.map(f => [f, true])));
    return !Object.values(e).some(Boolean);
  }

  async function handleRegister() {
    setAuthError('');
    if (!validateAll()) return;
    await register({ name: name.trim(), email: email.trim(), password, role, venueName: venueName.trim() });
  }

  const accentColor = role === 'business' ? COLORS.purple : COLORS.primary;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={[s.header, { borderBottomColor: accentColor + '44' }]}>
            <TouchableOpacity onPress={() => { setAuthError(''); setErrors({}); setTouched({}); navigation.goBack(); }} style={s.backBtn}>
              <Ionicons name="chevron-back" size={20} color={COLORS.text} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="pulse" size={18} color={COLORS.primary} />
              <Text style={s.logo}>LiveVibe</Text>
            </View>
            <Text style={s.headerTitle}>Create Account</Text>
          </View>

          <View style={s.body}>
            {/* Role selector */}
            <Text style={s.sectionLabel}>I am a...</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
              {[
                { key: 'user', icon: '👤', label: 'Usuário', color: COLORS.primary },
                { key: 'business', icon: '🏢', label: 'Estabelecimento', color: COLORS.purple },
              ].map(r => (
                <TouchableOpacity key={r.key}
                  style={[s.roleCard, role === r.key && { borderColor: r.color, backgroundColor: r.color + '18' }]}
                  onPress={() => { setRole(r.key); setErrors(p => ({ ...p, venueName: '' })); }}>
                  <Text style={{ fontSize: 28, marginBottom: 6 }}>{r.icon}</Text>
                  <Text style={[s.roleLabel, role === r.key && { color: r.color }]}>{r.label}</Text>
                  {role === r.key && (
                    <View style={[s.roleCheck, { backgroundColor: r.color }]}>
                      <Ionicons name="checkmark" size={10} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Benefits */}
            <View style={[s.benefitsCard, { borderColor: accentColor + '55' }]}>
              {BENEFITS[role].map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <Ionicons name="checkmark-circle" size={14} color={accentColor} style={{ marginTop: 1 }} />
                  <Text style={s.benefitText}>{item}</Text>
                </View>
              ))}
            </View>

            {authError ? (
              <View style={s.errBanner}>
                <Ionicons name="alert-circle-outline" size={16} color={COLORS.danger} />
                <Text style={s.errText}>{authError}</Text>
              </View>
            ) : null}

            <Text style={s.sectionLabel}>Your Info</Text>

            <FieldInput label="Nome completo" required icon="person-outline" value={name}
              onChangeText={v => { setName(v); touchField('name', v); }}
              error={getErr('name')} placeholder="Seu nome" autoCapitalize="words" />

            {role === 'business' && (
              <FieldInput label="Nome do estabelecimento" required icon="business-outline" value={venueName}
                onChangeText={v => { setVenueName(v); touchField('venueName', v); }}
                error={getErr('venueName')} placeholder="Ex: Club D" autoCapitalize="words" />
            )}

            <FieldInput label="E-mail" required icon="mail-outline" value={email}
              onChangeText={v => { setEmail(v); setAuthError(''); touchField('email', v); }}
              error={getErr('email')} placeholder="seu@email.com"
              keyboardType="email-address" autoCapitalize="none" />

            <FieldInput label="Senha" required icon="lock-closed-outline" value={password}
              onChangeText={v => { setPassword(v); touchField('password', v); if (touched.confirm) setErrors(p => ({ ...p, confirm: validate.confirmPassword(confirm, v) })); }}
              error={getErr('password')} placeholder="Mínimo 6 caracteres"
              secureTextEntry={!showPass} onToggleSecure={() => setShowPass(v => !v)} hint="Mín. 6 chars" />

            <FieldInput label="Confirmar senha" required icon="lock-closed-outline" value={confirm}
              onChangeText={v => { setConfirm(v); touchField('confirm', v); }}
              error={getErr('confirm')} placeholder="••••••" secureTextEntry={!showPass} />

            <TouchableOpacity
              style={[s.regBtn, { backgroundColor: accentColor }, authLoading && { opacity: 0.7 }]}
              onPress={handleRegister} disabled={authLoading}>
              <Text style={s.regBtnText}>{authLoading ? 'Criando...' : 'Criar minha conta'}</Text>
              {!authLoading && <Ionicons name="arrow-forward" size={18} color="#fff" />}
            </TouchableOpacity>

            <TouchableOpacity style={{ alignItems: 'center', marginTop: 16, paddingVertical: 8 }}
              onPress={() => { setAuthError(''); setErrors({}); setTouched({}); navigation.goBack(); }}>
              <Text style={{ fontSize: 14, color: COLORS.primary, fontWeight: '600' }}>Já tenho conta — Sign In</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: COLORS.bgCard, borderBottomWidth: 0.5 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.bgOverlay, justifyContent: 'center', alignItems: 'center' },
  logo: { fontSize: 16, fontWeight: '900', color: COLORS.text },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  body: { padding: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 4 },
  roleCard: { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl, padding: 14, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', position: 'relative' },
  roleLabel: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  roleCheck: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  benefitsCard: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 14, marginBottom: 16, borderWidth: 1.5 },
  benefitText: { fontSize: 12, color: COLORS.textSub, flex: 1, lineHeight: 17 },
  errBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.danger + '22', borderRadius: RADIUS.md, padding: 10, marginBottom: 12, borderWidth: 0.5, borderColor: COLORS.danger + '55' },
  errText: { fontSize: 13, color: COLORS.danger, flex: 1 },
  regBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: RADIUS.full, height: 54, marginTop: 8, ...SHADOW.glow },
  regBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
