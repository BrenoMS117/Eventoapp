const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_RE = /^\d{2}\/\d{2}\/\d{4}$/;

function parseDateBR(str) {
  const s = str?.trim() ?? '';
  if (!DATE_RE.test(s)) return null;
  const [d, m, y] = s.split('/').map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d)
    return null;
  return date;
}

function parseTimeMin(str) {
  const s = str?.trim() ?? '';
  if (!TIME_RE.test(s)) return -1;
  const [h, min] = s.split(':').map(Number);
  return h * 60 + min;
}

export function validateDate(value) {
  const s = value?.trim() ?? '';
  if (!DATE_RE.test(s)) return 'Formato inválido. Use DD/MM/AAAA.';
  const date = parseDateBR(s);
  if (!date) return 'Data inexistente (verifique dia e mês).';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) return 'A data do evento não pode ser no passado.';
  return true;
}

export function validateEndTime(endValue, startValue) {
  const end = endValue?.trim() ?? '';
  if (!end) return true;
  if (!TIME_RE.test(end)) return 'Formato inválido. Use HH:MM (ex: 04:00).';
  const endMin   = parseTimeMin(end);
  const startMin = parseTimeMin(startValue);
  if (startMin >= 0 && endMin === startMin)
    return 'Horário de término deve ser diferente do início.';
  return true;
}

export function isOvernight(startValue, endValue) {
  const s = parseTimeMin(startValue);
  const e = parseTimeMin(endValue);
  return s >= 0 && e >= 0 && e < s;
}

export const EventSchema = {
  validate(data) {
    const errors = {};

    if (!data.name?.trim() || data.name.trim().length < 3)
      errors.name = 'Nome precisa ter ao menos 3 caracteres.';

    if (!data.category)
      errors.category = 'Selecione uma categoria.';

    const dateResult = validateDate(data.date);
    if (dateResult !== true) errors.date = dateResult;

    if (!TIME_RE.test(data.startsAt?.trim() ?? ''))
      errors.startsAt = 'Horário de início inválido. Use HH:MM.';

    const fim = data.endsAt?.trim();
    if (fim) {
      const endResult = validateEndTime(fim, data.startsAt);
      if (endResult !== true) errors.endsAt = endResult;
    }

    if (!data.address?.trim())
      errors.address = 'Endereço é obrigatório.';

    if (!data.isFree && !data.price?.trim())
      errors.price = 'Valor da entrada é obrigatório.';

    return { isValid: Object.keys(errors).length === 0, errors };
  },
};
