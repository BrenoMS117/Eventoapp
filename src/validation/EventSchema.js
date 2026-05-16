const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_RE = /^\d{2}\/\d{2}\/\d{4}$/;

export const EventSchema = {
  validate(data) {
    const errors = {};

    if (!data.name?.trim() || data.name.trim().length < 3)
      errors.name = 'Nome precisa ter ao menos 3 caracteres.';

    if (!data.category)
      errors.category = 'Selecione uma categoria.';

    if (!DATE_RE.test(data.date?.trim() ?? ''))
      errors.date = 'Data inválida. Use o formato DD/MM/AAAA.';

    if (!TIME_RE.test(data.startsAt?.trim() ?? ''))
      errors.startsAt = 'Horário de início inválido. Use HH:MM.';

    const fim = data.endsAt?.trim();
    if (fim) {
      if (!TIME_RE.test(fim))
        errors.endsAt = 'Horário de término inválido. Use HH:MM.';
      else if (fim === data.startsAt?.trim())
        errors.endsAt = 'Horário de término deve ser diferente do início.';
    }

    if (!data.address?.trim())
      errors.address = 'Endereço é obrigatório.';

    if (!data.isFree && !data.price?.trim())
      errors.price = 'Valor da entrada é obrigatório.';

    return { isValid: Object.keys(errors).length === 0, errors };
  },
};
