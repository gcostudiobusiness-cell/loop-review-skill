// Display helpers for the booking screen.

export function formatMinutes(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${m}`;
}

export function formatBooking(b) {
  return `${b.room} ${b.start}–${b.end} (${b.who})`;
}

// WIP (Sam): duration label for the booking list. Not wired up yet.
export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h`;
}
