#!/usr/bin/env bash
# Starts each next session headless from the latest handoff's NEXT SESSION block (SES-9).
# usage: relay.sh [--root <dir>] [--max <n>]   host command: AGENTS_FW_RELAY_CMD (prompt on stdin)
# exit: 0 finished or gated, 2 usage/no block, 3 no new handoff, 4 --max reached, 5 command failed
set -eu

error() {
  printf '%s\n' "$*" >&2
}

root=$PWD
max=10
while [ "$#" -gt 0 ]; do
  case "$1" in
    --root)
      [ "$#" -ge 2 ] || { error "usage: relay.sh [--root <dir>] [--max <n>]"; exit 2; }
      root=$2
      shift 2
      ;;
    --max)
      [ "$#" -ge 2 ] || { error "usage: relay.sh [--root <dir>] [--max <n>]"; exit 2; }
      max=$2
      shift 2
      ;;
    *)
      error "usage: relay.sh [--root <dir>] [--max <n>]"
      exit 2
      ;;
  esac
done
case "$max" in
  ''|*[!0-9]*) error "--max must be a number"; exit 2 ;;
esac
[ -n "${AGENTS_FW_RELAY_CMD:-}" ] || {
  error "AGENTS_FW_RELAY_CMD is required: the host command that reads the prompt on stdin"
  exit 2
}
[ -d "$root" ] || { error "project root does not exist: $root"; exit 2; }
cd "$root"

latest_handoff() {
  find docs/handoffs -maxdepth 1 -type f -name '*.md' 2>/dev/null | LC_ALL=C sort | tail -n 1
}

resume_block() {
  awk '
    $0 == "NEXT SESSION" { found = 1 }
    found && /^```/ { exit }
    found { print }
  ' "$1"
}

signature() {
  printf '%s %s\n' "$1" "$(cksum <"$1")"
}

all_rows_done() {
  [ -f specs/SPEC_MASTER.md ] || return 1
  awk -F'|' '
    $2 ~ /^[[:space:]]*[0-9]+[[:space:]]*$/ {
      rows++
      status = $5
      gsub(/[[:space:]]/, "", status)
      if (status != "done") open++
    }
    END { exit !(rows > 0 && open == 0) }
  ' specs/SPEC_MASTER.md
}

iteration=0
previous=''
while :; do
  if [ -e .agents-fw/STOP ]; then
    printf 'relay: stopped by .agents-fw/STOP\n'
    exit 0
  fi
  if all_rows_done; then
    printf 'relay: every master row is done\n'
    exit 0
  fi
  handoff=$(latest_handoff)
  [ -n "$handoff" ] || { error "relay: no handoff in docs/handoffs"; exit 2; }
  block=$(resume_block "$handoff")
  [ -n "$block" ] || { error "relay: no NEXT SESSION block in $handoff"; exit 2; }
  stop_line=$(printf '%s\n' "$block" | sed -n 's/^Stop:[[:space:]]*//p' | head -n 1)
  case "$stop_line" in
    done*)
      printf 'relay: finished (Stop: done in %s)\n' "$handoff"
      exit 0
      ;;
    human-gate*)
      printf 'relay: waiting for the human (Stop: %s in %s)\n' "$stop_line" "$handoff"
      exit 0
      ;;
  esac
  current=$(signature "$handoff")
  if [ "$current" = "$previous" ]; then
    error "relay: the last session wrote no new handoff ($handoff); stopping"
    exit 3
  fi
  if [ "$iteration" -ge "$max" ]; then
    error "relay: --max $max reached; last handoff $handoff"
    exit 4
  fi
  iteration=$((iteration + 1))
  printf 'relay: session %s from %s\n' "$iteration" "$handoff"
  prompt=$(printf 'Autonomous relay session %s. Follow AGENTS.md. Never ask the human to choose (AUTO-1); stop only at a GIT-7 gate.\nEnd by writing the handoff with a filled NEXT SESSION block and its Stop: line.\n\n%s\n' "$iteration" "$block")
  previous=$current
  if ! printf '%s\n' "$prompt" | AGENTS_FW_RELAY_ITERATION=$iteration sh -c "$AGENTS_FW_RELAY_CMD"; then
    error "relay: the host command failed in session $iteration"
    exit 5
  fi
done
