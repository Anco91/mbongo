#!/usr/bin/env bash
set -eu

error() {
  printf '%s\n' "$*" >&2
}

root=$PWD
architecture_file=''
while [ "$#" -gt 0 ]; do
  case "$1" in
    --root)
      [ "$#" -ge 2 ] || {
        error "usage: arch-check.sh [ARCHITECTURE.md] [--root <dir>]"
        exit 1
      }
      root=$2
      shift 2
      ;;
    -*)
      error "usage: arch-check.sh [ARCHITECTURE.md] [--root <dir>]"
      exit 1
      ;;
    *)
      [ -z "$architecture_file" ] || {
        error "usage: arch-check.sh [ARCHITECTURE.md] [--root <dir>]"
        exit 1
      }
      architecture_file=$1
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
[ -n "$architecture_file" ] || architecture_file=./ARCHITECTURE.md
[ -f "$architecture_file" ] || {
  error "architecture file does not exist: $architecture_file"
  exit 1
}

paths=$(awk '
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
    line = without_comments($0)
    if (line == "## Declared folders") {
      section = "declared"
      next
    }
    if (line == "## Reuse registry") {
      section = "registry"
      next
    }
    if (line ~ /^## /) {
      section = ""
      next
    }
    if (section == "declared" && line ~ /^[ \t]*-[ \t]*`[^`]+\/`[ \t]*$/) {
      sub(/^[ \t]*-[ \t]*`/, "", line)
      sub(/`[ \t]*$/, "", line)
      print "D|" line
    }
    if (section == "registry" && line ~ /^\|[ \t]*`[^`]+`[ \t]*\|/) {
      sub(/^\|[ \t]*/, "", line)
      sub(/\|.*$/, "", line)
      sub(/^[ \t]*`/, "", line)
      sub(/`[ \t]*$/, "", line)
      print "R|" line
    }
  }
' "$architecture_file")

declared_folders=('')
registry_paths=('')
while IFS='|' read -r kind path; do
  case "$kind" in
    D) declared_folders[${#declared_folders[@]}]=$path ;;
    R) registry_paths[${#registry_paths[@]}]=$path ;;
  esac
done <<< "$paths"

failed=0
valid_repo_path() {
  case "$1" in
    ''|/*|..|../*|*/..|*/../*) return 1 ;;
  esac
  return 0
}

for registry_path in "${registry_paths[@]}"; do
  [ -n "$registry_path" ] || continue
  valid_repo_path "$registry_path" || {
    error "invalid registry path: $registry_path"
    failed=1
    continue
  }
  if [ "${registry_path%/}" != "$registry_path" ]; then
    [ -d "$registry_path" ] || {
      error "registry path does not exist: $registry_path"
      failed=1
    }
  else
    [ -e "$registry_path" ] || {
      error "registry path does not exist: $registry_path"
      failed=1
    }
  fi
done

is_test_file() {
  relative_file=$1
  filename=${relative_file##*/}
  case "$relative_file" in
    tests/*|*/tests/*|__tests__/*|*/__tests__/*) return 0 ;;
  esac
  case "$filename" in
    *.test.*|*.spec.*|test_*.py|*_test.py|.gitkeep|__init__.py) return 0 ;;
  esac
  return 1
}

is_registered() {
  relative_file=$1
  for registry_path in "${registry_paths[@]}"; do
    [ -n "$registry_path" ] || continue
    case "$registry_path" in
      */)
        case "$relative_file" in "$registry_path"*) return 0 ;; esac
        ;;
      *)
        [ "$relative_file" = "$registry_path" ] && return 0
        ;;
    esac
  done
  return 1
}

for folder in "${declared_folders[@]}"; do
  [ -n "$folder" ] || continue
  valid_repo_path "$folder" || {
    error "invalid declared folder: $folder"
    failed=1
    continue
  }
  folder_path=${folder%/}
  [ -d "$folder_path" ] || {
    error "declared folder does not exist: $folder"
    failed=1
    continue
  }
  while IFS= read -r file_path; do
    relative_file=${file_path#"$root"/}
    is_test_file "$relative_file" && continue
    is_registered "$relative_file" || {
      error "unregistered file: $relative_file"
      failed=1
    }
  done < <(find "$folder_path" -type f -print 2>/dev/null)
done

exit "$failed"
