# ADR-002: Rendered UI evidence and design references (M2)

- **Status:** Accepted, 2026-10-11, after two T2 trials (`tests/loop-review-m2-results.md`). Both follow-ups (the critic's design-references honesty, and the exact server start and stop forms) were confirmed by a re-run on 2026-10-12
- **Date:** 2026-10-11
- **Inputs:** roadmap M2; ADR-001 §3–§4; a comparison of Composio's cloud browser and a local Playwright MCP server; three probes run on 2026-10-11

## Decision
1. **The orchestrator drives the browser. The reviewers stay read-only.**
   - When the scope has a UI and a browser tool is available, the main session:
     - serves the page locally
     - takes one screenshot each at 375×812 and 1280×800
     - measures horizontal overflow, the first 10 Tab stops, the colours of key text, and console errors
   - Screenshot paths and measurements go into every reviewer brief.
   - The design critic reads the screenshots with its existing Read tool. **Verified:** a reviewer quoted text that is visible only in the image.
2. **Measurements are the evidence.** A UI fix counts as verified only with a rendered before-and-after. Otherwise it is reported as "source-verified only".
3. **The skill is tool-agnostic.** It names `mcp__playwright__*` as an example only. With no browser tool, it says "UI reviewed from source only" (unchanged from M1).
4. **Browser safety (hard rule 9):**
   - Open only the local server started for this run.
   - Never visit other sites or send data to a real backend.
   - Take screenshots **without a filename**: the Playwright MCP writes named files into the workspace (the repo under review); auto-named files go to `--output-dir`.
   - Stop the server before reporting.
5. **Design references:** the critic preloads `skills: [impeccable, ui-ux-pro-max]`. They are used as checklists, never as a mandate to restyle. The critic names which ones it had, and a missing skill is skipped.
6. **Trial harness:** `BROWSER=1 tests/run-trial.sh …` passes a pinned `@playwright/mcp@0.0.83` (headless, isolated, `--output-dir <work>/shots`) with `--strict-mcp-config`.

## Alternatives rejected
- **Composio `browser_tool`:** a cloud browser driven by an AI agent. It reaches only public HTTPS pages, so each round's code would have to be published, and its viewport and key handling are interpreted rather than exact.
- **Giving the design critic browser tools:** that breaks the read-only reviewer contract, and four reviewers could each drive their own browser.
- **`--allow-unrestricted-file-access`** (to allow named screenshots outside the repo): it widens what the browser may read.

## Consequences
- The skill needs `python3` to serve static pages. Pages that need a build or a backend fall back to source review.
- Interactive users will get permission prompts for the server and the browser tools unless they allow them.
- The cost is expected to rise. The M2 trials will measure it.
- **Known gap:** if a user's own Playwright config has no `--output-dir`, screenshots land in `.playwright-mcp/` inside their repo. The report lists such files (§8), but nothing removes them.
