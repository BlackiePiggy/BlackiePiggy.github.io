#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

export LOCAL_PUBLISH_PASSWORD="${LOCAL_PUBLISH_PASSWORD:-123456}"
export LOCAL_PUBLISH_CORS_ORIGIN="${LOCAL_PUBLISH_CORS_ORIGIN:-http://localhost:1313}"
export LOCAL_PUBLISH_PORT="${LOCAL_PUBLISH_PORT:-8790}"

cd "${REPO_ROOT}"
echo "Starting Local Publisher API..."
echo "LOCAL_PUBLISH_PASSWORD=******"
echo "LOCAL_PUBLISH_CORS_ORIGIN=${LOCAL_PUBLISH_CORS_ORIGIN}"
echo "LOCAL_PUBLISH_PORT=${LOCAL_PUBLISH_PORT}"
echo "API URL: http://127.0.0.1:${LOCAL_PUBLISH_PORT}/publish"
echo "Publisher Page: http://localhost:1313/publisher/"
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
    echo "osascript is unavailable; starting Local Publisher API in the current shell."
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

SERVER_COMMAND="cd $(shell_escape "${REPO_ROOT}") && export LOCAL_PUBLISH_PASSWORD=$(shell_escape "${LOCAL_PUBLISH_PASSWORD}") && export LOCAL_PUBLISH_CORS_ORIGIN=$(shell_escape "${LOCAL_PUBLISH_CORS_ORIGIN}") && export LOCAL_PUBLISH_PORT=$(shell_escape "${LOCAL_PUBLISH_PORT}") && npm run publisher:local-api; EXIT_CODE=\$?; echo; echo \"Local Publisher API exited with code \${EXIT_CODE}.\"; exec \$SHELL -l"
start_in_terminal "${SERVER_COMMAND}"

if command -v osascript >/dev/null 2>&1; then
  sleep 2
  open "http://localhost:1313/publisher/"
fi
