#!/bin/sh
set -eu

check_node() {
  case "$1" in
    /*) ;;
    *) return 1 ;;
  esac
  [ -f "$1" ] && [ -x "$1" ] || return 1
  actual=$("$1" --version 2>/dev/null) || return 1
  [ "$actual" = "v$pin" ]
}

resolve_node() {
  pin=$(sed -n 's/^nodeVersion[[:blank:]]*=[[:blank:]]*\([0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\)[[:space:]]*$/\1/p' "$1/gradle.properties") || exit 1
  case "$pin" in
    ''|*[!0-9.]*)
      printf 'Cannot read the exact nodeVersion from %s/gradle.properties\n' "$1" >&2
      exit 1 ;;
  esac

  if [ -n "${INTERLIS_NODE:-}" ]; then
    actual=
    if check_node "$INTERLIS_NODE"; then
      printf '%s\n' "$INTERLIS_NODE"
      return
    fi
    printf 'INTERLIS_NODE=%s must be an absolute executable path to Node.js v%s (found %s).\n' \
      "$INTERLIS_NODE" "$pin" "${actual:-no usable executable}" >&2
    exit 1
  fi

  fnm_dir=${FNM_DIR:-"$HOME/Library/Application Support/fnm"}
  candidate="$fnm_dir/node-versions/v$pin/installation/bin/node"
  if check_node "$candidate"; then
    printf '%s\n' "$candidate"
    return
  fi
  candidate=$(command -v node || true)
  if check_node "$candidate"; then
    printf '%s\n' "$candidate"
    return
  fi

  printf 'Node.js v%s is required by the Core checkout. Run fnm install %s or set INTERLIS_NODE to its absolute executable path.\n' "$pin" "$pin" >&2
  exit 1
}

if [ "${1:-}" = --resolve-node ]; then
  resolve_node "$2"
else
  root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
  core=${INTERLIS_CORE_DIR:-"$root/../interlis-java"}
  if [ ! -f "$core/build/interlis/EditorBundleRun.java" ]; then
    printf 'Core checkout not found at %s. Set INTERLIS_CORE_DIR.\n' "$core" >&2
    exit 1
  fi
  INTERLIS_NODE=$(resolve_node "$core")
  export INTERLIS_NODE
  exec "$INTERLIS_NODE" "$root/scripts/prepare-dev.cjs"
fi
