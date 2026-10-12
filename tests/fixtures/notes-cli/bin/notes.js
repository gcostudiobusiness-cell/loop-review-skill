#!/usr/bin/env node
import { add, list, remove, search } from '../src/commands.js';

const [cmd, ...rest] = process.argv.slice(2);
const arg = rest.join(' ');

const handlers = { add, list, remove, rm: remove, search };
if (!handlers[cmd]) {
  console.log('Usage: notes <add TEXT | list | remove ID | search TERM>');
  process.exit(1);
}
console.log(handlers[cmd](arg));
