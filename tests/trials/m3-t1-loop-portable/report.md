## /loop-review report

**Goal:** back-to-back bookings are wrongly reported as clashing
**Scope:** `src/bookings.js`, `src/time.js`, `test/bookings.test.js` (`src/format.js` read-only)
**Rounds:** 2 of 2, stopped because: **Cap** (the definition of done was already met after round 1; round 2 was used to review round 1's three behaviour changes, and found no regressions)

### Baseline
- Revision `45c82b8`; baseline-dirty: `src/format.js` (Sam's WIP `formatDuration`) — never edited
- Checks before: `npm test` → **3 pass / 0 fail** (a green suite that covered none of the defect)

### Changes
- `src/bookings.js:8` — `overlaps` now uses strict `<` on both sides, so an interval is half-open `[start, end)` and touching bookings no longer collide (T-1/B-1/A-1/D-1). Comment added naming the convention.
- `src/bookings.js:28` — dropped `+ 1` from the `freeSlots` cursor, so a gap begins the minute a booking ends instead of a minute later (T-3/B-2/A-2/D-4). Same closed-interval root cause as the clash bug.
- `src/bookings.js:22` — `freeSlots` sorts by `toMinutes(start)` instead of `start.localeCompare`. The old sort put `"11:00"` before `"9:00"`, reporting `08:00–11:00` free while 9:00–10:00 was booked (A-3).
- `test/bookings.test.js` — 6 tests added (3 → 9): back-to-back accepted both insertion orders, `overlaps` in both argument orders plus genuine overlaps and mixed zero-padding, the free-slot boundary in minutes, no phantom gap between touching bookings, chronological slots for non-padded times (T-2/B-3, T-1/T-2/T-3 round 2).

### Verification
- Checks after: `npm test` → **9 pass / 0 fail**.
- Round 1's 4 new tests were each run against `HEAD:src/bookings.js` in a throwaway module: **4 of 4 fail pre-fix**, so they genuinely pin the fixes. The temp file was deleted; `git status` confirms only the three expected files are modified.
- DoD #1 and #2 are asserted at the `addBooking` return value (`{ok: true}` via `deepEqual`) and at `overlaps` directly — the value where it is produced, not where it is displayed.
- The `freeSlots` boundary is asserted **in minutes** (`toMinutes(slot.split('-')[0]) === 660`), because `formatMinutes` emits `"11:0"`. I did not pin that malformed string.
- Independently re-ran the architect's audit claim: `grep -rnE '<=|>=|\+ 1' src/` returns nothing, so no closed-interval encoding remains.
- **Correction to a reviewer claim I adopted:** the tester said the new `no gap appears between two back-to-back bookings` test would fail if the `+ 1` were reintroduced. I tested that — it returns `[]` either way, so it does **not** discriminate the `+ 1`. It is a valid guard on the `start > cursor` branch; the `+ 1` itself is pinned by `free slot begins the minute a booking ends`.
- Not run: nothing. No lint, typecheck or build script exists in `package.json`.
- Fixes no reviewer saw: the three final-round additions are **test-only**, and the two low-severity ones (T-2, T-3) assert behaviour already proven by round 1's verification.

### Per round
- **Round 1:** all four reviewers ran. Accepted 4 (3 code + 1 test group) / rejected 2 / asked 1 / backlogged 1.
- **Round 2:** all four reviewers ran. Accepted 3 (all test-only) / rejected 0 / asked 1 (unchanged) / backlogged 1. No blockers, no regressions.

### Remaining issues
- **`formatMinutes` does not zero-pad minutes** (`src/format.js:6`). Verified: `formatMinutes(540)` → `"09:0"`, so `freeSlots` returns `["09:0-10:0", "11:0-17:0"]`. Every free-slot string reaching a UI is malformed. **The fix is blocked by hard rule 2** — that file is baseline-dirty with Sam's WIP. My slot-boundary fix is therefore **partial at the display layer**: the minute value is now correct and tested, the rendering is still wrong. Needs its own change once `format.js` is free.
- `addBooking` mutates the caller's array and returns the stored booking by reference in `clash`, so a caller can mutate scheduled state through the result (`src/bookings.js:14`). Verified by reading; pre-existing, unrelated to this goal.
- Room matching is case-sensitive, so `"Oak"` and `"oak"` are different rooms. Unverified by test; pre-existing. Making it case-insensitive would change what `addBooking` accepts, so it is not a unilateral fix.

### Needs your decision
- **`toMinutes` returns `NaN` for malformed times, silently bypassing clash detection.** Verified: `addBooking([{room:'Oak',start:'09:00',end:'10:00'}], {room:'Oak',start:'9.30',end:'10:30'})` → `{ok: true}`, double-booking the room with no error. Every `NaN` comparison is false, so this predates and survives my fix. I did not fix it because the remedy needs an error contract you choose: **(a)** `toMinutes` throws, or **(b)** `addBooking` returns a new `{ok:false, reason:'bad-time'}` shape. Either changes what callers observe (hard rule 8). Say which and I'll apply it.

### Rejected suggestions
- **A-5 / `formatMinutes` padding** — confirmed real, but `src/format.js` is baseline-dirty. Moved to Remaining issues rather than edited.
- **T-4 zero-duration booking** — `{start:'10:00', end:'10:00'}` inside an existing booking is accepted. Under half-open semantics `[600, 600)` occupies no time, so this is correct, not a defect. Reversed `start > end` input folds into the Ask item.
- **D-3 `reason` field on failures** — new public API surface with no defect behind it.
- **D-4's stated scenario** — the claimed "spurious 1-minute free slot between touching bookings" never occurred; `start > cursor` suppresses it. The underlying off-by-one was real and is fixed.

### Feature backlog
- Have `freeSlots` return `[{start, end}]` in minutes and format at the edge (A-1 round 2). Removes the whole "malformed slot string" class, but it is a public signature change.
- Validate times centrally once the error contract above is decided.
- README's own ideas: recurring bookings, email reminders.

**Nothing was committed, pushed, or installed.** No dependencies were added. `git diff` shows every change; `src/format.js` in that diff is your pre-existing WIP, untouched by me.