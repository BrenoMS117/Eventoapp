import { supabase } from '../lib/supabase';

// ─── Mapa plano → duração em dias ────────────────────────────────────────────
const PLAN_DURATION_DAYS = 30; // todos os planos são mensais

// ─── subscriptionService ─────────────────────────────────────────────────────
export const subscriptionService = {
  /**
   * Grava (ou sobrescreve) a assinatura do usuário na tabela `profiles`.
   *
   * @param {string} userId  - UUID do usuário logado (profiles.id)
   * @param {object} plan    - Objeto do plano selecionado (de PLANS_DATA)
   * @returns {{ error: string|null, data: object|null }}
   */
  async updateSubscription(userId, plan) {
    if (!userId) return { error: 'Usuário não autenticado.', data: null };

    const now        = new Date();
    const expiresAt  = new Date(now.getTime() + PLAN_DURATION_DAYS * 24 * 60 * 60 * 1000);

    const planDetails = {
      plan_id:          plan.id,                    // 'basic' | 'pro' | 'premium'
      price:            plan.price,                 // 'R$ 99,90'
      price_cents:      parseInt(plan.priceRaw, 10),// 9990
      boost_multiplier: plan.boost,                 // '5x'
      boost_label:      plan.boostLabel,            // '5x mais visibilidade'
      subscribed_at:    now.toISOString(),
      expires_at:       expiresAt.toISOString(),
    };

    const { data, error } = await supabase
      .from('profiles')
      .update({
        subscription_type:       plan.name,          // 'Pro'
        plan_details:            planDetails,
        subscription_expires_at: expiresAt.toISOString(),
      })
      .eq('id', userId)
      .select('subscription_type, plan_details, subscription_expires_at')
      .single();

    if (error) {
      console.error('[subscriptionService] updateSubscription error:', error.message);
      return { error: 'Não foi possível ativar o plano. Tente novamente.', data: null };
    }

    return { error: null, data: { planDetails, expiresAt } };
  },

  /**
   * Remove a assinatura do usuário (cancela o plano).
   *
   * @param {string} userId
   */
  async cancelSubscription(userId) {
    if (!userId) return { error: 'Usuário não autenticado.' };

    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_type:       null,
        plan_details:            null,
        subscription_expires_at: null,
      })
      .eq('id', userId);

    if (error) {
      console.error('[subscriptionService] cancelSubscription error:', error.message);
      return { error: 'Não foi possível cancelar o plano. Tente novamente.' };
    }

    return { error: null };
  },

  /**
   * Busca a assinatura vigente do usuário.
   * Retorna null se não houver plano ou se estiver expirado.
   *
   * @param {string} userId
   */
  async getActiveSubscription(userId) {
    if (!userId) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('subscription_type, plan_details, subscription_expires_at')
      .eq('id', userId)
      .single();

    if (error || !data?.subscription_type) return null;

    const expiresAt = data.subscription_expires_at
      ? new Date(data.subscription_expires_at)
      : null;

    if (expiresAt && expiresAt < new Date()) return null; // expirado

    return {
      subscriptionType: data.subscription_type,
      planDetails:      data.plan_details,
      expiresAt,
    };
  },
};
