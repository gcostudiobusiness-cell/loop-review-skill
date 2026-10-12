README.md's `+1` is the pre-existing baseline change — I never opened it for edit.

## /loop-review report

**Goal:** make checkout pricing correct and the checkout page usable
**Scope:** `src/`, `test/`, `public/`
**Rounds:** 2 of 2, stopped because: **Cap** (round 2 also found no blockers)

### Baseline
- Revision `7f53c52`; dirty: `README.md` (untouched throughout)
- Checks before: `npm test` → **3 pass / 0 fail**

### Changes

**`src/cart.js`**
- Discount lookup now goes through one `hasOwnProperty`-guarded helper. Previously `applyDiscount(cart, "constructor")` returned `true` and `total()` returned `NaN` — confirmed by running it. (A-2)
- `addItem` throws `TypeError` on a non-string/empty sku, a non-finite or negative price, or a non-integer/non-positive qty. Previously `price:-5` gave a total of `-6` and `price:"abc"` gave `NaN`. (T-2/B-3/A-3)
- `total()` rounds to whole pence. **This changes its return value** — it returned `29.964` and `26.967599999999997` before. (T-4/B-5/D-2/A-4)
- Comments documenting the tax-then-discount order, the replace-not-accumulate qty rule, and that a rejected code leaves an existing discount in place. (A-4)

**`public/index.html`**
- Discount error is now `textContent`, not string-concatenated `innerHTML` — closes the injection hole. (T-1/B-1/D-1)
- Same `hasOwnProperty` guard on the page's code table. (A-2)
- Added the missing `WELCOME5` code; page was rejecting a code `cart.js` accepts. (T-5)
- Money rendered via `toFixed(2)`, using the same rounding as `cart.js`. (D-2)
- Apply and Pay now are `<button type="button">` instead of `<span>`/`<div onclick>`; `<label for="code">`; `aria-describedby="msg"`; `role="status" aria-live="polite"` on `#msg`; `lang="en"`; `<meta charset>`; `<meta viewport>`; `width:900px` → `max-width`. (T-3/B-4/A-5/D-3/D-4/D-2r2)
- Contrast: `.error` `#ff7b7b` → `#b3261e`, `.pay` `#7fb3ff` → `#1b5fbf`. (D-5)

**`test/cart.test.js`** — regression tests for the discount effect on `total()`, pence rounding, inherited-key codes, and every `addItem` rejection.
**`test/pricing-consistency.test.js`** (new) — reads `public/index.html` and asserts its tax rate, code table and basket total agree with `src/cart.js`, and that `#msg` is not written via `innerHTML`. (A-1(b))

### Verification
- Checks after: `npm test` → **11 pass / 0 fail**.
- Every pricing fix is asserted at the source (`src/cart.js`'s return values), not only where it is displayed.
- The drift guard was proved to work: skewing the page's `WELCOME5` rate to `0.07` failed 2 tests; restored and green.
- **Not run:** no browser was available, so the `<button>`/label/live-region/contrast fixes are verified by source review only. The XSS fix is verified structurally (a test asserts `#msg` is never written via `innerHTML`), not by executing a payload in a browser.
- **Round-2 fixes no reviewer saw:** the rewritten consistency test, `aria-describedby`, and the two comments.

### Per round
- **Round 1:** all 4 reviewers ran — 8 accepted, 3 rejected, 1 asked, 1 backlogged
- **Round 2:** all 4 reviewers ran, no blockers — 3 accepted, 0 rejected, 3 asked, 2 backlogged

### Remaining issues
- Keyboard users can't press Enter in the discount field; they must Tab to Apply. (T-2)
- Applying a valid code announces nothing to a screen reader — `#msg` is cleared on success and `#total` is not a live region. (A-2/D-1)
- `aria-invalid` is not toggled on the input. (D-2)

### Needs your decision
1. **`addItem` and a repeated sku.** It replaces `qty` and **keeps the original `price`**, so re-adding at a new price silently charges the old one. Changing either is a semantics change to an existing function (hard rule 8) — I left it as-is and documented it.
2. **Rejected code keeps the prior discount.** Both layers show "X is not valid" beside a still-discounted total. Clearing it is a user-visible change.
3. **Success confirmation message** ("SAVE10 applied") would fix the silent-success a11y gap but adds a new user-visible message.
4. **`total()` now returns a rounded value.** Called out explicitly in case anything downstream depends on the raw float.
5. This repo has **no `CLAUDE.md`/`AGENTS.md`**. Happy to write one.

### Rejected suggestions
- *"The page discounts before tax, `cart.js` after"* (A-1/B-2) — **wrong**. Both produce `26.967599999999997`; a proportional discount commutes with tax.
- *Import `src/cart.js` into the page as an ES module* (B-2/A-1a) — would require an HTTP server, breaking `file://` use. Used the drift test instead.
- *`4.99*3` shows float noise* (B-5/D-2) — **wrong**, it is exactly `14.97`.
- *Export `DISCOUNTS`* (A-3) — new public API in the final round.

### Feature backlog
- `<form>` wrapper for Enter-to-submit (T-2/A-5)
- Visual hierarchy between Apply and Pay now (D-3)
- Case-insensitive discount codes (T-2 note)

Nothing was committed, pushed or deployed — `git diff` plus the untracked `test/pricing-consistency.test.js` is the complete change set.
