## /loop-review report

**Goal:** make checkout pricing correct and the checkout page usable **Scope:** `src`, `test`, `public` **Rounds:** 2 of 2, stopped because: **Cap** (round 2 = max_rounds; no blockers remained either)

### Baseline
Revision `894a358`. Baseline dirty: `README.md` (never touched). Checks before: `npm test` → **3 pass / 0 fail**. No `CLAUDE.md`/`AGENTS.md` in this repo — flagged per your global rule 5; I can write one on request.

### Changes
- **src/cart.js** — `addItem` now throws `TypeError` on non-finite or negative `price`/`qty`; previously `price: -5` produced a total of `-6` silently (T-2/B-3/A-3). `total()` falls back to a 0 rate for a `discountCode` not in the table; previously returned `NaN` (T-4).
- **public/index.html** — Apply and Pay now are real `<button type="button">` (were `<span>`/`<div>`, unreachable by keyboard — D-1/T-3/B-4). Added `<label for="code">`, `aria-live="polite"` message region, `aria-describedby`, and `aria-live` on the total so the success path is announced (B-5/D-5, round-2 D-1 partial). Error text set via `textContent` instead of `innerHTML` — closed an injection path fed by the code field (A-2). Added `lang`, `charset`, viewport meta; `width:900px` → `max-width` with wrapping rows (D-2). `.error` `#ff7b7b` → `#c1121f` and `.pay` `#7fb3ff` → `#1d4ed8` for WCAG AA (D-3/D-4; round 2 recomputed these at 6.24:1 and 6.76:1). Money formatted `toFixed(2)` (was `£17.964000000000002`). Discount table synced with `cart.js` — `WELCOME5` was valid in the module and rejected by the page (T-1/B-2/A-1); lookup aligned to `!== undefined`.
- **test/cart.test.js** — regression tests for discount+tax together, invalid `price`/`qty` (including `qty: -1`), unknown code not producing `NaN`, plus a drift guard comparing the page's constants against `cart.js`, with readable failure messages.

### Verification
`npm test` after: **7 pass / 0 fail**. I confirmed the drift guard has teeth by breaking the page's constants on purpose (it failed with an assertion), then restoring — final state re-run green. Not run: nothing rendered in a browser; keyboard, screen-reader and contrast findings were verified by reading source and recomputing ratios, not by driving the page. Round 2's fixes (`aria-live` on total, `aria-describedby`, the three test-only changes) were **not seen by any reviewer**.

### Per round
- Round 1: all four reviewers ran — 9 accepted, 2 rejected, 3 asked, 1 backlogged.
- Round 2: all four reviewers ran — 4 accepted (all no-behaviour-change), 2 rejected, 1 asked, 0 backlogged.

### Remaining issues
- The **total formula** is still duplicated between the page and `cart.js` and is not guarded — only the constants are. They're algebraically identical today, so no numeric divergence, but a future non-commutative change (per-line rounding, a discount cap) would leave the page wrong with a green suite. The comment on the guard test now says this explicitly.
- Pressing **Enter** in the discount field does nothing; you must Tab to Apply. Not a blocker (Tab+Enter works), and the fix adds a handler, so it was out of bounds for the final round.
- No success message on a valid code — the total is now announced, but there's no "discount applied" text.
- Drift guard is coupled to the source formatting of both files; a rename or reformat of the literals needs the guard updated (it now says so when it can't find them).

### Needs your decision
1. **Import `src/cart.js` into the page?** This is the real fix for duplication, but ES module imports are blocked on `file://`, so the page would have to be served over http — a change to how the product is run.
2. **`addItem` overwrites `qty` rather than accumulating** (`addItem(tea,2)` then `addItem(tea,1)` charges for 1). It also keeps the old price. Which is intended?
3. **Case/whitespace on discount codes** — `save10` and ` SAVE10` are rejected today. Intended or not?
4. **A rejected code leaves an earlier valid discount in place** — defensible, but it means the page can show "NOPE is not valid" next to a discounted total.

### Rejected suggestions
- *Discount applied after tax is a pricing bug* (builder B-1) — wrong. `(sub·1.2)·(1−r)` ≡ `(sub−sub·r)·1.2`; no observable difference. The architect independently flagged this as a false lead.
- *Clear the discount when a later code is rejected* — retaining a previously valid discount is defensible; changing it is a state-semantics decision, not a defect.
- *Mirror cart.js's operation order in the page for readability* — cosmetic, and the final round's bar is blockers.

### Feature backlog
- A real payment flow (`pay()` is `alert("Paid!")`, and it will "pay" on an empty cart).
- `aria-invalid` toggling on the code input, and an inline success confirmation.
- Enter-to-submit on the discount field.

Nothing was committed, pushed or installed; `README.md` was not touched. `git diff` shows every change.
