let _counter = 0;

export function makeNotif({ dedupeKey, type, title, body, icon, color, priority = 'normal', payload = {}, now }) {
  _counter += 1;
  return {
    id: `${dedupeKey}:${_counter}`,
    dedupeKey,
    type,
    title,
    body,
    icon,
    color,
    priority,
    payload,
    createdAt: now ?? new Date(),
    read: false,
  };
}

export function hourBucket(date) {
  const d = date ?? new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
}

export function dayBucket(date) {
  const d = date ?? new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function minuteBucket(date, intervalMin = 5) {
  const d = date ?? new Date();
  const slot = Math.floor(d.getMinutes() / intervalMin);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${slot}`;
}
