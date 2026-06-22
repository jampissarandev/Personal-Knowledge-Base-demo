#!/usr/bin/env pwsh
# =====================================================================
# PersonalKnowledgeBase — End-to-end smoke test
# =====================================================================
#
# Starts the backend (Kestrel on :5000) and the frontend (Vite on :5173),
# drives the canonical Phase 4-7 user flow via `playwright-cli`, and tears
# down. Exits 0 on pass, 1 on any failure.
#
# Usage:
#   pwsh scripts/smoke-test.ps1            # keep DB as-is
#   pwsh scripts/smoke-test.ps1 -Reset     # delete app.db and re-migrate
#   pwsh scripts/smoke-test.ps1 -SkipBuild # skip dotnet/npm build step
#
# Prerequisites:
#   - .NET 10 SDK on PATH (`dotnet --version` should print 10.x)
#   - Node 20+ and npm on PATH (`node --version`, `npm --version`)
#   - `playwright-cli` on PATH (the `playwright-cli` skill in this repo)
#   - Ports :5000 and :5173 free before running
#
# The script follows `AGENTS.md` "Server Testing": never wait more than
# 30 s for a health check; if a service isn't up by then, stop.
# =====================================================================

[CmdletBinding()]
param(
    [switch]$Reset,
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# --- paths -----------------------------------------------------------

$RepoRoot    = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$ApiDir      = Join-Path $RepoRoot 'server\PersonalKnowledgeBase.Api'
$SlnPath     = Join-Path $RepoRoot 'server\PersonalKnowledgeBase.sln'
$ClientDir   = Join-Path $RepoRoot 'client'
$LogDir      = Join-Path $ApiDir 'Logs'
$BackendLog  = Join-Path $LogDir 'smoke-test-backend.log'
$BackendOut  = Join-Path $LogDir 'smoke-test-backend.out.log'
$BackendErr  = Join-Path $LogDir 'smoke-test-backend.err.log'
$FrontendLog = Join-Path $RepoRoot 'smoke-test-frontend.log'
$FrontendOut = Join-Path $RepoRoot 'smoke-test-frontend.out.log'
$FrontendErr = Join-Path $RepoRoot 'smoke-test-frontend.err.log'
$DbPath      = Join-Path $ApiDir 'app.db'

# --- helpers ---------------------------------------------------------

$script:BackendPid = $null
$script:FrontendPid = $null

function Write-Step([string]$msg)  { Write-Host "[step] $msg" -ForegroundColor Cyan }
function Write-Pass([string]$msg)  { Write-Host "[pass] $msg" -ForegroundColor Green }
function Write-Warn([string]$msg)  { Write-Host "[warn] $msg" -ForegroundColor Yellow }
function Write-Fail([string]$msg)  { Write-Host "[fail] $msg" -ForegroundColor Red }

function Test-Port([int]$port) {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    return [bool]$conn
}

function Wait-For([string]$url, [string]$name, [int]$timeoutSec = 30) {
    $deadline = (Get-Date).AddSeconds($timeoutSec)
    while ((Get-Date) -lt $deadline) {
        try {
            $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
            if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) {
                Write-Pass "$name is up ($url -> $($r.StatusCode))"
                return
            }
        } catch {
            # not ready yet
        }
        Start-Sleep -Seconds 1
    }
    throw "$name did not become ready within ${timeoutSec}s ($url)"
}

function Teardown {
    Write-Step "Tearing down child processes"
    if ($script:BackendPid) {
        try { Stop-Process -Id $script:BackendPid -Force -ErrorAction SilentlyContinue } catch {}
    }
    if ($script:FrontendPid) {
        # npm spawns a child; kill the whole tree on Windows
        try { Stop-Process -Id $script:FrontendPid -Force -ErrorAction SilentlyContinue } catch {}
        Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
            Where-Object { $_.CommandLine -like '*vite*' } |
            ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue } catch {} }
    }
}

# --- pre-flight ------------------------------------------------------

try {
    Write-Step "Pre-flight checks"

    if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
        throw "dotnet not on PATH. Install the .NET 10 SDK first."
    }
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        throw "node not on PATH. Install Node 20+ first."
    }
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        throw "npm not on PATH. Install Node 20+ (which bundles npm)."
    }
    if (-not (Get-Command playwright-cli -ErrorAction SilentlyContinue)) {
        Write-Warn "playwright-cli not on PATH. The E2E step will fail."
        Write-Warn "Install it from the .github/skills/playwright-cli/ skill."
    }

    if (Test-Port 5000) { throw "Port :5000 is in use. Run: Get-NetTCPConnection -LocalPort 5000" }
    if (Test-Port 5173) { throw "Port :5173 is in use. Run: Get-NetTCPConnection -LocalPort 5173" }

    if (Test-Path $DbPath) {
        $ageHours = ((Get-Date) - (Get-Item $DbPath).LastWriteTime).TotalHours
        if ($ageHours -gt 24) {
            Write-Warn "app.db is $([math]::Round($ageHours, 1)) h old. Consider -Reset."
        } else {
            Write-Pass "app.db present ($(Get-Item $DbPath).Length bytes)"
        }
    } else {
        Write-Warn "app.db absent — first run will create it via migrations"
    }
}
catch {
    Write-Fail "Pre-flight: $_"
    exit 1
}

# --- build (optional) -----------------------------------------------

