# notes-cli

A tiny command-line notebook.

```
notes add buy milk      # Added #1 buy milk
notes list              # #1 buy milk
notes search milk       # #1 buy milk
notes remove 1          # Removed #1.
```

Notes are stored as JSON in `notes.json` in the current directory. Set `NOTES_FILE` to use another file.

Run the tests with `npm test`.
