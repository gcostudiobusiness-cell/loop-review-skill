// Scores settings-page (M3 T2) by running the real public/app.js against a minimal stub DOM.
// Usage: node tests/scoring/settings-page-dom.mjs <trial-repo>. No dependencies.
import fs from 'node:fs';
const dir = process.argv[2];
const html = fs.readFileSync(`${dir}/public/index.html`, 'utf8');
const els = new Map();
const mk = (id, attrs = {}) => {
  const listeners = {};
  const a = { ...attrs };
  const el = { id, value: '', textContent: '', hidden: 'hidden' in a, dataset: {}, focused: false,
    classList: { set: new Set(), toggle(c, on) { on ? this.set.add(c) : this.set.delete(c); }, add(c) { this.set.add(c); }, remove(c) { this.set.delete(c); }, contains(c) { return this.set.has(c); } },
    getAttribute: (k) => (k in a ? a[k] : null), setAttribute: (k, v) => { a[k] = String(v); }, removeAttribute: (k) => { delete a[k]; }, hasAttribute: (k) => k in a,
    addEventListener: (t, f) => { (listeners[t] ||= []).push(f); }, focus() { globalThis.__focused = id; }, querySelector: () => null, querySelectorAll: () => [],
    dispatch: async (t, ev = {}) => { for (const f of listeners[t] || []) await f({ preventDefault() { ev.prevented = true; }, target: el, ...ev, }); return ev; }, attrs: a };
  els.set(id, el); return el;
};
for (const m of html.matchAll(/<(\w+)([^>]*\sid="([^"]+)"[^>]*)>/g)) {
  const attrs = {}; for (const x of m[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g)) attrs[x[1]] = x[2] ?? '';
  mk(m[3], attrs).tag = m[1];
}
const form = els.get('settings');
globalThis.document = { getElementById: (id) => els.get(id) || null, querySelector: () => null, querySelectorAll: () => [], activeElement: null };
globalThis.FormData = class { constructor() { this.e = ['name', 'email', 'phone', 'lang'].map((k) => [k, els.get(k)?.value ?? '']); } entries() { return this.e[Symbol.iterator](); } [Symbol.iterator]() { return this.e[Symbol.iterator](); } };
let fetches = []; let fetchOk = true;
globalThis.fetch = async (url, opts) => { fetches.push([url, opts]); if (fetchOk === 'throw') throw new Error('net'); return { ok: fetchOk, status: fetchOk ? 200 : 500 }; };
await import(`${dir}/public/app.js`);
const tick = () => new Promise((r) => setTimeout(r, 0));
const submit = async () => { const ev = {}; try { if (form?.dispatch) await form.dispatch('submit', ev); const s = els.get('save'); if (s && !ev.prevented) await s.dispatch('click', ev); } catch (e) { console.log('  UNHANDLED REJECTION:', e.message); } await tick(); return ev; };
const show = (f) => { const e = els.get(f); return { invalid: e.attrs['aria-invalid'] ?? null, describedby: e.attrs['aria-describedby'] ?? null }; };
const visibleText = (id) => (els.get(id) && !els.get(id).hidden ? els.get(id).textContent : null);
const findMsg = (f) => [...els.values()].filter((e) => e.textContent && !e.hidden && (e.id.includes(f))).map((e) => e.textContent);
console.log('save element tag:', els.get('save')?.tag, els.get('save')?.attrs.type ?? '');
let ev = await submit();
console.log('submit prevented (no page reload):', Boolean(ev.prevented));
for (const f of ['name', 'email']) console.log(` ${f}:`, JSON.stringify(show(f)), 'shown text:', JSON.stringify(findMsg(f)));
const live = [...els.values()].filter((e) => /status|alert/.test(e.attrs.role || '') || 'aria-live' in e.attrs);
console.log(' live regions:', live.map((e) => `${e.id}="${e.textContent}"`).join(' | ') || 'none', '| focus:', globalThis.__focused ?? 'none', '| fetches:', fetches.length);
els.get('name').value = 'Ana'; els.get('email').value = 'ana@example.com';
fetchOk = false; await submit(); console.log('server 500 ->', live.map((e) => `${e.id}="${e.textContent}"`).join(' | '), '| fetches:', fetches.length);
fetchOk = 'throw'; await submit(); console.log('network error ->', live.map((e) => `${e.id}="${e.textContent}"`).join(' | '));
fetchOk = true; await submit(); console.log('ok ->', live.map((e) => `${e.id}="${e.textContent}"`).join(' | '), '| body:', fetches.at(-1)[1].body);
