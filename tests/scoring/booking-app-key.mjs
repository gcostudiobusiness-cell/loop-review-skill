// Checks the booking-app answer-key worked examples (A1-A5, X1).
// Usage: node tests/scoring/booking-app-key.mjs <trial-repo>
const dir = process.argv[2];
const { addBooking, freeSlots } = await import(`${dir}/src/bookings.js`);
const { formatMinutes, formatDuration } = await import(`${dir}/src/format.js`);
const b = (start, end, who = 'x') => ({ room: 'Oak', start, end, who });
let s = [b('14:00', '16:00')];
console.log('A1 adjacent 14-16 + 16-18 ok:', addBooking(s, b('16:00', '18:00')).ok, '(want true)');
s = [b('10:00', '11:00')];
console.log('A1 overlap 10-11 vs 10:30-11:30 ok:', addBooking(s, b('10:30', '11:30')).ok, '(want false)');
console.log('A2 freeSlots 14-16, day 09-17:', JSON.stringify(freeSlots([b('14:00', '16:00')], 'Oak', '09:00', '17:00')), '(want last slot 16:00-17:00)');
console.log('A3 9:00-9:30 + 10:00-11:00, day 08-17:', JSON.stringify(freeSlots([b('9:00', '9:30'), b('10:00', '11:00')], 'Oak', '08:00', '17:00')), '(bug if 08:00-10:00 is listed)');
console.log('A4 end before start ok:', addBooking([], b('16:00', '14:00')).ok, '(true = still accepted)');
console.log('A4 "ab" over existing ok:', addBooking([b('09:00', '11:00')], b('ab', '10:00')).ok, '(true = still accepted)');
console.log('A5 formatMinutes(540):', JSON.stringify(formatMinutes(540)), '(want "09:00")');
console.log('X1 formatDuration(90):', JSON.stringify(formatDuration(90)), '(Sam WIP, unchanged = "1 h")');
