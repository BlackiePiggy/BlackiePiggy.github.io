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
echo "API Base: http://127.0.0.1:${LOCAL_PUBLISH_PORT}"

npm run publisher:local-api
