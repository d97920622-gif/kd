#!/usr/bin/env bash
# path: scripts/check-english-only.sh
# Wrapper kept for the mandated script path in MASTER_PROMPT.md.
# The implementation lives in scripts/checks/english-only.mjs so every check
# shares one reporting format and one exit-code contract.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec node "${SCRIPT_DIR}/checks/english-only.mjs" "$@"
