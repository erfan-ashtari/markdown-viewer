<#
.SYNOPSIS
    Installs Markdown Viewer globally via npm.

.DESCRIPTION
    Downloads and installs the latest version of Markdown Viewer
    to your system. Requires Node.js and npm to be installed.

.EXAMPLE
    .\install.ps1
    .\install.ps1 -Version "0.0.2"
#>

param(
    [string]$Version = "latest"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "  Markdown Viewer Installer" -ForegroundColor Cyan
Write-Host "  =========================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is not installed." -ForegroundColor Red
    Write-Host "  Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Host "[OK] npm $npmVersion detected" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] npm is not installed." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Installing Markdown Viewer..." -ForegroundColor Yellow

if ($Version -eq "latest") {
    npm install -g mdview
} else {
    npm install -g "mdview@$Version"
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] Markdown Viewer installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Cyan
    Write-Host "  mdview README.md          # Open a file" -ForegroundColor White
    Write-Host "  mdview --help             # Show help" -ForegroundColor White
    Write-Host "  mdview --version          # Show version" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "[ERROR] Installation failed." -ForegroundColor Red
    Write-Host "  Try running as Administrator, or check your network connection." -ForegroundColor Yellow
    exit 1
}
