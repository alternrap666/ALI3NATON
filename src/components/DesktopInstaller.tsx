import React, { useState } from "react";
import { 
  Laptop, Check, Copy, Cpu, Layers, Terminal, Download, 
  ExternalLink, FileCode, CheckCircle, AlertCircle, Play
} from "lucide-react";

export default function DesktopInstaller() {
  const [activeSubTab, setActiveSubTab] = useState<"win" | "mac" | "code">("win");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const batCode = `@echo off
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
echo.
echo Step 2/3: Bundling and compiling SPA + Server binaries...
call npm run build
echo.
echo Step 3/3: Bundling into Native Windows Executable Installer (.EXE)...
call npx electron-builder --win
echo.
echo ====================================================================
echo                     PACKAGING COMPLETED SUCCESSFULLY!
echo ====================================================================
echo.
echo Your native install setup has been generated inside:
echo DIRECTORY: .\\dist-desktop\\
echo FILE:      ALI3NATION-Bypass Setup 0.0.0.exe
pause`;

  const shCode = `#!/usr/bin/env bash
# ALI3NATION Desktop App Packager for macOS & Linux
clear
echo "Checking for Node.js..."
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Install it via https://nodejs.org/ and retry."
    exit 1
fi
echo "Installing dependencies..."
npm install
echo "Compiling client & server bundles..."
npm run build
echo "Packaging native client installers..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    npx electron-builder --mac
else
    npx electron-builder --linux
fi
echo "All complete! Inspect ./dist-desktop/"`;

  const electronMainCode = `const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow = null;
const PORT = process.env.PORT || 3000;

function createWindow() {
  // Gracefully initiate local server thread
  const serverPath = path.join(__dirname, "dist", "server.cjs");
  if (fs.existsSync(serverPath)) {
    require(serverPath);
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 880,
    title: "ALI3NATION BYPASS CORE",
    icon: path.join(__dirname, "icon.png"),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  mainWindow.loadURL(\`http://localhost:\${PORT}\`);
  mainWindow.on("closed", () => { mainWindow = null; });
}`;

  return (
    <div className="bg-white dark:bg-[#0d0d0f] border border-gray-150 dark:border-zinc-800/60 rounded-2xl p-5 shadow-sm flex flex-col h-full overflow-y-auto" id="ali3n-desktop-builder">
      {/* Upper Status Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-zinc-800/60">
        <div>
          <h2 className="text-md font-bold font-display text-gray-900 dark:text-zinc-100 flex items-center gap-2">
            <Laptop className="w-5 h-5 text-indigo-500" />
            Автономный ПК-Клиент & Установщик APP
          </h2>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
            Конвертация веб-версии в полноценное приложение для Windows, macOS и Linux (.EXE / .DMG)
          </p>
        </div>
        <div className="flex gap-2">
          <span className="text-[10px] bg-indigo-550/10 text-indigo-400 border border-indigo-500/15 py-1 px-3 rounded-full font-mono font-bold animate-pulse">
            PLATFORM: ELECTRON-READY
          </span>
        </div>
      </div>

      {/* Visual Window Mockup Preview */}
      <div className="my-4 relative bg-slate-900 rounded-xl border border-gray-200/40 dark:border-zinc-800/80 shadow-md overflow-hidden shrink-0">
        <div className="h-7 bg-[#1c1c1e] px-4 flex items-center justify-between border-b border-gray-900/40">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] text-zinc-500 font-semibold ml-2 select-none tracking-wide">ALI3NATION Bypass Core [Desktop Client Screen]</span>
          </div>
          <div className="flex gap-4 text-zinc-650 text-[11px] font-mono select-none">
            <span>_</span>
            <span>❑</span>
            <span className="hover:text-rose-500 cursor-pointer">✕</span>
          </div>
        </div>
        <div className="p-4 bg-zinc-950 flex items-center gap-4 relative">
          <div className="flex-1 opacity-80 pointer-events-none select-none">
            <div className="text-[10px] font-mono text-emerald-400">&gt;&gt; [OK] Local server active on: http://localhost:3000</div>
            <div className="text-[10px] font-mono text-indigo-400 mt-1">&gt;&gt; VLESS + XTLS REALITY TUNNEL BOUND NATIVELY ... ACTIVE</div>
          </div>
          <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-lg p-2 flex items-center gap-2 text-indigo-300 text-xs shrink-0">
            <Cpu className="w-4 h-4 text-indigo-500 animate-spin-slow" />
            <span className="font-semibold text-[11px]">Байпас на ПК запущен без браузера</span>
          </div>
        </div>
      </div>

      {/* Navigation Inside Desktop Panel */}
      <div className="flex border-b border-gray-100 dark:border-zinc-850 mb-4 select-none">
        <button
          onClick={() => setActiveSubTab("win")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeSubTab === "win"
              ? "border-indigo-500 text-indigo-400 font-bold"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          Windows Инсталлятор (.EXE)
        </button>
        <button
          onClick={() => setActiveSubTab("mac")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeSubTab === "mac"
              ? "border-indigo-500 text-indigo-400 font-bold"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          macOS / Linux Сборка
        </button>
        <button
          onClick={() => setActiveSubTab("code")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeSubTab === "code"
              ? "border-indigo-500 text-indigo-400 font-bold"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          Файлы Конфигурации Node
        </button>
      </div>

      {/* Responsive Content Workspace viewports */}
      <div className="grow overflow-y-auto pr-1">
        
        {/* subtab : WINDOWS INSTALLER */}
        {activeSubTab === "win" && (
          <div className="space-y-4">
            <div className="bg-zinc-900/30 border border-zinc-800/40 p-4 rounded-xl space-y-3">
              <h3 className="text-xs uppercase font-extrabold text-indigo-400 tracking-wider">
                Автоматическая сборка для Windows (Простой способ):
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-450 dark:text-zinc-400">
                <div className="flex flex-col gap-1.5 p-3 bg-zinc-950/40 border border-zinc-900 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-indigo-600/10 text-indigo-400 font-bold flex items-center justify-center text-xs">1</div>
                  <span className="font-semibold text-gray-300">Скачайте исходный код</span>
                  <span className="text-[11px] text-zinc-550 leading-relaxed">В меню настроек откройте вкладку <strong>GitHub</strong>, выгрузите проект в репозиторий, зайдите на GitHub и скачайте его как ZIP (Code -{'>'} Download ZIP). Распакуйте папку.</span>
                </div>
                <div className="flex flex-col gap-1.5 p-3 bg-zinc-950/40 border border-zinc-900 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-indigo-600/10 text-indigo-400 font-bold flex items-center justify-center text-xs">2</div>
                  <span className="font-semibold text-gray-300">Node.js среда</span>
                  <span className="text-[11px] text-zinc-550 leading-relaxed">Убедитесь, что на компьютере установлен Node.js с официального сайта <a href="https://nodejs.org" target="_blank" rel="noreferrer" className="text-indigo-400 underline">nodejs.org</a>.</span>
                </div>
                <div className="flex flex-col gap-1.5 p-3 bg-zinc-950/40 border border-zinc-900 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-indigo-600/10 text-indigo-400 font-bold flex items-center justify-center text-xs">3</div>
                  <span className="font-semibold text-gray-300">Запуск скрипта</span>
                  <span className="text-[11px] text-zinc-550 leading-relaxed">Дважды кликните по файлу <strong className="text-indigo-400">build-installer.bat</strong> (он уже лежит в корневом каталоге архива!).</span>
                </div>
              </div>

              <div className="bg-[#0a0a0b] p-3 rounded-lg border border-zinc-900 border-l-2 border-l-indigo-500 font-mono text-[11px] text-zinc-400 mt-2 leading-relaxed">
                Скрипт автоматически запустит компиляцию, скачает требуемый Chromium-эндпоинт и создаст в папке <strong className="text-white">dist-desktop/</strong> готовый установочный файл <strong className="text-indigo-400 font-bold">ALI3NATION-Bypass Setup 0.0.0.exe</strong>. Кликните по нему — приложение будет установлено со всеми ярлыками быстрого запуска!
              </div>
            </div>

            {/* Code Block bat view */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-zinc-400 px-1 font-mono uppercase tracking-wider">
                <span>Содержимое скрипта build-installer.bat:</span>
                <button
                  onClick={() => handleCopy(batCode, "bat")}
                  className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer"
                >
                  {copiedText === "bat" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === "bat" ? "Скопировано!" : "Копировать код"}</span>
                </button>
              </div>
              <pre className="p-3 bg-[#0a0a0b] border border-zinc-900 rounded-xl font-mono text-[10px] text-emerald-500/90 overflow-x-auto max-h-56">
                {batCode}
              </pre>
            </div>
          </div>
        )}

        {/* subtab : MAC & LINUX */}
        {activeSubTab === "mac" && (
          <div className="space-y-4">
            <div className="bg-zinc-900/30 border border-zinc-800/40 p-4 rounded-xl space-y-3">
              <h3 className="text-xs uppercase font-extrabold text-purple-400 tracking-wider">
                Инструкция по упаковке для macOS и Linux:
              </h3>
              
              <div className="space-y-1.5 text-xs text-zinc-300">
                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded bg-purple-500/15 text-purple-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>Распакуйте ZIP-архив проекта на вашем macOS/Linux-устройстве.</span>
                </div>
                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded bg-purple-500/15 text-purple-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>Откройте окно встроенного Терминала в корневой папке приложения.</span>
                </div>
                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded bg-purple-500/15 text-purple-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span>Введите следующие стандартные команды в терминал:</span>
                </div>
              </div>

              <div className="bg-[#0a0a0b] p-3 rounded-lg border border-zinc-900 text-xs font-mono text-zinc-300 space-y-1">
                <div className="text-purple-400"># Сделать скрипт испольняемым</div>
                <div className="text-white">chmod +x build-installer.sh</div>
                <div className="text-purple-400 mt-2"># Запустить сборку приложения</div>
                <div className="text-white">./build-installer.sh</div>
              </div>

              <div className="bg-[#0a0a0b] p-3 rounded-lg border border-zinc-900 border-l-2 border-l-purple-500 font-mono text-[11px] text-zinc-400 leading-relaxed">
                На macOS утилита выполнит компиляцию и создаст чистый образ <strong className="text-purple-400 font-bold">ALI3NATION-Bypass-0.0.0.dmg</strong>. Перетащите его в папку программы (Applications) и пользуйтесь! На Linux система сгенерирует переносимый пакет <strong className="text-purple-400 font-bold">ALI3NATION-Bypass-0.0.0.AppImage</strong>.
              </div>
            </div>

            {/* Code Block sh view */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-zinc-400 px-1 font-mono uppercase tracking-wider">
                <span>Содержимое скрипта build-installer.sh:</span>
                <button
                  onClick={() => handleCopy(shCode, "sh")}
                  className="flex items-center gap-1.5 text-purple-400 hover:text-purple-300 font-bold transition-colors cursor-pointer"
                >
                  {copiedText === "sh" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === "sh" ? "Скопировано!" : "Копировать код"}</span>
                </button>
              </div>
              <pre className="p-3 bg-[#0a0a0b] border border-zinc-900 rounded-xl font-mono text-[10px] text-purple-500/90 overflow-x-auto max-h-56">
                {shCode}
              </pre>
            </div>
          </div>
        )}

        {/* subtab : CONFIG FILES DETAILS */}
        {activeSubTab === "code" && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400 dark:text-zinc-500 leading-relaxed">
              Для ручной конфигурации мы настроили и создали в корневом проекте специальный запускающий скрипт Electron API. Ниже приведена его конфигурация, которая автоматически включает локальный Express сервер и открывает его в изолированном Chromium фрейме.
            </p>

            {/* Code Block main.cjs */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-zinc-400 px-1 font-mono uppercase tracking-wider">
                <span>Ядро Electron (electron-main.cjs):</span>
                <button
                  onClick={() => handleCopy(electronMainCode, "main")}
                  className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer"
                >
                  {copiedText === "main" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === "main" ? "Скопировано!" : "Копировать код"}</span>
                </button>
              </div>
              <pre className="p-3 bg-[#0a0a0b] border border-zinc-900 rounded-xl font-mono text-[10px] text-zinc-400 overflow-x-auto max-h-60 leading-relaxed">
                {electronMainCode}
              </pre>
            </div>

            <div className="border border-amber-500/15 bg-amber-500/5 p-3.5 rounded-xl text-xs text-amber-500/80 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <strong className="font-semibold block mb-0.5">Внимание к фоновому процессу:</strong>
                Поскольку обход VLESS Reality использует парсинг и сборку конфигураций, при закрытии приложения Electron автоматически деактивирует занятые Node-процессы на портах вашего ПК, защищая порты от утечек.
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Checklist footer */}
      <div className="border-t border-gray-100 dark:border-zinc-800/60 pt-4 mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3 bg-zinc-950/20 p-3 rounded-xl">
        <div className="flex items-center gap-2 text-xs">
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-gray-350 dark:text-zinc-400">Node-Скрипты готовы</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-gray-350 dark:text-zinc-400">Electron добавлен</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-gray-350 dark:text-zinc-400">Авто-Билдер `.bat`</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-gray-350 dark:text-zinc-400">Сборка в `.sh`</span>
        </div>
      </div>
    </div>
  );
}
