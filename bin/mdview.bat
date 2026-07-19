@echo off
rem Markdown Viewer CLI wrapper for Windows
rem Usage: mdview.bat [file]

setlocal

set SCRIPT_DIR=%~dp0
set EXE_PATH=%SCRIPT_DIR%..\release\win-unpacked\MarkdownViewer.exe

if exist "%EXE_PATH%" (
    start "" "%EXE_PATH%" %*
) else (
    echo [ERROR] MarkdownViewer.exe not found.
    echo The app may not be installed correctly. Try reinstalling:
    echo   npm install -g mdview-app
    exit /b 1
)
