# ADR-001: /loop-review behaviour contract

- **Status:** Accepted. Merged via PRs #1–#4, 2026-09-25. Revised through trials 1–5 (see the notes in §8)
- **Date:** 2026-09-25
- **Inputs:** the project roadmap, the maintainer's decisions D1–D4 (models, cost gate, test target, repo), and the Claude Code [skills](https://code.claude.com/docs/en/skills) and [sub-agents](https://code.claude.com/docs/en/sub-agents) documentation, checked against Claude Code 2.1.278

## 1. Invocation

```
/loop-review <goal>; [scope=<path,…>]; [max_rounds=1|2|3]; [checks=<cmd|cmd>]; [confirm=yes]; [free-text constraints]
```
- The goal is the text before the first `;`. The optional `key=value` parts are separated by `;`. Commands inside `checks=` are separated by `|`. Anything left over is a constraint in plain language.
- `confirm=yes` skips the cost gate, for headless (`claude -p`) runs.
- `max_rounds` defaults to **2**. Values above 3 are **clamped to 3** and the clamp is reported.
- **Name:** `/loop-review` (directory `.claude/skills/loop-review/`). It does not collide with the bundled `/loop`, which is only overridden by an identical name.
- `disable-model-invocation: true`: only a person, or a headless `claude -p`, can start it.

## 2. Phases

| # | Phase | Owner | Output |
|---|---|---|---|
| 0 | **Baseline** | Orchestrator | Goal and scope, git state (branch, dirty files), detected checks and their results, UI present yes/no, and a definition of done |
| 1 | **Cost gate** (D3) | Orchestrator | Scope, planned rounds and an estimate in dollars and minutes (§8). **Waits once for "go"** unless `confirm=yes` |
| 2 | **Review** | 4 agents, concurrently, same revision | ≤5 findings each, plus ≤1 feature proposal |
| 3 | **Synthesis** | Orchestrator | Deduplicated, challenged and ranked list: *accepted*, *rejected (with reason)*, *backlog* |
| 4 | **Fix and verify** | Orchestrator only | Edits, then the checks re-run, with evidence recorded |
| 5 | Repeat 2–4 until a stop rule fires | | |
| 6 | **Final report** | Orchestrator | See §6 |

## 3. Permissions

| Actor | Tools | Model (D2) | Bound |
|---|---|---|---|
| `loop-tester` | Read, Grep, Glob | sonnet | `maxTurns` |
| `loop-builder` | Read, Grep, Glob | sonnet | `maxTurns` |
| `loop-architect` | Read, Grep, Glob | **opus** | `maxTurns` |
| `loop-design-critic` | Read, Grep, Glob, plus `skills: [impeccable, ui-ux-pro-max]` if present (M2) | sonnet | `maxTurns` |
| Orchestrator | Session tools | Session | Edits only within scope |

- Reviewers have **no Bash, Write, Edit or Agent**. The orchestrator runs every command and passes the outputs in. Reviewers name the commands they want run as verification steps.
- **Never:** commit, push, publish, deploy, install dependencies, or change anything outside the repo. **Never** revert or overwrite pre-existing uncommitted changes. If a fix must touch a file that was already dirty, stop and ask.
- If the repo is not under git, warn that no rollback exists, still run, and list every file edited.

## 4. Detecting checks and UI (no assumption of npm or a browser)

Checks are detected in this priority order:
1. `checks=` argument
2. Commands named in the target's CLAUDE.md or AGENTS.md
3. Manifests: `package.json` scripts (test, lint, typecheck, build), `pyproject.toml`/`pytest.ini`, `Makefile` targets, `Cargo.toml`, `go.mod`, and others
4. Otherwise: *"no automated checks found"*. Verification falls back to manual reproduction, and the report says so.

**UI present** means there are frontend files in scope (`.html/.tsx/.jsx/.vue/.svelte/.css`) or a dev/start script. When a UI is present, the design critic reviews code in M1. Rendered screenshots at useful viewports arrive in M2 via whatever browser tool exists. **If none exists, the critic's report says so.**

## 5. Evidence rules

Every finding has the form:
```
ID | severity (blocker/high/medium/low) | location (file:line or page@viewport) |
observed evidence | user impact | recommended change | verification step | confidence (high/med/low)
```
A feature proposal adds: user problem, who benefits, evidence, smallest version, cost, and why it belongs in this goal. A proposal without evidence is labelled **idea** and goes to the backlog. Aesthetic claims ("looks generic") are not evidence. The orchestrator treats every finding as a hypothesis and confirms it against the code or check output before acting on it.

## 6. Stop rules (checked after every round)

Stop when any of these is true:
- **Done:** the definition of done is met, or no material (≥medium) in-scope findings remain
- **Cap:** `max_rounds` has been reached (hard cap 3)
- **Stall:** the same finding recurs with no progress
- **Blocked:** a fix needs a user decision, or there isn't enough project context
- **Degraded:** two or more reviewers failed after one retry each

Never add features or start a new round just to justify another round.

**Failed agent:** retry once. If it still fails, report the missing perspective by name and never imply four reviews ran.

## 7. Final report

1. Baseline: goal, scope, git state, checks and results
2. Rounds: for each round, the reviewers that ran, findings accepted, rejected and backlogged
3. Changes: files, and why each changed
4. Verification: checks before and after, and anything that could not be run
5. Remaining issues, including fixes that are only partial (R5)
6. Needs your decision: the Ask items (hard rule 8)
7. Rejected suggestions, with reasons
8. Feature backlog
9. Which stop rule fired
10. Actual cost, if available

Printed to chat only. **No files are written to the target repo apart from the fixes.**

## 8. Cost estimate shown at the gate

Shown in **dollars and minutes**; tokens proved misleading because of cache reads. Measured in M1 on a 4-file app, 2 rounds: trial 1 cost **$4.34 and 26 minutes** (the Opus main session was $3.77); trials 2–5, under the refined rules, cost **$2.93–3.63 and 7–16 minutes**. The gate quotes ~$2–3 and ~10–15 minutes per round for a small scope, scaled up by scope size.

_Revised 2026-09-25 after trial 1: F1 cost units, F2 smallest-fix rule, F3 ask before usage/runtime changes, F4 final round fixes only blocker/high. After trial 2: R1 in-goal accessibility, responsive, validation and security problems are defects, not features; R2 the final round also allows one-line medium fixes with no behaviour change. After trial 3: R4 the final round makes no behaviour changes except for blockers, and rule 8 explicitly covers changing what an existing function accepts or does, or what the user sees. After trial 4: R5 verify each fix where the value is produced (module or API), not only where it is displayed; display-only fixes are reported as partial, and every Changes claim is re-checked before the report. After M3 trial T1: R6 when a value passes through a baseline-dirty file, assert it at a layer the run owns and never pin known-wrong output; R7 claims under Remaining issues and Needs your decision need the same evidence as Changes (trials also now allow ad-hoc `node`). After M3 trial T2: R8 when the goal is about errors or feedback, an operation that fails silently is a defect, and one status message is the smallest fix. After M3 trial T3: R9 a confirmed defect never goes to the feature backlog; if its fix changes behaviour it is an Ask that states the user impact._

## Consequences
- Truly read-only reviewers depend on the orchestrator's check outputs. A reviewer can't reproduce a bug on its own.
- The single cost gate makes the command interactive. In headless (`-p`) testing the gate needs `confirm=yes` in the arguments to proceed (approved by the maintainer in M1).
- A new `.claude/agents/` directory needs a session restart before interactive use.
