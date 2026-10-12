## /loop-review report

**Goal:** make checkout pricing correct and the checkout page usable
**Scope:** `src/cart.js`, `test/cart.test.js`, `public/index.html`
**Rounds:** 2 of 2 — stopped because: **Cap** (round 2 = max_rounds)

### Baseline
Revision `f9be5c2`. Baseline-dirty: `README.md` (1 inserted line, never touched by this run — still `1 0` in `git diff --numstat`). No CLAUDE.md/AGENTS.md in the target. Checks before: `npm test` (`node --test`) → **3 pass / 0 fail**.

### Changes
- **`src/cart.js`** — `total()` now rounds to 2dp through an internal `round2()`, applied once (T-3/B-3/A-2 r1). `addItem` throws `TypeError` on non-finite/negative `price` and non-finite/≤0 `qty` (T-4/B-5 r1), and now refreshes `existing.price` as well as `qty`, so re-adding a sku at a new price no longer charges the stale one (B-1/A-1 r2). `applyDiscount` normalises the code with `trim().toUpperCase()` (T-4 r1). Rounding comment narrowed to what is actually guaranteed (A-4 r2).
- **`public/index.html`** — item rows built with `createElement` + `textContent` and the error set via `textContent`, closing the injection hole (T-1/B-1/A-3/D-1 r1). Apply and Pay are real `<button type="button">`; `<label for="code">` added; `#msg` given `role="status" aria-live="polite"` (T-2/B-2/D-2/D-3 r1). Added `WELCOME5` to the page's `codes` table (B-4/A-1 r1). `money()` helper formats all amounts to 2dp, and the page now computes tax-then-discount, matching `total()`'s formula literally (A-2 r1). `.error` `#ff7b7b` → `#c62828` and `.pay` `#7fb3ff` → `#1f5fbf` for AA contrast (D-4 r1); viewport meta added and `width: 900px` → `max-width` (D-5 r1). `hasOwnProperty` replaces truthiness. An invalid code now **keeps** any code already applied, matching `applyDiscount` (T-1 r2); a valid code announces "<CODE> applied" in the live region instead of clearing it (D-1 r2); an empty field says "Enter a discount code" instead of `" is not valid"` (D-2/B-2 r2).
- **`test/cart.test.js`** — 3 → 10 tests: 2dp rounding with the real `4.99 × 3` fixture, discounted total, code normalisation, rejected code leaving the cart alone, `addItem` validation, duplicate-sku replace-and-refresh, and a dependency-free parity test that reads both files as text and asserts the rate tables and tax rate match. Parity key regex widened to catch quoted and lower-case keys (A-2 r2).

### Verification
Checks after: **10 pass / 0 fail**. No fix exceeded ~30 lines of non-test code.

I could not run `node` directly (approval declined), so two verifications went through `npm test` using temporary probe tests that I then removed:
- The parity test genuinely fails on a changed rate, a dropped code, and a changed tax rate (3/3 detected).
- The old parity regex reported a page carrying an extra `"SAVE20": 0.2` as **identical** to the module — a real false pass — while the widened regex flags it.

**Not run:** nothing rendered in a browser. Every UI finding (keyboard operability, accessible names, contrast ratios, reflow at 375px, and that the injection fix holds) is source-level reasoning only and still wants one manual pass with a keyboard and a screen reader.

**Final-round fixes no reviewer saw:** `existing.price = price`, the removal of `rate = 0` from the invalid branch, the success and empty-field messages, the widened parity regex, the duplicate-sku test, and both comment corrections.

### Per round
- **Round 1:** all four reviewers ran (tester, builder, architect, design-critic). 10 accepted / 2 rejected / 2 asked / 3 backlogged.
- **Round 2:** all four ran. 6 accepted / 1 rejected / 0 asked (2 carried over) / 2 remaining.

### Remaining issues
- Nothing executes the page's inline `apply()`/`render()`, so page-vs-module behaviour is only guarded on the rate tables, not the logic. My round-1 `rate = 0` divergence passed 9/9 green because of exactly this (T-2/B-3 r2).
- The parity test compares data, not the **total formula**. Changing the discount/tax order on one side alone still leaves the parity test passing (A-3 r2).
- Enter in the discount field does nothing — no `<form>` wrapper (T-3 r2).
- No way to remove a discount once applied, in either the page or `cart.js`.
- `Math.round(v * 100) / 100` has the classic half-cent edge (`1.005`); no current catalogue value hits it.

### Needs your decision
1. **`addItem` semantics:** it *replaces* quantity on a duplicate sku despite its name. Should it sum instead, or be renamed `setQty`? Test currently pins today's replace behaviour. Changing it alters public API semantics, so I left it.
2. **Serve the page** so it can `import src/cart.js` and delete the duplicated tables entirely? That changes how the product is run (it currently opens from `file://`), so I kept the inline copy plus the parity test.

### Rejected suggestions
- `if (codes[c])` truthiness vs a hypothetical 0%-rate code — speculative, no such code exists (A-4 r1); the `hasOwnProperty` change landed anyway as part of the reset fix.
- Having `cart.js` clear a previously valid `discountCode` when a later apply fails — a prior valid discount legitimately stays, and no removal path was requested (A-4 r1). Round 2 confirmed this reading and I brought the page into line with it rather than the reverse.
- Half-cent rounding boundary — the builder itself called it speculative (r2).

### Feature backlog
- Rename `addItem` → `setQty`, or add a separate summing API.
- Quantity controls and `removeItem` on the page (it has no mutation path at all today — the items array is a literal).
- A "remove discount" affordance.
- Render a subtotal/tax breakdown, not just the total.

Nothing was committed, pushed, or installed, and no dependencies were added. `git diff` shows every change; `git diff src test public` excludes the pre-existing `README.md` edit, which I did not touch.
