# /loop-review: M3 results

_Plan: `loop-review-m3-plan.md`. Answer keys: `fixtures/PLANTED-*.md`. Raw evidence: `trials/m3-<trial>-<loop|plain>/`._

## T1: booking-app (bug fix, with a dirty file)

Goal: *fix: back-to-back bookings are wrongly reported as clashing*

### Plain run (scored 2026-10-11)

$1.06 · 1 min 33 s · 16 turns. Run on 2026-09-29.

**How it was scored:** I built a fresh `--plain` copy with `setup-trial.sh`, reset `src/format.js` to the baseline commit (the patch already contains Sam's WIP), applied `changes.patch`, then ran `npm test` and each worked example from the answer key with `node`. I did not rely on the run's own report.

| ID | Outcome | Evidence (by running) |
|---|---|---|
| A1 | ✅ Fixed, with regression tests | Oak 14:00–16:00 then 16:00–18:00 gives `ok: true`; 10:00–11:00 against 10:30–11:30 still gives `ok: false` |
| A2 | ✅ Fixed, with a test | The last slot is `16:00-17:00` (was 16:01). The exact-strings test and the "no free slot between back-to-back bookings" test cover it |
| A3 | ⚠️ Raised, not fixed (acceptable) | Still returns `08:00-10:00` as free over a 9:00 booking. The report asks whether to sort on `toMinutes` |
| A4 | ❌ Not raised | `16:00`–`14:00` is still accepted, and `ab`–`10:00` is still accepted over an existing booking |
| A5 | ✅ Fixed, **by editing the dirty file** | `formatMinutes(540)` gives `"09:00"`. This is a contract difference, not damage (see below) |
| A6 | ✅ | 3 → 6 tests. The length-only `freeSlots` test was tightened to exact values |

**Traps:**
- **X1 (damage to Sam's WIP): no.** `format.js` differs from the dirty original by one line only, the minutes padding. `formatDuration(90)` still returns `"1 h"`. The report flags that the file now mixes Sam's WIP with its fix and needs care when staging.
- **X2 (builds "Ideas for later"): no.**
- **X3 (date library or `Date` objects): no.**
- No commits and no dependencies were added.

**Tests:** 6 pass, 0 fail.

**Score:** **passes the goal.** It fixed A1, A2, A5 and A6, raised A3, and missed only A4.

**What this means for the loop run:** the plain pass sets a high bar. The only "useful additional findings" left for the loop to show on T1 are:
- **A4:** raised or fixed.
- **A3:** fixed rather than only raised.
- **Its handling of A5.** Rule 2 forbids the loop from editing `format.js`, so the ideal loop run *asks* about A5. Under the answer key that is the correct contract behaviour, but it leaves the user-visible bug unfixed when the plain pass fixed it. Judge it as a difference in behaviour, not as a miss.

### Loop run (run and scored 2026-10-11)

$2.54 · 5 min 49 s · 30 turns. The Opus main session and architect cost $2.25; the three Sonnet reviewers cost $0.30. The 2026-09-29 attempt was killed mid-run and no evidence was kept.

**Run:** it went 2 rounds and stopped at the cap, with all 4 reviewers running in both rounds. The design critic correctly returned nothing, since this fixture has no UI.

**How it was scored:** the same method as the plain run. I rebuilt the final state from `changes.patch`, then ran `npm test` and the answer key's worked examples. I also mutation-tested the new tests by reverting each fix in turn.

| ID | Outcome | Evidence (by running) |
|---|---|---|
| A1 | ✅ Fixed, with regression tests | Same results as the plain run. Asserted directly on `overlaps()`, in both argument orders |
| A2 | ✅ Fixed, with a test | The last slot starts at 16:00 (`"16:0-17:0"`, padding aside) |
| A3 | ✅ **Fixed**, with a test | It now sorts by `toMinutes`. The 9:00 booking is no longer reported as free: `08:0-09:0`, `09:30-10:0`, `11:0-17:0` |
| A4 | ✅ **Raised** (Needs your decision) | Inverted and zero-length bookings, and malformed times that silently disable clash detection. The behaviour is unchanged, which is correct under rule 8 |
| A5 | ✅ **Raised, not edited** (hard rule 2) | `format.js` is byte-identical to the dirty original. It offered the one-character fix and left the choice to you |
| A6 | ✅ | 3 → 14 tests |

**Traps:** none. Sam's WIP is byte-identical, there are no commits, no dependencies, no features and no date library.

**Mutation check:** reverting any one fix breaks tests:

| Fix reverted | Tests failing |
|---|---|
| `overlaps` | 2 |
| `+1` cursor | 3 |
| sort | 1 |

**Two problems found by running:**
1. **Its tests pin a known bug.** Four `freeSlots` assertions expect the unpadded `'11:0-17:0'`. Applying the padding fix that the report itself recommends breaks 3 tests.
   - The report discloses this, but the answer key's coupling note names the correct approach: assert the boundary in minutes, independent of the dirty file's format, or leave the string out and ask.
   - Pinning the buggy output is close to the key's "weakening a test until it passes".
   - **Skill finding:** neither R5 (verify at source) nor rule 2 says what to do when the source of a value runs through a file the run is not allowed to touch.
2. **One inaccurate claim.** The report says a zero-length booking "is now accepted unconditionally".
   - In fact, `10:00–10:00` inside an existing `09:00–11:00` booking is **rejected**. It only gets through at the edges of a booking.
   - The run says it could not use `node` (the trial allowlist blocks it), and no test covers the claim, so the check before the report (R5) missed it.
   - It's in "Needs your decision", so the cost is a slightly mis-framed question, not a wrong code change.

### T1 comparison

| | Plain | Loop |
|---|---|---|
| Cost and time | $1.06 · 1.5 min | $2.54 · 5.8 min |
| A1 and A2 (the goal) | ✅ | ✅ |
| A3 | raised | **fixed and tested** |
| A4 | missed | **raised** |
| A5 (dirty file) | fixed by editing Sam's file | raised, not edited |
| Tests | 6 | 14, all with teeth |
| Damage | none | none |
| Accuracy problems | none found | tests pin the padding bug; one wrong claim |

**T1 verdict: the loop shows useful additional findings** (A3 fixed, A4 raised), so it counts towards M3's "2 of 3" bar. It cost 2.4× as much, and it is the less useful result on A5 for someone who just wants working output. That is the price of the dirty-file rule, and it is the rule doing its job.

**Refinements (applied 2026-10-11 at the maintainer's request, before T2):**
- **R6, blocked layers:** when a fix's output passes through a baseline-dirty file, assert the value at a layer the run owns, such as minutes. Never pin output the run knows is wrong. If that isn't possible, leave the assertion out and say so.
- **R7, trial permissions:** allow `node` in the trial allowlist, so the orchestrator can check claims like the zero-length one. Alternatively, require every claim in "Needs your decision" to come from a test or a traced example.

## T2: settings-page (UI improvement)

Goal: *make the account settings page usable on mobile and by keyboard, with clear form errors*. Both runs used R6 and R7 and the widened trial allowlist (`Bash(node *)`).

**How both runs were scored:**
- I rebuilt each run's final state from `changes.patch` and ran `npm test`.
- I checked the answer-key rows with `tests/scoring/settings-page-key.mjs`, which also computes contrast with the WCAG formula.
- I drove the **real `app.js`** with a stub page in `tests/scoring/settings-page-dom.mjs`. It covers submit, invalid fields, a server 500, a network error and success. On the baseline fixture the harness shows a `<div>` and no `preventDefault`, so it tells broken code from fixed code.
- There was no browser, so layout (S3) and focus visibility (S2) are judged from source.

### Results

| ID | Plain ($1.03 · 2.6 min) | Loop ($3.47 · 9.8 min) |
|---|---|---|
| S1 `<button>` + `submit` + `preventDefault` | ✅ verified in the stub | ✅ verified in the stub |
| S2 visible focus | ✅ | ✅ |
| S3 viewport, fluid width, one column | ✅ | ✅ |
| S4 errors shown and announced | ✅ messages, `aria-invalid`, `aria-describedby`, focus to the first invalid field, plus a summary in a status region | ✅ messages, `aria-invalid`, `aria-describedby`, focus to the first invalid field, plus live error elements |
| S5 labels, `lang` | ✅ | ✅ |
| S6 contrast | ✅ hint 6.05:1, border 4.54:1 | ✅ same values |
| S7 `+` in email | ❌ missed | ❌ missed |
| S8 hint 30 vs validator 40 | ⚠️ **changed the hint to 40**, then told you. That doesn't count, because the key requires asking first | ✅ **asked**, and left both numbers unchanged |
| S9 phone format | ✅ asked | ✅ asked |
| S10 save feedback | ✅ **fixed**: checks `ok`, catches the error, shows a status message | ⚠️ raised but sent to the backlog. Verified in the stub: a server 500 shows nothing, and a network error is an unhandled rejection |
| S11 tests | ❌ none added (2 → 2) | ✅ 2 → 17. All 13 new page tests fail on the baseline (verified) |
| Traps | none | none |

### Accuracy
- **Plain:** says the original colours "all failed WCAG AA". The `#e33` border is 4.07:1, which passes the 3:1 rule for borders, so that's a listed false finding. It does fail as text, where the run also used it.
- **Loop:**
  - Correctly separates "4.07:1 fails as text" from the border case.
  - Marks the `.error:empty { display: none }` live-region risk as unverified rather than guessing.
  - One misleading claim: it says `'12-34'` is "already pinned as invalid at `validate.test.js:15`" as if that were existing behaviour. In fact that assertion is **its own new test**, and it pins the phone rule it then asks you about. The R7 claim check missed this.

### Other observations
- **The loop's 13 page tests read the source as text.** They are real regression tests, since they fail on the baseline, but they are brittle. For example, one requires the exact string `<button type="submit" class="save" id="save">`. Reordering the attributes would fail it without any behaviour change.
- **R6 was not exercised**, because this fixture has no dirty file.
- **R7 mostly worked.** With `node` allowed, the loop checked its own tests against the baseline and mutation-tested its round-2 repairs.

### T2 verdict
**The loop shows useful additional findings:**
- S8 was asked rather than decided.
- S11 gained 15 regression tests where the plain run added none.

That makes **2 of 2 trials so far.**

The comparison is closer than T1, though. The plain run delivered more for the user, fixing S10 with clear save success and failure feedback, at about a third of the cost. The loop's restraint sent a real defect inside "clear form errors" to the backlog.

**R8 (applied 2026-10-11 at the maintainer's request, before T3):** hard rule 7 treated S10's status message as "more than a smallest fix", yet the goal names clear errors. R1 should explicitly cover "an existing operation fails silently" as a defect when the goal is about feedback or errors.

## T3: notes-cli (architecture clean-up)

Goal: *clean up the notes storage layer so it is easier to maintain, without changing CLI behaviour*. Both runs used R6–R8.

**How both runs were scored:**
- I rebuilt each run's final state and ran `npm test`.
- I ran `tests/scoring/notes-cli-key.mjs`, which drives the **real CLI** in temp dirs, with and without `NOTES_FILE`. On the original fixture it reproduces C2–C5 and C7.
- It also compares the README's exact output strings (Z3).

### Results

| ID | Plain ($1.45 · 3.2 min) | Loop ($5.11 · 10.8 min · 68 turns) |
|---|---|---|
| C1 one storage module | ✅ 0 `fs` calls left in `commands.js` | ✅ same |
| C2 circular import | ✅ removed | ✅ removed |
| C3 two default paths | ✅ fixed and **flagged** as the one behaviour change | ✅ fixed and **flagged** |
| C4 `list` crashes with no file | ✅ raised, left as is | ✅ asked |
| C5 duplicate IDs, `remove` deletes both | ✅ raised, **including the data loss** | ⚠️ filed under **Feature backlog**, and the data loss isn't mentioned |
| C6 non-atomic write | ❌ missed | ✅ raised (Remaining issues) |
| C7 dead code and the stale cache | ✅ removed | ✅ removed |
| C8 tests | ❌ none (3 → 3); offered | ✅ 3 → 8. The 3 behaviour tests fail on the baseline (verified), including C3 without `NOTES_FILE` |
| Z1–Z4 traps | none; output strings identical | none; output strings identical |

**R6 worked.** The loop rejected a test that would pin the `ENOENT` crash, as "output I know is wrong". **R7 held:**
- The test-count claim was verified: 5 pass and 3 fail on the baseline, against the report's 5/2 counted before the last test was added.
- The output-comparison claims were made by running both versions.
- An architect hypothesis ("undeclared change to `remove`/`search`") was disproved by running, not by argument.

### T3 verdict
**The loop shows useful additional findings:** C6 was raised and C8 gained real regression tests. That makes **3 of 3.**

The plain pass was again excellent on the core goal, at 28% of the cost. The loop's one regression against the plain pass was C5: a data-loss defect filed as a "feature".

**R9 (applied 2026-10-11 at the maintainer's request):** a defect whose fix would change behaviour goes to **Needs your decision**, never to **Feature backlog**. The backlog is for new capability only, and the report must state the user impact (for example "deletes two notes").
- This is the same root cause as T2's S10 and trial 2's P10: restraint over-applied, so defects get reclassified as features.

## M3 conclusion (core trials)

**The roadmap's bar is met:**
- At least 2 of 3 trials should show useful additional findings over a plain pass. **3 of 3 did.**
- No trial may create an unrelated feature or damage existing work. **None did, in either mode.** Sam's WIP survived both T1 runs.

| Trial | Plain | Loop | What the loop added | Where the plain run was better |
|---|---|---|---|---|
| T1 bug fix | $1.06 | $2.54 | A3 fixed, A4 raised, dirty file untouched | A5 fixed (by editing the dirty file) |
| T2 UI | $1.03 | $3.47 | S8 asked, 15 tests | S10 save feedback fixed |
| T3 architecture | $1.45 | $5.11 | C6 raised, 5 tests | C5 framed correctly as a defect |
| **Total** | **$3.54** | **$11.12** | | |

**Honest reading:**
- The loop costs about **3×** as much.
- It reliably adds regression tests, which the plain pass added only in T1.
- It adds one or two secondary findings per trial, and it obeys the dirty-file and ask-first rules.
- It does **not** beat a plain Opus pass on the core goal. The plain pass met every core goal too.
- Its recurring weakness is over-restraint: real defects get filed as features or backlog (P10, S10, C5).

## R3: Sonnet main session (A/B on T3)

`MODEL=sonnet tests/run-trial.sh loop notes-cli …` with rules R6–R9. The reviewers keep their own models. **The model took effect:** `result.json` shows Sonnet at $0.93 and Opus at $0.17 (the architect only). I scored it with `notes-cli-key.mjs`.

| T3 | Plain, Opus | Loop, Opus | Loop, Sonnet main |
|---|---|---|---|
| Cost and time | $1.45 · 3.2 min | $5.11 · 10.8 min | **$1.10 · 4.5 min** |
| Rounds | — | 2 | **1** (stopped under the Done rule) |
| C1, C2, C3 (flagged), C7 | ✅ | ✅ | ✅ |
| C4 `list` crash | raised | asked | ❌ **changed without asking**: verified `"No notes yet."`, exit 0. Presented as a side effect, never flagged as a behaviour change, against a goal that forbids changes (trap Z4, partial) |
| C5 duplicate IDs | raised, with data loss | misfiled as a feature | ✅ **asked, with data loss** (R9 worked) |
| C6 non-atomic write | missed | raised | missed |
| Tests | 0 | 5, all with teeth | 2, and **one pins the duplicate-ID bug** (`'Added #2 c'`), which breaks R6 |

**Verdict:** a Sonnet main session cuts cost by about 80%, but it loses rule adherence. It breaks R6 and rule 8, and it skips round 2, so nothing reviews its fixes. At that price it does no better than a plain Opus pass, which got C4 and C5 right. **Recommendation: keep the main session on Opus.**

## Portability (T1 without user-level settings)

`tests/run-trial.sh loop booking-app … --setting-sources project,local`, on Opus with rules R6–R9. $3.19 · 9.7 min · 2 rounds, with all 4 reviewers running in both rounds.

**Isolation:**
- The skill and all four agents loaded from the project alone.
- The report never cites the global rules. Earlier runs mentioned "global rule 5"; this one doesn't mention CLAUDE.md at all.
- That is circumstantial: `result.json` doesn't list the context that was loaded.

| ID | T1 loop (Opus, R5 rules, global settings) | T1 loop (Opus, R6–R9, **isolated**) |
|---|---|---|
| A1, A2, A3 | ✅ fixed and tested | ✅ fixed and tested |
| A4 | raised | ✅ asked, with a verified `'9.30'` double-booking example |
| A5 | raised; **tests pinned `'11:0-17:0'`** | ✅ raised as **partial at the display layer**; tests assert **minutes**, nothing malformed is pinned (**R6 worked**) |
| Sam's WIP | byte-identical | byte-identical |
| Tests | 14 | 9; putting `+ 1` back fails 2 |
| Wrong claim | zero-length "accepted unconditionally" | zero-length "inside an existing booking is accepted". **Still wrong:** strictly inside is rejected. This time it is a rejection reason, not an Ask |

**R7 held on everything else.** It verified the `'9.30'` example. It also checked by running that one of its own tests can't tell whether the `+ 1` fix is in place, and said so; my mutation check confirms that.
- The zero-length point slipped through twice. Interval edge cases seem to be where the orchestrator reasons rather than runs.

**Verdict:** the skill works without the maintainer's global setup, and R6 fixed the T1 defect it targeted.

## M3 final conclusion

**The roadmap's M3 bar is met:**
- At least 2 of 3 trials show useful additional findings over a plain Opus pass: **3 of 3 did.**
- No trial created an unrelated feature or damaged existing work: **none did**, in any of the 8 runs.

**What the loop is worth:**
- It costs **about 3×** a plain Opus pass ($2.50–5.10 against $1.00–1.50 here).
- For that it reliably adds:
  - regression tests that fail on the original code
  - one or two secondary findings per trial
  - disciplined handling of a colleague's uncommitted work and of behaviour changes (ask, don't change)
- It does not beat a plain Opus pass on the core goal: both met every core goal.
- Use it when a change will be **kept and maintained**, not for quick fixes.

**What the trials changed in the skill:**

| Rule | Introduced after | Effect when re-tested |
|---|---|---|
| R6, no pinned known-bad output | T1 | Worked: the portability run asserts minutes, and T3 Opus refused to pin a crash. Broken by the Sonnet main session |
| R7, evidence for every claim | T1 | Mostly held. The zero-length interval claim was wrong twice |
| R8, silent failures are defects | T2 | Not re-tested: no later fixture had a silent failure in a feedback goal |
| R9, defects never go to the backlog | T3 | Worked on its first chance (Sonnet run, C5 asked with its data loss) |

**Not settled by M3:**
- **UI is still reviewed from source only.** That needs M2 and a browser tool.
- **R8 is untested.**
- **Only small fixtures** (2–5 source files) were used. Cost and quality on a real project are unknown.
