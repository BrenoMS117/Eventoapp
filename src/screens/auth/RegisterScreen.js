import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, RADIUS, SHADOW } from '../../utils/theme';

export default function RegisterScreen({ navigation }) {
  const { register, authError, setAuthError } = useApp();
  const [role, setRole] = useState('user'); // 'user' | 'business'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [venueName, setVenueName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleRegister() {
    setAuthError('');
    if (!name.trim() || !email.trim() || !password.trim()) {
      setAuthError('Preencha todos os campos obrigatórios.');
      return;
    }
    if (password !== confirmPassword) {
      setAuthError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setAuthError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (role === 'business' && !venueName.trim()) {
      setAuthError('Informe o nome do estabelecimento.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const ok = register({ name: name.trim(), email: email.trim(), password, role, venueName: venueName.trim() });
      if (!ok) setLoading(false);
    }, 600);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => { setAuthError(''); navigation.goBack(); }} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Criar conta</Text>
          </View>

          <View style={styles.body}>
            {/* Role selector */}
            <Text style={styles.sectionLabel}>Você é...</Text>
            <View style={styles.roleRow}>
              <TouchableOpacity
                style={[styles.roleCard, role === 'user' && styles.roleCardActive]}
                onPress={() => setRole('user')}
              >
                <Text style={styles.roleIcon}>👤</Text>
                <Text style={[styles.roleTitle, role === 'user' && { color: COLORS.primary }]}>Usuário</Text>
                <Text style={styles.roleDesc}>Busco eventos e interajo com a comunidade</Text>
                {role === 'user' && <View style={styles.roleCheck}><Ionicons name="checkmark" size={12} color="#fff" /></View>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleCard, role === 'business' && styles.roleCardActiveBusiness]}
                onPress={() => setRole('business')}
              >
                <Text style={styles.roleIcon}>🏢</Text>
                <Text style={[styles.roleTitle, role === 'business' && { color: COLORS.purple }]}>Estabelecimento</Text>
                <Text style={styles.roleDesc}>Promovo eventos e gerencio meu local</Text>
                {role === 'business' && <View style={[styles.roleCheck, { backgroundColor: COLORS.purple }]}><Ionicons name="checkmark" size={12} color="#fff" /></View>}
              </TouchableOpacity>
            </View>

            {/* Benefits */}
            <View style={[styles.benefitsCard, { borderColor: role === 'business' ? COLORS.purple + '55' : COLORS.primary + '55' }]}>
              <Text style={[styles.benefitsTitle, { color: role === 'business' ? COLORS.purple : COLORS.primary }]}>
                {role === 'user' ? '👤 O que você pode fazer:' : '🏢 O que você pode fazer:'}
              </Text>
              {(role === 'user'
                ? ['Explorar eventos ao vivo perto de você', 'Ver lotação, fila e avaliações em tempo real', 'Participar do feed social dos eventos', 'Resgatar cupons exclusivos nos locais']
                : ['Criar e gerenciar seus eventos', 'Publicar cupons (bebida, comida, experiências)', 'Anunciar atualizações ao vivo para usuários próximos', 'Ver métricas de check-ins e avaliações']
              ).map((item, i) => (
                <View key={i} style={styles.benefitRow}>
                  <Ionicons name="checkmark-circle" size={14} color={role === 'business' ? COLORS.purple : COLORS.primary} />
                  <Text style={styles.benefitText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Error */}
            {authError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color={COLORS.danger} />
                <Text style={styles.errorText}>{authError}</Text>
              </View>
            ) : null}

            {/* Fields */}
            <Text style={styles.sectionLabel}>Seus dados</Text>

            <Text style={styles.fieldLabel}>{role === 'business' ? 'Nome do responsável' : 'Nome completo'} *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={17} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Seu nome" placeholderTextColor={COLORS.textMuted} value={name} onChangeText={t => { setName(t); setAuthError(''); }} autoCapitalize="words" />
            </View>

            {role === 'business' && (
              <>
                <Text style={styles.fieldLabel}>Nome do estabelecimento *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="business-outline" size={17} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="Ex: Bar do Zé" placeholderTextColor={COLORS.textMuted} value={venueName} onChangeText={t => { setVenueName(t); setAuthError(''); }} autoCapitalize="words" />
                </View>
              </>
            )}

            <Text style={styles.fieldLabel}>E-mail *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={17} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="seu@email.com" placeholderTextColor={COLORS.textMuted} value={email} onChangeText={t => { setEmail(t); setAuthError(''); }} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
            </View>

            <Text style={styles.fieldLabel}>Senha *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={17} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Mínimo 6 caracteres" placeholderTextColor={COLORS.textMuted} value={password} onChangeText={t => { setPassword(t); setAuthError(''); }} secureTextEntry={!showPass} />
              <TouchableOpacity onPress={() => setShowPass(v => !v)} style={styles.eyeBtn}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={17} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Confirmar senha *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={17} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="••••••" placeholderTextColor={COLORS.textMuted} value={confirmPassword} onChangeText={t => { setConfirmPassword(t); setAuthError(''); }} secureTextEntry={!showPass} />
            </View>

            <TouchableOpacity
              style={[styles.registerBtn, { backgroundColor: role === 'business' ? COLORS.purple : COLORS.primary }, loading && { opacity: 0.7 }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading
                ? <Text style={styles.registerBtnText}>Criando conta...</Text>
                : <><Ionicons name="person-add-outline" size={18} color="#fff" /><Text style={styles.registerBtnText}>Criar minha conta</Text></>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginLink} onPress={() => { setAuthError(''); navigation.goBack(); }}>
              <Text style={styles.loginLinkText}>Já tenho conta — Entrar</Text>
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
  header: { backgroundColor: COLORS.primaryDark, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 14, gap: 10 },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  body: { padding: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 6 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  roleCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 14, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', position: 'relative', ...SHADOW.sm },
  roleCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight + '88' },
  roleCardActiveBusiness: { borderColor: COLORS.purple, backgroundColor: COLORS.purpleLight + '88' },
  roleIcon: { fontSize: 28, marginBottom: 6 },
  roleTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 4, textAlign: 'center' },
  roleDesc: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 15 },
  roleCheck: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  benefitsCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 14, marginBottom: 16, borderWidth: 1.5, ...SHADOW.sm },
  benefitsTitle: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 5 },
  benefitText: { fontSize: 12, color: COLORS.textSecondary, flex: 1, lineHeight: 17 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.dangerLight, borderRadius: RADIUS.md, padding: 10, marginBottom: 12 },
  errorText: { fontSize: 13, color: COLORS.danger, flex: 1 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12, paddingHorizontal: 12, height: 50 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: COLORS.text },
  eyeBtn: { padding: 4 },
  registerBtn: { borderRadius: RADIUS.lg, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, ...SHADOW.sm },
  registerBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginLink: { alignItems: 'center', marginTop: 16, paddingVertical: 8 },
  loginLinkText: { fontSize: 14, color: COLORS.primary, fontWeight: '500' },
});