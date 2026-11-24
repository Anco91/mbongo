#!/usr/bin/env bash
set -eu

error() {
  printf '%s\n' "$*" >&2
}

root=$PWD
sub_spec=''
while [ "$#" -gt 0 ]; do
  case "$1" in
    --root)
      [ "$#" -ge 2 ] || {
        error "usage: test-lock.sh <sub-spec.md> [--root <dir>]"
        exit 1
      }
      root=$2
      shift 2
      ;;
    -*)
      error "usage: test-lock.sh <sub-spec.md> [--root <dir>]"
      exit 1
      ;;
    *)
      [ -z "$sub_spec" ] || {
        error "usage: test-lock.sh <sub-spec.md> [--root <dir>]"
        exit 1
      }
      sub_spec=$1
      shift
      ;;
  esac
done

[ -n "$sub_spec" ] || {
  error "sub-spec path is required"
  exit 1
}
[ -d "$root" ] || {
  error "project root does not exist: $root"
  exit 1
}
root=$(CDPATH='' cd -- "$root" && pwd -P)
cd "$root"
[ -f "$sub_spec" ] || {
  error "sub-spec does not exist: $sub_spec"
  exit 1
}

metadata=$(awk '
  NR == 1 && $0 == "---" { front = 1; print "F"; next }
  front && $0 == "---" { exit }
  front && /^locked_at:[[:space:]]*/ {
    value = $0
    sub(/^locked_at:[[:space:]]*/, "", value)
    sub(/^[[:space:]]+/, "", value)
    sub(/[[:space:]]+$/, "", value)
    print "A|" value
    next
  }
  front && /^locked_tests:[[:space:]]*/ {
    value = $0
    sub(/^locked_tests:[[:space:]]*/, "", value)
    sub(/^[[:space:]]+/, "", value)
    sub(/[[:space:]]+$/, "", value)
    print "K"
    if (value == "[]") print "E"
    else if (value == "") list_mode = 1
    else print "X"
    next
  }
  front && list_mode && /^  -[[:space:]]*/ {
    value = $0
    sub(/^  -[[:space:]]*/, "", value)
    sub(/[[:space:]]+$/, "", value)
    if (value == "") print "X"
    else print "P|" value
    next
  }
  front && list_mode && /^[[:space:]]*$/ { next }
  front && list_mode { list_mode = 0 }
' "$sub_spec")

front_matter=0
has_locked_tests=0
empty_list=0
invalid_list=0
locked_at=''
locked_paths=()
while IFS='|' read -r key value; do
  case "$key" in
    F) front_matter=1 ;;
    A) locked_at=$value ;;
    K) has_locked_tests=1 ;;
    E) empty_list=1 ;;
    X) invalid_list=1 ;;
    P) locked_paths[${#locked_paths[@]}]=$value ;;
  esac
done <<< "$metadata"

[ "$front_matter" -eq 1 ] || {
  error "sub-spec has no front matter or locked_tests key"
  exit 1
}
[ "$has_locked_tests" -eq 1 ] || {
  error "front matter has no locked_tests key"
  exit 1
}
if [ "$empty_list" -eq 1 ]; then
  printf 'no locked tests\n'
  exit 0
fi
if [ "$invalid_list" -ne 0 ] || [ "${#locked_paths[@]}" -eq 0 ]; then
  error "locked_tests must be [] or a list of paths"
  exit 1
fi
[ -n "$locked_at" ] || {
  error "locked_at must reference a commit"
  exit 1
}
commit=$(git rev-parse --verify "$locked_at^{commit}" 2>/dev/null) || {
  error "locked_at must reference a commit"
  exit 1
}

failed=0
for path in "${locked_paths[@]}"; do
  case "$path" in
    /*|..|../*|*/..|*/../*)
      error "$path"
      failed=1
      continue
      ;;
  esac
  if [ ! -f "$path" ]; then
    error "$path"
    failed=1
    continue
  fi
  if ! git cat-file -e "$commit:$path" 2>/dev/null; then
    error "$path"
    failed=1
    continue
  fi
  if ! git diff --quiet "$commit" -- "$path"; then
    error "$path"
    failed=1
  fi
done

exit "$failed"
