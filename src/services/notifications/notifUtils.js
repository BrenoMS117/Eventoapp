let _counter = 0;

/**
 * Constructs a NotificationPayload with a stable composite ID.
 */
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

/** "YYYY-M-D-H" bucket — used for hourly deduplication. */
export function hourBucket(date) {
  const d = date ?? new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
}

/** "YYYY-M-D" bucket — used for daily deduplication. */
export function dayBucket(date) {
  const d = date ?? new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * N-minute bucket — used for burst/surge deduplication.
 * @param {Date} date
 * @param {number} [intervalMin=5]
 */
export function minuteBucket(date, intervalMin = 5) {
  const d = date ?? new Date();
  const slot = Math.floor(d.getMinutes() / intervalMin);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${slot}`;
}
