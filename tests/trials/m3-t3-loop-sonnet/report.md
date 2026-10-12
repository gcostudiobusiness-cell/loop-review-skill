Circular import and dead code both confirmed gone. Definition of done is met (single source of truth, no deps added, tests pass) — stopping here at round 1 rather than spending round 2 on nothing.

## /loop-review report
**Goal:** clean up the notes storage layer so it is easier to maintain, without changing CLI behaviour
**Scope:** src/store.js, src/commands.js (+ test/cli.test.js for regression tests)
**Rounds:** 1 of 2 (max clamped from default), stopped because: Done — definition of done met, no confirmed in-scope findings of medium+ severity remain

### Baseline
- Revision `cdc99c3`, clean working tree
- Checks before: `npm test` → 3/3 pass
- No CLAUDE.md/AGENTS.md present in this repo — flagged, not blocking

### Changes
- **src/store.js**: now the single owner of the file path, load, save, and formatting. Unified the default path to `process.cwd()`-relative (matching what `add`/`list`/`remove` already used), removed the package-relative default that only `search` used, removed the never-invalidated `cache`, removed unused `migrateV1`, moved `formatNote` here to break the `store.js` ↔ `commands.js` circular import. (A-1, B-1, T-2, A-2, B-3, T-5, A-4, B-4)
- **src/commands.js**: `add`/`list`/`remove`/`search` now call `loadNotes()`/`saveNotes()` from `store.js` instead of each re-implementing `fs.existsSync`/`readFileSync`/`writeFileSync`/`JSON.parse`. Re-exports `formatNote` for `bin/notes.js` compatibility (no importer actually used it from there, but kept for safety). (B-2)
- **test/cli.test.js**: added two regression tests — `list` before any note exists (now reachable as `'No notes yet.'` instead of crashing with ENOENT, since the previously-unguarded read in `list()` is gone — A-3, T-4), and a pinning test for the current duplicate-id behavior after a `remove`, so a future refactor can't silently change it (T-3, A-5).

### Verification
- `npm test`: 5/5 pass (3 original tests unmodified and passing, 2 new). Before: 3/3.
- Manually verified (outside the test file, via direct `import` of `commands.js`) that with `NOTES_FILE` unset, `add` and `search` now agree on the same file — previously `search` silently missed notes `add` had just written, because the two modules resolved different default paths. This is a change from a silent-failure defect to correct behavior, not a change to the stated CLI contract.
- Confirmed no `dependencies` field exists/was touched in `package.json` — no dependencies added.
- Confirmed via grep: no remaining references to `migrateV1`, no remaining cross-import from `store.js` to `commands.js`.

### Per round
Round 1: all 4 reviewers ran (tester, builder, architect, design-critic). Accepted 6 (deduplicated to 6 root causes across 11 raw findings), Rejected 0, Asked 0 (one item resolved by declining the change — see below), Backlogged 2 (`--json` flag, usage-line-to-stderr).

### Remaining issues
- None blocking. The duplicate-id bug (`add` after a `remove` can reuse an id) is pre-existing, now pinned by a regression test, and intentionally left unfixed (see below).

### Needs your decision
- **Duplicate-id allocation** (`notes.length + 1` instead of `max(id)+1`): reproducible pre-existing bug — `add a; add b; remove 1; add c` yields two notes both with id `#2`, and `remove 2` then deletes both. Fixing it would change `add`'s printed output for that sequence, which is a CLI behavior change outside this goal's "without changing CLI behaviour" constraint. Left as-is and pinned by a new test; flagging in case you want it fixed as a separate, explicitly-scoped task.

### Rejected suggestions (with reasons)
- None outright rejected — all findings were either accepted or deferred to backlog/decision.

### Feature backlog
- `notes --json` output mode (builder's proposal) — not requested, no evidence of need, would be new CLI surface.
- Moving the usage/help line from stdout to stderr (architect's note) — unrelated pre-existing behavior, not part of the storage-layer goal.

Nothing was committed — `git diff` shows all three changed files (`src/store.js`, `src/commands.js`, `test/cli.test.js`).