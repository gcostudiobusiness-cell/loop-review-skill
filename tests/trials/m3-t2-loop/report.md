## /loop-review report

**Goal:** make the account settings page usable on mobile and by keyboard, with clear form errors
**Scope:** `public/index.html`, `public/styles.css`, `public/app.js`, `public/validate.js`, `test/` — **Rounds:** 2 of 2, stopped because: **Cap** (round 2 also met the *Done* rule: no confirmed in-scope finding of medium+ severity remains unaddressed except the Asks)

### Baseline
`fc44a0c`, working tree **clean** (empty baseline dirty list, so hard rule 2 never bound). Checks before: `npm test` → **2 passed, 0 failed**. No lint/typecheck/build scripts exist. No `CLAUDE.md`/`AGENTS.md` in this repo.

### Changes
- **`public/index.html`** — added `lang="en"` and the viewport meta; replaced the `<div class="save">` with `<button type="submit" class="save" id="save">`; added a `<label for>` for all four controls (phone's reads "Phone (optional)"); gave each validated field a `<p class="error" id="<field>-error" aria-live="polite">` wired by `aria-describedby`; moved the character hint under its own field as `#name-hint`. *(T-1/T-3/T-4/T-5, B-3/B-4/B-5, A-1/A-2/A-3, D-1/D-2/D-3/D-5)*
- **`public/styles.css`** — `.page` fixed `960px` → `width:100%; max-width:960px; box-sizing:border-box; padding:0 16px`; added `@media (max-width:600px)` collapsing `.grid` to one column; deleted `outline:none` and added `:focus-visible { outline: 2px solid #2d6cdf; outline-offset: 2px }`; controls to `font-size:16px` (stops iOS Safari zooming on focus) with `width:100%; min-width:0; box-sizing:border-box` so they can't overflow a narrow column; contrast repairs — `.hint` `#aaa`→`#5f6368` (2.33:1 → 6.05:1), error text `#b3261e` (6.54:1) rather than `#e33` (4.07:1, fails AA as text), input border `#ccc`→`#767676`. *(T-2/T-5, B-1/B-2, A-3/A-4, D-1/D-4)*
- **`public/app.js`** — handler moved from `save` click to `form` `submit` with `event.preventDefault()`, so Enter in a field now saves instead of reloading the page; the loop writes `errors[field]` into the error element, toggles `.invalid`, sets `aria-invalid`, and focuses the first invalid control. *(T-1/T-4, B-3/B-4, A-1/A-2, D-2/D-5)*
- **`test/page.test.js`** (new, 13 tests) — pins every fix above against the served source. Round 2 then repaired it per its own reviewers: whitespace-normalised CSS matching with a guarded `controlRule()` helper (T-4/B-1/A-2), `(?<!max-)width` so a `min-width` px regression is actually caught (A-3), and a test that the scan order matches markup order (T-1).
- **`test/validate.test.js`** — two tests pinning the message contract the page now renders.

### Verification
**Checks after: `npm test` → 17 passed, 0 failed** (from 2). Beyond the green run:
- The 12 original `page.test.js` tests were run against the **baseline source** and **all 12 failed**, so they are real regression tests rather than tautologies.
- The three round-2 test repairs were mutation-checked: a no-op CSS reflow now **passes**, while `min-width: 1200px` on `.page` and a reversed scan order each **fail one test**.

**Not run, and why:** nothing was rendered in a browser — this version reviews UI source only. So these are **verified as served source text, not as rendered behaviour**: absence of horizontal scroll at 375px, the focus ring's visibility against the blue button, and the screen-reader announcement itself. My contrast figures are computed from the WCAG formula, not measured in a browser.

**Final-round fixes no reviewer saw:** all four `test/page.test.js` edits. They are test-only and mutation-checked; no product code changed in round 2.

### Per round
- **Round 1** — all four reviewers ran. 5 root causes accepted (from 20 findings), 0 rejected, 1 asked, 2 backlogged.
- **Round 2** — all four reviewers ran. **No blockers found.** 3 accepted (test-only), 1 rejected, 2 asked, 2 remaining, 4 backlogged.

### Remaining issues
- **`FIELDS` duplicated** across `app.js:4`, the `*-error` ids in markup, and `validate.js`'s destructuring (A-1, B-2). The architect confirms there is **no live bug today** — the copies agree, and the new order test now catches the mismatch. Deriving the list from the DOM is a runtime change nothing would review in a final round, so it is not applied.
- **`.error:empty { display: none }`** takes each live region out of the a11y tree until populated, which some screen reader/browser pairs announce unreliably (D-3). DoD #3 is carried by the `aria-describedby` + focus-move path regardless, but **this needs a real VoiceOver/NVDA check I cannot run here** — unverified either way.
- Errors recompute only on submit, so a corrected field keeps a stale message until the next submit.

### Needs your decision
- **Phone regex** — `validate.js:7` `^\d+$` rejects `+1 555-123-4567` on what is now a `type="tel"` field, which does bite mobile users (confirmed by reading the regex; `'12-34'` is already pinned as invalid at `validate.test.js:15`). Relaxing it changes what `validate()` accepts, so hard rule 8 says ask.
- **Hint vs validator** — `index.html` says "Max 30 characters", `validate.js:5` enforces `> 40`. Both numbers are still as they were; tell me which is right. Related: `validate.js` uses `name.trim()` for the empty check but `name.length` for the limit, so trailing spaces count toward it.
- **`aria-required` on name/email** — only phone is marked optional, so AT users learn the others are mandatory only after a failed submit. Changes what AT announces, in a final round.
- **No `CLAUDE.md`/`AGENTS.md` in this repo** (global rule 5). I can write one.

### Rejected suggestions
- **D-4** — empty grid cell beside the language select at 601–959px. Cosmetic; the reviewer itself concluded no change required.

### Feature backlog
- `app.js:22` fetch has no `Content-Type: application/json`, no `response.ok` check, no catch, and no save feedback — a failed PUT is indistinguishable from success (D-1, A-4, B-3, T-3). Four reviewers raised it; it needs a new form-level status region, which is more than a smallest fix.
- Re-validate on `blur`/`input` so a corrected field clears its message (A-IDEA).
- Boundary test at the name length limit, once the 30-vs-40 question is settled.

**Nothing was committed, pushed or installed** — `fc44a0c` is still HEAD and no dependencies were added. `git diff` shows every change to the four tracked files; `test/page.test.js` is new and untracked. To undo everything: `git checkout -- public test && rm test/page.test.js`.