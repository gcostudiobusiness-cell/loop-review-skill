## /loop-review report

**Goal:** make the account settings page usable on mobile and by keyboard, with clear form errors
**Scope:** `public/index.html`, `public/styles.css`, `public/app.js`, `public/validate.js`, `test/`
**Rounds:** 2 of 2, stopped because: **Cap** (round 2 = max_rounds). The definition of done was already met after round 1; round 2 was spent reviewing round 1's own fixes, which no reviewer had seen.

### Baseline
Revision `8c1c1fe`, working tree **clean** — no baseline-dirty files, so nothing was off-limits. No `CLAUDE.md`/`AGENTS.md` in this repo (flagged: it has no rulebook). Checks before: `npm test` → **2 pass / 0 fail**.

### Changes
- **`public/index.html`** — `lang="en"` and the viewport meta (B-5, A-4, D-1); each control wrapped in a `.field` with a real `<label for>` plus `autocomplete` and `type=email/tel` (T-4, B-4, D-3); a `<p class="error" id="{field}-error">` per validated field wired by `aria-describedby` (T-1, B-4, A-2, D-4); the `<div id="save">` became `<button type="submit">` (T-2, B-2, A-1, D-2); a `role="status" aria-live="polite"` region for the save outcome (A-3, D-4).
- **`public/app.js`** — the listener moved from the div's `click` to the form's `submit` with `preventDefault()`, which also fixes Enter-in-a-field reloading the page and discarding input (T-3); the per-field loop now sets `aria-invalid` and the error element's text instead of discarding `validate()`'s messages (T-1, A-2); `fetch` declares `Content-Type: application/json`, is wrapped in `try/catch` and branches on `response.ok` so a failed save is no longer silent (A-3).
- **`public/styles.css`** — `box-sizing: border-box`; `.page` fluid with `max-width: 960px` and 16px side padding; `.grid` collapses to one column under 600px; `.field { min-width: 0 }` (B-1, A-4, D-1); the blanket `outline: none` replaced by `:focus-visible { outline: 2px solid #2d6cdf; outline-offset: 2px }` (B-3, D-3); `.hint`/`.status` to `#595959` (≈6.9:1) and error text/border to `#c22` (≈5.5:1) (D-5); inputs to 16px to stop iOS zoom-on-focus (D-5).
- **`test/markup.test.js`** (new, dependency-free) — regression guards for the viewport meta and the non-fixed `.page`, a label per control, the save button being a real submit button, no `outline: none` without a `:focus-visible` replacement, each field's error element and `aria-describedby`, and the status live region.

No fix exceeded ~30 lines of non-test code. No dependencies added — the new test uses `node:test` and `node:fs` only.

### Verification
Checks after: `npm test` → **7 pass / 0 fail** (2 original + 5 new). One new assertion failed on first run (my `\bwidth: 960px` regex also matched `max-width: 960px`); I fixed the assertion, not the CSS.

Rendered measurements, before → after (server `python3 -m http.server 8731 -d public`, now stopped):

| | before | after |
|---|---|---|
| overflow @375 | `scrollWidth` 960 vs 375 — email + language off-screen | **375 vs 375**, one column, all 4 fields visible |
| overflow @1280 | 960 vs 1280 | 1280 vs 1280 |
| tab stops | name → email → phone → lang → *wraps*; Save never reached | name → email → phone → lang → **`BUTTON#save`**; Enter on it submits |
| focus ring | `outline-style: none` on all | `solid 2px rgb(45,108,223)` on all five |
| labels | 0 of 4 | 1 each for all 4 |
| invalid submit | red border only, no text, nothing associated | `#name-error` "Enter a display name.", `#email-error` "Enter a valid email address.", `aria-invalid` true/true/false, status "Check the highlighted fields and try again." |
| failed save | nothing — response ignored, no catch | status "Could not save your settings. Please try again." (server 501s on PUT), field errors cleared and `aria-invalid` reset |
| hint contrast | `#aaa` ≈ 2.3:1 | `#595959` ≈ 6.9:1 |

Screenshots: before `page-2026-10-11T15-13-47-476Z.png` (375) / `…15-14-16-770Z.png` (1280); after `…15-17-17-457Z.png` (375), `…15-17-43-255Z.png` (375, errors shown), `…15-17-55-040Z.png` (1280). All are outside the repo (`../shots/`).

**Not run / caveats:** the success path (`response.ok` true → "Settings saved.") was **not** exercised — the static server cannot accept `PUT`, so only the failure branch was observed end-to-end; the `ok` branch is source-verified only. The submit handler has **no automated test** (T-2, A-3): testing it would need a DOM, and adding one means a dependency, which you ruled out. So DoD items 1–3 are attested by rendered measurement, not by `npm test`. I disproved architect finding A-5: `git diff` shows all four `name=` attributes unchanged, so the JSON payload keys are identical to baseline; the added `Content-Type` header is the one deliberate request change.

