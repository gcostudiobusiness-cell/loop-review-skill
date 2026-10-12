// Room booking rules. A schedule is an array of { room, start, end, who }.
import { toMinutes } from './time.js';
import { formatMinutes } from './format.js';

export function overlaps(a, b) {
  return toMinutes(a.start) <= toMinutes(b.end) && toMinutes(b.start) <= toMinutes(a.end);
}

export function addBooking(schedule, booking) {
  const clash = schedule.find((b) => b.room === booking.room && overlaps(b, booking));
  if (clash) return { ok: false, clash };
  schedule.push(booking);
  return { ok: true };
}

// Free gaps in a room between dayStart and dayEnd, e.g. ["09:00-10:00", ...].
export function freeSlots(schedule, room, dayStart, dayEnd) {
  const taken = schedule
    .filter((b) => b.room === room)
    .sort((a, b) => a.start.localeCompare(b.start));
  const slots = [];
  let cursor = toMinutes(dayStart);
  for (const b of taken) {
    const start = toMinutes(b.start);
    if (start > cursor) slots.push(`${formatMinutes(cursor)}-${formatMinutes(start)}`);
    cursor = Math.max(cursor, toMinutes(b.end) + 1);
  }
  const end = toMinutes(dayEnd);
  if (end > cursor) slots.push(`${formatMinutes(cursor)}-${formatMinutes(end)}`);
  return slots;
}
