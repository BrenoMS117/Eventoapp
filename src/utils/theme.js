// ─── LiveVibe — Tema escuro

export const COLORS = {
  // Fundos
  bg:          '#0D0F1A',
  bgCard:      '#141824',
  bgElevated:  '#1C2033',
  bgOverlay:   '#252A42',

  // Gradiente da marca
  gradStart:   '#E83B5C',
  gradMid:     '#B8296E',
  gradEnd:     '#7B2FBE',

  // Primária
  primary:     '#E83B5C',
  primaryDark: '#C0294A',
  primaryLight:'#FF6B87',

  // Secundária
  purple:      '#7B2FBE',
  purpleLight: '#A855F7',
  purpleDark:  '#5B1F9A',

  // Níveis de vibe
  vibeParty:   '#E83B5C',
  vibeChill:   '#3B82F6',
  vibeIntense: '#7B2FBE',

  // Status
  live:        '#EF4444',
  liveGlow:    '#EF444433',
  gold:        '#F59E0B',
  goldLight:   '#FCD34D',

  // Níveis de calor
  heatBlazing: '#FF4500',
  heatHot:     '#E83B5C',
  heatWarm:    '#F59E0B',
  heatCool:    '#3B82F6',

  // Texto
  text:        '#F1F5F9',
  textSub:     '#94A3B8',
  textMuted:   '#64748B',
  textInvert:  '#0D0F1A',

  // UI
  border:      '#1E2540',
  borderGlow:  '#E83B5C44',
  surface:     '#141824',

  // Compatibilidade legada
  success:     '#10B981',
  successLight:'#D1FAE5',
  warning:     '#F59E0B',
  warningLight:'#FEF3C7',
  danger:      '#EF4444',
  dangerLight: '#FEE2E2',
  white:       '#FFFFFF',

  // Aliases
  background:  '#0D0F1A',
  textSecondary:'#94A3B8',
  textMuted2:  '#64748B',
};

export const RADIUS = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  28,
  full: 999,
};

export const SHADOW = {
  sm: {
    shadowColor: '#E83B5C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: '#7B2FBE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  glow: {
    shadowColor: '#E83B5C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const GRADIENTS = {
  brand:    ['#E83B5C', '#7B2FBE'],
  brandH:   ['#FF6B87', '#A855F7'],
  card:     ['#141824', '#1C2033'],
  dark:     ['#0D0F1A', '#141824'],
  hot:      ['#FF4500', '#E83B5C'],
  chill:    ['#1E40AF', '#3B82F6'],
  gold:     ['#F59E0B', '#FCD34D'],
  overlay:  ['rgba(13,15,26,0)', 'rgba(13,15,26,0.95)'],
};
