#!/usr/bin/env bash
# =====================================================================
# PersonalKnowledgeBase — End-to-end smoke test (bash)
# =====================================================================
#
# 1:1 translation of `smoke-test.ps1`. The PowerShell script is the
# canonical version (the dev environment is Windows); this file exists
# for Linux / macOS / WSL users.
#
# Usage:
#   bash scripts/smoke-test.sh           # keep DB as-is
#   bash scripts/smoke-test.sh --reset   # delete app.db and re-migrate
#   bash scripts/smoke-test.sh --skip-build
#
# See smoke-test.ps1 header for full documentation.
# =====================================================================

set -euo pipefail

# --- args ------------------------------------------------------------

RESET=0
SKIP_BUILD=0
for a in "$@"; do
    case "$a" in
        --reset)      RESET=1 ;;
        --skip-build) SKIP_BUILD=1 ;;
        *) echo "Unknown arg: $a" >&2; exit 1 ;;
    esac
done

# --- paths -----------------------------------------------------------

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_DIR="$REPO_ROOT/server/PersonalKnowledgeBase.Api"
SLN_PATH="$REPO_ROOT/server/PersonalKnowledgeBase.sln"
CLIENT_DIR="$REPO_ROOT/client"
LOG_DIR="$API_DIR/Logs"
BACKEND_LOG="$LOG_DIR/smoke-test-backend.log"
FRONTEND_LOG="$REPO_ROOT/smoke-test-frontend.log"
DB_PATH="$API_DIR/app.db"

BACKEND_PID=""
FRONTEND_PID=""

# --- helpers ---------------------------------------------------------

step()  { printf '\033[36m[step]\033[0m %s\n' "$*"; }
pass()  { printf '\033[32m[pass]\033[0m %s\n' "$*"; }
warn()  { printf '\033[33m[warn]\033[0m %s\n' "$*"; }
fail()  { printf '\033[31m[fail]\033[0m %s\n' "$*"; }

port_in_use() {
    local port=$1
    (echo >/dev/tcp/127.0.0.1/"$port") >/dev/null 2>&1
}

wait_for() {
    local url=$1 name=$2 timeout=${3:-30}
    local deadline=$(( $(date +%s) + timeout ))
    while [ "$(date +%s)" -lt "$deadline" ]; do
        if curl -fsS -o /dev/null -m 2 "$url"; then
            pass "$name is up ($url)"
            return 0
        fi
        sleep 1
    done
    fail "$name did not become ready within ${timeout}s ($url)"
    return 1
}

teardown() {
    step "Tearing down child processes"
    [ -n "$BACKEND_PID"  ] && kill -9 "$BACKEND_PID"  2>/dev/null || true
    [ -n "$FRONTEND_PID" ] && kill -9 "$FRONTEND_PID" 2>/dev/null || true
    # also reap any orphan vite / dotnet children
    pkill -9 -f 'vite'          2>/dev/null || true
    pkill -9 -f 'PersonalKnowledgeBase.Api' 2>/dev/null || true
}
trap teardown EXIT

# --- pre-flight ------------------------------------------------------

step "Pre-flight checks"

for tool in dotnet node npm; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        fail "$tool not on PATH"; exit 1
    fi
done

if port_in_use 5000; then fail "Port :5000 is in use"; exit 1; fi
if port_in_use 5173; then fail "Port :5173 is in use"; exit 1; fi

if [ -f "$DB_PATH" ]; then
    pass "app.db present ($(stat -c %s "$DB_PATH" 2>/dev/null || stat -f %z "$DB_PATH") bytes)"
else
    warn "app.db absent — first run will create it via migrations"
fi

# --- build (optional) -----------------------------------------------

if [ "$SKIP_BUILD" -eq 0 ]; then
    step "Building backend (Release)"
    dotnet build "$SLN_PATH" --configuration Release --nologo -v:q >/dev/null
    pass "dotnet build OK"

    step "Building frontend"
    ( cd "$CLIENT_DIR" && npm run build >/dev/null )
    pass "npm run build OK"
fi

# --- DB reset --------------------------------------------------------

if [ "$RESET" -eq 1 ]; then
    step "Resetting database (--reset)"
    rm -f "$DB_PATH" "$DB_PATH-shm" "$DB_PATH-wal"
    ( cd "$API_DIR" && dotnet ef database update --no-build >/dev/null )
    pass "Database reset + migrated"
fi

# --- start backend ---------------------------------------------------

step "Starting backend on :5000"
mkdir -p "$LOG_DIR"
export ASPNETCORE_ENVIRONMENT=Development
export ASPNETCORE_URLS=http://localhost:5000

( cd "$API_DIR" && \
    dotnet run --no-build --urls http://localhost:5000 ) \
    > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
pass "Backend PID $BACKEND_PID; logs -> $BACKEND_LOG"

wait_for 'http://localhost:5000/health' 'Backend /health' 30

# --- start frontend --------------------------------------------------

step "Starting frontend on :5173"
( cd "$CLIENT_DIR" && \
    npm run dev -- --port 5173 --strictPort ) \
    > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
pass "Frontend PID $FRONTEND_PID; logs -> $FRONTEND_LOG"

wait_for 'http://localhost:5173/' 'Frontend root' 30

# --- E2E (optional) --------------------------------------------------

E2E_EXIT=0
if command -v playwright-cli >/dev/null 2>&1; then
    step "Driving E2E flow with playwright-cli"
    EMAIL="smoketest-$(head -c8 /dev/urandom | xxd -p)@local.test"

    playwright-cli open http://localhost:5173/register     >/dev/null
    playwright-cli fill 'input[name="email"]'    "$EMAIL"  >/dev/null
    playwright-cli fill 'input[name="password"]' 'Test1234!' >/dev/null
    playwright-cli click 'button[type="submit"]'           >/dev/null
    playwright-cli wait-url 'http://localhost:5173/'       >/dev/null
    pass "E2E flow completed (see logs for step output)"
else
    warn "playwright-cli not found — skipping the E2E step."
fi

# --- log audit -------------------------------------------------------

step "Auditing recent backend log for [ERR] / [FTL]"
if [ -f "$BACKEND_LOG" ]; then
    ERR_LINES=$(grep -E '\[ERR\]|\[FTL\]' "$BACKEND_LOG" || true)
    if [ -n "$ERR_LINES" ]; then
        fail "Found error lines in backend log:"
        echo "$ERR_LINES"
        E2E_EXIT=1
    else
        pass "No [ERR] / [FTL] lines in backend log"
    fi
fi

# --- report ----------------------------------------------------------

if [ "$E2E_EXIT" -ne 0 ]; then
    fail "SMOKE TEST: FAIL"
    exit 1
fi
pass "SMOKE TEST: PASS"