**Round 2 fixes seen by no reviewer:** none — I applied nothing in round 2.

### Per round
- **Round 1:** all four reviewers ran. 11 accepted (merged into 4 edits) / 1 rejected / 2 asked / 0 backlogged.
- **Round 2:** all four reviewers ran. 0 accepted / 0 rejected / 3 asked / 9 recorded below. No reviewer found a DoD regression; three of four explicitly confirmed all three conditions from the source.

### Remaining issues
1. **Hint renders far from the field it describes** (A-2, D-1, high) — `index.html:37`: the "Max 30 characters" hint sits after the whole `.grid`, so at 375px it appears below *Language*, four fields away from Display name. Screen-reader users get it via `aria-describedby`; sighted mobile users do not. Fix is a pure markup move into the name `.field`. Not applied: in the final round a visible-position change gets no review.
2. **Double submit while a save is in flight** (B-1, D-3, high) — `app.js:21-33` has no re-entry guard, so two concurrent `PUT`s can resolve out of order and the final status may not match the last submit. Pre-existing (the old click handler had the same gap). Smallest fix is a module-scope `saving` flag with `try/finally`, *not* `button.disabled`, which would move focus to `<body>`.
3. **The validated-field list is duplicated three ways** (A-1, high) — `validate.js` decides the keys, `app.js:10` hard-codes `['name','email','phone']`, `index.html` owns the `-error` sinks. Since round 1 added the early return on `Object.keys(errors).length`, a future rule for a field not in that literal would make the form unsubmittable with no visible cause. Driving the loop from `form.querySelectorAll('p.error')` is ~6 lines.
4. **No automated coverage of the submit path** (T-2, A-3, B-2, medium) — see caveats above; the markup tests pin the spelling of the fix rather than the behaviour.
5. **Touch targets ~38–40px** (D-2, medium) — inputs and the Save button are under the 44px guideline on the stated phone-first audience; ~2–3px more vertical padding clears it.
6. **Focus stays on Save after a failed submit** (T-3, D-4, low) — errors are announced by the live region, but a keyboard user must tab backwards to find them. Moving focus to the first invalid field is conventional; it changes behaviour, so it is yours to decide.
7. **`validate()` does not trim** (T-5, low, **unverified** — inferred from the anchored regex, not observed): a trailing space from autofill would make a correct-looking email fail.

### Needs your decision
- **Is the display-name limit 30 or 40?** `index.html:37` says "Max 30 characters", `validate.js:5` enforces 40. I changed **neither**, and deliberately added no test pinning 40, since pinning a number that may be wrong is worse than no test. Tell me which is right and it is a one-line fix plus a boundary test.
- **Should the phone rule accept formatted numbers?** `validate.js:7` is `^\d+$`, so `+1 555-123-4567` is rejected. Widening it changes what `validate` accepts.
- **Should the email rule accept `+` in the local part?** (T-1) `user+tag@example.com` is currently rejected as invalid. Same reason: it changes `validate`'s semantics.
- **What does `PUT /api/settings` return on a 4xx?** (A-4) Every server outcome currently collapses to one retryable-sounding message. The per-field error elements already exist, so rendering server-side field errors into them would be additive later.

### Rejected suggestions
- *Patch the save div with `tabindex="0"` + a keydown handler* (an alternative in T-2) — keeps the abstraction leak and still misses implicit form submission; the real button is both smaller and more correct.
- *Extract `applyErrors`/`describeOutcome` as exported functions to make the handler testable* (T-2) — real gap, but it adds public API in the final round for a defect that has none; recorded as remaining issue 4 instead.
- *Assert `.field{min-width:0}` and the media query in the markup test* (B-2) — would deepen exactly the brittleness A-3 criticises; the rendered measurement is the better evidence.
- *A shared-constants module for the character limit* (A-5, round 1) — the duplication is in prose, not code.

### Feature backlog
- Move focus to the first invalid field on a failed submit (T-3, D-4).
- `aria-busy` / disabled-with-focus-preserved treatment for the Save button during a request (D-3).
- Render server-side field errors into the existing `-error` elements once the backend's 4xx shape is known (A-4).
- This repo has no `CLAUDE.md`/`AGENTS.md`; worth writing one before the next change.

**Nothing was committed, pushed or installed.** The working tree holds all of it: `public/app.js`, `public/index.html`, `public/styles.css` modified, `test/markup.test.js` untracked. `git diff` shows every change, and `git checkout -- public && rm test/markup.test.js` reverts all of it. The browser wrote no files inside the repo — `git status` lists only the four above.