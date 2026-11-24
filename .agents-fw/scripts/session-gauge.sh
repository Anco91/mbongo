#!/usr/bin/env bash
# Counts tool calls for the current session and warns at the SES-2 threshold. Never blocks.
# usage: session-gauge.sh [--hook]   (--hook: read the hook JSON on stdin, answer in hook JSON)
set -eu

limit=${AGENTS_FW_TOOL_LIMIT:-40}
state_dir=${AGENTS_FW_STATE_DIR:-.agents-fw/.state}
hook=0
[ "${1:-}" = --hook ] && hook=1

session=default
if [ "$hook" -eq 1 ]; then
  input=$(cat)
  found=$(printf '%s' "$input" | sed -n 's/.*"session_id"[[:space:]]*:[[:space:]]*"\([A-Za-z0-9_-]*\)".*/\1/p' | head -n 1)
  [ -z "$found" ] || session=$found
fi

mkdir -p "$state_dir"
counter="$state_dir/calls-$session"
count=0
[ ! -f "$counter" ] || count=$(cat "$counter")
count=$((count + 1))
printf '%s\n' "$count" >"$counter"

[ "$count" -ge "$limit" ] || exit 0
message="HANDOFF NOW (SES-2): $count tool calls, limit $limit. Write the handoff and end with the NEXT SESSION block."
if [ "$hook" -eq 1 ]; then
  printf '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"%s"}}\n' "$message"
else
  printf '%s\n' "$message"
fi
