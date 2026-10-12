#!/usr/bin/env bash
# Run one trial headlessly in a fresh trial repo and save the evidence.
# Usage: [MODEL=sonnet] [BROWSER=1] tests/run-trial.sh <loop|plain> <fixture> <goal> <work-dir> [extra claude flags...]
#   BROWSER=1  give the session a pinned, headless Playwright MCP server; screenshots go to <work-dir>/shots
# Writes <work-dir>/{repo/, result.json, report.md, changes.patch}.
set -euo pipefail

mode="$1"; fixture="$2"; goal="$3"; work="$4"; shift 4
here="$(cd "$(dirname "$0")" && pwd)"
repo="$work/repo"

case "$mode" in
  loop)  "$here/setup-trial.sh" "$fixture" "$repo" >/dev/null
         prompt="/loop-review $goal; confirm=yes; do not add dependencies" ;;
  plain) "$here/setup-trial.sh" --plain "$fixture" "$repo" >/dev/null
         prompt="$goal. Do not commit or add dependencies." ;;
  *) echo "mode must be loop or plain" >&2; exit 2 ;;
esac

# Same permissions for both modes: edits, tests, ad-hoc node probes (R7, from M3 T2) and read-only git.
allowed="Read Edit Write Glob Grep Agent Bash(npm test*) Bash(node *) Bash(git status*) Bash(git diff*) Bash(git log*) Bash(git rev-parse*)"

# M2: rendered evidence. Auto-named screenshots go to --output-dir, outside the repo.
browser_flags=()
if [ "${BROWSER:-0}" = 1 ]; then
  mkdir -p "$work/shots"
  cat > "$work/mcp.json" <<JSON
{"mcpServers":{"playwright":{"command":"npx","args":["-y","@playwright/mcp@0.0.83","--headless","--isolated","--output-dir","$work/shots"]}}}
JSON
  browser_flags=(--mcp-config "$work/mcp.json" --strict-mcp-config)
  allowed="$allowed mcp__playwright__* Bash(python3 -m http.server*) Bash(pkill -f http.server*)"
fi

cd "$repo"
start=$(date +%s)
claude -p "$prompt" --model "${MODEL:-opus}" --permission-mode acceptEdits \
  --allowedTools "$allowed" --output-format json ${browser_flags[@]+"${browser_flags[@]}"} "$@" > "$work/result.json" || true
end=$(date +%s)
pkill -f "http.server.*$repo" 2>/dev/null || true  # in case the session left its server running

python3 - "$work" "$((end - start))" <<'EOF'
import json, sys, pathlib
work, secs = pathlib.Path(sys.argv[1]), sys.argv[2]
try:
    d = json.loads((work / "result.json").read_text())
except ValueError:
    d = {"result": "(run failed: result.json is not valid JSON)"}
(work / "report.md").write_text(d.get("result") or "(no result)")
print(f"cost ${d.get('total_cost_usd', 0):.2f} · {int(secs)//60} min {int(secs)%60} s · turns {d.get('num_turns')}")
EOF
git status --short
git add -A -N  # include new files in the patch (throwaway repo)
git diff > "$work/changes.patch"
