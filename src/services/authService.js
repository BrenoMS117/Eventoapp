import { supabase } from '../lib/supabase';

export const authService = {
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { user: null, error: _translateError(error.message) };

    const profile = await authService.getProfile(data.user.id);
    return { user: { ...data.user, ...profile }, error: null };
  },

  async signUp({ email, password, name, role, venueName }) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { user: null, error: _translateError(error.message) };

    const safeName = (name ?? '').trim() || 'U';
    const avatar = safeName.split(/\s+/).filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      name,
      role,
      avatar,
      venue_name: role === 'business' ? venueName : null,
      venue_id: role === 'business' ? `v_${data.user.id.slice(0, 8)}` : null,
    });

    if (profileError) return { user: null, error: 'Erro ao criar perfil. Tente novamente.' };

    const profile = await authService.getProfile(data.user.id);
    return { user: { ...data.user, ...profile }, error: null };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!data) return {};
    return {
      name:                   data.name,
      role:                   data.role,
      avatar:                 data.avatar,
      venueName:              data.venue_name,
      venueId:                data.venue_id,
      planType:               data.plan_type               ?? null,
      subscriptionType:       data.subscription_type       ?? null,
      planDetails:            data.plan_details             ?? null,
      subscriptionExpiresAt:  data.subscription_expires_at ?? null,
    };
  },

  async updateProfile(userId, { name, avatar, venueName }) {
    const updates = {};
    if (name      !== undefined) updates.name       = name;
    if (avatar    !== undefined) updates.avatar     = avatar;
    if (venueName !== undefined) updates.venue_name = venueName;
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) return { error: 'Erro ao atualizar perfil.' };
    return { error: null };
  },

  async updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: _translateError(error.message) };
    return { error: null };
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const profile = await authService.getProfile(session.user.id);
    return { ...session.user, ...profile };
  },
};

function _translateError(msg) {
  if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (msg.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if (msg.includes('User already registered')) return 'Este e-mail já está cadastrado.';
  if (msg.includes('Password should be')) return 'A senha deve ter pelo menos 6 caracteres.';
  if (msg.includes('Unable to validate email')) return 'E-mail inválido.';
  return 'Erro inesperado. Tente novamente.';
}
