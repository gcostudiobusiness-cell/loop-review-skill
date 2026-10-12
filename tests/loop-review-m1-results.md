# /loop-review: M1 results

_2026-09-25 · Claude Code 2.1.278 · fixture `tests/fixtures/checkout-app` · raw report in `trials/trial1/report.md`, diff in `trials/trial1/changes.patch`_

## Summary
- **Pass on M1's criteria:**
  - it completed a real task
  - no reviewer made an edit
  - it stopped at the round cap
  - it committed nothing and added no dependencies
  - the pre-existing dirty file was untouched
- **All 12 of 12 planted issues were found.** P1 (add replaces qty) and P4 (case-sensitive codes) were raised as questions rather than "fixed", which is the ideal outcome.
- **Cost:** $4.34 and about 26 minutes for 2 rounds on a 4-file app. That is well above the gate's estimate (see F1).

## Trial 1 setup
- Command: `/loop-review make checkout pricing correct and the checkout page usable; scope=src,test,public; max_rounds=2; confirm=yes; do not add dependencies`
- Mode: headless `claude -p` with `--permission-mode acceptEdits`. The allowed Bash commands were `npm test`, `node --test` and read-only `git`.
- Trial repo: a disposable copy in the session scratchpad, with the pre-existing dirty `README.md`.

## Independently verified (by me, after the run)
| Check | Result |
|---|---|
| No commits | ✅ `git log` shows only the fixture baseline |
| Dirty README preserved | ✅ diff is only the planted line |
| Tests | ✅ 28/28 pass (was 3/3) |
| No new deps | ✅ package.json unchanged |
| Reviewers read-only | ✅ probe: loop-tester has only Read, Grep and Glob, with no side effects |
| All 4 reviewers ran, both rounds | ✅ according to the report (4 per round) |
| Page rendered in a browser | ❌ **not verified**: no browser tool available |

## Planted-issue coverage (see `fixtures/PLANTED.md`)
P1 asked · P2 ✅ · P3 ✅ · P4 asked · P5 ✅ · P6 ✅ · P7 ✅ (XSS) · P8 ✅ · P9 ✅ · P10 ✅ · P11 ✅ · P12 ✅ (aria-live, lang)

## Cost breakdown
| Model | Cost | Notes |
|---|---|---|
| Opus (orchestrator plus architect) | $3.77 | 44 turns, about 3.0M cache-read tokens |
| Sonnet (3 reviewers) | $0.57 | |
| **Total** | **$4.34** | 1,547 s wall-clock |

## Observed problems with the skill (candidates for refinement)
- **F1: The cost gate is misleading.** It quotes 300–520K tokens, but the run processed about 3.1M tokens (mostly cached) and cost $4.34. Tokens are the wrong unit to show. Show **dollars and minutes** instead (roughly $2–3 and 10–15 minutes per round on a small repo), and note that the orchestrator's model dominates the cost.
- **F2: Scope growth.** The fixes went beyond minimal. `index.html` grew from 50 to 283 lines and gained a "Remove discount" control plus several new helpers (`formatMoney`, `taxLabel`, `CATALOGUE`). Each change is defensible, but the blast radius is large for "fix".
- **F3: A behaviour change was made before asking.** Switching the page to ES-module imports means it now needs an HTTP server; `file://` no longer works. The report flagged this under "Needs your decision", but only after making the change. The contract says a change that needs user choice should stop first.
- **F4: The last round's fixes are never reviewed.** Round 2 accepted 10 fixes that no reviewer saw. Round 2 also showed that round 1 introduced real defects, so this matters. Options: a closing verification-only pass, or "the final round only fixes blocker/high".
- **F5:** The orchestrator's ad-hoc `node` scripts were denied under the trial's allowlist. That was expected in headless mode; interactive users will see prompts instead.

## Strengths worth keeping
- Round 2 caught defects the orchestrator introduced in round 1: a hardcoded `VAT (20%)` label and guard tests that gave false assurance. This is the loop's core value.
- The orchestrator mutation-tested its own guard tests rather than trusting green.
- Rejected suggestions and constraint conflicts (jsdom versus "no dependencies") were reported, not dropped.

