export const PERMISSION_RULES = {
  user: {
    feed: {
      canPost: true,
      canLike: true,
    },
    events: {
      canCreate: false,
      canViewStatus: true,
      editableFields: [],
    },
    coupons: {
      canRedeem: true,
    },
  },

  business: {
    feed: {
      canPost: false,
      canLike: true,
    },
    events: {
      canCreate: true,
      canViewStatus: true,
      editableFields: ['nextAct', 'endsAt', 'closeEvent', 'crowdLabel', 'crowdLevel'],
    },
    coupons: {
      canRedeem: false,
    },
  },
};

export const DEFAULT_ROLE = 'user';
