Server stopped. Only my four intended files are modified — the browser wrote screenshots to `../shots/`, outside the repository.

## /loop-review report

**Goal:** make the account settings page usable on mobile and by keyboard, with clear form errors
**Scope:** `public/index.html`, `public/styles.css`, `public/app.js`, `public/validate.js`, `test/validate.test.js`
**Rounds:** 2 of 2, stopped because: **Cap** (round 2 = max_rounds; definition of done was already met after round 1)
**Constraint honoured:** no dependencies added — `package.json` is untouched.

### Baseline
- Revision `21432ae`, **dirty files: none** (clean tree, so `git checkout` rolls back everything).
- Checks before: `npm test` → **2/2 pass**. No lint/typecheck/build scripts exist.
- UI reviewed with a browser (Playwright against `python3 -m http.server 8731 -d public`).

### Changes
- **`public/index.html`** — added `<meta name="viewport">` and `lang="en"`; wrapped each control in a `.field` div with a real `<label for>`; added per-field `<span class="error">` wired by `aria-describedby`; replaced `<div id="save">` with `<button type="button">`; added a `role="status" aria-live="polite"` region. *(B-2/A-3/D-1, T-1/B-1/A-1/D-2, B-5/D-4/A-2, T-2/B-4/A-2/D-5)*
- **`public/styles.css`** — `box-sizing: border-box`; `.page` fixed 960px → `max-width` + 16px padding; `.grid` single-column with a `min-width: 600px` two-column breakpoint; replaced `outline: none` with a 2px `#2d6cdf` focus outline; inputs 14px → 16px and 44px min touch targets; hint `#aaa` → `#6b6b6b` and error `#e33` → `#c62828` for AA contrast. *(B-3/A-1/D-3, D-1, contrast finding)*
- **`public/app.js`** — renders `validate()`'s message strings into the error spans, toggles `aria-invalid`, and sets a status message; wrapped `fetch` in `try/catch` with a `res.ok` check so a failed save is no longer silent. *(T-2/B-4/A-2/D-5, A-4)*
- **`test/validate.test.js`** — 9 new cases: malformed email, non-digit phone, empty phone, whitespace-only name, mixed-case email, 40/41-char boundary, multi-field errors, and a test asserting each error is a **non-empty string** (the values the page now renders). *(T-4, T-2/T-3 round 2)*

### Verification
Checks after: **`npm test` 11/11 pass** (was 2/2). Rendered before → after at 375×812:

| Measurement | Before | After |
|---|---|---|
| `scrollWidth` vs `innerWidth` | 960 vs 375 (**overflow**) | 375 vs 375 (**none**) |
| Email / Language field position | x=488..960 (**off-screen**) | x=16..359 (visible) |
| Tab stops | 4 (**Save unreachable**) | 5 (Save included) |
| Focus outline | `outlineStyle: none` on all | `solid 2px rgb(45,108,223)` on all |
| Accessible name of `select#lang` | **none** | "Language" from `<label>` |
| Error/alert nodes | 0 | per-field, `aria-describedby` resolves to visible text |
| Input font-size | 14px (iOS zoom) | 16px |

Screenshots: before `../shots/page-2026-10-11T15-22-52-359Z.png` (375) and `...15-23-12-735Z.png` (1280); after `...15-27-45-593Z.png` (375), `...15-28-10-286Z.png` (375 error state), `...15-28-32-008Z.png` (1280). Desktop two-column layout preserved (`456px 456px`, no overflow).

Verified at the source, not just the surface: the error strings are asserted in `validate()` by test, and separately confirmed rendering in the DOM. All three save branches exercised in-browser — `res.ok` → "Settings saved."; static-server 501 → failure message; `fetch` rejection → failure message. Keyboard path confirmed with a real `Enter` press on the focused Save button (handler fired, URL unchanged).

**Not run:** no lint/typecheck/build exists. The real `PUT /api/settings` backend was never contacted — only the local static server.

**Fixes no reviewer saw:** the two round-2 test additions (whitespace-only name, mixed-case email). Both are test-only, pin existing `validate.js` behaviour, and pass.

### Per round
- **Round 1:** all four reviewers ran. 10 accepted / 1 rejected / 2 asked / 2 backlogged.
- **Round 2:** all four reviewers ran, **no blockers found**. 2 accepted (tests only) / 2 rejected / 4 to remaining issues.

### Remaining issues
1. **Stale success message and duplicate PUT on concurrent saves** (T-1/B-1/A-2 — all three flagged it as *inferred*; I reproduced both). With a slow save in flight: clearing the name and clicking Save again leaves the page reading **"Settings saved." while "Enter a display name." is still visible** and `aria-invalid="true"`. Two valid clicks fire **2 concurrent PUTs**. Not applied: it is a behaviour change (a second click becomes a no-op) and the final round has no reviewer. Fix is ~4 lines — an `inFlight` guard with a `finally` reset.
2. **Hint not associated with the name field** (D-1). It sits after the grid, so on desktop it renders under the *second* row, and screen-reader users never hear it. Fix moves DOM position and changes layout — deferred as a visual change.
3. **Resting input border `#ccc` is 1.61:1 on white**, failing WCAG 1.4.11 (needs 3:1). Pre-existing. *(The design critic reported 1.31:1; the correct figure is 1.61:1 — the finding stands either way.)*
4. **Field list is hardcoded** in `app.js` as `['name','email','phone']` (A-1). No defect today — it matches `validate()`'s keys exactly — but adding a validated field without an error span would block Save with nothing highlighted. Maintainability note only.
5. **`invalid` class and `aria-invalid` duplicate one fact** (A-3). Low severity; could collapse to an `input[aria-invalid="true"]` selector.

### Needs your decision
1. **Hint says "Max 30 characters"; `validate.js` enforces 40.** Only you can say which is authoritative. Changing `validate.js` rejects 31–40-char names that are accepted today; changing the hint alters user-visible copy. My tests currently pin the enforced **40** and say so in a comment.
2. **Should the PUT send `Content-Type: application/json`?** The body is `JSON.stringify(...)` but goes out as `text/plain`. Likely a real bug, but it changes what the forum backend receives and I can't test that backend.

### Rejected suggestions
- **T-3 (round 1), Enter-in-a-field triggers native form submission.** Pre-empted rather than fixed: using `type="button"` instead of `type="submit"` means implicit submission is unchanged from baseline. Verified — pressing Enter caused no navigation.
- **Deriving the field list from the markup (A-1)** and **collapsing the dual invalid state (A-3).** Both are sound refactors but fix no present defect; rule 7 (smallest fix) in a final round with no subsequent review.

### Feature backlog
- Clear each field's error as the user corrects it (`input` listener), so errors aren't stale after a failed save.
- Move focus to the first invalid field on a failed save.
- Accept `+`, spaces and dashes in phone numbers — `^\d+$` rejects most formatted numbers.
- Cap phone length; the email regex rejects internationalised addresses.

**Nothing was committed, pushed, or installed.** `git diff` shows every change; `git checkout -- .` reverts all of it. No files were created inside the repo by the browser.