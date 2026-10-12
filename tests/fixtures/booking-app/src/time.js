// Time helpers. Times are "H:MM" or "HH:MM" strings on a single day.

export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
