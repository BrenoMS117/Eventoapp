export const RATING_OPTIONS = [
  { key: 'fogo',      icon: '🔥', label: 'Intenso',    cor: '#E83B5C', score: 5 },
  { key: 'musica',    icon: '🎵', label: 'Boa música', cor: '#7B2FBE', score: 5 },
  { key: 'tranquilo', icon: '✨', label: 'Tranquilo',  cor: '#3B82F6', score: 4 },
  { key: 'acessivel', icon: '♿', label: 'Acessível',  cor: '#10B981', score: 4 },
  { key: 'cheio',     icon: '👥', label: 'Lotado',     cor: '#F59E0B', score: 3 },
  { key: 'ruim',      icon: '👎', label: 'Ruim',       cor: '#EF4444', score: 1 },
];

export const RATING_MAP = Object.fromEntries(RATING_OPTIONS.map((r) => [r.key, r]));

export function computeWeightedRating(counts) {
  const entries = Object.entries(counts);
  const total = entries.reduce((a, [, v]) => a + v, 0);
  if (total === 0) return 0;
  const weighted = entries.reduce(
    (s, [k, v]) => s + (RATING_MAP[k]?.score ?? 3) * v,
    0,
  );
  return Math.round((weighted / total) * 10) / 10;
}
