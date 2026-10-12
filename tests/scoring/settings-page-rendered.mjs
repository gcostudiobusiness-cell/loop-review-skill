// Rendered scoring for settings-page (M2): serves <trial-repo>/public and measures it in headless Chromium.
// Usage: PW_CORE=<path to playwright-core> node tests/scoring/settings-page-rendered.mjs <trial-repo> [port]
// Uses the playwright-core that @playwright/mcp@0.0.83 already put in the npx cache; installs nothing.
import { spawn } from 'node:child_process';
import path from 'node:path';

const repo = path.resolve(process.argv[2]);
const port = Number(process.argv[3] || 8790);
const pw = await import(path.join(process.env.PW_CORE, 'index.js'));
const { chromium } = pw.chromium ? pw : pw.default;
const server = spawn('python3', ['-m', 'http.server', String(port), '-d', path.join(repo, 'public')], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
const url = `http://127.0.0.1:${port}/`;
const L = (rgb) => { const c = rgb.match(/\d+/g).slice(0, 3).map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const cr = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return +((x + 0.05) / (y + 0.05)).toFixed(2); };
const out = {};
let browser;
try {
  // Same browser the MCP server uses (installed Chrome), so nothing is downloaded.
  browser = await chromium.launch({ channel: 'chrome' });
  for (const [w, h] of [[375, 812], [1280, 800]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const errors = []; page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(url);
    const m = await page.evaluate(() => {
      const r = (el) => el && el.getBoundingClientRect();
      const name = document.getElementById('name');
      const hint = [...document.querySelectorAll('.hint')][0];
      return {
        overflow: `${document.documentElement.scrollWidth}/${innerWidth}`,
        labelled: ['name', 'email', 'phone', 'lang'].map((id) => document.getElementById(id)?.labels?.length || 0).join(''),
        hintGapPx: name && hint ? Math.round(r(hint).top - r(name).bottom) : null,
        minTargetPx: Math.round(Math.min(...[...document.querySelectorAll('input,select,button,#save')].map((e) => r(e).height))),
        colours: { hint: hint && getComputedStyle(hint).color, border: name && getComputedStyle(name).borderTopColor },
      };
    });
    const stops = [];
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      stops.push(await page.evaluate(() => { const a = document.activeElement; const s = getComputedStyle(a); return `${a.tagName.toLowerCase()}#${a.id}${s.outlineStyle === 'none' ? '(no ring)' : ''}`; }));
    }
    out[w] = { ...m, tabs: stops.join(' > '), contrast: { hint: m.colours.hint && cr(m.colours.hint, 'rgb(255,255,255)'), border: m.colours.border && cr(m.colours.border, 'rgb(255,255,255)') }, jsErrors: errors.length };
    delete out[w].colours;
    if (w === 375) {
      // Empty submit via the keyboard: focus Display name, press Enter.
      await page.goto(url);
      await page.focus('#name');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      out.enterInField = await page.evaluate(() => ({ reloaded: performance.getEntriesByType('navigation')[0]?.name !== location.href || location.search !== '', url: location.search, visibleErrors: [...document.querySelectorAll('[id$="-error"], .error')].filter((e) => e.offsetParent && e.textContent.trim()).length, focus: document.activeElement.id }));
      // Click Save with empty fields.
      await page.goto(url);
      await page.click('#save');
      await page.waitForTimeout(300);
      out.emptySave = await page.evaluate(() => ({ visibleErrors: [...document.querySelectorAll('[id$="-error"], .error')].filter((e) => e.offsetParent && e.textContent.trim()).map((e) => e.textContent.trim()), ariaInvalid: ['name', 'email', 'phone'].map((id) => document.getElementById(id).getAttribute('aria-invalid')).join(','), focus: document.activeElement.id }));
      // Valid save against the static server (PUT returns 501).
      await page.goto(url);
      await page.fill('#name', 'Ana'); await page.fill('#email', 'ana@example.com');
      await page.click('#save');
      await page.waitForTimeout(800);
      out.failedSave = await page.evaluate(() => [...document.querySelectorAll('[role=status],[role=alert],[aria-live]')].map((e) => e.textContent.trim()).filter(Boolean).join(' | ') || '(nothing shown)');
      out.failedSaveJsErrors = errors.length;
    }
    await page.close();
  }
} finally {
  await browser?.close();
  server.kill();
}
console.log(JSON.stringify(out, null, 1));
