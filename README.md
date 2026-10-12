# /loop-review

A Claude Code skill that runs a **bounded review-and-fix loop** on your codebase. Four specialist reviewers look at the same code from different angles. Claude checks their evidence, fixes the most valuable in-scope problems, re-runs your checks, and reviews again. It stops after 2 rounds by default, and never after more than 3.

> **Status: v0.1.1, early release.** Tested on Claude Code 2.1.278 across 16 headless trials on four small sample apps. It has not yet been run on large real-world projects. See [Evidence](#evidence) and [Limitations](#limitations).

## How it works

```
baseline ─▶ cost gate ─▶ ┌─ review (4 agents, read-only, in parallel) ─┐
                          │  synthesise → fix → verify                  │ ×2 (max 3)
                          └─────────────── stop rules ───────────────────┘ ─▶ report
```

| Reviewer | Asks | Model |
|---|---|---|
| `loop-tester` | What breaks? Which edge cases are untested? What could regress? | Sonnet |
| `loop-builder` | What is the smallest fix within the existing stack? | Sonnet |
| `loop-architect` | Does it fit the system boundaries? Is there a simpler structure? | Opus |
| `loop-design-critic` | Is it usable on mobile, by keyboard and by screen reader, and in error states? | Sonnet |

The reviewers can only **read** (their tools are Read, Grep and Glob). The main session makes every edit, and only after confirming each finding against the code.

## Install

Pick one of two options. Both copy the same five files.

**For one repository**, run this from its root. You can commit the files so everyone on the project gets `/loop-review`:

```
git clone --depth 1 https://github.com/gcostudiobusiness-cell/loop-review-skill /tmp/loop-review-skill
mkdir -p .claude/skills .claude/agents
cp -R /tmp/loop-review-skill/.claude/skills/loop-review .claude/skills/
cp /tmp/loop-review-skill/.claude/agents/loop-*.md .claude/agents/
```

**For every project on your machine**, install into your user-level Claude Code folder:

```
git clone --depth 1 https://github.com/gcostudiobusiness-cell/loop-review-skill /tmp/loop-review-skill
mkdir -p ~/.claude/skills ~/.claude/agents
cp -R /tmp/loop-review-skill/.claude/skills/loop-review ~/.claude/skills/
cp /tmp/loop-review-skill/.claude/agents/loop-*.md ~/.claude/agents/
```

Both options were tested on Claude Code 2.1.278: the skill is found, and the agents run with read-only tools. If you use both, keep them on the same version.

The five files, relative to `.claude/` or `~/.claude/`:

```
skills/loop-review/SKILL.md
agents/loop-tester.md
agents/loop-builder.md
agents/loop-architect.md
agents/loop-design-critic.md
```

If the `agents/` folder did not exist before, restart Claude Code once so the agents load. It does not replace the built-in `/loop` command.

**Optional:**
- **A browser tool for rendered UI evidence**, for example `claude mcp add playwright -- npx @playwright/mcp@0.0.83 --headless --output-dir /tmp/loop-review-shots`. Set `--output-dir` outside your repo, or screenshots land in `.playwright-mcp/`.
- **The design skills `impeccable` and `ui-ux-pro-max`**, which the design critic preloads as checklists when installed.

## Usage

```
/loop-review <goal>; [scope=path,...]; [max_rounds=1-3]; [checks=cmd|cmd]; [confirm=yes]; [constraints]
```

```
/loop-review make checkout pricing correct and the checkout page usable; scope=src,test,public; do not add dependencies
```

| Option | Default | Meaning |
|---|---|---|
| `scope=` | inferred from the goal | Paths to review and edit |
| `max_rounds=` | 2 | Clamped to 3 |
| `checks=` | auto-detected | Commands to verify with, separated by `\|`. Otherwise taken from CLAUDE.md or AGENTS.md, then `package.json`, `pyproject.toml`, `Makefile`, `Cargo.toml` or `go.mod` |
| `confirm=yes` | off | Skip the cost gate. Use it for headless `claude -p` runs |
| anything else | | Constraints that the main session must obey |

Claude records a baseline, shows a cost estimate, and waits for you to reply **`go`**.

## What it will and won't do

**It will:**
- fix confirmed in-scope defects with the smallest change
- add regression tests
- ask before any change to how your product is run or used
- report everything it rejected or deferred

**It will never:**
- commit, push, deploy or install dependencies
- touch files you had already modified before the run
- add unrequested features (these go to a backlog in the report)
- claim a review ran when it didn't

Every change is left uncommitted for you to inspect with `git diff`.

## Cost

Expect **about $2.50–5.50 and 5–13 minutes** for 2 rounds on a small scope (2–5 source files), with the main session on Opus. Larger scopes cost more. Most of the cost is the main session's model, not the reviewers. A run with a browser costs about a third more.

The cost gate shows an estimate in dollars and minutes and waits for your `go`.

## Evidence

Every run was scored **by running the result**, not by reading its report:
- the tests were run
- each planted issue in a written answer key was checked against the final code
- UI pages were measured in a real browser

Scripts and raw evidence are in [`tests/`](tests/).

**Against a normal Claude Code pass** (same goal, same model, Opus; [M3 results](tests/loop-review-m3-results.md)):

| Task | Normal pass | `/loop-review` | What the loop added |
|---|---|---|---|
| Bug fix with a colleague's uncommitted file | $1.06 | $2.54 | Fixed a second bug and raised a validation hole; left the uncommitted file untouched |
| Mobile and keyboard UI fix | $1.03 | $3.47 | Asked about a copy and code contradiction instead of guessing; 15 regression tests |
| Storage-layer clean-up | $1.45 | $5.11 | Raised unsafe file writes; 5 regression tests that fail on the old code |

- **In short:** about 3× the cost of a normal pass. For that you get regression tests, one or two extra findings per task, and careful handling of your uncommitted work and of behaviour changes.
- **Where it doesn't help:** a normal Opus pass also met every core goal.
- **When to use it:** for changes you'll keep and maintain, not for quick fixes.
- **Main session on Sonnet:** about 80% cheaper, but it broke the skill's own rules. Keep the main session on Opus.

**Rendered UI evidence** ([M2 results](tests/loop-review-m2-results.md)): with a browser tool, every UI claim in the reports matched an independent measurement. Rendering also found a layout problem that no source-only run spotted.

## Sample report (abridged, trial 2)

```
## /loop-review report
Goal: make checkout pricing correct and the checkout page usable
Rounds: 2 of 2, stopped because: Cap
### Changes
- src/cart.js: applyDiscount uses Object.hasOwn — "__proto__" made the total £NaN (T-1)
- public/index.html: <span onclick> → <button> — controls were unreachable by keyboard (D-1)
- public/index.html: error via textContent, not innerHTML — XSS from the code field (A-2)
### Verification
npm test: 3 pass → 8 pass, 0 fail. Not run: no browser; UI fixes source-verified only.
### Needs your decision
- Serve the page over HTTP so it can import src/cart.js? Changes how it is run, so not done.
### Rejected suggestions
- B-1 "tax/discount order differs": algebraically identical; confirmed before rejecting.
```

Full reports and diffs are in [`tests/trials/`](tests/trials/).

## Limitations

- **Rendered UI evidence needs a browser tool.** With one (tested: `@playwright/mcp@0.0.83`), the main session serves the page locally, then screenshots and measures it at 375 and 1280 px. Without one, UI is reviewed from source only, and the report says so. Pages that need a build or a backend fall back to source review.
- Tested only on four small sample apps (2–5 source files). It has not yet been run on large real-world projects.
- **Known weakness: over-caution.** It sometimes files a real defect as an Ask or a backlog item instead of fixing it. The report always lists it, so check "Needs your decision".
- Review quality and cost depend on the main session's model. Opus was used in all trials.
- The cost gate is interactive. Pass `confirm=yes` for headless use.

## Repository layout

| Path | Contents |
|---|---|
| `.claude/` | The skill and the four agents (the product) |
| `docs/ADR-001-loop-review-contract.md`, `docs/ADR-002-rendered-ui-evidence.md` | Behaviour contract; rendered UI evidence |
| `tests/fixtures/` | Four sample apps with planted issues, and their answer keys (`PLANTED*.md`) |
| `tests/setup-trial.sh`, `tests/run-trial.sh` | Build a disposable trial repo and run a headless trial (`MODEL=`, `BROWSER=1`) |
| `tests/loop-review-m{1,2,3}-results.md`, `tests/trials/`, `tests/scoring/` | Trial results and the scripts that scored them |

## Licence

[MIT](LICENSE).
