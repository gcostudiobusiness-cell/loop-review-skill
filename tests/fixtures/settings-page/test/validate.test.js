import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../public/validate.js';

test('accepts valid settings', () => {
  assert.deepEqual(validate({ name: 'Ana', email: 'ana@example.com', phone: '' }), {});
});

test('requires a display name', () => {
  assert.ok(validate({ name: '', email: 'ana@example.com' }).name);
});
