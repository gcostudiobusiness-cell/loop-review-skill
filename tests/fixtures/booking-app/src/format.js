// Display helpers for the booking screen.

export function formatMinutes(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${m}`;
}

export function formatBooking(b) {
  return `${b.room} ${b.start}–${b.end} (${b.who})`;
}
