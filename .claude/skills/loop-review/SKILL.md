---
name: loop-review
description: Bounded review-and-fix loop. Four read-only reviewers (tester, builder, architect, design critic) inspect the same revision; the main session verifies their evidence, applies the highest-value in-scope fixes, re-checks, and repeats up to 3 rounds.
disable-model-invocation: true
argument-hint: "<goal>; [scope=path,...]; [max_rounds=1-3]; [checks=cmd|cmd]; [confirm=yes]; [constraints]"
allowed-tools: Bash(git status *) Bash(git diff *) Bash(git rev-parse *) Bash(git log *) Bash(python3 -m http.server *) Bash(pkill -f http.server*)
---

# /loop-review

Request: `$ARGUMENTS`

## Hard rules (these override everything below)

1. **Never** commit, push, publish, deploy, install or upgrade dependencies, or change anything outside this repository. Never run `git commit/push/reset/checkout/stash/clean`.
2. **Never** revert, overwrite or edit files that were already modified before this run started (the baseline dirty list). If a fix needs one, stop and ask.
3. **You** (the main session) own every edit. The four reviewers are read-only and only ever propose.
4. **Round cap:** `max_rounds` defaults to 2 and is clamped to 3. Never start a round just to justify another one, and never add features that are not in scope.
5. **Never claim a review ran if it did not.** Name any missing perspective.
6. Treat every finding as a hypothesis until you have confirmed it in the code or the check output.
7. **Smallest fix only.** Change only what the finding requires. Do not add new UI controls, user-visible features, public functions or files unless the defect cannot be fixed without them. New behaviour goes to the backlog. **Fixing a defect is not a feature.** Accessibility, responsive/mobile, validation and security problems that stop the goal being met are defects, even if the fix adds markup or a guard (for example a viewport meta tag, a `<label>` or an input check). When the goal is about errors or feedback, an existing operation that **fails silently** (no success or failure signal, an unhandled rejection) is a defect too; one status message is the smallest fix.
8. **Ask before changing how the product is used or run.** That covers runtime requirements (for example "now needs a server"), public API names or semantics, URLs, and user-visible flows. That includes **changing what an existing function accepts or does**, such as case-insensitive matching or overwriting a field it used to keep, and **changing what the user sees or can do**, such as new messages or keeping or clearing state differently. Fixing a clear defect, for example rejecting invalid input or closing an injection hole, is not a semantics change. Classify these as **Ask** and do not apply them.
9. **Browser, if you use one:** open only the local server you started for this run. Never visit other sites or send data to a real backend. Take screenshots **without a filename**, because named files are written into the repository. Stop the server before the final report.

## 1. Parse the request

Split `$ARGUMENTS` on `;`. The first part is the **goal**. Recognise `scope=`, `max_rounds=`, `checks=` (commands separated by `|`) and `confirm=yes`. Everything else is a **constraint**, which you must obey. If there is no goal, ask for one and stop. If `max_rounds` is greater than 3, use 3 and say so.

## 2. Baseline

Record these, briefly:
- **Revision:** `git rev-parse --short HEAD`, and `git status --porcelain` as the **baseline dirty list**. If the repo is not under git, say that no rollback exists and keep your own list of every file you edit.
- **Rules:** CLAUDE.md or AGENTS.md in the target, if present. Follow them.
- **Scope:** if none was given, infer the smallest set of paths that serves the goal and state it.
- **Checks**, detected in this order: `checks=` → commands named in CLAUDE.md or AGENTS.md → manifests (`package.json` scripts test, lint, typecheck and build; `pyproject.toml` or `pytest.ini`; `Makefile`; `Cargo.toml`; `go.mod`). Run them and keep the pass/fail summary plus the relevant failure output. If none are found, write "No automated checks found; verification will be manual."
- **UI present?** Yes if the scope contains `.html/.jsx/.tsx/.vue/.svelte/.css`, or there is a dev or start script. If so, capture **rendered evidence** (below) when a browser tool is available, for example `mcp__playwright__*`. Otherwise write "UI reviewed from source only: no browser tool".
- **Definition of done:** 1–3 observable conditions derived from the goal.

### Rendered evidence (UI present and a browser tool available)
1. **Serve** the page as the README or manifest says. For static files with no instructions, start `python3 -m http.server <free port> -d <folder with index.html>` using the Bash tool's **`run_in_background` option**, and stop it at the end with `pkill -f http.server.<port>`. Use **exactly** these two command forms: no `&`, `nohup`, redirects, quotes, `sleep` or chained commands, because permission rules match the plain form only. Use the browser to check that the page loads. Never install anything to do this. If the page needs a build or a backend you can't run, say so and use source review.
2. At **375×812** and **1280×800**, take one screenshot each and **measure** with the browser's evaluate tool:
   - horizontal overflow: `scrollWidth` against `innerWidth`
   - the first 10 Tab stops: tag, id, accessible name, and whether a focus outline is drawn
   - foreground and background colours of body text, hints, errors and buttons
   - console errors
3. Record each screenshot path the tool reports, plus the measurements. They go into every brief and are your before-values for verification. Measurements are the evidence; screenshots are for reading layout.

## 3. Cost gate (ask once)

