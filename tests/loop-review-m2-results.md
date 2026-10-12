# /loop-review: M2 results (rendered evidence and design references)

_2026-10-11 · Claude Code 2.1.278 · `@playwright/mcp@0.0.83` (pinned, headless) · fixture `settings-page` (M3 trial T2, same goal) · decision record: `docs/ADR-002-rendered-ui-evidence.md`_

## Runs

| Run | Settings | Cost · time |
|---|---|---|
| **Skills** | `BROWSER=1`, default settings sources | $4.64 · 8.9 min · 67 turns |
| **No skills** | `BROWSER=1`, `--setting-sources project,local` | $4.66 · 11.9 min · 67 turns |
| Source-only loop (M3 T2, for comparison) | no browser, before R8 | $3.47 · 9.8 min |

Both M2 runs: 2 rounds, all 4 reviewers in both rounds, and screenshots at 375 and 1280 px **before and after**. All screenshots landed in `<work>/shots`, outside the repo. Copies are in `tests/trials/m2-t2-*/shots/`.

## How the runs were scored (by running, not by reading)
- **`tests/scoring/settings-page-rendered.mjs`** (new). It serves each final page and drives **installed Chrome** through the `playwright-core` already cached by the MCP server, so nothing was installed. At 375 and 1280 px it measures:
  - overflow, labels, the Tab path, and focus rings
  - the hint's distance from its field
  - the smallest touch target
  - hint and border contrast
  - what happens on Enter in a field, on an empty Save, and on a failed save (the static server answers `PUT` with 501)
- On the original fixture it reproduces S1–S6 and S10 exactly, with contrast 2.32 and 1.61 as in the answer key.
- I also ran the earlier answer-key scripts and checked the critic transcripts for the skill text.

| Measured | Plain (source) | Loop (source only) | **Loop + browser + skills** | **Loop + browser, no skills** |
|---|---|---|---|---|
| Overflow at 375 px | none | none | none | none |
| Labels, Save reachable by Tab, focus rings | ✅ | ✅ | ✅ | ✅ |
| Enter in a field submits (S1) | ✅ | ✅ | ✅ | ❌ `type="button"`; the run argued this is "unchanged from baseline" |
| Failed save tells the user (S10) | ✅ | ❌ nothing shown | ✅ | ✅ |
| Hint contrast · resting border contrast (S6) | 6.05 · 4.54 | 6.05 · 4.54 | 7.00 · **1.61** | 5.33 · **1.61** |
| Hint distance below its field at 375 px | above it | 4 px | **297 px** | **255 px** |
| Smallest touch target | 44 px | 44 px | 38 px | 44 px |

## Answer-key outcomes

| ID | Skills run | No-skills run |
|---|---|---|
| S1–S5 | ✅ | ✅, except S1 is partial (no implicit submit) |
| S6 contrast | ⚠️ hint fixed; resting border **missed** (not claimed as fixed) | ⚠️ hint fixed; border **raised** with the correct 1.61:1, correcting the critic's 1.31:1 |
| S7 `+` in email | ✅ **asked**: the first run in any mode to catch it | ❌ backlog mentions internationalised addresses, not `+` |
| S8 hint 30 vs 40 | ✅ asked, and **deliberately pinned neither** | ⚠️ asked, but its tests pin 40 (disclosed) |
| S9 phone | ✅ asked | ⚠️ filed under Feature backlog, which is the R9 pattern |
| S10 save feedback | ✅ fixed (R8) | ✅ fixed, with all three branches exercised in the browser |
| S11 tests | 5 source-text tests | 9 `validate()` tests |
| Traps Y1–Y3 | none: same accent, darker greys and reds only | none |

