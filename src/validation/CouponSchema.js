export const CouponSchema = {
  validate(data) {
    const errors = {};

    if (!data.type)
      errors.type = 'Selecione um tipo de cupom.';

    if (!data.title?.trim())
      errors.title = 'Título é obrigatório.';

    if (!data.description?.trim())
      errors.description = 'Descrição é obrigatória.';

    const qty = parseInt(data.totalQty);
    if (isNaN(qty) || qty < 1)
      errors.totalQty = 'Quantidade inválida (mínimo 1).';

    if (!data.eventId)
      errors.eventId = 'Nenhum evento ativo encontrado.';

    const mpu = parseInt(data.redemptionRules?.maxPerUser);
    if (!isNaN(mpu) && mpu < 1)
      errors.maxPerUser = 'Mínimo 1 resgate por usuário.';

    return { isValid: Object.keys(errors).length === 0, errors };
  },

  toDTO(data, typeInfo) {
    const rules = data.redemptionRules ?? {};

    const conditionsParts = [data.conditions?.trim() || 'Válido apenas hoje.'];
    const mpu = rules.maxPerUser ?? 1;
    conditionsParts.push(mpu > 1 ? `Até ${mpu} resgates por usuário.` : '1 por usuário.');
    if (rules.userTypeRestriction === 'user')
      conditionsParts.push('Exclusivo para usuários.');

    return {
      eventId: data.eventId,
      eventName: data.eventName,
      venue: data.venue,
      type: data.type,
      typeLabel: typeInfo?.label || data.type,
      icon: typeInfo?.icon || '',
      title: (data.title || '').trim(),
      description: (data.description || '').trim(),
      conditions: conditionsParts.join(' '),
      expiresAt: data.expiresAt ?? null,
      totalQty: parseInt(data.totalQty),
      timerSeconds: data.expiresAt ? 3600 : 0,
      gradient: [typeInfo?.cor || '#E83B5C', (typeInfo?.cor || '#E83B5C') + '88'],
      highlightColor: typeInfo?.cor || '#E83B5C',
      redemptionRules: {
        maxPerUser: mpu,
        userTypeRestriction: rules.userTypeRestriction ?? 'all',
      },
    };
  },
};
