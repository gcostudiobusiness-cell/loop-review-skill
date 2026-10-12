All claims verified against the final code. Server stopped, nothing committed.

## /loop-review report

**Goal:** make the account settings page usable on mobile and by keyboard, with clear form errors
**Scope:** `public/index.html`, `public/styles.css`, `public/app.js`, `public/validate.js`, `test/validate.test.js`
**Rounds:** 2 of 2, stopped because: **Cap**. The definition of done was already measurably met after round 1; I spent round 2 reviewing my own changes rather than stopping with unreviewed code, and it found three real regressions I had introduced.

### Baseline
- Revision `38d4325`, working tree **clean** — baseline dirty list empty, so full rollback is available.
- Constraint honoured: **no dependencies added** (no installs, no CDN, no new imports).
- Checks before: `npm test` → **2 passed, 0 failed**.

### Changes
- **`public/index.html`** — viewport meta; `lang="en"`; real `<label for>` per field (placeholders removed as redundant); per-field `<p class="error" role="alert" id="X-error">` wired via `aria-describedby`; Save `<div>` → `<button type="submit">`; `<p id="status" role="status">`; `method="post"`. (B-1/A-3/D-1, T-1/B-2/A-1/D-2, B-4/D-4a, T-2/B-5/A-2/D-4b, A-4, R2 T-1)
- **`public/styles.css`** — `.page` fixed `960px` → `max-width` + `padding` + `box-sizing`; grid single-column with a 600px breakpoint preserving the original 2×2; `outline: none` → `2px solid #2d6cdf`; hint `#aaa` → `#666`; inputs 16px / 44px min-height; `.error`/`.status` styles. (B-1/A-3/D-1, B-3/D-3, D-5a)
- **`public/app.js`** — click-on-div → form `submit` with `preventDefault`; `setFieldError` sink renders messages via `textContent` and toggles `aria-invalid`; save wrapped in `try/catch` with a `!response.ok` check, `Content-Type: application/json`, and status feedback; submit token so a stale response cannot overwrite a newer one. (T-2/B-5/A-2/D-4b, A-4, R2 B-1/T-4/A-3)
- **`test/validate.test.js`** — three tests added asserting every invalid field returns a non-empty message string, at the point the messages are produced.

Two changes go slightly beyond the literal defect and I want them visible: **`method="post"`** (one attribute, inert while JS works) and the **submit token** (~4 lines, no visible surface). Both close regressions my own round-1 fixes created.

### Verification
Checks after: **5 passed, 0 failed** (was 2/2; no test was weakened).

| Measurement @375px | before → after |
|---|---|
| scrollWidth vs innerWidth | 960 vs 375 (overflow) → **375 vs 375, none** |
| Fields visible | 0 of 4 → **4 of 4** |
| Tab stops | 4 → **5** (Save now included) |
| Focus ring drawn | 0 of 4 → **5 of 5** (`2px solid #2d6cdf`) |
| Accessible names | 0 of 4 → **4 of 4** via `<label for>` |
| Viewport meta / `lang` | absent → **present / `en`** |
| Hint contrast | #aaa ≈2.3:1 (fails AA) → **#666 ≈5.7:1** |

Screenshots — before: `../shots/page-2026-10-12T12-45-33-652Z.png` (375), `…12-45-52-972Z.png` (1280). After: `…12-50-15-532Z.png` (375), `…12-50-41-139Z.png` (375 error state), `…12-51-08-580Z.png` (1280, original 2×2 preserved).

Behaviour proven in the browser, not just inferred: Enter in a field submits with **no navigation**; both messages render with `aria-invalid="true"` and resolve through `aria-describedby`; the failed-save path reports instead of failing silently. The stale-response guard was proven with a stubbed fetch racing a slow failure against a fast success — the stale failure was suppressed and the final status was `Settings saved.`

**Not verified by automated test:** everything in `app.js` and the markup. `npm test` only exercises `validate.js`; the DOM wiring is verified by rendered browser measurement only. Building a dependency-free DOM harness in a final round that nothing would review was the wrong trade, but this is a real gap (R2 T-2).

### Per round
- **Round 1:** all four reviewers ran. 9 accepted / 2 rejected / 2 asked / 1 backlogged.
- **Round 2:** all four reviewers ran. 2 accepted / 4 rejected / 0 asked / 3 backlogged. The two round-2 fixes **were not seen by any reviewer**.

### Remaining issues
- **Duplicate PUTs on double-tap.** Measured `fetchCalls: 2`. The token fixes the *message*, not the duplicate writes. Correct fix — disabling the button during the request — is a visible behaviour change I would not make unreviewed.
- **Hint position vs. its ARIA association.** "Max 30 characters" renders after all four fields while `aria-describedby` ties it to Display name. The position is unchanged from baseline; my ARIA wiring is what made the two disagree. Moving it is a visible layout change (R2 T-3/A-2/D-1).
- **Live-region re-announcement** on an unchanged repeat message, and two simultaneous `role="alert"` updates possibly interrupting each other. Needs real screen-reader testing — **unverified**, source review only.
- `:focus` on inputs vs `:focus-visible` on the button — cosmetic inconsistency for mouse users; keyboard behaviour identical.

### Needs your decision
1. **The hint says "Max 30 characters"; `validate.js:5` enforces 40.** Confirmed contradiction, but which number is the product rule is yours to set — changing either is a behaviour change. I deliberately did **not** add a boundary test, because pinning 40 would lock in output that may be wrong.
2. **Email with a leading/trailing space is rejected** (mobile autofill commonly adds one), and **the phone regex rejects `+1 555-123-4567`**. Trimming or loosening changes what `validate()` accepts.

### Rejected suggestions
- *Derive the field list from markup* / *null-guard `setFieldError`* — the literal currently matches the DOM exactly; both guard against hypothetical future edits, not present defects.
- *Route server-side per-field errors* — speculative about an API response shape I cannot observe.
- *favicon 404* — benign console noise.

### Feature backlog
- Focus the first invalid field on failed submit.
- Clear a field's error on `input` rather than only on resubmit.
- A visible "Digits only." hint under Phone.
- DOM-level tests for `app.js` (feasible dependency-free with a minimal shim).

**Nothing was committed, pushed, or installed.** `git diff` shows every change; four files are modified and no files were added. No browser artifacts were written into the repo.