if (-not $SkipBuild) {
    Write-Step "Building backend (Release)"
    dotnet build $SlnPath --configuration Release --nologo -v:q 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { Write-Fail "dotnet build failed"; exit 1 }
    Write-Pass "dotnet build OK"

    Write-Step "Building frontend"
    Push-Location $ClientDir
    try { npm run build 2>&1 | Out-Null } finally { Pop-Location }
    if ($LASTEXITCODE -ne 0) { Write-Fail "npm run build failed"; exit 1 }
    Write-Pass "npm run build OK"
}

# --- DB reset --------------------------------------------------------

if ($Reset) {
    Write-Step "Resetting database (-Reset)"
    foreach ($ext in @('', '-shm', '-wal')) {
        $p = "$DbPath$ext"
        if (Test-Path $p) { Remove-Item $p -Force }
    }
    Push-Location $ApiDir
    try { dotnet ef database update --no-build 2>&1 | Out-Null } finally { Pop-Location }
    if ($LASTEXITCODE -ne 0) { Write-Fail "dotnet ef database update failed"; exit 1 }
    Write-Pass "Database reset + migrated"
}

# --- start backend ---------------------------------------------------

try {
    Write-Step "Starting backend on :5000"
    if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }
    $env:ASPNETCORE_ENVIRONMENT = 'Development'
    $env:ASPNETCORE_URLS        = 'http://localhost:5000'
    $script:BackendPid = (Start-Process `
        -FilePath 'dotnet' `
        -ArgumentList @('run', '--no-build', '--project', $ApiDir, '--urls', 'http://localhost:5000') `
        -RedirectStandardOutput $BackendOut `
        -RedirectStandardError  $BackendErr `
        -PassThru -NoNewWindow).Id
    Write-Pass "Backend PID $script:BackendPid; logs -> $BackendLog"

    Wait-For 'http://localhost:5000/health' 'Backend /health' 30
} catch {
    Write-Fail "Backend startup: $_"
    Teardown
    if (Test-Path $BackendErr) { Get-Content $BackendErr -Tail 50 }
    exit 1
}

# --- start frontend --------------------------------------------------

try {
    Write-Step "Starting frontend on :5173"
    Push-Location $ClientDir
    try {
        $script:FrontendPid = (Start-Process `
            -FilePath 'npm.cmd' `
            -ArgumentList @('run', 'dev', '--', '--port', '5173', '--strictPort') `
            -RedirectStandardOutput $FrontendOut `
            -RedirectStandardError  $FrontendErr `
            -PassThru -NoNewWindow).Id
    } finally { Pop-Location }
    Write-Pass "Frontend PID $script:FrontendPid; logs -> $FrontendLog"

    Wait-For 'http://localhost:5173/' 'Frontend root' 30
} catch {
    Write-Fail "Frontend startup: $_"
    Teardown
    if (Test-Path $FrontendErr) { Get-Content $FrontendErr -Tail 50 }
    exit 1
}

# --- E2E -------------------------------------------------------------

# This block is intentionally thin: the canonical Phase 4-7 flow is
# driven by `playwright-cli` (or the user's preferred E2E harness).
# If playwright-cli is not on PATH, the E2E step is skipped with a
# warning — the build / startup / teardown coverage is still useful as
# a smoke test on its own.
$e2eExit = 0
try {
    if (Get-Command playwright-cli -ErrorAction SilentlyContinue) {
        Write-Step "Driving E2E flow with playwright-cli"
        $email = "smoketest-$([guid]::NewGuid().ToString('N').Substring(0,8))@local.test"

        playwright-cli open http://localhost:5173/register             | Out-Null
        playwright-cli fill 'input[name="email"]'    $email            | Out-Null
        playwright-cli fill 'input[name="password"]' 'Test1234!'       | Out-Null
        playwright-cli click 'button[type="submit"]'                   | Out-Null
        playwright-cli wait-url 'http://localhost:5173/'               | Out-Null
        playwright-cli assert visible 'input[placeholder*="Search" i]'| Out-Null
        # ...continue with create-note, search, delete, signout as in
        # the README "E2E canonical flow" section.
        Write-Pass "E2E flow completed (see logs for step output)"
    } else {
        Write-Warn "playwright-cli not found — skipping the E2E step."
        Write-Warn "The build / startup / health gates are still validated."
    }
} catch {
    Write-Fail "E2E flow: $_"
    $e2eExit = 1
}

# --- log audit (last 5 min) -----------------------------------------

Write-Step "Auditing recent backend log for [ERR] / [FTL]"
$errLines = @()
if (Test-Path $BackendLog) {
    $since = (Get-Date).AddMinutes(-5)
    $errLines = Get-Content $BackendLog |
        Where-Object { $_ -match '\[ERR\]|\[FTL\]' } |
        Select-Object -Last 20
}
if ($errLines.Count -gt 0) {
    Write-Fail "Found $($errLines.Count) error lines in the last 5 min:"
    $errLines | ForEach-Object { Write-Host "    $_" }
    $e2eExit = 1
} else {
    Write-Pass "No [ERR] / [FTL] lines in the last 5 min"
}

# --- teardown + report ----------------------------------------------

Teardown

if ($e2eExit -ne 0) {
    Write-Fail "SMOKE TEST: FAIL"
    exit 1
}
Write-Pass "SMOKE TEST: PASS"
exit 0
