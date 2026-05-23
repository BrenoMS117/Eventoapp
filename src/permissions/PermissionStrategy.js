import { PERMISSION_RULES, DEFAULT_ROLE } from './PermissionRules';

class PermissionStrategy {
  constructor(rules) {
    this._rules = rules;
  }

  // ── Feed ──────────────────────────────────────────────────────────────

  canPostToFeed() {
    return this._rules.feed.canPost;
  }

  canLikePosts() {
    return this._rules.feed.canLike;
  }

  // ── Eventos ───────────────────────────────────────────────────────────

  canCreateEvent() {
    return this._rules.events.canCreate;
  }

  canEditEventField(field) {
    return this._rules.events.editableFields.includes(field);
  }

  getEditableEventFields() {
    return [...this._rules.events.editableFields];
  }

  canViewEventStatus() {
    return this._rules.events.canViewStatus;
  }

  // ── Cupons ────────────────────────────────────────────────────────────

  canRedeemCoupons() {
    return this._rules.coupons.canRedeem;
  }
}

// ── Estratégias concretas ─────────────────────────────────────────────────────

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

// ── Fábrica ───────────────────────────────────────────────────────────────────

export function createPermissionStrategy(role) {
  switch (role ?? DEFAULT_ROLE) {
    case 'business': return new BusinessPermissionStrategy();
    case 'user':
    default:         return new UserPermissionStrategy();
  }
}
