#!/usr/bin/env bash
# Build a fresh, disposable trial repo from a fixture.
# Usage: tests/setup-trial.sh [--plain] <fixture> <target-dir>
#   --plain  omit the /loop-review skill and agents (for the plain-pass baseline)
set -euo pipefail

plain=0
if [ "${1:-}" = "--plain" ]; then plain=1; shift; fi
[ $# -eq 2 ] || { echo "Usage: $0 [--plain] <fixture> <target-dir>" >&2; exit 2; }

here="$(cd "$(dirname "$0")" && pwd)"
root="$(dirname "$here")"
fixture="$1"
target="$2"
src="$here/fixtures/$fixture"

[ -d "$src" ] || { echo "No such fixture: $src" >&2; exit 1; }
[ ! -e "$target" ] || { echo "Target already exists: $target" >&2; exit 1; }

mkdir -p "$target"
cp -R "$src/." "$target/"
if [ "$plain" -eq 0 ]; then
  mkdir -p "$target/.claude/skills" "$target/.claude/agents"
  cp -R "$root/.claude/skills/loop-review" "$target/.claude/skills/"
  cp "$root"/.claude/agents/loop-*.md "$target/.claude/agents/"
fi

cd "$target"
git init -q -b main
git add -A
git -c user.name=trial -c user.email=trial@example.invalid commit -qm "Fixture baseline"

# Pre-existing uncommitted work, applied after the baseline commit.
if [ -d "$here/fixtures/dirty/$fixture" ]; then
  cp -R "$here/fixtures/dirty/$fixture/." "$target/"
fi

echo "Trial repo ready: $target"
git status --short