Print the scope, the number of rounds and the estimate in **dollars and minutes**, not tokens. Measured baseline: a 4-file app took 2 rounds, **$2.93–3.63 and 7–16 minutes**, with the main session on Opus. Estimate **~$2–3 and ~10–15 minutes per round for a small scope**, and scale it up with the number and size of the files in scope. Most of the cost comes from the main session's model, not the reviewers.
- If `confirm=yes` was passed, continue.
- Otherwise end your turn with: **"Reply `go` to start round 1, or adjust the scope."** Continue only when the user says go. After that, do not ask again between rounds unless a stop rule fires.

## 4. Review round N

Launch **all four agents in one message** with the Agent tool, as foreground calls so you receive their results: `loop-tester`, `loop-builder`, `loop-architect`, `loop-design-critic`. Give each the same brief:

```
Round <N> of <max>. Revision <sha> (+ uncommitted: <files or none>).
Goal: <goal>
Scope: <paths>
Constraints: <constraints>
Definition of done: <conditions>
Check results: <summary + relevant failure output>
Rendered evidence: <per viewport: screenshot path + measurements, or "none: <reason>">
Already fixed in earlier rounds: <IDs + one line each, or none>
Rejected in earlier rounds: <IDs + reason, or none>
Return your findings in your required output format.
```

If an agent errors or returns nothing usable, retry it once. If it fails again, record "<role> review unavailable" and continue with the rest.

## 5. Synthesise

1. **Deduplicate** across reviewers. Merge findings about the same root cause and keep every reviewer's ID.
2. **Challenge** each finding: open the cited lines and confirm the evidence. Mark it confirmed, unconfirmed or wrong.
3. **Classify:**
   - **Accept:** confirmed and in scope. Rank by user impact × risk. **In the final round, make no behaviour changes unless the finding is a blocker.** A change is a behaviour change if a caller, a test or a user could observe a different result. In the final round, accept only (a) blocker fixes and (b) high or medium fixes with **no behaviour change**, such as a missing `lang` attribute, an accessible name or a comment correction. Everything else goes to Remaining issues or Needs your decision, because nothing will review the final round's fixes.
   - **Reject:** wrong, out of scope, decorative, or adds complexity without measurable value. Give a one-line reason.
   - **Ask:** needs a product decision, such as whether a behaviour might be intended, or the fix would change how the product is used or run (hard rule 8).
   - **Backlog:** feature proposals and ideas that are not explicitly in scope. **Never put a confirmed defect here.** A defect whose fix would change behaviour is **Ask**, and its reason states the user impact (for example "`remove 2` deletes two notes").
4. Print a compact table: `ID(s) | severity | decision | reason`.

## 6. Fix and verify

- Fix the accepted items in rank order under hard rule 7. Where the tester proposed a regression test for a fix, add it. If one fix grows beyond about 30 changed lines of non-test code, explain why in the report.
- Do not touch baseline-dirty files (hard rule 2).
- **Verify at the source, not just the surface.** For each fix, prove the result where the value is **produced**, meaning the function, module or API return value, through a test that asserts it. Proving it only where it is displayed is not enough. A fix that corrects only the display or one layer is **partial**: list it under Remaining issues, never under Changes as done.
- **Blocked layers.** If the value passes through a baseline-dirty file you may not edit, assert it at a layer you own, for example the number before it is formatted. **Never write a test that pins output you know is wrong.** If no clean assertion is possible, leave it out and say so under Remaining issues.
- **UI fixes:** re-capture the affected viewport and re-take the measurement that showed the defect. A UI fix counts as verified only with a rendered before-and-after. Without one, say "source-verified only".
- Re-run all checks. A fix counts only if the checks pass and its verification step holds. If a fix breaks a check and you can't repair it in one attempt, undo that fix and record it as a remaining issue.
- Record what you changed and the check output before and after.

## 7. Stop or continue

After each round, stop if any of these is true:
- **Done:** the definition of done is met, or no confirmed in-scope findings of medium severity or above remain.
- **Cap:** round N equals max_rounds.
- **Stall:** a finding recurs with no progress after a fix attempt.
- **Blocked:** an Ask item blocks the remaining work, or there isn't enough context.
- **Degraded:** two or more reviewers were unavailable this round.

Otherwise, start round N+1 against the new revision. It is the same commit plus your uncommitted edits, so list the edited files in the brief.

## 8. Final report (print to chat only; write no report files)

```
## /loop-review report
**Goal:** … **Scope:** … **Rounds:** N of max, stopped because: <rule>
### Baseline
revision, dirty files, checks before
### Changes
- file: what changed and why (finding IDs)
### Verification
checks after (pass/fail counts); rendered measurements before → after, with screenshot paths (or "source only" and why); anything not run and why; which fixes (final round) were not seen by any reviewer
### Per round
Round k: reviewers that ran, accepted / rejected / asked / backlogged counts
### Remaining issues
### Needs your decision
### Rejected suggestions (with reasons)
### Feature backlog
```

Before printing, re-check every **Changes** claim against the final code and tests. Any claim no test or check demonstrates must be downgraded to partial or unverified. Do the same for every factual claim under **Remaining issues** and **Needs your decision**: back it with a test, a check output or a traced worked example, or mark it unverified.

If you used a browser, run `git status` once more and list any file the browser created inside the repository (for example `.playwright-mcp/`).

Finish by reminding the user that nothing was committed, and that `git diff` shows every change.