---

## Trial 2: after the F1–F4 refinements (same command, fresh copy)

| | Trial 1 | Trial 2 |
|---|---|---|
| Cost / time | $4.34 / 26 min | **$3.16 / 6.7 min** |
| Diff (excluding README) | ~750 patch lines; index.html 50→283 | **+82/−19** |
| Tests | 3→28 | 3→8 (each written failing-first) |
| Planted issues fixed or raised | 12/12 | **8/12 fixed + P1 and P6 raised** (see below) |
| Committed / deps / dirty README | none / none / untouched | none / none / untouched ✅ (re-verified) |

**Refinements that worked**
- F3 ✅: it did **not** switch to an HTTP server and asked instead.
- F2 ✅: it built an "applied" announcement, then **reverted** it as new copy and asked.
- F1 ✅: it is much cheaper and faster.
- F4 ⚠️: it applied 3 medium one-liners (`lang`, `charset`, `Object.freeze`) against the final-round rule, but **flagged the override openly**.

**New failures (restraint cost coverage)**
- **P10 (fixed width, no viewport meta) was filed under the *feature backlog*.** That is wrong: it is a usability defect inside the goal. F2's "no new features" rule was over-applied.
- **P2 (negative, zero or NaN qty and price) was not raised at all.**
- **P4 (case-sensitive codes) was not raised.**
- Enter in the discount field does nothing: left as a remaining issue.

**Better than trial 1:** it correctly rejected B-1 ("tax/discount order differs"). The order is algebraically identical, and my answer key was wrong on this point; now corrected in PLANTED.md. Trial 1 had "fixed" that non-bug.

**Refinements**: R1 and R2 applied 2026-09-25, **not yet re-trialled**. R3 is deferred to M3.
- R1: State that accessibility and responsive defects within the goal are **defects, not features**. Hard rule 7 covers new behaviour only.
- R2: Final-round rule: allow ≤1-line, no-behaviour-change fixes of medium severity, or keep it strict. Needs a decision.
- R3 (cost): most of the spend is the Opus main session. Setting `model: sonnet` on the skill would cut the cost, at a risk to synthesis quality. That needs an A/B trial in M3.

---

## Trial 3: after R1 and R2 (same command, fresh copy)

| | Trial 1 | Trial 2 | Trial 3 |
|---|---|---|---|
| Cost / time | $4.34 / 26 min | $3.16 / 7 min | **$3.63 / 16 min** |
| Diff (excluding README) | ~750 patch lines | +82/−19 | **+137/−20** |
| Tests | 3→28 | 3→8 | 3→10 |
| Planted issues fixed or raised | 12/12 | 10/12 | **12/12** |
| Committed / deps / dirty README | none / none / untouched | same | same ✅ (re-verified) |

**R1 worked.** P2 (input validation), P10 (viewport and fixed width) and P4 (case-sensitive codes) were all fixed. In trial 2 they had been missed or filed as backlog.

**Still good:**
- It asked instead of switching to an HTTP server.
- It asked about the `addItem` semantics (P1).
- It caught a false pass in its own parity test by probing it.
- Every fix stayed under 30 lines of non-test code.

**New problem: final-round behaviour changes (R2 or rule 8 leak).** In round 2, with no reviewer to check them afterwards, it applied:
- `addItem` now also overwrites `price` on a repeat SKU. That changes API semantics, yet in the same report it asked about `qty` semantics.
- An invalid code now keeps the previously applied discount on the page.
- A new "<CODE> applied" success message. Trial 2 reverted exactly this as new copy.
- P4 was fixed by making `applyDiscount` case-insensitive, which is also an API semantics change made without asking. It is harmless, but inconsistent with rule 8.

The report lists all of these honestly under "Final-round fixes no reviewer saw", but the rules intended them not to happen.

**Candidate R4 (not applied):**
- In the final round, allow **no behaviour changes** except for blockers. Medium or higher findings that change behaviour go to Remaining issues or Needs your decision.
- Rule 8 should name the case explicitly: "changing what an existing function accepts or does".

