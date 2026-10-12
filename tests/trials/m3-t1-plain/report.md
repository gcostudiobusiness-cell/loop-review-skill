All 6 tests pass. Nothing committed, no dependencies added.

**Root cause.** The README defines a booking as half-open — `start` up to but not including `end` — but `overlaps` used inclusive comparisons (`<=`), so 09:00–10:00 and 10:00–11:00 were treated as sharing the 10:00 boundary.

**Changes** (`src/bookings.js:5-9`, `src/bookings.js:26`, `src/format.js:6`):

1. `overlaps` now uses strict `<`, so touching bookings don't clash. A one-minute genuine overlap still does.
2. `freeSlots` had the same inclusive-end assumption baked into `cursor = toMinutes(b.end) + 1`. It reported a free gap starting at `11:01` after an 11:00 booking, and would have shown a phantom one-minute slot between back-to-back bookings. Dropped the `+ 1`.
3. `formatMinutes` wasn't zero-padding minutes, so `freeSlots` emitted `09:0-10:0`. This was pre-existing on that line, outside the clash bug, but it's in the same output path and my assertion caught it — one character.

**Tests** (`test/bookings.test.js`): added back-to-back acceptance (both directions), a one-minute overlap rejection, and no-phantom-gap for adjacent bookings. I also tightened the existing free-slots test from a length check to exact values — the length check passed through all three bugs.

Two things I left alone:

- `formatDuration` in `src/format.js` is Sam's uncommitted WIP, untouched. Note the working tree now mixes their WIP with my one-line `formatMinutes` fix, so that file needs care when staging.
- `freeSlots` sorts with `a.start.localeCompare(b.start)`. The README says the leading zero is optional, and string comparison puts `"9:00"` after `"10:00"`, which would produce wrong gaps. Separate bug from the clash report — say the word and I'll sort on `toMinutes` instead.