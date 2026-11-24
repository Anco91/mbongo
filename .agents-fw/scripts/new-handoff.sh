#!/usr/bin/env bash
set -eu

script_dir=$(CDPATH='' cd -- "$(dirname "$0")" && pwd -P)

error() {
  printf '%s\n' "$*" >&2
}

root=$PWD
sub_spec=''
while [ "$#" -gt 0 ]; do
  case "$1" in
    --root)
      [ "$#" -ge 2 ] || {
        error "usage: new-handoff.sh <sub-spec.md> [--root <dir>]"
        exit 1
      }
      root=$2
      shift 2
      ;;
    -*)
      error "usage: new-handoff.sh <sub-spec.md> [--root <dir>]"
      exit 1
      ;;
    *)
      [ -z "$sub_spec" ] || {
        error "usage: new-handoff.sh <sub-spec.md> [--root <dir>]"
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
home_path=''
if [ -d "${HOME:-}" ]; then
  home_path=$(CDPATH='' cd -- "$HOME" && pwd -P)
fi
if [ "$root" = '/' ] || { [ -n "$home_path" ] && [ "$root" = "$home_path" ]; }; then
  error "refusing unsafe project root: $root"
  exit 1
fi
cd "$root"
[ -f "$sub_spec" ] || {
  error "sub-spec does not exist: $sub_spec"
  exit 1
}

id=$(awk '
  NR == 1 && $0 == "---" { front = 1; next }
  front && $0 == "---" { exit }
  front && /^id:[[:space:]]*/ {
    sub(/^id:[[:space:]]*/, "")
    sub(/[[:space:]]+$/, "")
    print
    exit
  }
' "$sub_spec")
if [ -z "$id" ]; then
  id=${sub_spec##*/}
  id=${id%.md}
fi
case "$id" in
  ''|*[!A-Za-z0-9._-]*)
    error "sub-spec id contains unsupported characters"
    exit 1
    ;;
esac

template="$script_dir/../templates/HANDOFF.md"
if [ ! -f "$template" ] || [ ! -r "$template" ]; then
  error "handoff template is missing or unreadable"
  exit 1
fi
if [ -L "$root/docs" ] || [ -L "$root/docs/handoffs" ]; then
  error "refusing symlinked handoff directory"
  exit 1
fi
mkdir -p docs/handoffs 2>/dev/null || {
  error "cannot create docs/handoffs"
  exit 1
}

timestamp=$(date +%Y%m%d-%H%M)
base_name="$timestamp-$id"
created="docs/handoffs/$base_name.md"
suffix=2
while [ -e "$created" ] || [ -L "$created" ]; do
  created="docs/handoffs/$base_name-$suffix.md"
  suffix=$((suffix + 1))
done
temporary_file="$created.tmp.$$"
handoff_date=$(date '+%Y-%m-%d %H:%M')
if ! ID="$id" DATE="$handoff_date" SUB_SPEC="$sub_spec" PATH_VALUE="$created" awk '
  function replace_all(text, marker, value, result, position) {
    result = ""
    while ((position = index(text, marker)) > 0) {
      result = result substr(text, 1, position - 1) value
      text = substr(text, position + length(marker))
    }
    return result text
  }
  {
    line = replace_all($0, "{{ID}}", ENVIRON["ID"])
    line = replace_all(line, "{{DATE}}", ENVIRON["DATE"])
    line = replace_all(line, "{{SUB_SPEC}}", ENVIRON["SUB_SPEC"])
    line = replace_all(line, "{{PATH}}", ENVIRON["PATH_VALUE"])
    print line
  }
' "$template" >"$temporary_file"; then
  rm -f "$temporary_file"
  error "cannot render handoff template"
  exit 1
fi
mv "$temporary_file" "$created" 2>/dev/null || {
  rm -f "$temporary_file"
  error "cannot create handoff: $created"
  exit 1
}
printf '%s\n' "$created"
