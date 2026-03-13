#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${REPO_ROOT}"
echo "Starting Hugo server..."
echo "Home: http://localhost:1313/"
echo "Publisher: http://localhost:1313/publisher/"

hugo server -D
