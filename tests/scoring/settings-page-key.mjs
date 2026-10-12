// Checks the settings-page answer-key rows (S7-S9) and computes WCAG contrast.
// Usage: node tests/scoring/settings-page-key.mjs <trial-repo> [name=#hex ...]
const dir = process.argv[2];
const { validate } = await import(`${dir}/public/validate.js`);
console.log('S7 ana+forum@example.com errors:', JSON.stringify(validate({ name: 'Ana', email: 'ana+forum@example.com' })), '({} = fixed)');
console.log('S9 phone "+44 7700 900123":', JSON.stringify(validate({ name: 'Ana', email: 'a@b.co', phone: '+44 7700 900123' })), '({} = fixed)');
console.log('S8 41-char name rejected:', Boolean(validate({ name: 'x'.repeat(41), email: 'a@b.co' }).name), '| 31-char rejected:', Boolean(validate({ name: 'x'.repeat(31), email: 'a@b.co' }).name));
const L = (h) => { const c = [0, 2, 4].map((i) => parseInt(h.slice(1 + i, 3 + i), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const cr = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return ((x + 0.05) / (y + 0.05)).toFixed(2); };
for (const [n, c] of process.argv.slice(3).map((s) => s.split('='))) console.log(`contrast ${n} ${c} on #fff: ${cr(c, '#ffffff')}`);
