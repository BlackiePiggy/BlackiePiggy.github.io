#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

"${SCRIPT_DIR}/start-hugo.sh"
"${SCRIPT_DIR}/start-publisher-api.sh"
