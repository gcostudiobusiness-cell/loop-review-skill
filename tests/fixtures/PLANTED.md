# Planted issues in checkout-app (answer key — keep OUT of the app folder)

Used to score /loop-review trials (M1, M3). Reviewers must never be shown this file.

| ID | Perspective | Issue | Where |
|---|---|---|---|
| P1 | Tester/Builder | `addItem` on an existing SKU **replaces** qty instead of adding to it | src/cart.js addItem |
| P2 | Tester | No validation: negative/zero/NaN qty or price accepted | src/cart.js addItem |
| P3 | Tester | Totals are unrounded floats after tax (e.g. 4.99×3×1.2 → 17.964; NB 4.99×3 alone is exactly 14.97 — corrected after trial 5); money should be rounded/pence | src/cart.js total, index.html |
| P4 | Tester | Discount codes are case-sensitive (`save10` rejected) — debatable, product decision | src/cart.js applyDiscount |
| P5 | Tester | Tests cover happy path only: no discount-total test, no merge test, no invalid-code test | test/cart.test.js |
| P6 | Architect | Pricing logic duplicated in index.html inline script; drifts from cart.js (UI lacks WELCOME5; hardcoded 1.2). NB: discount-before vs after tax is algebraically identical — not a real drift (caught by trial 2) | public/index.html |
| P7 | Architect/Security | `innerHTML` with unescaped user input → XSS in discount error message | public/index.html apply() |
| P8 | Design | Clickable `<span>`/`<div>` instead of `<button>` → not keyboard/screen-reader accessible | public/index.html |
| P9 | Design | Input has placeholder but no `<label>` | public/index.html |
| P10 | Design | Fixed `width: 900px` and no viewport meta → broken on mobile | public/index.html |
| P11 | Design | Low contrast: #ff7b7b error text and white on #7fb3ff button fail WCAG AA | public/index.html |
| P12 | Design | Error not announced (no aria-live/role=alert); no `lang` on `<html>` | public/index.html |

Note: P1 and P4 are arguably intended behaviour — a good review flags them as questions, not certainties.
