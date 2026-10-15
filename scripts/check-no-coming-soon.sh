#!/usr/bin/env bash
# path: scripts/check-no-coming-soon.sh
# Wrapper kept for the mandated script path in MASTER_PROMPT.md.
# The implementation lives in scripts/checks/no-coming-soon.mjs so every check
# shares one reporting format and one exit-code contract.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec node "${SCRIPT_DIR}/checks/no-coming-soon.mjs" "$@"
