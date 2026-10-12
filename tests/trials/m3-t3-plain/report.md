Done. All filesystem access now lives in `src/store.js`; `commands.js` only orchestrates and formats.

**What changed**

`src/store.js` — the storage layer proper:
- One definition of where the notes file lives (`notesFile()`). Previously `store.js` and `commands.js` each had their own `FILE` constant that resolved to **different paths**.
- `readNotes()` / `writeNotes()` replace the read-parse-exists dance that was open-coded in three places.
- `findNotes()` returns note objects instead of pre-formatted strings.
- Removed the module-level `cache`, which never helped (one command per process) and would have served stale data if the store were ever reused after a write.
- Removed `migrateV1`, dead and unreferenced (recoverable from `af3a215` if the v1 format ever resurfaces).

`src/commands.js` — handlers only: `import fs`/`path` are gone, and `formatNote` stays here. This also broke the **circular import** (`store.js` imported `formatNote` from `commands.js`, which imported `searchNotes` back).

**One behaviour change, deliberate — please sanity-check this call**

The two `FILE` constants disagreed when `NOTES_FILE` was unset: `commands.js` used `cwd/notes.json` (what the README documents), `store.js` used `notes.json` next to the source. So `search` was reading a different, usually non-existent file — a plain `notes add milk; notes search milk` in any directory printed `No notes match "milk"`. Unifying the path was the whole point of the cleanup, so I fixed it rather than preserving a bug in two places. If you want a strictly zero-diff refactor, say so and I'll restore the split path.

**Verified by running, not reading.** I captured a behaviour baseline across 24 invocations (both `NOTES_FILE` set and unset — empty file, missing file, no-match search, unknown id, non-numeric id, no args, unknown command, empty text) before and after. The only non-timestamp difference in the whole transcript is that one `search` line. `npm test` stays 3/3.

Two pre-existing bugs I left alone, both now commented in place rather than silently fixed:
- `notes list` on a missing file dies with a raw `ENOENT` stack trace and exit 1, instead of the `No notes yet.` it has ready.
- Ids come from `notes.length + 1`, so they repeat after a removal — add, remove, add yields two notes both numbered `#2`, and `remove 2` then deletes both.

Both are real and worth fixing, but each changes output. Happy to do either, plus regression tests pinning the unified path, on your word. Nothing committed, no dependencies added.