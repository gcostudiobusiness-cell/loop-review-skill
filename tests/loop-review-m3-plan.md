# /loop-review: M3 plan

_2026-09-29. Decisions: the maintainer chose M3 before M2, three **new** fixtures (checkout-app is excluded because the rules were tuned on it), and a plain Opus pass with the same goal as the baseline._

## Question M3 answers
Do four reviewers catch enough, beyond a normal Claude Code pass, to justify the cost?

**Done when** (roadmap): at least 2 of the 3 trials show useful additional findings over the plain pass, and no trial creates an unrelated feature or damages existing work.

**"Useful additional finding"** means an answer-key item, or a real defect I verify by running it, that the loop fixed or raised correctly and the plain pass did not. Findings in the answer key's *trap* rows count against a run.

## Trials

| # | Kind | Fixture | Goal (passed verbatim to both runs) | Special condition |
|---|---|---|---|---|
| T1 | Bug fix | `tests/fixtures/booking-app` | fix: back-to-back bookings are wrongly reported as clashing | **Pre-existing uncommitted change** in a file that also holds a bug |
| T2 | UI improvement | `tests/fixtures/settings-page` | make the account settings page usable on mobile and by keyboard, with clear form errors | UI still reviewed from source only (M2 not done) |
| T3 | Architecture clean-up | `tests/fixtures/notes-cli` | clean up the notes storage layer so it is easier to maintain, without changing CLI behaviour | Tests pin CLI behaviour |

Answer keys: `tests/fixtures/PLANTED-<fixture>.md`. They are never copied into a trial.

### Extra runs
- **R3 A/B:** re-run T1 with the main session on **Sonnet** (`--model sonnet`); compare with the Opus run.
- **Portability:** re-run one trial **without the maintainer's global `~/.claude/CLAUDE.md`**. Method (researched 2026-09-29): pass `--setting-sources project,local` as an extra flag to `tests/run-trial.sh`. This leaves the real file untouched.

## Protocol (every run)
1. Build a fresh copy with `tests/setup-trial.sh <fixture> <dir>`: copy it, `git init`, make a baseline commit, then apply the fixture's `dirty.patch` if it has one.
2. **Loop run:** `claude -p "/loop-review <goal>; confirm=yes; do not add dependencies" --model opus --permission-mode acceptEdits`, with the same Bash allowlist as M1 (`npm test`, `node --test`, read-only git).
3. **Plain run:** a fresh copy, `claude -p "<goal>. Do not commit or add dependencies." --model opus`, with the same permissions.
4. Record the cost, the time and the diff size, and keep the report plus `changes.patch` in `tests/trials/m3-<trial>-<loop|plain>/`.
5. **Score by running, not by reading the report:** run the tests, check each answer-key row against the final code, and confirm the dirty file and git history are untouched.

## Budget
| Item | Estimate |
|---|---|
| 3 loop runs | ~$10–12, ~30–45 min |
| 3 plain runs | ~$2–3, ~10 min |
| Sonnet A/B | ~$1–2 |
| Portability run | ~$3–4 |
| **Total** | **~$16–21, about 1–1.5 h of runs** |

I stop for the maintainer's review after each trial.
