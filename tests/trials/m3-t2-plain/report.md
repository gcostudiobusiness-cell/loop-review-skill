Server startup needs approval in this non-interactive session, so I verified the wiring statically instead (all four files exist and every reference resolves). I was not able to load the page in a real browser — worth a quick eyeball on a phone before merge.

## What changed

**`public/index.html`**
- Added `<meta viewport>` and `lang="en"` — without the viewport tag a phone renders at desktop width and shrinks everything.
- Real `<label for>` on all four controls, replacing placeholder-only fields (placeholders vanish on typing and many screen readers skip them).
- `Save changes` is now `<button type="submit">` instead of a `<div>`. It's focusable and Enter submits from any field.
- An empty `<p class="error">` per field, plus a `role="status" aria-live="polite"` line for save outcome.
- `type`/`inputmode`/`autocomplete` on each input so phones show the right keyboard and can autofill.

**`public/styles.css`**
- `width: 960px` → `max-width: 960px` with padding. The fixed width forced horizontal scrolling on every phone.
- Grid is one column, becoming two at `640px`.
- **Removed the blanket `outline: none`** — that was the single worst keyboard bug, leaving no visible focus anywhere. Replaced with a `:focus-visible` ring, with an `@supports` fallback.
- Inputs to `16px` (below that iOS Safari zooms on focus) and `min-height: 44px` touch targets.
- Contrast fixes: hint `#aaa` → `#5f6368`, error `#e33` → `#b3261e`, input border `#ccc` → `#767676`. The originals all failed WCAG AA against white.

**`public/app.js`**
- Listens for `submit` rather than a click on the div, so keyboard and Enter work.
- **Renders the messages `validate()` was already returning.** They were computed and thrown away — only a red border appeared, which told a user something was wrong but never what, and told a screen reader nothing at all.
- Sets `aria-invalid` and appends the error id to `aria-describedby`, then restores the hint-only value when fixed.
- Moves focus to the first invalid field and summarises the count in the live region.
- Errors clear as you fix each field, but only after a first save attempt — no nagging while typing.
- Adds `Content-Type: application/json`, checks `response.ok`, and reports success/failure. Previously a failed save looked identical to a successful one.

No commits, no dependencies added. `npm test` passes (2/2).

## Two things for you to decide

1. **The hint contradicted the validator.** The copy said "Max 30 characters"; `validate.js` rejects above 40. I changed the copy to 40 rather than the rule, since tightening to 30 would reject names members already have. If 30 is the real limit, that's a one-line change in `validate.js` — but it needs a plan for existing over-length names.
2. **Phone accepts digits only.** `/^\d+$/` rejects `+33 1 23 45 67 89` and `555-0100`. I left the rule alone — it's a product call and it's under test — but it will frustrate anyone outside one format. Happy to relax it to strip separators if you want.

I also wrote a throwaway harness that runs the real submit handler against a stub DOM — 21 checks covering error text, ARIA wiring, focus movement, and the save success/failure paths, all passing. It's in the scratchpad rather than `test/`, since it stubs the DOM heavily and you didn't ask for new tests; say the word and I'll promote a cleaner version into the suite.