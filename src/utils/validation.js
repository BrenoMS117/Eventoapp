// Retorna string de erro ou '' se válido
export const validate = {
  required: (v, label = "Campo") =>
    !v?.trim() ? `${label} é obrigatório.` : "",

  email: (v) => {
    if (!v?.trim()) return "E-mail é obrigatório.";
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(v.trim()) ? "" : "E-mail inválido.";
  },

  password: (v) => {
    if (!v) return "Senha é obrigatória.";
    if (v.length < 6) return "Mínimo 6 caracteres.";
    return "";
  },

  confirmPassword: (v, original) => {
    if (!v) return "Confirme sua senha.";
    return v !== original ? "As senhas não coincidem." : "";
  },

  minLength: (v, min, label = "Campo") =>
    (v?.trim().length ?? 0) < min
      ? `${label} precisa ter ao menos ${min} caracteres.`
      : "",

  maxLength: (v, max, label = "Campo") =>
    (v?.trim().length ?? 0) > max
      ? `${label} pode ter no máximo ${max} caracteres.`
      : "",

  time: (v) => {
    if (!v?.trim()) return "Horário é obrigatório.";
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v.trim())
      ? ""
      : "Formato: HH:MM (ex: 20:00).";
  },

  date: (v) => {
    if (!v?.trim()) return "Data é obrigatória.";
    return /^\d{2}\/\d{2}\/\d{4}$/.test(v.trim()) ? "" : "Formato: DD/MM/AAAA.";
  },

  positiveNumber: (v, label = "Valor") => {
    if (!v) return `${label} é obrigatório.`;
    const n = parseInt(v);
    return isNaN(n) || n <= 0 ? `${label} deve ser maior que zero.` : "";
  },

  // Valida um objeto inteiro e retorna { errors, isValid }
  form: (rules) => {
    const errors = {};
    let isValid = true;
    for (const [field, error] of Object.entries(rules)) {
      errors[field] = error;
      if (error) isValid = false;
    }
    return { errors, isValid };
  },
};
