import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BIN = fileURLToPath(new URL('../bin/notes.js', import.meta.url));
let file;

beforeEach(() => {
  file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'notes-')), 'notes.json');
});

function run(...args) {
  const r = spawnSync(process.execPath, [BIN, ...args], {
    env: { ...process.env, NOTES_FILE: file },
    encoding: 'utf8',
  });
  return r.stdout.trim();
}

test('add then list', () => {
  assert.equal(run('add', 'buy', 'milk'), 'Added #1 buy milk');
  assert.equal(run('list'), '#1 buy milk');
});

test('search is case-insensitive', () => {
  run('add', 'Call', 'Mum');
  assert.equal(run('search', 'mum'), '#1 Call Mum');
});

test('remove a note', () => {
  run('add', 'a');
  assert.equal(run('remove', '1'), 'Removed #1.');
});
