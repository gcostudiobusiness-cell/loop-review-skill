// Checks the notes-cli answer-key rows (C2-C5, C7, Z1) by running the real CLI in temp dirs.
// Usage: node tests/scoring/notes-cli-key.mjs <trial-repo>
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const repo = path.resolve(process.argv[2]);
const bin = path.join(repo, 'bin/notes.js');
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'notes-score-'));
const run = (cwd, env, ...args) => {
  const e = { ...process.env, ...env };
  if (env.NOTES_FILE === undefined) delete e.NOTES_FILE;
  const r = spawnSync(process.execPath, [bin, ...args], { cwd, env: e, encoding: 'utf8' });
  return { out: r.stdout.trim(), code: r.status, err: r.stderr.trim().split('\n')[0] };
};

// C3: no NOTES_FILE, run from a directory other than the package folder.
let d = tmp();
run(d, {}, 'add', 'milk');
console.log('C3 default path, search after add:', JSON.stringify(run(d, {}, 'search', 'milk').out), '(baseline bug: No notes match)');

// C4: list with no file.
d = tmp();
const l = run(d, { NOTES_FILE: path.join(d, 'n.json') }, 'list');
console.log('C4 list with no file:', JSON.stringify(l.out || l.err), 'exit', l.code, '(baseline: ENOENT crash, exit 1)');

// C5: duplicate ids after a remove.
d = tmp();
const env = { NOTES_FILE: path.join(d, 'n.json') };
run(d, env, 'add', 'a'); run(d, env, 'add', 'b'); run(d, env, 'remove', '1');
const c = run(d, env, 'add', 'c');
console.log('C5 add after remove:', JSON.stringify(c.out), '(baseline bug: "Added #2 c")');
console.log('   then remove 2:', JSON.stringify(run(d, env, 'remove', '2').out), '-> list:', JSON.stringify(run(d, env, 'list').out));

// Unchanged CLI output text (Z3): exact strings from the README.
d = tmp();
const e2 = { NOTES_FILE: path.join(d, 'n.json') };
const outs = [run(d, e2, 'add', 'buy', 'milk').out, run(d, e2, 'list').out, run(d, e2, 'search', 'MILK').out, run(d, e2, 'remove', '9').out, run(d, e2, 'remove', 'abc').out, run(d, e2, 'remove', '1').out, run(d, e2).out];
console.log('Z3 outputs:', JSON.stringify(outs));

// Structure: C2 circular import, C7 dead code, Z1 dependencies.
const src = (f) => (fs.existsSync(path.join(repo, f)) ? fs.readFileSync(path.join(repo, f), 'utf8') : '');
console.log('C2 store.js imports commands.js:', /from ['"]\.\/commands\.js['"]/.test(src('src/store.js')));
const cmds = src('src/commands.js');
console.log('C1 direct fs calls left in commands.js:', (cmds.match(/fs\.\w+Sync/g) || []).length);
console.log('C7 migrateV1 present:', /migrateV1/.test(fs.readdirSync(path.join(repo, 'src')).map((f) => src(`src/${f}`)).join('')));
const pkg = JSON.parse(src('package.json'));
console.log('Z1 dependencies:', JSON.stringify({ ...pkg.dependencies, ...pkg.devDependencies }));
console.log('src files:', fs.readdirSync(path.join(repo, 'src')).join(', '));
