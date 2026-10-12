`src/format.js` is byte-identical to the baseline WIP — untouched.

## /loop-review report

**Goal:** back-to-back bookings are wrongly reported as clashing
**Scope:** `src/bookings.js`, `src/time.js`, `test/bookings.test.js` (`src/format.js` read-only)
**Rounds:** 2 of 2, stopped because: **Cap** (round 2 = max_rounds). The definition of done was already met at the end of round 1; I used round 2 anyway so the fixes would be reviewed rather than shipped unseen.

### Baseline
Revision `03e8263`. Baseline-dirty: `src/format.js` (Sam's uncommitted `formatDuration` WIP) — never edited. No CLAUDE.md/AGENTS.md in this repo. Checks before: `npm test` → **3 pass / 0 fail** (the bug was green).

### Changes
- `src/bookings.js:7` — `overlaps` now uses strict `<` on both sides, so touching ranges don't count as overlapping (T-1/B-1/A-1a). This was the reported defect.
- `src/bookings.js:28` — dropped the `+ 1` from the `freeSlots` cursor; it advances to exactly the booking's end (T-2/B-2/A-1b). Without this, back-to-back bookings would have left a phantom one-minute gap once they became bookable, and a lone 10:00 booking already produced `10:01-…`.
- `src/bookings.js:22` — sort by `toMinutes(...)` instead of `a.start.localeCompare(b.start)`, which mis-ordered the `"9:00"` form the README documents as valid (A-2).
- `src/bookings.js:2-3` — one comment stating the half-open `[start, end)` convention, which previously existed nowhere and was encoded two contradictory ways.
- `test/bookings.test.js` — 11 tests added (T-3/B-3, plus round 2's T-1/T-2/T-3): direct `overlaps` assertions in both argument orders, back-to-back accept and one-minute near-miss reject from both directions, identical-booking reject, exact slot boundaries, a three-booking chain, and single-digit-hour ordering.

### Verification
`npm test` → **14 pass / 0 fail** (was 3/0). Each DoD condition is asserted at the point the value is produced: `overlaps`' boolean return directly, `addBooking`'s `ok` plus the pushed schedule, and `freeSlots`' exact returned strings — not just a `.length` count as the original test did.

One caveat on how the `freeSlots` assertions read: they expect `'11:0-17:0'`, not `'11:00-17:00'`, because `formatMinutes` in `src/format.js:6` doesn't zero-pad minutes. That file is baseline-dirty, so the tests pin the real current output rather than the padded form. The boundary *minute* is what they prove, and that is the fix.

I could not run ad-hoc `node` probes (approval not available non-interactively), so every claim above rests on the test suite and on reading the code, not on a scratch script.

**Fixes no reviewer saw:** the five test cases added in round 2. They are test-only — no product behaviour changed after the round-2 reviewers read the code.

### Per round
- **Round 1** — tester, builder, architect, design-critic all ran. 4 accepted / 2 rejected / 1 asked / 0 backlogged. (design-critic: no findings, repo has no UI.)
- **Round 2** — all four ran. 1 accepted (test-only) / 1 rejected / 1 asked / 0 backlogged. Builder and design-critic found nothing; architect confirmed no closed-interval assumption remains anywhere in the module.

### Remaining issues
- **`formatMinutes` doesn't zero-pad minutes** (`src/format.js:6`) — free slots render as `10:0-17:0`. Confirmed, one-character fix, but the file is baseline-dirty so hard rule 2 blocks it. Say the word and I'll do it, or leave it to Sam alongside the WIP.
- **`toMinutes` returns `NaN` for malformed input** — and because `NaN < x` is always false, a booking with a bad time is *accepted* with clash detection silently disabled. Pre-existing, not introduced here; the fix is a behaviour change (see below).

### Needs your decision
1. **Zero-length and inverted bookings** (T-4/A-4). Under half-open intervals, `start === end` can never clash, so a 10:00–10:00 booking is now accepted unconditionally, and `10:00`–`09:00` is too. Should `addBooking` reject these? That changes what it accepts, so I didn't apply it.
2. **Malformed-time handling** (A-1, round 2). Making `toMinutes` throw on bad input would close the silent-accept hole, but it changes an existing function's contract and could surface as a new error in callers.

### Rejected suggestions
- A-3 — `formatMinutes` padding: correct finding, but the fix lives in a baseline-dirty file (moved to Remaining issues).
- T-5 — `toMinutes` input validation in round 1: unrelated to the clash bug as stated. The architect re-raised it in round 2 with a sharper failure trace, which is why it's now in Needs your decision rather than rejected.
- A-2 round 2 — extracting a shared `gapBefore` helper: the architect's own verdict was "do nothing structural now"; the two sites agree today and a comment plus two tests guard the convention.

### Feature backlog
Nothing. Both the builder and architect explicitly declined to propose features; this was a boundary-convention fix.

Nothing was committed, pushed or installed, and no dependencies were added. `git diff` shows every change — three files, of which `src/format.js` is only your pre-existing WIP.