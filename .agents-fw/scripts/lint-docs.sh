#!/usr/bin/env bash
set -eu

error() {
  printf '%s\n' "$*" >&2
}

script_dir=$(CDPATH='' cd -- "$(dirname "$0")" && pwd -P)
root=$PWD
framework_dir="$script_dir/.."
custom_framework_dir=0
while [ "$#" -gt 0 ]; do
  case "$1" in
    --root)
      [ "$#" -ge 2 ] || {
        error "usage: lint-docs.sh [framework-dir] [--root <dir>]"
        exit 1
      }
      root=$2
      shift 2
      ;;
    -*)
      error "usage: lint-docs.sh [framework-dir] [--root <dir>]"
      exit 1
      ;;
    *)
      [ "$custom_framework_dir" -eq 0 ] || {
        error "usage: lint-docs.sh [framework-dir] [--root <dir>]"
        exit 1
      }
      framework_dir=$1
      custom_framework_dir=1
      shift
      ;;
  esac
done
[ -d "$root" ] || {
  error "project root does not exist: $root"
  exit 1
}
root=$(CDPATH='' cd -- "$root" && pwd -P)
cd "$root"
[ -d "$framework_dir" ] || {
  error "framework directory does not exist: $framework_dir"
  exit 1
}
framework_dir=$(CDPATH='' cd -- "$framework_dir" && pwd -P)

failed=0
check_budget() {
  file=$1
  limit=$2
  lines=$(awk 'END { print NR }' "$file")
  if [ "$lines" -gt "$limit" ]; then
    error "line budget exceeded: $file ($lines > $limit)"
    failed=1
  fi
}

core_file="$framework_dir/core.md"
if [ -f "$core_file" ]; then
  check_budget "$core_file" 120
else
  error "missing framework file: $core_file"
  failed=1
fi

for section in rules standards; do
  for markdown_file in "$framework_dir/$section"/*.md; do
    [ -f "$markdown_file" ] || continue
    check_budget "$markdown_file" 200
  done
done
for markdown_file in "$framework_dir/procedures"/*.md; do
  [ -f "$markdown_file" ] || continue
  check_budget "$markdown_file" 80
done

rule_ids=''
for section in rules standards; do
  for markdown_file in "$framework_dir/$section"/*.md; do
    [ -f "$markdown_file" ] || continue
    defined_ids=$(awk '
      /^- \*\*[A-Z]+-[0-9]+ (MUST|SHOULD|MAY)\*\*/ {
        value = $0
        sub(/^- \*\*/, "", value)
        sub(/ .*/, "", value)
        print value
      }
    ' "$markdown_file")
    [ -n "$defined_ids" ] && rule_ids="${rule_ids}${defined_ids}
"
  done
done
duplicate_ids=$(printf '%s' "$rule_ids" | LC_ALL=C sort | uniq -d)
while IFS= read -r duplicate_id; do
  [ -n "$duplicate_id" ] || continue
  error "duplicate rule ID: $duplicate_id"
  failed=1
done <<< "$duplicate_ids"

markdown_files=$(find "$framework_dir" -type f -name '*.md' -print 2>/dev/null | LC_ALL=C sort)
while IFS= read -r markdown_file; do
  [ -n "$markdown_file" ] || continue
  links=$(awk '
    function without_inline_code(line, output, position, character, run) {
      output = ""
      position = 1
      while (position <= length(line)) {
        character = substr(line, position, 1)
        if (character == "`") {
          run = 1
          while (substr(line, position + run, 1) == "`") run++
          if (inline_ticks == 0) {
            inline_ticks = run
          } else if (inline_ticks == run) {
            inline_ticks = 0
          }
          position += run
        } else {
          if (inline_ticks == 0) output = output character
          position++
        }
      }
      return output
    }
    function without_comments(line, open, close_pos, remainder) {
      while (1) {
        if (in_comment) {
          close_pos = index(line, "-->")
          if (!close_pos) return ""
          line = substr(line, close_pos + 3)
          in_comment = 0
        }
        open = index(line, "<!--")
        if (!open) return line
        close_pos = index(substr(line, open + 4), "-->")
        if (close_pos) {
          remainder = substr(line, open + 4 + close_pos + 2)
          line = substr(line, 1, open - 1) remainder
        } else {
          in_comment = 1
          return substr(line, 1, open - 1)
        }
      }
    }
    {
      fence_candidate = $0
      sub(/^[[:space:]]*/, "", fence_candidate)
      if (substr(fence_candidate, 1, 3) == "```") {
        in_fence = !in_fence
        next
      }
      if (in_fence) next
      remainder = without_inline_code($0)
      remainder = without_comments(remainder)
      while (match(remainder, /\]\([^)]*\)/)) {
        link = substr(remainder, RSTART + 2, RLENGTH - 3)
        print FILENAME "\t" link
        remainder = substr(remainder, RSTART + RLENGTH)
      }
    }
  ' "$markdown_file")
  while IFS="$(printf '\t')" read -r link_source link_target; do
    [ -n "$link_target" ] || continue
    case "$link_target" in
      http://*|https://*|mailto:*|\#*) continue ;;
    esac
    link_path=${link_target%%#*}
    [ -n "$link_path" ] || continue
    link_directory=$(dirname "$link_source")
    [ -e "$link_directory/$link_path" ] || {
      error "broken Markdown link: $link_source -> $link_target"
      failed=1
    }
  done <<< "$links"
done <<< "$markdown_files"

template="$framework_dir/templates/HANDOFF.md"
procedure="$framework_dir/procedures/handoff.md"
if [ -f "$template" ] && [ -f "$procedure" ]; then
  extract_next_session() {
    awk '
      /^```/ {
        if (!inside) {
          inside = 1
          block = $0
          next
        }
        block = block "\n" $0
        if (has_next) {
          print block
          exit
        }
        inside = 0
        block = ""
        has_next = 0
        next
      }
      inside {
        block = block "\n" $0
        if ($0 == "NEXT SESSION") has_next = 1
      }
    ' "$1"
  }
  template_block=$(extract_next_session "$template")
  procedure_block=$(extract_next_session "$procedure")
  if [ -z "$template_block" ] || [ "$template_block" != "$procedure_block" ]; then
    error "NEXT SESSION block differs between HANDOFF.md and handoff.md"
    failed=1
  fi
elif [ ! -f "$procedure" ]; then
  error "warning: procedures/handoff.md is absent; NEXT SESSION check skipped"
else
  error "missing handoff template: $template"
  failed=1
fi

exit "$failed"
