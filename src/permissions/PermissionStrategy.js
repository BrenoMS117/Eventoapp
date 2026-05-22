import { PERMISSION_RULES, DEFAULT_ROLE } from './PermissionRules';

/**
 * PermissionStrategy — Strategy Pattern para permissões por papel.
 *
 * Cada papel tem sua própria estratégia concreta que encapsula
 * todas as regras daquele papel. A interface pública é idêntica em
 * todas as estratégias — o código consumidor nunca precisa verificar
 * "qual role é esse?" diretamente.
 *
 * Princípios aplicados:
 *   SRP  — cada classe gerencia apenas as regras do seu papel
 *   OCP  — novos papéis = nova classe, sem modificar as existentes
 *   LSP  — todas as estratégias são intercambiáveis
 *   DIP  — componentes dependem da abstração (PermissionStrategy),
 *           não de role strings espalhadas pelo código
 */
class PermissionStrategy {
  /** @param {object} rules — objeto do PERMISSION_RULES para este papel */
  constructor(rules) {
    this._rules = rules;
  }

  // ── Feed ─────────────────────────────────────────────────────────────

  /** Pode criar posts no feed da comunidade? */
  canPostToFeed() {
    return this._rules.feed.canPost;
  }

  /** Pode curtir posts? */
  canLikePosts() {
    return this._rules.feed.canLike;
  }

  // ── Eventos ───────────────────────────────────────────────────────────

  /** Pode criar novos eventos? */
  canCreateEvent() {
    return this._rules.events.canCreate;
  }

  /**
   * O campo informado pode ser editado por este papel?
   * @param {'nextAct'|'endsAt'|'closeEvent'} field
   */
  canEditEventField(field) {
    return this._rules.events.editableFields.includes(field);
  }

  /** Retorna os campos de evento que este papel pode editar. */
  getEditableEventFields() {
    return [...this._rules.events.editableFields];
  }

  /** Pode visualizar o status do evento? */
  canViewEventStatus() {
    return this._rules.events.canViewStatus;
  }

  // ── Cupons ────────────────────────────────────────────────────────────

  /** Pode resgatar cupons? */
  canRedeemCoupons() {
    return this._rules.coupons.canRedeem;
  }
}

// ── Estratégias concretas ─────────────────────────────────────────────────

class UserPermissionStrategy extends PermissionStrategy {
  constructor() {
    super(PERMISSION_RULES.user);
  }
}

class BusinessPermissionStrategy extends PermissionStrategy {
  constructor() {
    super(PERMISSION_RULES.business);
  }
}

// ── Fábrica ───────────────────────────────────────────────────────────────

/**
 * Retorna a estratégia correta para o papel informado.
 * Para adicionar um novo papel: crie a classe acima e adicione um case aqui.
 *
 * @param {string|undefined} role
 * @returns {PermissionStrategy}
 */
export function createPermissionStrategy(role) {
  switch (role ?? DEFAULT_ROLE) {
    case 'business': return new BusinessPermissionStrategy();
    case 'user':
    default:         return new UserPermissionStrategy();
  }
}
