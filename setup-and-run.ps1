# ForgeIQ Platform — Setup & Run (PowerShell)
# Usage:
#   .\setup-and-run.ps1            # quick start (skip install if venv/node_modules exist)
#   .\setup-and-run.ps1 -Install   # force full install
#
# Equivalent to run.exe / run_first_time.exe but works on any PowerShell — no compiled binary needed.

param([switch]$Install)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

function Write-Section($t) {
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "  $t" -ForegroundColor Cyan -BackgroundColor Black
    Write-Host "================================================================" -ForegroundColor Cyan
}

function Check-Cmd($cmd, $name, $hint) {
    Write-Host "Checking $name... " -NoNewline
    $exists = $null -ne (Get-Command $cmd -ErrorAction SilentlyContinue)
    if ($exists) { Write-Host "OK" -ForegroundColor Green; return $true }
    Write-Host "NOT FOUND" -ForegroundColor Red
    Write-Host "  -> $hint" -ForegroundColor Yellow
    return $false
}

Write-Section "ForgeIQ Platform"

$pyOk   = Check-Cmd "python" "Python"  "Install Python 3.9+ from https://python.org (tick Add to PATH)"
$nodeOk = Check-Cmd "node"   "Node.js" "Install Node.js 18+ LTS from https://nodejs.org"
$npmOk  = Check-Cmd "npm"    "npm"     "npm ships with Node.js; reinstall Node if missing"

if (-not ($pyOk -and $nodeOk -and $npmOk)) {
    Write-Host "`nCannot continue. Install missing tool(s) and re-run." -ForegroundColor Red
    Read-Host "Press ENTER to exit"
    exit 1
}

function Setup-Backend($folder, $port) {
    Write-Section "$folder (port $port)"
    Push-Location $folder
    try {
        $needsInstall = $Install -or -not (Test-Path "venv")
        if ($needsInstall) {
            Write-Host "Creating virtual environment..."
            python -m venv venv
            Write-Host "Installing requirements (this can take several minutes)..."
            & "venv\Scripts\python.exe" -m pip install --upgrade pip
            & "venv\Scripts\pip.exe" install -r requirements.txt
        } else {
            Write-Host "venv exists, skipping install." -ForegroundColor DarkGray
        }
        Write-Host "Launching $folder on port $port..." -ForegroundColor Green
        $title = "BACKEND $folder (port $port)"
        Start-Process cmd.exe -ArgumentList "/k", "title $title && venv\Scripts\waitress-serve --listen=0.0.0.0:$port --threads=2 main:app"
    } finally { Pop-Location }
}

function Setup-Frontend($folder) {
    Write-Section "$folder"
    Push-Location $folder
    try {
        if (-not (Test-Path ".env.local")) {
            if (Test-Path ".env.example") {
                Write-Host "Copying .env.example to .env.local" -ForegroundColor Yellow
                Copy-Item ".env.example" ".env.local"
                Write-Host "  -> Edit frontend\.env.local and set real DB_URI and SESSION_PASSWORD." -ForegroundColor Yellow
            }
        }
        $needsInstall = $Install -or -not (Test-Path "node_modules") -or -not (Test-Path ".next")
        if ($needsInstall) {
            $pnpmExists = $null -ne (Get-Command pnpm -ErrorAction SilentlyContinue)
            if (-not $pnpmExists) {
                Write-Host "Installing pnpm globally..."
                npm install -g pnpm
            }
            pnpm config set dangerouslyAllowAllBuilds true
            Write-Host "Installing dependencies..."
            pnpm install
            Write-Host "Building frontend..."
            pnpm run build
        } else {
            Write-Host "node_modules and .next exist, skipping install/build." -ForegroundColor DarkGray
        }
        Write-Host "Launching frontend on port 3000..." -ForegroundColor Green
        Start-Process cmd.exe -ArgumentList "/k", "title FRONTEND (port 3000) && pnpm start"
    } finally { Pop-Location }
}

Setup-Backend "backend1" 5000
Setup-Backend "backend2" 5001
Setup-Frontend "frontend"

Write-Section "All services launched"
Write-Host "Open: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Three separate windows opened — closing them stops each service."
Write-Host ""
Write-Host "This setup script can be closed now."
