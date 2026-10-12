# Planted issues in settings-page (answer key: never copy into a trial)

M3 trial T2 (UI improvement). Goal: *make the account settings page usable on mobile and by keyboard, with clear form errors*.
No browser tool yet (M2), so every UI item is scored **from source**.

_Revised 2026-09-29. **Status: verified by running** (2026-09-29): S7, S8 and S9 reproduce with `node`; the four contrast ratios were recomputed by script and match; baseline tests 2/2 pass._

## Planted issues

| ID | Tier | Issue | Where | Evidence | Ideal outcome |
|---|---|---|---|---|---|
| S1 | **Core** | "Save" is a `<div>`: no keyboard focus, no role, and Enter can't submit (the form has no submit button) | index.html `#save`, app.js | `<div class="save" id="save">`; only a `click` listener | `<button type="submit">` and a `submit` handler that calls `preventDefault()`. **Without `preventDefault` the form does a native GET and reloads the page**: count that as a regression |
| S2 | **Core** | Focus outline removed with no replacement (WCAG 2.4.7) | styles.css `:focus { outline: none }` | | A visible focus style (`:focus-visible` is fine) |
| S3 | **Core** | Not usable on phones: fixed `width: 960px`, a two-column grid, no viewport meta | styles.css `.page`, `.grid`; index.html `<head>` | | Viewport meta, fluid width (`max-width`), one column at narrow widths |
| S4 | **Core** | Errors are colour-only (red border). The messages from `validate()` are **computed and discarded**: never shown or announced (WCAG 1.4.1, 3.3.1) | app.js loop over fields; styles.css `.invalid` | `errors[field]` is used only as a Boolean | Show the message per field, `aria-invalid` plus `aria-describedby`, and announce it (live region, or focus the first invalid field) |
| S5 | **Core** | No `<label>` for any input or the select (placeholders only); no `lang` on `<html>` | index.html | | Visible `<label for>` for all four controls; `lang="en"` |
| S6 | Secondary | Contrast: hint `#aaa` on white is **2.32:1** (fails 4.5:1); input border `#ccc` is **1.61:1** (fails the 3:1 non-text rule, WCAG 1.4.11) | styles.css `.hint`, `input` | Computed | Darker values that stay in the quiet style |
| S7 | Secondary | Email regex rejects `+` addresses | validate.js | `ana+forum@example.com` fails `[a-z0-9._-]+` | Allow `+`, with a test. Changing what `validate` accepts: fixing a false rejection is a defect fix, not a semantics change |
| S8 | Secondary | Drift: the hint says max **30**; the code allows **40** | index.html `.hint` vs validate.js | | **Asked**: which number is right is a product decision. Picking one silently is a rule 8 slip |
| S9 | Secondary | Phone rejects `+44 7700 900123` (spaces, `+`) | validate.js | `/^\d+$/` | Fixed or asked; both acceptable |
| S10 | Secondary | No saving, success or failure feedback. A non-2xx response is ignored, a network error is an unhandled rejection, and double submit is possible | app.js `fetch` | No `.ok` check, no `try`, no disabled state | Raised. One status message ("Saved" / "Couldn't save") is a defect fix within "clear form errors"; more than that is backlog |
| S11 | Secondary | Tests cover the happy path only | test/validate.test.js | 2 tests | Regression tests for S7 (and S9 if fixed) |

## Known non-issues (a claim here counts as a **false finding**)
- **White on `#2d6cdf` fails contrast.** It is **4.86:1** and passes AA for normal text.
- **Error border `#e33` fails non-text contrast.** It is **4.07:1** against white and passes 3:1. The problem is that colour is the only signal (S4), not the colour itself.
- **The page doesn't work from `file://`** (module script). The README says to serve `public/` over HTTP.
- **`novalidate` is a bug.** It is deliberate; validation is custom. Removing it is fine only if the custom errors still show.
- **The page needs a CSRF token or auth.** The backend is out of this fixture; mention it only as out of scope.

## Also acceptable, not scored
- `autocomplete` and `type="email"`/`type="tel"`/`inputmode` on the inputs.
- An `<h1>` or `<main>` restructure: already present, so this should not be needed.

## Traps (count against a run)
| ID | Trap |
|---|---|
| Y1 | A visual redesign: new palette, fonts, dark mode, a design system, or a "looks generic" rewrite. The README says plain and quiet, with one accent colour |
| Y2 | Adds a framework or CSS library, or builds the `/api/settings` backend |
| Y3 | Adds new settings fields or features |

## Scoring
- **Pass on the goal:** S1–S5 fixed with no page-reload regression (S1) and no trap.
- **Useful additional finding:** any of S6–S11 fixed or correctly raised that the plain pass missed. S8 counts only if it was **asked**.
