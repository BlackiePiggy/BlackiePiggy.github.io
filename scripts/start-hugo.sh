#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${REPO_ROOT}"
echo "Starting Hugo server in a new Terminal window..."
echo "Home: http://localhost:1313/"
echo "Publisher: http://localhost:1313/publisher/"
echo

shell_escape() {
  printf "%q" "$1"
}

osascript_escape() {
  local value="$1"
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  printf '%s' "$value"
}

start_in_terminal() {
  local command="$1"
  local escaped_command
  escaped_command="$(osascript_escape "$command")"

  if ! command -v osascript >/dev/null 2>&1; then
    echo "osascript is unavailable; starting Hugo server in the current shell."
    eval "$command"
    return
  fi

  osascript <<EOF
tell application "Terminal"
  activate
  do script "${escaped_command}"
end tell
EOF
}

SERVER_COMMAND="cd $(shell_escape "${REPO_ROOT}") && hugo server -D; EXIT_CODE=\$?; echo; echo \"Hugo server exited with code \${EXIT_CODE}.\"; exec \$SHELL -l"
start_in_terminal "${SERVER_COMMAND}"

if command -v osascript >/dev/null 2>&1; then
  sleep 3
  open "http://localhost:1313/"
fi
