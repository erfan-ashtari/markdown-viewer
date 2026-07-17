@echo off
rem Markdown Viewer CLI wrapper for Windows
rem Usage: mdview.bat [file]

setlocal

set SCRIPT_DIR=%~dp0
set ELECTRON_PATH=%SCRIPT_DIR%..\node_modules\.bin\electron.cmd

if exist "%ELECTRON_PATH%" (
    "%ELECTRON_PATH%" "%SCRIPT_DIR%..\electron" %*
) else (
    echo [ERROR] Electron not found. Run 'npm install' first.
    exit /b 1
)