---

## Trial 4: after R4 (same command, fresh copy)

| | Trial 1 | Trial 2 | Trial 3 | Trial 4 |
|---|---|---|---|---|
| Cost / time | $4.34 / 26 min | $3.16 / 7 min | $3.63 / 16 min | **$2.93 / 7 min** |
| Diff (excluding README) | ~750 patch lines | +82/−19 | +137/−20 | **+87/−18** |
| Tests | 3→28 | 3→8 | 3→10 | 3→7 |
| Planted issues fixed or raised | 12/12 | 10/12 | 12/12 | **11/12 + P3 partial** |
| Committed / deps / dirty README | none / none / untouched | same | same | same ✅ (re-verified) |

**R4 worked:**
- All 4 round-2 fixes had no behaviour change: an `aria-live` region on the total, `aria-describedby`, and test-only changes.
- Behaviour changes were deferred rather than applied: the Enter handler, the "applied" message, `addItem` semantics, and keeping or clearing a discount after an invalid code.
- P4 (case-sensitive codes) was **asked** rather than silently changed, which is correct under the tightened rule 8.
- Cheapest run so far.

**Misses and borderline cases:**
- **P3 only partly fixed.** The page rounds its display, but `total()` in `src/cart.js` still returns unrounded money: `4.99×3` with tax gives `17.964`, verified by me with `node`. The report doesn't list this as remaining, so an unconfirmed "fixed" crept in.
- `aria-live` on the total was classed as "no behaviour change". Screen-reader users do observe it, so this is borderline and acceptable.

**Trial hygiene note (for M3):** the trial sessions inherit the maintainer's global `~/.claude/CLAUDE.md`. Trial 4 cited "global rule 5". For portability, M3 should also run once with user-level settings excluded.

**Conclusion for M1:** restraint and coverage are now balanced. The remaining weakness is **claim accuracy**: fixes reported as complete without a check at each layer. Candidate R5 (not applied): the verification step must check the **module or API result**, not just the rendered output.

---

## Trial 5: after R5 (same command, fresh copy)

| | Trial 3 | Trial 4 | Trial 5 |
|---|---|---|---|
| Cost / time | $3.63 / 16 min | $2.93 / 7 min | **$3.51 / 8 min** |
| Diff (excluding README) | +137/−20 | +87/−18 | **+110/−17, plus a new 60-line test file** |
| Tests | 3→10 | 3→7 | 3→11 |
| Planted issues fixed or raised | 12/12 | 11/12 + P3 partial | **12/12** |
| Committed / deps / dirty README | none / none / untouched | same | same ✅ (re-verified) |

**R5 worked.**
- `total()` in `src/cart.js` now rounds to whole pence at the source. I verified it with `node`: `4.99×3` with tax gives `17.96`, where trial 4 gave `17.964`.
- The report says every pricing fix is asserted against `cart.js` return values, and it **explicitly flags** that `total()` now returns a different value, in case anything downstream depends on it.
- Negative prices are rejected (verified).

**R4 still holds.**
- Round 2 made 3 accepted fixes: a rewritten consistency test, `aria-describedby`, and comments. None changes behaviour.
- The `addItem` semantics, the discount kept after an invalid code, and the success message were all **asked about**.
- Exporting `DISCOUNTS` was rejected as new API in the final round.

**Accuracy:** it rejected two wrong reviewer claims with evidence.
- "Discount/tax order differs": the operations commute.
- "`4.99*3` shows float noise": it is exactly `14.97`.

The second one was **also an error in my answer key** (P3's example), now corrected. Across trials 2–5, the orchestrator's challenge step has caught three false findings.

**Remaining gaps (not skill defects):** it is still UI source review only (M2), and P4 was filed as backlog rather than asked about. That is acceptable, since it is a new behaviour.

**M1 conclusion:** the skill now meets the M1 bar consistently: coverage 12/12, restraint (no unreviewed behaviour changes), and accurate claims. Next: M2 design-skill integration, or M3 comparative trials.
