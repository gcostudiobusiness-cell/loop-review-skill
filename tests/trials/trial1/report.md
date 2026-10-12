## /loop-review report

**Goal:** make checkout pricing correct and the checkout page usable
**Scope:** `src/`, `test/`, `public/` · **Rounds:** 2 of 2, stopped because: **Cap** (round 2 = max_rounds)

### Baseline
Revision `5bb14f6`. Baseline dirty: `README.md` — never touched (its `+1` line in the diffstat is the pre-existing change, verified). Checks before: `npm test` → **3 pass / 0 fail**.

### Changes
- **`src/cart.js`** — became the single source of truth. Added `CATALOGUE` (frozen seed data), `roundMoney`, `formatMoney` (Intl, no dependency), `lineTotal`, `taxLabel()`, `priceBreakdown()`, `removeDiscount`, `isValidDiscountCode`/`discountRate`/`discountCodes`. Discount now applies pre-tax, then VAT on the discounted amount; money is rounded once, here. `Object.hasOwn` guard stops inherited keys (`constructor`, `__proto__`) being accepted as codes and producing a `NaN` total. `addItem` validates price/qty and carries `name`. `DISCOUNTS`/`CATALOGUE` frozen. *(T-2/B-1/A-1/D-2, T-3/B-2/A-2/D-5, A-4, A-5, B-1, B-2, A-3, T-1/A-1r2)*
- **`public/index.html`** — rewritten. Imports all pricing from `../src/cart.js` via `<script type="module">`; holds no prices, codes, tax rate or tax label. Real `<form>`/`<button>` controls with `:focus-visible`, `<label for="code">`, `role="status" aria-live="polite"` message region that announces the new total, `aria-describedby`/`aria-invalid` on the input, `role="list"` basket, `<dl>` totals breakdown (subtotal / discount / VAT / total), a **Remove** control for an applied discount, viewport meta and a 560px-max responsive layout. Messages are built with `textContent` — the XSS via `innerHTML` is gone. Contrast-corrected palette. Rows and totals both derive from `cart.items`. *(T-1/A-3, T-4/B-3/D-1, D-3/D-4, A-4r2/D-4r2, D-1r2/D-2r2/D-3r2/T-5r2)*
- **`test/cart.test.js`** — 3 → 24 tests: discount+tax, `WELCOME5`, rounding to whole pence, breakdown consistency, empty cart, unknown/non-string/prototype codes, case sensitivity, `addItem` validation and semantics, `formatMoney`, `lineTotal`↔`subtotal` agreement, rounding order pinned, `removeDiscount`, frozen catalogue, `taxLabel` derivation.
- **`test/page.test.js`** (new) — 4 guard tests on the page source, rewritten after round 2 flagged my first attempt as false assurance: discount codes derived from `discountCodes()`, `price:` literal ban, tax-rate and `%`-label bans, broad HTML-sink ban, attribute-level (not whole-tag) a11y assertions.

### Verification
`npm test` after: **28 pass / 0 fail**. I mutation-tested the guards rather than trusting green: setting `TAX_RATE = 0.15` fails 5 pricing tests, and leaking `SAVE10` into the page fails the drift guard. Both mutations reverted.

**Not run:** the page was never opened in a browser — no browser is available here, and ad-hoc `node` scripts were denied by the permission prompt, so all page behaviour (keyboard focus order, screen-reader announcement, contrast as rendered, the ESM load itself) is verified by source review and the guard tests only, not by running it.

### Per round
- **Round 1:** all 4 reviewers ran. 12 accepted / 1 rejected / 1 asked / 1 backlogged. Result: 19 pass / 0 fail (one of my own tests failed first and I fixed the test).
- **Round 2:** all 4 reviewers ran, against my round-1 code. 10 accepted / 1 rejected / 1 backlogged. Round 2 found real defects I had introduced — a hardcoded `VAT (20%)` label reproducing the exact duplication I had just removed, guard tests that gave false assurance, and a rejected code silently leaving the previous discount live.

### Remaining issues
- **No behavioural test touches the page's event handlers.** Every page assertion is a static source match. A bug inside the submit or Remove handler would pass `npm test`. Closing this needs jsdom, which `do not add dependencies` forbids.
- Long product names are wrapped rather than truncated; untested in a browser.
- Valid codes are never shown to the customer — `discountCodes()` is exported but unused by the page.

### Needs your decision
1. **The page now requires an HTTP server.** ESM imports are blocked over `file://`, so double-clicking `public/index.html` will no longer work. This was the only way to give the page and the pricing module one source of truth without a build step. If opening the file directly matters, say so and I'll switch to keeping one literal table in `src/cart.js` with the drift guard test instead.
2. **`addItem` sets quantity rather than adding to it** — a function named "add" that replaces. I left the behaviour alone and documented it; it should be renamed `setQuantity` or changed to `+=`. Your call.
3. **The page upper-cases codes** so `save10` works there, while `applyDiscount` stays case-sensitive. Deliberate, but confirm you want the leniency.

### Rejected suggestions
- **T-2 (round 2), DOM-event tests** — not achievable without jsdom under the no-dependencies constraint. Recorded above as a remaining issue rather than silently dropped.

### Feature backlog
- A discount that rounds to £0.00 on a tiny basket still reports "applied" (unreachable with the current catalogue).
- `pay()` is a status message, not a payment flow — needs real integration and focus management.
- Editable quantities / remove-line, which is what the `cart.items` refactor was making safe.

**Nothing was committed, pushed or deployed, and no dependency was added.** `git diff` plus the untracked `test/page.test.js` shows every change; `README.md` is exactly as you left it.