## What rendering added (findings no source-only run made)
1. **The hint sits far from its field.** At 375 px it renders 255–297 px below Display name, after the Language field. Both M2 runs raised this from the screenshots and measurements. The earlier source-only loop happened to move the hint correctly; the plain run put it above the field.
2. **Touch targets** measured at 38–40 px against 44 px (skills run). The no-skills run fixed them to 44 px.
3. **Verified UI claims.** Every rendered claim in both reports matches my independent measurement: overflow 960→375, Save added to the Tab path, focus rings, label counts and contrast values to ±0.1. In M1 and M3, UI claims were source-only.
4. **Concurrency bug reproduced in the browser** (no-skills run): a slow save plus a second click shows "Settings saved." next to a live error. It was filed as a remaining issue, as rule 8 requires.

## Design skills: did they help?
**The preload works.** The text of both skills is present in the skills run's critic transcripts and absent in the no-skills run.

The effect is **mixed, not decisive:**
- The skills run caught S7, pinned nothing disputed and kept S1 fully right.
- The no-skills run caught the S6 border and fixed the touch targets.
- One run each is too small a sample to credit either difference to the skills.

**Defect found and fixed:** the no-skills critic **claimed** "Design references: impeccable, ui-ux-pro-max" although neither skill was loaded. It copied the names from its own prompt. The prompt now says to name a skill only if its instructions are actually in context. That fix is **not yet re-tested**.

## Skill and harness findings
- **R8 worked on its first real test:** both runs fixed S10, which the M3 source-only loop had sent to the backlog.
- **R9 slipped once** in the no-skills run (S9 to the backlog).
- **Permission friction.** Each run had 4 denied Bash calls. The orchestrator wrapped the server start and `pkill` in shell forms (`&`, `nohup`, quoted patterns) that didn't match `Bash(python3 -m http.server*)` or `Bash(pkill -f http.server*)`. Both runs still got a server up, but a server could be left running; the harness now kills any leftover. **Candidate fix:** tell the orchestrator to start the server with the Bash tool's background option and the exact command form.
- **Cost:** +$1.17 over the source-only loop (+34%).

## M2 verdict
**The roadmap's M2 bar is met**, with one caveat:
- "Specific, testable feedback with and without the optional skills": both runs gave rendered, measured and verifiable findings.
- "Visual evidence for UI claims": every UI claim was backed by a before-and-after measurement and a screenshot, and all of them check out.
- **Caveat:** the honesty fix for the critic's design-references line, and the server-start friction, still need one more run to confirm.

## Follow-up run (2026-10-12): both fixes confirmed

T2 again, `BROWSER=1` with `--setting-sources project,local` (no design skills), after two changes:
- the critic's honesty wording
- the server instruction: `run_in_background`, and exactly `python3 -m http.server <port> -d <dir>` / `pkill -f http.server.<port>`

$5.36 · 13.2 min · 69 turns · 2 rounds, all 4 reviewers.

| Check | Before | Follow-up (verified from the transcript and `result.json`) |
|---|---|---|
| Critic's design-references line (skills absent) | falsely "impeccable, ui-ux-pro-max" | ✅ **"Design references: none"** in both rounds; neither skill's text is in the transcripts |
| Denied Bash calls | 4 (server start and stop in wrapped forms) | ✅ **1**, and it wasn't the server. The exact plain forms were used twice each, with no denials. The one denial was an attempt to build a script-free copy of the page in a temp folder, which was outside the allowlist and correctly blocked |

**Regression check, by running** (`settings-page-rendered.mjs`):
- No overflow at either width; all 4 controls labelled; Save in the Tab path; focus rings present.
- **Enter in a field submits** with no reload. The previous no-skills run had a `type="button"` here, so S1 is now fully right.
- A failed save shows a message; hint contrast 5.74; touch targets 44 px; tests 5/5.
- Still missed: the resting border at 1.61:1 (S6), not raised this time, and S7.
- S8 was asked **without** pinning 40 (R6 held).
- **Slip:** two final-round fixes went unreviewed (`method="post"` and a submit token against stale save responses). The token changes what a user sees when two saves race. The report flags both openly, but the final-round rule allows behaviour changes only for blockers.

**M2 follow-ups closed.** Remaining weak spots across all three browser runs:
- The resting-border contrast was missed 2 times out of 3.
- Duplicate PUTs on a double tap were correctly left as an Ask.
- `app.js` still has no DOM-level tests.
