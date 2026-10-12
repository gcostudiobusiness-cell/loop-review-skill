// Storage. Started moving file access here; only search uses it so far.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { formatNote } from './commands.js';

const FILE = process.env.NOTES_FILE || fileURLToPath(new URL('../notes.json', import.meta.url));
let cache = null;

function load() {
  if (!cache) cache = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : [];
  return cache;
}

export function searchNotes(term) {
  return load()
    .filter((n) => n.text.toLowerCase().includes(term.toLowerCase()))
    .map(formatNote);
}

// Old v1 format was { title, body }. Kept in case we need it.
export function migrateV1(notes) {
  return notes.map((n, i) => ({ id: i + 1, text: `${n.title}: ${n.body}` }));
}
