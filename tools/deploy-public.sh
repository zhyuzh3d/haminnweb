#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PUBLIC_ROOT="$ROOT/public"
EXPECTED_REMOTE="git@github.com:zhyuzh3d/haminnweb.git"
SESSION_NAME="${MUTAGEN_SESSION_NAME:-haminnweb-public-sync}"
REMOTE="${HAMINNWEB_REMOTE:-rainyun-airen}"
REMOTE_DIR="${HAMINNWEB_REMOTE_DIR:-/var/www/haminn}"
BASE_URL="${HAMINNWEB_PUBLIC_URL:-https://haminn.airen.life}"
MODE=publish
case "${1:-}" in
  --check|--pause)
    [[ "$#" -eq 1 ]] || { printf 'ERROR: %s does not accept public paths\n' "$1" >&2; exit 1; }
    MODE="${1#--}"
    ;;
esac

die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
command -v mutagen >/dev/null 2>&1 || die "missing command: mutagen"
command -v curl >/dev/null 2>&1 || die "missing command: curl"

[[ "$(git -C "$ROOT" rev-parse --show-toplevel)" == "$ROOT" ]] || die "unexpected Git root"
[[ "$(git -C "$ROOT" remote get-url origin)" == "$EXPECTED_REMOTE" ]] || die "unexpected Git remote"

session="$(mutagen sync list --template '{{range .}}{{.Name}}|{{.Alpha.Protocol}}|{{.Alpha.Host}}|{{.Alpha.Path}}|{{.Beta.Protocol}}|{{.Beta.Host}}|{{.Beta.Path}}{{"\n"}}{{end}}' | awk -F '|' -v name="$SESSION_NAME" '$1 == name { print; exit }')"
[[ -n "$session" ]] || die "missing Mutagen session: $SESSION_NAME; run tools/setup-mutagen-sync.sh once"
IFS='|' read -r _ alpha_protocol alpha_host alpha_path beta_protocol beta_host beta_path <<< "$session"
[[ "$alpha_protocol" == "Local" && "$alpha_path" == "$PUBLIC_ROOT" ]] || die "Mutagen Alpha is not this repository's public directory"
[[ "$beta_protocol" == "SSH" && "$beta_host" == "$REMOTE" && "$beta_path" == "$REMOTE_DIR" ]] || die "unexpected Mutagen Beta"

if [[ "$MODE" == "publish" ]]; then
  for requested in "$@"; do
    relative="${requested#public/}"
    [[ "$relative" =~ ^[A-Za-z0-9._/-]+$ && "$relative" != /* && "$relative" != *../* ]] || die "unsafe public path: $requested"
    [[ -f "$PUBLIC_ROOT/$relative" ]] || die "not a public file: $requested"
  done
fi

details="$(mutagen sync list "$SESSION_NAME" --long)"
grep -q 'Synchronization mode: One Way Replica' <<< "$details" || die "Mutagen session is not one-way replica"

if [[ "$MODE" == "check" ]]; then
  status="$(sed -n 's/^Status: //p' <<< "$details" | tail -n 1)"
  printf 'Validated %s (%s): %s -> %s:%s\n' "$SESSION_NAME" "${status:-unknown}" "$PUBLIC_ROOT" "$REMOTE" "$REMOTE_DIR"
  exit 0
fi

if [[ "$MODE" == "pause" ]]; then
  [[ "$(grep -c 'Connected: Yes' <<< "$details")" -eq 2 ]] || die "Mutagen session is not connected at both endpoints"
  mutagen sync pause "$SESSION_NAME"
  printf 'Paused %s. Finish and check the complete public change before publishing.\n' "$SESSION_NAME"
  exit 0
fi

if grep -q 'Status: Paused' <<< "$details"; then
  mutagen sync resume "$SESSION_NAME"
else
  [[ "$(grep -c 'Connected: Yes' <<< "$details")" -eq 2 ]] || die "Mutagen session is not connected at both endpoints"
fi
mutagen sync flush "$SESSION_NAME"
details="$(mutagen sync list "$SESSION_NAME" --long)"
[[ "$(grep -c 'Connected: Yes' <<< "$details")" -eq 2 ]] || die "Mutagen session is not connected at both endpoints"
grep -q 'Status: Watching for changes' <<< "$details" || die "Mutagen session did not return to watching state"

if [[ "$#" -eq 0 ]]; then
  printf 'Published public/ through %s. No URL content checks requested.\n' "$SESSION_NAME"
  exit 0
fi

temp_dir="$(mktemp -d)"
trap 'find "$temp_dir" -depth -delete' EXIT HUP INT TERM
for requested in "$@"; do
  relative="${requested#public/}"
  local_file="$PUBLIC_ROOT/$relative"
  downloaded="$temp_dir/$(printf '%s' "$relative" | tr '/' '_')"
  curl --silent --show-error --fail --max-time 30 --header 'Cache-Control: no-cache' "$BASE_URL/$relative" --output "$downloaded"
  cmp -s "$local_file" "$downloaded" || die "deployed bytes differ: $relative"
  printf 'Verified %s/%s\n' "$BASE_URL" "$relative"
done
