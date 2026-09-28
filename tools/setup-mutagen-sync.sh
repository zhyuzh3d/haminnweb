#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PUBLIC_ROOT="$ROOT/public"
MUTAGEN_BIN="${MUTAGEN_BIN:-mutagen}"
SSH_BIN="${SSH_BIN:-ssh}"
REMOTE="${HAMINNWEB_REMOTE:-rainyun-airen}"
REMOTE_DIR="${HAMINNWEB_REMOTE_DIR:-/var/www/haminn}"
EXPECTED_HOST="${HAMINNWEB_EXPECTED_HOST:-61.111.253.79}"
SESSION_NAME="${MUTAGEN_SESSION_NAME:-haminnweb-public-sync}"
SYNC_IGNORES=(
  '.DS_Store'
  '._*'
  '.cache'
  '.temp'
  '.tmp'
  'cache'
  'logs'
  'temp'
  'tmp'
  '*.bak'
  '*.backup'
  '*.cache'
  '*.crdownload'
  '*.download'
  '*.log'
  'log.txt'
  '*.part'
  '*.swp'
  '*.swo'
  '*.temp'
  '*.tmp'
  '*~'
)

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >&2
}

die() {
  log "ERROR: $*"
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "missing command: $1"
}

require_cmd "$MUTAGEN_BIN"
require_cmd "$SSH_BIN"

[[ -d "$PUBLIC_ROOT" ]] || die "missing public root: $PUBLIC_ROOT"
[[ "${REMOTE_DIR%/}" == "/var/www/haminn" ]] || die "refusing unexpected remote directory: $REMOTE_DIR"

resolved_host="$($SSH_BIN -G "$REMOTE" 2>/dev/null | awk '/^hostname / { print $2; exit }')"
[[ "$resolved_host" == "$EXPECTED_HOST" ]] || die "SSH target $REMOTE resolves to $resolved_host, expected $EXPECTED_HOST"

log "checking SSH connectivity: $REMOTE ($resolved_host)"
"$SSH_BIN" -o BatchMode=yes -o ConnectTimeout=12 -o ConnectionAttempts=1 \
  "$REMOTE" "mkdir -p '$REMOTE_DIR'"

"$MUTAGEN_BIN" daemon start >/dev/null

sessions_output="$($MUTAGEN_BIN sync list --template '{{range .}}{{.Name}}|{{.Alpha.Protocol}}|{{.Alpha.Host}}|{{.Alpha.Path}}|{{.Beta.Protocol}}|{{.Beta.Host}}|{{.Beta.Path}}{{"\n"}}{{end}}')"
while IFS='|' read -r name alpha_protocol alpha_host alpha_path beta_protocol beta_host beta_path; do
  [[ -n "$name" ]] || continue
  if [[ "$name" == "$SESSION_NAME" ]] || \
     [[ "$alpha_protocol" == "Local" && "$alpha_path" == "$PUBLIC_ROOT" && "$beta_protocol" == "SSH" && "$beta_host" == "$REMOTE" && "$beta_path" == "$REMOTE_DIR" ]] || \
     [[ "$beta_protocol" == "Local" && "$beta_path" == "$PUBLIC_ROOT" && "$alpha_protocol" == "SSH" && "$alpha_host" == "$REMOTE" && "$alpha_path" == "$REMOTE_DIR" ]]; then
    log "terminating existing session: $name"
    "$MUTAGEN_BIN" sync terminate "$name"
  fi
done <<< "$sessions_output"

create_args=(
  --no-global-configuration
  --name "$SESSION_NAME"
  --label project=haminnweb
  --label role=public-sync
  --label target=airen
  --mode one-way-replica
  --ignore-vcs
  --compression zstandard
  --default-file-mode-beta 0644
  --default-directory-mode-beta 0755
)
for ignore_pattern in "${SYNC_IGNORES[@]}"; do
  create_args+=(--ignore "$ignore_pattern")
done

log "creating local-to-server session: $SESSION_NAME"
"$MUTAGEN_BIN" sync create \
  "${create_args[@]}" \
  "$PUBLIC_ROOT" \
  "$REMOTE:$REMOTE_DIR"

"$MUTAGEN_BIN" sync list "$SESSION_NAME" --long
