/**
 * PermissionRules — fonte única de verdade para todas as capacidades por papel.
 *
 * Regra de ouro: para mudar o que um papel PODE ou NÃO PODE fazer,
 * altere APENAS este arquivo. Nenhuma outra camada precisa mudar.
 *
 * Para adicionar um novo papel (ex: 'admin', 'vip'):
 *   1. Adicione uma chave aqui.
 *   2. Crie a estratégia correspondente em PermissionStrategy.js.
 *   Nada mais muda.
 *
 * Domínios de permissão:
 *   feed     — interações com o feed da comunidade
 *   events   — visualização e edição de eventos
 *   coupons  — resgate de cupons
 */
export const PERMISSION_RULES = {
  user: {
    feed: {
      canPost: true,
      canLike: true,
    },
    events: {
      canCreate: false,
      canViewStatus: true,
      editableFields: [],     // usuários não editam eventos
    },
    coupons: {
      canRedeem: true,
    },
  },

  business: {
    feed: {
      canPost: false,         // donos não postam no feed público
      canLike: true,
    },
    events: {
      canCreate: true,
      canViewStatus: true,
      editableFields: ['nextAct', 'endsAt', 'closeEvent'], // campos liberados
    },
    coupons: {
      canRedeem: false,       // donos não resgatam cupons
    },
  },
};

/** Papel padrão caso o role seja desconhecido. */
export const DEFAULT_ROLE = 'user';
