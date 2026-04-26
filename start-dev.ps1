# PulseIQ — Dev Startup Script
# Run from the project root: .\start-dev.ps1

$ROOT = $PSScriptRoot
$NODE_PATH = "C:\Program Files\nodejs;C:\Users\HP\AppData\Roaming\npm"

Write-Host ""
Write-Host "=== PulseIQ Dev Environment ===" -ForegroundColor Cyan

# ── Check PostgreSQL ───────────────────────────────────────────────────────────
$pg = Get-Service -Name postgresql* -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq "Running" }
if ($pg) {
    Write-Host "[OK] PostgreSQL is running" -ForegroundColor Green
} else {
    Write-Host "[WARN] PostgreSQL service not detected — start it from Services if DB errors occur" -ForegroundColor Yellow
}

# ── Check Memurai (Redis) ──────────────────────────────────────────────────────
$mem = Get-Service -Name Memurai -ErrorAction SilentlyContinue
if ($mem -and $mem.Status -eq "Running") {
    Write-Host "[OK] Memurai (Redis) is running" -ForegroundColor Green
} else {
    Write-Host "[WARN] Memurai not running — cache features degraded (app still works)" -ForegroundColor Yellow
}

# ── Pick backend port ──────────────────────────────────────────────────────────
$backendPort = 8000
$occupied = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($occupied) {
    $backendPort = 8001
    Write-Host "[INFO] Port 8000 occupied (zombie socket) — using port 8001 instead" -ForegroundColor Yellow
    Write-Host "       Tip: reboot once to permanently free port 8000" -ForegroundColor DarkGray
}

# Update .env.local files to match the chosen port
$apiUrl = "NEXT_PUBLIC_API_URL=http://localhost:$backendPort/api/v1"
Set-Content "$ROOT\admin\.env.local" $apiUrl
Set-Content "$ROOT\frontend\.env.local" $apiUrl
Set-Content "$ROOT\mobile-web\.env.local" $apiUrl
Write-Host "[OK] .env.local files set to port $backendPort" -ForegroundColor Green

# ── Start Backend ──────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Starting Backend (port $backendPort)..." -ForegroundColor Cyan
Start-Process "cmd.exe" -ArgumentList "/k title PulseIQ-Backend && cd /d $ROOT\backend && .venv\Scripts\uvicorn.exe main:app --host 127.0.0.1 --port $backendPort" -WindowStyle Normal

Start-Sleep -Seconds 3

# ── Start Admin Panel ──────────────────────────────────────────────────────────
Write-Host "Starting Admin Panel (port 3001)..." -ForegroundColor Cyan
Start-Process "cmd.exe" -ArgumentList "/k title PulseIQ-Admin && set PATH=$NODE_PATH;%PATH% && cd /d $ROOT\admin && pnpm dev" -WindowStyle Normal

# ── Start Frontend ─────────────────────────────────────────────────────────────
Write-Host "Starting Frontend (port 3000)..." -ForegroundColor Cyan
Start-Process "cmd.exe" -ArgumentList "/k title PulseIQ-Frontend && set PATH=$NODE_PATH;%PATH% && cd /d $ROOT\frontend && pnpm dev" -WindowStyle Normal

# ── Start Mobile Web ───────────────────────────────────────────────────────────
Write-Host "Starting Mobile Web (port 3002)..." -ForegroundColor Cyan
Start-Process "cmd.exe" -ArgumentList "/k title PulseIQ-Mobile && set PATH=$NODE_PATH;%PATH% && cd /d $ROOT\mobile-web && pnpm dev" -WindowStyle Normal

# ── Summary ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=== All servers starting in separate windows ===" -ForegroundColor Green
Write-Host ""
Write-Host "  Backend API   ->  http://localhost:$backendPort/docs" -ForegroundColor White
Write-Host "  Admin Panel   ->  http://localhost:3001" -ForegroundColor White
Write-Host "  Frontend      ->  http://localhost:3000" -ForegroundColor White
Write-Host "  Mobile Web    ->  http://localhost:3002" -ForegroundColor White
Write-Host ""
Write-Host "  Admin login   ->  admin@democorp.com / password123" -ForegroundColor DarkGray
Write-Host "  Analyst login ->  analyst@democorp.com / password123" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Wait ~10s for all servers to fully start before opening the browser." -ForegroundColor DarkGray
