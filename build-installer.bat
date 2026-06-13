@echo off
title ALI3NATION Desktop Installer Builder
color 0b
cls
echo ====================================================================
echo             ALI3NATION SECURE BYPASS - DESKTOP AUTOMATIC PACKAGER
echo ====================================================================
echo.
echo Checking system prerequisites...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    color 0c
    echo [ERROR] Node.js is not installed on this PC!
    echo Please download and install Node.js from: https://nodejs.org/
    echo.
    echo Once Node.js is installed, double-click this file again!
    echo ====================================================================
    pause
    exit
)

echo [OK] Node.js is active.
echo.
echo Step 1/3: Installing full package dependencies...
call npm install
if %errorlevel% neq 0 (
    color 0c
    echo [ERROR] NPM dependecy download failed. Check internet link.
    pause
    exit
)

echo.
echo Step 2/3: Bundling and compiling SPA + Server binaries...
call npm run build
if %errorlevel% neq 0 (
    color 0c
    echo [ERROR] React / Vite build compilation failed.
    pause
    exit
)

echo.
echo Step 3/3: Bundling into Native Windows Executable Installer (.EXE)...
call npx electron-builder --win
if %errorlevel% neq 0 (
    color 0c
    echo [ERROR] Electron compilation failed. Check file requirements or permissions.
    pause
    exit
)

echo.
echo ====================================================================
echo                     PACKAGING COMPLETED SUCCESSFULLY!
echo ====================================================================
echo.
echo Your native install setup has been generated inside:
echo DIRECTORY: %~dp0dist-desktop\
echo FILE:      ALI3NATION-Bypass Setup 0.0.0.exe
echo.
echo Double-click that setup file to install of ALI3NATION as a true,
echo independent PC application bypassing your web browser completely!
echo ====================================================================
color 0a
pause
