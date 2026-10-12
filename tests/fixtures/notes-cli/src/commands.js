// CLI command handlers. Each returns the text to print.
import fs from 'node:fs';
import path from 'node:path';
import { searchNotes } from './store.js';

const FILE = process.env.NOTES_FILE || path.join(process.cwd(), 'notes.json');

export function formatNote(n) {
  return `#${n.id} ${n.text}`;
}

export function add(text) {
  let notes = [];
  if (fs.existsSync(FILE)) notes = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const note = { id: notes.length + 1, text, created: new Date().toISOString() };
  notes.push(note);
  fs.writeFileSync(FILE, JSON.stringify(notes, null, 2));
  return `Added ${formatNote(note)}`;
}

export function list() {
  const notes = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  if (notes.length === 0) return 'No notes yet.';
  return notes.map(formatNote).join('\n');
}

export function remove(id) {
  let notes = [];
  if (fs.existsSync(FILE)) notes = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const next = notes.filter((n) => n.id !== Number(id));
  if (next.length === notes.length) return `No note #${id}.`;
  fs.writeFileSync(FILE, JSON.stringify(next, null, 2));
  return `Removed #${id}.`;
}

export function search(term) {
  const hits = searchNotes(term);
  return hits.length ? hits.join('\n') : `No notes match "${term}".`;
}
