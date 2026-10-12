## /loop-review report

**Goal:** clean up the notes storage layer so it is easier to maintain, without changing CLI behaviour
**Scope:** `src/store.js`, `src/commands.js` (+ `test/cli.test.js` for regression tests)
**Constraints honoured:** no dependencies added (`package.json` untouched); no CLI behaviour change except one deliberate defect fix, called out below
**Rounds:** 2 of 2, stopped because: **Cap**

### Baseline
- Revision `17db1b3`, working tree **clean** → no baseline-dirty files, nothing off-limits.
- Checks: `npm test` (`node --test`) → **3 pass / 0 fail**.
- No `CLAUDE.md`/`AGENTS.md` in this repo — flagged at the start, not written (outside the requested scope).

### Changes
- **`src/store.js`** — now owns the notes file path and every read and write. One per-call resolver `notesFile()` (`NOTES_FILE` → `process.cwd()/notes.json`); `readNotes()` (throws on a missing file), `readNotesOrEmpty()` (tolerant), `writeNotes()`, and `searchNotes()` returning note objects instead of display strings. Removed the import of `commands.js`, the never-invalidated module cache, and the unused `migrateV1`. (T-1/B-1/A-2, T-2/B-2/A-1, T-4/B-3/A-3, B-4/A-5, round-2 A-2/B-1/T-1)
- **`src/commands.js`** — no `fs`/`path` imports and no file access left; all four handlers go through `store.js`. `search()` now applies the unchanged `formatNote` itself, which is what breaks the cycle. (T-1/B-1/A-2, B-2)
- **`test/cli.test.js`** — five tests added: default-path agreement between `add` and `search`, same-process `searchNotes` freshness, per-call path resolution, no-match search, removing an absent id. (T-2, T-4, T-5, round-2 T-1)

**One deliberate behaviour change.** With `NOTES_FILE` unset, `search` read `<package>/notes.json` while `add`/`list`/`remove` used `./notes.json`. Reproduced before the fix: `notes add buy milk` then `notes search milk` printed `No notes match "milk".` while `list` showed the note. Consolidating onto the cwd path — what `README.md:12` documents and 3 of 4 commands already did — fixes that; `search` now prints `#1 buy milk`. I treated this as a defect fix rather than a semantics change, because the goal's own requirement (one storage module) cannot be met while two contradictory paths exist. If you'd rather keep the old `search` path, say so and I'll invert it.

### Verification
- `npm test` → **8 pass / 0 fail** (from 3 pass / 0 fail).
- The new tests are not self-fulfilling. Run against an exact copy of the committed baseline source: **5 pass / 2 fail** — both new behaviour tests red before, green after. Run against a frozen-path variant of the refactored store: **7 pass / 1 fail**, so the per-call-resolution test genuinely catches the freeze.
- Byte-identical output harness: 13 command/state combinations (missing file, empty array, no match, match, absent id, present id, malformed JSON, unknown command) run against the baseline copy and the working tree, comparing stdout, error line and exit code — **0 mismatches of 13**. This is where A-1's "undeclared `remove`/`search` change" hypothesis was disproven, and where T-3's malformed-JSON crash was confirmed pre-existing and unchanged.
- One stderr difference I did not eliminate: `list` on a missing file still throws the same `ENOENT`, same message, exit 1 — but the stack trace now carries one extra frame (`readNotes` in `store.js`). Unavoidable once the read moves; stdout and exit code are unchanged.
- **Not seen by any reviewer:** the final `notesFile()` edit and the `store reads the notes file named at call time` test were written after round 2's briefs. Three reviewers proposed that change, but no reviewer read the resulting code. Both are covered by the checks above.

### Per round
- **Round 1** — all four reviewers ran (design-critic correctly reported nothing in remit: no GUI). 5 accepted, 2 rejected, 1 asked, 2 backlogged.
- **Round 2** — all four reviewers ran (design-critic again no findings, having verified the output strings). 1 accepted, 3 rejected, 1 asked, 1 deferred to remaining issues.

### Remaining issues
- `readNotes` is the surprising reader (it throws) but has the shorter, more inviting name; `readNotesStrict` would make the deliberate asymmetry legible (A-3). Low severity and zero behaviour change, but it's a final-round edit nothing would review, so I left it.
- `writeNotes` is non-atomic and won't create a missing parent directory — unchanged from baseline, verified by the comparison harness, not a regression.

### Needs your decision
- **`list` on a missing notes file crashes** with an `ENOENT` stack trace and exit 1 instead of printing `No notes yet.` — reproduced directly, and identical on baseline. It's a real defect, but fixing it changes output your constraint forbids, so I preserved it exactly. Want it fixed?
- **Malformed `notes.json` crashes all four commands** with a raw `SyntaxError` (verified identical to baseline, cases 11–12 of the harness). Same call: a clean error message would change output.

### Rejected suggestions
- *A test pinning the ENOENT crash* — would pin output I know is wrong; verified by before/after comparison instead.
- *A-1, `remove`/`search` reader divergence as an undeclared change* — disproven by running both versions; baseline `remove` and `search` were already tolerant of a missing file.
- *A-4, move `searchNotes` out of the storage layer* — the architect recommended no change itself; it would force an edit to the test pinning the cache fix for no present benefit.
- *B-2, TOCTOU between `existsSync` and `readNotes`* — matches baseline risk, meaningless for a single-user CLI.

### Feature backlog
- `add` derives `id` from `notes.length + 1`, so removing a note makes the next `add` reuse an existing id.
- `bin/notes.js:5` joins all extra args, so `notes remove 1 extra` silently ignores `extra`.
- Graceful handling of a missing or corrupt notes file (the two decisions above), if you want them as a feature rather than a defect fix.

Nothing was committed, pushed or installed, and nothing outside this repo was touched. `git diff` shows every change — three modified files, +80/−28. Scratch copies used for the baseline and frozen-path comparisons live in the session scratchpad, not in the repo.