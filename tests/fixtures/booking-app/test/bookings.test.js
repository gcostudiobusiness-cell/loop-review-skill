import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addBooking, freeSlots } from '../src/bookings.js';

test('accepts bookings at different times', () => {
  const schedule = [];
  assert.equal(addBooking(schedule, { room: 'Oak', start: '09:00', end: '10:00', who: 'Ana' }).ok, true);
  assert.equal(addBooking(schedule, { room: 'Oak', start: '13:00', end: '14:00', who: 'Ben' }).ok, true);
});

test('rejects an overlapping booking', () => {
  const schedule = [];
  addBooking(schedule, { room: 'Oak', start: '10:00', end: '11:00', who: 'Ana' });
  assert.equal(addBooking(schedule, { room: 'Oak', start: '10:30', end: '11:30', who: 'Ben' }).ok, false);
});

test('lists free slots around a booking', () => {
  const schedule = [{ room: 'Oak', start: '10:00', end: '11:00', who: 'Ana' }];
  assert.equal(freeSlots(schedule, 'Oak', '09:00', '17:00').length, 2);
});
