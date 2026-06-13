#!/usr/bin/env bash

# ALI3NATION Desktop App Packager for macOS & Linux
clear
echo "===================================================================="
echo "            ALI3NATION SECURE BYPASS - DESKTOP APPS PACKAGER (UNIX)"
echo "===================================================================="
echo ""

# Checking for Node.js
if ! command -v node &> /dev/null; then
    echo -e "\033[0;31m[ERROR] Node.js is not installed on this system!\033[0m"
    echo "Please download and install Node.js from https://nodejs.org/"
    echo "Once complete, run this script file again in your terminal."
    echo "===================================================================="
    exit 1
fi

echo -e "\033[0;32m[OK] Node.js is installed.\033[0m"
echo ""

echo "Step 1/3: Installing full project dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo -e "\033[0;31m[ERROR] NPM dependency download failed.\033[0m"
    exit 1
fi

echo ""
echo "Step 2/3: Bundling and compiling SPA + Server binaries..."
npm run build
if [ $? -ne 0 ]; then
    echo -e "\033[0;31m[ERROR] Build assets generation failed.\033[0m"
    exit 1
fi

echo ""
echo "Step 3/3: Bundling into Native App packages (.DMG / .AppImage)..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Compiling for macOS..."
    npx electron-builder --mac
else
    echo "Compiling for Linux..."
    npx electron-builder --linux
fi

if [ $? -ne 0 ]; then
    echo -e "\033[0;31m[ERROR] Electron packaging failed.\033[0m"
    exit 1
fi

echo ""
echo "===================================================================="
echo "                     PACKAGING COMPLETED SUCCESSFULLY!"
echo "===================================================================="
echo ""
echo "Your offline desktop client packaging is complete! You can find it under:"
echo "DIRECTORY: ./dist-desktop/"
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "FILE:      ./dist-desktop/ALI3NATION-Bypass-0.0.0.dmg"
else
    echo "FILE:      ./dist-desktop/ALI3NATION-Bypass-0.0.0.AppImage"
fi
echo ""
echo "Run/Install the package file to access ALI3NATION natively on your screen!"
echo "===================================================================="
exit 0
